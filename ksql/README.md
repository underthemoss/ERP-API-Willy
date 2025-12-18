# ksqlDB Migration System

This directory contains the ksqlDB migration system for managing ksqlDB schema changes (tables, streams, connectors) in a controlled, versioned manner.

## 📁 Directory Structure

```
ksql/
├── README.md                    # This file
├── .gitignore
├── jest.config.js              # Jest configuration for ksqlDB tests
├── state.json                  # Generated: Current ksqlDB state snapshot
├── queries.sql                 # Generated: SQL queries from current state
│
├── config/
│   └── migrate-config.js       # Migration system configuration
│
├── scripts/
│   ├── migrate.js              # Main migration CLI tool
│   ├── post-migrate.js         # Captures state after migrations
│   └── codegen.js              # Spins up containers, migrates, generates types
│
├── lib/
│   └── type-generator.js       # Generates TypeScript types from ksqlDB schemas
│
├── migrations/                 # SQL migration files (forward-only)
│   ├── YYYYMMDDHHMMSS-name.sql
│   └── ...
│
└── tests/                      # Jest tests for migrations
    ├── YYYYMMDDHHMMSS-name.test.ts
    └── utils/
        ├── test-helpers.ts     # Shared test utilities
        ├── types.ts
        ├── global-setup.ts
        └── global-teardown.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local ksqlDB/Kafka)
- MongoDB (for migration state tracking)

### Common Commands

```bash
# Create a new migration
npm run migrate-ksql:create <migration-name>

# Check migration status
npm run migrate-ksql:status

# Apply pending migrations
npm run migrate-ksql:up

# Run ksqlDB tests
npm run test:ksql

# Generate TypeScript types from ksqlDB schemas
npm run ksql:codegen
```

## 📝 Creating Migrations

### Step 1: Create Migration File

```bash
npm run migrate-ksql:create add-new-table
```

This creates two files:
- `migrations/YYYYMMDDHHMMSS-add-new-table.sql` - Migration file
- `tests/YYYYMMDDHHMMSS-add-new-table.test.ts` - Test file

### Step 2: Write Migration SQL

Edit the `.sql` file:

```sql
-- Migration: add-new-table
-- Created: 2025-10-21T12:00:00.000Z
-- Test file: YYYYMMDDHHMMSS-add-new-table.test.ts
-- 
-- Note: Migrations are forward-only. There are no rollback files.
-- Plan your schema changes carefully.

CREATE TABLE MY_NEW_TABLE (
  `id` VARCHAR PRIMARY KEY,
  `name` VARCHAR,
  `created_at` BIGINT
) WITH (
  KAFKA_TOPIC='my-topic',
  VALUE_FORMAT='JSON',
  PARTITIONS=3
);
```

### Step 3: Write Tests

The generated test file provides a template. Add specific tests for your migration:

```typescript
import { migrateToState, describeTable, queryTable } from './utils/test-helpers';

describe('Migration: add-new-table', () => {
  beforeAll(async () => {
    await migrateToState('YYYYMMDDHHMMSS-add-new-table.sql');
  }, 30000);

  describe('MY_NEW_TABLE', () => {
    it('should exist and be queryable', async () => {
      const schema = await describeTable('MY_NEW_TABLE');
      expect(schema).toBeDefined();
      expect(schema.type).toBe('TABLE');
    });

    it('should have expected schema fields', async () => {
      const schema = await describeTable('MY_NEW_TABLE');
      const fieldNames = schema.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('created_at');
    });
  });
});
```

### Step 4: Test & Apply

```bash
# Test the migration
npm run test:ksql

# Apply to local environment
npm run migrate-ksql:up
```

## 🔄 Migration Workflow

### Forward-Only Migrations

**Important:** This system uses forward-only migrations. There are no rollback/undo files.

**Why forward-only?**
- Prevents `UNKNOWN_TOPIC_OR_PARTITION` warnings from rollback churn
- Simpler codebase and faster tests
- Production-realistic (you rarely roll back in prod)
- Forces careful planning of schema changes

**Best Practices:**
- Plan migrations carefully before creating them
- Test thoroughly in dev environment
- Use `IF NOT EXISTS` clauses where appropriate
- Consider data migration impact
- Document breaking changes clearly

### Migration State

Migrations are tracked in MongoDB:
- Collection: `ksql_migrations`
- Fields: `fileName`, `appliedAt`

Each migration runs exactly once and is recorded when successful.

### Special SQL Features

#### WAIT Command

Add delays between statements for eventual consistency:

```sql
CREATE TABLE TABLE_A (...);

