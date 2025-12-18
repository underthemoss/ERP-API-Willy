import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for create_person_contact tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpCreatePersonContact($input: PersonContactInput!) {
    createPersonContact(input: $input) {
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
 * create_person_contact MCP tool definition
 *
 * Creates a new person contact in a workspace.
 */
export const createPersonContactTool = createMcpTool({
  name: 'create_person_contact',
  description:
    'Creates a new person contact (individual) in the workspace. Returns the created contact with their employer business details.',
  inputSchema: {
    workspaceId: z
      .string()
      .describe('The workspace ID to create the contact in'),
    name: z.string().describe("The contact's full name"),
    email: z.string().describe("The contact's email address"),
    role: z
      .string()
      .describe("The contact's job title or role at their company"),
    businessId: z
      .string()
      .describe('The ID of the business contact this person works for'),
    phone: z.string().optional().describe("The contact's phone number"),
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
      const {
        workspaceId,
        name,
        email,
        role,
        businessId,
        phone,
        notes,
        profilePicture,
        resourceMapIds,
      } = args;

      const result = await sdk.McpCreatePersonContact({
        input: {
          workspaceId,
          name,
          email,
          role,
          businessId,
          ...(phone && { phone }),
          ...(notes && { notes }),
          ...(profilePicture && { profilePicture }),
          ...(resourceMapIds && { resourceMapIds }),
        },
      });

      const contact = result.createPersonContact;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Person contact "${contact?.name}" created successfully`,
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
            text: `Error creating person contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
