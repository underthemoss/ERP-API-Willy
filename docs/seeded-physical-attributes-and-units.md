# Seeded Physical Attributes + Units (Global Vocabulary)

Goal: make PHYSICAL attributes *knowable and stable* so the agent almost never needs to invent new physical attribute types during product composition. This protects long-term integrity while keeping the agent fast.

Source of truth for the seed:
- `scripts/seed-global-attributes.ts`

Related specs:
- `docs/global-vocabulary.md`
- `docs/material-product-attributes-and-tags.md`
- `docs/canonical-vocabulary-product-composition-contract.md`

## Core method (first principles)

1) **PHYSICAL attribute types are atomic measurable quantities**
- Examples: `length`, `weight`, `pressure`, `power`, `torque`, `flow`, `temperature`
- Non-goal: storing “spec sheet keys” as attribute types (e.g., `curb_weight`, `wheelbase`, `hydraulic_flow_rate`)

2) **Qualifiers/components are tags in `contextTags[]`**
- Examples:
  - `weight` + context `["curb"]`
  - `length` + context `["wheelbase"]`
  - `flow` + context `["hydraulic"]`

3) **Units are canonicalized via a global registry**
- Every PHYSICAL attribute type has:
  - `dimension`
  - `canonicalUnit`
  - `allowedUnits[]`
- Every unit definition provides deterministic conversion to its canonical unit.

4) **Parsing helpers map blended source keys to atomic types**
- Example: `engine_torque` → `torque` + context `["engine"]`
- Parse rules are seeded and stored in global vocab so web ingestion stays deterministic.

## Seeded PHYSICAL attribute types (canonical)

Each attribute type below is seeded globally with an explicit `dimension`, `canonicalUnit`, and `allowedUnits` (except `count`, which is intentionally unitless/dimensionless).

### DIMENSIONLESS (unitless)
- `count`

### LENGTH (canonical `M`)
- `length`, `width`, `height`, `depth`, `thickness`, `diameter`, `radius`, `circumference`, `clearance`, `reach`, `distance`
- Allowed units: `MM`, `CM`, `M`, `KM`, `IN`, `FT`, `YD`, `MI`

### AREA (canonical `M2`)
- `area`
- Allowed units: `MM2`, `CM2`, `M2`, `IN2`, `FT2`, `YD2`, `ACRE`

### VOLUME (canonical `M3`)
- `volume`
- Allowed units: `MM3`, `CM3`, `M3`, `IN3`, `FT3`, `YD3`, `ML`, `L`, `GA`, `QT`

### MASS (canonical `KG`)
- `weight` (synonym: `mass`)
- Allowed units: `MG`, `G`, `KG`, `LB`, `OZ`, `TON`, `TONNE`

### TIME (canonical `SEC`)
- `duration`
- Allowed units: `SEC`, `MIN`, `HR`, `DAY`

### SPEED (canonical `MPS`)
- `speed`
- Allowed units: `MPS`, `KPH`, `MPH`, `FPS`, `FT_MIN`

### ACCELERATION (canonical `MPS2`)
- `acceleration`
- Allowed units: `MPS2`, `FT_S2`

### FORCE (canonical `N`)
- `force`
- Allowed units: `N`, `KN`, `LBF`

### TORQUE (canonical `N_M`)
- `torque`
- Allowed units: `N_M`, `FT_LB`, `IN_LB`

### PRESSURE (canonical `PA`)
- `pressure`
- Allowed units: `PA`, `KPA`, `MPA`, `BAR`, `PSI`

### FLOW_RATE (canonical `M3_S`)
- `flow` (synonyms: `flow rate`, `flowrate`)
- Allowed units: `M3_S`, `L_S`, `L_MIN`, `GPM`, `CFM`, `L_HR`, `GA_HR`

### ENERGY (canonical `J`)
- `energy`
- Allowed units: `J`, `KJ`, `MJ`, `KWH`, `BTU`

### POWER (canonical `W`)
- `power`
- Allowed units: `W`, `KW`, `HP`

### TEMPERATURE (canonical `K`)
- `temperature`
- Allowed units: `K`, `C`, `F`

