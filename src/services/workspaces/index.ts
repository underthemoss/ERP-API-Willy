import { type MongoClient } from 'mongodb';
import { type EnvConfig } from '../../config';
import {
  createWorkspaceModel,
  type WorkspaceModel,
  type CreateWorkspaceInput,
  type Workspace,
} from './model';
import { ANON_USER_AUTH_PAYLOAD, UserAuthPayload } from '../../authentication';
import { ERP_GLOBAL_PLATFORM_ID, type AuthZ } from '../../lib/authz';
import {
  ERP_WORKSPACE_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_WORKSPACE_RELATIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS_MAP,
  WriteRelationOpts,
} from '../../lib/authz';
import { type UsersService } from '../users';
import { type EmailService } from '../email';

const relationToSubjectRelationMap: Record<
  ERP_WORKSPACE_RELATIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS
> = Object.keys(ERP_WORKSPACE_SUBJECT_RELATIONS_MAP).reduce(
  (acc, key) => {
    const subjectRel =
      ERP_WORKSPACE_SUBJECT_RELATIONS_MAP[
        key as ERP_WORKSPACE_SUBJECT_RELATIONS
      ];
    if (!subjectRel) {
      throw new Error(
        `Missing mapping for ERP_WORKSPACE_SUBJECT_RELATIONS_MAP key: ${key}`,
      );
    }

    acc[subjectRel.relation] = key as ERP_WORKSPACE_SUBJECT_RELATIONS;
    return acc;
  },
  {} as Record<ERP_WORKSPACE_RELATIONS, ERP_WORKSPACE_SUBJECT_RELATIONS>,
);

// exposes uses-cases
export class WorkspaceService {
  private model: WorkspaceModel;
  private authZ: AuthZ;
  private usersService: UsersService;
  private emailService: EmailService;
  private envConfig: EnvConfig;

  constructor(config: {
    model: WorkspaceModel;
    authZ: AuthZ;
    usersService: UsersService;
    emailService: EmailService;
    envConfig: EnvConfig;
  }) {
    this.model = config.model;
    this.authZ = config.authZ;
    this.usersService = config.usersService;
    this.emailService = config.emailService;
    this.envConfig = config.envConfig;
  }

  createWorkspace = async (
    input: CreateWorkspaceInput,
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    if (!input.accessType) {
      throw new Error('Access type is required');
    }

    // Business logic - ensure defaults
    const workspaceInput: CreateWorkspaceInput = {
      ...input,
      archived: input.archived ?? false,
    };

    // Create the workspace in the database
    const workspace = await this.model.createWorkspace(workspaceInput);

    // Set up SpiceDB relationships
    const spiceDbRelations: WriteRelationOpts<ERP_WORKSPACE_SUBJECT_RELATIONS>[] =
      [
        {
          relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
          resourceId: workspace.id.toString(),
          subjectId: ERP_GLOBAL_PLATFORM_ID,
        },
      ];

    // Make the creator an admin of the workspace
    spiceDbRelations.push({
      resourceId: workspace.id,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ADMIN,
    });

    // If the workspace has a domain and it's SAME_DOMAIN access type,
    // create the SpiceDB relationship between workspace and domain
    if (workspace.domain && workspace.accessType === 'SAME_DOMAIN') {
      spiceDbRelations.push({
        resourceId: workspace.id,
        subjectId: workspace.domain.replace('.', '_'),
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.DOMAIN_DOMAIN,
      });
    }

    // Execute all SpiceDB writes in bulk
    try {
      await this.authZ.workspace.writeRelations(spiceDbRelations);
    } catch (error) {
      // Log the error but don't fail the workspace creation
      // The workspace is already created in the database
      console.error('Failed to create SpiceDB relationships:', error);
    }

    return workspace;
  };

