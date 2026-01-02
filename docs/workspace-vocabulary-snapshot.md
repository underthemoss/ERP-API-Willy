# Workspace vocabulary snapshot (generated)

Generated: `2025-12-29T18:10:20.822Z`
Main DB: `es-erp`
Global vocab DB: `es-erp-global`

Regenerate:

```bash
./node_modules/.bin/dotenv -e ./env/.env.local -- ./node_modules/.bin/ts-node scripts/dump-workspace-vocabulary-snapshot.ts
```

## Summary counts

| collection | count |
| --- | --- |
| workspaces | 1 |
| workspace_tags | 2 |
| workspace_attribute_types | 0 |
| workspace_units | 0 |
| workspace_attribute_values | 1 |
| global_tags | 42 |
| global_attribute_types | 38 |
| global_units | 85 |
| studio catalog products | 1 |

## Workspaces

| id | name | companyId | domain | accessType | archived | createdAt | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4fe4ed20-8b2a-435f-94f1-4e37167ccaef | willy local house  | 1854 | equipmentshare.com | INVITE_ONLY | false | 2025-12-20T20:24:45.535Z | 2025-12-22T14:07:27.055Z |

## Workspace draft vocabulary (workspace_* collections)

### Workspace: `willy local house ` (`4fe4ed20-8b2a-435f-94f1-4e37167ccaef`)

#### Workspace tags (`workspace_tags`)

| label | id | displayName | pos | status | auditStatus | synonyms | globalTagId | source | notes | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| compact_excavator | WTG-KJGQBRFYX7GJD92Z |  | NOUN | PROPOSED | PENDING_REVIEW |  |  | catalog-product-wizard |  | 2025-12-29T16:54:05.028Z |
| excavator | WTG-T5FGZBSNKS55WSP |  | NOUN | PROPOSED | PENDING_REVIEW |  |  | catalog-product-wizard |  | 2025-12-29T16:54:05.026Z |

#### Workspace attribute types (`workspace_attribute_types`)

_none_

#### Workspace units (`workspace_units`)

_none_

#### Workspace attribute values (`workspace_attribute_values`)

| attributeTypeId | id | value | synonyms | status | auditStatus | globalAttributeValueId | source | notes | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAT-3E4DPW7TU82RPGWQ | WAV-MN49CV2S3EHV7893 | Takeuchi |  | PROPOSED | PENDING_REVIEW |  | catalog-product-wizard |  | 2025-12-29T16:58:58.672Z |

## Global vocabulary (global_* collections)

### Global tags (`global_tags`)

