import { z } from 'zod';
import { webFetch } from '../../../lib/web-fetch';
import { createMcpTool } from './types';

const webFetchInputSchema = {
  url: z.string().describe('The URL to fetch (http/https only)'),
  timeoutMs: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .optional()
    .describe('Navigation timeout in milliseconds (default 15000)'),
  waitMs: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe('Extra wait after load for dynamic content (default 1000)'),
  maxChars: z
    .number()
    .int()
    .min(1)
    .max(200000)
    .optional()
    .describe('Maximum characters returned per field (default 50000)'),
  extractTables: z
    .boolean()
    .optional()
    .describe('Whether to extract table rows as text (default true)'),
  includeHtml: z
    .boolean()
    .optional()
    .describe('Whether to include extracted HTML (default false)'),
} as const;

const createWebFetchTool = (options: { name: string; description: string }) =>
  createMcpTool({
    name: options.name,
    description: options.description,
    inputSchema: webFetchInputSchema,
    handler: async (_sdk, args) => {
      try {
        const result = await webFetch(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: 'text' as const, text: `Error fetching URL: ${message}` },
          ],
          isError: true,
        };
      }
    },
  });

/**
 * web.fetch MCP tool definition
 *
 * Purpose: fetch and extract web page content for “spec harvest” workflows.
 *
 * Note: We also expose a legacy alias `fetch_url` for older prompts/UI allowlists.
 */
export const webFetchTool = createWebFetchTool({
  name: 'web.fetch',
  description:
    'Fetch and extract page content from a URL (with SSRF protection). Returns extracted text and table rows for spec harvesting.',
});

export const fetchUrlTool = createWebFetchTool({
  name: 'fetch_url',
  description:
    'Alias for web.fetch. Fetch and extract page content from a URL (with SSRF protection).',
});
