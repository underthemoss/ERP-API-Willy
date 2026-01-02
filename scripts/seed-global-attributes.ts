import { MongoClient, ServerApiVersion } from 'mongodb';
import { getEnvConfig } from '../src/config';
import {
  GLOBAL_ATTRIBUTE_KIND,
  GLOBAL_ATTRIBUTE_VALUE_TYPE,
  GLOBAL_ATTRIBUTE_STATUS,
  GLOBAL_ATTRIBUTE_AUDIT_STATUS,
  GLOBAL_ATTRIBUTE_APPLIES_TO,
  GLOBAL_ATTRIBUTE_USAGE_HINT,
  GLOBAL_UNIT_STATUS,
  type GlobalAttributeDimension,
} from '../src/services/global_attributes';
import {
  GlobalAttributeTypesModel,
  GlobalAttributeParseRulesModel,
  GlobalUnitsModel,
} from '../src/services/global_attributes/model';
import {
  GLOBAL_TAG_POS,
  GLOBAL_TAG_STATUS,
  GLOBAL_TAG_AUDIT_STATUS,
} from '../src/services/global_tags';
import { GlobalTagsModel } from '../src/services/global_tags/model';

type UnitSeed = {
  code: string;
  name: string;
  dimension: GlobalAttributeDimension;
  canonicalUnitCode: string;
  toCanonicalFactor: number;
  offset?: number;
};

type AttributeSeed = {
  name: string;
  synonyms?: string[];
  dimension?: GlobalAttributeDimension;
  canonicalUnit?: string;
  allowedUnits?: string[];
  appliesTo?: (typeof GLOBAL_ATTRIBUTE_APPLIES_TO)[keyof typeof GLOBAL_ATTRIBUTE_APPLIES_TO];
  usageHints?: (typeof GLOBAL_ATTRIBUTE_USAGE_HINT)[keyof typeof GLOBAL_ATTRIBUTE_USAGE_HINT][];
  notes?: string;
};

type BrandAttributeSeed = {
  name: string;
  valueType: (typeof GLOBAL_ATTRIBUTE_VALUE_TYPE)[keyof typeof GLOBAL_ATTRIBUTE_VALUE_TYPE];
  synonyms?: string[];
  appliesTo?: (typeof GLOBAL_ATTRIBUTE_APPLIES_TO)[keyof typeof GLOBAL_ATTRIBUTE_APPLIES_TO];
  usageHints?: (typeof GLOBAL_ATTRIBUTE_USAGE_HINT)[keyof typeof GLOBAL_ATTRIBUTE_USAGE_HINT][];
  notes?: string;
};

type TagSeed = {
  label: string;
  displayName?: string;
  pos?: (typeof GLOBAL_TAG_POS)[keyof typeof GLOBAL_TAG_POS];
  synonyms?: string[];
};

type ParseRuleSeed = {
  raw: string;
  attributeName: string;
  contextTags?: string[];
  notes?: string;
};

const SEED_SOURCE = 'seed:qudt-core';
const SEED_USER = 'seed:qudt-core';
const SEED_SOURCE_CORE = 'seed:global-vocabulary-core';

