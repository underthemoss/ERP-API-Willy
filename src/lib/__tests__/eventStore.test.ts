import { z } from 'zod';
import { EventReducer, EventStore } from '../eventStore';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

type State = {
  _id: string;
  counter: number;
};

const InitCounterEventSchema = z.object({
  type: z.literal('init'),
});

const IncrementEventSchema = z.object({
  type: z.literal('increment'),
  value: z.number(),
});

const DecrementEventSchema = z.object({
  type: z.literal('decrement'),
  value: z.number(),
});

const MultiplyEventSchema = z.object({
  type: z.literal('multiply'),
  value: z.number(),
});

const DeleteEventSchema = z.object({
  type: z.literal('delete'),
});

const EventSchema = z.discriminatedUnion('type', [
  InitCounterEventSchema,
  IncrementEventSchema,
  DecrementEventSchema,
  MultiplyEventSchema,
  DeleteEventSchema,
]);
const reducer: EventReducer<State, typeof EventSchema> = (state, event) => {
  if (event.payload.type === 'init') {
    return { _id: event.aggregateId, counter: 0 };
  }
  if (!state) {
    throw new Error('Not initialised');
  }
  if (event.payload.type === 'increment') {
    return {
      ...state,
      counter: state.counter + event.payload.value,
    };
  }
  if (event.payload.type === 'decrement') {
    return { ...state, counter: state.counter - event.payload.value };
  }
  if (event.payload.type === 'multiply') {
    return { ...state, counter: state.counter * event.payload.value };
  }
  if (event.payload.type === 'delete') {
    return null;
  }
  throw new Error(`Unknown event ${JSON.stringify(event)}`);
};

const setup = (client: MongoClient) => {
  return new EventStore({
    client,
    collection: 'counter',
    eventSchema: EventSchema,
    reducer,
  });
};

