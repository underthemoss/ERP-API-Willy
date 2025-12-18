const path = require('path');

const config = {
  mongodb: {
    url:
      process.env.MONGO_CONNECTION_STRING || 'mongodb://mongo:27017/erp_local',
    databaseName: 'es-erp',
    options: {},
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: path.join(__dirname, 'migrations'),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'spicedb_migrations',

  // The mongodb collection where the lock will be created.
  lockCollectionName: 'spicedb_migrations_lock',

  // The value in seconds for the TTL index that will be used for the lock. Value of 0 will disable the feature.
  lockTtl: 0,

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.ts',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
};

module.exports = config;