const UNIT_DEFINITIONS: UnitSeed[] = [
  // LENGTH (canonical M)
  { code: 'M', name: 'meter', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 1 },
  { code: 'MM', name: 'millimeter', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 0.001 },
  { code: 'CM', name: 'centimeter', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 0.01 },
  { code: 'KM', name: 'kilometer', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 1000 },
  { code: 'IN', name: 'inch', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 0.0254 },
  { code: 'FT', name: 'foot', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 0.3048 },
  { code: 'YD', name: 'yard', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 0.9144 },
  { code: 'MI', name: 'mile', dimension: 'LENGTH', canonicalUnitCode: 'M', toCanonicalFactor: 1609.344 },

  // AREA (canonical M2)
  { code: 'M2', name: 'square meter', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 1 },
  { code: 'CM2', name: 'square centimeter', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 0.0001 },
  { code: 'MM2', name: 'square millimeter', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 0.000001 },
  { code: 'FT2', name: 'square foot', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 0.09290304 },
  { code: 'IN2', name: 'square inch', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 0.00064516 },
  { code: 'YD2', name: 'square yard', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 0.83612736 },
  { code: 'ACRE', name: 'acre', dimension: 'AREA', canonicalUnitCode: 'M2', toCanonicalFactor: 4046.8564224 },

  // VOLUME (canonical M3)
  { code: 'M3', name: 'cubic meter', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 1 },
  { code: 'CM3', name: 'cubic centimeter', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.000001 },
  { code: 'MM3', name: 'cubic millimeter', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.000000001 },
  { code: 'FT3', name: 'cubic foot', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.028316846592 },
  { code: 'IN3', name: 'cubic inch', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.000016387064 },
  { code: 'YD3', name: 'cubic yard', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.764554857984 },
  { code: 'L', name: 'liter', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.001 },
  { code: 'ML', name: 'milliliter', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.000001 },
  { code: 'GA', name: 'gallon', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.003785411784 },
  { code: 'QT', name: 'quart', dimension: 'VOLUME', canonicalUnitCode: 'M3', toCanonicalFactor: 0.000946352946 },

  // MASS (canonical KG)
  { code: 'KG', name: 'kilogram', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 1 },
  { code: 'G', name: 'gram', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 0.001 },
  { code: 'MG', name: 'milligram', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 0.000001 },
  { code: 'LB', name: 'pound', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 0.45359237 },
  { code: 'OZ', name: 'ounce', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 0.028349523125 },
  { code: 'TON', name: 'short ton', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 907.18474 },
  { code: 'TONNE', name: 'metric tonne', dimension: 'MASS', canonicalUnitCode: 'KG', toCanonicalFactor: 1000 },

  // TIME (canonical SEC)
  { code: 'SEC', name: 'second', dimension: 'TIME', canonicalUnitCode: 'SEC', toCanonicalFactor: 1 },
  { code: 'MIN', name: 'minute', dimension: 'TIME', canonicalUnitCode: 'SEC', toCanonicalFactor: 60 },
  { code: 'HR', name: 'hour', dimension: 'TIME', canonicalUnitCode: 'SEC', toCanonicalFactor: 3600 },
  { code: 'DAY', name: 'day', dimension: 'TIME', canonicalUnitCode: 'SEC', toCanonicalFactor: 86400 },

  // SPEED (canonical MPS)
  { code: 'MPS', name: 'meter per second', dimension: 'SPEED', canonicalUnitCode: 'MPS', toCanonicalFactor: 1 },
  { code: 'KPH', name: 'kilometer per hour', dimension: 'SPEED', canonicalUnitCode: 'MPS', toCanonicalFactor: 0.2777777778 },
  { code: 'MPH', name: 'mile per hour', dimension: 'SPEED', canonicalUnitCode: 'MPS', toCanonicalFactor: 0.44704 },
  { code: 'FPS', name: 'foot per second', dimension: 'SPEED', canonicalUnitCode: 'MPS', toCanonicalFactor: 0.3048 },
  { code: 'FT_MIN', name: 'foot per minute', dimension: 'SPEED', canonicalUnitCode: 'MPS', toCanonicalFactor: 0.3048 / 60 },

  // FORCE (canonical N)
  { code: 'N', name: 'newton', dimension: 'FORCE', canonicalUnitCode: 'N', toCanonicalFactor: 1 },
  { code: 'KN', name: 'kilonewton', dimension: 'FORCE', canonicalUnitCode: 'N', toCanonicalFactor: 1000 },
  { code: 'LBF', name: 'pound-force', dimension: 'FORCE', canonicalUnitCode: 'N', toCanonicalFactor: 4.4482216152605 },

  // ENERGY (canonical J)
  { code: 'J', name: 'joule', dimension: 'ENERGY', canonicalUnitCode: 'J', toCanonicalFactor: 1 },
  { code: 'KJ', name: 'kilojoule', dimension: 'ENERGY', canonicalUnitCode: 'J', toCanonicalFactor: 1000 },
  { code: 'MJ', name: 'megajoule', dimension: 'ENERGY', canonicalUnitCode: 'J', toCanonicalFactor: 1000000 },
  { code: 'KWH', name: 'kilowatt-hour', dimension: 'ENERGY', canonicalUnitCode: 'J', toCanonicalFactor: 3600000 },
  { code: 'BTU', name: 'BTU', dimension: 'ENERGY', canonicalUnitCode: 'J', toCanonicalFactor: 1055.05585 },

  // POWER (canonical W)
  { code: 'W', name: 'watt', dimension: 'POWER', canonicalUnitCode: 'W', toCanonicalFactor: 1 },
  { code: 'KW', name: 'kilowatt', dimension: 'POWER', canonicalUnitCode: 'W', toCanonicalFactor: 1000 },
  { code: 'HP', name: 'horsepower', dimension: 'POWER', canonicalUnitCode: 'W', toCanonicalFactor: 745.699872 },

  // PRESSURE (canonical PA)
  { code: 'PA', name: 'pascal', dimension: 'PRESSURE', canonicalUnitCode: 'PA', toCanonicalFactor: 1 },
  { code: 'KPA', name: 'kilopascal', dimension: 'PRESSURE', canonicalUnitCode: 'PA', toCanonicalFactor: 1000 },
  { code: 'MPA', name: 'megapascal', dimension: 'PRESSURE', canonicalUnitCode: 'PA', toCanonicalFactor: 1000000 },
  { code: 'BAR', name: 'bar', dimension: 'PRESSURE', canonicalUnitCode: 'PA', toCanonicalFactor: 100000 },
  { code: 'PSI', name: 'pound per square inch', dimension: 'PRESSURE', canonicalUnitCode: 'PA', toCanonicalFactor: 6894.757293168 },

  // TEMPERATURE (canonical K)
  { code: 'K', name: 'kelvin', dimension: 'TEMPERATURE', canonicalUnitCode: 'K', toCanonicalFactor: 1, offset: 0 },
  { code: 'C', name: 'celsius', dimension: 'TEMPERATURE', canonicalUnitCode: 'K', toCanonicalFactor: 1, offset: 273.15 },
  { code: 'F', name: 'fahrenheit', dimension: 'TEMPERATURE', canonicalUnitCode: 'K', toCanonicalFactor: 5 / 9, offset: 459.67 },

  // DENSITY (canonical KG_M3)
  { code: 'KG_M3', name: 'kilogram per cubic meter', dimension: 'DENSITY', canonicalUnitCode: 'KG_M3', toCanonicalFactor: 1 },
  { code: 'G_CM3', name: 'gram per cubic centimeter', dimension: 'DENSITY', canonicalUnitCode: 'KG_M3', toCanonicalFactor: 1000 },
  { code: 'LB_FT3', name: 'pound per cubic foot', dimension: 'DENSITY', canonicalUnitCode: 'KG_M3', toCanonicalFactor: 16.01846337 },

  // ANGLE (canonical RAD)
  { code: 'RAD', name: 'radian', dimension: 'ANGLE', canonicalUnitCode: 'RAD', toCanonicalFactor: 1 },
  { code: 'DEG', name: 'degree', dimension: 'ANGLE', canonicalUnitCode: 'RAD', toCanonicalFactor: Math.PI / 180 },

  // FREQUENCY (canonical HZ)
  { code: 'HZ', name: 'hertz', dimension: 'FREQUENCY', canonicalUnitCode: 'HZ', toCanonicalFactor: 1 },
  { code: 'RPM', name: 'revolutions per minute', dimension: 'FREQUENCY', canonicalUnitCode: 'HZ', toCanonicalFactor: 1 / 60 },

  // ACCELERATION (canonical MPS2)
  { code: 'MPS2', name: 'meter per second squared', dimension: 'ACCELERATION', canonicalUnitCode: 'MPS2', toCanonicalFactor: 1 },
  { code: 'FT_S2', name: 'foot per second squared', dimension: 'ACCELERATION', canonicalUnitCode: 'MPS2', toCanonicalFactor: 0.3048 },

  // TORQUE (canonical N_M)
  { code: 'N_M', name: 'newton meter', dimension: 'TORQUE', canonicalUnitCode: 'N_M', toCanonicalFactor: 1 },
  { code: 'FT_LB', name: 'foot pound-force', dimension: 'TORQUE', canonicalUnitCode: 'N_M', toCanonicalFactor: 1.3558179483314004 },
  { code: 'IN_LB', name: 'inch pound-force', dimension: 'TORQUE', canonicalUnitCode: 'N_M', toCanonicalFactor: 0.1129848290276167 },

  // FLOW_RATE (canonical M3_S)
  { code: 'M3_S', name: 'cubic meter per second', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 1 },
  { code: 'L_S', name: 'liter per second', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.001 },
  { code: 'L_MIN', name: 'liter per minute', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.001 / 60 },
  { code: 'GPM', name: 'gallon per minute', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.003785411784 / 60 },
  { code: 'CFM', name: 'cubic foot per minute', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.028316846592 / 60 },
  { code: 'L_HR', name: 'liter per hour', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.001 / 3600 },
  { code: 'GA_HR', name: 'gallon per hour', dimension: 'FLOW_RATE', canonicalUnitCode: 'M3_S', toCanonicalFactor: 0.003785411784 / 3600 },

  // VOLTAGE (canonical V)
  { code: 'V', name: 'volt', dimension: 'VOLTAGE', canonicalUnitCode: 'V', toCanonicalFactor: 1 },
  { code: 'KV', name: 'kilovolt', dimension: 'VOLTAGE', canonicalUnitCode: 'V', toCanonicalFactor: 1000 },

  // CURRENT (canonical A)
  { code: 'A', name: 'ampere', dimension: 'CURRENT', canonicalUnitCode: 'A', toCanonicalFactor: 1 },
  { code: 'KA', name: 'kiloampere', dimension: 'CURRENT', canonicalUnitCode: 'A', toCanonicalFactor: 1000 },

  // RESISTANCE (canonical OHM)
  { code: 'OHM', name: 'ohm', dimension: 'RESISTANCE', canonicalUnitCode: 'OHM', toCanonicalFactor: 1 },
  { code: 'KOHM', name: 'kiloohm', dimension: 'RESISTANCE', canonicalUnitCode: 'OHM', toCanonicalFactor: 1000 },
  { code: 'MOHM', name: 'megaohm', dimension: 'RESISTANCE', canonicalUnitCode: 'OHM', toCanonicalFactor: 1000000 },
];

