import { type MongoClient } from 'mongodb';
import {
  ReferenceNumberTemplateModel,
  createReferenceNumberTemplateModel,
  type ReferenceNumberTemplate,
  type CreateReferenceNumberTemplateInput,
  type UpdateReferenceNumberTemplateInput,
  type ListTemplatesQuery,
} from './templates-model';
import {
  SequenceNumberModel,
  createSequenceNumberModel,
  type SequenceNumber,
} from './sequence-number-model';
import { UserAuthPayload } from '../../authentication';
import { logger } from '../../lib/logger';
import { type ProjectsService } from '../projects';
import { type ContactsService } from '../contacts';
import { AuthZ, ERP_WORKSPACE_SUBJECT_PERMISSIONS } from '../../lib/authz';

export type ReferenceNumberType = 'PO' | 'SO' | 'INVOICE';

export type GenerateReferenceNumberInput = {
  projectCode?: string;
  parentProjectCode?: string;
  templateId: string;
};

export type GenerateReferenceNumberResult = {
  referenceNumber: string;
  templateUsed: ReferenceNumberTemplate;
  sequenceNumber: number;
};

export type GenerateReferenceNumberForEntityInput = {
  entityType: 'PO' | 'SO' | 'INVOICE';
  workspaceId: string;
  projectId?: string;
  contactId?: string; // buyer for SO, seller for PO
};

export type CreateTemplateInput = CreateReferenceNumberTemplateInput;
export type UpdateTemplateInput = UpdateReferenceNumberTemplateInput & {
  id: string;
};

export class ReferenceNumberService {
  private templateModel: ReferenceNumberTemplateModel;
  private sequenceModel: SequenceNumberModel;
  private GLOBAL_SEQ_TEMPLATE_ID: string; // Special ID for global templates
  private projectsService?: ProjectsService;
  private contactsService?: ContactsService;
  private authZ: AuthZ;

  constructor(config: {
    mongoClient: MongoClient;
    projectsService?: ProjectsService;
    contactsService?: ContactsService;
    authZ: AuthZ;
  }) {
    this.templateModel = createReferenceNumberTemplateModel(config);
    this.sequenceModel = createSequenceNumberModel(config);
    this.GLOBAL_SEQ_TEMPLATE_ID = 'GLOBAL'; // Special ID for global templates
    this.projectsService = config.projectsService;
    this.contactsService = config.contactsService;
    this.authZ = config.authZ;
  }

  /**
   * Use-case 1: Creating new templates
   */
  async createTemplate(
    input: CreateTemplateInput,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate> {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    return this.templateModel.createReferenceNumberTemplate(input);
  }

  /**
   * Use-case 2: Listing templates
   */
  async listTemplates(
    query: ListTemplatesQuery,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate[]> {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_REFERENCE_NUMBER_TEMPLATES,
      resourceId: query.filter.workspaceId,
      subjectId: user.id,
    });

    return this.templateModel.listReferenceNumberTemplates(query);
  }

