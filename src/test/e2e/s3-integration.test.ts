import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

describe('LocalStack S3 Integration', () => {
  let s3Client: S3Client;
  const testBucket = 'test-bucket';

  beforeAll(() => {
    // Read the global config to get LocalStack S3 details
    const globalConfigPath = path.join(__dirname, 'globalConfig.json');
    const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));

    // Create S3 client with LocalStack configuration
    s3Client = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      },
      forcePathStyle: true, // Required for LocalStack
    });
  });

  it('should successfully upload a file to LocalStack S3', async () => {
    const testKey = 'test-files/test-document.txt';
    const testContent = 'This is a test file for LocalStack S3 integration';

    // Upload a file
    const putCommand = new PutObjectCommand({
      Bucket: testBucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);

    // Verify the file exists by getting it back
    const getCommand = new GetObjectCommand({
      Bucket: testBucket,
      Key: testKey,
    });

    const response = await s3Client.send(getCommand);
    const bodyContent = await response.Body?.transformToString();

    expect(bodyContent).toBe(testContent);
    expect(response.ContentType).toBe('text/plain');
  });

  it('should list objects in the bucket', async () => {
    // First upload another test file
    const testKey2 = 'test-files/another-document.txt';
    await s3Client.send(
      new PutObjectCommand({
        Bucket: testBucket,
        Key: testKey2,
        Body: Buffer.from('Another test file'),
      }),
    );

    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: testBucket,
      Prefix: 'test-files/',
    });

    const listResponse = await s3Client.send(listCommand);

    expect(listResponse.Contents).toBeDefined();
    expect(listResponse.Contents?.length).toBeGreaterThanOrEqual(2);

    const keys = listResponse.Contents?.map((obj) => obj.Key) || [];
    expect(keys).toContain('test-files/test-document.txt');
    expect(keys).toContain('test-files/another-document.txt');
  });

  it('should handle binary files (simulating PDF upload)', async () => {
    const pdfKey = 'uploads/test-document.pdf';
    // Create a simple binary buffer (simulating a PDF)
    const binaryContent = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
    ]); // PDF header

    const putCommand = new PutObjectCommand({
      Bucket: testBucket,
      Key: pdfKey,
      Body: binaryContent,
      ContentType: 'application/pdf',
    });

    await s3Client.send(putCommand);

    // Get the file back
    const getCommand = new GetObjectCommand({
      Bucket: testBucket,
      Key: pdfKey,
    });

    const response = await s3Client.send(getCommand);
    const bodyBytes = await response.Body?.transformToByteArray();

    expect(bodyBytes).toEqual(new Uint8Array(binaryContent));
    expect(response.ContentType).toBe('application/pdf');
    expect(response.ContentLength).toBe(binaryContent.length);
  });

  it('should work with the FileService upload pattern', async () => {
    // Simulate what FileService does
    const uuid = 'test-uuid-' + Date.now();
    const key = `uploads/${uuid}.pdf`;

    const putCommand = new PutObjectCommand({
      Bucket: testBucket,
      Key: key,
      Body: Buffer.from('Mock PDF content'),
      ContentType: 'application/pdf',
    });

    await s3Client.send(putCommand);

    // Verify it was uploaded
    const getCommand = new GetObjectCommand({
      Bucket: testBucket,
      Key: key,
    });

    const response = await s3Client.send(getCommand);

    expect(response).toBeDefined();
    expect(response.ContentType).toBe('application/pdf');
    expect(response.ContentLength).toBeGreaterThan(0);
  });
});
