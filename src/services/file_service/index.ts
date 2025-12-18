import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { EnvConfig } from '../../config';
import {
  FileServiceModel,
  FileUpsertInput,
  FileDoc,
  createFileServiceModel,
} from './model';
import { MongoClient } from 'mongodb';
import { logger } from '../../lib/logger';
import {
  type AuthZ,
  ERP_FILE_SUBJECT_RELATIONS,
  ERP_INVOICE_SUBJECT_PERMISSIONS,
  ERP_PROJECT_SUBJECT_PERMISSIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  RESOURCE_TYPES,
} from '../../lib/authz';
import { ANON_USER_AUTH_PAYLOAD, UserAuthPayload } from '../../authentication';

export { FileDoc } from './model';

export const CONTENT_TYPE_MAP = {
  IMAGE_JPEG: { contentType: 'image/jpeg', ext: '.jpg' },
  IMAGE_PNG: { contentType: 'image/png', ext: '.png' },
  APPLICATION_PDF: { contentType: 'application/pdf', ext: '.pdf' },
  TEXT_CSV: { contentType: 'text/csv', ext: '.csv' },
  // add more as needed
} as const;

export type SupportedContentType = keyof typeof CONTENT_TYPE_MAP;

export class FileService {
  private s3: S3Client;
  private bucket: string;
  private model: FileServiceModel;
  private authZ: AuthZ;

  constructor(config: EnvConfig, model: FileServiceModel, authZ: AuthZ) {
    this.authZ = authZ;

    const s3Config: any = {
      region: config.FILE_SERVICE_REGION || 'us-west-2',
      credentials: {
        accessKeyId: config.FILE_SERVICE_KEY,
        secretAccessKey: config.FILE_SERVICE_SECRET,
      },
    };

    // Add custom endpoint for LocalStack or other S3-compatible services
    if (config.FILE_SERVICE_ENDPOINT) {
      s3Config.endpoint = config.FILE_SERVICE_ENDPOINT;
      s3Config.forcePathStyle = true; // Required for LocalStack
    }

    this.s3 = new S3Client(s3Config);
    this.bucket = config.FILE_SERVICE_BUCKET;
    this.model = model;
  }