| label | id | displayName | pos | status | auditStatus | synonyms | mergedIntoId | notes | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| battery | GTG-YGBV96K5H22XBB9 | Battery | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.610Z |
| breakout | GTG-ZVXUTNSGBAJDLRE | Breakout | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.659Z |
| bucket | GTG-F9VTWK3NGS9UHRMN | Bucket | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.663Z |
| bulk | GTG-5YQZFBVAJWP5GB8 | Bulk | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.649Z |
| compact_track_loader | GTG-HQR6ZAXJ8RF3L66C | Compact Track Loader | NOUN | ACTIVE | REVIEWED | ctl |  |  | 2025-12-29T18:10:13.683Z |
| construction_equipment | GTG-VKNS3F4Z6GM6CH57 | Construction Equipment | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.679Z |
| curb | GTG-NFZC4VTXYDK53JMX | Curb | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.628Z |
| cycle | GTG-E2W7RLJ3SRVLSVTX | Cycle | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.645Z |
| displacement | GTG-3E4DPW7TUWL74CD7 | Displacement | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.651Z |
| door_panel | GTG-HQR6ZAXJ842Y42NU | Door Panel | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.665Z |
| electric_truck | GTG-QBAXV5NHP7ZYN6HF | Electric Truck | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.676Z |
| electric_vehicle | GTG-QBAXV5NHPPEMGCY5 | Electric Vehicle | NOUN | ACTIVE | REVIEWED | ev |  |  | 2025-12-29T18:10:13.674Z |
| engine | GTG-HQR6ZAXJ882LDYQQ | Engine | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.614Z |
| footprint | GTG-PR756JY82V4DNDN | Footprint | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.639Z |
| front | GTG-E2W7RLJ3SGK92UVC | Front | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.632Z |
| fuel | GTG-ZVXUTNSGBZ4L6P95 | Fuel | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.618Z |
| gross | GTG-5YQZFBVAJ6ZYYGNW | Gross | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.593Z |
| ground | GTG-QBAXV5NHPJEG8WXC | Ground | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.644Z |
| hydraulic | GTG-PR756JY82M5EGSRL | Hydraulic | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.616Z |
| lift | GTG-8PDAB75MEGG77LBB | Lift | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.653Z |
| max | GTG-F9VTWK3NGHF3GMHD | Max | NOUN | ACTIVE | REVIEWED | maximum |  |  | 2025-12-29T18:10:13.600Z |
| min | GTG-B65NKYFQRRNYEBWG | Min | NOUN | ACTIVE | REVIEWED | minimum |  |  | 2025-12-29T18:10:13.602Z |
| net | GTG-HQR6ZAXJ84J2MF4B | Net | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.595Z |
| operating | GTG-8PDAB75MELM6XVC6 | Operating | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.588Z |
| overall | GTG-YGBV96K5HZ3T7M5 | Overall | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.585Z |
| payload | GTG-5YQZFBVAJ6JD9VRC | Payload | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.604Z |
| pickup_truck | GTG-PR756JY828TQCSD | Pickup Truck | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.672Z |
| pull | GTG-VKNS3F4Z6G368GDD | Pull | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.657Z |
| rated | GTG-PR756JY82P9XJAU | Rated | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.597Z |
| rear | GTG-QBAXV5NHPJPSJ3X2 | Rear | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.635Z |
| runtime | GTG-US9W2CLKN6C3NXY | Runtime | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.647Z |
| service | GTG-M82RQDAL3GZGH746 | Service | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.688Z |
| shipping | GTG-F9VTWK3NGLJWT5LL | Shipping | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.590Z |
| skid_steer_loader | GTG-E2W7RLJ3SR2PZR2Z | Skid Steer Loader | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.685Z |
| surface | GTG-9CK3LUEFZ433URYW | Surface | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.636Z |
| tank | GTG-WL38JEP4CK7LZ5YY | Tank | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.608Z |
| towing | GTG-5YQZFBVAJWFCT2TQ | Towing | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.630Z |
| travel | GTG-M82RQDAL39XGTNLZ | Travel | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.642Z |
| truck | GTG-HQR6ZAXJ8H768S8Q | Truck | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.669Z |
| truck_bed | GTG-D7MH58Q2WA7FVFZW | Truck Bed | NOUN | ACTIVE | REVIEWED | bed |  |  | 2025-12-29T18:10:13.622Z |
| vehicle | GTG-E2W7RLJ3S4SETE3 | Vehicle | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.667Z |
| wheelbase | GTG-ZVXUTNSGBH5FTHUF | Wheelbase | NOUN | ACTIVE | REVIEWED |  |  |  | 2025-12-29T18:10:13.625Z |

### Global attribute types (`global_attribute_types`)

