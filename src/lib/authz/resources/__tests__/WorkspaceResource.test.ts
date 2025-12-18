import { getTestEnvConfig } from '../../../../test/e2e/test-utils';
import { getRedisClient } from '../../../../redis';
import {
  createAuthZ,
  type AuthZ,
  ERP_GLOBAL_PLATFORM_ID,
  ERP_PLATFORM_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_CHARGE_SUBJECT_RELATIONS,
  ERP_CHARGE_SUBJECT_PERMISSIONS,
  ERP_CONTACT_SUBJECT_RELATIONS,
  ERP_CONTACT_SUBJECT_PERMISSIONS,
  ERP_FULFILMENT_SUBJECT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBJECT_RELATIONS,
  ERP_INTAKE_FORM_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_INVOICE_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS,
  ERP_PROJECT_SUBJECT_PERMISSIONS,
  ERP_PROJECT_SUBJECT_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
} from '../../index';
import { v4 } from 'uuid';
import { Redis } from 'ioredis';

describe('WorkspaceResource', () => {
  let redisClient: Redis;
  let authZ: AuthZ;

  beforeAll(async () => {
    const globalConfig = getTestEnvConfig();

    redisClient = getRedisClient({
      ENABLE_REDIS_AUTO_PIPELINING: true,
      REDIS_HOST: globalConfig.REDIS_HOST,
      REDIS_PORT: globalConfig.REDIS_PORT,
    });

    authZ = createAuthZ({
      redisClient,
      spicedbEndpoint: globalConfig.SPICEDB_ENDPOINT,
      spicedbToken: globalConfig.SPICEDB_TOKEN,
    });
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  describe('platform user_admin', () => {
    it('has all permissions on a workspace', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      for (const permission of Object.values(
        ERP_WORKSPACE_SUBJECT_PERMISSIONS,
      )) {
        if (permission === ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_JOIN) {
          continue;
        }

        const hasPermission = await authZ.workspace.hasPermission({
          resourceId: workspaceId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace charges', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const chargeId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.charge.writeRelation({
        resourceId: chargeId,
        relation: ERP_CHARGE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(ERP_CHARGE_SUBJECT_PERMISSIONS)) {
        const hasPermission = await authZ.charge.hasPermission({
          resourceId: chargeId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace contacts', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const contactId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.contact.writeRelation({
        resourceId: contactId,
        relation: ERP_CONTACT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(ERP_CONTACT_SUBJECT_PERMISSIONS)) {
        const hasPermission = await authZ.contact.hasPermission({
          resourceId: contactId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace fulfilments', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const fulfilmentId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.fulfilment.writeRelation({
        resourceId: fulfilmentId,
        relation: ERP_FULFILMENT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_FULFILMENT_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.fulfilment.hasPermission({
          resourceId: fulfilmentId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace intake forms', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const intakeFormId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.intakeForm.writeRelation({
        resourceId: intakeFormId,
        relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_INTAKE_FORM_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.intakeForm.hasPermission({
          resourceId: intakeFormId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace intake form submissions', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const intakeFormId = v4();
      const intakeFormSubmissionId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.intakeForm.writeRelation({
        resourceId: intakeFormId,
        relation: ERP_INTAKE_FORM_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      await authZ.intakeFormSubmission.writeRelation({
        resourceId: intakeFormSubmissionId,
        relation:
          ERP_INTAKE_FORM_SUBMISSION_SUBJECT_RELATIONS.INTAKE_FORM_INTAKE_FORM,
        subjectId: intakeFormId,
      });

      for (const permission of Object.values(
        ERP_INTAKE_FORM_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.intakeForm.hasPermission({
          resourceId: intakeFormId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace invoices', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const invoiceId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.invoice.writeRelation({
        resourceId: invoiceId,
        relation: ERP_INVOICE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(ERP_INVOICE_SUBJECT_PERMISSIONS)) {
        const hasPermission = await authZ.invoice.hasPermission({
          resourceId: invoiceId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace price books', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const priceBookId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.priceBook.writeRelation({
        resourceId: priceBookId,
        relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.priceBook.hasPermission({
          resourceId: priceBookId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace prices', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const priceId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.priceBookPrice.writeRelation({
        resourceId: priceId,
        relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.priceBookPrice.hasPermission({
          resourceId: priceId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace projects', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const projectId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.project.writeRelation({
        resourceId: projectId,
        relation: ERP_PROJECT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(ERP_PROJECT_SUBJECT_PERMISSIONS)) {
        const hasPermission = await authZ.project.hasPermission({
          resourceId: projectId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace purchase orders', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const purchaseOrderId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.purchaseOrder.writeRelation({
        resourceId: purchaseOrderId,
        relation: ERP_PURCHASE_ORDER_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.purchaseOrder.hasPermission({
          resourceId: purchaseOrderId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });

    it('has all permssion on workspace sale orders', async () => {
      const platformAdminUserId = v4();
      const workspaceId = v4();
      const saleOrderId = v4();
      await authZ.platform.writeRelation({
        resourceId: ERP_GLOBAL_PLATFORM_ID,
        relation: ERP_PLATFORM_SUBJECT_RELATIONS.USER_USER_ADMIN,
        subjectId: platformAdminUserId,
      });

      await authZ.workspace.writeRelation({
        resourceId: workspaceId,
        relation: ERP_WORKSPACE_SUBJECT_RELATIONS.PLATFORM_PLATFORM,
        subjectId: ERP_GLOBAL_PLATFORM_ID,
      });

      await authZ.salesOrder.writeRelation({
        resourceId: saleOrderId,
        relation: ERP_SALES_ORDER_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspaceId,
      });

      for (const permission of Object.values(
        ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
      )) {
        const hasPermission = await authZ.salesOrder.hasPermission({
          resourceId: saleOrderId,
          permission,
          subjectId: platformAdminUserId,
        });
        expect(hasPermission).toBe(true);
      }
    });
  });
});
