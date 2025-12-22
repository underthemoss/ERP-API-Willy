import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  SupportedContentType,
  ResourceTypes,
  WorkspaceUserRole,
} from './generated/graphql';

/* GraphQL operations for codegen */
gql`
  query GetSignedUploadUrl(
    $contentType: SupportedContentType!
    $originalFilename: String
  ) {
    getSignedUploadUrl(
      contentType: $contentType
      originalFilename: $originalFilename
    ) {
      url
      key
    }
  }
`;

gql`
  mutation AddFileToEntity(
    $workspaceId: String!
    $parentEntityId: String!
    $parentEntityType: ResourceTypes
    $fileKey: String!
    $fileName: String!
    $metadata: JSON
  ) {
    addFileToEntity(
      workspace_id: $workspaceId
      parent_entity_id: $parentEntityId
      parent_entity_type: $parentEntityType
      file_key: $fileKey
      file_name: $fileName
      metadata: $metadata
    ) {
      id
      workspace_id
      parent_entity_id
      file_key
      file_name
      file_size
      mime_type
      metadata
      created_at
      created_by
      updated_at
      updated_by
      deleted
      url
      created_by_user {
        id
        firstName
        lastName
      }
      updated_by_user {
        id
        firstName
        lastName
      }
    }
  }
`;

gql`
  query ListFilesByEntityId($parentEntityId: String!, $workspaceId: String!) {
    listFilesByEntityId(
      parent_entity_id: $parentEntityId
      workspace_id: $workspaceId
    ) {
      id
      workspace_id
      parent_entity_id
      file_key
      file_name
      file_size
      mime_type
      metadata
      created_at
      created_by
      updated_at
      updated_by
      deleted
      url
    }
  }
`;

gql`
  mutation RenameFile($fileId: String!, $newFileName: String!) {
    renameFile(file_id: $fileId, new_file_name: $newFileName) {
      id
      file_name
      updated_at
      updated_by
      updated_by_user {
        id
        firstName
        lastName
      }
    }
  }
`;

gql`
  mutation RemoveFileFromEntity($fileId: String!) {
    removeFileFromEntity(file_id: $fileId) {
      id
      file_name
      deleted
      updated_at
      updated_by
    }
  }
`;

gql`
  mutation InviteUserToWorkspace(
    $workspaceId: String!
    $email: String!
    $roles: [WorkspaceUserRole!]!
  ) {
    inviteUserToWorkspace(
      workspaceId: $workspaceId
      email: $email
      roles: $roles
    ) {
      userId
      roles
    }
  }
`;

// Helper to create S3 client for LocalStack
function createS3Client() {
  const globalConfigPath = path.join(__dirname, 'globalConfig.json');
  const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));

  return new S3Client({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    },
    forcePathStyle: true,
  });
}

const { createClient } = createTestEnvironment();

