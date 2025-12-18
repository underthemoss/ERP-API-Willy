# ksqlDB Migration Workflow

This guide covers working with ksqlDB migrations in this repository.

## Workflow Guidelines

**IMPORTANT:** When working on ksqlDB tasks, stay focused on ksqlDB operations only:

- ✅ Use ksqlDB CLI commands to explore topics, tables, and streams
- ✅ Read ksqlDB migration files directly
- ✅ Use ksqlDB test helpers for testing
- ✅ Consult this workflow document for patterns and examples
- ❌ Do NOT search the codebase for context (avoid `search_files`)
- ❌ Do NOT read application code unless explicitly requested
- ❌ Stay within the ksql/ directory for migration work

The ksqlDB workflow is self-contained. All necessary information can be obtained through ksqlDB CLI commands and the migration files themselves.

## Interactive ksqlDB CLI

The preferred way to interact with ksqlDB for exploration, verification, and destructive actions.

### Basic Commands

**Interactive mode (best for exploration):**

```bash
docker exec -it es-erp-ksqldb-cli ksql http://ksqldb-server:8088
```

Type `EXIT;` or press Ctrl+D to quit.

**Execute single command:**

```bash
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "SHOW TOPICS;"
```

### Common Operations

**List resources:**

```bash
# List all topics
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "SHOW TOPICS;"

# List streams
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "SHOW STREAMS;"

# List tables
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "SHOW TABLES;"

# List running queries
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "SHOW QUERIES;"
```

**Describe resources:**

```bash
# Describe a table (shows schema)
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "DESCRIBE SALES_ORDER_LINE_ITEMS_TABLE;"

# Describe extended (shows all details including queries)
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "DESCRIBE EXTENDED SALES_ORDER_LINE_ITEMS_TABLE;"
```

**Read data from topics:**

```bash
# Read first 10 messages (recommended - good sample size)
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "PRINT 'topic_name' FROM BEGINNING LIMIT 10;"

# Read first 20 messages for larger sample
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "PRINT 'topic_name' FROM BEGINNING LIMIT 20;"

# Example: Read from CDC source
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "PRINT '_es-erp.private.cdc' FROM BEGINNING LIMIT 10;"

# Example: Read from materialized table topic
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "PRINT '_es-erp-ksqldb.SALES_ORDER_LINE_ITEMS_TABLE' FROM BEGINNING LIMIT 10;"

# Example: Read from fleet source connector
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "PRINT 'fleet-source-connector-2.public.assets' FROM BEGINNING LIMIT 10;"
```

**Destructive operations:**

```bash
# Drop a table (with topic deletion)
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "DROP TABLE IF EXISTS TABLE_NAME DELETE TOPIC;"

# Terminate a query
docker exec es-erp-ksqldb-cli ksql http://ksqldb-server:8088 -e "TERMINATE QUERY_ID;"
```

### Tips

- **Always use LIMIT with PRINT commands** for better sample sizes - recommended: `LIMIT 10` or `LIMIT 20`
- PRINT with LIMIT typically completes in 1-5 seconds
- Table topics are prefixed with `_es-erp-ksqldb.` (e.g., `_es-erp-ksqldb.SALES_ORDER_LINE_ITEMS_TABLE`)
- All ksqlDB statements must end with a semicolon (`;`)
- Field names and table names are case-sensitive
- Use backticks for field names with special characters: `` `field_name` ``

## Remote ksqlDB Access (REST API)

For querying staging ksqlDB instances via REST API (e.g., `https://staging-mesh.internal.equipmentshare.com/es-erp-ksqldb`).

### List Resources

```bash
# List all topics
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "SHOW TOPICS;", "streamsProperties": {}}'

# List all tables
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "SHOW TABLES;", "streamsProperties": {}}'

# List all streams
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "SHOW STREAMS;", "streamsProperties": {}}'

# List running queries
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "SHOW QUERIES;", "streamsProperties": {}}'
```

### Describe Table Schema