const allowedUnitsByDimension = new Map<GlobalAttributeDimension, string[]>([
  ['LENGTH', ['MM', 'CM', 'M', 'KM', 'IN', 'FT', 'YD', 'MI']],
  ['AREA', ['MM2', 'CM2', 'M2', 'IN2', 'FT2', 'YD2', 'ACRE']],
  ['VOLUME', ['MM3', 'CM3', 'M3', 'IN3', 'FT3', 'YD3', 'ML', 'L', 'GA', 'QT']],
  ['MASS', ['MG', 'G', 'KG', 'LB', 'OZ', 'TON', 'TONNE']],
  ['TIME', ['SEC', 'MIN', 'HR', 'DAY']],
  ['ANGLE', ['DEG', 'RAD']],
  ['FREQUENCY', ['HZ', 'RPM']],
  ['ACCELERATION', ['MPS2', 'FT_S2']],
  ['SPEED', ['MPS', 'KPH', 'MPH', 'FPS', 'FT_MIN']],
  ['FORCE', ['N', 'KN', 'LBF']],
  ['TORQUE', ['N_M', 'FT_LB', 'IN_LB']],
  ['FLOW_RATE', ['M3_S', 'L_S', 'L_MIN', 'GPM', 'CFM', 'L_HR', 'GA_HR']],
  ['ENERGY', ['J', 'KJ', 'MJ', 'KWH', 'BTU']],
  ['POWER', ['W', 'KW', 'HP']],
  ['PRESSURE', ['PA', 'KPA', 'MPA', 'BAR', 'PSI']],
  ['TEMPERATURE', ['K', 'C', 'F']],
  ['DENSITY', ['KG_M3', 'G_CM3', 'LB_FT3']],
  ['VOLTAGE', ['V', 'KV']],
  ['CURRENT', ['A', 'KA']],
  ['RESISTANCE', ['OHM', 'KOHM', 'MOHM']],
]);

