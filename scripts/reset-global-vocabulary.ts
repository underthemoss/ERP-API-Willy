import { MongoClient } from 'mongodb';

const COLLECTIONS = [
  'global_tags',
  'global_tag_relations',
  'global_attribute_parse_rules',
  'global_attribute_types',
  'global_attribute_values',
  'global_attribute_relations',
  'global_units',
] as const;

const main = async () => {
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) {
    throw new Error('MONGO_CONNECTION_STRING is required');
  }
  const dbName = process.env.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  const existingCollections = new Set(
    (await db.listCollections().toArray()).map((coll) => coll.name),
  );

  const dropped: string[] = [];
  for (const name of COLLECTIONS) {
    if (!existingCollections.has(name)) continue;
    await db.collection(name).drop();
    dropped.push(name);
  }

  console.log(
    JSON.stringify({ dbName, dropped, kept: COLLECTIONS.filter((c) => !dropped.includes(c)) }, null, 2),
  );

  await client.close();
};

main().catch((error) => {
  console.error('Reset failed:', error);
  process.exit(1);
});
