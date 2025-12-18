import { subscriptionType, objectType } from 'nexus';
import { pubsub } from '../../services/simple-pubsub';

/**
 * Example event type for demonstrating subscriptions
 */
export const CurrentTimeEvent = objectType({
  name: 'CurrentTimeEvent',
  definition(t) {
    t.nonNull.string('timestamp', {
      description: 'The current server time',
    });
  },
});

/**
 * GraphQL Subscriptions
 *
 * This demonstrates how to create GraphQL subscriptions using async iterators.
 * The pattern shown here (using asyncIterableIterator) is the standard approach
 * for implementing real-time subscriptions in GraphQL.
 *
 * A server-side timer publishes the current time every 5 seconds, demonstrating
 * how server events can push data to clients in real-time.
 */
export const Subscription = subscriptionType({
  definition(t) {
    /**
     * Example subscription that demonstrates the async iterator pattern.
     *
     * To test this subscription:
     * 1. Subscribe to currentTime in GraphQL playground
     * 2. The server will automatically push time updates every 5 seconds
     *
     * This follows the same pattern that was used for CDC subscriptions,
     * showing how to properly implement the async iterator protocol with
     * server-side event publishing.
     */
    t.field('currentTime', {
      type: CurrentTimeEvent,
      description:
        'Subscribe to current server time updates (emitted every 5 seconds, for educational purposes)',
      subscribe: (_root, _args, _ctx) => {
        // This is the key pattern: asyncIterableIterator creates an async iterator
        // that GraphQL can use to stream events to subscribers
        return pubsub.asyncIterableIterator(['current-time']);
      },
      resolve: (payload: any) => payload,
    });
  },
});
