import { v1 } from '@authzed/authzed-node';
import { UserAuthPayload } from '../../authentication';
import { createClient } from './spiceDB-client';
import { Redis } from 'ioredis';

import { PlatformResource } from './resources/Platform';
import { WorkspaceResource } from './resources/WorkspaceResource';
import { DomainResource } from './resources/DomainResource';
import { SalesOrderResource } from './resources/SalesOrderResource';
import { PurchaseOrderResource } from './resources/PurchaseOrderResource';
import { PriceBookResource } from './resources/PriceBookResource';
import { PriceBookPriceResource } from './resources/PriceBookPriceResource';
import { IntakeFormResource } from './resources/IntakeFormResource';
import { IntakeFormSubmissionResource } from './resources/IntakeFormSubmissionResource';
import { FulfilmentResource } from './resources/FulfilmentResource';
import { InvoiceResource } from './resources/InvoiceResource';
import { ProjectResource } from './resources/ProjectResource';
import { ContactResource } from './resources/ContactResource';
import { ChargeResource } from './resources/ChargeResource';
import { FileResource } from './resources/FileResource';
import { RFQResource } from './resources/RFQ';
import { QuoteResource } from './resources/Quote';
import { ERP_PLATFORM_SUBJECT_PERMISSIONS } from './spicedb-generated-types';

export * from './spicedb-generated-types';
export * from '../spicedb-base-resource/BaseResource';

export const ERP_GLOBAL_PLATFORM_ID = 'global';

type AuthZConfig = {
  spicedbEndpoint: string;
  spicedbToken: string;
  redisClient: Redis;
};

export class AuthZ {
  private client: v1.ZedClientInterface['promises'];
  private endpoint: string;
  private token: string;

  public readonly platform: PlatformResource;
  public readonly workspace: WorkspaceResource;
  public readonly domain: DomainResource;
  public readonly salesOrder: SalesOrderResource;
  public readonly purchaseOrder: PurchaseOrderResource;
  public readonly priceBook: PriceBookResource;
  public readonly priceBookPrice: PriceBookPriceResource;
  public readonly intakeForm: IntakeFormResource;
  public readonly intakeFormSubmission: IntakeFormSubmissionResource;
  public readonly fulfilment: FulfilmentResource;
  public readonly invoice: InvoiceResource;
  public readonly project: ProjectResource;
  public readonly contact: ContactResource;
  public readonly charge: ChargeResource;
  public readonly file: FileResource;
  public readonly rfq: RFQResource;
  public readonly quote: QuoteResource;

  constructor(config: AuthZConfig) {
    this.endpoint = config.spicedbEndpoint;
    this.token = config.spicedbToken;

    // Initialize SpiceDB client
    this.client = createClient({
      apiToken: this.token,
      endpoint: this.endpoint,
      security: this.endpoint.includes('localhost')
        ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
        : v1.ClientSecurity.SECURE,
    });

    this.platform = new PlatformResource(this.client, config.redisClient);
    this.workspace = new WorkspaceResource(this.client, config.redisClient);
    this.domain = new DomainResource(this.client, config.redisClient);
    this.salesOrder = new SalesOrderResource(this.client, config.redisClient);
    this.purchaseOrder = new PurchaseOrderResource(
      this.client,
      config.redisClient,
    );
    this.priceBook = new PriceBookResource(this.client, config.redisClient);
    this.priceBookPrice = new PriceBookPriceResource(
      this.client,
      config.redisClient,
    );
    this.intakeForm = new IntakeFormResource(this.client, config.redisClient);
    this.intakeFormSubmission = new IntakeFormSubmissionResource(
      this.client,
      config.redisClient,
    );
    this.fulfilment = new FulfilmentResource(this.client, config.redisClient);
    this.invoice = new InvoiceResource(this.client, config.redisClient);
    this.project = new ProjectResource(this.client, config.redisClient);
    this.contact = new ContactResource(this.client, config.redisClient);
    this.charge = new ChargeResource(this.client, config.redisClient);
    this.file = new FileResource(this.client, config.redisClient);
    this.rfq = new RFQResource(this.client, config.redisClient);
    this.quote = new QuoteResource(this.client, config.redisClient);
  }

  isERPAdmin(user: UserAuthPayload) {
    return this.platform.hasPermission({
      permission: ERP_PLATFORM_SUBJECT_PERMISSIONS.USER_IS_ADMIN,
      resourceId: ERP_GLOBAL_PLATFORM_ID,
      subjectId: user.id,
    });
  }

  // Add compositional checks/additional reations here

  /**
   * Close the SpiceDB client connection
   */
  async close(): Promise<void> {
    if (this.client) {
      this.client.close();
    }
  }

  /**
   * Check if SpiceDB client is connected
   */
  isConnected(): boolean {
    return this.client !== null;
  }
}

export const createAuthZ = (config: AuthZConfig) => {
  return new AuthZ(config);
};