### DENSITY (canonical `KG_M3`)
- `density`
- Allowed units: `KG_M3`, `G_CM3`, `LB_FT3`

### ANGLE (canonical `RAD`)
- `angle`
- Allowed units: `RAD`, `DEG`

### FREQUENCY (canonical `HZ`)
- `frequency`
- Allowed units: `HZ`, `RPM`

### VOLTAGE (canonical `V`)
- `voltage`
- Allowed units: `V`, `KV`

### CURRENT (canonical `A`)
- `current`
- Allowed units: `A`, `KA`

### RESISTANCE (canonical `OHM`)
- `resistance`
- Allowed units: `OHM`, `KOHM`, `MOHM`

## Seeded qualifier/context tags (examples)

The seed includes common qualifier tags used to disambiguate measurements without inventing new attribute types:
- `overall`, `operating`, `shipping`, `gross`, `net`, `rated`, `max`, `min`
- `engine`, `hydraulic`, `fuel`, `battery`, `transmission`, `undercarriage`
- `truck_bed` (synonym: `bed`)
- `wheelbase`, `curb`, `towing`, `blade`, `ripper`, `winch`
- `forward`, `reverse`, `bare_drum`, `full_drum`, `line_pull`, `line_speed`, `lgp`, `standard`

These are *not* “tag types” — they’re normal tags that become “context” by being attached under `attributes[].contextTags[]`.

## Example: “Ford F-150 2024 XLT” using attributes-first + context tags

This example shows structure (values are placeholders). Note how we avoid blended attribute keys like `bed_length` or `curb_weight`.

```json
{
  "schemaVersion": "1.0",
  "id": "ford_f150_2024_xlt",
  "name": "Ford F-150 2024 XLT",
  "kind": "material",
  "status": "draft",
  "tags": ["vehicle", "pickup_truck"],
  "sourceRefs": ["https://example.com/specs/ford-f150-2024"],
  "attributes": [
    { "key": "manufacturer", "value": "Ford" },
    { "key": "model", "value": "F-150" },
    { "key": "year", "value": 2024 },
    { "key": "trim", "value": "XLT" },

    { "key": "length", "value": 5885, "unit": "MM", "contextTags": ["overall"] },
    { "key": "length", "value": 1676, "unit": "MM", "contextTags": ["truck_bed"] },
    { "key": "weight", "value": 2100, "unit": "KG", "contextTags": ["curb"] },
    { "key": "torque", "value": 400, "unit": "FT_LB", "contextTags": ["engine"] },
    { "key": "power", "value": 300, "unit": "HP", "contextTags": ["engine"] }
  ]
}
```

## Spec-sheet decomposition example: “TL8R2” (track loader)

This is a stress-test for the “100% physics coverage” requirement. Every row in a typical spec sheet can be represented using *existing* atomic PHYSICAL attribute types plus context tags (no new physics attribute types required).

### Canonical mapping (no new PHYSICAL types)

**Operating Performance**
- Operating Weight – Canopy → `weight` + context `["operating","canopy"]`
- Operating Weight – Cab → `weight` + context `["operating","cab"]`
- Tipping Load → `weight` + context `["tipping"]`
- Rated Operating Capacity (SAE J818) → `weight` + context `["operating","rated"]` (keep “SAE J818” in `sourceRef` or product notes)
- Operating Capacity w/ Opt Counterweight → `weight` + context `["operating","counterweight","optional"]`
- Operating Load at 50% of Tipping Load → `weight` + context `["operating","tipping"]` (store “50% of tipping load” as a note/sourceRef; don’t mint `fifty_percent` tags)
- Bucket Breakout Force → `force` + context `["bucket","breakout"]`
- Lift Arm Breakout Force → `force` + context `["lift_arm","breakout"]`
- Traction Force → `force` + context `["traction"]`
- Ground Pressure – Canopy/Cab → `pressure` + context `["ground","canopy"]` / `["ground","cab"]`
- Travel Speed – Low/High → `speed` + context `["travel","low"]` / `["travel","high"]`
- Creep Mode … → `speed` + context `["creep_mode","low_range"]` (and optional `["high_flow"]` if it’s conditional)

