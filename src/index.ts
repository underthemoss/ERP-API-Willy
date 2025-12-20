import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { gqlPlugin } from './graphql';
import { getEnvConfig } from './config';
import cors from '@fastify/cors';
import { createTransactionService } from './services/transactions';
import { createWorkspaceService } from './services/workspaces';
import { createContactsService } from './services/contacts';
import { authPlugin } from './plugins/authentication';
import { SYSTEM_USER_JWT_PAYLOAD } from './authentication';
import { createAssetsService } from './services/assets';
import { createCompaniesService } from './services/companies';
import { createUsersService } from './services/users';
import { createT3UsersService } from './services/t3user';
import { createPimProductsService } from './services/pim_products';
import { createResourceMapResourcesService } from './services/resource_map';
import { createPricesService } from './services/prices';
import { createPimCategoriesService } from './services/pim_categories';
import { createProjectsService } from './services/projects';
import { createNotesService } from './services/notes';
import { createSalesOrdersService } from './services/sales_orders';
import { createAssetSchedulesService } from './services/asset_schedules';
import { createPulseService } from './services/pulse_cron_jobs';
import { createPurchaseOrdersService } from './services/purchase_orders';
import { createFileService } from './services/file_service';
import { createPdfService } from './services/pdf_service';
import { createPriceEngineService } from './services/price_engine';
import { createWorkflowConfigurationService } from './services/workflow_configuration';
import { createFulfilmentService } from './services/fulfilment';
import { LlmService } from './services/llm/index';
import { createImageGeneratorService } from './services/image_generator';
import { createInvoiceService } from './services/invoices';
import { createChargeService } from './services/charges';
import { createInventoryService } from './services/inventory';
import { createReferenceNumberService } from './services/reference-numbers';
import { logger } from './lib/logger';
import { createAuthZ } from './lib/authz';
import { getRedisClient } from './redis';
import auth0WebhooksPlugin from './plugins/webhooks/auth0';
import { createRequestFormService } from './services/intake-forms';
import { createAuth0ManagementService } from './services/auth0_management';
import { createBrandfetchService } from './services/brandfetch';
import { DomainsService } from './services/domains';
import { createEmailService } from './services/email';
import { createSendGridAdminService } from './services/sendgrid_admin';
import { createSearchService } from './services/search';
import { createViewService } from './services/views';
import { createQuotingService } from './services/quoting';
import searchKitPlugin from './plugins/searchkit';
import imageGeneratorPlugin from './plugins/image-generator';
import agentPlugin from './plugins/agent';
import { pdfViewerPlugin } from './plugins/pdf-viewer';
import mcpPlugin from './plugins/mcp';
import { startCurrentTimePublisher } from './services/simple-pubsub';
import { createOpenSearchService } from './services/opensearch';
import { createJWTService } from './services/jwt';