| name | id | kind | valueType | dimension | canonicalUnit | allowedUnits | status | auditStatus | synonyms | appliesTo | usageHints | notes | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| acceleration | GAT-3E4DPW7TU2VDEMH2 | PHYSICAL | NUMBER | ACCELERATION | MPS2 | MPS2, FT_S2 | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.747Z |
| angle | GAT-PR756JY82JGX5EBC | PHYSICAL | NUMBER | ANGLE | RAD | DEG, RAD | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.740Z |
| area | GAT-5YQZFBVAJ6R36F8X | PHYSICAL | NUMBER | AREA | M2 | MM2, CM2, M2, IN2, FT2, YD2, ACRE | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.718Z |
| circumference | GAT-VKNS3F4Z6GR2WVUP | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.707Z |
| clearance | GAT-5YQZFBVAJW8UN44J | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.709Z |
| current | GAT-CTUEMS29V7PG69G9 | PHYSICAL | NUMBER | CURRENT | A | A, KA | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.755Z |
| density | GAT-5YQZFBVAJ9A5GAZF | PHYSICAL | NUMBER | DENSITY | KG_M3 | KG_M3, G_CM3, LB_FT3 | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.738Z |
| depth | GAT-HQR6ZAXJ8HSQW2FY | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.697Z |
| diameter | GAT-8PDAB75MEZAHWV9V | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.701Z |
| distance | GAT-US9W2CLKNT76EMCF | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  | SERVICE | JOB_PARAMETER |  | 2025-12-29T18:10:13.713Z |
| duration | GAT-M82RQDAL39KGKPGB | PHYSICAL | NUMBER | TIME | SEC | SEC, MIN, HR, DAY | ACTIVE | REVIEWED |  | SERVICE | JOB_PARAMETER |  | 2025-12-29T18:10:13.723Z |
| energy | GAT-YGBV96K5HJ27P7G4 | PHYSICAL | NUMBER | ENERGY | J | J, KJ, MJ, KWH, BTU | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.730Z |
| family | GAT-VKNS3F4Z6B5VBR8 | BRAND | STRING |  |  |  | ACTIVE | REVIEWED |  | RESOURCE | RESOURCE_PROPERTY | Family/platform grouping (identity). | 2025-12-29T18:10:13.779Z |
| flow | GAT-NFZC4VTXY2PGY5HC | PHYSICAL | NUMBER | FLOW_RATE | M3_S | M3_S, L_S, L_MIN, GPM, CFM, L_HR, GA_HR | ACTIVE | REVIEWED | flow_rate, flowrate |  |  |  | 2025-12-29T18:10:13.751Z |
| force | GAT-M82RQDAL39HJNVHR | PHYSICAL | NUMBER | FORCE | N | N, KN, LBF | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.728Z |
| frequency | GAT-D7MH58Q2WF6JDWK | PHYSICAL | NUMBER | FREQUENCY | HZ | HZ, RPM | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.743Z |
| height | GAT-B65NKYFQRRV4YSKT | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.695Z |
| length | GAT-US9W2CLKNVZCDJ2 | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.691Z |
| manufacturer | GAT-3E4DPW7TU82RPGWQ | BRAND | STRING |  |  |  | ACTIVE | REVIEWED | brand, make | BOTH | RESOURCE_PROPERTY | Manufacturer or brand name (identity). | 2025-12-29T18:10:13.759Z |
| model | GAT-ZVXUTNSGB6LL5RM | BRAND | STRING |  |  |  | ACTIVE | REVIEWED | model_name | BOTH | RESOURCE_PROPERTY | Model/nameplate identifier (identity). | 2025-12-29T18:10:13.762Z |
| mpn | GAT-YGBV96K5HY32HULY | BRAND | STRING |  |  |  | ACTIVE | REVIEWED | manufacturer_part_number | RESOURCE | RESOURCE_PROPERTY | Manufacturer part number. | 2025-12-29T18:10:13.773Z |
| power | GAT-3E4DPW7TU24XLFLV | PHYSICAL | NUMBER | POWER | W | W, KW, HP | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.732Z |
| pressure | GAT-E2W7RLJ3SALQGW29 | PHYSICAL | NUMBER | PRESSURE | PA | PA, KPA, MPA, BAR, PSI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.734Z |
| radius | GAT-E2W7RLJ3SBC8YDAA | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.703Z |
| reach | GAT-CTUEMS29V5A63QUR | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  | RESOURCE | RESOURCE_PROPERTY |  | 2025-12-29T18:10:13.711Z |
| resistance | GAT-GZ6KCXUYQAN2ZSB6 | PHYSICAL | NUMBER | RESISTANCE | OHM | OHM, KOHM, MOHM | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.757Z |
| series | GAT-US9W2CLKNR2BHJQU | BRAND | STRING |  |  |  | ACTIVE | REVIEWED |  | RESOURCE | RESOURCE_PROPERTY | Series designation (identity). | 2025-12-29T18:10:13.776Z |
| sku | GAT-YGBV96K5HRTBRDL | BRAND | STRING |  |  |  | ACTIVE | REVIEWED | part_number | RESOURCE | RESOURCE_PROPERTY | Stock keeping unit or internal part number. | 2025-12-29T18:10:13.769Z |
| speed | GAT-JHPBGR67MREUX79 | PHYSICAL | NUMBER | SPEED | MPS | MPS, KPH, MPH, FPS | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.726Z |
| temperature | GAT-JHPBGR67M3Q53WMF | PHYSICAL | NUMBER | TEMPERATURE | K | K, C, F | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.736Z |
| thickness | GAT-US9W2CLKNYLGRY6 | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.699Z |
| torque | GAT-YGBV96K5HHRGJZ64 | PHYSICAL | NUMBER | TORQUE | N_M | N_M, FT_LB, IN_LB | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.749Z |
| trim | GAT-5YQZFBVAJ64GM2BY | BRAND | STRING |  |  |  | ACTIVE | REVIEWED | trim_level | BOTH | RESOURCE_PROPERTY | Trim/package level (identity). | 2025-12-29T18:10:13.767Z |
| voltage | GAT-RAJYXHGPDW8QQB8S | PHYSICAL | NUMBER | VOLTAGE | V | V, KV | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.753Z |
| volume | GAT-M82RQDAL3QXK6YL | PHYSICAL | NUMBER | VOLUME | M3 | MM3, CM3, M3, IN3, FT3, YD3, ML, L, GA, QT | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.721Z |
| weight | GAT-5YQZFBVAJ6DHH93M | PHYSICAL | NUMBER | MASS | KG | MG, G, KG, LB, OZ, TON, TONNE | ACTIVE | REVIEWED | mass |  |  |  | 2025-12-29T18:10:13.716Z |
| width | GAT-NFZC4VTXYD2K8NE3 | PHYSICAL | NUMBER | LENGTH | M | MM, CM, M, KM, IN, FT, YD, MI | ACTIVE | REVIEWED |  |  |  |  | 2025-12-29T18:10:13.693Z |
| year | GAT-US9W2CLKNUU6S2K | BRAND | NUMBER |  |  |  | ACTIVE | REVIEWED | model_year | BOTH | RESOURCE_PROPERTY | Model year or production year (identity). | 2025-12-29T18:10:13.764Z |

