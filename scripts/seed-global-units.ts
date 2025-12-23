import { MongoClient } from 'mongodb';
import {
  GlobalUnitsModel,
  type GlobalUnitDefinitionDoc,
} from '../src/services/global_attributes/model';
import {
  GLOBAL_ATTRIBUTE_DIMENSION,
  GLOBAL_UNIT_STATUS,
} from '../src/services/global_attributes/constants';

const DEFAULT_DB_NAME = 'es-erp-global';

const units: Array<
  Omit<
    GlobalUnitDefinitionDoc,
    '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'source'
  >
> = [
  {
    code: 'KG',
    name: 'Kilogram',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.MASS,
    canonicalUnitCode: 'KG',
    toCanonicalFactor: 1,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'LB',
    name: 'Pound',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.MASS,
    canonicalUnitCode: 'KG',
    toCanonicalFactor: 0.45359237,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'M',
    name: 'Meter',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.LENGTH,
    canonicalUnitCode: 'M',
    toCanonicalFactor: 1,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'IN',
    name: 'Inch',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.LENGTH,
    canonicalUnitCode: 'M',
    toCanonicalFactor: 0.0254,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'FT',
    name: 'Foot',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.LENGTH,
    canonicalUnitCode: 'M',
    toCanonicalFactor: 0.3048,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'MI',
    name: 'Mile',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.LENGTH,
    canonicalUnitCode: 'M',
    toCanonicalFactor: 1609.344,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'HR',
    name: 'Hour',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.TIME,
    canonicalUnitCode: 'HR',
    toCanonicalFactor: 1,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'MIN',
    name: 'Minute',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.TIME,
    canonicalUnitCode: 'HR',
    toCanonicalFactor: 1 / 60,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'SEC',
    name: 'Second',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.TIME,
    canonicalUnitCode: 'HR',
    toCanonicalFactor: 1 / 3600,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'DAY',
    name: 'Day',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.TIME,
    canonicalUnitCode: 'HR',
    toCanonicalFactor: 24,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'L',
    name: 'Liter',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.VOLUME,
    canonicalUnitCode: 'L',
    toCanonicalFactor: 1,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
  {
    code: 'GA',
    name: 'Gallon',
    dimension: GLOBAL_ATTRIBUTE_DIMENSION.VOLUME,
    canonicalUnitCode: 'L',
    toCanonicalFactor: 3.785411784,
    offset: 0,
    status: GLOBAL_UNIT_STATUS.ACTIVE,
  },
];

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

const seedUnits = async () => {
  const mongoUri = getRequiredEnv('MONGO_CONNECTION_STRING');
  const dbName = process.env.GLOBAL_LIBRARY_DB_NAME || DEFAULT_DB_NAME;

  const client = new MongoClient(mongoUri);
  await client.connect();

  const unitsModel = new GlobalUnitsModel({ mongoClient: client, dbName });
  const now = new Date();
  const createdBy = 'system';

  for (const unit of units) {
    const existing = await unitsModel.getByCode(unit.code);
    await unitsModel.upsertByCode({
      ...unit,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      createdBy: existing?.createdBy || createdBy,
      updatedBy: createdBy,
      source: existing?.source || 'seed',
    });
  }

  await client.close();
  console.log(
    `Seeded ${units.length} global units into ${dbName}.global_units`,
  );
};

seedUnits().catch((error) => {
  console.error('Failed to seed global units:', error);
  process.exit(1);
});
