import { type MongoClient } from 'mongodb';
import {
  ProjectsModel,
  createProjectsModel,
  ProjectsUpdateInput,
  ProjectDoc,
} from './model';
import { v4 as uuidv4 } from 'uuid';
import { UserAuthPayload, SYSTEM_USER } from '../../authentication';
import { type AuthZ } from '../../lib/authz';
import {
  ERP_PROJECT_SUBJECT_RELATIONS,
  ERP_PROJECT_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';

export class ProjectsService {
  private model: ProjectsModel;
  private authZ: AuthZ;

  constructor(config: { model: ProjectsModel; authZ: AuthZ }) {
    this.model = config.model;
    this.authZ = config.authZ;
  }

  batchGetProjectsById = async (
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(ProjectDoc | null)[]> => {
    if (!user) {
      return ids.map(() => null);
    }
    const docs = await this.model.getProjectsByIds(ids);
    const docsById: Record<string, ProjectDoc> = {};

    // Parallelize permission checks to avoid N+1 performance issues
    const permissionResults = await Promise.all(
      docs.map((doc) =>
        this.authZ.project.hasPermission({
          permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: doc._id,
          subjectId: user.id,
        }),
      ),
    );

    // Filter projects based on permission results
    docs.forEach((doc, idx) => {
      if (permissionResults[idx]) {
        docsById[doc._id] = doc;
      }
    });

    return ids.map((id) => docsById[id] ?? null);
  };

  listProjects = async (workspaceId: string, user?: UserAuthPayload) => {
    if (!user) {
      return [];
    }

    // Check if user has permission to read projects in the workspace
    const canReadProjects = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_PROJECTS,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!canReadProjects) {
      return [];
    }

    return await this.model.getProjectsByWorkspaceId(workspaceId);
  };

  updateProject = async (
    id: string,
    input: Omit<ProjectsUpdateInput, 'updated_by'>,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this project
    const canUpdateProject = await this.authZ.project.hasPermission({
      permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdateProject) {
      throw new Error('User does not have permission to update this project');
    }

    // Fetch the project to verify it exists
    const project = await this.model.getProjectById(id);
    if (!project) {
      throw new Error('Project not found');
    }

    const now = new Date();
    // status is optional and will be included if present in input
    return await this.model.updateProject(id, {
      ...input,
      createdBy: user.id,
      created_at: project.created_at, // preserve original created_at
      updated_at: now,
      updated_by: user.id,
    });
  };

  getProjectById = async (id: string, user?: UserAuthPayload) => {
    const project = await this.model.getProjectById(id);
    if (!project) {
      return null;
    }

    if (!user) {
      return null;
    }

    // System user can access all projects
    if (user.id === SYSTEM_USER.id) {
      return project;
    }

    // Check if user has permission to read this project
    const canReadProject = await this.authZ.project.hasPermission({
      permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canReadProject) {
      return null;
    }

    return project;
  };

  createProject = async (
    input: Omit<
      ProjectDoc,
      '_id' | 'createdBy' | 'created_at' | 'updated_at' | 'updated_by'
    >,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage projects in the workspace
    const canManageProjects = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PROJECTS,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!canManageProjects) {
      throw new Error(
        'You do not have permission to create projects in this workspace',
      );
    }

    const now = new Date();
    const project: ProjectDoc = {
      _id: uuidv4(),
      workspaceId: input.workspaceId,
      createdBy: user.id,
      created_at: now,
      updated_at: now,
      updated_by: user.id,
      name: input.name,
      projectCode: input.projectCode,
      description: input.description,
      status: input.status,
      scope_of_work: input.scope_of_work,
      project_contacts: input.project_contacts || [],
      deleted: input.deleted,
      parent_project: input.parent_project,
    };

    const created = await this.model.createProject(project);

    // Create SpiceDB relationship between project and workspace
    if (created) {
      try {
        await this.authZ.project.writeRelation({
          resourceId: created._id,
          subjectId: input.workspaceId,
          relation: ERP_PROJECT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for project:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return created;
  };

  deleteProject = async (id: string, user?: UserAuthPayload) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this project
    const canUpdateProject = await this.authZ.project.hasPermission({
      permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdateProject) {
      throw new Error('User does not have permission to delete this project');
    }

    // Get the project to verify it exists
    const project = await this.model.getProjectById(id);
    if (!project) {
      throw new Error('Project not found');
    }
    const now = new Date();
    // Soft delete: set deleted to true and update updated_at
    await this.model.updateProject(id, {
      ...project,
      deleted: true,
      updated_at: now,
      updated_by: user.id,
    });

    // Clean up SpiceDB relationships
    try {
      await this.authZ.project.deleteRelationships({
        resourceId: id,
      });
    } catch (error) {
      console.error(
        'Failed to delete SpiceDB relationships for project:',
        error,
      );
      // Don't fail the deletion, but log the error
    }

    // Return the updated project
    return await this.model.getProjectById(id);
  };

  /**
   * Patch top-level fields of a project.
   * Only updates the fields provided in the patch object.
   * Always updates updated_at and updated_by.
   */
  patchProject = async (
    id: string,
    patch: Partial<Omit<ProjectsUpdateInput, 'createdBy' | 'created_at'>>,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this project
    const canUpdateProject = await this.authZ.project.hasPermission({
      permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdateProject) {
      throw new Error('User does not have permission to update this project');
    }

    // Fetch the project to verify it exists
    const project = await this.model.getProjectById(id);
    if (!project) {
      throw new Error('Project not found');
    }
    const now = new Date();
    // Only allow patching top-level fields, never _id, createdBy, created_at
    const allowedPatch = {
      ...patch,
      updated_at: now,
      updated_by: user.id,
    };
    await this.model.patchProject(id, allowedPatch);
    return this.model.getProjectById(id);
  };

  /**
   * Find all projects with the given parent_project id, filtered by user permissions.
   */
  findProjectsByParentProjectId = async (
    parentProjectId: string,
    user?: UserAuthPayload,
  ): Promise<ProjectDoc[]> => {
    if (!user) {
      return [];
    }

    const projects =
      await this.model.getProjectsByParentProjectId(parentProjectId);

    // Parallelize permission checks to avoid N+1 performance issues
    const permissionResults = await Promise.all(
      projects.map((project) =>
        this.authZ.project.hasPermission({
          permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: project._id,
          subjectId: user.id,
        }),
      ),
    );

    // Filter projects based on permission results
    return projects.filter((_, idx) => permissionResults[idx]);
  };

  /**
   * Count all descendants (subprojects at all nesting levels) for a given project.
   * Note: This count includes ALL descendants regardless of user permissions.
   * If permission filtering is needed, consider using the recursive approach instead.
   */
  countAllDescendants = async (
    projectId: string,
    user?: UserAuthPayload,
  ): Promise<number> => {
    // Return 0 for unauthenticated users (consistent with other methods)
    if (!user) {
      return 0;
    }

    // System user can access all projects
    if (user.id === SYSTEM_USER.id) {
      return await this.model.countAllDescendants(projectId);
    }

    // Check if regular user has permission to read this project
    const canRead = await this.authZ.project.hasPermission({
      permission: ERP_PROJECT_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: projectId,
      subjectId: user.id,
    });

    if (!canRead) {
      return 0;
    }

    return await this.model.countAllDescendants(projectId);
  };
}

export const createProjectsService = async (config: {
  mongoClient: MongoClient;
  authZ: AuthZ;
}) => {
  const model = createProjectsModel(config);
  const projectsService = new ProjectsService({
    model,
    authZ: config.authZ,
  });
  return projectsService;
};

export type { ProjectDoc };
