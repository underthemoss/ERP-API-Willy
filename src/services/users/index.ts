import { type MongoClient } from 'mongodb';
import {
  UsersModel,
  createUsersModel,
  UserUpsertInput,
  UserDoc,
} from './model';
import { ANON_USER_AUTH_PAYLOAD, UserAuthPayload } from '../../authentication';
import { EnvConfig } from '../../config';

export { type UserDoc as User } from './model';

export class UsersService {
  private model: UsersModel;
  constructor(config: { model: UsersModel }) {
    this.model = config.model;
  }

  findByAuth0UserId = async (
    auth0UserId: string,
    user?: UserAuthPayload,
  ): Promise<UserDoc | null> => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.findByAuth0UserId(auth0UserId);
  };

  findByEmail = async (
    email: string,
    user: UserAuthPayload,
  ): Promise<UserDoc | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.findByEmail(email);
  };

  batchGetUsersById = async (
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(UserDoc | null)[]> => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // business logic, validation, etc. could go here
    return this.model.getUsersByIds(ids);
  };

  upsertUserByEmail = async (
    email: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    // TODO Auth checks
    return this.model.upsertUsersByEmails([email]);
  };

  upsertUsersByEmail = async (
    emails: string[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) => {
    // auth on users model...

    return this.model.upsertUsersByEmails(emails);
  };

  upsertUser = async (
    id: string,
    input: UserUpsertInput,
    user?: UserAuthPayload,
  ) => {
    // auth
    if (!user) {
      throw new Error('User not authenticated');
    }
    // validation
    // business logic
    return this.model.upsertUser(id, {
      ...input,
    });
  };

  /**
   * Search for users in the current user's company, optionally filtering by a search term.
   * @param searchTerm - Optional search string (matches first_name, last_name, username)
   * @param user - Authenticated user JWT payload
   */
  searchUsers = async (
    searchTerm: string | undefined,
    user?: UserAuthPayload,
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    if (!user.companyId) {
      throw new Error('User does not have a company_id');
    }
    return this.model.searchUsers(user.companyId, searchTerm);
  };
}

export const createUsersService = async (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
}) => {
  const model = createUsersModel(config);
  const usersService = new UsersService({
    model,
  });
  return usersService;
};

export type { UserDoc } from './model';
