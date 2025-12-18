export interface Auth0User {
  userId: string;
  email?: string;
  emailVerified?: boolean;
  username?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  identities?: Auth0Identity[];
  appMetadata?: Record<string, any>;
  userMetadata?: Record<string, any>;
  picture?: string;
  name?: string;
  nickname?: string;
  multifactor?: string[];
  lastIp?: string;
  lastLogin?: string;
  loginsCount?: number;
  blocked?: boolean;
  givenName?: string;
  familyName?: string;
}

export interface Auth0Identity {
  connection: string;
  userId: string;
  provider: string;
  isSocial: boolean;
  accessToken?: string;
  profileData?: Record<string, any>;
}

export interface SearchUsersResult {
  users: Auth0User[];
  total: number;
  start: number;
  limit: number;
  length: number;
}

export interface SearchUsersInput {
  query?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  fields?: string;
  includeFields?: boolean;
}

export interface Auth0Role {
  id: string;
  name: string;
  description?: string;
}

export interface AssignRolesInput {
  userId: string;
  roleIds: string[];
}

export interface RemoveRolesInput {
  userId: string;
  roleIds: string[];
}
