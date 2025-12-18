# Parallel E2E Tests Configuration

This document explains how the parallel E2E test execution is configured for GitHub Actions.

## Overview

The E2E tests are configured to run in parallel across 16 shards on GitHub Actions to reduce the overall test execution time. Each shard runs approximately 1/16 of the total tests.

## Configuration Files

### 1. `.github/workflows/e2e.yml`
The GitHub Actions workflow that:
- Uses 4-core runners (`ubuntu-latest-4-core`) for improved performance
- Uses a matrix strategy to create 16 parallel jobs (shards)
- Each shard runs a subset of tests
- Includes caching for Node.js dependencies to speed up builds
- Uploads test results as artifacts
- Provides visual grouping with prefixed job names (E2E • Shard X/16)
- Includes an aggregate job that summarizes all test results
- Adds GitHub Step Summary for better visibility in PRs
- **Uses Claude AI to analyze test results and provide intelligent insights**

### 2. `scripts/jest-shard.js`
This script:
- Generates the GraphQL schema before running tests
- Lists all E2E test files
- Distributes tests across shards based on the `CI_NODE_INDEX` and `CI_NODE_TOTAL` environment variables
- Runs Jest with the assigned test files
- Outputs JUnit test results for CI reporting

## How It Works

1. **Test Distribution**: Tests are distributed using a simple modulo operation:
   ```javascript
   const files = allTests.filter((_, i) => i % total === index);
   ```
   This ensures each shard gets an approximately equal number of tests.

2. **Parallel Execution**: GitHub Actions runs 16 jobs in parallel, each executing their assigned tests.

3. **Caching**: The workflow uses GitHub Actions caching to:
   - Cache npm dependencies based on `package-lock.json`
   - Speed up subsequent builds by reusing cached dependencies

4. **Test Results**: Each shard uploads its test results as artifacts for debugging and CI reporting.

5. **Aggregation**: After all shards complete, an aggregate job:
   - Downloads all test artifacts
   - Creates a unified summary showing which shards completed
   - Reports overall pass/fail status
   - Adds a GitHub Step Summary visible in the PR checks

6. **Visual Grouping**: Jobs are named with a prefix (E2E • Shard X/16) to group them together in the GitHub Checks tab.

7. **AI-Powered Test Analysis**: Claude analyzes all test results to provide:
   - Intelligent failure analysis with root cause identification
   - Pattern recognition across shards
   - Flaky test detection
   - Performance insights
   - Actionable recommendations for fixes

## Environment Variables

- `CI_NODE_TOTAL`: Total number of shards (set to 16)
- `CI_NODE_INDEX`: Current shard index (1-16)

## Customization

To change the number of parallel shards:

1. Update the matrix in `.github/workflows/e2e.yml`:
   ```yaml
   matrix:
     shard: [1, 2, 3, 4, 5, 6]  # For 6 shards
   ```

2. Update the `CI_NODE_TOTAL` environment variable:
   ```yaml
   env:
     CI_NODE_TOTAL: 6
   ```

3. Update the job name to reflect the new shard count:
   ```yaml
   name: E2E • Shard ${{ matrix.shard }}/6
   ```

4. Update the aggregate job summary script to reflect the new total (search for "/16" and replace with your new total).

## Claude AI Test Analysis

When tests fail, Claude AI automatically analyzes the test results to provide intelligent insights:

### What Claude Analyzes

1. **Overall Test Health**
   - Total test counts across all shards
   - Pass/fail rates
   - Overall test suite status

2. **Failure Analysis**
   - Individual failed tests with error messages
   - Root cause identification
   - Grouped related failures

3. **Pattern Recognition**
   - Common failure patterns across multiple shards
   - Timeout or performance-related issues
   - Flaky test detection (tests failing in some shards but not others)
   - Infrastructure or setup problems

4. **Code Context**
   - Examination of test source code for failed tests
   - Review of related implementation code
   - Code snippets showing relevant sections
   - Identification of potential bugs

5. **Performance Insights**
   - Identification of slow tests
   - Performance degradation patterns
   - Shards taking significantly longer than others

6. **Actionable Recommendations**
   - Specific steps to fix identified issues
   - Suggested code changes to resolve failures
   - Suggestions for improving test reliability
   - Areas requiring further investigation

### How It Works

**Triggered on Failure Only**: Claude analysis runs only when one or more shards fail, saving API costs and keeping successful runs fast.

Claude has access to:
- All 16 JUnit XML files from the test-results directory
- Bash commands to examine the codebase
- Test source files in `test/e2e/`
- Implementation code in `src/`

Using these tools, Claude:
1. Parses the test results to identify failures
2. Examines the test source code to understand what each test does
3. Checks related implementation code to identify root causes
4. Uses its understanding of test patterns and common issues to provide comprehensive analysis
5. Posts the analysis as a PR comment (using sticky comments to update on subsequent pushes)

### Configuration

The Claude analysis requires:
- `ANTHROPIC_API_KEY` secret in GitHub repository settings
- PR write permissions for the workflow

### When It Runs

- **Triggers**: Only when test shards fail (not on successful runs)
- **Output**: Posted as a PR comment
- **Updates**: Uses sticky comments, so the same comment is updated on subsequent pushes
- **Tools**: Has access to Bash commands to examine code and test results

## Benefits

- **Faster CI/CD**: Tests run in parallel, reducing total execution time significantly
- **Scalability**: Easy to adjust the number of shards based on test suite size
- **Improved Build Times**: Dependency caching reduces installation time
- **Fault Tolerance**: If one shard fails, others continue to run (fail-fast: false)
- **Better Visibility**: Visual grouping in GitHub Checks tab with prefixed job names
- **Clear Summary**: Aggregate job provides a single place to check overall test status
- **PR Integration**: GitHub Step Summary shows test results directly in the PR
- **Intelligent Analysis**: Claude AI provides deep insights into test failures and patterns
- **Actionable Feedback**: Get specific recommendations for fixing issues, not just raw error logs
- **Flaky Test Detection**: Automatically identify tests that fail intermittently

## Troubleshooting

1. **Uneven Test Distribution**: If some shards finish much faster than others, consider:
   - Grouping slow tests together
   - Using a more sophisticated distribution algorithm

2. **Memory Issues**: If shards run out of memory, reduce the number of tests per shard by increasing the total number of shards

3. **Cache Issues**: If you encounter dependency issues, the cache can be cleared by:
   - Incrementing the cache key version in the workflow
   - Manually deleting caches in the GitHub Actions settings
