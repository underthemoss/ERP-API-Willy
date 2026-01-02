import OpenAI from 'openai';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import sharp from 'sharp';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { logger } from '../../lib/logger';
import { EnvConfig } from '../../config';

export type ImageSize = 'list' | 'card' | 'preview' | 'full';

const IMAGE_SIZES: Record<ImageSize, number> = {
  list: 128,
  card: 256,
  preview: 512,
  full: 1024,
} as const;

/**
 * Convert a readable stream to a Buffer
 * This is necessary because S3 GetObjectCommand returns a stream,
 * but we need a Buffer for proper HTTP responses and DevTools preview
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class ImageGeneratorService {
  private openaiClient: OpenAI;
  public readonly s3Client: S3Client;
  public readonly bucket: string;
  private readonly storageMode: 's3' | 'fs';
  private readonly localCacheRoot: string;

  constructor(config: EnvConfig) {
    this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const hasRealS3Config =
      config.FILE_SERVICE_BUCKET !== 'dummy' &&
      config.FILE_SERVICE_KEY !== 'dummy' &&
      config.FILE_SERVICE_SECRET !== 'dummy';

    this.storageMode = hasRealS3Config ? 's3' : 'fs';
    this.localCacheRoot = path.join(os.tmpdir(), 'es-erp-api', 'image-cache');

    // Initialize S3 client
    const s3Config: any = {
      region: config.FILE_SERVICE_REGION || 'us-west-2',
      credentials: {
        accessKeyId: config.FILE_SERVICE_KEY,
        secretAccessKey: config.FILE_SERVICE_SECRET,
      },
    };

    if (config.FILE_SERVICE_ENDPOINT) {
      s3Config.endpoint = config.FILE_SERVICE_ENDPOINT;
      s3Config.forcePathStyle = true;
    }

    this.s3Client = new S3Client(s3Config);
    this.bucket = config.FILE_SERVICE_BUCKET;
  }

  private async getObject(key: string): Promise<{
    body: Buffer;
    contentLength: number;
  }> {
    if (this.storageMode === 'fs') {
      const filePath = path.join(this.localCacheRoot, key);
      try {
        const body = await fs.readFile(filePath);
        return { body, contentLength: body.length };
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          const noSuchKeyError: any = new Error('NoSuchKey');
          noSuchKeyError.name = 'NoSuchKey';
          throw noSuchKeyError;
        }
        throw error;
      }
    }

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const body = await streamToBuffer(response.Body as Readable);
    return { body, contentLength: response.ContentLength || 0 };
  }

  private async putObject(key: string, body: Buffer): Promise<void> {
    if (this.storageMode === 'fs') {
      const filePath = path.join(this.localCacheRoot, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, body);
      return;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: 'image/png',
      }),
    );
  }

  /**
   * Generate all image sizes for a specific entity and upload to S3
   * @param entityType The type of entity (e.g., 'prices')
   * @param entityId The ID of the entity
   * @param promptHash The hash of the prompt used to generate the image
   * @param prompt The prompt to generate the image from
   */
  async generateAllImageSizesForEntity(
    entityType: string,
    entityId: string,
    promptHash: string,
    prompt: string,
  ): Promise<void> {
    try {
      // Generate full-size image with OpenAI
      const result = await this.openaiClient.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      });

      if (!result.data?.[0]?.b64_json) {
        throw new Error('No image data returned from OpenAI');
      }

      // Convert base64 to buffer
      const imageBase64 = result.data[0].b64_json;
      const fullImageBuffer = Buffer.from(imageBase64, 'base64');

      logger.info(
        { entityType, entityId, promptHash },
        'Generated full-size image from OpenAI',
      );

      // Generate and upload all sizes
      const uploadPromises = Object.entries(IMAGE_SIZES).map(
        async ([sizeName, dimension]) => {
          const size = sizeName as ImageSize;

          // Resize image or use original for full size
          const imageBuffer =
            size === 'full'
              ? fullImageBuffer
              : await sharp(fullImageBuffer)
                  .resize(dimension, dimension, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 },
                  })
                  .png()
                  .toBuffer();

          // Path: images/{entityType}/{entityId}/{promptHash}/{size}.png
          const key = `images/${entityType}/${entityId}/${promptHash}/${size}.png`;

          logger.info(
            { entityType, entityId, promptHash, size, key },
            this.storageMode === 's3'
              ? 'Uploading image size to S3'
              : 'Writing image size to local cache',
          );

          await this.putObject(key, imageBuffer);

          logger.info(
            { entityType, entityId, promptHash, size },
            this.storageMode === 's3'
              ? 'Uploaded image size to S3'
              : 'Wrote image size to local cache',
          );
        },
      );

      await Promise.all(uploadPromises);

      logger.info(
        { entityType, entityId, promptHash },
        'All image sizes generated and uploaded',
      );
    } catch (err) {
      logger.error(
        { err, entityType, entityId, promptHash, prompt },
        'Error generating entity images',
      );
      throw new Error('Failed to generate images');
    }
  }

  /**
   * Fetch an image for a specific entity from S3, or generate it if it doesn't exist
   * @param entityType The type of entity (e.g., 'prices')
   * @param entityId The ID of the entity
   * @param promptHash The hash of the prompt used to generate the image
   * @param prompt The prompt to generate the image from if it doesn't exist
   * @param size The size of the image to fetch (defaults to 'list')
   */
  async fetchImageForEntity(
    entityType: string,
    entityId: string,
    promptHash: string,
    prompt: string,
    size: ImageSize = 'list',
  ): Promise<{
    imageBody: Buffer;
    hash: string;
    contentType: string;
    contentLength: number;
  }> {
    // Path: images/{entityType}/{entityId}/{promptHash}/{size}.png
    const key = `images/${entityType}/${entityId}/${promptHash}/${size}.png`;

    // Try to get from S3 first
    try {
      const { body: imageBuffer, contentLength } = await this.getObject(key);

      return {
        imageBody: imageBuffer,
        hash: promptHash,
        contentType: 'image/png',
        contentLength,
      };
    } catch (err: any) {
      // Not found, generate all sizes
      if (err.name === 'NoSuchKey') {
        logger.info(
          { entityType, entityId, promptHash, size, key },
          'Entity image not found, generating all sizes',
        );

        // Generate and upload all image sizes
        await this.generateAllImageSizesForEntity(
          entityType,
          entityId,
          promptHash,
          prompt,
        );

        // Fetch and return the requested size
        const { body: imageBuffer, contentLength } = await this.getObject(key);

        return {
          imageBody: imageBuffer,
          hash: promptHash,
          contentType: 'image/png',
          contentLength,
        };
      }
      throw err;
    }
  }
}

export const createImageGeneratorService = (config: EnvConfig) => {
  return new ImageGeneratorService(config);
};