### Global units (`global_units`)

| code | name | dimension | canonicalUnitCode | toCanonicalFactor | offset | status |
| --- | --- | --- | --- | --- | --- | --- |
| A | ampere | CURRENT | A | 1 | 0 | ACTIVE |
| ACRE | acre | AREA | M2 | 4046.8564224 | 0 | ACTIVE |
| BAR | bar | PRESSURE | PA | 100000 | 0 | ACTIVE |
| BTU | BTU | ENERGY | J | 1055.05585 | 0 | ACTIVE |
| C | celsius | TEMPERATURE | K | 1 | 273.15 | ACTIVE |
| CFM | cubic foot per minute | FLOW_RATE | M3_S | 0.0004719474432 | 0 | ACTIVE |
| CM | centimeter | LENGTH | M | 0.01 | 0 | ACTIVE |
| CM2 | square centimeter | AREA | M2 | 0.0001 | 0 | ACTIVE |
| CM3 | cubic centimeter | VOLUME | M3 | 0.000001 | 0 | ACTIVE |
| DAY | day | TIME | SEC | 86400 | 0 | ACTIVE |
| DEG | degree | ANGLE | RAD | 0.017453292519943295 | 0 | ACTIVE |
| F | fahrenheit | TEMPERATURE | K | 0.5555555555555556 | 459.67 | ACTIVE |
| FPS | foot per second | SPEED | MPS | 0.3048 | 0 | ACTIVE |
| FT | foot | LENGTH | M | 0.3048 | 0 | ACTIVE |
| FT2 | square foot | AREA | M2 | 0.09290304 | 0 | ACTIVE |
| FT3 | cubic foot | VOLUME | M3 | 0.028316846592 | 0 | ACTIVE |
| FT_LB | foot pound-force | TORQUE | N_M | 1.3558179483314003 | 0 | ACTIVE |
| FT_S2 | foot per second squared | ACCELERATION | MPS2 | 0.3048 | 0 | ACTIVE |
| G | gram | MASS | KG | 0.001 | 0 | ACTIVE |
| GA | gallon | VOLUME | M3 | 0.003785411784 | 0 | ACTIVE |
| GA_HR | gallon per hour | FLOW_RATE | M3_S | 0.0000010515032733333334 | 0 | ACTIVE |
| GPM | gallon per minute | FLOW_RATE | M3_S | 0.0000630901964 | 0 | ACTIVE |
| G_CM3 | gram per cubic centimeter | DENSITY | KG_M3 | 1000 | 0 | ACTIVE |
| HP | horsepower | POWER | W | 745.699872 | 0 | ACTIVE |
| HR | hour | TIME | SEC | 3600 | 0 | ACTIVE |
| HZ | hertz | FREQUENCY | HZ | 1 | 0 | ACTIVE |
| IN | inch | LENGTH | M | 0.0254 | 0 | ACTIVE |
| IN2 | square inch | AREA | M2 | 0.00064516 | 0 | ACTIVE |
| IN3 | cubic inch | VOLUME | M3 | 0.000016387064 | 0 | ACTIVE |
| IN_LB | inch pound-force | TORQUE | N_M | 0.1129848290276167 | 0 | ACTIVE |
| J | joule | ENERGY | J | 1 | 0 | ACTIVE |
| K | kelvin | TEMPERATURE | K | 1 | 0 | ACTIVE |
| KA | kiloampere | CURRENT | A | 1000 | 0 | ACTIVE |
| KG | kilogram | MASS | KG | 1 | 0 | ACTIVE |
| KG_M3 | kilogram per cubic meter | DENSITY | KG_M3 | 1 | 0 | ACTIVE |
| KJ | kilojoule | ENERGY | J | 1000 | 0 | ACTIVE |
| KM | kilometer | LENGTH | M | 1000 | 0 | ACTIVE |
| KN | kilonewton | FORCE | N | 1000 | 0 | ACTIVE |
| KOHM | kiloohm | RESISTANCE | OHM | 1000 | 0 | ACTIVE |
| KPA | kilopascal | PRESSURE | PA | 1000 | 0 | ACTIVE |
| KPH | kilometer per hour | SPEED | MPS | 0.2777777778 | 0 | ACTIVE |
| KV | kilovolt | VOLTAGE | V | 1000 | 0 | ACTIVE |
| KW | kilowatt | POWER | W | 1000 | 0 | ACTIVE |
| KWH | kilowatt-hour | ENERGY | J | 3600000 | 0 | ACTIVE |
| L | liter | VOLUME | M3 | 0.001 | 0 | ACTIVE |
| LB | pound | MASS | KG | 0.45359237 | 0 | ACTIVE |
| LBF | pound-force | FORCE | N | 4.4482216152605 | 0 | ACTIVE |
| LB_FT3 | pound per cubic foot | DENSITY | KG_M3 | 16.01846337 | 0 | ACTIVE |
| L_HR | liter per hour | FLOW_RATE | M3_S | 2.7777777777777776e-7 | 0 | ACTIVE |
| L_MIN | liter per minute | FLOW_RATE | M3_S | 0.000016666666666666667 | 0 | ACTIVE |
| L_S | liter per second | FLOW_RATE | M3_S | 0.001 | 0 | ACTIVE |
| M | meter | LENGTH | M | 1 | 0 | ACTIVE |
| M2 | square meter | AREA | M2 | 1 | 0 | ACTIVE |
| M3 | cubic meter | VOLUME | M3 | 1 | 0 | ACTIVE |
| M3_S | cubic meter per second | FLOW_RATE | M3_S | 1 | 0 | ACTIVE |
| MG | milligram | MASS | KG | 0.000001 | 0 | ACTIVE |
| MI | mile | LENGTH | M | 1609.344 | 0 | ACTIVE |
| MIN | minute | TIME | SEC | 60 | 0 | ACTIVE |
| MJ | megajoule | ENERGY | J | 1000000 | 0 | ACTIVE |
| ML | milliliter | VOLUME | M3 | 0.000001 | 0 | ACTIVE |
| MM | millimeter | LENGTH | M | 0.001 | 0 | ACTIVE |
| MM2 | square millimeter | AREA | M2 | 0.000001 | 0 | ACTIVE |
| MM3 | cubic millimeter | VOLUME | M3 | 1e-9 | 0 | ACTIVE |
| MOHM | megaohm | RESISTANCE | OHM | 1000000 | 0 | ACTIVE |
| MPA | megapascal | PRESSURE | PA | 1000000 | 0 | ACTIVE |
| MPH | mile per hour | SPEED | MPS | 0.44704 | 0 | ACTIVE |
| MPS | meter per second | SPEED | MPS | 1 | 0 | ACTIVE |
| MPS2 | meter per second squared | ACCELERATION | MPS2 | 1 | 0 | ACTIVE |
| N | newton | FORCE | N | 1 | 0 | ACTIVE |
| N_M | newton meter | TORQUE | N_M | 1 | 0 | ACTIVE |
| OHM | ohm | RESISTANCE | OHM | 1 | 0 | ACTIVE |
| OZ | ounce | MASS | KG | 0.028349523125 | 0 | ACTIVE |
| PA | pascal | PRESSURE | PA | 1 | 0 | ACTIVE |
| PSI | pound per square inch | PRESSURE | PA | 6894.757293168 | 0 | ACTIVE |
| QT | quart | VOLUME | M3 | 0.000946352946 | 0 | ACTIVE |
| RAD | radian | ANGLE | RAD | 1 | 0 | ACTIVE |
| RPM | revolutions per minute | FREQUENCY | HZ | 0.016666666666666666 | 0 | ACTIVE |
| SEC | second | TIME | SEC | 1 | 0 | ACTIVE |
| TON | short ton | MASS | KG | 907.18474 | 0 | ACTIVE |
| TONNE | metric tonne | MASS | KG | 1000 | 0 | ACTIVE |
| V | volt | VOLTAGE | V | 1 | 0 | ACTIVE |
| W | watt | POWER | W | 1 | 0 | ACTIVE |
| YD | yard | LENGTH | M | 0.9144 | 0 | ACTIVE |
| YD2 | square yard | AREA | M2 | 0.83612736 | 0 | ACTIVE |
| YD3 | cubic yard | VOLUME | M3 | 0.764554857984 | 0 | ACTIVE |

