# Global Attribute Seed Data (QUDT-Aligned Core)

> ARCHIVED / NOTE
>
> This file predates the current “tags are one thing; roles are derived” model.
> Keep it for historical reference; prefer `scripts/seed-global-attributes.ts`
> as the source of truth and `docs/global-vocabulary.md` for the canonical
> vocabulary model.

This document lists the seeded physical units, atomic attribute types, context
qualifiers, and (optional) deterministic decomposition mappings ("parse rules")
used for the Global Attribute Library. The seed
script is `scripts/seed-global-attributes.ts`.

Run locally:
```
npm run with:local -- ts-node scripts/seed-global-attributes.ts
```

Verify the environment has the seed applied:
```
npm run with:local -- ts-node scripts/check-global-attribute-seed.ts
```

---

## QUDT Alignment Notes

- Canonical units follow SI where possible (e.g., M, KG, M2, M3, SEC, K, W, PA).
- Unit codes use compact, QUDT-like symbols (e.g., M2, M3, KG_M3).
- Attribute types are PHYSICAL + NUMBER only in this seed set.
- Attribute types are atomic measurable quantities (no context or qualifiers).
- Context/qualifiers live in tags and attach at value time via
  `context_tag_ids[]`. (Any tag can be used as context by placement.)
- Decomposition mappings ("parse rules") map blended strings (e.g., `overall_length`)
  to atomic types + context tags.
- Ingestion accepts alphanumeric unit codes (e.g., M2, KG_M3, LB/FT3).

---

## Units (by Dimension)

### LENGTH (canonical M)
Units: M, MM, CM, KM, IN, FT, YD, MI

### AREA (canonical M2)
Units: M2, CM2, MM2, IN2, FT2, YD2, ACRE

### VOLUME (canonical M3)
Units: M3, CM3, MM3, IN3, FT3, YD3, ML, L, GA

### MASS (canonical KG)
Units: KG, G, MG, LB, OZ, TON, TONNE

### TIME (canonical SEC)
Units: SEC, MIN, HR, DAY

### SPEED (canonical MPS)
Units: MPS, KPH, MPH, FPS

### FORCE (canonical N)
Units: N, KN, LBF

### ENERGY (canonical J)
Units: J, KJ, MJ, KWH, BTU

### POWER (canonical W)
Units: W, KW, HP

### PRESSURE (canonical PA)
Units: PA, KPA, MPA, BAR, PSI

### TEMPERATURE (canonical K)
Units: K, C, F

### DENSITY (canonical KG_M3)
Units: KG_M3, G_CM3, LB_FT3

---

## Atomic Physical Attribute Types (by Dimension)

All seeded attribute types:
- kind: PHYSICAL
- valueType: NUMBER
- status: ACTIVE
- auditStatus: REVIEWED

### LENGTH (canonical M)
- length
- width
- height
- depth
- thickness
- diameter
- radius
- circumference
- clearance
- reach (appliesTo: RESOURCE; usage: RESOURCE_PROPERTY)
- distance (appliesTo: SERVICE; usage: JOB_PARAMETER)

### MASS (canonical KG)
- weight (synonyms: mass)

### AREA (canonical M2)
- area

### VOLUME (canonical M3)
- volume

### TIME (canonical SEC)
- duration (appliesTo: SERVICE; usage: JOB_PARAMETER)

### SPEED (canonical MPS)
- speed

### FORCE (canonical N)
- force

### ENERGY (canonical J)
- energy

### POWER (canonical W)
- power

### PRESSURE (canonical PA)
- pressure

### TEMPERATURE (canonical K)
- temperature

### DENSITY (canonical KG_M3)
- density

---

## Qualifier Tags (seeded; commonly used as context)

Seeded qualifier tags commonly used for attribute qualification (by placement in
`context_tag_ids[]`):

overall, operating, shipping, gross, net, rated, max, min, capacity, payload,
tank, battery, surface, footprint, travel, ground, cycle, runtime, bulk,
displacement, lift, pull, breakout, bucket, door_panel

---

## Parse Rules (raw -> atomic type + context tags)

Normalization treats spaces, hyphens, and underscores as equivalent.

LENGTH
- overall_length -> length + [overall]
- overall_width -> width + [overall]
- overall_height -> height + [overall]
- overall_depth -> depth + [overall]
- ground_clearance -> clearance + [ground]
- max_reach -> reach + [max]

MASS
- operating_weight -> weight + [operating]
- operating_mass -> weight + [operating]
- shipping_weight -> weight + [shipping]
- gross_weight -> weight + [gross]
- net_weight -> weight + [net]
- payload_capacity -> weight + [payload, capacity]
- max_payload -> weight + [payload, max]
- rated_payload -> weight + [payload, rated]
- load_weight -> weight + [payload]
- payload_weight -> weight + [payload]

AREA
- surface_area -> area + [surface]
- footprint_area -> area + [footprint]
- footprint -> area + [footprint]

VOLUME
- volume_capacity -> volume + [capacity]
- tank_capacity -> volume + [tank, capacity]
- displacement -> volume + [displacement]

TIME
- cycle_time -> duration + [cycle]
- runtime -> duration + [runtime]

SPEED
- max_speed -> speed + [max]
- travel_speed -> speed + [travel]

FORCE
- lift_force -> force + [lift]
- lifting_force -> force + [lift]
- pull_force -> force + [pull]
- drawbar_pull -> force + [pull]
- breakout_force -> force + [breakout]

ENERGY
- battery_capacity -> energy + [battery, capacity]
- energy_capacity -> energy + [capacity]

POWER
- rated_power -> power + [rated]
- max_power -> power + [max]

PRESSURE
- max_pressure -> pressure + [max]
- rated_pressure -> pressure + [rated]
- operating_pressure -> pressure + [operating]

TEMPERATURE
- min_temperature -> temperature + [min]
- max_temperature -> temperature + [max]
- operating_temperature -> temperature + [operating]

DENSITY
- bulk_density -> density + [bulk]

Note: No parse rule is seeded for generic `capacity` because it is ambiguous
without context (volume vs energy vs weight).

---

## Deprecated Attribute Types (legacy)

The following blended types are deprecated and should be replaced by atomic
attribute types + context tags:

operating_weight, shipping_weight, gross_weight, net_weight, payload_capacity,
load_weight, surface_area, footprint_area, capacity, tank_capacity, displacement,
cycle_time, runtime, max_speed, travel_speed, lift_force, pull_force,
breakout_force, battery_capacity, rated_power, max_pressure, operating_pressure,
min_temperature, max_temperature, operating_temperature, bulk_density

Note: If any of these appear as `status=ACTIVE` in the admin UI, the global
seed/migration has not been applied to that environment. Re-run:
`npm run with:local -- ts-node scripts/seed-global-attributes.ts`

---

## Not Seeded (Planned Later)

These are common in practice but require new dimensions or modeling choices:
- flow_rate (VOLUME/TIME)
- torque (FORCE * LENGTH)
- angle (dimensionless)
- voltage/current (electrical dimensions)
