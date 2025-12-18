import { randomUUID } from 'crypto';
import { ClientSession, MongoClient, Collection } from 'mongodb';
import { Schema, z } from 'zod';

export type EventReducer<StateSchema, EventsSchema extends Schema> = (
  state: StateSchema | null,
  event: EventDoc<EventsSchema>,
) => StateSchema | null;

export const combineReducers = <StateSchema, EventsSchema extends Schema>(
  reducers: EventReducer<StateSchema, EventsSchema>[],
) => {
  const compositeReducer: EventReducer<StateSchema, EventsSchema> = (
    state,
    event,
  ) => {
    return reducers.reduce(
      (currentState, reducer) => reducer(currentState, event),
      state,
    );
  };
  return compositeReducer;
};

export type EventStoreConfig<EventsSchema extends Schema, StateSchema> = {
  client: MongoClient;
  collection: string;
  eventSchema: EventsSchema;
  reducer: EventReducer<StateSchema, EventsSchema>;
};

type EventDoc<EventsSchema extends Schema> = {
  _id: string;
  aggregateId: string;
  ts: string;
  sequence: number;
  principalId: string;
  payload: z.infer<EventsSchema>;
};

type StateResponse<StateSchema> = {
  beforeState: StateSchema | null;
  state: StateSchema | null;
};

export class EventStore<
  EventsSchema extends Schema,
  StateSchema extends { _id: string },
> {
  private client: MongoClient;
  public readonly collection: string;
  private eventSchema: EventsSchema;

  private reducer: EventReducer<StateSchema, EventsSchema>;
  private eventsCollection: Collection<EventDoc<EventsSchema>>;
  private stateCollection: Collection<{ _id: string }>;

  constructor(config: EventStoreConfig<EventsSchema, StateSchema>) {
    this.client = config.client;
    this.collection = config.collection;
    this.eventSchema = config.eventSchema;

    this.reducer = config.reducer;

    const db = this.client.db('es-erp');
    this.eventsCollection = db.collection<EventDoc<EventsSchema>>(
      `${this.collection}_events`,
    );
    this.stateCollection = db.collection<{ _id: string }>(this.collection);
  }

  async getStateDocument(
    aggregateId: string,
    session?: ClientSession,
  ): Promise<StateSchema> {
    return (await this.stateCollection.findOne(
      { _id: aggregateId },
      { session },
    )) as StateSchema;
  }

  async getEventDocuments(aggregateId: string, session?: ClientSession) {
    return await this.eventsCollection
      .find({ aggregateId }, { session })
      .toArray();
  }

  async replay(aggregateId: string) {
    await this.client.withSession((session) =>
      session.withTransaction(async () => {
        const events = await this.eventsCollection
          .find({ aggregateId }, { session })
          .toArray();
        const state = events.reduce(this.reducer, null);
        await this.persistState(aggregateId, state, session);
      }),
    );
  }

  private async persistState(
    aggregateId: string,
    state: StateSchema | null,
    session: ClientSession,
  ) {
    if (state === null) {
      await this.stateCollection.deleteOne({ _id: aggregateId }, { session });
    } else {
      const { _id, ...value } = state;
      await this.stateCollection.updateOne(
        { _id },
        { $set: value },
        { session, upsert: true },
      );
    }
  }

  private async appendEvent(
    event: EventDoc<EventsSchema>,
    session: ClientSession,
  ) {
    await this.eventsCollection.insertOne(
      { ...event, ts: new Date().toISOString() },
      { session },
    );
  }

  private async projectCurrentState(
    aggregateId: string,
    session: ClientSession,
  ) {
    const events = await this.eventsCollection
      .find({ aggregateId }, { session })
      .toArray();

    let state: StateSchema | null = null;
    for (const ev of events) {
      state = this.reducer(state, ev);
    }
    return { state, events };
  }

  async applyEvent(
    aggregateId: string,
    event: z.infer<EventsSchema>,
    ctx: { principalId: string },
    session?: ClientSession,
  ): Promise<StateResponse<StateSchema>> {
    if (!session) {
      return this.client.withSession((session) =>
        session.withTransaction(() =>
          this.applyEvent(aggregateId, event, ctx, session),
        ),
      );
    }
    const { state, events } = await this.projectCurrentState(
      aggregateId,
      session,
    );

    const newEvent: EventDoc<EventsSchema> = {
      _id: randomUUID().toString(),
      payload: this.eventSchema.parse(event),
      aggregateId,
      ts: new Date().toISOString(),
      sequence: events.length + 1,
      principalId: ctx.principalId,
    };

    const afterState = this.reducer(state, newEvent);

    await this.appendEvent(newEvent, session);
    await this.persistState(aggregateId, afterState, session);

    return {
      beforeState: state,
      state: afterState,
    };
  }
}
