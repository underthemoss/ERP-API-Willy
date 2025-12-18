'use strict';

const config = require('neostandard')({
  semi: true,
  ts: true,
  noStyle: true,
  ignores: [
    '**/node_modules/**',
    './build/**',
    '**/nexus-typegen.ts',
    '**/schema.graphql',
    '**/generated/**',
    '**/spicedb-generated-types.ts',
    'spicedb/schema.generated.json'
  ]
});

// Disable camelcase rule
config.forEach(item => {
  if (item.rules) {
    item.rules.camelcase = 'off';
  }
});

module.exports = config;
