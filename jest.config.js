/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/e2e/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!jose)',
  ],
  testTimeout: 20000,
  globalSetup: '<rootDir>/src/test/e2e/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/e2e/global-teardown.ts',
};