const PHYSICAL_ATTRIBUTE_TYPES: AttributeSeed[] = [
  // DIMENSIONLESS
  {
    name: 'count',
    notes:
      'Dimensionless count (unitless). Use context tags to qualify what is being counted (e.g., count + [drive_pump], count + [track_motor]).',
  },

  // LENGTH
  { name: 'length', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'width', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'height', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'depth', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'thickness', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'diameter', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'radius', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'circumference', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  { name: 'clearance', dimension: 'LENGTH', canonicalUnit: 'M', allowedUnits: allowedUnitsByDimension.get('LENGTH')! },
  {
    name: 'reach',
    dimension: 'LENGTH',
    canonicalUnit: 'M',
    allowedUnits: allowedUnitsByDimension.get('LENGTH')!,
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.RESOURCE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
  },
  {
    name: 'distance',
    dimension: 'LENGTH',
    canonicalUnit: 'M',
    allowedUnits: allowedUnitsByDimension.get('LENGTH')!,
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.SERVICE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.JOB_PARAMETER],
  },

  // MASS
  { name: 'weight', synonyms: ['mass'], dimension: 'MASS', canonicalUnit: 'KG', allowedUnits: allowedUnitsByDimension.get('MASS')! },

  // AREA
  { name: 'area', dimension: 'AREA', canonicalUnit: 'M2', allowedUnits: allowedUnitsByDimension.get('AREA')! },

  // VOLUME
  { name: 'volume', dimension: 'VOLUME', canonicalUnit: 'M3', allowedUnits: allowedUnitsByDimension.get('VOLUME')! },

  // TIME
  {
    name: 'duration',
    dimension: 'TIME',
    canonicalUnit: 'SEC',
    allowedUnits: allowedUnitsByDimension.get('TIME')!,
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.SERVICE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.JOB_PARAMETER],
  },

  // SPEED
  { name: 'speed', dimension: 'SPEED', canonicalUnit: 'MPS', allowedUnits: allowedUnitsByDimension.get('SPEED')! },

  // FORCE
  { name: 'force', dimension: 'FORCE', canonicalUnit: 'N', allowedUnits: allowedUnitsByDimension.get('FORCE')! },

  // ENERGY
  { name: 'energy', dimension: 'ENERGY', canonicalUnit: 'J', allowedUnits: allowedUnitsByDimension.get('ENERGY')! },

  // POWER
  { name: 'power', dimension: 'POWER', canonicalUnit: 'W', allowedUnits: allowedUnitsByDimension.get('POWER')! },

  // PRESSURE
  { name: 'pressure', dimension: 'PRESSURE', canonicalUnit: 'PA', allowedUnits: allowedUnitsByDimension.get('PRESSURE')! },

  // TEMPERATURE
  { name: 'temperature', dimension: 'TEMPERATURE', canonicalUnit: 'K', allowedUnits: allowedUnitsByDimension.get('TEMPERATURE')! },

  // DENSITY
  { name: 'density', dimension: 'DENSITY', canonicalUnit: 'KG_M3', allowedUnits: allowedUnitsByDimension.get('DENSITY')! },

  // ANGLE
  { name: 'angle', dimension: 'ANGLE', canonicalUnit: 'RAD', allowedUnits: allowedUnitsByDimension.get('ANGLE')! },

  // FREQUENCY
  { name: 'frequency', dimension: 'FREQUENCY', canonicalUnit: 'HZ', allowedUnits: allowedUnitsByDimension.get('FREQUENCY')! },

  // ACCELERATION
  { name: 'acceleration', dimension: 'ACCELERATION', canonicalUnit: 'MPS2', allowedUnits: allowedUnitsByDimension.get('ACCELERATION')! },

  // TORQUE
  { name: 'torque', dimension: 'TORQUE', canonicalUnit: 'N_M', allowedUnits: allowedUnitsByDimension.get('TORQUE')! },

  // FLOW RATE
  { name: 'flow', synonyms: ['flow rate', 'flowrate'], dimension: 'FLOW_RATE', canonicalUnit: 'M3_S', allowedUnits: allowedUnitsByDimension.get('FLOW_RATE')! },

  // VOLTAGE
  { name: 'voltage', dimension: 'VOLTAGE', canonicalUnit: 'V', allowedUnits: allowedUnitsByDimension.get('VOLTAGE')! },

  // CURRENT
  { name: 'current', dimension: 'CURRENT', canonicalUnit: 'A', allowedUnits: allowedUnitsByDimension.get('CURRENT')! },

  // RESISTANCE
  { name: 'resistance', dimension: 'RESISTANCE', canonicalUnit: 'OHM', allowedUnits: allowedUnitsByDimension.get('RESISTANCE')! },
];

