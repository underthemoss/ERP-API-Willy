import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { logger } from '../../../../lib/logger';
import {
  PostLoginWebhookPayload,
  WebhookResponse,
  WebhookError,
  LocationInfo,
} from '../types';

import { SYSTEM_USER_JWT_PAYLOAD } from '../../../../authentication';
import { UsersService } from '../../../../services/users';
import { UserUpsertInput } from '../../../../services/users/model';
import { AuthZ } from '../../../../lib/authz';
import { DomainResource } from '../../../../lib/authz/resources/DomainResource';
import { DomainsService } from '../../../../services/domains';
import { type EnvConfig } from '../../../../config';

export interface PostLoginHandlerDeps {
  usersService: UsersService;
  authZ: AuthZ;
  domainsService: DomainsService;
  envConfig: EnvConfig;
}

/**
 * Find user by Auth0 user ID first, then fallback to email if not found
 */
async function findUser(
  auth0UserId: string,
  email: string,
  usersService: UsersService,
) {
  // First, try to find existing user by auth0_user_id
  const userByAuth0Id = await usersService.findByAuth0UserId(
    auth0UserId,
    SYSTEM_USER_JWT_PAYLOAD,
  );

  if (userByAuth0Id) {
    logger.debug({
      msg: 'User found by auth0_user_id',
      userId: userByAuth0Id._id,
      auth0UserId,
      email,
    });
    return userByAuth0Id;
  }

  // If not found by auth0_user_id, try to find by email
  const userByEmail = await usersService.findByEmail(
    email,
    SYSTEM_USER_JWT_PAYLOAD,
  );

  if (userByEmail) {
    logger.debug({
      msg: 'User found by email (auth0_user_id not matched)',
      userId: userByEmail._id,
      auth0UserId,
      email,
    });
    return userByEmail;
  }

  return null;
}

/**
 * Prepare user data from webhook payload for database update
 */
function prepareUserData(payload: PostLoginWebhookPayload): UserUpsertInput {
  return {
    email: payload.email,
    first_name: payload.given_name || '',
    last_name: payload.family_name || '',
    username: payload.email,
    company_id: payload.company_id,

    // Auth0 specific
    auth0_user_id: payload.user_id, // The sub claim from Auth0
    es_user_id: payload.es_user_id, // Store the ES user ID from the payload

    // Profile fields
    picture: payload.picture,
    email_verified: payload.email_verified,

    // Login tracking
    last_login_at: new Date(payload.timestamp),
    last_login_location: payload.location
      ? transformLocationData(payload.location)
      : undefined,

    // Audit fields
    updated_at: new Date(),
    updated_by: 'auth0_webhook',
  };
}

/**
 * Transform location data from webhook to database format
 */
function transformLocationData(location: LocationInfo) {
  return {
    city: location.city,
    country_code: location.country_code,
    country_name: location.country_name,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  };
}

/**
 * Update user information in the database
 * Returns the user's _id (either existing or newly generated)
 */
async function updateUserInDatabase(
  payload: PostLoginWebhookPayload,
  usersService: UsersService,
): Promise<string | null> {
  if (!payload.user_id) {
    logger.warn({
      msg: 'No user_id (sub) provided in webhook payload',
      email: payload.email,
    });
    return null;
  }

  try {
    // Try to find existing user by auth0_user_id first, then by email
    const existingUser = await findUser(
      payload.user_id,
      payload.email,
      usersService,
    );

    let userId: string;
    if (existingUser) {
      // User exists, use their existing _id
      userId = existingUser._id;
      logger.info({
        msg: 'Found existing user',
        userId,
        auth0UserId: payload.user_id,
        email: payload.email,
      });
    } else {
      // New user, generate a UUID for _id
      userId = randomUUID();
      logger.info({
        msg: 'Creating new user with generated UUID',
        userId,
        auth0UserId: payload.user_id,
        email: payload.email,
      });
    }

    const userData = prepareUserData(payload);

    // Upsert user with the determined userId
    await usersService.upsertUser(userId, userData, SYSTEM_USER_JWT_PAYLOAD);

    logger.info({
      msg: 'User information updated successfully',
      userId,
      auth0UserId: payload.user_id,
      esUserId: payload.es_user_id,
      email: payload.email,
      location: userData.last_login_location,
      isNewUser: !existingUser,
    });

    return userId;
  } catch (error) {
    logger.error({
      msg: 'Failed to update user information',
      auth0UserId: payload.user_id,
      esUserId: payload.es_user_id,
      error: error instanceof Error ? error.message : error,
    });
    // Don't fail the webhook if this is a non-critical operation
    // Auth0 will continue to work even if we can't update our database
    return null;
  }
}

/**
 * Extract and validate domain from email using DomainsService
 */
function extractValidDomain(
  email: string,
  domainsService: DomainsService,
): string | null {
  const emailDomain = DomainResource.extractDomainFromEmail(email);

  if (!emailDomain) {
    logger.debug({
      msg: 'No domain extracted from email',
      email,
    });
    return null;
  }

  const validationResult = domainsService.isValidEnterpriseDomain(emailDomain);

  if (!validationResult.isValid) {
    logger.info({
      msg: 'Skipping domain assignment - invalid enterprise domain',
      emailDomain: validationResult.domain,
      email,
      reason: validationResult.reason,
    });
    return null;
  }

  logger.debug({
    msg: 'Valid enterprise domain extracted',
    emailDomain: validationResult.domain,
    email,
  });

  return validationResult.domain;
}

