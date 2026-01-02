import { type MongoClient } from 'mongodb';
import { type EnvConfig } from '../../config';
import {
  createIntakeFormModel,
  IntakeFormInput,
  type IntakeFormModel,
} from './form-model';
import {
  createIntakeFormSubmissionModel,
  type IntakeFormSubmissionModel,
  type IntakeFormSubmissionInput,
  type IntakeFormSubmissionDTO,
} from './form-submission-model';
import { UserAuthPayload, ANON_USER_AUTH_PAYLOAD } from '../../authentication';
import {
  ERP_INTAKE_FORM_PERMISSIONS,
  ERP_INTAKE_FORM_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBJECT_RELATIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  RESOURCE_TYPES,
  type AuthZ,
} from '../../lib/authz';
import { type EmailService } from '../email';
import { type PriceEngineService } from '../price_engine';
import { type PricesService } from '../prices';
import { type UsersService } from '../users';
import { type LineItem, LineItemsService } from '../line_items';

// export IntakeFormDTO from model
export { type IntakeFormDTO } from './form-model';
export { type IntakeFormSubmissionDTO } from './form-submission-model';

type IntakeFormLineItemInput = {
  startDate: Date;
  description: string;
  quantity: number;
  durationInDays: number;
  type: 'RENTAL' | 'PURCHASE';
  pimCategoryId: string;
  priceId?: string;
  customPriceName?: string;
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  deliveryLocation?: string;
  deliveryNotes?: string;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  salesOrderId?: string;
  salesOrderLineItemId?: string;
};

export class IntakeFormService {
  private formModel: IntakeFormModel;
  private formSubmissionModel: IntakeFormSubmissionModel;
  private lineItemsService: LineItemsService;
  private authZ: AuthZ;
  private emailService: EmailService;
  private priceEngineService: PriceEngineService;
  private pricesService: PricesService;
  private usersService: UsersService;

  constructor(config: {
    formModel: IntakeFormModel;
    formSubmissionModel: IntakeFormSubmissionModel;
    lineItemsService: LineItemsService;
    authZ: AuthZ;
    emailService: EmailService;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    usersService: UsersService;
  }) {
    this.formModel = config.formModel;
    this.formSubmissionModel = config.formSubmissionModel;
    this.lineItemsService = config.lineItemsService;
    this.authZ = config.authZ;
    this.emailService = config.emailService;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.usersService = config.usersService;
  }

  createIntakeForm = async (
    input: IntakeFormInput,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_INTAKE_FORMS,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to create intake forms');
    }

