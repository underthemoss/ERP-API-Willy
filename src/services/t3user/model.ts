import { type MongoClient, type Db, type Collection } from 'mongodb';

export type T3UserDoc = {
  _id: string; // user_id from Kafka
  user_id: string; // Original user ID
  first_name: string;
  last_name: string;
  email: string; // username/email
  company_id: string;
  es_user_id?: string; // Optional ES user ID
  updated_at?: Date;
  created_at?: Date;
};

export type T3UserUpsertInput = Omit<T3UserDoc, '_id'>;

export class T3UsersModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 't3users';
  private db: Db;
  private collection: Collection<T3UserDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<T3UserDoc>(this.collectionName);
  }

  async upsertT3User(id: string, user: T3UserUpsertInput) {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...user,
          _id: id,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async upsertT3UserBulk(payload: { id: string; user: T3UserUpsertInput }[]) {
    const now = new Date();
    await this.collection.bulkWrite(
      payload.map(({ id, user }) => {
        return {
          updateOne: {
            filter: { _id: id },
            update: {
              $set: {
                ...user,
                _id: id,
                updated_at: now,
              },
              $setOnInsert: {
                created_at: now,
              },
            },
            upsert: true,
          },
        };
      }),
    );
  }

  async getT3UsersByIds(ids: string[]): Promise<(T3UserDoc | null)[]> {
    const users = await this.collection.find({ _id: { $in: ids } }).toArray();
    const userMap = new Map(users.map((u) => [u._id, u]));
    return ids.map((id) => userMap.get(id) || null);
  }

  async getT3UserById(id: string): Promise<T3UserDoc | null> {
    return await this.collection.findOne({ _id: id });
  }
}

export const createT3UsersModel = (config: { mongoClient: MongoClient }) => {
  const t3UsersModel = new T3UsersModel(config);
  return t3UsersModel;
};
