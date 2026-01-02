import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import * as jose from 'jose';
import fp from 'fastify-plugin';
import { type EnvConfig } from '../../config';
import { UserAuthPayload, JWTPayload } from '../../authentication';
import { createJWTService } from '../../services/jwt';

type AuthenicateFn = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: AuthenicateFn;
  }

  interface FastifyRequest {
    user?: UserAuthPayload;
  }
}

const plugin: FastifyPluginAsync<{ envConfig: EnvConfig }> = async (
  fastify,
  opts,
) => {
  const { envConfig } = opts;

  // Initialize JWT service
  const jwtService = createJWTService(envConfig);

  const TOKEN_NOT_JWT = 'TOKEN_NOT_JWT';

  const decodeJWTPayloadUnsafe = (token: string): Record<string, unknown> => {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error(TOKEN_NOT_JWT);
    }
    const payload = parts[1] ?? '';
    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      '=',
    );
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  };

  const describeTokenForDebug = (token: string | undefined) => {
    if (!token) return null;
    const parts = token.split('.');
    const tokenShape = parts.length === 3 ? 'jwt' : 'opaque';

    let issuer: string | null = null;
    if (tokenShape === 'jwt') {
      try {
        const payload = decodeJWTPayloadUnsafe(token);
        issuer = typeof payload.iss === 'string' ? payload.iss : null;
      } catch {
        issuer = null;
      }
    }

    return { tokenShape, issuer };
  };

  const STAGING_AUTH0_DOMAIN = 'staging-equipmentshare-erp.us.auth0.com';
  const PROD_AUTH0_DOMAIN = 'equipmentshare-erp.us.auth0.com';

  const STAGING_JWKS = jose.createRemoteJWKSet(
    new URL(`https://${STAGING_AUTH0_DOMAIN}/.well-known/jwks.json`),
  );
  const PROD_JWKS = jose.createRemoteJWKSet(
    new URL(`https://${PROD_AUTH0_DOMAIN}/.well-known/jwks.json`),
  );

  const verifyAuth0JWT = async (token: string) => {
    const payload = decodeJWTPayloadUnsafe(token);
    const issuer = typeof payload.iss === 'string' ? payload.iss : '';

    const prefersProd = issuer.includes(PROD_AUTH0_DOMAIN);
    const prefersStaging = issuer.includes(STAGING_AUTH0_DOMAIN);

    const primary = prefersProd ? PROD_JWKS : STAGING_JWKS;
    const fallback = prefersProd ? STAGING_JWKS : PROD_JWKS;

    try {
      return await jose.jwtVerify(token, primary);
    } catch (err) {
      // In dev, allow verifying tokens from either Auth0 tenant to reduce local env drift.
      if (envConfig.LEVEL === 'dev' && (prefersProd || prefersStaging)) {
        try {
          return await jose.jwtVerify(token, fallback);
        } catch {
          // fall through to throw original error
        }
      }
      throw err;
    }
  };

  fastify.decorateRequest<UserAuthPayload | undefined>('user', undefined);

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      let token: string | undefined;

      // Try Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring('Bearer '.length);
      }

      // If no Authorization header, check the cookie
      if (!token && request.cookies?.[envConfig.AUTH_COOKIE_NAME]) {
        token = request.cookies[envConfig.AUTH_COOKIE_NAME];
      }

      if (!token) {
        return;
        // TODO determine if we want to prevent all requests
        // Or do it per query...
        // reply.code(401).send({ message: 'Missing token' });
        // return;
      }

      try {
        let user: UserAuthPayload;

        // Check if token is self-signed
        const isSelfSigned = jwtService.isSelfSignedToken(token);

        if (isSelfSigned) {
          // Verify self-signed token
          user = await jwtService.verifyToken(token);
        } else {
          // Verify Auth0 token
          const { payload } = await verifyAuth0JWT(token);
          const jwt = cleanJWTPayload(payload);
          user = jwtToAuthPayload(jwt);
        }

        request.setDecorator<UserAuthPayload>('user', user);
      } catch (err) {
        // NOTE: If authentication throws during GraphQL context creation, Mercurius can return 500
        // (because context errors are not GraphQL execution errors). Treat invalid tokens as
        // "unauthenticated" for GraphQL requests to avoid masking the actual GraphQL errors.
        const isGraphqlRequest = request.url?.startsWith('/graphql');
        if (isGraphqlRequest) {
          request.setDecorator<UserAuthPayload | undefined>('user', undefined);
          return;
        }

        const debug = envConfig.LEVEL === 'dev' ? describeTokenForDebug(token) : null;
        if (debug?.tokenShape === 'opaque') {
          reply.code(401).send({
            error: 'Not Authorized',
            code: TOKEN_NOT_JWT,
            hint: 'Auth0 likely returned an opaque access token; ensure your frontend Auth0 audience is set so getAccessTokenSilently() returns a JWT.',
          });
          return;
        }

        reply.code(401).send({
          error: 'Not Authorized',
          ...(envConfig.LEVEL === 'dev'
            ? {
                tokenIssuer: debug?.issuer ?? undefined,
                hint: debug?.issuer
                  ? 'If tokenIssuer does not match the Auth0 tenant configured for this backend, update NEXT_PUBLIC_AUTH0_DOMAIN or run backend with matching LEVEL.'
                  : undefined,
              }
            : {}),
        });
        return;
      }
    },
  );

  // Endpoint to exchange Bearer token for HttpOnly cookie
  fastify.post(
    '/api/auth/set-cookie',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'No token provided' });
      }

      const token = authHeader.substring('Bearer '.length);

      reply.setCookie(envConfig.AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: envConfig.LEVEL !== 'dev',
        sameSite: envConfig.LEVEL === 'dev' ? 'lax' : 'none',
        path: envConfig.LEVEL === 'dev' ? '/' : '/es-erp-api',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Return 204 No Content to avoid ERR_BLOCKED_BY_ORB
      // Chrome blocks cross-origin JSON responses, but 204 has no body
      return reply.code(204).send();
    },
  );

  // Simple endpoint to verify cookie-based auth is working (useful for <img src> flows).
  fastify.get(
    '/api/auth/me',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({ error: 'Not Authorized' });
      }
      return reply.code(200).send({ user: request.user });
    },
  );
};

export const authPlugin = fp(plugin);

function jwtToAuthPayload(jwt: JWTPayload): UserAuthPayload {
  return {
    id: jwt.uid,
    companyId: jwt.es_company_id,
    auth0Sub: jwt.sub,
    email: jwt.email || jwt.es_user_email || '',
    es_erp_roles: jwt.es_erp_roles,
  };
}

function cleanJWTPayload(payload: Record<string, any>): JWTPayload {
  const API_PREFIX = `https://api.equipmentshare.com/`;
  const ERP_ROLES_KEY = 'https://erp.estrack.com/es_erp_roles';

  const cleanedPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (key === ERP_ROLES_KEY) {
      cleanedPayload.es_erp_roles = value;
    } else if (key.startsWith(API_PREFIX)) {
      const newKey = key.slice(API_PREFIX.length);
      cleanedPayload[newKey] = value?.toString();
    } else {
      cleanedPayload[key] = value?.toString();
    }
  }
  cleanedPayload['uid'] = payload['https://erp.estrack.com/uid'];
  cleanedPayload['email'] = payload['https://erp.estrack.com/email'];
  return cleanedPayload as JWTPayload;
}
