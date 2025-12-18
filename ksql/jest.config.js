module.exports = {
  displayName: 'ksql',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname, // Set root to ksql directory
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  globalSetup: '<rootDir>/tests/utils/global-setup.ts',
  globalTeardown: '<rootDir>/tests/utils/global-teardown.ts',
  testTimeout: 60000,
  maxWorkers: 1, // Run tests serially to avoid timing issues
  verbose: true,
};