-- WAIT 5000

CREATE TABLE TABLE_B AS 
SELECT * FROM TABLE_A;
```

## 🧪 Testing

### Test Structure

Tests use Jest with Testcontainers to spin up ephemeral ksqlDB/Kafka instances:

```typescript
// Global setup (once per test run)
- Spin up Redpanda (Kafka)
- Spin up MongoDB  
- Spin up Kafka Connect
- Spin up ksqlDB

// Per test file
- Migrate to target state
- Run test assertions
- Clean up
```

### Test Helpers (Auto-Generated)

**Important:** Test helpers are auto-generated from `state.json` and located in `tests/utils/test-helpers.generated.ts`.

#### Generating Test Helpers

After applying migrations, regenerate helpers:

```bash
npm run ksql:generate-test-utils
```

This creates type-safe helper functions for all tables in your ksqlDB schema.

#### Using Type-Safe Helpers

```typescript
import { table, retry } from './utils/test-helpers.generated';

// Type-safe insert (autocomplete & validation)
await table('ESDB_PUBLIC_ORDERS').insert({
  order_id: 'order-123',
  company_id: 'company-456',
  user_id: 'user-789',
  date_created: '2025-01-01T00:00:00Z',
  date_updated: '2025-01-01T00:00:00Z',
});

// Type-safe get
const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get('order-123');

// Retry with eventual consistency
await retry(async () => {
  const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get('order-123');
  expect(order).toBeDefined();
  expect(order.details?.company_id).toBe('company-456');
});
```

### ⚠️ Critical Testing Best Practice: SOURCE TABLES ONLY

**Always insert data into SOURCE tables, never materialized views!**

```typescript
// ❌ WRONG - Don't insert into materialized views
await table('ESDB_ORDER_MATERIALIZED_VIEW').insert({ ... });
await table('ESDB_RENTAL_MATERIALIZED_VIEW').insert({ ... });

// ✅ CORRECT - Insert into source tables
await table('ESDB_PUBLIC_ORDERS').insert({ ... });
await table('ESDB_PUBLIC_RENTALS').insert({ ... });
await table('ESDB_PUBLIC_COMPANIES').insert({ ... });
```

**Why?**
- Materialized views are computed from source tables via ksqlDB continuous queries
- Inserting into views bypasses the data pipeline you're trying to test
- Source-only inserts test the real data flow

**Data Pipeline Example:**
```
SOURCE TABLES (your test inserts)
  ESDB_PUBLIC_ORDERS
  ESDB_PUBLIC_COMPANIES
  ESDB_PUBLIC_USERS
      ↓
  ksqlDB Continuous Queries (automatic)
      ↓
INTERMEDIATE VIEWS (auto-computed)
  ESDB_ORDER_WITH_STATUS
  ESDB_ORDER_WITH_COMPANY
  ESDB_ORDER_ENRICHED
      ↓
FINAL MATERIALIZED VIEW (what you verify)
  ESDB_ORDER_MATERIALIZED_VIEW
```

### Legacy Test Helpers (Manual)

Some legacy helpers in `tests/utils/test-helpers.ts`:

```typescript
// Schema inspection
const schema = await describeTable('MY_TABLE');

// Manual query
const results = await queryTable('MY_TABLE', '`id` = "123"');

// Tombstone (delete) records
await tombstoneRecord('MY_TABLE', 'key-123');

// Manual retry with timeout
await waitFor(async () => {
  const results = await queryTable('MY_TABLE');
  expect(results.length).toBeGreaterThan(0);
  return results;
}, { timeout: 10000 });
```

### Running Tests

```bash
# Run all ksqlDB tests
npm run test:ksql

# Run specific test file
npx jest ksql/tests/20251021152737-add-order-materialized-view.test.ts
```

## 🔧 Configuration

Edit `config/migrate-config.js`:

```javascript
{
  ksqldb: {
    url: process.env.KSQLDB_ENDPOINT || 'http://localhost:5050',
    waitForCompletion: true,  // Poll until commands complete
    pollInterval: 500,         // Poll every 500ms
    pollTimeout: 300000,       // Timeout after 5 minutes
  },
  mongodb: {
    url: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'es-erp',
  },
  migrationsDir: path.join(__dirname, '..', 'migrations'),
  changelogCollectionName: 'ksql_migrations',
  migrationFileExtension: '.sql',
}
```

## 🏗️ Advanced Usage

### TypeScript Type Generation

After applying migrations, generate TypeScript types:

```bash
# Full workflow: spin up containers, migrate, capture state, generate types
npm run ksql:codegen

