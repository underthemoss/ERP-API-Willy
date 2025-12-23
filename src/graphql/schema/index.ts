import path from 'path';
import { makeSchema, extendType } from 'nexus';
import { EnvConfig } from '../../config';

// schemas
import * as commonSchema from './common';
import * as erpSchema from './erp-types';
import * as mutationsSchema from './mutations';
import * as queriesSchema from './queries';
import * as userSchema from './user';
import * as workspaceSchema from './workspaces';
import * as contactsSchema from './contacts';
import * as assetsSchema from './assets';
import * as pimProductsSchema from './pim-products';
import * as pimCategoriesSchema from './pim-categories';
import * as pricesSchema from './prices';
import * as projectsSchema from './projects';
import * as salesOrdersSchema from './sales-orders';
import * as assetSchedulesSchema from './asset-schedules';
import * as resourceMapSchema from './resource-map';
import * as purchaseOrdersSchema from './purchase-orders';
import * as fileServiceSchema from './file-service';
import * as pdfServiceSchema from './pdf-service';
import * as notesSchema from './notes';
import * as fulfilmentSchema from './fulfilment';
import * as invoicesSchema from './invoices';
import * as workflowConfigurationSchema from './workflow-configuration';
import * as llmSchema from './llm';
import * as chargesSchema from './charges';
import * as inventorySchema from './inventory';
import * as referenceNumbersSchema from './reference-numbers';
import * as intakeFormsSchema from './intake-forms';
import * as auth0ManagementSchema from './auth0-management';
import * as brandfetchSchema from './brandfetch';
import * as adminSchema from './admin';
import * as sendGridAdminSchema from './sendgrid-admin';
import * as domainsSchema from './domains';
import * as permissionsSchema from './permissions';
import * as subscriptionsSchema from './subscriptions';
import * as searchSchema from './search';
import * as rentalViewsSchema from './rental-views';
import * as quotingSchema from './quoting';
import * as globalAttributesSchema from './global-attributes';

export const buildNexusSchema = (opts: { envConfig: EnvConfig }) => {
  const { envConfig } = opts;
  const helloWorldTypes = extendType({
    type: 'Query',
    definition(t) {
      t.string('helloWorld', {
        resolve: () => 'Hello world!',
      });
    },
  });

  return makeSchema({
    types: [
      helloWorldTypes,
      commonSchema,
      erpSchema,
      mutationsSchema,
      queriesSchema,
      userSchema,
      workspaceSchema,
      contactsSchema,
      assetsSchema,
      pimProductsSchema,
      pimCategoriesSchema,
      pricesSchema,
      projectsSchema,
      salesOrdersSchema,
      assetSchedulesSchema,
      resourceMapSchema,
      purchaseOrdersSchema,
      fileServiceSchema,
      pdfServiceSchema,
      notesSchema,
      workflowConfigurationSchema,
      llmSchema,
      fulfilmentSchema,
      invoicesSchema,
      chargesSchema,
      inventorySchema,
      referenceNumbersSchema,
      intakeFormsSchema,
      auth0ManagementSchema,
      brandfetchSchema,
      adminSchema,
      sendGridAdminSchema,
      domainsSchema,
      permissionsSchema,
      subscriptionsSchema,
      searchSchema,
      rentalViewsSchema,
      quotingSchema,
      globalAttributesSchema,
    ],
    shouldGenerateArtifacts: envConfig.GENERATE_NEXUS_ARTIFACTS,
    outputs: {
      schema: path.join(
        process.cwd(),
        'src/graphql/schema/generated/schema.graphql',
      ),
      typegen: path.join(
        process.cwd(),
        'src/graphql/schema/generated/nexus-typegen.ts',
      ),
    },
    contextType: {
      module: path.join(process.cwd(), 'src/graphql/context.ts'),
      export: 'GraphQLContext',
    },
  });
};
