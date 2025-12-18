# Cline Persistent Context Documentation

This file is always read by Cline before starting any new task in this project. It makes Cline aware of workflows and processes to run when developing in this repo.

## How to Use

- Add any information, guidelines, project context, or instructions here that you want Cline to always consider before working on a task.
- Update this file at any time. Cline will always read the latest version before starting a new task.

---

## Project Overview

- **Language:** This is a TypeScript project. All new code must be written in TypeScript.
- **GraphQL Framework:** This is a Nexus GraphQL app.
- **Database:** Uses MongoDB. All database interactions must go through either a model or a migration script.
- **Formatting:** This project uses Prettier. After finishing a task, always run `npm run prettier:fix` to ensure code style consistency.
- **Testing:** The test suite spins up an ephemeral service on a random port with an ephemeral MongoDB instance. To run the tests:
  ```
  npm run test
  ```
  You should turn off jest watch mode when running tests.

## Directory and Layer Structure

- `src/graphql/`: GraphQL schema definitions (Nexus). This layer defines the API contract and should only interact with the service layer.
- `src/services/`: Business logic and authorization. Services are invoked by GraphQL/Nexus and interact with models. When injecting dependencies to services constructors or factory methods, they are never optional dependencies, they are always required.
- `src/services/<entity>/model.ts`: Models for database access. Models should not handle authorization or user context.
- `src/mongo/migrations/`: Migration scripts for MongoDB schema changes.
- `src/graphql/schema/generated/`: Generated GraphQL schema and Nexus typegen files. These must always be committed and kept up-to-date.

## GraphQL Schema & Codegen Workflow

- **Adding/Editing GraphQL Types or Fields:**
  - All GraphQL field names must use `camelCase`. Example:
    ```ts
    t.nonNull.string('buyerId');
    t.nonNull.string('companyId');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
    ```
  - After making changes to the Nexus schema, run:
    ```
    npm run generate:schema
    ```
    This will update both the GraphQL schema and Nexus typegen files.

## Best Practices

- Always use TypeScript for all code.
- All database access must go through models or migration scripts.
- Never bypass the service layer for business logic or authorization.
- Always use `camelCase` for GraphQL field names.
- After any schema or type change, run both:
  ```
  npm run generate:schema
  npm run prettier:fix
  ```
- Always capture updated_at, updated_by, created_at, updated_by meta data for all business entities. These should only be updated by the server, never the client / gql.

## MongoDB

To create a migration script run `npm run migrate:create <migration_intent_name>` this will create the file for running the migration. You should never manually create a migration script. Only use this command to create files in the migrations folder!!!!

## E2E Testing

All e2e test should call is the public graphql api, do not make direct calls to the database, spicedb, redis or any external services.

The e2e tests use codegen to give a better DX with strict typing. The process is:

1. Add the query/mutation in a gql tagged template imported from graphql-request. This should be done at the top of the file for the given test suite. Avoid having duplicate queries/mutations to perform the action, prefer to reuse it.
2. Run `npm run generate:schema && npm run codegen` to generate the code
3. Within the test file, setup the test env via `const { createClient } = createTestEnvironment();`
4. Per test call `const { sdk, user, utils } = createClient();`
5. Use the exported utils to create a workspace needed for all tests `const workspace = await utils.createWorkspace();`
6. Call the sdk.QueryName or sdk.Mutation name and perform the assertions

## Troubleshooting

- **Schema or typegen out of date:**  
  Run `npm run generate:schema` and commit the changes.
- **Prettier issues:**  
  Run `npm run prettier:fix`.

## Summary

- Use TypeScript everywhere.
- Use Nexus for GraphQL schema, with camelCase fields.
- All DB access via models/migrations.
- Run codegen and prettier after schema changes.