**Hydraulic System**
- Auxiliary Flow – Primary Circuit → `flow` + context `["auxiliary","primary_circuit"]`
- Auxiliary Flow – High Flow (optional) → `flow` + context `["auxiliary","high_flow","optional"]`
- Hydraulic System Pressure → `pressure` + context `["hydraulic","system"]`

**Engine**
- Engine Displacement → `volume` + context `["engine","displacement"]`
- Horsepower @ 2,600 rpm → `power` + context `["engine","rated"]` AND `frequency` + context `["engine","rated"]`
- Maximum Torque @ 1,500 rpm → `torque` + context `["engine","max"]` AND `frequency` + context `["engine","max"]`

**Fluid Capacities**
- Engine Lubrication → `volume` + context `["engine","lubrication"]`
- Cooling System → `volume` + context `["cooling","system"]`
- Fuel Tank Capacity → `volume` + context `["fuel","tank"]`
- Fuel Consumption → `flow` + context `["fuel","consumption"]`
- Hydraulic Reservoir Capacity → `volume` + context `["hydraulic","reservoir"]`
- Hydraulic System Capacity → `volume` + context `["hydraulic","system"]`

### Unit rules (important)

- **Force vs mass ambiguity:** spec sheets often label force in “lb”. When the label contains “force” (breakout/traction), store the unit as `LBF` (pound-force), not `LB` (pound mass).
- We seed + normalize the units needed for this pattern:
  - `flow`: `GPM`, `L_MIN`, plus hourly rates `GA_HR`, `L_HR` (for fuel consumption)
  - `volume`: includes `QT` (quarts) and `IN3` (cubic inches) via aliases like `cu in`
  - `speed`: `MPH`, `KPH` (aliases include `km/hr`)

### Example product attributes JSON (excerpt)

```json
{
  "attributes": [
    { "key": "weight", "value": 8807, "unit": "LB", "contextTags": ["operating","canopy"] },
    { "key": "weight", "value": 9182, "unit": "LB", "contextTags": ["operating","cab"] },
    { "key": "weight", "value": 6041, "unit": "LB", "contextTags": ["tipping"] },

    { "key": "force", "value": 6204, "unit": "LBF", "contextTags": ["bucket","breakout"] },
    { "key": "pressure", "value": 3045, "unit": "PSI", "contextTags": ["hydraulic","system"] },

    { "key": "flow", "value": 19.1, "unit": "GPM", "contextTags": ["auxiliary","primary_circuit"] },
    { "key": "flow", "value": 2.8, "unit": "GA_HR", "contextTags": ["fuel","consumption"] },

    { "key": "volume", "value": 11.8, "unit": "QT", "contextTags": ["engine","lubrication"] },
    { "key": "volume", "value": 203.2, "unit": "IN3", "contextTags": ["engine","displacement"] },

    { "key": "power", "value": 74.3, "unit": "HP", "contextTags": ["engine","rated"] },
    { "key": "frequency", "value": 2600, "unit": "RPM", "contextTags": ["engine","rated"] }
  ]
}
```

## Extending the physics seed (when you truly need to)

1) Add the missing dimension (if needed): `src/services/global_attributes/constants.ts`
2) Add units + conversions: `scripts/seed-global-attributes.ts` (`UNIT_DEFINITIONS`, `allowedUnitsByDimension`)
3) Add the attribute type: `scripts/seed-global-attributes.ts` (`PHYSICAL_ATTRIBUTE_TYPES`)
4) Add common blended-key parse rules (optional but recommended): `scripts/seed-global-attributes.ts` (`PARSE_RULES`)
5) Rerun reset/seed + snapshot:
- `./node_modules/.bin/dotenv -e ./env/.env.local -- ./node_modules/.bin/ts-node scripts/reset-global-vocabulary.ts`
- `./node_modules/.bin/dotenv -e ./env/.env.local -- ./node_modules/.bin/ts-node scripts/seed-global-attributes.ts`
- `./node_modules/.bin/dotenv -e ./env/.env.local -- ./node_modules/.bin/ts-node scripts/dump-workspace-vocabulary-snapshot.ts`
