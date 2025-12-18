import { FileService } from '../file_service';
import { EnvConfig } from '../../config';
import Pulse from '@pulsecron/pulse';
import { randomUUID } from 'crypto';
import { UserAuthPayload } from '../../authentication';
import { setTimeout } from 'timers/promises';
import nodePath from 'path';
import { logger } from '../../lib/logger';
import {
  AuthZ,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
  ERP_QUOTE_SUBJECT_PERMISSIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
  RESOURCE_TYPES,
} from '../../lib/authz';

const createPdfGeneratorJob = async (
  pulse: Pulse,
  fileService: FileService,
) => {
  pulse.define<{
    page_url: string;
    parent_entity_id: string;
    parent_entity_type?: RESOURCE_TYPES;
    workspace_id: string;
    created_by: string;
    token: string;
    file_name?: string;
    user: UserAuthPayload;
  }>(
    'generate-pdf-invoice',
    async ({ attrs }) => {
      logger.info(attrs, 'Generating PDF');
      // Dynamically import puppeteer to avoid issues in environments where it's not needed
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();

      await page.goto(attrs.data.page_url, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
      });

      // Wait for all images to fully load and decode
      await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return Promise.all(
          images.map((img) => {
            if (img.complete && img.naturalHeight !== 0) {
              return Promise.resolve();
            }
            return new Promise((resolve) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve); // Don't fail on broken images
              // Timeout fallback per image (10 seconds)
              window.setTimeout(resolve, 10000);
            });
          }),
        );
      });

      // Small additional delay for final rendering
      await setTimeout(500);

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
        scale: 1,
      });
      await browser.close();

      // Save PDF using FileService
      const result = await fileService.uploadBufferAndAddFile(
        {
          buffer: Buffer.from(pdfBuffer),
          fileName:
            attrs.data.file_name && attrs.data.file_name.trim() !== ''
              ? attrs.data.file_name
              : randomUUID() + '.pdf',
          parent_entity_id: attrs.data.parent_entity_id,
          parent_entity_type: attrs.data.parent_entity_type,
          workspace_id: attrs.data.workspace_id,
          created_by: attrs.data.created_by,
          contentType: 'application/pdf',
        },
        attrs.data.user,
      );
      return result.file_key;
    },
    { shouldSaveResult: true },
  );
};

export class PdfService {
  ERP_CLIENT_URL: string;
  constructor(
    private fileService: FileService,
    private envConfig: EnvConfig,
    private pulseService: Pulse,
    private authZ: AuthZ,
  ) {
    this.authZ = authZ;
    this.ERP_CLIENT_URL = this.envConfig.ERP_CLIENT_URL;
    createPdfGeneratorJob(this.pulseService, this.fileService);
  }

  /**
   * Schedule a Pulse job to generate a PDF (from HTML or URL) and save it using FileService.
   * The job runs immediately.
   */

  /**
   * Generate and save a PDF for a purchase order by ID.
   */
  async generatePdFAndLinkToEntity(
    entityId: string,
    user: UserAuthPayload,
    token: string,
    path: string,
    workspaceId: string,
    fileName?: string,
  ): Promise<void> {
    // Path safety checks
    if (
      path.includes('://') || // contains a host name
      path.includes('#') || // contains a hash
      path.startsWith('/') // starts with a slash
    ) {
      throw new Error(
        'Invalid path: must not contain a host name, must not contain "#", and must not start with "/"',
      );
    }

    const pageUrl = nodePath.join(this.ERP_CLIENT_URL, `${path}#jwt=${token}`);
    logger.info(
      {
        entityId,
        pageUrl,
        fileName,
        userId: user.id,
        companyId: user.companyId,
      },
      'Generating PDF',
    );

    let parentEntityType: RESOURCE_TYPES | undefined;

    if (pageUrl.includes('purchase')) {
      parentEntityType = RESOURCE_TYPES.ERP_PURCHASE_ORDER;
    } else if (pageUrl.includes('quote')) {
      parentEntityType = RESOURCE_TYPES.ERP_QUOTE;
    } else if (pageUrl.includes('sales')) {
      parentEntityType = RESOURCE_TYPES.ERP_SALES_ORDER;
    } else if (pageUrl.includes('invoice')) {
      parentEntityType = RESOURCE_TYPES.ERP_INVOICE;
    }

    // For printing, we're verifying only read access
    // once that's established, we'll set the user as the system user
    // to complete the action asynchronously
    if (parentEntityType) {
      if (parentEntityType === RESOURCE_TYPES.ERP_SALES_ORDER) {
        const hasPermission = await this.authZ.salesOrder.hasPermission({
          resourceId: entityId,
          permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(
            'User does not have permission to print this sales order',
          );
        }
      }

      if (parentEntityType === RESOURCE_TYPES.ERP_PURCHASE_ORDER) {
        const hasPermission = await this.authZ.purchaseOrder.hasPermission({
          resourceId: entityId,
          permission: ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(
            'User does not have permission to print this purchase order',
          );
        }
      }

      if (parentEntityType === RESOURCE_TYPES.ERP_INVOICE) {
        const hasPermission = await this.authZ.invoice.hasPermission({
          resourceId: entityId,
          permission: ERP_INVOICE_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(
            'User does not have permission to print this invoice',
          );
        }
      }

      if (parentEntityType === RESOURCE_TYPES.ERP_QUOTE) {
        const hasPermission = await this.authZ.quote.hasPermission({
          resourceId: entityId,
          permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error('User does not have permission to print this quote');
        }
      }
    }

    const job = await this.pulseService.now('generate-pdf-invoice', {
      page_url: pageUrl,
      parent_entity_id: entityId,
      parent_entity_type: parentEntityType,
      workspace_id: workspaceId,
      created_by: user.id,
      token,
      file_name: fileName,
      user,
    });
    while (true) {
      const status = await job.fetchStatus();
      if (status.lastFinishedAt) {
        return;
      }
      await setTimeout(1000);
    }
  }
}

export const createPdfService = async (args: {
  fileService: FileService;
  envConfig: EnvConfig;
  pulseService: Pulse;
  authZ: AuthZ;
}) => {
  return new PdfService(
    args.fileService,
    args.envConfig,
    args.pulseService,
    args.authZ,
  );
};
