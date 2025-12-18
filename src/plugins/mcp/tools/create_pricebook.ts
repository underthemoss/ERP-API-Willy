import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

gql`
  mutation McpCreatePriceBook($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      workspaceId
      name
      notes
      location
      businessContactId
      projectId
      parentPriceBookId
      parentPriceBookPercentageFactor
      createdAt
      updatedAt
    }
  }
`;

export const createPricebookTool = createMcpTool({
  name: 'create_pricebook',
  description:
    'Create a new price book for a workspace. Price books contain pricing information and can be associated with business contacts, projects, or locations.',
  inputSchema: {
    workspaceId: z
      .string()
      .describe('The workspace ID to create the price book in'),
    name: z.string().describe('Name of the price book'),
    notes: z
      .string()
      .optional()
      .describe('Optional notes about the price book'),
    location: z
      .string()
      .optional()
      .describe('Optional location associated with the price book'),
    businessContactId: z
      .string()
      .optional()
      .describe('Optional business contact ID to associate'),
    projectId: z
      .string()
      .optional()
      .describe('Optional project ID to associate'),
    parentPriceBookId: z
      .string()
      .optional()
      .describe('Optional parent price book ID for inheritance'),
    parentPriceBookPercentageFactor: z
      .number()
      .optional()
      .describe('Percentage factor for parent price book (default 1.0)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpCreatePriceBook({
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          notes: args.notes,
          location: args.location,
          businessContactId: args.businessContactId,
          projectId: args.projectId,
          parentPriceBookId: args.parentPriceBookId,
          parentPriceBookPercentageFactor: args.parentPriceBookPercentageFactor,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                priceBook: result.createPriceBook,
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
            type: 'text' as const,
            text: `Error creating price book: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
