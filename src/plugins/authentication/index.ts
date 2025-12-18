import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import * as jose from 'jose';
import fp from 'fastify-plugin';
import { type EnvConfig } from '../../config';
import { GraphQLError } from 'graphql';
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
          const { payload } = await verifyJWT(token);
          const jwt = cleanJWTPayload(payload);
          user = jwtToAuthPayload(jwt);
        }

        request.setDecorator<UserAuthPayload>('user', user);
      } catch (err) {
        // TODO common logger...
        throw new GraphQLError('Not Authorized');
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
};

export const authPlugin = fp(plugin);

const envPrefix = process.env.LEVEL === 'prod' ? '' : 'staging-';
export const JWKS = jose.createRemoteJWKSet(
  new URL(
    `https://${envPrefix}equipmentshare-erp.us.auth0.com/.well-known/jwks.json`,
  ),
);

async function verifyJWT(token: string) {
  return jose.jwtVerify(token, JWKS);
}

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