Get full field definitions and metadata for a table:

```bash
# Basic describe
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "DESCRIBE PIM_PRODUCTS_V1;", "streamsProperties": {}}'

# Extended describe (includes queries and statistics)
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "DESCRIBE EXTENDED PIM_PRODUCTS_V1;", "streamsProperties": {}}'
```

The response includes:
- `fields` - Array of field definitions with name, type, and nested schema
- `keyFormat` / `valueFormat` - Serialization formats (KAFKA, JSON, AVRO)
- `topic` - Underlying Kafka topic name
- `statement` - The CREATE statement that defined the table

### Explore Topic Data Shape

Use the `/query` endpoint (not `/ksql`) for PRINT commands:

```bash
# PRINT topic data to see key/value format and sample records
curl -s -X POST "https://<ksqldb-url>/query" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "PRINT '\''pim_products'\'' FROM BEGINNING LIMIT 20;", "streamsProperties": {}}'

# Example: Explore CDC source topic
curl -s -X POST "https://<ksqldb-url>/query" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "PRINT '\''_es-erp.private.cdc'\'' FROM BEGINNING LIMIT 20;", "streamsProperties": {}}'
```

**PRINT output shows:**
- `Key format` - How the key is serialized (e.g., `KAFKA_STRING`, `JSON`)
- `Value format` - How the value is serialized (e.g., `AVRO`, `JSON`)
- `rowtime` - Timestamp of each message
- `key` - The message key
- `value` - The full message payload with field structure

### Understanding Topic Shapes

When exploring a topic for the first time:

1. **Use PRINT to see sample data** - Understand the key/value formats and field structure
2. **Check for existing tables** - `SHOW TABLES;` to see if a table already exists for the topic
3. **DESCRIBE existing tables** - Get the full schema if a table exists
4. **Note the key field** - Required for table PRIMARY KEY definition
5. **Identify join fields** - Fields you'll use to join with other tables

**Example workflow to understand a new topic:**

```bash
# Step 1: Print sample data
curl -s -X POST "https://<ksqldb-url>/query" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "PRINT '\''pim_makes'\'' FROM BEGINNING LIMIT 3;", "streamsProperties": {}}'

# Step 2: Check if table exists
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "SHOW TABLES;", "streamsProperties": {}}'

# Step 3: Describe table if it exists
curl -s -X POST "https://<ksqldb-url>/ksql" \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql": "DESCRIBE PIM_MAKES_V1;", "streamsProperties": {}}'
```


## Overview

ksqlDB is used to create materialized views from MongoDB CDC (Change Data Capture) events. The architecture:

- MongoDB CDC events → Kafka topic (`CDC_SOURCE_RAW_TABLE`)
- ksqlDB processes CDC events → Creates materialized tables
- Tables extract and filter data for real-time queryable views

## Creating a New Migration

### 1. Generate Migration Files

```bash
cd ksql
node scripts/migrate.js create <migration-name>
```

This creates two files:

- `YYYYMMDDHHMMSS-<migration-name>.sql` - The migration
- `YYYYMMDDHHMMSS-<migration-name>.test.ts` - Test suite

**Note:** Migrations are forward-only. There are no rollback/undo files. Plan your schema changes carefully.

### 2. Migration Pattern

Follow this two-table pattern (example: sales order line items):

```sql
-- Step 1: Create RAW table filtering CDC events
CREATE TABLE SALES_ORDER_LINE_ITEMS_RAW_TABLE AS
  SELECT
    `documentKey`->`_id` AS `documentId`,
    collect_list(`operationType`)[1] AS `operationType`,
    collect_list(`fullDocument`)[1] AS `fullDocument`,
    -- ... other CDC fields
  FROM CDC_SOURCE_RAW_TABLE
  WHERE `collection` = 'sales_order_line_items'
  GROUP BY `documentKey`->`_id`;

-- Step 2: Create materialized view extracting fields
CREATE TABLE SALES_ORDER_LINE_ITEMS_TABLE AS
  SELECT
    `documentId` AS `_id`,
    EXTRACTJSONFIELD(`fullDocument`, '$.field_name') AS `field_name`,
    -- ... extract all needed fields
  FROM SALES_ORDER_LINE_ITEMS_RAW_TABLE
  WHERE `operationType` != 'delete'
    AND (EXTRACTJSONFIELD(`fullDocument`, '$.deleted_at') IS NULL
      OR EXTRACTJSONFIELD(`fullDocument`, '$.deleted_at') = 'null')
    -- Add any status filters (e.g., != 'DRAFT')
```