## Studio catalog products (StudioFS)

| workspaceId | path | productId | name | kind | tags | activityTags | attributeKeys | updatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4fe4ed20-8b2a-435f-94f1-4e37167ccaef | /catalogs/default/products/takeuchi_tb210r.jsonc | takeuchi_tb210r | Takeuchi TB210R Compact Excavator | material | excavator, compact_excavator |  | manufacturer, model, series, weight, length, width, height, power | 2025-12-29T16:54:57.336Z |

### Raw product JSON (parsed)

#### takeuchi_tb210r

```json
{
  "schemaVersion": "1.0",
  "id": "takeuchi_tb210r",
  "name": "Takeuchi TB210R Compact Excavator",
  "kind": "material",
  "tags": [
    "excavator",
    "compact_excavator"
  ],
  "activityTags": [],
  "attributes": [
    {
      "key": "manufacturer",
      "value": "Takeuchi"
    },
    {
      "key": "model",
      "value": "TB210R"
    },
    {
      "key": "series",
      "value": "TB"
    },
    {
      "key": "weight",
      "value": 1150,
      "unit": "KG",
      "contextTags": [
        "operating"
      ],
      "sourceRef": "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
    },
    {
      "key": "length",
      "value": 2960,
      "unit": "MM",
      "contextTags": [
        "overall"
      ],
      "sourceRef": "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
    },
    {
      "key": "width",
      "value": 750,
      "unit": "MM",
      "contextTags": [
        "overall"
      ],
      "sourceRef": "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
    },
    {
      "key": "height",
      "value": 2190,
      "unit": "MM",
      "contextTags": [
        "overall"
      ],
      "sourceRef": "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
    },
    {
      "key": "power",
      "value": 8.8,
      "unit": "KW",
      "contextTags": [
        "engine"
      ],
      "sourceRef": "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
    }
  ],
  "sourceRefs": [
    "https://www.takeuchi-us.com/tb210r-specs-and-dimensions/"
  ],
  "sourcePaths": [],
  "images": [],
  "notes": "Ultra-compact excavator with minimum tail swing and retractable undercarriage, suitable for confined job sites."
}
```

## Cleanup notes (candidate findings)

- Workspace BRAND attribute types should not have dimension/units:
  - none
- Workspace tags with digits (likely identity; consider deleting):
  - none
- Workspace tags ending in `_trim` (likely identity; consider deleting):
  - none
- Workspace tags that match BRAND values in existing products (identity should be attributes, not tags):
  - none
- Unlinked workspace tags that already exist globally:
  - none
- Unlinked workspace attribute types that already exist globally:
  - none
- Products with policy issues (ID-like tags/keys, identity tags, blended keys, unknown keys):
  - none

