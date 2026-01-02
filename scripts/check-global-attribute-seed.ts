import { MongoClient } from 'mongodb';

const REQUIRED_PHYSICAL_TYPES = [
  'length',
  'width',
  'height',
  'depth',
  'thickness',
  'diameter',
  'radius',
  'circumference',
  'clearance',
  'reach',
  'distance',
  'weight',
  'area',
  'volume',
  'duration',
  'speed',
  'force',
  'energy',
  'power',
  'pressure',
  'temperature',
  'density',
];

const LEGACY_BLENDED_TYPES = [
  'operating_weight',
  'shipping_weight',
  'gross_weight',
  'net_weight',
  'payload_capacity',
  'load_weight',
  'surface_area',
  'footprint_area',
  'capacity',
  'tank_capacity',
  'displacement',
  'cycle_time',
  'runtime',
  'max_speed',
  'travel_speed',
  'lift_force',
  'pull_force',
  'breakout_force',
  'battery_capacity',
  'rated_power',
  'max_pressure',
  'operating_pressure',
  'min_temperature',
  'max_temperature',
  'operating_temperature',
  'bulk_density',
];

const main = async () => {
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) {
    throw new Error('MONGO_CONNECTION_STRING is required');
  }
  const dbName = process.env.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const attrTypes = db.collection('global_attribute_types');
  const units = db.collection('global_units');
  const tags = db.collection('global_tags');
  const parseRules = db.collection('global_attribute_parse_rules');

  const [counts, missingRequired, legacyActive] = await Promise.all([
    Promise.all([
      units.countDocuments(),
      tags.countDocuments(),
      attrTypes.countDocuments(),
      parseRules.countDocuments(),
      attrTypes.countDocuments({ kind: 'PHYSICAL', status: 'ACTIVE' }),
    ]),
    attrTypes
      .find({ name: { $in: REQUIRED_PHYSICAL_TYPES }, kind: 'PHYSICAL' })
      .project({ _id: 0, name: 1, status: 1 })
      .toArray()
      .then((docs) => {
        const activeByName = new Map(
          docs.filter((doc) => doc.status === 'ACTIVE').map((doc) => [doc.name, true]),
        );
        return REQUIRED_PHYSICAL_TYPES.filter((name) => !activeByName.has(name));
      }),
    attrTypes
      .find({ name: { $in: LEGACY_BLENDED_TYPES }, status: 'ACTIVE' })
      .project({ _id: 0, name: 1 })
      .toArray()
      .then((docs) => docs.map((doc) => doc.name)),
  ]);

  const [
    unitsCount,
    tagsCount,
    attrTypesCount,
    parseRulesCount,
    physicalActiveCount,
  ] = counts;

  const report = {
    dbName,
    counts: {
      global_units: unitsCount,
      global_tags: tagsCount,
      global_attribute_types: attrTypesCount,
      global_attribute_parse_rules: parseRulesCount,
      physical_attribute_types_active: physicalActiveCount,
    },
    missingRequiredPhysicalTypes: missingRequired,
    legacyTypesStillActive: legacyActive,
  };

  console.log(JSON.stringify(report, null, 2));

  await client.close();

  if (missingRequired.length || legacyActive.length) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('Seed check failed:', error);
  process.exit(1);
});

