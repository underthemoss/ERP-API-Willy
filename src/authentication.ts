export const SYSTEM_USER = {
  id: 'SYSTEM',
  first_name: 'System',
  last_name: 'User',
  username: 'system@equipmentshare.com',
  company_id: '*',
};

export const ANON_USER = {
  id: 'ANONYMOUS',
  first_name: 'Anonymous',
  last_name: 'User',
  username: 'anonymous@equipmentshare.com',
  company_id: '',
};

export type UserAuthPayload = {
  id: string;
  companyId: string;
  auth0Sub: string;
  email: string;
  es_erp_roles?: 'PLATFORM_ADMIN'[];
};

export const SYSTEM_USER_JWT_PAYLOAD: UserAuthPayload = {
  id: SYSTEM_USER.id,
  companyId: SYSTEM_USER.company_id,
  auth0Sub: 'system',
  email: SYSTEM_USER.username,
};

export const ANON_USER_AUTH_PAYLOAD: UserAuthPayload = {
  id: ANON_USER.id,
  companyId: ANON_USER.company_id,
  auth0Sub: 'anonymous',
  email: ANON_USER.username,
};

export type JWTPayload = {
  is_federated: boolean;
  es_user_id: string;
  es_user_name: string;
  es_user_email: string;
  es_security_level_id: string;
  es_company_id: string;
  es_erp_roles?: 'PLATFORM_ADMIN'[];

  email: string;
  uid: string;
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  scope: string;
  azp: string;
};