### 3. Standard Filtering Rules

Always apply these filters in the materialized view:

#### Delete Operation Filter

```sql
WHERE `operationType` != 'delete'
```

Exclude hard delete CDC events.

#### Soft Delete Filter

```sql
AND (EXTRACTJSONFIELD(`fullDocument`, '$.deleted_at') IS NULL
  OR EXTRACTJSONFIELD(`fullDocument`, '$.deleted_at') = 'null')
```

- `deleted_at IS NULL` or `= 'null'` → Active record ✅
- `deleted_at = '2025-10-15...'` → Soft deleted ❌

**Why both conditions?**

- `IS NULL` → Field doesn't exist in JSON (JavaScript undefined)
- `= 'null'` → Field exists with JSON null value (JavaScript null)

#### Status Filters (if applicable)

For entities with draft/pending states:

```sql
AND (EXTRACTJSONFIELD(`fullDocument`, '$.status_field') != 'DRAFT'
  OR EXTRACTJSONFIELD(`fullDocument`, '$.status_field') IS NULL
  OR EXTRACTJSONFIELD(`fullDocument`, '$.status_field') = 'null')
```

Include NULL/missing to allow records without the status field.


## Testing Migrations

### Test Structure

Tests should cover:

1. **Schema validation** (8 tests typically)

   - Table existence
   - Expected fields
   - Primary keys
   - Field types

2. **Data operations** (15+ tests typically)
   - Insert/update operations
   - Delete filtering
   - Soft delete filtering
   - Status filtering (if applicable)
   - Status transitions
   - Multiple records
   - Comprehensive field coverage
   - Type-specific behavior (e.g., RENTAL vs SALE)
   - Collection isolation
   - Edge cases (undefined/null)

### Running Tests

```bash
# Run all ksqlDB tests
npm run test:ksql

# Run specific migration test
npm run test:ksql -- ksql/tests/20251015190127-add-sales-order-line-items-table.test.ts

# Run specific test case
npm run test:ksql -- ksql/tests/20251015190127-add-sales-order-line-items-table.test.ts --testNamePattern="should filter"
```

### Test Helpers

Available in `ksql/tests/utils/test-helpers.generated.ts`:

- `migrateToState(migrationFile)` - Run migration
- `describeTable(tableName)` - Get table schema
- `insertIntoTable(table, data)` - Insert test data
- `queryTable(table, whereClause)` - Query data
- `waitFor(asyncFn, options)` - Wait for condition with retries
- `randomId(prefix)` - Generate test IDs

### Test Pattern Example

```typescript
it('should filter out DRAFT status line items', async () => {
  const draftId = randomId('SOLI');

  // Insert draft record
  await insertIntoTable('CDC_SOURCE_RAW_TABLE', {
    cdcKey: `erp-db.collection.${draftId}`,
    operationType: 'insert',
    collection: 'sales_order_line_items',
    documentKey: { _id: draftId },
    fullDocument: JSON.stringify({
      _id: draftId,
      status: 'DRAFT',
      // ... other fields
    }),
    // ... CDC metadata
  });

  // Verify appears in RAW table
  await waitFor(async () => {
    const results = await queryTable(
      'RAW_TABLE',
      `\`documentId\` = '${draftId}'`,
    );
    expect(results.length).toBeGreaterThan(0);
    return results;
  });

  // Verify does NOT appear in materialized view
  const results = await queryTable(
    'MATERIALIZED_TABLE',
    `\`_id\` = '${draftId}'`,
  );
  expect(results.find((r) => r._id === draftId)).toBeUndefined();
}, 40000);
```

## Field Extraction Tips

### Using EXTRACTJSONFIELD

```sql
EXTRACTJSONFIELD(`fullDocument`, '$.field_name') AS `field_name`
```

**Important:**

- All extracted fields are STRING type
- Nested fields: `'$.parent.child'`
- Array access: `'$.items[0]'`
- JSON null becomes string `'null'`, not SQL NULL
- Missing fields become SQL NULL

### Field Naming

- Use snake_case for ksqlDB field names (matches MongoDB)
- Primary key is always `_id`
- Audit fields: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`

