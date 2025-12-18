import { type MongoClient, type Db, type Collection } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface UserLocationInfo {
  city?: string;
  country_code?: string;
  country_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
}

export type UserDoc = {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  // username is actually an email address
  username?: string;
  company_id?: string;

  // Auth0 specific (not exposed in GraphQL)
  auth0_user_id?: string; // The Auth0 sub claim - unique identifier from Auth0
  es_user_id?: string; // ES user ID from the webhook payload

  // Profile fields (not exposed in GraphQL)
  picture?: string;
  email_verified?: boolean;

  // Login tracking (not exposed in GraphQL)
  last_login_at?: Date;
  last_login_location?: UserLocationInfo;

  // Audit fields (not exposed in GraphQL)
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;

  deleted?: boolean; // Exclude deleted users from queries
};

export type UserUpsertInput = Omit<UserDoc, '_id'>;

export class UsersModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'users';
  private db: Db;
  private collection: Collection<UserDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<UserDoc>(this.collectionName);
  }

  async findByAuth0UserId(auth0UserId: string): Promise<UserDoc | null> {
    return await this.collection.findOne({ auth0_user_id: auth0UserId });
  }

  findByEmail(email: string): Promise<UserDoc | null> {
    return this.collection.findOne({ email });
  }

  async upsertUsersByEmails(emails: string[]): Promise<UserDoc[]> {
    if (!emails.length) return [];

    // First, check for existing users
    const existingUsers = await this.collection
      .find({ email: { $in: emails } })
      .toArray();

    // Create a map of existing emails for quick lookup
    const existingEmailsMap = new Map(
      existingUsers.map((user) => [user.email, user._id]),
    );

    // Identify emails that need new users
    const emailsNeedingNewUsers = emails.filter(
      (email) => !existingEmailsMap.has(email),
    );

    // If there are new users to create, perform bulk insert
    if (emailsNeedingNewUsers.length > 0) {
      const newUsers: UserDoc[] = emailsNeedingNewUsers.map((email) => ({
        _id: uuidv4(),
        email,
        first_name: '',
        last_name: '',
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await this.collection.insertMany(newUsers);

      // Return all users (existing + newly created)
      const allUsers = await this.collection
        .find({ email: { $in: emails } })
        .toArray();
      return allUsers;
    }

    // If no new users needed, return existing users
    return existingUsers;
  }

  async upsertUser(id: string, user: UserUpsertInput) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...user, _id: id } },
      { upsert: true },
    );
  }

  async upsertUserBulk(payload: { id: string; user: UserUpsertInput }[]) {
    await this.collection.bulkWrite(
      payload.map(({ id, user }) => {
        return {
          updateOne: {
            filter: { _id: id },
            update: {
              $set: {
                ...user,
              },
            },
            upsert: true,
          },
        };
      }),
    );
  }

  async getUsersByIds(ids: string[]): Promise<(UserDoc | null)[]> {
    // Build array with multiple formats: number version, string version, and original string
    const processedIds: (string | number)[] = [];

    ids.forEach((id) => {
      const num = Number(id);
      if (!isNaN(num)) {
        // If it's a valid number, include both number and string versions
        processedIds.push(num);
        processedIds.push(id); // string version of the number
      } else {
        // If it's not a number, just use the string
        processedIds.push(id);
      }
    });

    const users = await this.collection
      .find({ _id: { $in: processedIds as any } })
      .toArray();

    // Create map with string keys for consistent lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    return ids.map((id) => userMap.get(id) || null);
  }

  /**
   * Search for users in a company, optionally filtering by a search term.
   * The search term matches first_name, last_name, or username (email).
   */
  async searchUsers(
    companyId: string,
    searchTerm?: string,
  ): Promise<UserDoc[]> {
    const query: any = {
      company_id: companyId,
      deleted: { $ne: true },
    };

    let terms: string[] = [];
    if (searchTerm && searchTerm.trim() !== '') {
      terms = searchTerm
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    if (terms.length > 0) {
      // Each term must match at least one field (first_name, last_name, username)
      query.$and = terms.map((term) => {
        const regex = new RegExp(term, 'i');
        return {
          $or: [
            { first_name: regex },
            { last_name: regex },
            { username: regex },
          ],
        };
      });
    }

    // Fetch up to 100 results
    const users = await this.collection.find(query).limit(100).toArray();

    if (terms.length === 0) {
      return users;
    }

    // Advanced scoring: more hits and prefix matches = higher score
    function userScore(user: UserDoc, terms: string[]): number {
      let score = 0;
      for (const term of terms) {
        const prefixRegex = new RegExp('^' + term, 'i');
        const containsRegex = new RegExp(term, 'i');
        // first_name
        if (prefixRegex.test(user.first_name)) score += 2;
        else if (containsRegex.test(user.first_name)) score += 1;
        // last_name
        if (prefixRegex.test(user.last_name)) score += 2;
        else if (containsRegex.test(user.last_name)) score += 1;
        // username
        if (prefixRegex.test(user.email)) score += 2;
        else if (containsRegex.test(user.email)) score += 1;
      }
      return score;
    }

    // Sort by score descending, preserve original order for ties
    const ranked = users
      .map((u, i) => ({ user: u, score: userScore(u, terms), orig: i }))
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.orig - b.orig,
      )
      .map((x) => x.user);

    return ranked;
  }
}

export const createUsersModel = (config: { mongoClient: MongoClient }) => {
  const usersModel = new UsersModel(config);
  return usersModel;
};
