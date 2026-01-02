import { FastifyReply, FastifyRequest } from 'fastify';
import { closeWebFetcherBrowser, webFetch } from '../../../lib/web-fetch';

interface FetchUrlBody {
  url: string;
}

interface FetchUrlResponse {
  url: string;
  title: string;
  content: string;
  error?: string;
}

// Configuration constants
const PUPPETEER_TIMEOUT_MS = 15000; // 15 seconds
const DYNAMIC_CONTENT_WAIT_MS = 1000; // 1 second
const MAX_CONTENT_LENGTH = 50000; // 50KB

/**
 * Handler for fetching and extracting content from URLs using Puppeteer
 * Supports JavaScript-rendered pages
 */
export function fetchUrlHandler() {
  return async (
    request: FastifyRequest<{ Body: FetchUrlBody }>,
    reply: FastifyReply,
  ) => {
    // Exit early if no authenticated user
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const { url } = request.body;

    // Validate URL
    if (!url) {
      return reply.status(400).send({
        error: 'URL is required',
      });
    }

    try {
      const result = await webFetch({
        url,
        timeoutMs: PUPPETEER_TIMEOUT_MS,
        waitMs: DYNAMIC_CONTENT_WAIT_MS,
        maxChars: MAX_CONTENT_LENGTH,
        extractTables: true,
      });

      const combined = [result.tablesText, result.text].filter(Boolean).join(
        '\n\n',
      );
      const truncatedContent = combined.slice(0, MAX_CONTENT_LENGTH);

      // Log successful fetch
      request.log.info(
        {
          url,
          titleLength: result.title.length,
          contentLength: combined.length,
          truncated: combined.length > MAX_CONTENT_LENGTH,
        },
        'Successfully fetched URL content',
      );

      return reply.status(200).send({
        url,
        title: result.title,
        content: truncatedContent,
      } as FetchUrlResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific errors
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('Navigation timeout')
      ) {
        return reply.status(200).send({
          url,
          title: '',
          content: '',
          error: 'Request timed out (15s limit)',
        } as FetchUrlResponse);
      }

      if (errorMessage.includes('net::ERR_')) {
        return reply.status(200).send({
          url,
          title: '',
          content: '',
          error: `Network error: ${errorMessage}`,
        } as FetchUrlResponse);
      }

      if (
        errorMessage.includes('Invalid URL') ||
        errorMessage.includes('Only HTTP and HTTPS') ||
        errorMessage.includes('Access to private networks') ||
        errorMessage.includes('URL credentials')
      ) {
        return reply.status(400).send({ error: errorMessage });
      }

      request.log.error({ error, url }, 'Failed to fetch URL with Puppeteer');

      return reply.status(200).send({
        url,
        title: '',
        content: '',
        error: `Failed to fetch URL: ${errorMessage}`,
      } as FetchUrlResponse);
    }
  };
}

/**
 * Cleanup function to close browser on shutdown
 */
export async function closeBrowser(): Promise<void> {
  await closeWebFetcherBrowser();
}