## Common Patterns

### Multiple Records per Parent

When creating line items or child records:

```typescript
// Insert multiple records
for (const item of items) {
  await insertIntoTable('CDC_SOURCE_RAW_TABLE', {
    cdcKey: `erp-db.line_items.${item.id}`,
    // ...
  });
}

// Query by parent ID
const results = await queryTable(
  'LINE_ITEMS_TABLE',
  `\`parent_id\` = '${parentId}'`,
);
```

### Status Transitions

Test that status changes affect visibility:

```typescript
// Insert as DRAFT (should NOT appear)
await insertIntoTable(..., { status: 'DRAFT' });
const results = await queryTable(...);
expect(results.length).toBe(0);

// Update to CONFIRMED (should NOW appear)
await insertIntoTable(..., {
  operationType: 'update',
  status: 'CONFIRMED'
});
const results = await waitFor(...);
expect(results.length).toBeGreaterThan(0);
```

### Soft Delete

Test soft delete workflow:

```typescript
// Insert active record (no deleted_at)
await insertIntoTable(..., { /* no deleted_at field */ });
await waitFor(...); // Appears

// Update with deleted_at timestamp
await insertIntoTable(..., {
  operationType: 'update',
  deleted_at: '2025-10-15T10:00:00.000Z'
});
await waitFor(async () => {
  const results = await queryTable(...);
  expect(results.length).toBe(0); // Disappears
  return results;
});
```

## Debugging

### Check Table State

```bash
# Describe a table
ksql> DESCRIBE SALES_ORDER_LINE_ITEMS_TABLE;

# Show running queries
ksql> SHOW QUERIES;

# View table data
ksql> SELECT * FROM SALES_ORDER_LINE_ITEMS_TABLE EMIT CHANGES LIMIT 10;
```

### Common Issues

1. **Field not appearing**: Check `EXTRACTJSONFIELD` path matches JSON structure exactly
2. **Wrong filter results**: Remember `'null'` (string) vs `NULL` (SQL) distinction
3. **No data appearing**: Check `operationType`, `collection`, and status filters
4. **Test timeouts**: Increase timeout or adjust `waitFor` retry settings

## Best Practices

1. **Always use both RAW and materialized tables** - RAW for debugging, materialized for filtering
2. **Filter at materialized view level** - Not in RAW table
3. **Handle undefined and null** - Check both `IS NULL` and `= 'null'`
4. **Test all filter conditions** - Delete ops, soft deletes, status filters
5. **Use meaningful test data** - Makes debugging easier
6. **Test transitions** - Status changes, soft deletes
7. **Verify field types** - All `EXTRACTJSONFIELD` results are strings
8. **Add comprehensive tests** - Edge cases save production debugging time

## Migration Checklist

- [ ] Created migration with `node scripts/migrate.js create`
- [ ] RAW table filters correct collection
- [ ] Materialized view extracts all needed fields
- [ ] Applied delete operation filter
- [ ] Applied soft delete filter
- [ ] Applied status filters (if applicable)
- [ ] Schema validation tests (8)
- [ ] Data operation tests (15+)
- [ ] Status transition tests (if applicable)
- [ ] All tests passing
- [ ] Comprehensive record test with all fields
- [ ] Edge case tests (undefined/null)
