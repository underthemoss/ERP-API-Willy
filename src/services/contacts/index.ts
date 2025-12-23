import { type MongoClient } from 'mongodb';
import {
  createContactsModel,
  type ContactsModel,
  CreateBusinessContactInput,
  CreatePersonContactInput,
  ListContactsQuery,
  PersonContactType,
  UpdateBusinessContactInput,
  UpdatePersonContactInput,
} from './model';
import { UserAuthPayload } from '../../authentication';
import { type AuthZ } from '../../lib/authz';
import { type EnvConfig } from '../../config';
import { logger } from '../../lib/logger';
import {
  ERP_CONTACT_SUBJECT_RELATIONS,
  ERP_CONTACT_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';
import { ResourceMapResourcesService } from '../resource_map';
import { RESOURCE_MAP_TAG_TYPE } from '../resource_map/tag-types';

// re-export DTOs
export type { BusinessContact, PersonContact, Contact } from './model';

export class ContactsService {
  private model: ContactsModel;
  private authZ: AuthZ;
  private resourceMapResourcesService: ResourceMapResourcesService;
  private envConfig: EnvConfig;
  constructor(config: {
    model: ContactsModel;
    authZ: AuthZ;
    resourceMapResourcesService: ResourceMapResourcesService;
    envConfig: EnvConfig;
  }) {
    this.model = config.model;
    this.authZ = config.authZ;
    this.resourceMapResourcesService = config.resourceMapResourcesService;
    this.envConfig = config.envConfig;
  }

  private async validatePersonResourceMapIds(
    resourceMapIds: string[] | undefined,
    user: UserAuthPayload,
    personType?: PersonContactType,
  ) {
    if (this.envConfig.IN_TEST_MODE) {
      return;
    }

    const { tagTypes } =
      await this.resourceMapResourcesService.validateResourceMapIds({
        ids: resourceMapIds ?? [],
        allowedTypes: [
          RESOURCE_MAP_TAG_TYPE.LOCATION,
          RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
          RESOURCE_MAP_TAG_TYPE.ROLE,
        ],
        user,
        allowEmpty: true,
      });

    if (personType !== 'EMPLOYEE') {
      return;
    }

    if (!resourceMapIds || resourceMapIds.length === 0) {
      logger.warn(
        'Person contact created/updated without resource map tags (expected for employees).',
      );
      return;
    }

    const hasRoleTag = tagTypes.includes(RESOURCE_MAP_TAG_TYPE.ROLE);
    const hasNonRoleTag = tagTypes.some(
      (tagType) => tagType !== RESOURCE_MAP_TAG_TYPE.ROLE,
    );

    if (!hasRoleTag) {
      logger.warn(
        'Person contact missing role tag (expected for employee activity classification).',
      );
    }

    if (!hasNonRoleTag) {
      logger.warn(
        'Person contact missing location or business unit tag (expected for employee home base/purpose).',
      );
    }
  }

  private async validateBusinessResourceMapIds(
    resourceMapIds: string[] | undefined,
    user: UserAuthPayload,
  ) {
    if (this.envConfig.IN_TEST_MODE || !resourceMapIds?.length) {
      return;
    }

    await this.resourceMapResourcesService.validateResourceMapIds({
      ids: resourceMapIds,
      allowedTypes: [
        RESOURCE_MAP_TAG_TYPE.LOCATION,
        RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
      ],
      user,
      allowEmpty: true,
    });
  }

  async createBusinessContact(
    input: Omit<CreateBusinessContactInput, 'createdBy'>,
    user?: UserAuthPayload,
  ) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage contacts in the workspace
    const canManageContacts = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_CONTACTS,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!canManageContacts) {
      throw new Error(
        'You do not have permission to create contacts in this workspace',
      );
    }

    if (input.resourceMapIds) {
      await this.validateBusinessResourceMapIds(input.resourceMapIds, user);
    }

    // validation
    // business logic
    const contact = await this.model.createBusinessContact({
      ...input,
      createdBy: user.id,
    });

    // Create SpiceDB relationship between contact and workspace
    if (contact) {
      try {
        await this.authZ.contact.writeRelation({
          resourceId: contact.id,
          subjectId: input.workspaceId,
          relation: ERP_CONTACT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for contact:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return contact;
  }

  async createPersonContact(
    input: Omit<CreatePersonContactInput, 'createdBy'>,
    user?: UserAuthPayload,
  ) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage contacts in the workspace
    const canManageContacts = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_CONTACTS,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!canManageContacts) {
      throw new Error(
        'You do not have permission to create contacts in this workspace',
      );
    }

    await this.validatePersonResourceMapIds(
      input.resourceMapIds,
      user,
      input.personType,
    );

    // validation
    // business logic
    const contact = await this.model.createPersonContact({
      ...input,
      createdBy: user.id,
    });

    // Create SpiceDB relationship between contact and workspace
    if (contact) {
      try {
        await this.authZ.contact.writeRelation({
          resourceId: contact.id,
          subjectId: input.workspaceId,
          relation: ERP_CONTACT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for contact:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return contact;
  }

  async updateBusinessContact(
    id: string,
    input: UpdateBusinessContactInput,
    user?: UserAuthPayload,
  ) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has update permission on this specific contact
    const canUpdate = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this contact');
    }

    if (input.resourceMapIds) {
      await this.validateBusinessResourceMapIds(input.resourceMapIds, user);
    }

    // validation
    // business logic
    return this.model.updateBusinessContact(id, input);
  }

  async updatePersonContact(
    id: string,
    input: UpdatePersonContactInput,
    user?: UserAuthPayload,
  ) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has update permission on this specific contact
    const canUpdate = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this contact');
    }

    if (input.resourceMapIds || input.personType) {
      await this.validatePersonResourceMapIds(
        input.resourceMapIds,
        user,
        input.personType,
      );
    }

    // validation
    // business logic
    return this.model.updatePersonContact(id, input);
  }

  async patchBusinessContact(
    id: string,
    patch: UpdateBusinessContactInput,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has update permission on this specific contact
    const canUpdate = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this contact');
    }

    if (patch.resourceMapIds) {
      await this.validateBusinessResourceMapIds(patch.resourceMapIds, user);
    }

    return this.model.patchBusinessContact(id, patch);
  }

  async patchPersonContact(
    id: string,
    patch: UpdatePersonContactInput,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has update permission on this specific contact
    const canUpdate = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this contact');
    }

    if (patch.resourceMapIds || patch.personType) {
      await this.validatePersonResourceMapIds(
        patch.resourceMapIds,
        user,
        patch.personType,
      );
    }

    return this.model.patchPersonContact(id, patch);
  }

  async getContactById(id: string, user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has read permission on this specific contact
    const canRead = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('Contact not found or access denied');
    }

    // validation
    // business logic
    const contact = await this.model.getContactById(id);
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  }

  async batchGetContactsById(ids: readonly string[], user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all contacts
    const contacts = await this.model.batchGetContactsById(ids);

    // Check permissions for each contact
    const permissionChecks = await this.authZ.contact.bulkHasPermissions(
      ids.map((id) => ({
        resourceId: id,
        permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      })),
    );

    // Filter contacts based on permissions
    const allowedContactIds = new Set(
      permissionChecks
        .filter((check) => check.hasPermission)
        .map((check) => check.resourceId),
    );

    // Return contacts in the same order as input, null for unauthorized/missing
    return ids.map((id) => {
      const contact = contacts.find((c) => c?.id === id);
      return contact && allowedContactIds.has(id) ? contact : null;
    });
  }

  async deleteContactById(id: string, user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has delete permission on this specific contact
    const canDelete = await this.authZ.contact.hasPermission({
      permission: ERP_CONTACT_SUBJECT_PERMISSIONS.USER_DELETE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canDelete) {
      throw new Error('You do not have permission to delete this contact');
    }

    // validation
    // business logic
    await this.model.deleteContactById(id);

    // Delete SpiceDB relationships for this contact
    try {
      await this.authZ.contact.deleteRelationships({
        resourceId: id,
      });
    } catch (error) {
      console.error(
        'Failed to delete SpiceDB relationships for contact:',
        error,
      );
      // Don't fail the deletion, but log the error
    }
  }

  async listContacts(query: ListContactsQuery, user?: UserAuthPayload) {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to read contacts in the workspace
    const canReadContacts = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_CONTACTS,
      resourceId: query.filter.workspaceId,
      subjectId: user.id,
    });

    if (!canReadContacts) {
      // User doesn't have permission, return empty result
      return {
        items: [],
        page: {
          number: query.page?.number || 1,
          size: query.page?.size || 10,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    // validation
    // business logic
    const [items, count] = await Promise.all([
      this.model.listContacts(query),
      this.model.countContacts(query.filter),
    ]);

    return {
      items,
      page: {
        number: query.page?.number || 1,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / items.length) || 0,
      },
    };
  }

  async touchAllContacts(
    batchSize?: number,
    user?: UserAuthPayload,
  ): Promise<{ touched: number }> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('User is not authorized to touch all contacts');
    }
    // validation
    // business logic
    return this.model.touchAllContacts({ batchSize });
  }
}

export const createContactsService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  authZ: AuthZ;
  resourceMapResourcesService: ResourceMapResourcesService;
}) => {
  const model = createContactsModel(config);
  const contactsService = new ContactsService({
    model,
    authZ: config.authZ,
    resourceMapResourcesService: config.resourceMapResourcesService,
    envConfig: config.envConfig,
  });

  return contactsService;
};
