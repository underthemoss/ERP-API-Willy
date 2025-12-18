/**
 * Types for Auth0 webhook payloads and responses
 */

export interface LocationInfo {
  city: string;
  country_code: string;
  country_code3: string;
  country_name: string;
  continent_code: string;
  subdivision_code: string;
  subdivision_name: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export interface PostLoginWebhookPayload {
  // User identification
  // uid is no longer sent from Auth0
  user_id: string; // auth0 sub
  email: string;
  email_verified: boolean;

  // User profile
  name: string;
  given_name: string;
  family_name: string;
  nickname: string;
  picture: string;

  // Company and ES user information
  company_id: string;
  es_user_id: string;

  // Event metadata
  timestamp: string;
  event_type: string;

  // Connection info
  connection: string;
  connection_id: string;

  // Client info
  client_id: string;
  client_name: string;

  // Session info
  session_id: string;
  ip: string;
  user_agent: string;

  // Location information from current login
  location: LocationInfo;

  // Optional metadata
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
  uid?: string; // Return the user's _id to Auth0
}

export interface WebhookError {
  error: string;
  code: string;
  details?: any;
}

export interface HMACConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  headerName?: string;
}