async function startMainMode() {
  const startTime = Date.now();
  const envConfig = getEnvConfig();

  // Wave 1: Initialize core infrastructure in parallel
  logger.info('Initializing core infrastructure...');
  const [mongoClient, redisClient, kafkaClient] = await Promise.all([
    (async () => {
      const client = new MongoClient(envConfig.MONGO_CONNECTION_STRING, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
      });
      await client.connect();
      return client;
    })(),
    Promise.resolve(
      getRedisClient({
        REDIS_HOST: envConfig.REDIS_HOST,
        REDIS_PORT: envConfig.REDIS_PORT,
        ENABLE_REDIS_AUTO_PIPELINING: true,
      }),
    ),
    Promise.resolve(
      new KafkaJS.Kafka({
        kafkaJS: {
          brokers: [envConfig.KAFKA_API_URL],
          ...(envConfig.KAFKA_API_URL.includes('localhost')
            ? {}
            : {
                ssl: true,
                sasl: {
                  mechanism: 'plain',
                  username: envConfig.KAFKA_API_KEY,
                  password: envConfig.KAFKA_API_SECRET,
                },
              }),
        },
      }),
    ),
  ]);

  const authZ = createAuthZ({
    spicedbEndpoint: envConfig.SPICEDB_ENDPOINT,
    spicedbToken: envConfig.SPICEDB_TOKEN,
    redisClient,
  });

  const jwtService = createJWTService(envConfig);

  // Create OpenSearchService (owns both raw OpenSearch client and Searchkit indexes)
  const openSearchService = createOpenSearchService({ envConfig, authZ });

  const transactionService = createTransactionService({
    mongoClient,
  });

  // Initialize Pulse and Email services in parallel
  const [pulseService, emailService] = await Promise.all([
    createPulseService({ envConfig, mongoClient }),
    Promise.resolve(createEmailService(envConfig, mongoClient)),
  ]);

  logger.info(
    `Core infrastructure ready in ${Math.round((Date.now() - startTime) / 1000)}s`,
  );

  // Wave 2: Initialize independent services in parallel
  logger.info('Initializing independent services...');
  const resourceMapResourcesService = await createResourceMapResourcesService({
    envConfig,
    mongoClient,
    kafkaClient,
  });

  const [
    usersService,
    assetsService,
    companiesService,
    pimProductsService,
    pimCategoriesService,
    fileService,
    assetSchedulesService,
    brandfetchService,
    workflowConfigurationService,
    inventoryService,
    contactsService,
    priceEngineService,
    domainsService,
    llmService,
    imageGeneratorService,
    viewService,
  ] = await Promise.all([
    createUsersService({ envConfig, mongoClient }),
    createAssetsService({ envConfig, mongoClient, kafkaClient }),
    createCompaniesService({ envConfig, mongoClient, kafkaClient }),
    createPimProductsService({
      envConfig,
      mongoClient,
      kafkaClient,
      openSearchService,
    }),
    createPimCategoriesService({ envConfig, mongoClient, kafkaClient }),
    createFileService({ mongoClient, envConfig, authZ }),
    createAssetSchedulesService({ mongoClient }),
    createBrandfetchService({ envConfig, mongoClient }),
    Promise.resolve(createWorkflowConfigurationService({ mongoClient })),
    createInventoryService({
      mongoClient,
      envConfig,
      kafkaClient,
      resourceMapResourcesService,
    }),
    createContactsService({
      envConfig,
      mongoClient,
      authZ,
      resourceMapResourcesService,
    }),
    createPriceEngineService({}),
    Promise.resolve(new DomainsService()),
    Promise.resolve(new LlmService()),
    Promise.resolve(createImageGeneratorService(envConfig)),
    Promise.resolve(createViewService({ mongoClient })),
  ]);

  // T3UsersService doesn't return a value but needs to be awaited
  await createT3UsersService({ envConfig, mongoClient, kafkaClient });

  logger.info(
    `Independent services ready in ${Math.round((Date.now() - startTime) / 1000)}s`,
  );

  // Wave 3: Initialize services with dependencies in parallel
  logger.info('Initializing dependent services...');
  const [
    workspaceService,
    pricesService,
    projectsService,
    notesService,
    auth0ManagementService,
    sendGridAdminService,
    searchService,
  ] = await Promise.all([
    createWorkspaceService({
      envConfig,
      mongoClient,
      authZ,
      usersService,
      emailService,
    }),
    Promise.resolve(
      createPricesService({
        mongoClient,
        fileService,
        authZ,
        pimCategoriesService,
        priceEngineService,
      }),
    ),
    createProjectsService({ mongoClient, authZ }),
    createNotesService({ mongoClient, authz: authZ }),
    Promise.resolve(createAuth0ManagementService({ envConfig, authZ })),
    Promise.resolve(
      createSendGridAdminService({ envConfig, authZ, mongoClient }),
    ),
    createSearchService({ mongoClient, envConfig, authZ }),
  ]);

  // Create intake form service after pricesService is available
  const intakeFormService = await createRequestFormService({
    envConfig,
    mongoClient,
    authZ,
    emailService,
    priceEngineService,
    pricesService,
    usersService,
  });

  // Initialize reference number service with dependencies from Wave 2 and Wave 3
  const referenceNumberService = createReferenceNumberService({
    mongoClient,
    projectsService,
    contactsService,
    authZ,
  });

  const pdfService = await createPdfService({
    fileService,
    envConfig,
    pulseService,
    authZ,
  });

  const quotingService = await createQuotingService({
    envConfig,
    mongoClient,
    priceEngineService,
    pricesService,
    authZ,
  });

  logger.info(
    `Dependent services ready in ${Math.round((Date.now() - startTime) / 1000)}s`,
  );

  // Wave 4: Initialize complex services that depend on many others
  logger.info('Initializing complex services...');
  const [salesOrdersService, chargeService] = await Promise.all([
    createSalesOrdersService({
      mongoClient,
      priceEngineService,
      pricesService,
      authZ,
    }),
    createChargeService({ envConfig, mongoClient, authz: authZ }),
  ]);

  const fulfilmentService = await createFulfilmentService({
    mongoClient,
    salesOrdersService,
    pricesService,
    priceEngineService,
    chargeService,
    pulseService,
    authZ,
    systemUser: SYSTEM_USER_JWT_PAYLOAD,
    inventoryService,
  });

  const [purchaseOrdersService, invoiceService] = await Promise.all([
    createPurchaseOrdersService({
      mongoClient,
      authZ,
      priceEngineService,
      pricesService,
      inventoryService,
      pimProductsService,
      pimCategoriesService,
      fulfilmentService,
    }),
    Promise.resolve(
      createInvoiceService({ mongoClient, chargeService, authZ }),
    ),
  ]);

  logger.info(
    `All services initialized in ${Math.round((Date.now() - startTime) / 1000)}s`,
  );

  const fastify = Fastify({
    loggerInstance: logger,
  });

  fastify.register(fastifyCookie);

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5000',
        'https://staging-erp.estrack.com',
        'https://erp.estrack.com',
        'https://api.equipmentshare.com',
        'https://staging-mesh.internal.equipmentshare.com',
        'https://es-erp.vercel.app',
        'https://es-erp-env-staging-equipmentshare.vercel.app',
      ];
      // Check if origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin matches any Vercel app pattern
      // Pattern: https://*equipmentshare.vercel.app (anything before equipmentshare)
      const vercelPattern = /^https:\/\/.*equipmentshare\.vercel\.app$/;
      if (vercelPattern.test(origin)) {
        return callback(null, true);
      }

      if (
        envConfig.LEVEL !== 'prod' &&
        origin.startsWith('https://studio.apollographql.com')
      ) {
        return callback(null, true);
      }
      // Reject all other origins
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  fastify.register(authPlugin, {
    envConfig,
  });

  // Register PDF Viewer plugin
  fastify.register(pdfViewerPlugin, {
    envConfig,
    fileService,
  });

  // Register Auth0 webhooks plugin
  fastify.register(auth0WebhooksPlugin, {
    envConfig,
    services: {
      usersService,
      authZ,
      domainsService,
      envConfig,
    },
  });

  // Register SearchKit plugin
  fastify.register(searchKitPlugin, {
    openSearchService,
    authZ,
  });

  // Register Image Generator plugin
  fastify.register(imageGeneratorPlugin, {
    imageGeneratorService,
    pricesService,
    pimProductsService,
    pimCategoriesService,
  });

  // Register Agent plugin (AI chat with OpenAI)
  fastify.register(agentPlugin, {
    openaiApiKey: envConfig.OPENAI_API_KEY,
  });

  // Register MCP plugin (Model Context Protocol server)
  // The MCP tools use the GraphQL API internally for consistent authorization
  fastify.register(mcpPlugin, {});

  fastify.register(gqlPlugin, {
    envConfig,
    systemUser: SYSTEM_USER_JWT_PAYLOAD,
    authZ,
    services: {
      transactionService,
      workspaceService,
      contactsService,
      assetsService,
      companiesService,
      usersService,
      pimProductsService,
      resourceMapResourcesService,
      pricesService,
      pimCategoriesService,
      projectsService,
      salesOrdersService,
      purchaseOrdersService,
      assetSchedulesService,
      pulseService,
      fileService,
      pdfService,
      notesService,
      priceEngineService,
      workflowConfigurationService,
      fulfilmentService,
      llmService,
      imageGeneratorService,
      invoiceService,
      chargeService,
      inventoryService,
      referenceNumberService,
      intakeFormService,
      auth0ManagementService,
      sendGridAdminService,
      brandfetchService,
      domainsService,
      emailService,
      searchService,
      viewService,
      quotingService,
      jwtService,
    },
  });

  fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' };
  });

  fastify.get('/health', async function handler(request, reply) {
    return { healthy: true };
  });

  try {
    await fastify.listen({ port: envConfig.PORT });

    // Start the subscription demo timer after server is up
    startCurrentTimePublisher();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Main entry point
async function start() {
  await startMainMode();
}

start().catch((error) => {
  logger.error(error, 'Failed to start application');
  process.exit(1);
});