describe('event store', () => {
  let client: MongoClient;
  let replSet: MongoMemoryReplSet;
  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = await MongoClient.connect(replSet.getUri(), {});
  });
  afterAll(async () => {
    if (client) await client.close();
    if (replSet) await replSet.stop();
  });

  it('principal id is set', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    const { beforeState, state } = await eventStore.applyEvent(
      id,
      {
        type: 'init',
      },
      { principalId: 'ady' },
    );
    const [event] = await eventStore.getEventDocuments(id);
    expect(beforeState).toBe(null);
    expect(state).toBeTruthy();
    expect(await eventStore.getStateDocument(id)).toBeTruthy();
    expect(await eventStore.getEventDocuments(id)).toHaveLength(1);
    expect(event.principalId).toBe('ady');
  });

  it('can auto commit the event', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    const { beforeState, state } = await eventStore.applyEvent(
      id,
      {
        type: 'init',
      },
      { principalId: '' },
    );
    expect(beforeState).toBe(null);
    expect(state).toBeTruthy();
    expect(await eventStore.getStateDocument(id)).toBeTruthy();
    expect(await eventStore.getEventDocuments(id)).toHaveLength(1);
  });

  it('can delete the aggregate, events remain, state doc does not', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    const { beforeState, state } = await eventStore.applyEvent(
      id,
      {
        type: 'init',
      },
      { principalId: '' },
    );
    expect(beforeState).toBe(null);
    expect(state).toBeTruthy();
    const { beforeState: beforeState2, state: state2 } =
      await eventStore.applyEvent(
        id,
        {
          type: 'delete',
        },
        { principalId: '' },
      );
    expect(state2).toBeNull();
    expect(beforeState2).toBeTruthy();
    const [, ev2] = await eventStore.getEventDocuments(id);
    const doc = await eventStore.getStateDocument(id);
    expect(doc).toBeNull();
    expect(ev2.payload.type).toBe('delete');
    expect(
      eventStore.applyEvent(
        id,
        {
          type: 'delete',
        },
        { principalId: '' },
      ),
    ).rejects.toThrow();
  });

  it('throws if applying increment before init', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await expect(
      eventStore.applyEvent(
        id,
        { type: 'increment', value: 1 },
        { principalId: '' },
      ),
    ).rejects.toThrow('Not initialised');
  });

  it('throws if applying unknown event type', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await expect(
      // @ts-expect-error purposely using an unknown event type
      eventStore.applyEvent(id, { type: 'unknown', foo: 1 }),
    ).rejects.toThrow(/Invalid/);
  });

  it('applies multiple events in sequence and verifies state', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await eventStore.applyEvent(id, { type: 'init' }, { principalId: '' });
    await eventStore.applyEvent(
      id,
      { type: 'increment', value: 5 },
      { principalId: '' },
    );
    await eventStore.applyEvent(
      id,
      { type: 'decrement', value: 2 },
      { principalId: '' },
    );
    const state = await eventStore.getStateDocument(id);
    expect(state).toBeTruthy();
    if (!state) throw new Error('State should not be null');
    expect(state.counter).toBe(3);
  });

  it('rejects invalid event schema', async () => {
    const id = randomUUID();
    const eventStore = setup(client);

    await expect(
      // no value provided in event
      eventStore.applyEvent(id, { type: 'increment' } as any, {
        principalId: '',
      }),
    ).rejects.toThrow();
  });

  it('auto-commits multiple events and persists state', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await eventStore.applyEvent(id, { type: 'init' }, { principalId: '' });
    await eventStore.applyEvent(
      id,
      { type: 'increment', value: 2 },
      { principalId: '' },
    );
    await eventStore.applyEvent(
      id,
      { type: 'decrement', value: 1 },
      { principalId: '' },
    );
    const state = await eventStore.getStateDocument(id);
    expect(state).toBeTruthy();
    expect(state?.counter).toBe(1);
    const events = await eventStore.getEventDocuments(id);
    expect(events).toHaveLength(3);
  });

  it('can transactionally write multiple events using session params', async () => {
    const id = randomUUID();
    const eventStore = setup(client);

    const session = client.startSession();
    try {
      session.startTransaction();
      await eventStore.applyEvent(
        id,
        { type: 'init' },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id,
        { type: 'increment', value: 10 },
        { principalId: '' },
        session,
      );
      const { state } = await eventStore.applyEvent(
        id,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
      expect(await eventStore.getEventDocuments(id)).toHaveLength(0);
      expect(await eventStore.getStateDocument(id)).toBeFalsy();
      // can still run checks on the event outcome
      expect(state?.counter).toBe(15);
      await session.commitTransaction();
      expect(
        (await eventStore.getEventDocuments(id))?.map((d) => d.sequence),
      ).toEqual([1, 2, 3]);
      expect((await eventStore.getStateDocument(id))?.counter).toBe(15);
    } finally {
      await session.endSession();
    }
  });
  it('Events are strictly ordered in a transaction', async () => {
    const id1 = randomUUID();
    const eventStore = setup(client);
    await client.withSession(async (session) => {
      await eventStore.applyEvent(
        id1,
        { type: 'init' },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id1,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id1,
        { type: 'multiply', value: 5 },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id1,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
    });

    expect(await eventStore.getStateDocument(id1).then((d) => d?.counter)).toBe(
      30,
    );

    const id2 = randomUUID();
    await client.withSession(async (session) => {
      await eventStore.applyEvent(
        id2,
        { type: 'init' },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id2,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id2,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id2,
        { type: 'multiply', value: 5 },
        { principalId: '' },
        session,
      );
    });

    expect(await eventStore.getStateDocument(id1).then((d) => d?.counter)).toBe(
      30,
    );
  });
  it('Business logic can be applied and transaction aborted', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await client.withSession(async (session) => {
      await eventStore.applyEvent(
        id,
        { type: 'init' },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id,
        { type: 'increment', value: 2 },
        { principalId: '' },
        session,
      );
      await eventStore.applyEvent(
        id,
        { type: 'increment', value: 5 },
        { principalId: '' },
        session,
      );
    });

    expect(await eventStore.getStateDocument(id).then((d) => d?.counter)).toBe(
      7,
    );

    const result = await client.withSession(async (session) => {
      return await session.withTransaction(async () => {
        await eventStore.applyEvent(
          id,
          { type: 'decrement', value: 20 },
          { principalId: '' },
          session,
        );
        const state = await eventStore.getStateDocument(id, session);
        if (!state || state.counter < 0) {
          await session.abortTransaction();
          return { success: false };
        }
        return { success: true };
      });
    });

    expect(result.success).toBe(false);
    expect(await eventStore.getStateDocument(id).then((d) => d?.counter)).toBe(
      7,
    );
  });
  it('rejects events with additional properties (strict schema)', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await eventStore.applyEvent(id, { type: 'init' }, { principalId: '' });
    // Try to apply an event with an extra property
    const event = { value: 1, extra: 'should not persist' };
    await eventStore.applyEvent(
      id,
      { ...event, type: 'increment' },
      { principalId: '' },
    );

    const [, event2] = await eventStore.getEventDocuments(id);

    expect((event2.payload as any).extra).toBeUndefined();
    // await expect(
    // ).rejects.toThrow(/unrecognized_keys/);
  });

  test('Race conditions will reject', async () => {
    const id = randomUUID();
    const eventStore = setup(client);
    await eventStore.applyEvent(id, { type: 'init' }, { principalId: '' });
    await eventStore.applyEvent(
      id,
      { type: 'increment', value: 3 },
      { principalId: '' },
    );

    await Promise.allSettled(
      Array.from({ length: 4 }).map(() => {
        return client.withSession(async (session) => {
          return await session.withTransaction(async () => {
            const { state } = await eventStore.applyEvent(
              id,
              { type: 'decrement', value: 1 },
              { principalId: '' },
              session,
            );
            if (!state || state.counter < 0) {
              await session.abortTransaction();
              return { success: false };
            }
          });
        });
      }),
    );

    const events = await eventStore.getEventDocuments(id);
    expect(events.length).toBe(5);
    const state = await eventStore.getStateDocument(id);
    expect(state?.counter).toBe(0);
  });
});