  getWorkspaceById = async (
    id: string,
    user: UserAuthPayload,
  ): Promise<Workspace | null> => {
    // Validation
    if (!id || id.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Auth - check if user has read permission on the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('You do not have permission to access this workspace');
    }

    // Business logic - fetch workspace
    return this.model.getWorkspaceById(id);
  };

  // List workspaces that user can read (member or admin)
  listWorkspaces = async (
    user: UserAuthPayload,
    page?: { size?: number | null; number?: number | null },
  ) => {
    // auth - get workspaces user can read
    const canReadWorkspaces = await this.authZ.workspace.listResources({
      permission: ERP_WORKSPACE_PERMISSIONS.READ,
      resourceType: RESOURCE_TYPES.ERP_WORKSPACE,
      subjectType: RESOURCE_TYPES.ERP_USER,
      subjectId: user.id,
    });

    // Extract workspace IDs from the authorized resources
    const authorizedWorkspaceIds = canReadWorkspaces.map(
      (resource) => resource.resourceObjectId,
    );

    // If no authorized workspaces, return empty result
    if (authorizedWorkspaceIds.length === 0) {
      return {
        items: [],
        page: {
          number: 1,
          size: 0,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    // validation
    // business logic - get authorized workspaces (exclude archived by default)
    const [items, count] = await Promise.all([
      this.model.getWorkspacesByIds(authorizedWorkspaceIds, false),
      this.model.countWorkspacesByIds(authorizedWorkspaceIds, false),
    ]);

    const pageSizeRaw = page?.size ?? items.length;
    const pageNumberRaw = page?.number ?? 1;
    const size =
      typeof pageSizeRaw === 'number' && pageSizeRaw > 0
        ? Math.floor(pageSizeRaw)
        : items.length;
    const number =
      typeof pageNumberRaw === 'number' && pageNumberRaw > 0
        ? Math.floor(pageNumberRaw)
        : 1;
    const start = (number - 1) * size;
    const pagedItems =
      size > 0 ? items.slice(start, start + size) : items.slice(0, 0);

    return {
      items: pagedItems,
      page: {
        number,
        size: pagedItems.length,
        totalItems: count,
        totalPages: size > 0 ? Math.ceil(count / size) : 0,
      },
    };
  };

  // List workspaces that user can join (excludes workspaces they're already a member of)
  listJoinableWorkspaces = async (
    user: UserAuthPayload,
    page?: { size?: number | null; number?: number | null },
  ) => {
    // Get workspaces user can join (has CAN_JOIN permission)
    const canJoinWorkspaces = await this.authZ.workspace.listResources({
      permission: ERP_WORKSPACE_PERMISSIONS.CAN_JOIN,
      resourceType: RESOURCE_TYPES.ERP_WORKSPACE,
      subjectType: RESOURCE_TYPES.ERP_USER,
      subjectId: user.id,
    });

    // Get workspaces user is already a member of (has READ permission)
    const memberOfWorkspaces = await this.authZ.workspace.listResources({
      permission: ERP_WORKSPACE_PERMISSIONS.READ,
      resourceType: RESOURCE_TYPES.ERP_WORKSPACE,
      subjectType: RESOURCE_TYPES.ERP_USER,
      subjectId: user.id,
    });

    // Create a set of workspace IDs where user is already a member
    const memberWorkspaceIds = new Set(
      memberOfWorkspaces.map((resource) => resource.resourceObjectId),
    );

    // Filter out workspaces where user is already a member
    const joinableWorkspaceIds = canJoinWorkspaces
      .map((resource) => resource.resourceObjectId)
      .filter((workspaceId) => !memberWorkspaceIds.has(workspaceId));

    // If no joinable workspaces, return empty result
    if (joinableWorkspaceIds.length === 0) {
      return {
        items: [],
        page: {
          number: 1,
          size: 0,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    // Get the workspace details for truly joinable workspaces
    const [items, count] = await Promise.all([
      this.model.getWorkspacesByIds(joinableWorkspaceIds),
      this.model.countWorkspacesByIds(joinableWorkspaceIds),
    ]);

    const pageSizeRaw = page?.size ?? items.length;
    const pageNumberRaw = page?.number ?? 1;
    const size =
      typeof pageSizeRaw === 'number' && pageSizeRaw > 0
        ? Math.floor(pageSizeRaw)
        : items.length;
    const number =
      typeof pageNumberRaw === 'number' && pageNumberRaw > 0
        ? Math.floor(pageNumberRaw)
        : 1;
    const start = (number - 1) * size;
    const pagedItems =
      size > 0 ? items.slice(start, start + size) : items.slice(0, 0);

    return {
      items: pagedItems,
      page: {
        number,
        size: pagedItems.length,
        totalItems: count,
        totalPages: size > 0 ? Math.ceil(count / size) : 0,
      },
    };
  };

  // Join a workspace
  joinWorkspace = async (
    workspaceId: string,
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Get the workspace to ensure it exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user can join the workspace
    const canJoin = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_JOIN,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canJoin) {
      throw new Error('You do not have permission to join this workspace');
    }

    // Check if user is already a member
    const isMember = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (isMember) {
      throw new Error('You are already a member of this workspace');
    }

    // Add user as a member of the workspace in SpiceDB
    await this.authZ.workspace.writeRelation({
      resourceId: workspaceId,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ALL_RESOURCES_READER,
    });

    return workspace;
  };

  // Update workspace settings (admin only)
  updateWorkspaceSettings = async (
    workspaceId: string,
    updates: {
      name?: string;
      description?: string;
      brandId?: string;
      orgBusinessContactId?: string | null;
      logoUrl?: string;
      bannerImageUrl?: string;
    },
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user is an admin of the workspace
    const isAdmin = await this.authZ.workspace.hasRelation({
      resourceId: workspaceId,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ADMIN,
    });

    if (!isAdmin) {
      throw new Error('You must be an admin to update workspace settings');
    }

    // Validate name if provided
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error('Workspace name cannot be empty');
    }

    // Update the workspace
    const updatedWorkspace = await this.model.updateWorkspace(workspaceId, {
      ...updates,
      updatedBy: user.id,
    });

    if (!updatedWorkspace) {
      throw new Error('Failed to update workspace');
    }

    return updatedWorkspace;
  };

  // Update workspace access type (admin only)
  updateWorkspaceAccessType = async (
    workspaceId: string,
    accessType: 'INVITE_ONLY' | 'SAME_DOMAIN',
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    if (!accessType || !['INVITE_ONLY', 'SAME_DOMAIN'].includes(accessType)) {
      throw new Error('Invalid access type');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user is an admin of the workspace
    const isAdmin = await this.authZ.workspace.hasRelation({
      resourceId: workspaceId,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ADMIN,
    });

    if (!isAdmin) {
      throw new Error('You must be an admin to update workspace access type');
    }

    // Update the workspace access type
    const updatedWorkspace = await this.model.updateWorkspace(workspaceId, {
      accessType,
      updatedBy: user.id,
    });

    if (!updatedWorkspace) {
      throw new Error('Failed to update workspace');
    }

    // Handle SpiceDB domain relationship
    if (workspace.domain) {
      const domainId = workspace.domain.replace('.', '_');

      if (accessType === 'SAME_DOMAIN') {
        // Add domain relationship
        try {
          await this.authZ.workspace.writeRelation({
            resourceId: workspaceId,
            subjectId: domainId,
            relation: ERP_WORKSPACE_SUBJECT_RELATIONS.DOMAIN_DOMAIN,
          });
        } catch (error) {
          console.error(
            'Failed to create domain relationship in SpiceDB:',
            error,
          );
        }
      } else if (accessType === 'INVITE_ONLY') {
        // Remove domain relationship
        try {
          await this.authZ.workspace.deleteRelationships({
            resourceId: workspaceId,
            subjectId: domainId,
            relation: ERP_WORKSPACE_SUBJECT_RELATIONS.DOMAIN_DOMAIN,
          });
        } catch (error) {
          // It's okay if the relationship doesn't exist
          console.error(
            'Failed to remove domain relationship in SpiceDB:',
            error,
          );
        }
      }
    }

    return updatedWorkspace;
  };

  // Invite a user to a workspace with multiple roles
  inviteUserToWorkspace = async (
    workspaceId: string,
    userId: string,
    roles: ERP_WORKSPACE_RELATIONS[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!roles || roles.length === 0) {
      throw new Error('At least one role is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if the current user is an admin of the workspace
    const hasPermission = await this.authZ.workspace.hasPermission({
      resourceId: workspaceId,
      subjectId: user.id,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_ADD_USER,
    });

    if (!hasPermission) {
      throw new Error('You do not have permission to invite users');
    }

    await this.authZ.workspace.writeRelations(
      roles.map((role) => ({
        resourceId: workspaceId,
        subjectId: userId,
        relation: relationToSubjectRelationMap[role],
      })),
    );

    // Send invitation email
    try {
      // Get user email
      const users = await this.usersService.batchGetUsersById([userId], user);
      const userEmail = users[0]?.email;

      if (!userEmail) {
        console.warn(
          `User ${userId} does not have an email address, skipping invitation email`,
        );
      } else {
        // Build app URL
        const appUrl = this.envConfig.ERP_CLIENT_URL;

        // Send invitation email with workspace branding
        await this.emailService.sendTemplatedEmail({
          to: userEmail,
          from: 'noreply@equipmentshare.com',
          subject: `You've been invited to ${workspace.name}`,
          title: 'Workspace Invitation',
          subtitle: `You've been invited to join ${workspace.name}`,
          content:
            'Click the button below to access your workspace and start collaborating with your team.',
          primaryCTA: {
            text: 'Go to Workspace',
            url: appUrl,
          },
          bannerImgUrl: workspace.bannerImageUrl,
          iconUrl: workspace.logoUrl,
          workspaceId: workspace.id,
          user,
        });

        console.log(
          `Invitation email sent to ${userEmail} for workspace ${workspace.name}`,
        );
      }
    } catch (error) {
      // Log error but don't fail the invitation
      console.error('Failed to send invitation email:', error);
    }

    return {
      userId,
      roles,
    };
  };

  // List workspace members with all their roles
  listWorkspaceMembers = async (
    workspaceId: string,
    user: UserAuthPayload,
  ): Promise<{
    items: { userId: string; roles: ERP_WORKSPACE_RELATIONS[] }[];
    page: {
      number: number;
      size: number;
      totalItems: number;
      totalPages: number;
    };
  }> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user has read permission on the workspace
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('You do not have permission to view workspace members');
    }

    const allUsers = await this.authZ.workspace.listRelations({
      subjectType: RESOURCE_TYPES.ERP_USER,
      resourceId: workspaceId,
    });

    const usersMap: Record<
      string,
      { userId: string; roles: ERP_WORKSPACE_RELATIONS[] }
    > = {};

    // Iterate over all relations and build the map
    allUsers.forEach((relation) => {
      const userId = relation.relationship?.subject?.object?.objectId;
      const role = relation.relationship?.relation;

      if (userId && role) {
        // Initialize user entry if it doesn't exist
        if (!usersMap[userId]) {
          usersMap[userId] = {
            userId,
            roles: [],
          };
        }

        // Add the role to the user's roles array
        usersMap[userId].roles.push(role as ERP_WORKSPACE_RELATIONS);
      }
    });

    const members = Object.values(usersMap);

    return {
      items: members,
      page: {
        number: 1,
        size: members.length,
        totalItems: members.length,
        totalPages: 1,
      },
    };
  };

  // Update user roles in a workspace
  updateWorkspaceUserRoles = async (
    workspaceId: string,
    userId: string,
    roles: ERP_WORKSPACE_RELATIONS[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!roles || roles.length === 0) {
      throw new Error('At least one role is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if the current user has permission to update user roles
    const canUpdateRoles = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_UPDATE_USER_ROLES,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canUpdateRoles) {
      throw new Error(
        'You do not have permission to update user roles in this workspace',
      );
    }

    await this.authZ.workspace.deleteRelationships({
      resourceId: workspaceId,
      subjectId: userId,
      subjectType: RESOURCE_TYPES.ERP_USER,
    });

    await this.authZ.workspace.writeRelations(
      roles.map((role) => ({
        resourceId: workspaceId,
        subjectId: userId,
        relation: relationToSubjectRelationMap[role],
      })),
    );

    return {
      userId,
      roles,
    };
  };

  // Remove a user from a workspace
  removeUserFromWorkspace = async (
    workspaceId: string,
    userId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<boolean> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if the current user has permission to remove users
    const canRemoveUser = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_REMOVE_USER,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canRemoveUser) {
      throw new Error(
        'You do not have permission to remove users from this workspace',
      );
    }

    // check if the user is the only admin
    const adminRelations = await this.authZ.workspace.listRelations({
      resourceId: workspaceId,
      subjectType: RESOURCE_TYPES.ERP_USER,
      relation: ERP_WORKSPACE_RELATIONS.ADMIN,
    });

    const isOnlyAdmin =
      adminRelations.length === 1 &&
      adminRelations[0].relationship?.subject?.object?.objectId === userId;

    if (isOnlyAdmin) {
      throw new Error('Cannot remove the only admin of the workspace');
    }

    await this.authZ.workspace.deleteRelationships({
      resourceId: workspaceId,
      subjectId: userId,
      subjectType: RESOURCE_TYPES.ERP_USER,
    });

    return true;
  };

  // Archive a workspace (admin only)
  archiveWorkspace = async (
    workspaceId: string,
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user is an admin of the workspace
    const isAdmin = await this.authZ.workspace.hasRelation({
      resourceId: workspaceId,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ADMIN,
    });

    if (!isAdmin) {
      throw new Error('You must be an admin to archive a workspace');
    }

    // Check if already archived
    if (workspace.archived) {
      throw new Error('Workspace is already archived');
    }

    // Update the workspace
    const updatedWorkspace = await this.model.updateWorkspace(workspaceId, {
      archived: true,
      archivedAt: new Date(),
      updatedBy: user.id,
    });

    if (!updatedWorkspace) {
      throw new Error('Failed to archive workspace');
    }

    return updatedWorkspace;
  };

  // Unarchive a workspace (admin only)
  unarchiveWorkspace = async (
    workspaceId: string,
    user: UserAuthPayload,
  ): Promise<Workspace> => {
    // Validation
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.model.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user is an admin of the workspace
    const isAdmin = await this.authZ.workspace.hasRelation({
      resourceId: workspaceId,
      subjectId: user.id,
      relation: ERP_WORKSPACE_SUBJECT_RELATIONS.USER_ADMIN,
    });

    if (!isAdmin) {
      throw new Error('You must be an admin to unarchive a workspace');
    }

    // Check if already unarchived
    if (!workspace.archived) {
      throw new Error('Workspace is not archived');
    }

    // Update the workspace
    const updatedWorkspace = await this.model.updateWorkspace(workspaceId, {
      archived: false,
      archivedAt: null as any,
      updatedBy: user.id,
    });

    if (!updatedWorkspace) {
      throw new Error('Failed to unarchive workspace');
    }

    return updatedWorkspace;
  };
}

export const createWorkspaceService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  authZ: AuthZ;
  usersService: UsersService;
  emailService: EmailService;
}) => {
  const model = createWorkspaceModel(config);

  const workspaceService = new WorkspaceService({
    model,
    authZ: config.authZ,
    usersService: config.usersService,
    emailService: config.emailService,
    envConfig: config.envConfig,
  });

  return workspaceService;
};
