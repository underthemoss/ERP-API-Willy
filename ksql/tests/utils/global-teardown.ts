import chalk from 'chalk';
import { StartedTestContainer, StartedNetwork } from 'testcontainers';

export default async function globalTeardown() {
  console.log(chalk.cyan('\n🧹 ksqlDB Test Suite - Global Teardown'));
  console.log(chalk.gray('─'.repeat(80)));

  const network: StartedNetwork = (global as any).__KSQL_NETWORK__;
  const mongodb: StartedTestContainer = (global as any).__KSQL_MONGODB__;
  const redpanda: StartedTestContainer = (global as any).__KSQL_REDPANDA__;
  const kafkaConnect: StartedTestContainer = (global as any).__KSQL_KAFKA_CONNECT__;
  const ksqldb: StartedTestContainer = (global as any).__KSQL_KSQLDB__;
  const reuseEnabled: boolean = (global as any).__REUSE_ENABLED__;

  // If container reuse is enabled, skip teardown
  // Testcontainers will manage the lifecycle automatically
  if (reuseEnabled) {
    console.log(chalk.green('♻️  Container reuse enabled - skipping teardown'));
    console.log(chalk.dim('   Containers will persist for next test run'));
    console.log(chalk.dim('   To stop, run:'), chalk.cyan('docker ps | grep testcontainers | awk \'{print $1}\' | xargs docker stop'));
    console.log(chalk.dim('   Or set'), chalk.cyan('TESTCONTAINERS_REUSE_ENABLE=false'));
    console.log(chalk.green('\n✅ Teardown complete (containers preserved)\n'));
    return;
  }

  try {
    if (ksqldb) {
      console.log(chalk.cyan('📊 Stopping ksqlDB...'));
      await ksqldb.stop();
      console.log(chalk.green('✅ ksqlDB stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop ksqlDB:'), error);
  }

  try {
    if (kafkaConnect) {
      console.log(chalk.cyan('🔌 Stopping Kafka Connect...'));
      await kafkaConnect.stop();
      console.log(chalk.green('✅ Kafka Connect stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop Kafka Connect:'), error);
  }

  try {
    if (redpanda) {
      console.log(chalk.cyan('🦜 Stopping Redpanda...'));
      await redpanda.stop();
      console.log(chalk.green('✅ Redpanda stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop Redpanda:'), error);
  }

  try {
    if (mongodb) {
      console.log(chalk.cyan('🍃 Stopping MongoDB...'));
      await mongodb.stop();
      console.log(chalk.green('✅ MongoDB stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop MongoDB:'), error);
  }

  try {
    if (network) {
      console.log(chalk.cyan('🌐 Stopping Docker network...'));
      await network.stop();
      console.log(chalk.green('✅ Docker network stopped'));
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Failed to stop network:'), error);
  }

  console.log(chalk.green('✅ Teardown complete\n'));
}