# Just generate types from existing state.json
npm run ksql:types
```

Generated types appear in `src/generated/ksql/`:

```typescript
export interface KsqlMyTable {
  id: string;
  name: string | null;
  created_at: number | null;
}
```

### Targeting Specific Migrations

Apply up to a specific migration:

```bash
node ksql/scripts/migrate.js up --to=20251021152737-add-order-materialized-view.sql
```

Apply N migrations:

```bash
node ksql/scripts/migrate.js up --steps=2
```

### Environment Variables

```bash
KSQLDB_ENDPOINT=http://localhost:5050
MONGO_CONNECTION_STRING=mongodb://localhost:27017/erp_local
KAFKA_CONNECT_URL=http://localhost:8083
KAFKA_REST_URL=http://localhost:8082
```

## 🐛 Troubleshooting

### "Cannot connect to ksqlDB"

```bash
# Check if ksqlDB is running
docker compose ps ksqldb-server

# Check logs
docker compose logs ksqldb-server

# Restart
docker compose up -d ksqldb-server
```

### "UNKNOWN_TOPIC_OR_PARTITION" Warnings

These are usually harmless. They occur when:
- Creating tables with foreign key joins
- Topics are being created/deleted
- ksqlDB is initializing

If persistent (>30 seconds), check Kafka cluster health.

### Migration Fails Mid-Way

Migrations are NOT transactional. If a migration fails:

1. Check the error message
2. Fix the migration SQL
3. The failed migration won't be recorded as applied
4. Re-run `npm run migrate-ksql:up`

**Prevention:**
- Test migrations thoroughly in dev
- Use `IF NOT EXISTS` clauses
- Keep migrations small and focused

### Tests Timing Out

Increase timeout in test:

```typescript
beforeAll(async () => {
  await migrateToState('migration.sql');
}, 60000); // 60 seconds
```

Or use `waitFor` helper with custom timeout:

```typescript
await waitFor(async () => {
  // your assertion
}, { timeout: 30000 });
```

## 📚 Additional Resources

- [ksqlDB Documentation](https://docs.ksqldb.io/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Testcontainers](https://node.testcontainers.org/)

## 🤝 Contributing

When adding new migrations:

1. Create migration with descriptive name
2. Write comprehensive tests
3. Test locally with `npm run test:ksql`
4. Document any breaking changes
5. Submit PR with migration + tests

## 📖 Migration Naming Convention

Use descriptive names that explain the change:

✅ Good:
- `add-rental-materialized-view`
- `create-order-sink-connector`
- `add-asset-timestamp-field`

❌ Bad:
- `update-table`
- `fix`
- `migration-1`

## 🔐 Security Notes

- Migration files are committed to git
- Sensitive data should NEVER be in migrations
- Use environment variables for credentials
- MongoDB connection strings should be secrets

## 💡 Lessons Learned & Common Pitfalls

### 1. Invalid Replication Factor Error

**Error:** `InvalidReplicationFactorException: Replication factor must be greater than 0`

**Cause:** ksqlDB configuration had `KSQL_KSQL_STREAMS_REPLICATION_FACTOR: '0'`

**Solution:** Set to `'1'` for single-broker test environments:
```javascript
// In global-setup.ts
KSQL_KSQL_STREAMS_REPLICATION_FACTOR: '1',  // Not '0'!
```

**Why:** Replication factor determines how many copies of data Kafka keeps. 0 is invalid - you need at least 1 copy.

### 2. ksqldb-client API Configuration

**Error:** Client fails to connect or gets wrong endpoint

**Cause:** `ksqldb-client` expects `{ host, port }` not `{ url }`

**Wrong:**
```typescript
new KsqldbClient({ url: 'http://localhost:8088' })  // ❌
```

**Correct:**
```typescript
// Parse URL into host and port
const url = new URL(process.env.KSQLDB_ENDPOINT);
new KsqldbClient({ 
  host: url.hostname,   // 'localhost'
  port: parseInt(url.port)  // 8088
});
```

### 3. Redpanda HTTP Proxy vs Confluent REST API

**Error:** Tombstone function fails with 404 or unexpected response

**Cause:** Using Confluent Kafka REST API patterns with Redpanda HTTP Proxy

**Confluent API (Wrong for Redpanda):**
```typescript
// ❌ Don't use with Redpanda
await axios.get('http://localhost:8082/v3/clusters');
await axios.post(`/v3/clusters/${cluster_id}/topics/${topic}/records`, ...);
```

**Redpanda HTTP Proxy API (Correct):**
```typescript
// ✅ Correct for Redpanda
await axios.post(
  `${KAFKA_REST_URL}/topics/${topic}`,
  {
    records: [{
      key: recordKey,
      value: null  // Tombstone
    }]
  },
  { headers: { 'Content-Type': 'application/vnd.kafka.json.v2+json' }}
);
```

**Resource:** [Redpanda HTTP Proxy Docs](https://docs.redpanda.com/current/develop/http-proxy/)

### 4. Foreign Key Join Subscription Warnings

**Warning:** Logs flooded with `UNKNOWN_TOPIC_OR_PARTITION` for `KTABLE-FK-JOIN-SUBSCRIPTION-*` topics

**Example:**
```
WARN [...] The metadata response reported: 
{...-KTABLE-FK-JOIN-SUBSCRIPTION-RESPONSE-topic=UNKNOWN_TOPIC_OR_PARTITION}
```

**Cause:** Normal! ksqlDB creates internal subscription topics for FK joins on-demand. Warnings appear during initialization.

**Solution:** These are benign and self-resolve. To suppress:
```javascript
// In global-setup.ts
KSQL_LOG4J_ROOT_LOGLEVEL: 'error',  // Was 'warn'
```

### 5. Eventual Consistency Patterns

**Issue:** Tests fail because data hasn't propagated through materialized view pipeline yet

**Error:** `"Materialized data for key [...] is not available yet"`

**Solution:** Use `retry()` helper with generous timeouts:
```typescript
await retry(async () => {
  const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(orderId);
  expect(order).toBeDefined();
  expect(order.rentals).toHaveLength(1);
});
```

**Why:** Materialized views are eventually consistent. Multi-stage pipelines need time to propagate.

### 6. Test Data Isolation

**Issue:** Tests interfere with each other, causing flaky failures

**Solution:** Use unique IDs per test:
```typescript
const testOrderId = `test-order-${Date.now()}-${Math.random()}`;
// Or use descriptive unique IDs:
const testOrderId = 'test-order-no-rentals';
const testOrderId = 'test-order-multi-rentals';
```

### 7. Auto-Formatter Impact

**Issue:** After `write_to_file` or `replace_in_file`, file content changes unexpectedly

**Cause:** Editor auto-formats on save (e.g., Prettier)

**Impact:**
- Single lines split into multiple
- Quote style changes
- Import organization
- Indentation adjustments

**Solution:** Always use the post-format content as reference for subsequent edits. The tool returns `final_file_content` showing the actual state.

### 8. Materialized View Testing Anti-Pattern

**Anti-Pattern:** Inserting directly into materialized views
```typescript
// ❌ BAD - Bypasses the data pipeline!
await table('ESDB_ORDER_MATERIALIZED_VIEW').insert({ ... });
```

**Correct Pattern:** Insert into source tables
```typescript
// ✅ GOOD - Tests the real data flow
await table('ESDB_PUBLIC_ORDERS').insert({ ... });
await table('ESDB_PUBLIC_RENTALS').insert({ ... });

