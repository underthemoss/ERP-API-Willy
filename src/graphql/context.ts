import { EnvConfig } from '../config';
import { MercuriusCommonOptions } from 'mercurius';
import { type TransactionService } from '../services/transactions';
import { type WorkspaceService } from '../services/workspaces';
import { type ContactsService } from '../services/contacts';
import { FulfilmentService } from '../services/fulfilment';
import { type UserAuthPayload } from '../authentication';
import { AssetsService } from '../services/assets';
import { CompaniesService } from '../services/companies';
import { UsersService } from '../services/users';
import { createDataLoaders } from './data-loaders';
import { PimProductsService } from '../services/pim_products';
import { ResourceMapResourcesService } from '../services/resource_map';
import { PricesService } from '../services/prices';
import { PimCategoriesService } from '../services/pim_categories';
import { ProjectsService } from '../services/projects';
import { NotesService } from '../services/notes';
import { SalesOrdersService } from '../services/sales_orders';
import { AssetSchedulesService } from '../services/asset_schedules';
import { PurchaseOrdersService } from '../services/purchase_orders';
import Pulse from '@pulsecron/pulse';
import { FileService } from '../services/file_service';
import { PdfService } from '../services/pdf_service';
import { PriceEngineService } from '../services/price_engine';
import { WorkflowConfigurationService } from '../services/workflow_configuration';
import { LlmService } from '../services/llm/index';
import { ImageGeneratorService } from '../services/image_generator';
import { InvoiceService } from '../services/invoices';
import { ChargeService } from '../services/charges';
import { InventoryService } from '../services/inventory';
import { ReferenceNumberService } from '../services/reference-numbers';
import { IntakeFormService } from '../services/intake-forms';
import { Auth0ManagementService } from '../services/auth0_management';
import { BrandfetchService } from '../services/brandfetch';
import { DomainsService } from '../services/domains';
import { EmailService } from '../services/email';
import { SendGridAdminService } from '../services/sendgrid_admin';
import { SearchService } from '../services/search';
import { ViewService } from '../services/views';
import { type QuotingService } from '../services/quoting';
import { type AuthZ } from '../lib/authz';
import { type JWTService } from '../services/jwt';
import { type GlobalAttributesService } from '../services/global_attributes';
import { type GlobalTagsService } from '../services/global_tags';
import { type WorkspaceVocabularyService } from '../services/workspace_vocabulary';
import { type StudioConversationsService } from '../services/studio_conversations';
import { type StudioFsService } from '../services/studio_fs';
import { type LineItemsService } from '../services/line_items';

export type CreateContextConfig = {
  envConfig: EnvConfig;
  user?: UserAuthPayload;
  userToken?: string;
  systemUser: UserAuthPayload;
  authZ: AuthZ;
  services: {
    transactionService: TransactionService;
    workspaceService: WorkspaceService;
    contactsService: ContactsService;
    assetsService: AssetsService;
    companiesService: CompaniesService;
    usersService: UsersService;
    pimProductsService: PimProductsService;
    resourceMapResourcesService: ResourceMapResourcesService;
    pricesService: PricesService;
    pimCategoriesService: PimCategoriesService;
    projectsService: ProjectsService;
    salesOrdersService: SalesOrdersService;
    lineItemsService: LineItemsService;
    purchaseOrdersService: PurchaseOrdersService;
    assetSchedulesService: AssetSchedulesService;
    pulseService: Pulse;
    fileService: FileService;
    pdfService: PdfService;
    notesService: NotesService;
    priceEngineService: PriceEngineService;
    workflowConfigurationService: WorkflowConfigurationService;
    fulfilmentService: FulfilmentService;
    llmService: LlmService;
    imageGeneratorService: ImageGeneratorService;
    invoiceService: InvoiceService;
    chargeService: ChargeService;
    inventoryService: InventoryService;
    referenceNumberService: ReferenceNumberService;
    intakeFormService: IntakeFormService;
    auth0ManagementService?: Auth0ManagementService;
    sendGridAdminService?: SendGridAdminService;
    brandfetchService: BrandfetchService;
    domainsService: DomainsService;
    emailService: EmailService;
    searchService: SearchService;
    viewService: ViewService;
    quotingService: QuotingService;
    jwtService: JWTService;
    globalAttributesService: GlobalAttributesService;
    globalTagsService: GlobalTagsService;
    workspaceVocabularyService: WorkspaceVocabularyService;
    studioConversationsService: StudioConversationsService;
    studioFsService: StudioFsService;
  };
};

export type GraphQLContext = CreateContextConfig & {
  dataloaders: ReturnType<typeof createDataLoaders>;
};

export const createContext = (
  opts: CreateContextConfig,
): MercuriusCommonOptions['context'] => {
  return async (req, res): Promise<GraphQLContext> => {
    // must be first to decorate the request and get the user
    await req.server.authenticate(req, res);

    const dataloaders = createDataLoaders({
      user: req.user,
      services: {
        contactsService: opts.services.contactsService,
        pricesService: opts.services.pricesService,
        companiesService: opts.services.companiesService,
        usersService: opts.services.usersService,
        assetSchedulesService: opts.services.assetSchedulesService,
        salesOrdersService: opts.services.salesOrdersService,
        projectsService: opts.services.projectsService,
        resourceMapResourcesService: opts.services.resourceMapResourcesService,
        pimCategoriesService: opts.services.pimCategoriesService,
        pimProductsService: opts.services.pimProductsService,
        notesService: opts.services.notesService,
        chargeService: opts.services.chargeService,
        inventoryService: opts.services.inventoryService,
        assetsService: opts.services.assetsService,
        purchaseOrdersService: opts.services.purchaseOrdersService,
        brandfetchService: opts.services.brandfetchService,
        intakeFormService: opts.services.intakeFormService,
        searchService: opts.services.searchService,
        quotingService: opts.services.quotingService,
      },
    });

    return {
      envConfig: opts.envConfig,
      user: req.user,
      systemUser: opts.systemUser,
      userToken: req.headers.authorization?.split('Bearer ')?.[1] || undefined,
      dataloaders,
      services: opts.services,
      authZ: opts.authZ,
    };
  };
};
