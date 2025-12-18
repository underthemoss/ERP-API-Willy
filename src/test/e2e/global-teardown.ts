import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { closeRedis } from '../../redis';

const GLOBAL_CONFIG_PATH = path.join(__dirname, 'globalConfig.json');

export default async function globalTeardown() {
  console.log(chalk.cyan('\n🧹 Starting global test teardown...'));

  // Stop MongoDB
  if ((global as any).__MONGOD__) {
    console.log(chalk.cyan('💿 Stopping MongoDB...'));
    await (global as any).__MONGOD__.stop();
    console.log(chalk.green('✅ MongoDB stopped'));
  }

  // Stop Redpanda
  if ((global as any).__REDPANDA__) {
    console.log(chalk.cyan('🦜 Stopping Redpanda...'));
    await (global as any).__REDPANDA__.stop();
    console.log(chalk.green('✅ Redpanda stopped'));
  }

  // Stop SpiceDB
  if ((global as any).__SPICEDB__) {
    console.log(chalk.cyan('🔐 Stopping SpiceDB...'));
    await (global as any).__SPICEDB__.stop();
    console.log(chalk.green('✅ SpiceDB stopped'));
  }

  // Stop ksqlDB
  if ((global as any).__KSQLDB__) {
    console.log(chalk.cyan('📊 Stopping ksqlDB...'));
    await (global as any).__KSQLDB__.stop();
    console.log(chalk.green('✅ ksqlDB stopped'));
  }

  // Stop LocalStack
  if ((global as any).__LOCALSTACK__) {
    console.log(chalk.cyan('☁️  Stopping LocalStack...'));
    await (global as any).__LOCALSTACK__.stop();
    console.log(chalk.green('✅ LocalStack stopped'));
  }

  // Stop OpenSearch
  if ((global as any).__OPENSEARCH__) {
    console.log(chalk.cyan('🔍 Stopping OpenSearch...'));
    await (global as any).__OPENSEARCH__.stop();
    console.log(chalk.green('✅ OpenSearch stopped'));
  }

  // Stop Redis
  if ((global as any).__REDIS__) {
    console.log(chalk.cyan('🧊 Stopping Redis...'));
    await closeRedis();
    console.log(chalk.green('✅ Redis stopped'));
  }

  // Stop Docker network
  if ((global as any).__NETWORK__) {
    console.log(chalk.cyan('🌐 Stopping Docker network...'));
    await (global as any).__NETWORK__.stop();
    console.log(chalk.green('✅ Docker network stopped'));
  }

  // Stop server process last to allow NYC to write coverage
  if ((global as any).__SERVER_PROCESS__) {
    console.log(chalk.magenta('📊 Collecting code coverage data...'));
    const serverProcess = (global as any).__SERVER_PROCESS__;
    if (serverProcess.pid) {
      try {
        // Send SIGTERM to allow NYC to write coverage gracefully
        console.log(
          chalk.cyan(
            '🚀 Stopping server process (allowing NYC to write coverage)...',
          ),
        );

        // Kill the entire process group (since we used detached: true)
        if (process.platform !== 'win32') {
          // On Unix-like systems, kill the entire process group
          process.kill(-serverProcess.pid, 'SIGTERM');
        } else {
          // On Windows, just kill the process
          serverProcess.kill('SIGTERM');
        }

        // Wait for the process to exit (with timeout)
        let timeoutId: NodeJS.Timeout;
        const exitPromise = new Promise<void>((resolve) => {
          serverProcess.on('exit', () => {
            clearTimeout(timeoutId);
            console.log(
              chalk.green('✅ Server process exited, coverage data written'),
            );
            resolve();
          });
        });

        const timeoutPromise = new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn(
              chalk.yellow(
                '⚠️  Server process did not exit gracefully within 30s',
              ),
            );
            resolve();
          }, 30000);
        });

        await Promise.race([exitPromise, timeoutPromise]);

        // Force kill if still running
        try {
          if (process.platform !== 'win32') {
            process.kill(-serverProcess.pid, 'SIGKILL');
          } else {
            serverProcess.kill('SIGKILL');
          }
        } catch (e) {
          // Process already exited, which is fine
        }
      } catch (e) {
        console.warn(chalk.yellow('Failed to stop server process:'), e);
      }
    }
  }

  // Clean up config file
  if (fs.existsSync(GLOBAL_CONFIG_PATH)) {
    fs.unlinkSync(GLOBAL_CONFIG_PATH);
    console.log(chalk.green('✅ Cleaned up global config file'));
  }

  console.log(chalk.green('✅ Global test teardown complete\n'));
}
