import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getEnvConfig } from '../../../config';
import { createMcpTool } from './types';

const BRAVE_SEARCH_API_URL = 'https://api.search.brave.com/res/v1/web/search';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;
  };
}

/**
 * brave_search MCP tool definition
 * Performs web searches using the Brave Search API
 */
export const braveSearchTool = createMcpTool({
  name: 'brave_search',
  description:
    'Search the web using Brave Search API. Returns relevant web results for the given query.',
  inputSchema: {
    query: z.string().describe('The search query'),
    count: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe('Number of results to return (1-20, default 10)'),
  },
  handler: async (_sdk, args): Promise<CallToolResult> => {
    try {
      const config = getEnvConfig();
      const apiKey = config.BRAVE_SEARCH_API_KEY;

      if (!apiKey) {
        return {
          content: [
            {
              type: 'text',
              text: 'Brave Search API key is not configured. Please set BRAVE_SEARCH_API_KEY environment variable.',
            },
          ],
          isError: true,
        };
      }

      const { query, count = 10 } = args;

      const url = new URL(BRAVE_SEARCH_API_URL);
      url.searchParams.set('q', query);
      url.searchParams.set('count', count.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: 'text',
              text: `Brave Search API error: ${response.status} ${response.statusText}`,
            },
          ],
          isError: true,
        };
      }

      const data: BraveSearchResponse = await response.json();

      const results: BraveSearchResult[] = (data.web?.results || []).map(
        (result) => ({
          title: result.title || '',
          url: result.url || '',
          description: result.description || '',
        }),
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                count: results.length,
                results,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error performing search: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