/**
 * Check if user should be assigned to domain
 */
async function shouldAssignUserToDomain(
  spiceDbUserId: string,
  escapedDomain: string,
  authZ: AuthZ,
): Promise<boolean> {
  try {
    const isMember = await authZ.domain.isUserMemberOfDomain(
      spiceDbUserId,
      escapedDomain,
    );
    return !isMember;
  } catch (error) {
    logger.error({
      msg: 'Failed to check domain membership',
      spiceDbUserId,
      escapedDomain,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Assign user to their email domain in SpiceDB
 */
async function assignUserToDomain(
  payload: PostLoginWebhookPayload,
  uid: string | null,
  authZ: AuthZ,
  domainsService: DomainsService,
): Promise<void> {
  if (!payload.email || !uid) {
    logger.warn({
      msg: 'Missing email or user ID for domain assignment',
      auth0UserId: payload.user_id,
      uid,
      email: payload.email,
    });
    return;
  }

  try {
    const emailDomain = extractValidDomain(payload.email, domainsService);

    if (!emailDomain) {
      logger.debug({
        msg: 'No valid domain to assign',
        auth0UserId: payload.user_id,
        uid,
        email: payload.email,
      });
      return;
    }

    // Use the internal user ID (_id/uid) for SpiceDB operations
    const spiceDbUserId = uid;
    const escapedDomain = emailDomain.replace('.', '_');

    logger.info({
      msg: 'Processing domain assignment',
      escapedDomain,
      spiceDbUserId,
      auth0UserId: payload.user_id,
    });

    const needsAssignment = await shouldAssignUserToDomain(
      spiceDbUserId,
      escapedDomain,
      authZ,
    );

    if (needsAssignment) {
      await authZ.domain.addUserToDomain(spiceDbUserId, escapedDomain);

      logger.info({
        msg: 'User added to domain in SpiceDB',
        userId: spiceDbUserId,
        auth0UserId: payload.user_id,
        escapedDomain,
        email: payload.email,
      });
    } else {
      logger.info({
        msg: 'User already member of domain in SpiceDB',
        userId: spiceDbUserId,
        auth0UserId: payload.user_id,
        escapedDomain,
        email: payload.email,
      });
    }
  } catch (error) {
    logger.error({
      msg: 'Failed to set user domain in SpiceDB',
      auth0UserId: payload.user_id,
      uid,
      email: payload.email,
      error: error instanceof Error ? error.message : error,
    });
    // Don't fail the webhook if SpiceDB operation fails
    // This is a non-critical operation for the login flow
  }
}

/**
 * Create success response for webhook
 */
function createSuccessResponse(
  payload: PostLoginWebhookPayload,
  uid: string | null,
): WebhookResponse {
  const response: WebhookResponse = {
    success: true,
    message: 'Post-login webhook processed successfully',
    data: {
      userId: payload.user_id,
      esUserId: payload.es_user_id,
      processed: true,
      uid,
    },
  };

  return response;
}

/**
 * Handle webhook errors and send appropriate response
 */
function handleWebhookError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  logger.error({
    msg: 'Post-login webhook error',
    error: error instanceof Error ? error.message : error,
    body: request.body,
  });

  const errorResponse: WebhookError = {
    error: 'Failed to process post-login webhook',
    code: 'POST_LOGIN_ERROR',
    details: error instanceof Error ? error.message : 'Unknown error',
  };

  reply.code(500).send(errorResponse);
}

/**
 * Handler for the post-login webhook
 * Main orchestration function with clean control flow
 */
export async function postLoginHandler(
  deps: PostLoginHandlerDeps,
): Promise<(request: FastifyRequest, reply: FastifyReply) => Promise<void>> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.body as PostLoginWebhookPayload;
      const { usersService } = deps;

      logger.info({
        msg: 'Processing post-login webhook',
        userId: payload.user_id,
        email: payload.email,
        esUserId: payload.es_user_id,
      });

      if (deps.envConfig.INVITE_ONLY) {
        const user = await findUser(
          payload.user_id,
          payload.email,
          usersService,
        );

        if (
          !user &&
          !deps.envConfig.INVITE_ONLY_BYPASS_EMAILS?.includes(payload.email)
        ) {
          logger.warn({
            msg: 'Invite-only mode enabled - rejecting login for unknown email',
            email: payload.email,
            auth0UserId: payload.user_id,
          });

          const errorResponse: WebhookError = {
            error: 'User not invited to this application',
            code: 'USER_NOT_INVITED',
          };

          reply.code(403).send(errorResponse);
          return;
        }
      }

      // Step 1: Update user information in the database and get the user's _id
      const uid = await updateUserInDatabase(payload, deps.usersService);

      // Step 2: Assign user to their email domain in SpiceDB (using the internal uid)
      await assignUserToDomain(payload, uid, deps.authZ, deps.domainsService);

      // Step 3: Send success response with the user's _id as uid
      const response = createSuccessResponse(payload, uid);
      logger.info({ response }, 'Post login response');
      reply.code(200).send(response);
    } catch (error) {
      handleWebhookError(error, request, reply);
    }
  };
}
