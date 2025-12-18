import { objectType, extendType, stringArg, intArg, nonNull } from 'nexus';
import { v1 } from '@authzed/authzed-node';
import { createClient } from '../../lib/authz/spiceDB-client';
import { MongoClient } from 'mongodb';

// Type definitions for SpiceDB relationships
export const SpiceDBObjectReference = objectType({
  name: 'SpiceDBObjectReference',
  definition(t) {
    t.nonNull.string('type');
    t.nonNull.string('id');
  },
});

export const SpiceDBSubjectReference = objectType({
  name: 'SpiceDBSubjectReference',
  definition(t) {
    t.nonNull.string('type');
    t.nonNull.string('id');
    t.string('relation');
  },
});

export const SpiceDBRelationship = objectType({
  name: 'SpiceDBRelationship',
  definition(t) {
    t.nonNull.field('resource', {
      type: SpiceDBObjectReference,
    });
    t.nonNull.string('relation');
    t.nonNull.field('subject', {
      type: SpiceDBSubjectReference,
    });
  },
});

export const ListRelationshipsResult = objectType({
  name: 'ListRelationshipsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('relationships', {
      type: SpiceDBRelationship,
    });
    t.string('cursor');
  },
});

// Result type for delete operation
export const DeleteRelationshipResult = objectType({
  name: 'DeleteRelationshipResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
  },
});

// Result type for write operation
export const WriteRelationshipResult = objectType({
  name: 'WriteRelationshipResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
    t.field('relationship', {
      type: SpiceDBRelationship,
      description: 'The created/updated relationship',
    });
  },
});

// Type for available relations
export const AvailableRelation = objectType({
  name: 'AvailableRelation',
  definition(t) {
    t.nonNull.string('relation');
    t.string('description');
    t.nonNull.list.nonNull.string('allowedResourceTypes');
    t.nonNull.list.nonNull.string('allowedSubjectTypes');
    t.nonNull.boolean('isComputed');
  },
});

// Type for collection snapshot result
export const CollectionSnapshotResult = objectType({
  name: 'CollectionSnapshotResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.nonNull.string('collectionName');
    t.nonNull.int('documentsUpdated');
    t.string('error');
    t.string('timestamp');
  },
});

// Type for send test email result
export const SendTestEmailResult = objectType({
  name: 'SendTestEmailResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
    t.string('error');
  },
});

// Type for send templated email result
export const SendTemplatedEmailResult = objectType({
  name: 'SendTemplatedEmailResult',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
    t.string('error');
  },
});

// Type for email template preview result
export const EmailTemplatePreviewResult = objectType({
  name: 'EmailTemplatePreviewResult',
  definition(t) {
    t.nonNull.string('html', {
      description: 'The generated HTML content of the email template',
    });
  },
});