const BRAND_ATTRIBUTE_TYPES: BrandAttributeSeed[] = [
  {
    name: 'manufacturer',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: ['brand', 'make'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.BOTH,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Manufacturer or brand name (identity).',
  },
  {
    name: 'model',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: ['model_name'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.BOTH,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Model/nameplate identifier (identity).',
  },
  {
    name: 'year',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER,
    synonyms: ['model_year'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.BOTH,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Model year or production year (identity).',
  },
  {
    name: 'trim',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: ['trim_level'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.BOTH,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Trim/package level (identity).',
  },
  {
    name: 'sku',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: ['part_number'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.RESOURCE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Stock keeping unit or internal part number.',
  },
  {
    name: 'mpn',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: ['manufacturer_part_number'],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.RESOURCE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Manufacturer part number.',
  },
  {
    name: 'series',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: [],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.RESOURCE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Series designation (identity).',
  },
  {
    name: 'family',
    valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING,
    synonyms: [],
    appliesTo: GLOBAL_ATTRIBUTE_APPLIES_TO.RESOURCE,
    usageHints: [GLOBAL_ATTRIBUTE_USAGE_HINT.RESOURCE_PROPERTY],
    notes: 'Family/platform grouping (identity).',
  },
];

const DEPRECATED_ATTRIBUTE_TYPES = [
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

const QUALIFIER_TAGS: TagSeed[] = [
  { label: 'overall' },
  { label: 'operating' },
  { label: 'shipping' },
  { label: 'gross' },
  { label: 'net' },
  { label: 'rated' },
  { label: 'max', synonyms: ['maximum'] },
  { label: 'min', synonyms: ['minimum'] },
  { label: 'payload' },
  { label: 'deck' },
  { label: 'destination' },
  { label: 'return' },
  { label: 'tank' },
  { label: 'battery' },
  { label: 'engine' },
  { label: 'hydraulic' },
  { label: 'transmission' },
  { label: 'undercarriage' },
  { label: 'blade' },
  { label: 'ripper' },
  { label: 'winch' },
  { label: 'fuel' },
  { label: 'truck_bed', synonyms: ['bed'] },
  { label: 'wheelbase' },
  { label: 'curb' },
  { label: 'towing' },
  { label: 'front' },
  { label: 'rear' },
  { label: 'forward' },
  { label: 'reverse' },
  { label: 'bare_drum' },
  { label: 'full_drum' },
  { label: 'line_pull' },
  { label: 'line_speed' },
  { label: 'lgp', synonyms: ['low_ground_pressure'] },
  { label: 'standard' },
  { label: 'surface' },
  { label: 'footprint' },
  { label: 'travel' },
  { label: 'ground' },
  { label: 'cycle' },
  { label: 'runtime' },
  { label: 'bulk' },
  { label: 'displacement' },
  { label: 'lift' },
  { label: 'pull' },
  { label: 'breakout' },
  { label: 'bucket' },
  { label: 'door_panel' },
];

const CORE_TAXONOMY_TAGS: TagSeed[] = [
  { label: 'vehicle' },
  { label: 'truck' },
  { label: 'pickup_truck' },
  { label: 'electric_vehicle', synonyms: ['ev'] },
  { label: 'electric_truck' },
  { label: 'construction_equipment' },
  { label: 'compact_track_loader', synonyms: ['ctl'] },
  { label: 'skid_steer_loader' },
  { label: 'service', displayName: 'Service', pos: GLOBAL_TAG_POS.NOUN },
  { label: 'logistics' },
  { label: 'delivery' },
  { label: 'pickup' },
  { label: 'deliver', pos: GLOBAL_TAG_POS.VERB },
  { label: 'dispatch', pos: GLOBAL_TAG_POS.VERB },
  { label: 'load', pos: GLOBAL_TAG_POS.VERB },
  { label: 'unload', pos: GLOBAL_TAG_POS.VERB },
  { label: 'transport', pos: GLOBAL_TAG_POS.VERB },
  { label: 'inspect', pos: GLOBAL_TAG_POS.VERB },
  { label: 'confirm', pos: GLOBAL_TAG_POS.VERB },
];

const PARSE_RULES: ParseRuleSeed[] = [
  { raw: 'overall_length', attributeName: 'length', contextTags: ['overall'] },
  { raw: 'overall_width', attributeName: 'width', contextTags: ['overall'] },
  { raw: 'overall_height', attributeName: 'height', contextTags: ['overall'] },
  { raw: 'overall_depth', attributeName: 'depth', contextTags: ['overall'] },
  { raw: 'ground_clearance', attributeName: 'clearance', contextTags: ['ground'] },
  { raw: 'max_reach', attributeName: 'reach', contextTags: ['max'] },
  { raw: 'wheelbase', attributeName: 'length', contextTags: ['wheelbase'] },
  { raw: 'bed_length', attributeName: 'length', contextTags: ['truck_bed'] },

  { raw: 'operating_weight', attributeName: 'weight', contextTags: ['operating'] },
  { raw: 'operating_mass', attributeName: 'weight', contextTags: ['operating'] },
  { raw: 'shipping_weight', attributeName: 'weight', contextTags: ['shipping'] },
  { raw: 'gross_weight', attributeName: 'weight', contextTags: ['gross'] },
  { raw: 'net_weight', attributeName: 'weight', contextTags: ['net'] },
  { raw: 'curb_weight', attributeName: 'weight', contextTags: ['curb'] },
  { raw: 'payload_capacity', attributeName: 'weight', contextTags: ['payload'] },
  { raw: 'max_payload', attributeName: 'weight', contextTags: ['payload', 'max'] },
  { raw: 'rated_payload', attributeName: 'weight', contextTags: ['payload', 'rated'] },
  { raw: 'load_weight', attributeName: 'weight', contextTags: ['payload'] },
  { raw: 'payload_weight', attributeName: 'weight', contextTags: ['payload'] },
  { raw: 'towing_capacity', attributeName: 'weight', contextTags: ['towing'] },

  { raw: 'surface_area', attributeName: 'area', contextTags: ['surface'] },
  { raw: 'footprint_area', attributeName: 'area', contextTags: ['footprint'] },
  { raw: 'footprint', attributeName: 'area', contextTags: ['footprint'] },

  { raw: 'volume_capacity', attributeName: 'volume' },
  { raw: 'tank_capacity', attributeName: 'volume', contextTags: ['tank'] },
  { raw: 'displacement', attributeName: 'volume', contextTags: ['displacement'] },
  { raw: 'engine_displacement', attributeName: 'volume', contextTags: ['engine', 'displacement'] },
  { raw: 'fuel_tank_capacity', attributeName: 'volume', contextTags: ['fuel', 'tank'] },

  { raw: 'cycle_time', attributeName: 'duration', contextTags: ['cycle'] },
  { raw: 'runtime', attributeName: 'duration', contextTags: ['runtime'] },

  { raw: 'max_speed', attributeName: 'speed', contextTags: ['max'] },
  { raw: 'travel_speed', attributeName: 'speed', contextTags: ['travel'] },

  { raw: 'lift_force', attributeName: 'force', contextTags: ['lift'] },
  { raw: 'lifting_force', attributeName: 'force', contextTags: ['lift'] },
  { raw: 'pull_force', attributeName: 'force', contextTags: ['pull'] },
  { raw: 'drawbar_pull', attributeName: 'force', contextTags: ['pull'] },
  { raw: 'breakout_force', attributeName: 'force', contextTags: ['breakout'] },

  { raw: 'battery_capacity', attributeName: 'energy', contextTags: ['battery'] },
  { raw: 'energy_capacity', attributeName: 'energy' },
  { raw: 'battery_voltage', attributeName: 'voltage', contextTags: ['battery'] },

  { raw: 'rated_power', attributeName: 'power', contextTags: ['rated'] },
  { raw: 'max_power', attributeName: 'power', contextTags: ['max'] },
  { raw: 'engine_power', attributeName: 'power', contextTags: ['engine'] },

  { raw: 'max_pressure', attributeName: 'pressure', contextTags: ['max'] },
  { raw: 'rated_pressure', attributeName: 'pressure', contextTags: ['rated'] },
  { raw: 'operating_pressure', attributeName: 'pressure', contextTags: ['operating'] },
  { raw: 'hydraulic_pressure', attributeName: 'pressure', contextTags: ['hydraulic'] },
  { raw: 'ground_pressure', attributeName: 'pressure', contextTags: ['ground'] },

  { raw: 'min_temperature', attributeName: 'temperature', contextTags: ['min'] },
  { raw: 'max_temperature', attributeName: 'temperature', contextTags: ['max'] },
  { raw: 'operating_temperature', attributeName: 'temperature', contextTags: ['operating'] },

  { raw: 'bulk_density', attributeName: 'density', contextTags: ['bulk'] },

  { raw: 'engine_torque', attributeName: 'torque', contextTags: ['engine'] },
  { raw: 'max_engine_torque', attributeName: 'torque', contextTags: ['engine', 'max'] },

  { raw: 'engine_rpm', attributeName: 'frequency', contextTags: ['engine'] },
  { raw: 'max_engine_rpm', attributeName: 'frequency', contextTags: ['engine', 'max'] },

  { raw: 'hydraulic_flow', attributeName: 'flow', contextTags: ['hydraulic'] },
];

const normalizeSynonyms = (synonyms?: string[]) => {
  if (!synonyms?.length) return undefined;
  const normalized = new Map<string, string>();
  synonyms.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const canonical = normalizeTagLabel(trimmed);
    if (!canonical) return;
    if (!normalized.has(canonical)) normalized.set(canonical, canonical);
  });
  return Array.from(normalized.values());
};

const normalizeTagLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const toDisplayName = (label: string) =>
  label
    .split('_')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeParseKey = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const main = async () => {
  const envConfig = getEnvConfig();
  const mongoClient = new MongoClient(envConfig.MONGO_CONNECTION_STRING, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  await mongoClient.connect();

  const dbName = envConfig.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';
  const unitsModel = new GlobalUnitsModel({ mongoClient, dbName });
  const attributesModel = new GlobalAttributeTypesModel({ mongoClient, dbName });
  const tagsModel = new GlobalTagsModel({ mongoClient, dbName });
  const parseRulesModel = new GlobalAttributeParseRulesModel({
    mongoClient,
    dbName,
  });
  const globalAttributeCollection = mongoClient
    .db(dbName)
    .collection<any>('global_attribute_types');

  let unitsCreated = 0;
  let unitsUpdated = 0;
  let attrsCreated = 0;
  let attrsUpdated = 0;
  let attrsDeprecated = 0;
  let tagsCreated = 0;
  let tagsUpdated = 0;
  let parseRulesCreated = 0;
  let parseRulesUpdated = 0;

  const contextTagIds = new Map<string, string>();
  const attributeTypeIds = new Map<string, string>();

  for (const unit of UNIT_DEFINITIONS) {
    const existing = await unitsModel.getByCode(unit.code);
    const now = new Date();
    const createdAt = existing?.createdAt ?? now;
    const createdBy = existing?.createdBy ?? SEED_USER;

    await unitsModel.upsertByCode({
      code: unit.code,
      name: unit.name,
      dimension: unit.dimension,
      canonicalUnitCode: unit.canonicalUnitCode,
      toCanonicalFactor: unit.toCanonicalFactor,
      offset: unit.offset ?? 0,
      status: GLOBAL_UNIT_STATUS.ACTIVE,
      createdAt,
      updatedAt: now,
      createdBy,
      updatedBy: SEED_USER,
      source: SEED_SOURCE,
      auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.REVIEWED,
    });

    if (existing) {
      unitsUpdated += 1;
    } else {
      unitsCreated += 1;
    }
  }

  for (const tag of QUALIFIER_TAGS) {
    const label = normalizeTagLabel(tag.label);
    const existing = await tagsModel.findByLabelOrSynonym(label);
    const now = new Date();
    const synonyms = normalizeSynonyms(tag.synonyms);
    const displayName = tag.displayName ?? toDisplayName(label);
    const pos = tag.pos ?? GLOBAL_TAG_POS.NOUN;

    if (existing) {
      await tagsModel.update(existing.id, {
        label,
        displayName,
        pos,
        ...(synonyms ? { synonyms } : {}),
        status: GLOBAL_TAG_STATUS.ACTIVE,
        auditStatus: GLOBAL_TAG_AUDIT_STATUS.REVIEWED,
        source: SEED_SOURCE,
        updatedAt: now,
        updatedBy: SEED_USER,
      });
      tagsUpdated += 1;
      contextTagIds.set(label, existing.id);
    } else {
      const created = await tagsModel.create({
        label,
        displayName,
        pos,
        ...(synonyms ? { synonyms } : {}),
        status: GLOBAL_TAG_STATUS.ACTIVE,
        auditStatus: GLOBAL_TAG_AUDIT_STATUS.REVIEWED,
        source: SEED_SOURCE,
        createdAt: now,
        updatedAt: now,
        createdBy: SEED_USER,
        updatedBy: SEED_USER,
      });
      tagsCreated += 1;
      contextTagIds.set(label, created.id);
    }
  }

  for (const tag of CORE_TAXONOMY_TAGS) {
    const label = normalizeTagLabel(tag.label);
    const existing = await tagsModel.findByLabelOrSynonym(label);
    const now = new Date();
    const synonyms = normalizeSynonyms(tag.synonyms);
    const displayName = tag.displayName ?? toDisplayName(label);
    const pos = tag.pos ?? GLOBAL_TAG_POS.NOUN;

    if (existing) {
      await tagsModel.update(existing.id, {
        label,
        displayName,
        pos,
        ...(synonyms ? { synonyms } : {}),
        status: GLOBAL_TAG_STATUS.ACTIVE,
        auditStatus: GLOBAL_TAG_AUDIT_STATUS.REVIEWED,
        source: SEED_SOURCE_CORE,
        updatedAt: now,
        updatedBy: SEED_USER,
      });
      tagsUpdated += 1;
    } else {
      await tagsModel.create({
        label,
        displayName,
        pos,
        ...(synonyms ? { synonyms } : {}),
        status: GLOBAL_TAG_STATUS.ACTIVE,
        auditStatus: GLOBAL_TAG_AUDIT_STATUS.REVIEWED,
        source: SEED_SOURCE_CORE,
        createdAt: now,
        updatedAt: now,
        createdBy: SEED_USER,
        updatedBy: SEED_USER,
      });
      tagsCreated += 1;
    }
  }

  for (const attr of PHYSICAL_ATTRIBUTE_TYPES) {
    const existing = await attributesModel.findByNameOrSynonym(attr.name);
    const now = new Date();
    const synonyms = normalizeSynonyms(attr.synonyms);
    const basePayload = {
      name: attr.name,
      kind: GLOBAL_ATTRIBUTE_KIND.PHYSICAL,
      valueType: GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER,
      ...(attr.dimension ? { dimension: attr.dimension } : {}),
      ...(attr.canonicalUnit ? { canonicalUnit: attr.canonicalUnit } : {}),
      ...(attr.allowedUnits ? { allowedUnits: attr.allowedUnits } : {}),
      synonyms: synonyms ?? [],
      status: GLOBAL_ATTRIBUTE_STATUS.ACTIVE,
      auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.REVIEWED,
      notes: attr.notes,
      source: SEED_SOURCE,
    };

    if (existing) {
      const updatePayload = {
        ...basePayload,
        ...(attr.appliesTo ? { appliesTo: attr.appliesTo } : {}),
        ...(attr.usageHints ? { usageHints: attr.usageHints } : {}),
        updatedAt: now,
        updatedBy: SEED_USER,
      };
      const updated = await attributesModel.update(
        existing.id,
        updatePayload,
      );
      attrsUpdated += 1;
      attributeTypeIds.set(attr.name, (updated ?? existing).id);
    } else {
      const created = await attributesModel.create({
        ...basePayload,
        appliesTo: attr.appliesTo,
        usageHints: attr.usageHints,
        createdAt: now,
        updatedAt: now,
        createdBy: SEED_USER,
        updatedBy: SEED_USER,
      });
      attrsCreated += 1;
      attributeTypeIds.set(attr.name, created.id);
    }
  }

  for (const attr of BRAND_ATTRIBUTE_TYPES) {
    const existing = await attributesModel.findByNameOrSynonym(attr.name);
    const now = new Date();
    const synonyms = normalizeSynonyms(attr.synonyms);
    const basePayload = {
      name: attr.name,
      kind: GLOBAL_ATTRIBUTE_KIND.BRAND,
      valueType: attr.valueType,
      synonyms: synonyms ?? [],
      status: GLOBAL_ATTRIBUTE_STATUS.ACTIVE,
      auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.REVIEWED,
      notes: attr.notes,
      source: SEED_SOURCE_CORE,
      ...(attr.appliesTo ? { appliesTo: attr.appliesTo } : {}),
      ...(attr.usageHints ? { usageHints: attr.usageHints } : {}),
    };

    const stored = existing
      ? await attributesModel.update(existing.id, {
          ...basePayload,
          updatedAt: now,
          updatedBy: SEED_USER,
        })
      : await attributesModel.create({
          ...basePayload,
          createdAt: now,
          updatedAt: now,
          createdBy: SEED_USER,
          updatedBy: SEED_USER,
        });

    if (existing) {
      attrsUpdated += 1;
    } else {
      attrsCreated += 1;
    }

    const id = (stored ?? existing)?.id;
    if (id) {
      await globalAttributeCollection.updateOne(
        { _id: id },
        {
          $unset: {
            dimension: '',
            canonicalUnit: '',
            allowedUnits: '',
          },
        },
      );
    }
  }

  for (const name of DEPRECATED_ATTRIBUTE_TYPES) {
    const existing = await attributesModel.findByNameOrSynonym(name);
    if (!existing) continue;
    const now = new Date();
    await attributesModel.update(existing.id, {
      status: GLOBAL_ATTRIBUTE_STATUS.DEPRECATED,
      auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.REVIEWED,
      notes:
        existing.notes ??
        'Deprecated: use atomic attribute type + context tags.',
      updatedAt: now,
      updatedBy: SEED_USER,
    });
    attrsDeprecated += 1;
  }

  const parseRulesByKey = new Map<string, ParseRuleSeed>();
  for (const rule of PARSE_RULES) {
    const rawKey = normalizeParseKey(rule.raw);
    if (!rawKey) continue;
    if (parseRulesByKey.has(rawKey)) {
      throw new Error(`Duplicate parse rule key: ${rawKey}`);
    }
    parseRulesByKey.set(rawKey, rule);
  }

  for (const [rawKey, rule] of parseRulesByKey) {
    const attributeId =
      attributeTypeIds.get(rule.attributeName) ||
      (await attributesModel.findByNameOrSynonym(rule.attributeName))?.id;
    if (!attributeId) {
      throw new Error(
        `Parse rule attribute type not found: ${rule.attributeName}`,
      );
    }

    const contextIds = (rule.contextTags ?? []).map((tag) => {
      const tagId = contextTagIds.get(normalizeTagLabel(tag));
      if (!tagId) {
        throw new Error(`Context tag not found: ${tag}`);
      }
      return tagId;
    });

    const existing = await parseRulesModel.findByRawKey(rawKey);
    const now = new Date();
    const payload = {
      raw: rule.raw,
      rawKey,
      attributeTypeId: attributeId,
      contextTagIds: contextIds.length ? contextIds : undefined,
      notes: rule.notes,
      source: SEED_SOURCE,
      auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.REVIEWED,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      createdBy: existing?.createdBy ?? SEED_USER,
      updatedBy: SEED_USER,
    };

    if (existing) {
      await parseRulesModel.update(existing.id, payload);
      parseRulesUpdated += 1;
    } else {
      await parseRulesModel.create(payload);
      parseRulesCreated += 1;
    }
  }

  console.log(
    `Seed complete. Units created: ${unitsCreated}, units updated: ${unitsUpdated}, tags created: ${tagsCreated}, tags updated: ${tagsUpdated}, attribute types created: ${attrsCreated}, attribute types updated: ${attrsUpdated}, attribute types deprecated: ${attrsDeprecated}, parse rules created: ${parseRulesCreated}, parse rules updated: ${parseRulesUpdated}.`,
  );

  await mongoClient.close();
};

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