// Then verify the materialized view
await retry(async () => {
  const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(orderId);
  expect(order.rentals).toHaveLength(1);
});
```

### 9. Missing Asset Data in Tests

**Issue:** Test fails with `asset_id` being `null` when rental references an asset

**Cause:** Rental inserted with `asset_id` but no corresponding asset in `ESDB_PUBLIC_ASSETS`

**Solution:** Insert asset source data:
```typescript
await table('ESDB_PUBLIC_ASSETS').insert({
  asset_id: testAssetId,
  name: 'Test Excavator',
  description: 'Heavy equipment',
  company_id: testCompanyId,
});
```

### 10. Deleted Rentals Not Filtered

**Issue:** Deleted rentals appear in results when they shouldn't

**Cause:** Forgot to set `deleted: 'false'` on rental records

**Solution:** Always set `deleted` field:
```typescript
await table('ESDB_PUBLIC_RENTALS').insert({
  rental_id: testRentalId,
  // ... other fields
  deleted: 'false',  // Important!
});
```

The rental materialized view has `WHERE r.deleted = 'false'` so this field must be set.

## 🎯 Testing Checklist

When writing migration tests:

- [ ] Insert into SOURCE tables only (`ESDB_PUBLIC_*`)
- [ ] Include all required lookup data (statuses, companies, users, etc.)
- [ ] Set `deleted: 'false'` on all entity records
- [ ] Use `retry()` for eventual consistency
- [ ] Use unique IDs to avoid test interference
- [ ] Verify both happy path and edge cases
- [ ] Test data pipeline flow, not just final result
- [ ] Run `npm run ksql:codegen` after schema changes