describe('File Service GraphQL API', () => {
  let s3Client: S3Client;
  let testBucket: string;

  beforeAll(() => {
    s3Client = createS3Client();
    const globalConfigPath = path.join(__dirname, 'globalConfig.json');
    const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));
    testBucket = config.s3Bucket;
  });

  describe('getSignedUploadUrl', () => {
    it('should generate a signed upload URL for PDF files', async () => {
      const { sdk } = await createClient();

      const result = await sdk.GetSignedUploadUrl({
        contentType: SupportedContentType.ApplicationPdf,
        originalFilename: 'test-document.pdf',
      });

      expect(result.getSignedUploadUrl).toBeDefined();
      expect(result.getSignedUploadUrl.url).toContain('http');
      expect(result.getSignedUploadUrl.key).toMatch(/^uploads\/.*\.pdf$/);
    });

    it('should generate a signed upload URL for image files', async () => {
      const { sdk } = await createClient();

      const result = await sdk.GetSignedUploadUrl({
        contentType: SupportedContentType.ImagePng,
        originalFilename: 'test-image.png',
      });

      expect(result.getSignedUploadUrl).toBeDefined();
      expect(result.getSignedUploadUrl.url).toContain('http');
      expect(result.getSignedUploadUrl.key).toMatch(/^uploads\/.*\.png$/);
    });

    it('should generate a signed upload URL for CSV files', async () => {
      const { sdk } = await createClient();

      const result = await sdk.GetSignedUploadUrl({
        contentType: SupportedContentType.TextCsv,
      });

      expect(result.getSignedUploadUrl).toBeDefined();
      expect(result.getSignedUploadUrl.url).toContain('http');
      expect(result.getSignedUploadUrl.key).toMatch(/^uploads\/.*\.csv$/);
    });

    it('should preserve original filename extension when provided', async () => {
      const { sdk } = await createClient();

      const result = await sdk.GetSignedUploadUrl({
        contentType: SupportedContentType.ApplicationPdf,
        originalFilename: 'my-special-report.pdf',
      });

      expect(result.getSignedUploadUrl.key).toMatch(/^uploads\/.*\.pdf$/);
    });
  });

  describe('addFileToEntity', () => {
    it('should add a file to an entity after uploading to S3', async () => {
      const { sdk, user, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a project to attach files to
      const projectInput = {
        workspaceId: workspace.id,
        name: 'File Test Project',
        project_code: 'FILE-001',
        description: 'Project for file attachment test',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // First, upload a file to S3
      const fileKey = `uploads/test-${uuidv4()}.pdf`;
      const fileContent = Buffer.from('Mock PDF content for testing');

      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: fileContent,
          ContentType: 'application/pdf',
        }),
      );

      // Now add the file reference to the entity
      const result = await sdk.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createProject.id,
        parentEntityType: ResourceTypes.ErpProject,
        fileKey,
        fileName: 'Test Document.pdf',
        metadata: {
          uploadedBy: 'test-suite',
          version: '1.0',
        },
      });

      expect(result.addFileToEntity).toBeDefined();
      expect(result.addFileToEntity.id).toBeTruthy();
      expect(result.addFileToEntity.workspace_id).toBe(workspace.id);
      expect(result.addFileToEntity.parent_entity_id).toBe(createProject.id);
      expect(result.addFileToEntity.file_key).toBe(fileKey);
      expect(result.addFileToEntity.file_name).toBe('Test Document.pdf');
      expect(result.addFileToEntity.file_size).toBe(fileContent.length);
      expect(result.addFileToEntity.mime_type).toBe('application/pdf');
      expect(result.addFileToEntity.metadata).toEqual({
        uploadedBy: 'test-suite',
        version: '1.0',
      });
      expect(result.addFileToEntity.deleted).toBe(false);
      expect(result.addFileToEntity.url).toContain('http');
      expect(result.addFileToEntity.created_by).toBe(user.id);
      expect(result.addFileToEntity.created_by_user?.id).toBe(user.id);
    });

    it('should add multiple files to the same entity', async () => {
      const { sdk, user, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a project first for the sales order
      const projectInput = {
        workspaceId: workspace.id,
        name: 'Multi-File Project',
        project_code: 'MULTI-001',
        description: 'Project for multi-file test',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // Create a sales order to attach files to
      const salesOrderInput = {
        workspace_id: workspace.id,
        buyer_id: user.id,
        purchase_order_number: 'SO-FILE-001',
        project_id: createProject.id,
      };
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: salesOrderInput,
      });
      if (!createSalesOrder) throw new Error('Sales order was not created');

      // Upload and add multiple files
      const files = [
        { name: 'Invoice.pdf', type: 'application/pdf' },
        { name: 'Receipt.pdf', type: 'application/pdf' },
        { name: 'Contract.pdf', type: 'application/pdf' },
      ];

      const addedFiles = [];
      for (const file of files) {
        const fileKey = `uploads/test-${uuidv4()}.pdf`;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: testBucket,
            Key: fileKey,
            Body: Buffer.from(`Content of ${file.name}`),
            ContentType: file.type,
          }),
        );

        const result = await sdk.AddFileToEntity({
          workspaceId: workspace.id,
          parentEntityId: createSalesOrder.id,
          parentEntityType: ResourceTypes.ErpSalesOrder,
          fileKey,
          fileName: file.name,
        });

        addedFiles.push(result.addFileToEntity);
      }

      expect(addedFiles).toHaveLength(3);
      addedFiles.forEach((file, index) => {
        expect(file.file_name).toBe(files[index].name);
        expect(file.parent_entity_id).toBe(createSalesOrder.id);
      });
    });
  });

  describe('listFilesByEntityId', () => {
    it('should list all files attached to an entity', async () => {
      const { sdk, user, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      const { createInvoice } = await sdk.CreateInvoice({
        input: {
          buyerId: user.id,
          sellerId: user.id,
          workspaceId: workspace.id,
        },
      });
      if (!createInvoice) throw new Error('Invoice was not created');

      // Add some files
      const fileNames = ['Document1.pdf', 'Document2.pdf'];
      for (const fileName of fileNames) {
        const fileKey = `uploads/test-${uuidv4()}.pdf`;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: testBucket,
            Key: fileKey,
            Body: Buffer.from(`Content of ${fileName}`),
            ContentType: 'application/pdf',
          }),
        );

        await sdk.AddFileToEntity({
          workspaceId: workspace.id,
          parentEntityId: createInvoice.id,
          parentEntityType: ResourceTypes.ErpInvoice,
          fileKey,
          fileName,
        });
      }

      // List files
      const result = await sdk.ListFilesByEntityId({
        parentEntityId: createInvoice.id,
        workspaceId: workspace.id,
      });

      expect(result.listFilesByEntityId).toHaveLength(2);
      const fileNamesReturned = result.listFilesByEntityId.map(
        (f) => f.file_name,
      );
      expect(fileNamesReturned).toContain('Document1.pdf');
      expect(fileNamesReturned).toContain('Document2.pdf');

      result.listFilesByEntityId.forEach((file) => {
        expect(file.parent_entity_id).toBe(createInvoice.id);
        expect(file.workspace_id).toBe(workspace.id);
        expect(file.deleted).toBe(false);
        expect(file.url).toContain('http');
      });
    });

    it('should return empty array when no files exist for entity', async () => {
      const { sdk, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a project with no files
      const projectInput = {
        workspaceId: workspace.id,
        name: 'No Files Project',
        project_code: 'NOFILE-001',
        description: 'Project with no files',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // List files (should be empty)
      const result = await sdk.ListFilesByEntityId({
        parentEntityId: createProject.id,
        workspaceId: workspace.id,
      });

      expect(result.listFilesByEntityId).toEqual([]);
    });
  });

  describe('renameFile', () => {
    it('should rename a file successfully', async () => {
      const { sdk, user, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a purchase order
      const poInput = {
        workspace_id: workspace.id,
        purchase_order_number: 'PO-RENAME-001',
        seller_id: 'vendor-789',
      };
      const { createPurchaseOrder } = await sdk.CreatePurchaseOrder({
        input: poInput,
      });
      if (!createPurchaseOrder) {
        throw new Error('Purchase order was not created');
      }

      // Upload and add a file
      const fileKey = `uploads/test-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('Original file content'),
          ContentType: 'application/pdf',
        }),
      );

      const { addFileToEntity } = await sdk.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createPurchaseOrder.id,
        parentEntityType: ResourceTypes.ErpPurchaseOrder,
        fileKey,
        fileName: 'Original Name.pdf',
      });

      // Rename the file
      const newFileName = 'Updated Name.pdf';
      const result = await sdk.RenameFile({
        fileId: addFileToEntity.id,
        newFileName,
      });

      expect(result.renameFile).toBeDefined();
      expect(result.renameFile.id).toBe(addFileToEntity.id);
      expect(result.renameFile.file_name).toBe(newFileName);
      expect(result.renameFile.updated_by).toBe(user.id);
      expect(result.renameFile.updated_by_user?.id).toBe(user.id);
      expect(result.renameFile.updated_at).toBeTruthy();

      // Verify the rename persisted by listing files
      const listResult = await sdk.ListFilesByEntityId({
        parentEntityId: createPurchaseOrder.id,
        workspaceId: workspace.id,
      });
      const renamedFile = listResult.listFilesByEntityId.find(
        (f) => f.id === addFileToEntity.id,
      );
      expect(renamedFile?.file_name).toBe(newFileName);
    });

    it('should fail to rename a non-existent file', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.RenameFile({
          fileId: 'non-existent-file-id',
          newFileName: 'Should Fail.pdf',
        }),
      ).rejects.toThrow('File not found or already deleted');
    });
  });

  describe('removeFileFromEntity', () => {
    it('should soft delete a file successfully', async () => {
      const { sdk, user, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a project
      const projectInput = {
        workspaceId: workspace.id,
        name: 'Delete File Project',
        project_code: 'DEL-001',
        description: 'Project for file deletion test',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // Upload and add a file
      const fileKey = `uploads/test-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('File to be deleted'),
          ContentType: 'application/pdf',
        }),
      );

      const { addFileToEntity } = await sdk.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createProject.id,
        parentEntityType: ResourceTypes.ErpProject,
        fileKey,
        fileName: 'To Be Deleted.pdf',
      });

      // Remove the file
      const result = await sdk.RemoveFileFromEntity({
        fileId: addFileToEntity.id,
      });

      expect(result.removeFileFromEntity).toBeDefined();
      expect(result.removeFileFromEntity.id).toBe(addFileToEntity.id);
      expect(result.removeFileFromEntity.file_name).toBe('To Be Deleted.pdf');
      expect(result.removeFileFromEntity.deleted).toBe(true);
      expect(result.removeFileFromEntity.updated_by).toBe(user.id);
      expect(result.removeFileFromEntity.updated_at).toBeTruthy();

      // Verify file is marked as deleted (should still appear in list but with deleted=true)
      const listResult = await sdk.ListFilesByEntityId({
        parentEntityId: createProject.id,
        workspaceId: workspace.id,
      });
      const deletedFile = listResult.listFilesByEntityId.find(
        (f) => f.id === addFileToEntity.id,
      );
      expect(deletedFile?.deleted).toBeUndefined();
    });

    it('should fail to remove a non-existent file', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.RemoveFileFromEntity({
          fileId: 'non-existent-file-id',
        }),
      ).rejects.toThrow('File not found or already deleted');
    });

    it('should fail to remove an already deleted file', async () => {
      const { sdk, utils } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a project
      const projectInput = {
        workspaceId: workspace.id,
        name: 'Double Delete Project',
        project_code: 'DDEL-001',
        description: 'Project for double deletion test',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // Upload and add a file
      const fileKey = `uploads/test-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('File to be deleted twice'),
          ContentType: 'application/pdf',
        }),
      );

      const { addFileToEntity } = await sdk.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createProject.id,
        parentEntityType: ResourceTypes.ErpProject,
        fileKey,
        fileName: 'Double Delete.pdf',
      });

      // Remove the file once
      await sdk.RemoveFileFromEntity({
        fileId: addFileToEntity.id,
      });

      // Try to remove it again (should fail)
      await expect(
        sdk.RemoveFileFromEntity({
          fileId: addFileToEntity.id,
        }),
      ).rejects.toThrow('File not found or already deleted');
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should not allow user from different company to access files', async () => {
      // User A creates files in company X
      const { sdk: sdkA, utils: utilsA } = await createClient({
        companyId: 'company-x',
        userId: 'user-a',
        userName: 'Alice',
      });

      // Create workspace for company X
      const workspace = await utilsA.createWorkspace();

      // Create a project in company X
      const projectInput = {
        workspaceId: workspace.id,
        name: 'Company X Project',
        project_code: 'CX-001',
        description: 'Confidential project',
        deleted: false,
      };
      const { createProject } = await sdkA.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // Upload and add a confidential file
      const fileKey = `uploads/confidential-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('Confidential company X data'),
          ContentType: 'application/pdf',
        }),
      );

      const { addFileToEntity } = await sdkA.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createProject.id,
        parentEntityType: ResourceTypes.ErpProject,
        fileKey,
        fileName: 'Confidential.pdf',
        metadata: { confidential: true },
      });

      // User B from company Y tries to access the files
      const { sdk: sdkB } = await createClient({
        companyId: 'company-y',
        userId: 'user-b',
        userName: 'Bob',
      });

      // Try to list files (should fail or return empty)
      await expect(
        sdkB.ListFilesByEntityId({
          parentEntityId: createProject.id,
          workspaceId: workspace.id,
        }),
      ).rejects.toThrow();

      // Try to rename the file (should fail)
      await expect(
        sdkB.RenameFile({
          fileId: addFileToEntity.id,
          newFileName: 'Hacked.pdf',
        }),
      ).rejects.toThrow();

      // Try to remove the file (should fail)
      await expect(
        sdkB.RemoveFileFromEntity({
          fileId: addFileToEntity.id,
        }),
      ).rejects.toThrow();

      // Verify company X can still access their files
      const listResult = await sdkA.ListFilesByEntityId({
        parentEntityId: createProject.id,
        workspaceId: workspace.id,
      });
      expect(listResult.listFilesByEntityId).toHaveLength(1);
      expect(listResult.listFilesByEntityId[0].file_name).toBe(
        'Confidential.pdf',
      );
    });
  });

  describe('File metadata and user tracking', () => {
    it('should track created_by and updated_by users correctly', async () => {
      const {
        sdk: sdkUser1,
        user: user1,
        utils: utilsUser1,
      } = await createClient({
        userId: 'user-1',
        userName: 'User One',
      });

      const user2Email = `user2-${uuidv4()}@example.com`;
      const { sdk: sdkUser2, user: user2 } = await createClient({
        userId: 'user-2',
        userName: 'User Two',
        userEmail: user2Email,
      });

      // User 1 creates workspace and project
      const workspace = await utilsUser1.createWorkspace();

      // Invite User 2 to the workspace with Admin role to allow file updates
      await utilsUser1.inviteUserToWorkspace(
        workspace.id,
        user2Email,
        [WorkspaceUserRole.Admin],
        user2.id,
      );

      const projectInput = {
        workspaceId: workspace.id,
        name: 'User Tracking Project',
        project_code: 'UT-001',
        description: 'Project for user tracking test',
        deleted: false,
      };
      const { createProject } = await sdkUser1.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // User 1 adds a file
      const fileKey = `uploads/user-track-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('User tracking test'),
          ContentType: 'application/pdf',
        }),
      );

      const { addFileToEntity } = await sdkUser1.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createProject.id,
        parentEntityType: ResourceTypes.ErpProject,
        fileKey,
        fileName: 'Original.pdf',
      });

      expect(addFileToEntity.created_by).toBe(user1.id);
      expect(addFileToEntity.updated_by).toBe(user1.id);

      // User 2 renames the file
      const { renameFile } = await sdkUser2.RenameFile({
        fileId: addFileToEntity.id,
        newFileName: 'Renamed by User Two.pdf',
      });

      expect(renameFile.updated_by).toBe(user2.id);
    });

    it('should preserve and return file metadata', async () => {
      const { sdk, user, utils } = await createClient();

      // Create workspace
      const workspace = await utils.createWorkspace();

      // Create a project first
      const projectInput = {
        workspaceId: workspace.id,
        name: 'Metadata Test Project',
        project_code: 'META-001',
        description: 'Project for metadata test',
        deleted: false,
      };
      const { createProject } = await sdk.CreateProject({
        input: projectInput,
      });
      if (!createProject) throw new Error('Project was not created');

      // Create a sales order
      const salesOrderInput = {
        workspace_id: workspace.id,
        buyer_id: user.id,
        purchase_order_number: 'SO-META-001',
        project_id: createProject.id,
      };
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: salesOrderInput,
      });
      if (!createSalesOrder) throw new Error('Sales order was not created');

      // Upload file with rich metadata
      const fileKey = `uploads/metadata-${uuidv4()}.pdf`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: fileKey,
          Body: Buffer.from('File with metadata'),
          ContentType: 'application/pdf',
        }),
      );

      const metadata = {
        department: 'Finance',
        documentType: 'Invoice',
        fiscalYear: 2024,
        approved: true,
        approvers: ['manager1', 'manager2'],
        tags: ['urgent', 'quarterly-report'],
        customFields: {
          projectCode: 'PROJ-123',
          costCenter: 'CC-456',
        },
      };

      const { addFileToEntity } = await sdk.AddFileToEntity({
        workspaceId: workspace.id,
        parentEntityId: createSalesOrder.id,
        parentEntityType: ResourceTypes.ErpSalesOrder,
        fileKey,
        fileName: 'Metadata Test.pdf',
        metadata,
      });

      expect(addFileToEntity.metadata).toEqual(metadata);

      // Verify metadata is preserved when listing
      const listResult = await sdk.ListFilesByEntityId({
        parentEntityId: createSalesOrder.id,
        workspaceId: workspace.id,
      });

      const fileWithMetadata = listResult.listFilesByEntityId.find(
        (f) => f.id === addFileToEntity.id,
      );
      expect(fileWithMetadata?.metadata).toEqual(metadata);
    });
  });
});