// Extend the existing AdminQueryNamespace from auth0-management.ts
export const SpiceDBAdminQueries = extendType({
  type: 'AdminQueryNamespace',
  definition(t) {
    t.nonNull.field('previewEmailTemplate', {
      type: EmailTemplatePreviewResult,
      description:
        'Preview the HTML output of an email template without sending it',
      args: {
        title: nonNull(
          stringArg({
            description: 'Title displayed in the email header',
          }),
        ),
        subtitle: stringArg({
          description: 'Optional subtitle displayed below the title',
        }),
        content: nonNull(
          stringArg({
            description: 'HTML content for the email body',
          }),
        ),
        primaryCtaText: stringArg({
          description: 'Text for the primary call-to-action button',
        }),
        primaryCtaUrl: stringArg({
          description: 'URL for the primary call-to-action button',
        }),
        secondaryCtaText: stringArg({
          description: 'Text for the secondary call-to-action button',
        }),
        secondaryCtaUrl: stringArg({
          description: 'URL for the secondary call-to-action button',
        }),
        bannerImgUrl: stringArg({
          description: 'Optional URL for the banner background image',
        }),
        iconUrl: stringArg({
          description: 'Optional URL for the logo/icon image',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        // This query is only accessible to PLATFORM_ADMIN users

        const {
          title,
          subtitle,
          content,
          primaryCtaText,
          primaryCtaUrl,
          secondaryCtaText,
          secondaryCtaUrl,
          bannerImgUrl,
          iconUrl,
        } = args;

        const emailService = ctx.services.emailService;

        if (!emailService) {
          throw new Error('Email service not available');
        }

        // Build CTAs if provided
        const primaryCTA =
          primaryCtaText && primaryCtaUrl
            ? { text: primaryCtaText, url: primaryCtaUrl }
            : undefined;

        const secondaryCTA =
          secondaryCtaText && secondaryCtaUrl
            ? { text: secondaryCtaText, url: secondaryCtaUrl }
            : undefined;

        // Generate the HTML preview
        const html = emailService.previewTemplatedEmail({
          title,
          subtitle: subtitle || undefined,
          content,
          primaryCTA,
          secondaryCTA,
          bannerImgUrl: bannerImgUrl || undefined,
          iconUrl: iconUrl || undefined,
        });

        return {
          html,
        };
      },
    });

    t.nonNull.string('rawZedSchema', {
      description: 'Returns the raw SpiceDB Zed schema from SpiceDB',
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Read the schema from SpiceDB
          const schemaResponse = await client.readSchema(
            v1.ReadSchemaRequest.create({}),
          );
          return schemaResponse.schemaText;
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });

    t.nonNull.list.nonNull.string('listResourceTypes', {
      description: 'List all resource types defined in the SpiceDB schema',
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Read the schema from SpiceDB
          const schemaResponse = await client.readSchema(
            v1.ReadSchemaRequest.create({}),
          );
          const schemaText = schemaResponse.schemaText;

          // Extract resource types using regex
          // Matches: definition erp/user { ... }
          // Matches: definition erp/workspace { ... }
          const resourceTypes = [
            ...schemaText.matchAll(/^\s*definition\s+([a-z0-9_/.-]+)\s*\{/gim),
          ].map((match) => match[1]);

          // Return sorted array of unique resource types
          return [...new Set(resourceTypes)].sort();
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });

    t.nonNull.list.nonNull.field('listAvailableRelations', {
      type: AvailableRelation,
      description:
        'List available relations and permissions for a resource type',
      args: {
        resourceType: stringArg({
          description:
            'Resource type to get relations for (e.g., "erp/workspace")',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Read the schema from SpiceDB
          const schemaResponse = await client.readSchema(
            v1.ReadSchemaRequest.create({}),
          );
          const schemaText = schemaResponse.schemaText;

          // If resourceType is provided, filter for that specific type
          // Otherwise, return relations for all types
          const resourceTypeFilter = args.resourceType || '[a-z0-9_/.-]+';

          // Parse the schema to extract relations and permissions
          const availableRelations: Array<{
            relation: string;
            description?: string;
            allowedResourceTypes: string[];
            allowedSubjectTypes: string[];
            isComputed: boolean;
          }> = [];

          // Regex to match definition blocks
          const definitionRegex = new RegExp(
            `^\\s*definition\\s+(${resourceTypeFilter})\\s*\\{([^}]+)\\}`,
            'gims',
          );

          let match;
          while ((match = definitionRegex.exec(schemaText)) !== null) {
            const resourceType = match[1];
            const definitionBody = match[2];

            // Extract relations (direct relationships)
            const relationRegex = /^\s*relation\s+(\w+):\s*([^\n]+)/gm;
            let relationMatch;
            while (
              (relationMatch = relationRegex.exec(definitionBody)) !== null
            ) {
              const relationName = relationMatch[1];
              const relationDef = relationMatch[2].trim();

              // Parse allowed types from the relation definition
              const allowedTypes: string[] = [];

              // Match simple type: erp/user
              const simpleTypeMatches = relationDef.match(/([a-z0-9_/.-]+)/g);
              if (simpleTypeMatches) {
                allowedTypes.push(
                  ...simpleTypeMatches.filter((t) => t.includes('/')),
                );
              }

              availableRelations.push({
                relation: relationName,
                description: `Direct relation on ${resourceType}`,
                allowedResourceTypes: [resourceType],
                allowedSubjectTypes: allowedTypes,
                isComputed: false,
              });
            }

            // Extract permissions (computed relationships)
            const permissionRegex = /^\s*permission\s+(\w+)\s*=\s*([^\n]+)/gm;
            let permissionMatch;
            while (
              (permissionMatch = permissionRegex.exec(definitionBody)) !== null
            ) {
              const permissionName = permissionMatch[1];
              const permissionDef = permissionMatch[2].trim();

              // For permissions, we need to analyze the expression to determine allowed types
              // This is a simplified version - a full parser would be more accurate
              const referencedRelations = new Set<string>();
              const relationRefRegex = /(\w+)(?:\s*\+|\s*$|->)/g;
              let refMatch;
              while (
                (refMatch = relationRefRegex.exec(permissionDef)) !== null
              ) {
                referencedRelations.add(refMatch[1]);
              }

              // Get subject types from referenced relations
              const subjectTypes = new Set<string>();
              for (const rel of availableRelations) {
                if (
                  referencedRelations.has(rel.relation) &&
                  rel.allowedResourceTypes.includes(resourceType)
                ) {
                  rel.allowedSubjectTypes.forEach((t) => subjectTypes.add(t));
                }
              }

              availableRelations.push({
                relation: permissionName,
                description: `Computed permission on ${resourceType}`,
                allowedResourceTypes: [resourceType],
                allowedSubjectTypes: Array.from(subjectTypes),
                isComputed: true,
              });
            }
          }

          return availableRelations;
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });

    t.nonNull.field('listRelationships', {
      type: 'ListRelationshipsResult',
      description: 'List SpiceDB relationships with optional filters',
      args: {
        resourceType: stringArg({
          description: 'Filter by resource type (e.g., "erp/workspace")',
        }),
        resourceId: stringArg({
          description: 'Filter by specific resource ID',
        }),
        relation: stringArg({
          description: 'Filter by relation type (e.g., "member", "admin")',
        }),
        subjectType: stringArg({
          description: 'Filter by subject type (e.g., "erp/user")',
        }),
        subjectId: stringArg({
          description: 'Filter by specific subject ID',
        }),
        limit: intArg({
          description: 'Maximum number of results to return',
          default: 100,
        }),
        cursor: stringArg({
          description: 'Pagination cursor from previous request',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Build the relationship filter
          const relationshipFilter = v1.RelationshipFilter.create({
            resourceType: args.resourceType || '',
            optionalResourceId: args.resourceId || undefined,
            optionalRelation: args.relation || undefined,
            optionalSubjectFilter: args.subjectType
              ? v1.SubjectFilter.create({
                  subjectType: args.subjectType,
                  optionalSubjectId: args.subjectId || undefined,
                })
              : undefined,
          });

          // Read relationships from SpiceDB
          const relationships: v1.ReadRelationshipsResponse[] = [];
          const cursor = args.cursor
            ? v1.Cursor.create({ token: args.cursor })
            : undefined;
          const limit = args.limit || 100;

          const response = await client.readRelationships(
            v1.ReadRelationshipsRequest.create({
              relationshipFilter,
              optionalLimit: limit,
              optionalCursor: cursor,
            }),
          );

          relationships.push(...response);

          // Get the last cursor if there are results
          const lastCursor =
            relationships.length > 0
              ? relationships[relationships.length - 1].afterResultCursor?.token
              : undefined;

          // Transform the response to match our GraphQL schema
          const transformedRelationships = relationships.map((rel) => ({
            resource: {
              type: rel.relationship?.resource?.objectType || '',
              id: rel.relationship?.resource?.objectId || '',
            },
            relation: rel.relationship?.relation || '',
            subject: {
              type: rel.relationship?.subject?.object?.objectType || '',
              id: rel.relationship?.subject?.object?.objectId || '',
              relation:
                rel.relationship?.subject?.optionalRelation || undefined,
            },
          }));

          return {
            relationships: transformedRelationships,
            cursor: lastCursor,
          };
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });
  },
});

// Extend the existing AdminMutationNamespace from auth0-management.ts
export const SpiceDBAdminMutations = extendType({
  type: 'AdminMutationNamespace',
  definition(t) {
    t.nonNull.field('sendTestEmail', {
      type: SendTestEmailResult,
      description:
        'Send a test email to verify email configuration (Admin only)',
      args: {
        to: nonNull(
          stringArg({
            description: 'Email address to send the test email to',
          }),
        ),
        subject: stringArg({
          description: 'Subject of the test email',
          default: 'Test Email from ES ERP API',
        }),
        message: stringArg({
          description: 'Optional custom message for the email body',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        // This mutation is only accessible to PLATFORM_ADMIN users

        const { to, subject, message } = args;
        const emailService = ctx.services.emailService;

        if (!emailService) {
          throw new Error('Email service not available');
        }

        // Build email content
        const timestamp = new Date().toISOString();
        const environment = ctx.envConfig.LEVEL || 'unknown';
        const defaultMessage = `This is a test email sent from the ES ERP API admin panel.`;
        const emailBody = message || defaultMessage;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Test Email</h2>
            <p>${emailBody}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              <strong>Environment:</strong> ${environment}<br>
              <strong>Timestamp:</strong> ${timestamp}<br>
              <strong>Sent by:</strong> User ID: ${ctx.user?.id || 'Unknown'}
            </p>
          </div>
        `;

        const textContent = `
Test Email

${emailBody}

---
Environment: ${environment}
Timestamp: ${timestamp}
Sent by: User ID: ${ctx.user?.id || 'Unknown'}
        `.trim();

        try {
          await emailService.sendEmail({
            to,
            from: 'noreply@equipmentshare.com',
            subject: subject || 'Test Email from ES ERP API',
            text: textContent,
            html: htmlContent,
          });

          return {
            success: true,
            message: `Test email successfully sent to ${to}`,
            error: null,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';

          return {
            success: false,
            message: null,
            error: `Failed to send test email: ${errorMessage}`,
          };
        }
      },
    });

    t.nonNull.field('sendTemplatedEmail', {
      type: SendTemplatedEmailResult,
      description:
        'Send an email using the professional HTML template (Admin only)',
      args: {
        to: nonNull(
          stringArg({
            description: 'Email address to send the email to',
          }),
        ),
        subject: nonNull(
          stringArg({
            description: 'Subject of the email',
          }),
        ),
        title: nonNull(
          stringArg({
            description: 'Title displayed in the email header',
          }),
        ),
        subtitle: stringArg({
          description: 'Optional subtitle displayed below the title',
        }),
        content: nonNull(
          stringArg({
            description: 'HTML content for the email body',
          }),
        ),
        primaryCtaText: stringArg({
          description: 'Text for the primary call-to-action button',
        }),
        primaryCtaUrl: stringArg({
          description: 'URL for the primary call-to-action button',
        }),
        secondaryCtaText: stringArg({
          description: 'Text for the secondary call-to-action button',
        }),
        secondaryCtaUrl: stringArg({
          description: 'URL for the secondary call-to-action button',
        }),
        bannerImgUrl: stringArg({
          description: 'Optional URL for the banner background image',
        }),
        iconUrl: stringArg({
          description: 'Optional URL for the logo/icon image',
        }),
        replyTo: stringArg({
          description: 'Optional reply-to email address',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        // This mutation is only accessible to PLATFORM_ADMIN users

        const {
          to,
          subject,
          title,
          subtitle,
          content,
          primaryCtaText,
          primaryCtaUrl,
          secondaryCtaText,
          secondaryCtaUrl,
          replyTo,
        } = args;

        // Extract the new image URL fields
        const bannerImgUrl = (args as any).bannerImgUrl;
        const iconUrl = (args as any).iconUrl;

        const emailService = ctx.services.emailService;

        if (!emailService) {
          throw new Error('Email service not available');
        }

        // Build CTAs if provided
        const primaryCTA =
          primaryCtaText && primaryCtaUrl
            ? { text: primaryCtaText, url: primaryCtaUrl }
            : undefined;

        const secondaryCTA =
          secondaryCtaText && secondaryCtaUrl
            ? { text: secondaryCtaText, url: secondaryCtaUrl }
            : undefined;

        try {
          await emailService.sendTemplatedEmail({
            to,
            from: 'noreply@equipmentshare.com',
            subject,
            title,
            subtitle: subtitle || undefined,
            content,
            primaryCTA,
            secondaryCTA,
            bannerImgUrl: bannerImgUrl || undefined,
            iconUrl: iconUrl || undefined,
            replyTo: replyTo || undefined,
          });

          return {
            success: true,
            message: `Templated email successfully sent to ${to}`,
            error: null,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';

          return {
            success: false,
            message: null,
            error: `Failed to send templated email: ${errorMessage}`,
          };
        }
      },
    });

    t.nonNull.field('collectionSnapshot', {
      type: CollectionSnapshotResult,
      description:
        'Touch all documents in a collection by adding/updating a _touch timestamp field.',
      args: {
        collectionName: nonNull(
          stringArg({
            description: 'Name of the collection to snapshot',
          }),
        ),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        // This mutation is only accessible to PLATFORM_ADMIN users

        const { collectionName } = args;
        const timestamp = new Date().toISOString();

        // Connect to MongoDB using the same connection string from config
        const mongoClient = new MongoClient(
          ctx.envConfig.MONGO_CONNECTION_STRING,
        );

        try {
          await mongoClient.connect();
          const db = mongoClient.db('es-erp');

          // Check if collection exists
          const collections = await db
            .listCollections({ name: collectionName })
            .toArray();
          if (collections.length === 0) {
            return {
              success: false,
              collectionName,
              documentsUpdated: 0,
              error: `Collection '${collectionName}' does not exist in database 'es-erp'`,
              timestamp,
            };
          }

          // Check if collection is a system collection
          if (collectionName.startsWith('system.')) {
            return {
              success: false,
              collectionName,
              documentsUpdated: 0,
              error: 'Cannot snapshot system collections',
              timestamp,
            };
          }

          // Get the collection
          const collection = db.collection(collectionName);

          // Update all documents in the collection with the _touch field
          const updateResult = await collection.updateMany(
            {}, // Empty filter to match all documents
            {
              $set: {
                _touch: timestamp,
              },
            },
          );

          return {
            success: true,
            collectionName,
            documentsUpdated:
              updateResult.modifiedCount + updateResult.upsertedCount,
            error: null,
            timestamp,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            success: false,
            collectionName,
            documentsUpdated: 0,
            error: `Failed to snapshot collection: ${errorMessage}`,
            timestamp,
          };
        } finally {
          await mongoClient.close();
        }
      },
    });

    t.nonNull.field('writeRelationship', {
      type: WriteRelationshipResult,
      description: 'Create or update a SpiceDB relationship',
      args: {
        resourceType: nonNull(
          stringArg({
            description: 'Resource type (e.g., "erp/workspace")',
          }),
        ),
        resourceId: nonNull(
          stringArg({
            description: 'Resource ID',
          }),
        ),
        relation: nonNull(
          stringArg({
            description: 'Relation type (e.g., "member", "admin")',
          }),
        ),
        subjectType: nonNull(
          stringArg({
            description: 'Subject type (e.g., "erp/user")',
          }),
        ),
        subjectId: nonNull(
          stringArg({
            description: 'Subject ID',
          }),
        ),
        subjectRelation: stringArg({
          description:
            'Optional subject relation for indirect relationships (e.g., "member" for group membership)',
        }),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Create the relationship object
          const relationship = v1.Relationship.create({
            resource: v1.ObjectReference.create({
              objectType: args.resourceType,
              objectId: args.resourceId,
            }),
            relation: args.relation,
            subject: v1.SubjectReference.create({
              object: v1.ObjectReference.create({
                objectType: args.subjectType,
                objectId: args.subjectId,
              }),
              optionalRelation: args.subjectRelation || undefined,
            }),
          });

          // Write the relationship to SpiceDB
          await client.writeRelationships(
            v1.WriteRelationshipsRequest.create({
              updates: [
                v1.RelationshipUpdate.create({
                  operation: v1.RelationshipUpdate_Operation.CREATE,
                  relationship,
                }),
              ],
            }),
          );

          // Return success with the created relationship
          return {
            success: true,
            message: `Successfully created relationship: ${args.subjectType}:${args.subjectId}${
              args.subjectRelation ? '#' + args.subjectRelation : ''
            } ${args.relation} ${args.resourceType}:${args.resourceId}`,
            relationship: {
              resource: {
                type: args.resourceType,
                id: args.resourceId,
              },
              relation: args.relation,
              subject: {
                type: args.subjectType,
                id: args.subjectId,
                relation: args.subjectRelation || undefined,
              },
            },
          };
        } catch (error) {
          return {
            success: false,
            message: `Failed to write relationship: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            relationship: null,
          };
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });

    t.nonNull.field('deleteRelationship', {
      type: DeleteRelationshipResult,
      description: 'Delete a specific SpiceDB relationship',
      args: {
        resourceType: nonNull(
          stringArg({
            description: 'Resource type (e.g., "erp/workspace")',
          }),
        ),
        resourceId: nonNull(
          stringArg({
            description: 'Resource ID',
          }),
        ),
        relation: nonNull(
          stringArg({
            description: 'Relation type (e.g., "member", "admin")',
          }),
        ),
        subjectType: nonNull(
          stringArg({
            description: 'Subject type (e.g., "erp/user")',
          }),
        ),
        subjectId: nonNull(
          stringArg({
            description: 'Subject ID',
          }),
        ),
      },
      resolve: async (root, args, ctx) => {
        // Admin check is already done at the namespace level
        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // Delete the relationship
          await client.deleteRelationships(
            v1.DeleteRelationshipsRequest.create({
              relationshipFilter: v1.RelationshipFilter.create({
                resourceType: args.resourceType,
                optionalResourceId: args.resourceId,
                optionalRelation: args.relation,
                optionalSubjectFilter: v1.SubjectFilter.create({
                  subjectType: args.subjectType,
                  optionalSubjectId: args.subjectId,
                }),
              }),
            }),
          );

          return {
            success: true,
            message: `Successfully deleted relationship: ${args.subjectType}:${args.subjectId} ${args.relation} ${args.resourceType}:${args.resourceId}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Failed to delete relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });
  },
});
