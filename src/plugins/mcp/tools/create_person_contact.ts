import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import { PersonContactType } from '../generated/graphql';

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
      personType
      businessId
      notes
      profilePicture
      contactType
      workspaceId
      createdAt
      updatedAt
      resourceMapIds
      resource_map_entries {
        id
        value
        tagType
        parent_id
        hierarchy_id
        hierarchy_name
        path
        location {
          kind
          latLng {
            lat
            lng
            accuracyMeters
          }
          address {
            line1
            city
            state
            postalCode
            country
          }
          plusCode {
            code
            localArea
          }
        }
      }
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
    personType: z
      .enum(['EMPLOYEE', 'EXTERNAL'])
      .optional()
      .describe(
        'Optional person type. Use EMPLOYEE for internal people or EXTERNAL for outside contacts.',
      ),
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
        personType,
        businessId,
        phone,
        notes,
        profilePicture,
        resourceMapIds,
      } = args;
      const personTypeEnum =
        personType === 'EMPLOYEE'
          ? PersonContactType.Employee
          : personType === 'EXTERNAL'
            ? PersonContactType.External
            : undefined;

      const result = await sdk.McpCreatePersonContact({
        input: {
          workspaceId,
          name,
          email,
          ...(personTypeEnum && { personType: personTypeEnum }),
          businessId,
          ...(phone && { phone }),
          ...(notes && { notes }),
          ...(profilePicture && { profilePicture }),
          ...(resourceMapIds !== undefined && { resourceMapIds }),
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