    if (input.pricebookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: input.pricebookId,
        subjectId: user.id,
      });

      if (!hasPermission) {
        throw new Error('User does not have permission to read this pricebook');
      }
    }

    return this.formModel.withTransaction(async (session) => {
      const form = await this.formModel.createIntakeForm(
        input,
        user.id,
        session,
      );

      await this.authZ.intakeForm.writeRelation({
        resourceId: form.id,
        relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: input.workspaceId,
      });

      if (input.isPublic) {
        await this.authZ.intakeForm.writeRelation({
          resourceId: form.id,
          relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
          subjectId: '*',
        });
      }

      if (input.pricebookId) {
        await this.authZ.priceBook.writeRelation({
          relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
          resourceId: input.pricebookId,
          subjectId: form.id,
        });
      }

      if (input.sharedWithUserIds?.length) {
        await this.authZ.intakeForm.writeRelations(
          input.sharedWithUserIds.map((userId) => ({
            resourceId: form.id,
            relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
            subjectId: userId,
          })),
        );
      }

      return form;
    });
  };

  setIntakeFormActive = async (
    id: string,
    isActive: boolean,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeForm.hasPermission({
      permission: ERP_INTAKE_FORM_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to update intake forms');
    }

    const form = await this.formModel.setIntakeFormActive(
      id,
      isActive,
      user.id,
    );
    if (!form) {
      throw new Error('Intake form not found');
    }
    return form;
  };

  updateIntakeForm = async (
    id: string,
    input: {
      projectId?: string | null;
      pricebookId?: string | null;
      isPublic?: boolean;
      sharedWithUserIds?: string[];
      isActive?: boolean;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    // Check permission to update the form
    const hasPermission = await this.authZ.intakeForm.hasPermission({
      permission: ERP_INTAKE_FORM_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to update this intake form',
      );
    }

    // Get the existing form
    const existingForm = await this.formModel.getIntakeFormById(id);
    if (!existingForm) {
      throw new Error('Intake form not found');
    }

    // Check permission for new pricebook if provided
    if (input.pricebookId && input.pricebookId !== existingForm.pricebookId) {
      const hasPricebookPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: input.pricebookId,
        subjectId: user.id,
      });

      if (!hasPricebookPermission) {
        throw new Error(
          'User does not have permission to read the specified pricebook',
        );
      }
    }

    return this.formModel.withTransaction(async (session) => {
      // Update the form in the database
      const updatedForm = await this.formModel.updateIntakeForm(
        id,
        {
          projectId:
            input.projectId !== undefined
              ? input.projectId || undefined
              : undefined,
          pricebookId:
            input.pricebookId !== undefined
              ? input.pricebookId || undefined
              : undefined,
          isPublic: input.isPublic,
          sharedWithUserIds: input.sharedWithUserIds,
          isActive: input.isActive,
        },
        user.id,
        session,
      );

      if (!updatedForm) {
        throw new Error('Failed to update intake form');
      }

      // Handle public/private toggle
      if (
        input.isPublic !== undefined &&
        input.isPublic !== existingForm.isPublic
      ) {
        if (input.isPublic) {
          // Making form public - add wildcard relation
          await this.authZ.intakeForm.writeRelation({
            resourceId: id,
            relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
            subjectId: '*',
          });
        } else {
          // Making form private - remove wildcard relation
          await this.authZ.intakeForm.deleteRelationships({
            resourceId: id,
            relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
            subjectId: '*',
          });
        }
      }

      // Handle shared users changes
      if (input.sharedWithUserIds !== undefined) {
        const existingUserIds = existingForm.sharedWithUserIds || [];

        // Find users to remove (in existing but not in new)
        const usersToRemove = existingUserIds.filter(
          (userId) => !input.sharedWithUserIds!.includes(userId),
        );

        // Find users to add (in new but not in existing)
        const usersToAdd = input.sharedWithUserIds!.filter(
          (userId) => !existingUserIds.includes(userId),
        );

        // Remove relations for users no longer shared with
        if (usersToRemove.length > 0) {
          await Promise.all(
            usersToRemove.map((userId) =>
              this.authZ.intakeForm.deleteRelationships({
                resourceId: id,
                relation:
                  ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
                subjectId: userId,
              }),
            ),
          );
        }

        // Add relations for newly shared users
        if (usersToAdd.length > 0) {
          await this.authZ.intakeForm.writeRelations(
            usersToAdd.map((userId) => ({
              resourceId: id,
              relation:
                ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
              subjectId: userId,
            })),
          );
        }
      }

      // Handle pricebook changes
      if (
        input.pricebookId !== undefined &&
        input.pricebookId !== existingForm.pricebookId
      ) {
        // Remove old pricebook relation if it exists
        if (existingForm.pricebookId) {
          await this.authZ.priceBook.deleteRelationships({
            relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
            resourceId: existingForm.pricebookId,
            subjectId: id,
          });
        }

        // Add new pricebook relation if provided
        if (input.pricebookId) {
          await this.authZ.priceBook.writeRelation({
            relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
            resourceId: input.pricebookId,
            subjectId: id,
          });
        }
      }

      return updatedForm;
    });
  };

  deleteIntakeForm = async (
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeForm.hasPermission({
      permission: ERP_INTAKE_FORM_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to update intake forms');
    }

    const form = await this.formModel.getIntakeFormById(id);
    if (!form) {
      throw new Error('Intake form not found');
    }

    if (form.isDeleted) {
      throw new Error('Intake form is already deleted');
    }

    return this.formModel.withTransaction(async (session) => {
      await this.authZ.intakeForm.deleteRelationships({
        resourceId: id,
        subjectType: RESOURCE_TYPES.ERP_USER,
        relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
      });

      if (form.isPublic) {
        await this.authZ.intakeForm.deleteRelationships({
          resourceId: id,
          relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.USER_INVITED_TO_SUBMIT,
          subjectId: '*',
        });
      }

      if (form.pricebookId) {
        await this.authZ.priceBook.deleteRelationships({
          relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
          subjectId: id,
          resourceId: form.pricebookId,
        });
      }

      return await this.formModel.deleteIntakeForm(id, user.id, session);
    });
  };

  listIntakeForms = async (
    opts: {
      query: { workspaceId: string };
      pagination?: { page?: number; limit?: number };
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const { query, pagination } = opts;
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_INTAKE_FORMS,
      resourceId: query.workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to list intake forms');
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;

    const [items, count] = await Promise.all([
      this.formModel.listIntakeForms(query, limit, page),
      this.formModel.countIntakeForms(query),
    ]);

    return {
      items,
      page: {
        number: page,
        size: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    };
  };

  listIntakeFormsForUser = async (
    opts: {
      pagination?: { page?: number; limit?: number };
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const { pagination } = opts;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;

    try {
      // 1. Get forms from SpiceDB where user has CREATE_SUBMISSION permission
      // This includes forms explicitly shared with the user and public forms (via wildcard)
      const intakeFormResources = await this.authZ.intakeForm.listResources({
        resourceType: RESOURCE_TYPES.ERP_INTAKE_FORM,
        subjectId: user.id,
        subjectType: RESOURCE_TYPES.ERP_USER,
        permission: ERP_INTAKE_FORM_PERMISSIONS.CREATE_SUBMISSION,
      });

      const spiceDbFormIds = intakeFormResources.map(
        (res) => res.resourceObjectId,
      );

      // 2. Get forms where user has created submissions
      // This ensures users retain access to forms they've submitted to,
      // even if those forms are later made private
      let userSubmissionFormIds: string[] = [];
      if (user.id !== ANON_USER_AUTH_PAYLOAD.id) {
        userSubmissionFormIds =
          await this.formSubmissionModel.getDistinctFormIdsByUserId(user.id);
      }

      // 3. Merge and deduplicate form IDs using Set
      const allFormIds = [
        ...new Set([...spiceDbFormIds, ...userSubmissionFormIds]),
      ];

      // Handle empty case
      if (allFormIds.length === 0) {
        return {
          items: [],
          page: {
            number: page,
            size: limit,
            totalItems: 0,
            totalPages: 1,
          },
        };
      }

      // 4. Fetch and return paginated results
      const [items, count] = await Promise.all([
        this.formModel.listIntakeFormsByIds({ ids: allFormIds }, limit, page),
        this.formModel.countIntakeFormsByIds({ ids: allFormIds }),
      ]);

      return {
        items,
        page: {
          number: page,
          size: limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit) || 1,
        },
      };
    } catch (error) {
      // Log error and re-throw with more context
      console.error('Error in listIntakeFormsForUser:', error);
      throw new Error(
        `Failed to list intake forms for user ${user.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  };

  getIntakeFormById = async (
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeForm.hasPermission({
      permission: ERP_INTAKE_FORM_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to read this intake form');
    }

    return this.formModel.getIntakeFormById(id);
  };

  createIntakeFormSubmission = async (
    input: IntakeFormSubmissionInput,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeForm.hasPermission({
      permission: ERP_INTAKE_FORM_SUBJECT_PERMISSIONS.USER_CREATE_SUBMISSION,
      resourceId: input.formId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to create a submission for this intake form',
      );
    }

    // Validate that the form exists before accepting submission
    const form = await this.formModel.getIntakeFormById(input.formId);
    if (!form) {
      throw new Error('Intake form not found');
    }
    if (!form.isActive) {
      throw new Error('Intake form is not active');
    }

    // Verify user can read the buyer workspace if provided
    if (input.buyerWorkspaceId) {
      await this.authZ.workspace.hasPermissionOrThrow({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: input.buyerWorkspaceId,
        subjectId: user.id,
      });
    }

    return this.formSubmissionModel.withTransaction(async (session) => {
      const submission =
        await this.formSubmissionModel.createIntakeFormSubmission(
          input,
          session,
        );

      // Write both intake_form and submitter relations
      // submitter is user.id (real user or "ANONYMOUS")
      // On submit, submitter will be updated to the upserted user
      await this.authZ.intakeFormSubmission.writeIntakeFormSubmissionRelations({
        id: submission.id,
        formId: input.formId,
        userId: user.id,
      });

      // Write buyer workspace relation if provided
      if (input.buyerWorkspaceId) {
        await this.authZ.intakeFormSubmission.writeBuyerWorkspaceRelation({
          id: submission.id,
          buyerWorkspaceId: input.buyerWorkspaceId,
        });
      }

      return submission;
    });
  };

  listIntakeFormSubmissions = async (
    opts: {
      query: {
        workspaceId: string;
        intakeFormId?: string;
        excludeWithSalesOrder?: boolean;
      };
      pagination?: { page?: number; limit?: number };
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_INTAKE_FORM_SUBMISSIONS,
      resourceId: opts.query.workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to list intake form submissions',
      );
    }

    const { query, pagination } = opts;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;

    const [items, count] = await Promise.all([
      this.formSubmissionModel.listIntakeFormSubmissions(query, limit, page),
      this.formSubmissionModel.countIntakeFormSubmissions(query),
    ]);

    return {
      items,
      page: {
        number: page,
        size: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    };
  };

  listIntakeFormSubmissionsAsBuyer = async (
    opts: {
      query: {
        buyerWorkspaceId: string;
        intakeFormId?: string;
      };
      pagination?: { page?: number; limit?: number };
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS,
      resourceId: opts.query.buyerWorkspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to list intake form submissions for this buyer workspace',
      );
    }

    const { query, pagination } = opts;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;

    const [items, count] = await Promise.all([
      this.formSubmissionModel.listIntakeFormSubmissionsByBuyerWorkspace(
        query.buyerWorkspaceId,
        limit,
        page,
        query.intakeFormId,
      ),
      this.formSubmissionModel.countIntakeFormSubmissionsByBuyerWorkspace(
        query.buyerWorkspaceId,
        query.intakeFormId,
      ),
    ]);

    return {
      items,
      page: {
        number: page,
        size: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    };
  };

  getIntakeFormSubmissionById = async (
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to read this intake form submission',
      );
    }

    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(id);
    if (!submission) {
      throw new Error('Intake form submission not found');
    }
    return submission;
  };

  getIntakeFormSubmissionBySalesOrderId = async (
    salesOrderId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionBySalesOrderId(
        salesOrderId,
      );

    if (!submission) {
      throw new Error('Intake form submission not found for this sales order');
    }

    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: submission.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to read this intake form submission',
      );
    }

    return submission;
  };

  getIntakeFormSubmissionByPurchaseOrderId = async (
    purchaseOrderId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionByPurchaseOrderId(
        purchaseOrderId,
      );

    if (!submission) {
      throw new Error(
        'Intake form submission not found for this purchase order',
      );
    }

    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: submission.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to read this intake form submission',
      );
    }

    return submission;
  };

  updateIntakeFormSubmission = async (
    id: string,
    update: {
      userId?: string | null;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      companyName?: string | null;
      purchaseOrderNumber?: string | null;
      salesOrderId?: string | null;
      purchaseOrderId?: string | null;
      buyerWorkspaceId?: string | null;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to update this intake form submission',
      );
    }

    // Check if submission exists
    const existingSubmission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(id);
    if (!existingSubmission) {
      throw new Error('Intake form submission not found');
    }

    // Note: Removed validation that prevented editing submitted forms
    // Users can now update submissions regardless of status

    // Verify user can read the buyer workspace if provided (and not clearing it)
    if (update.buyerWorkspaceId) {
      await this.authZ.workspace.hasPermissionOrThrow({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: update.buyerWorkspaceId,
        subjectId: user.id,
      });
    }

    return this.formSubmissionModel.withTransaction(async (session) => {
      const submission =
        await this.formSubmissionModel.updateIntakeFormSubmission(
          id,
          update,
          session,
        );
      if (!submission) {
        throw new Error('Intake form submission not found');
      }

      // If salesOrderId is being set, write the SpiceDB relation
      if (
        update.salesOrderId &&
        update.salesOrderId !== existingSubmission.salesOrderId
      ) {
        await this.authZ.salesOrder.writeRelation({
          resourceId: update.salesOrderId,
          relation:
            ERP_SALES_ORDER_SUBJECT_RELATIONS.INTAKE_FORM_SUBMISSION_INTAKE_FORM_SUBMISSION,
          subjectId: id,
        });
      }

      // Handle buyerWorkspaceId changes for SpiceDB relation
      if ('buyerWorkspaceId' in update) {
        const oldBuyerWorkspaceId = existingSubmission.buyerWorkspaceId;
        const newBuyerWorkspaceId = update.buyerWorkspaceId;

        // If clearing the buyer workspace or changing it, delete the old relation
        if (
          oldBuyerWorkspaceId &&
          oldBuyerWorkspaceId !== newBuyerWorkspaceId
        ) {
          await this.authZ.intakeFormSubmission.deleteBuyerWorkspaceRelation({
            id,
          });
        }

        // If setting a new buyer workspace, write the new relation
        if (
          newBuyerWorkspaceId &&
          newBuyerWorkspaceId !== oldBuyerWorkspaceId
        ) {
          await this.authZ.intakeFormSubmission.writeBuyerWorkspaceRelation({
            id,
            buyerWorkspaceId: newBuyerWorkspaceId,
          });
        }
      }

      return submission;
    });
  };

  listOrphanedSubmissions = async (
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<IntakeFormSubmissionDTO[]> => {
    if (!user.id) {
      throw new Error(
        'User must be authenticated to list orphaned submissions',
      );
    }

    return this.formSubmissionModel.findOrphanedSubmissionsByUserId(user.id);
  };

  adoptOrphanedSubmissions = async (
    workspaceId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
    submissionIds?: string[],
  ): Promise<{
    adoptedCount: number;
    adoptedSubmissionIds: string[];
    adoptedSubmissions: IntakeFormSubmissionDTO[];
  }> => {
    // Verify user can access this workspace
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_BUYER_INTAKE_FORM_SUBMISSIONS,
      resourceId: workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to adopt submissions for this workspace',
      );
    }

    // Find orphaned submissions for this user
    const allOrphanedSubmissions =
      await this.formSubmissionModel.findOrphanedSubmissionsByUserId(user.id);

    // Determine which submissions to adopt
    let submissionsToAdopt = allOrphanedSubmissions;

    if (submissionIds && submissionIds.length > 0) {
      // Filter to only requested IDs, validating they are all orphaned
      const orphanedIds = new Set(allOrphanedSubmissions.map((s) => s.id));
      const invalidIds = submissionIds.filter((id) => !orphanedIds.has(id));

      if (invalidIds.length > 0) {
        throw new Error(
          `Invalid or non-orphaned submission IDs: ${invalidIds.join(', ')}`,
        );
      }

      const requestedIds = new Set(submissionIds);
      submissionsToAdopt = allOrphanedSubmissions.filter((s) =>
        requestedIds.has(s.id),
      );
    }

    // Return early if none (idempotent)
    if (submissionsToAdopt.length === 0) {
      return {
        adoptedCount: 0,
        adoptedSubmissionIds: [],
        adoptedSubmissions: [],
      };
    }

    const idsToAdopt = submissionsToAdopt.map((s) => s.id);

    // Update with transaction
    return this.formSubmissionModel.withTransaction(async (session) => {
      // Update MongoDB
      await this.formSubmissionModel.bulkSetBuyerWorkspaceId(
        idsToAdopt,
        workspaceId,
        session,
      );

      // Write SpiceDB relations for each submission
      await Promise.all(
        idsToAdopt.map((id) =>
          this.authZ.intakeFormSubmission.writeBuyerWorkspaceRelation({
            id,
            buyerWorkspaceId: workspaceId,
          }),
        ),
      );

      // Re-fetch updated submissions
      const adoptedSubmissions = await Promise.all(
        idsToAdopt.map((id) =>
          this.formSubmissionModel.getIntakeFormSubmissionById(id, session),
        ),
      );

      return {
        adoptedCount: idsToAdopt.length,
        adoptedSubmissionIds: idsToAdopt,
        adoptedSubmissions: adoptedSubmissions.filter(
          (s): s is IntakeFormSubmissionDTO => s !== null,
        ),
      };
    });
  };

  submitIntakeFormSubmission = async (
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to submit this intake form submission',
      );
    }

    // Fetch submission to validate required fields before submitting
    const existingSubmission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(id);
    if (!existingSubmission) {
      throw new Error('Intake form submission not found');
    }

    // Validate required fields are set
    const missingFields: string[] = [];
    if (!existingSubmission.name) {
      missingFields.push('name');
    }
    if (!existingSubmission.email) {
      missingFields.push('email');
    }
    if (missingFields.length > 0) {
      throw new Error(
        `Cannot submit intake form: missing required fields: ${missingFields.join(', ')}`,
      );
    }

    // Upsert user by email so they can view their submission later
    // We know email is defined because we validated it above
    const [upsertedUser] = await this.usersService.upsertUsersByEmail([
      existingSubmission.email!,
    ]);

    // Use transaction to ensure MongoDB updates and SpiceDB relation are consistent
    return this.formSubmissionModel.withTransaction(async (session) => {
      // Update submission with userId
      await this.formSubmissionModel.updateIntakeFormSubmission(
        id,
        { userId: upsertedUser._id },
        session,
      );

      // Write submitter relation to SpiceDB
      await this.authZ.intakeFormSubmission.writeSubmitterRelation({
        id,
        userId: upsertedUser._id,
      });

      // Submit the form (change status to SUBMITTED)
      const submission =
        await this.formSubmissionModel.submitIntakeFormSubmission(id, session);
      if (!submission) {
        throw new Error(
          'Intake form submission not found or already submitted',
        );
      }
      return submission;
    });
  };

  // Line Item CRUD Operations
  createLineItem = async (
    submissionId: string,
    input: IntakeFormLineItemInput,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<LineItem> => {
    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: submissionId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to add line items to this submission',
      );
    }

    // Get the submission to verify it exists and get workspaceId
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(submissionId);

    if (!submission) {
      throw new Error('Intake form submission not found');
    }

    // Check if submission is already submitted
    if (submission.status === 'SUBMITTED') {
      throw new Error(
        'Cannot add line items to a submitted intake form submission',
      );
    }

    const startAt = input.rentalStartDate ?? input.startDate;
    const endAt =
      input.rentalEndDate ??
      new Date(startAt.getTime() + input.durationInDays * 24 * 60 * 60 * 1000);

    // Calculate subtotal for the line item
    const subtotalInCents = await this.calculateLineItemSubtotal(
      {
        ...input,
        rentalStartDate: startAt,
        rentalEndDate: endAt,
      },
      user,
    );

    const delivery =
      input.deliveryMethod || input.deliveryLocation || input.deliveryNotes
        ? {
            method: input.deliveryMethod ?? null,
            location: input.deliveryLocation ?? null,
            notes: input.deliveryNotes ?? null,
          }
        : null;

    // Create the line item with calculated subtotal
    const lineItem = await this.lineItemsService.createLineItem(
      {
        workspaceId: submission.workspaceId,
        documentRef: { type: 'INTAKE_SUBMISSION', id: submissionId },
        type: input.type === 'PURCHASE' ? 'SALE' : 'RENTAL',
        description: input.description,
        quantity: input.quantity.toString(),
        unitCode: null,
        productRef: { kind: 'PIM_CATEGORY', productId: input.pimCategoryId },
        timeWindow: { startAt, endAt },
        placeRef: null,
        constraints: null,
        inputs: null,
        pricingRef: input.priceId ? { priceId: input.priceId } : null,
        pricingSpecSnapshot: null,
        rateInCentsSnapshot: null,
        subtotalInCents,
        delivery,
        deliveryChargeInCents: null,
        notes: null,
        targetSelectors: null,
        intakeFormSubmissionLineItemId: null,
        quoteRevisionLineItemId: null,
        sourceLineItemId: null,
        status: 'DRAFT',
        customPriceName: input.customPriceName ?? null,
      },
      user,
    );

    // Recalculate submission total
    await this.recalculateSubmissionTotal(submissionId, user);

    return lineItem;
  };

  updateLineItem = async (
    lineItemId: string,
    updates: Partial<IntakeFormLineItemInput>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<LineItem> => {
    // Get the line item to find the submission ID
    const lineItem = await this.lineItemsService.getLineItemById(
      lineItemId,
      user,
    );
    if (!lineItem) {
      throw new Error('Line item not found');
    }
    if (lineItem.documentRef.type !== 'INTAKE_SUBMISSION') {
      throw new Error('Line item does not belong to an intake form submission');
    }

    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: lineItem.documentRef.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to update this line item');
    }

    // Check if submission is already submitted
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(
        lineItem.documentRef.id,
      );
    if (!submission) {
      throw new Error('Intake form submission not found');
    }

    if (submission.status === 'SUBMITTED') {
      throw new Error(
        'Cannot update line items on a submitted intake form submission',
      );
    }

    // Check if any pricing-related fields are being updated
    const pricingFields = [
      'priceId',
      'type',
      'quantity',
      'durationInDays',
      'rentalStartDate',
      'rentalEndDate',
    ] as const;
    const hasPricingChanges = pricingFields.some(
      (field) => field in updates && updates[field] !== undefined,
    );

    const currentRequestType: 'RENTAL' | 'PURCHASE' =
      lineItem.type === 'SALE' ? 'PURCHASE' : 'RENTAL';
    const currentQuantity = Number(lineItem.quantity);
    const currentStartAt = lineItem.timeWindow?.startAt ?? null;
    const currentEndAt = lineItem.timeWindow?.endAt ?? null;
    const currentDurationInDays =
      currentStartAt && currentEndAt
        ? Math.max(
            1,
            Math.round(
              (currentEndAt.getTime() - currentStartAt.getTime()) /
                (24 * 60 * 60 * 1000),
            ),
          )
        : 1;

    // Calculate new subtotal if pricing fields changed
    let subtotalInCents: number | undefined;
    if (hasPricingChanges) {
      // Merge existing line item with updates for calculation
      const mergedLineItem: IntakeFormLineItemInput = {
        startDate: currentStartAt ?? new Date(),
        description: lineItem.description,
        quantity: Number.isFinite(currentQuantity) ? currentQuantity : 1,
        durationInDays: currentDurationInDays,
        type: currentRequestType,
        pimCategoryId: lineItem.productRef?.productId ?? '',
        priceId: lineItem.pricingRef?.priceId ?? undefined,
        customPriceName: lineItem.customPriceName ?? undefined,
        deliveryMethod: (lineItem.delivery?.method ?? 'PICKUP') as
          | 'PICKUP'
          | 'DELIVERY',
        deliveryLocation: lineItem.delivery?.location ?? undefined,
        deliveryNotes: lineItem.delivery?.notes ?? undefined,
        rentalStartDate: currentStartAt ?? undefined,
        rentalEndDate: currentEndAt ?? undefined,
        ...updates,
      };
      subtotalInCents = await this.calculateLineItemSubtotal(
        mergedLineItem,
        user,
      );
    }

    const nextType =
      updates.type === undefined
        ? lineItem.type
        : updates.type === 'PURCHASE'
          ? 'SALE'
          : 'RENTAL';

    const nextQuantity =
      updates.quantity === undefined
        ? lineItem.quantity
        : updates.quantity.toString();

    const nextProductRef =
      updates.pimCategoryId === undefined
        ? lineItem.productRef ?? null
        : { kind: 'PIM_CATEGORY' as const, productId: updates.pimCategoryId };

    const nextPricingRef =
      updates.priceId === undefined
        ? lineItem.pricingRef ?? null
        : updates.priceId
          ? { priceId: updates.priceId }
          : null;

    const nextDelivery =
      updates.deliveryMethod === undefined &&
      updates.deliveryLocation === undefined &&
      updates.deliveryNotes === undefined
        ? lineItem.delivery ?? null
        : {
            method: (updates.deliveryMethod ?? lineItem.delivery?.method) ?? null,
            location:
              (updates.deliveryLocation ?? lineItem.delivery?.location) ?? null,
            notes: (updates.deliveryNotes ?? lineItem.delivery?.notes) ?? null,
          };

    const timeWindowPatch: any = {};
    if (updates.rentalStartDate !== undefined) {
      timeWindowPatch.startAt = updates.rentalStartDate;
    }
    if (updates.rentalEndDate !== undefined) {
      timeWindowPatch.endAt = updates.rentalEndDate;
    }
    if (updates.startDate !== undefined) {
      timeWindowPatch.startAt = updates.startDate;
    }
    if (updates.durationInDays !== undefined) {
      const start = timeWindowPatch.startAt ?? lineItem.timeWindow?.startAt;
      if (start) {
        timeWindowPatch.endAt = new Date(
          start.getTime() + updates.durationInDays * 24 * 60 * 60 * 1000,
        );
      }
    }
    const nextTimeWindow =
      Object.keys(timeWindowPatch).length > 0
        ? {
            startAt:
              timeWindowPatch.startAt ?? lineItem.timeWindow?.startAt ?? null,
            endAt: timeWindowPatch.endAt ?? lineItem.timeWindow?.endAt ?? null,
          }
        : lineItem.timeWindow ?? null;

    const updated = await this.lineItemsService.updateLineItem(
      lineItemId,
      {
        ...(updates.description !== undefined && { description: updates.description }),
        type: nextType,
        quantity: nextQuantity,
        productRef: nextProductRef,
        pricingRef: nextPricingRef,
        timeWindow: nextTimeWindow,
        delivery: nextDelivery,
        ...(subtotalInCents !== undefined && { subtotalInCents }),
        ...(updates.customPriceName !== undefined && {
          customPriceName: updates.customPriceName ?? null,
        }),
      },
      user,
    );

    if (!updated) {
      throw new Error('Failed to update line item');
    }

    // Recalculate submission total if subtotal changed
    if (hasPricingChanges) {
      await this.recalculateSubmissionTotal(lineItem.documentRef.id, user);
    }

    return updated;
  };

  deleteLineItem = async (
    lineItemId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<boolean> => {
    // Get the line item to find the submission ID
    const lineItem = await this.lineItemsService.getLineItemById(
      lineItemId,
      user,
    );
    if (!lineItem) {
      throw new Error('Line item not found');
    }
    if (lineItem.documentRef.type !== 'INTAKE_SUBMISSION') {
      throw new Error('Line item does not belong to an intake form submission');
    }

    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: lineItem.documentRef.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('User does not have permission to delete this line item');
    }

    // Check if submission is already submitted
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(
        lineItem.documentRef.id,
      );
    if (!submission) {
      throw new Error('Intake form submission not found');
    }

    if (submission.status === 'SUBMITTED') {
      throw new Error(
        'Cannot delete line items from a submitted intake form submission',
      );
    }

    await this.lineItemsService.softDeleteLineItem(lineItemId, user);

    // Recalculate submission total after deletion
    await this.recalculateSubmissionTotal(lineItem.documentRef.id, user);

    return true;
  };

  getLineItemById = async (
    lineItemId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<LineItem> => {
    const lineItem = await this.lineItemsService.getLineItemById(
      lineItemId,
      user,
    );
    if (!lineItem) throw new Error('Line item not found');
    if (lineItem.documentRef.type !== 'INTAKE_SUBMISSION') {
      throw new Error('Line item does not belong to an intake form submission');
    }
    return lineItem;
  };

  getLineItemsBySubmissionId = async (
    submissionId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<LineItem[]> => {
    // Check permission on the submission
    const hasPermission = await this.authZ.intakeFormSubmission.hasPermission({
      permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: submissionId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        'User does not have permission to read line items for this submission',
      );
    }

    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(submissionId);
    if (!submission) {
      throw new Error('Intake form submission not found');
    }

    return this.lineItemsService.listLineItemsByDocumentRef(
      submission.workspaceId,
      { type: 'INTAKE_SUBMISSION', id: submissionId },
      user,
    );
  };

  /**
   * Calculate subtotal for a line item based on its priceId.
   * Returns 0 if no priceId (custom price item) or if price not found.
   */
  private async calculateLineItemSubtotal(
    lineItem: {
      priceId?: string;
      type: 'RENTAL' | 'PURCHASE';
      quantity: number;
      durationInDays: number;
      startDate?: Date;
      rentalStartDate?: Date;
      rentalEndDate?: Date;
    },
    user: UserAuthPayload,
  ): Promise<number> {
    // If no priceId, return 0 (custom price item)
    if (!lineItem.priceId) {
      return 0;
    }

    // Fetch the price
    const price = await this.pricesService.getPriceById(lineItem.priceId, user);
    if (!price) {
      return 0; // Price not found, default to 0
    }

    if (lineItem.type === 'RENTAL' && price.priceType === 'RENTAL') {
      const startAt = lineItem.rentalStartDate ?? lineItem.startDate;
      const endAt =
        lineItem.rentalEndDate ??
        (startAt
          ? new Date(
              startAt.getTime() +
                lineItem.durationInDays * 24 * 60 * 60 * 1000,
            )
          : undefined);
      if (!startAt || !endAt) {
        return 0;
      }
      // Use price engine for rental calculation
      const result = this.priceEngineService.calculateOptimalCost({
        startDate: startAt,
        endDate: endAt,
        pricePer1DayInCents: price.pricePerDayInCents,
        pricePer7DaysInCents: price.pricePerWeekInCents,
        pricePer28DaysInCents: price.pricePerMonthInCents,
      });
      return Math.round(result.costInCents * lineItem.quantity);
    } else if (lineItem.type === 'PURCHASE' && price.priceType === 'SALE') {
      // Sale calculation: unit cost * quantity
      return Math.round(price.unitCostInCents * lineItem.quantity);
    }

    // Type mismatch or unknown type
    return 0;
  }

  /**
   * Recalculate and update the total for a submission based on all its line items.
   */
  private async recalculateSubmissionTotal(
    submissionId: string,
    user: UserAuthPayload,
  ): Promise<void> {
    const submission =
      await this.formSubmissionModel.getIntakeFormSubmissionById(submissionId);
    if (!submission) return;
    const items = await this.lineItemsService.listLineItemsByDocumentRef(
      submission.workspaceId,
      { type: 'INTAKE_SUBMISSION', id: submissionId },
      user,
    );
    const total = items.reduce(
      (sum, item) => sum + (item.subtotalInCents ?? 0),
      0,
    );
    await this.formSubmissionModel.updateSubmissionTotal(submissionId, total);
  }
}

export const createRequestFormService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  authZ: AuthZ;
  lineItemsService: LineItemsService;
  emailService: EmailService;
  priceEngineService: PriceEngineService;
  pricesService: PricesService;
  usersService: UsersService;
}) => {
  const formModel = createIntakeFormModel(config);
  const formSubmissionModel = createIntakeFormSubmissionModel(config);

  const intakeFormService = new IntakeFormService({
    formModel,
    formSubmissionModel,
    lineItemsService: config.lineItemsService,
    authZ: config.authZ,
    emailService: config.emailService,
    priceEngineService: config.priceEngineService,
    pricesService: config.pricesService,
    usersService: config.usersService,
  });

  return intakeFormService;
};
