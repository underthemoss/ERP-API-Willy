import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for update_person_contact tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpUpdatePersonContact($id: ID!, $input: UpdatePersonContactInput!) {
    updatePersonContact(id: $id, input: $input) {
      id
      name
      phone
      email
      role
      businessId
      notes
      profilePicture
      contactType
      workspaceId
      createdAt
      updatedAt
      resourceMapIds
      business {
        id
        name
        phone
        address
        website
      }
    }
  }
`;

/**
 * update_person_contact MCP tool definition
 *
 * Updates a person contact's details. All fields except id are optional -
 * only provided fields will be updated.
 */
export const updatePersonContactTool = createMcpTool({
  name: 'update_person_contact',
  description:
    'Updates a person contact (individual) in the workspace. Only provided fields will be updated. Returns the updated contact with their employer business details.',
  inputSchema: {
    id: z.string().describe('The ID of the person contact to update'),
    name: z.string().optional().describe("The contact's full name"),
    phone: z.string().optional().describe("The contact's phone number"),
    email: z.string().optional().describe("The contact's email address"),
    role: z
      .string()
      .optional()
      .describe("The contact's job title or role at their company"),
    businessId: z
      .string()
      .optional()
      .describe('The ID of the business contact this person works for'),
    notes: z.string().optional().describe('Notes about this contact'),
    profilePicture: z
      .string()
      .optional()
      .describe('URL to the profile picture'),
    resourceMapIds: z
      .array(z.string())
      .optional()
      .describe('Array of resource map IDs to associate with this contact'),
  },
  handler: async (sdk, args) => {
    try {
      const { id, ...inputFields } = args;

      // Filter out undefined values to only send fields that were explicitly provided
      const input = Object.fromEntries(
        Object.entries(inputFields).filter(([_, value]) => value !== undefined),
      );

      if (Object.keys(input).length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: No fields provided to update. Please provide at least one field to update.',
            },
          ],
          isError: true,
        };
      }

      const result = await sdk.McpUpdatePersonContact({
        id,
        input,
      });

      const contact = result.updatePersonContact;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Person contact "${contact?.name}" updated successfully`,
                contact,
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
            text: `Error updating person contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
