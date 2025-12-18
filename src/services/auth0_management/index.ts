import { ManagementClient } from 'auth0';
import { type AuthZ } from '../../lib/authz';
import { type EnvConfig } from '../../config';
import { UserAuthPayload } from '../../authentication';
import {
  Auth0User,
  SearchUsersInput,
  SearchUsersResult,
  Auth0Role,
  AssignRolesInput,
  RemoveRolesInput,
} from './types';

export class Auth0ManagementService {
  private managementClient: ManagementClient;
  private authZ: AuthZ;

  constructor(config: { envConfig: EnvConfig; authZ: AuthZ }) {
    this.authZ = config.authZ;

    // Extract domain from the API URL
    const domain = config.envConfig.AUTH0_MANAGEMENT_API_URL.replace(
      /^https?:\/\/|\/api\/v2.*$/g,
      '',
    );

    this.managementClient = new ManagementClient({
      domain,
      clientId: config.envConfig.AUTH0_MANAGEMENT_M2M_CLIENT_ID,
      clientSecret: config.envConfig.AUTH0_MANAGEMENT_M2M_CLIENT_SECRET,
    });
  }

  /**
   * Search for users in Auth0
   * Requires admin permissions
   */
  async searchUsers(
    input: SearchUsersInput,
    user?: UserAuthPayload,
  ): Promise<SearchUsersResult> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      const page = input.page || 0;
      const perPage = input.perPage || 50;

      // Build search parameters
      const params: any = {
        per_page: perPage,
        page,
        include_totals: true,
      };

      if (input.query) {
        params.q = input.query;
      }

      if (input.sort) {
        params.sort = input.sort;
      }

      if (input.fields) {
        params.fields = input.fields;
        params.include_fields = input.includeFields !== false;
      }

      // Execute search
      const response = await this.managementClient.users.getAll(params);

      // Map Auth0 response to our types
      const responseData = response.data as any;
      const usersList = Array.isArray(responseData)
        ? responseData
        : responseData.users || [];

      const users: Auth0User[] = usersList.map((auth0User: any) => ({
        userId: auth0User.user_id,
        email: auth0User.email,
        emailVerified: auth0User.email_verified,
        username: auth0User.username,
        phoneNumber: auth0User.phone_number,
        phoneVerified: auth0User.phone_verified,
        createdAt:
          typeof auth0User.created_at === 'string'
            ? auth0User.created_at
            : undefined,
        updatedAt:
          typeof auth0User.updated_at === 'string'
            ? auth0User.updated_at
            : undefined,
        identities: auth0User.identities?.map((identity: any) => ({
          connection: identity.connection,
          userId: identity.user_id,
          provider: identity.provider,
          isSocial: identity.isSocial,
          accessToken: identity.access_token,
          profileData: identity.profileData,
        })),
        appMetadata: auth0User.app_metadata,
        userMetadata: auth0User.user_metadata,
        picture: auth0User.picture,
        name: auth0User.name,
        nickname: auth0User.nickname,
        multifactor: auth0User.multifactor,
        lastIp: auth0User.last_ip,
        lastLogin:
          typeof auth0User.last_login === 'string'
            ? auth0User.last_login
            : undefined,
        loginsCount: auth0User.logins_count,
        blocked: auth0User.blocked,
        givenName: auth0User.given_name,
        familyName: auth0User.family_name,
      }));

      return {
        users,
        total: responseData.total || users.length,
        start: responseData.start || page * perPage,
        limit: responseData.limit || perPage,
        length: users.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to search Auth0 users: ${error.message}`);
    }
  }

  /**
   * Get a single user by ID
   * Requires admin permissions
   */
  async getUserById(
    userId: string,
    user?: UserAuthPayload,
  ): Promise<Auth0User | null> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      const auth0User = await this.managementClient.users.get({ id: userId });

      if (!auth0User.data) {
        return null;
      }

      return {
        userId: auth0User.data.user_id,
        email: auth0User.data.email,
        emailVerified: auth0User.data.email_verified,
        username: auth0User.data.username,
        phoneNumber: auth0User.data.phone_number,
        phoneVerified: auth0User.data.phone_verified,
        createdAt:
          typeof auth0User.data.created_at === 'string'
            ? auth0User.data.created_at
            : undefined,
        updatedAt:
          typeof auth0User.data.updated_at === 'string'
            ? auth0User.data.updated_at
            : undefined,
        identities: auth0User.data.identities?.map((identity: any) => ({
          connection: identity.connection,
          userId: identity.user_id,
          provider: identity.provider,
          isSocial: identity.isSocial,
          accessToken: identity.access_token,
          profileData: identity.profileData,
        })),
        appMetadata: auth0User.data.app_metadata,
        userMetadata: auth0User.data.user_metadata,
        picture: auth0User.data.picture,
        name: auth0User.data.name,
        nickname: auth0User.data.nickname,
        multifactor: auth0User.data.multifactor,
        lastIp: auth0User.data.last_ip,
        lastLogin:
          typeof auth0User.data.last_login === 'string'
            ? auth0User.data.last_login
            : undefined,
        loginsCount: auth0User.data.logins_count,
        blocked: auth0User.data.blocked,
        givenName: auth0User.data.given_name,
        familyName: auth0User.data.family_name,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw new Error(`Failed to get Auth0 user: ${error.message}`);
    }
  }

  /**
   * Get all available roles
   * Requires admin permissions
   */
  async listRoles(user?: UserAuthPayload): Promise<Auth0Role[]> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      const response = await this.managementClient.roles.getAll();

      return response.data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list roles: ${error.message}`);
    }
  }

  /**
   * Get roles assigned to a user
   * Requires admin permissions
   */
  async getUserRoles(
    userId: string,
    user?: UserAuthPayload,
  ): Promise<Auth0Role[]> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      const response = await this.managementClient.users.getRoles({
        id: userId,
      });

      return response.data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  }

  /**
   * Assign roles to a user
   * Requires admin permissions
   */
  async assignRolesToUser(
    input: AssignRolesInput,
    user?: UserAuthPayload,
  ): Promise<void> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      await this.managementClient.users.assignRoles(
        { id: input.userId },
        { roles: input.roleIds },
      );
    } catch (error: any) {
      throw new Error(`Failed to assign roles: ${error.message}`);
    }
  }

  /**
   * Remove roles from a user
   * Requires admin permissions
   */
  async removeRolesFromUser(
    input: RemoveRolesInput,
    user?: UserAuthPayload,
  ): Promise<void> {
    // Authorization check
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }

    try {
      await this.managementClient.users.deleteRoles(
        { id: input.userId },
        { roles: input.roleIds },
      );
    } catch (error: any) {
      throw new Error(`Failed to remove roles: ${error.message}`);
    }
  }
}

export const createAuth0ManagementService = (config: {
  envConfig: EnvConfig;
  authZ: AuthZ;
}) => {
  return new Auth0ManagementService(config);
};
