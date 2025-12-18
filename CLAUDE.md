# Claude AI Assistant Context Documentation

This file provides essential context for Claude when working on this TypeScript/Nexus GraphQL project. It ensures consistent understanding of the codebase structure, conventions, and workflows.

## Project Overview

**Technology Stack:**

- **Language:** TypeScript (all new code must be TypeScript)
- **API Framework:** Nexus GraphQL
- **Database:** MongoDB
- **Code Formatting:** Prettier
- **Testing:** Jest with ephemeral MongoDB instances

## Core Architecture

### Directory Structure & Responsibilities

```
src/
├── graphql/              # GraphQL schema definitions (Nexus)
│   └── schema/          # Individual schema files
│       └── generated/   # Auto-generated schema & typegen files
├── services/            # Business logic & authorization layer
│   └── <entity>/       # Entity-specific services
│       └── model.ts    # Database access models
├── mongo/
│   └── migrations/     # MongoDB schema migration scripts
└── lib/                # Shared utilities and libraries
```

### Layer Responsibilities

1. **GraphQL Layer** (`src/graphql/`)

   - Defines API contract
   - Interacts only with service layer
   - Never directly accesses database
   - Can be used as a compositional layer between services; avoiding service-2-service calls / dependencies.

2. **Service Layer** (`src/services/`)

   - Contains all business logic
   - Handles authorization and user context
   - Invoked by GraphQL resolvers
   - Interacts with models for data access

3. **Model Layer** (`src/services/<entity>/model.ts`)
   - Handles database operations
   - No authorization logic
   - No user context handling
   - Pure data access layer

## Development Workflows

### Adding/Modifying GraphQL Schema

1. **Field Naming Convention:** Always use `camelCase`

   ```typescript
   // Correct
   t.nonNull.string('buyerId');
   t.nonNull.string('companyId');
   t.nonNull.string('createdAt');

   // Incorrect
   t.nonNull.string('buyer_id'); // Don't use snake_case
   ```

2. **After Schema Changes:**

   ```bash
   npm run generate:schema    # Regenerate schema & typegen
   npm run prettier:fix       # Format code
   ```

3. **Always commit generated files** in `src/graphql/schema/generated/`

### Database Migrations

**Creating a new migration:**

```bash
npm run migrate:create <migration_intent_name>
```

- Never manually create migration files
- Only use the above command to generate migration scripts

### Testing

**Run tests without watch mode:**

```bash
npm run test
```

## Important Conventions

### Entity Metadata

All business entities must track:

- `createdAt` - Creation timestamp
- `createdBy` - User who created the record
- `updatedAt` - Last update timestamp
- `updatedBy` - User who last updated the record

**Note:** These fields are server-managed only. Never allow client/GraphQL to directly set these values.

### Code Style

- TypeScript for all code (no JavaScript) - NEVER use `any`, think harder about using the correct type or deriving one.
- Run Prettier after completing any task
- Run `npm run lint` after any code changes to catch ESLint errors
- Follow existing patterns in the codebase

## Common Tasks & Commands

### Schema Development

```bash
npm run generate:schema    # After schema changes
npm run prettier:fix       # Format all code
npm run lint               # Check for ESLint errors
npm run build              # Verify Typescript compiles
```

### Database Operations

```bash
npm run migrate:create <name>    # Create migration script
```

### SpiceDB Authorization Schema

The authorization layer uses SpiceDB with a ZED schema defined in `spicedb/schema.zed`.

**After modifying SpiceDB schema:**

```bash
npm run spicedb:codegen    # Regenerate TypeScript types from schema
```

This command:
1. Parses `spicedb/schema.zed` and validates it
2. Generates `spicedb/schema.generated.json`
3. Generates TypeScript types in `src/lib/authz/spicedb-generated-types.ts`
4. Runs Prettier to format the generated files

**Always commit** the generated files after running this command.

### Testing

```bash
npm run test
```

## Architecture Rules

1. **Database Access:** Only through models or migrations
2. **Business Logic:** Only in service layer
3. **Authorization:** Handled in service layer, never in models
4. **GraphQL Fields:** Always camelCase
5. **Generated Files:** Always commit schema & typegen updates

## Troubleshooting Guide

| Issue                        | Solution                                           |
| ---------------------------- | -------------------------------------------------- |
| Schema/typegen out of sync   | Run `npm run generate:schema` and commit changes   |
| Formatting issues            | Run `npm run prettier:fix`                         |
| ESLint errors                | Run `npm run lint` and fix reported issues         |
| Test failures                | Ensure Jest watch mode is disabled                 |
| Migration needed             | Use `npm run migrate:create <name>` only           |
| SpiceDB types out of sync    | Run `npm run spicedb:codegen` and commit changes   |

## Quick Reference

### File Creation Patterns

**New GraphQL Type:**

1. Add to appropriate file in `src/graphql/schema/`
2. Use camelCase for all fields
3. Run `npm run generate:schema`
4. Run `npm run prettier:fix`
5. Commit all changes including generated files

**New Service:**

1. Create directory `src/services/<entity>/`
2. Add `index.ts` for business logic
3. Add `model.ts` for database access
4. Keep authorization in service, not model

**New Migration:**

1. Run `npm run migrate:create <descriptive_name>`
2. Edit the generated file
3. Test migration thoroughly

## Summary Checklist

When working on this project:

- [ ] Write all code in TypeScript
- [ ] Use camelCase for GraphQL fields
- [ ] Keep business logic in services
- [ ] Keep database access in models
- [ ] Run `npm run generate:schema` after schema changes
- [ ] Run `npm run prettier:fix` before completing tasks
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Include metadata fields (createdAt, createdBy, etc.) for entities
- [ ] Commit generated schema files
- [ ] Use the migration command for database changes
