import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import { type T3UsersModel, type T3UserUpsertInput } from './model';
import { getKafkaConsumerGroupId } from '../../lib/kafka-util';

export class T3UsersSinkConnector {
  private kafka: KafkaJS.Kafka;
  private model: T3UsersModel;
  private consumer_group_id: string;
  private envConfig: EnvConfig;

  constructor(opts: {
    envConfig: EnvConfig;
    kafka: KafkaJS.Kafka;
    model: T3UsersModel;
  }) {
    this.kafka = opts.kafka;
    this.model = opts.model;
    this.envConfig = opts.envConfig;
    this.consumer_group_id = getKafkaConsumerGroupId(
      'es-erp-t3users-consumer-group',
    );
  }

  private async t3usersConsumer() {
    const topic = 'fleet-source-connector-2.public.users';
    const consumer = this.kafka.consumer({
      kafkaJS: {
        groupId: this.consumer_group_id,
        fromBeginning: true,
      },
    });
    await consumer.connect();
    await consumer.subscribe({
      topic,
    });

    await consumer.run({
      eachBatch: async ({ batch }) => {
        const usersToUpsert: { id: string; user: T3UserUpsertInput }[] = [];

        for (const msg of batch.messages) {
          if (!msg.value) {
            continue;
          }
          const value = msg.value.toString();
          const parsedMsg = JSON.parse(value);

          // Extract the fields we need
          const userId = parsedMsg.user_id?.toString();
          if (!userId) {
            continue;
          }

          const userInput: T3UserUpsertInput = {
            user_id: userId,
            first_name: parsedMsg.first_name || '',
            last_name: parsedMsg.last_name || '',
            email: parsedMsg.username || parsedMsg.email || '',
            company_id: parsedMsg.company_id?.toString() || '',
          };

          if (parsedMsg.es_user_id) {
            userInput.es_user_id = parsedMsg.es_user_id.toString();
          }

          usersToUpsert.push({
            id: userId,
            user: userInput,
          });
        }

        if (usersToUpsert.length > 0) {
          await this.model.upsertT3UserBulk(usersToUpsert);
          console.log(
            `T3UsersSinkConnector: Processed ${usersToUpsert.length} users`,
          );
        }
      },
    });
  }

  async start() {
    if (this.envConfig.DISABLE_KAFKA) {
      console.warn('DISABLE_KAFKA is set. Skipping T3UsersSinkConnector.');
      return;
    }
    console.log(
      'T3UsersSinkConnector: Starting consumer for fleet-source-connector-2.public.users',
    );
    await this.t3usersConsumer();
  }
}
