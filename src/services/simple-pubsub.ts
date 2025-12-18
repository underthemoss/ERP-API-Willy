import { PubSub } from 'graphql-subscriptions';

/**
 * Simple PubSub instance for GraphQL subscriptions
 *
 * This is an example implementation for demonstrating how subscriptions work.
 * For production with multiple servers, consider using:
 * - graphql-redis-subscriptions
 * - Or other distributed pub/sub systems
 */
export const pubsub = new PubSub();

/**
 * Start a timer that publishes the current time every second
 * This demonstrates how server-side events can push data to subscriptions
 *
 * IMPORTANT: This should only be called when the actual server starts,
 * not during schema generation or other build-time operations.
 */
export const startCurrentTimePublisher = () => {
  setInterval(() => {
    pubsub.publish('current-time', {
      timestamp: new Date().toISOString(),
    });
  }, 1000);
};