  /**
   * Use-case 3: Deleting templates
   */
  async deleteTemplate(id: string, user: UserAuthPayload): Promise<void> {
    const template =
      await this.templateModel.getReferenceNumberTemplateById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES,
      resourceId: template.workspaceId,
      subjectId: user.id,
    });

    return this.templateModel.deleteReferenceNumberTemplateById(id);
  }

  /**
   * Use-case 4: Updating a template, e.g resetting the sequence number
   */
  async updateTemplate(
    input: UpdateTemplateInput,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate> {
    const existingTemplate =
      await this.templateModel.getReferenceNumberTemplateById(input.id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES,
      resourceId: existingTemplate.workspaceId,
      subjectId: user.id,
    });

    const { id, ...updateData } = input;
    return this.templateModel.updateReferenceNumberTemplateById(id, updateData);
  }

  /**
   * Reset sequence number for a template
   */
  async resetSequenceNumber(
    templateId: string,
    newValue: number = 1,
    user: UserAuthPayload,
  ): Promise<void> {
    // Get the template to find the company and type
    const template =
      await this.templateModel.getReferenceNumberTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_REFERENCE_NUMBER_TEMPLATES,
      resourceId: template.workspaceId,
      subjectId: user.id,
    });

    // Find existing sequence number for this template
    const sequenceNumbers = await this.sequenceModel.listSequenceNumbers({
      filter: {
        workspaceId: template.workspaceId,
        type: template.type,
        templateId,
      },
    });

    if (sequenceNumbers.length > 0) {
      // Update existing sequence number
      await this.sequenceModel.updateSequenceNumberById(sequenceNumbers[0].id, {
        workspaceId: template.workspaceId,
        type: template.type,
        templateId,
        value: newValue,
        createdBy: sequenceNumbers[0].createdBy,
        updatedBy: user.id,
        deleted: false,
      });
    } else {
      // Create new sequence number
      await this.sequenceModel.createSequenceNumber({
        workspaceId: template.workspaceId,
        type: template.type,
        templateId,
        value: newValue,
        createdBy: user.id,
        updatedBy: user.id,
        deleted: false,
      });
    }
  }

  /**
   * Use-case 5: Generating the next reference number using the provided templateId
   */
  async generateNextReferenceNumber(
    input: GenerateReferenceNumberInput,
    user: UserAuthPayload,
  ): Promise<GenerateReferenceNumberResult> {
    const { templateId } = input;

    // Get the template by ID
    const selectedTemplate =
      await this.templateModel.getReferenceNumberTemplateById(templateId);

    if (!selectedTemplate) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: selectedTemplate.workspaceId,
      subjectId: user.id,
    });

    // Get the next sequence number
    const sequenceNumber = await this.getNextSequenceNumber(
      selectedTemplate,
      user,
    );

    logger.info(
      {},
      `Generated sequence number ${sequenceNumber} for template ${templateId}`,
    );

    // Generate the reference number using the template
    const referenceNumber = this.formatReferenceNumber(
      selectedTemplate,
      sequenceNumber,
      input.projectCode,
      input.parentProjectCode,
    );

    return {
      referenceNumber,
      templateUsed: selectedTemplate,
      sequenceNumber,
    };
  }

  /**
   * Generate a reference number for an entity (PO, SO, INVOICE)
   * This method handles the complete template selection flow:
   * 1. Check project template
   * 2. Check business contact template
   * 3. Fall back to default template
   */
  async generateReferenceNumberForEntity(
    params: GenerateReferenceNumberForEntityInput,
    user: UserAuthPayload,
  ): Promise<string> {
    if (!this.projectsService || !this.contactsService) {
      throw new Error(
        'Reference number service not initialized with required dependencies (projectsService, contactsService)',
      );
    }

    const { entityType, projectId, contactId } = params;
    let templateId: string | null = null;
    let project = null;
    let parentProject = null;

    // Fetch project and parent project if projectId is provided
    if (projectId) {
      project = await this.projectsService.getProjectById(projectId, user);
      if (project?.parent_project) {
        parentProject = await this.projectsService.getProjectById(
          project.parent_project,
          user,
        );
      }
    }

    // Priority 1: Check if project has a template ID for this entity type
    if (projectId) {
      logger.info(
        `Checking project ${projectId} for ${entityType} template ID`,
      );
      const [template] = await this.listTemplates(
        {
          filter: {
            workspaceId: params.workspaceId,
            type: entityType,
            projectId,
          },
        },
        user,
      );

      if (template) {
        logger.info(
          `Found ${entityType} template ID ${template.id} for project ${projectId}`,
        );
        templateId = template.id;
      }
    }

    // Priority 2: Check if business contact has a template ID for this entity type
    if (!templateId && contactId) {
      try {
        const contact = await this.contactsService.getContactById(
          contactId,
          user,
        );

        const businessContactId =
          contact?.contactType === 'BUSINESS'
            ? contact.id
            : contact?.businessId;

        if (businessContactId) {
          const [template] = await this.listTemplates(
            {
              filter: {
                workspaceId: params.workspaceId,
                type: entityType,
                businessContactId,
              },
            },
            user,
          );

          if (template) {
            logger.info(
              `Found ${entityType} template ID ${template.id} for business contact ${businessContactId}`,
            );
            templateId = template.id;
          }
        }
      } catch (error) {
        // If contact not found or access denied, continue to default template
        logger.info(
          `Could not fetch contact ${contactId} for template selection, using default template`,
        );
      }
    }

    // Priority 3: Get or create default template if no specific template found
    if (!templateId) {
      const defaultTemplate = await this.getOrCreateDefaultTemplate(
        params.workspaceId,
        entityType,
        user,
      );
      templateId = defaultTemplate.id;
    }

    // Generate the reference number
    const { referenceNumber } = await this.generateNextReferenceNumber(
      {
        templateId,
        projectCode: project?.projectCode,
        parentProjectCode: parentProject?.projectCode,
      },
      user,
    );

    return referenceNumber;
  }

  /**
   * Get or create a default template for the given company and type
   */
  async getOrCreateDefaultTemplate(
    workspaceId: string,
    type: ReferenceNumberType,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate> {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    // Try to find an existing default template (one without projectId or businessContactId)
    const templates = await this.templateModel.listReferenceNumberTemplates({
      filter: { workspaceId, type },
    });

    const defaultTemplate = templates.find(
      (t) => !t.projectId && !t.businessContactId,
    );

    if (defaultTemplate) {
      return defaultTemplate;
    }

    // Create a new default template if none exists
    return this.createDefaultTemplate(workspaceId, type, user);
  }

  /**
   * Create a default template with format: ${type}-${sequenceNumber}
   */
  private async createDefaultTemplate(
    workspaceId: string,
    type: ReferenceNumberType,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate> {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    const defaultTemplate: CreateReferenceNumberTemplateInput = {
      workspaceId,
      type,
      template: `${type}-{seq}`,
      resetFrequency: 'never',
      useGlobalSequence: true,
      seqPadding: 4, // Default to 4-digit padding (0001, 0002, etc.)
      startAt: 1,
      createdBy: user.id,
      updatedBy: user.id,
      deleted: false,
    };

    return this.templateModel.createReferenceNumberTemplate(defaultTemplate);
  }

  /**
   * Get the next sequence number for a template
   */
  private async getNextSequenceNumber(
    template: ReferenceNumberTemplate,
    user: UserAuthPayload,
  ): Promise<number> {
    logger.info(
      {
        template,
      },
      'Getting next sequence number',
    );
    const templateId = template.useGlobalSequence
      ? this.GLOBAL_SEQ_TEMPLATE_ID
      : template.id;

    return this.sequenceModel.getNextSequenceNumber({
      workspaceId: template.workspaceId,
      type: template.type,
      templateId,
      createdBy: user.id,
      startAt: template.startAt,
    });
  }

  /**
   * Format the reference number using the template
   */
  private formatReferenceNumber(
    template: ReferenceNumberTemplate,
    sequenceNumber: number,
    projectCode?: string,
    parentProjectCode?: string,
  ): string {
    let formatted = template.template;
    const now = new Date();

    // Replace sequence number placeholder
    const paddedSequence = template.seqPadding
      ? sequenceNumber.toString().padStart(template.seqPadding, '0')
      : sequenceNumber.toString();

    formatted = formatted.replace(/{seq}/g, paddedSequence);

    // Replace date placeholders
    formatted = formatted.replace(/{YYYY}/g, now.getFullYear().toString());
    formatted = formatted.replace(
      /\{YY\}/g,
      now.getFullYear().toString().slice(-2),
    );
    formatted = formatted.replace(
      /{MM}/g,
      (now.getMonth() + 1).toString().padStart(2, '0'),
    );
    formatted = formatted.replace(
      /{DD}/g,
      now.getDate().toString().padStart(2, '0'),
    );

    // Replace project code placeholders
    if (projectCode) {
      formatted = formatted.replace(/{projectCode}/g, projectCode);
    }
    if (parentProjectCode) {
      formatted = formatted.replace(/{parentProjectCode}/g, parentProjectCode);
    }

    return formatted;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(
    id: string,
    user: UserAuthPayload,
  ): Promise<ReferenceNumberTemplate | null> {
    const template =
      await this.templateModel.getReferenceNumberTemplateById(id);

    if (!template) {
      return null;
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: template.workspaceId,
      subjectId: user.id,
    });

    return template;
  }

  /**
   * Get current sequence number without incrementing
   */
  async getCurrentSequenceNumber(
    workspaceId: string,
    templateId: string,
    user: UserAuthPayload,
  ): Promise<number> {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    const template =
      await this.templateModel.getReferenceNumberTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const seqTemplateId = template.useGlobalSequence
      ? this.GLOBAL_SEQ_TEMPLATE_ID
      : template.id;

    return this.sequenceModel.getCurrentSequenceNumber(
      workspaceId,
      template.type,
      seqTemplateId,
    );
  }

  /**
   * Batch get templates by IDs
   */
  async batchGetTemplatesByIds(
    ids: readonly string[],
  ): Promise<Array<ReferenceNumberTemplate | null>> {
    return this.templateModel.batchGetReferenceNumberTemplatesByIds(ids);
  }
}

export const createReferenceNumberService = (config: {
  mongoClient: MongoClient;
  projectsService?: ProjectsService;
  contactsService?: ContactsService;
  authZ: AuthZ;
}) => {
  return new ReferenceNumberService(config);
};

// Export types for use in GraphQL schema
export type {
  ReferenceNumberTemplate,
  CreateReferenceNumberTemplateInput,
  UpdateReferenceNumberTemplateInput,
  ListTemplatesQuery,
  SequenceNumber,
};
