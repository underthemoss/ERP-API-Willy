const { execSync } = require('child_process');

// Generate schema before running tests
console.log('Generating schema...');
execSync('npm run generate:schema', { stdio: 'inherit' });

const allTests = execSync('npx jest --listTests', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const total = parseInt(process.env.CI_NODE_TOTAL || '1', 10);
const index = parseInt(process.env.CI_NODE_INDEX || '1', 10) - 1;

const files = allTests.filter((_, i) => i % total === index);

if (files.length === 0) {
  console.log('No tests to run on this shard.');
  process.exit(0);
}

console.log(`Running tests on shard ${index + 1}/${total}:`, files);
console.log(`Running ${files.length} test files...`);

// Run tests without coverage (tests hit external server process, so Jest coverage doesn't work)
require('child_process').execSync(
  `TS_JEST_TSCONFIG=tsconfig.ci.json DEBUG_E2E_TESTS=true npx jest --reporters=default --reporters=jest-junit --detectOpenHandles --forceExit --maxWorkers=50% ${files.join(' ')}`,
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      TS_JEST_TSCONFIG: 'tsconfig.ci.json',
      LEVEL: 'dev',
    },
  },
);