  async hasPermissionToFileOrThrow(
    file: Pick<
      FileDoc,
      'parent_entity_id' | 'parent_entity_type' | 'workspace_id'
    >,
    user: UserAuthPayload,
    action: 'view' | 'add' | 'remove' | 'update' = 'add',
  ) {
    const errMsg = (resource: string) =>
      `User does not have permission to ${action} attachment(s) to this ${resource}`;
    if (file.parent_entity_type) {
      if (file.parent_entity_type === RESOURCE_TYPES.ERP_SALES_ORDER) {
        const hasPermission = await this.authZ.salesOrder.hasPermission({
          resourceId: file.parent_entity_id,
          permission:
            action === 'view'
              ? ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_READ
              : ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(errMsg('sales order'));
        }
      }

      if (file.parent_entity_type === RESOURCE_TYPES.ERP_PURCHASE_ORDER) {
        const hasPermission = await this.authZ.purchaseOrder.hasPermission({
          resourceId: file.parent_entity_id,
          permission:
            action === 'view'
              ? ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_READ
              : ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(errMsg('purchase order'));
        }
      }

      if (file.parent_entity_type === RESOURCE_TYPES.ERP_INVOICE) {
        logger.info(
          {
            resourceId: file.parent_entity_id,
            permission:
              action === 'view'
                ? ERP_INVOICE_SUBJECT_PERMISSIONS.USER_READ
                : ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
            subjectId: user.id,
          },
          'Checking invoice permission....',
        );

        const hasPermission = await this.authZ.invoice.hasPermission({
          resourceId: file.parent_entity_id,
          permission:
            action === 'view'
              ? ERP_INVOICE_SUBJECT_PERMISSIONS.USER_READ
              : ERP_INVOICE_SUBJECT_PERMISSIONS.USER_UPDATE,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(errMsg('invoice'));
        }
      }

      if (file.parent_entity_type === RESOURCE_TYPES.ERP_PROJECT) {
        const hasPermission = await this.authZ.project.hasPermission({
          resourceId: file.parent_entity_id,
          permission:
            action === 'view'
              ? ERP_PROJECT_SUBJECT_PERMISSIONS.USER_READ
              : ERP_PROJECT_SUBJECT_PERMISSIONS.USER_UPDATE,
          subjectId: user.id,
        });
        if (!hasPermission) {
          throw new Error(errMsg('project'));
        }
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        resourceId: file.workspace_id,
        permission:
          action === 'view'
            ? ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_FILES
            : ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_FILES,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error(errMsg('workspace'));
      }
    }
  }

  async getFileById(
    fileId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const file = await this.model.getFileById(fileId);
    if (!file) {
      return null;
    }
    this.hasPermissionToFileOrThrow(file, user, 'view');

    return file;
  }

  async uploadBufferAndAddFile(
    params: {
      buffer: Buffer;
      fileName: string;
      parent_entity_id: string;
      parent_entity_type?: RESOURCE_TYPES;
      workspace_id: string;
      created_by: string;
      metadata?: Record<string, any>;
      contentType: string;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc> {
    const {
      buffer,
      fileName,
      parent_entity_id,
      parent_entity_type,
      workspace_id,
      created_by,
      metadata,
      contentType,
    } = params;

    await this.hasPermissionToFileOrThrow(
      {
        parent_entity_id,
        parent_entity_type,
        workspace_id,
      },
      user,
      'add',
    );

    const uuid = crypto.randomUUID();
    // Extract the actual file extension from the filename
    const match = fileName.match(/\.[a-zA-Z0-9]+$/);
    const ext = match ? match[0] : '.pdf'; // Default to .pdf if no extension found
    const key = `uploads/${uuid}${ext}`;

    logger.info(`Uploading PDF to S3: ${key}`);
    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    logger.info(`Uploaded PDF to S3: ${key}`);

    // Register in DB
    return this.addFile(
      {
        file_key: key,
        parent_entity_id,
        parent_entity_type,
        file_name: fileName,
        metadata,
        created_by,
        workspace_id,
      },
      user,
    );
  }

  async getSignedUploadUrl(
    contentType: SupportedContentType,
    opts?: { originalFilename?: string },
  ): Promise<{ url: string; key: string }> {
    // Generate a unique key: uploads/{uuid}.{ext}
    const uuid = crypto.randomUUID();
    let ext = '';
    let realContentType = '';
    if (opts?.originalFilename) {
      const match = opts.originalFilename.match(/\.[a-zA-Z0-9]+$/);
      if (match) ext = match[0];
      realContentType = CONTENT_TYPE_MAP[contentType].contentType;
    } else {
      ext = CONTENT_TYPE_MAP[contentType].ext;
      realContentType = CONTENT_TYPE_MAP[contentType].contentType;
    }

    const key = `uploads/${uuid}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: realContentType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    return { url, key };
  }

  async addFile(
    input: FileUpsertInput & { created_by: string; workspace_id: string },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc> {
    // Check S3 for file existence and get metadata
    const {
      file_key,
      parent_entity_id,
      file_name,
      metadata,
      created_by,
      workspace_id,
      parent_entity_type,
    } = input;

    logger.info({ input, user }, 'fileService.addFile called');

    await this.hasPermissionToFileOrThrow(
      {
        parent_entity_id,
        parent_entity_type,
        workspace_id,
      },
      user,
      'add',
    );

    const head = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: file_key,
      }),
    );
    if (!head.ContentLength || !head.ContentType) {
      throw new Error('File missing size or mime type in S3');
    }

    const now = new Date().toISOString();
    const newFile = await this.model.addFile({
      workspace_id,
      parent_entity_id,
      parent_entity_type,
      file_key,
      file_name,
      file_size: head.ContentLength,
      mime_type: head.ContentType,
      metadata,
      created_at: now,
      created_by,
      updated_at: now,
      updated_by: created_by,
      deleted: false,
    });

    let entityRelation: ERP_FILE_SUBJECT_RELATIONS | undefined;

    switch (parent_entity_type) {
      case RESOURCE_TYPES.ERP_SALES_ORDER:
        entityRelation = ERP_FILE_SUBJECT_RELATIONS.SALES_ORDER_SALES_ORDER;
        break;
      case RESOURCE_TYPES.ERP_PURCHASE_ORDER:
        entityRelation =
          ERP_FILE_SUBJECT_RELATIONS.PURCHASE_ORDER_PURCHASE_ORDER;
        break;
      case RESOURCE_TYPES.ERP_INVOICE:
        entityRelation = ERP_FILE_SUBJECT_RELATIONS.INVOICE_INVOICE;
        break;
      case RESOURCE_TYPES.ERP_PROJECT:
        entityRelation = ERP_FILE_SUBJECT_RELATIONS.PROJECT_PROJECT;
        break;
      case RESOURCE_TYPES.ERP_PRICEBOOK:
        entityRelation = ERP_FILE_SUBJECT_RELATIONS.PRICEBOOK_PRICEBOOK;
        break;
    }

    const newRelations = [
      {
        resourceId: newFile._id,
        relation: ERP_FILE_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        subjectId: workspace_id,
      },
    ];

    if (entityRelation) {
      newRelations.push({
        resourceId: newFile._id,
        relation: entityRelation,
        subjectId: parent_entity_id,
      });
    }

    await this.authZ.file.writeRelations(newRelations);

    logger.info(
      { file: newFile, relations: newRelations },
      'fileService.addFile completed',
    );

    return newFile;
  }

  async removeFile(
    fileId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc | null> {
    const file = await this.model.getFileById(fileId);
    if (!file) {
      return null;
    }
    const { parent_entity_id, parent_entity_type, workspace_id } = file;
    await this.hasPermissionToFileOrThrow(
      {
        parent_entity_id,
        parent_entity_type,
        workspace_id,
      },
      user,
      'remove',
    );
    return this.model.removeFile(fileId, user.id);
  }

  async renameFile(
    fileId: string,
    newFileName: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc | null> {
    const file = await this.model.getFileById(fileId);
    if (!file) {
      return null;
    }
    const { parent_entity_id, parent_entity_type, workspace_id } = file;
    await this.hasPermissionToFileOrThrow(
      {
        parent_entity_id,
        parent_entity_type,
        workspace_id,
      },
      user,
      'update',
    );

    return this.model.renameFile(fileId, newFileName, user.id);
  }

  async getSignedReadUrl({
    key,
    file_name,
    type = 'attachment',
    expiresIn = 900,
  }: {
    key: string;
    file_name: string;
    type?: 'inline' | 'attachment';
    expiresIn?: number;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `${type}; filename="${file_name}"`,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getFilesByParentEntity(
    args: {
      workspace_id: string;
      parent_entity_id: string;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc[]> {
    const files = await this.model.getFilesByParentEntityId({
      filter: {
        workspace_id: args.workspace_id,
        parent_entity_id: args.parent_entity_id,
      },
    });

    const entityType = files[0]?.parent_entity_type;

    if (entityType) {
      await this.hasPermissionToFileOrThrow(
        {
          parent_entity_id: args.parent_entity_id,
          parent_entity_type: entityType,
          workspace_id: args.workspace_id,
        },
        user,
        'view',
      );
    }

    return files;
  }

  async getFileContent(
    fileId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<any> {
    // First get the file metadata to verify ownership and get the S3 key
    const file = await this.model.getFileById(fileId);
    if (!file) {
      return null;
    }

    await this.hasPermissionToFileOrThrow(
      {
        parent_entity_id: file.parent_entity_id,
        parent_entity_type: file.parent_entity_type,
        workspace_id: file.workspace_id,
      },
      user,
      'view',
    );

    // Get the file content from S3
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.file_key,
    });

    const response = await this.s3.send(command);

    // Return the body - it has transformToString and other methods
    // The caller can decide how to process it based on the content type
    return response.Body;
  }
}

export const createFileService = async (config: {
  mongoClient: MongoClient;
  envConfig: EnvConfig;
  authZ: AuthZ;
}) => {
  const model = await createFileServiceModel({
    mongoClient: config.mongoClient,
  });
  return new FileService(config.envConfig, model, config.authZ);
};
