import { createJWTService } from '../index';
import { UserAuthPayload } from '../../../authentication';
import { EnvConfig } from '../../../config';
import * as crypto from 'crypto';

describe('JWT Service', () => {
  let privateKey: string;
  let publicKey: string;
  let envConfig: EnvConfig;

  beforeAll(() => {
    // Generate test RSA key pair
    const { privateKey: privKey, publicKey: pubKey } =
      crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

    privateKey = Buffer.from(privKey).toString('base64');
    publicKey = Buffer.from(pubKey).toString('base64');

    envConfig = {
      JWT_PRIVATE_KEY: privateKey,
      JWT_PUBLIC_KEY: publicKey,
      JWT_TOKEN_EXPIRY: '1h',
    } as EnvConfig;
  });

  describe('signToken', () => {
    it('should sign a token with user payload', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      const token = await jwtService.signToken(userPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should sign a token with custom expiry', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      const token = await jwtService.signToken(userPayload, {
        expiresIn: '15m',
      });

      expect(token).toBeDefined();
      const verified = await jwtService.verifyToken(token);
      expect(verified.id).toBe(userPayload.id);
    });

    it('should include platform admin role if present', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
        es_erp_roles: ['PLATFORM_ADMIN'],
      };

      const token = await jwtService.signToken(userPayload);
      const verified = await jwtService.verifyToken(token);

      expect(verified.es_erp_roles).toEqual(['PLATFORM_ADMIN']);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      const token = await jwtService.signToken(userPayload);
      const verified = await jwtService.verifyToken(token);

      expect(verified.id).toBe(userPayload.id);
      expect(verified.companyId).toBe(userPayload.companyId);
      expect(verified.auth0Sub).toBe(userPayload.auth0Sub);
    });

    it('should reject expired tokens', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      // Create token that expires immediately
      const token = await jwtService.signToken(userPayload, {
        expiresIn: '0s',
      });

      // Wait a moment to ensure token expires
      await new Promise((resolve) => setTimeout(resolve, 100));

      await expect(jwtService.verifyToken(token)).rejects.toThrow();
    });

    it('should reject tokens with invalid signature', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      const token = await jwtService.signToken(userPayload);
      // Tamper with the token
      const parts = token.split('.');
      parts[2] = parts[2].slice(0, -5) + 'xxxxx';
      const tamperedToken = parts.join('.');

      await expect(jwtService.verifyToken(tamperedToken)).rejects.toThrow();
    });
  });

  describe('isSelfSignedToken', () => {
    it('should return true for self-signed tokens', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      const token = await jwtService.signToken(userPayload);
      const isSelfSigned = jwtService.isSelfSignedToken(token);

      expect(isSelfSigned).toBe(true);
    });

    it('should return false for Auth0 tokens', () => {
      const jwtService = createJWTService(envConfig);

      // Mock Auth0 token with different issuer
      const mockAuth0Token =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLmV4YW1wbGUuY29tLyIsInN1YiI6ImF1dGgwfDEyMzQ1NiIsImF1ZCI6ImF1ZGllbmNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';

      const isSelfSigned = jwtService.isSelfSignedToken(mockAuth0Token);

      expect(isSelfSigned).toBe(false);
    });

    it('should return false for invalid tokens', () => {
      const jwtService = createJWTService(envConfig);

      const isSelfSigned = jwtService.isSelfSignedToken('invalid-token');

      expect(isSelfSigned).toBe(false);
    });
  });

  describe('token caching', () => {
    it('should cache keys for performance', async () => {
      const jwtService = createJWTService(envConfig);
      const userPayload: UserAuthPayload = {
        id: 'user-123',
        companyId: 'company-456',
        auth0Sub: 'auth0|123456',
        email: 'test@example.com',
      };

      // Sign multiple tokens - keys should be cached after first use
      const token1 = await jwtService.signToken(userPayload);
      const token2 = await jwtService.signToken(userPayload);

      // Verify both tokens work
      const verified1 = await jwtService.verifyToken(token1);
      const verified2 = await jwtService.verifyToken(token2);

      expect(verified1.id).toBe(userPayload.id);
      expect(verified2.id).toBe(userPayload.id);
    });
  });
});
