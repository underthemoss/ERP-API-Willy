import { createHmac } from 'crypto';
import { validateHMACSignature, generateHMACSignature } from '../utils/hmac';
import { FastifyRequest } from 'fastify';
import { HMACConfig } from '../types';
import { v4 } from 'uuid';

describe('HMAC Validation with Raw Body', () => {
  const testSecret = 'test-secret-key-that-is-at-least-32-characters-long';
  const config: HMACConfig = {
    secret: testSecret,
    algorithm: 'sha256',
    headerName: 'x-webhook-signature',
  };

  describe('Auth0 webhook signature validation', () => {
    it('should validate signature with raw body matching Auth0 format', () => {
      // Simulate the exact payload Auth0 would send
      const payload = {
        user_id: 'auth0|123456789',
        email: 'john.doe@example.com',
        email_verified: true,
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        nickname: 'johndoe',
        picture: 'https://example.com/picture.jpg',
        company_id: 'company-456',
        es_user_id: 'es-user-789',
        timestamp: '2025-01-08T12:00:00.000Z',
        event_type: 'post_login',
        connection: 'Username-Password-Authentication',
        connection_id: 'con_123456',
        client_id: 'client_abc123',
        client_name: 'My Application',
        session_id: 'session_xyz789',
        ip: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      };

      // Generate the raw body string (exactly as it would be sent)
      const rawBody = JSON.stringify(payload);

      // Generate signature the way Auth0 would (raw hex, no prefix)
      const hmac = createHmac('sha256', testSecret);
      hmac.update(rawBody);
      const signature = hmac.digest('hex');

      // Create mock request with raw body stored
      const request = {
        headers: {
          'x-webhook-signature': signature, // Auth0 sends raw hex
        },
        rawBody, // This is stored by preParsing hook
        body: payload, // Parsed body (not used for validation)
      } as unknown as FastifyRequest;

      // Validate the signature
      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(true);
    });

    it('should reject signature when raw body does not match', () => {
      const payload = {
        user_id: 'auth0|123456789',
        email: 'john.doe@example.com',
        email_verified: true,
        timestamp: '2025-01-08T12:00:00.000Z',
        event_type: 'post_login',
      };

      const rawBody = JSON.stringify(payload);

      // Generate signature with correct secret
      const hmac = createHmac('sha256', testSecret);
      hmac.update(rawBody);
      const signature = hmac.digest('hex');

      // Modify the raw body after signature generation
      const modifiedPayload = { ...payload, email: 'different@example.com' };
      const modifiedRawBody = JSON.stringify(modifiedPayload);

      const request = {
        headers: {
          'x-webhook-signature': signature,
        },
        rawBody: modifiedRawBody, // Different raw body
        body: modifiedPayload,
      } as unknown as FastifyRequest;

      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(false);
    });

    it('should reject when signature header is missing', () => {
      const request = {
        headers: {},
        rawBody: '{"test":"data"}',
        body: { test: 'data' },
      } as unknown as FastifyRequest;

      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(false);
    });

    it('should reject when raw body is missing', () => {
      const request = {
        headers: {
          'x-webhook-signature': 'some-signature',
        },
        body: { test: 'data' },
        // rawBody is missing
      } as unknown as FastifyRequest;

      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(false);
    });

    it('should reject invalid signature', () => {
      const payload = {
        user_id: 'auth0|123456789',
        email: 'john.doe@example.com',
      };

      const rawBody = JSON.stringify(payload);

      const request = {
        headers: {
          'x-webhook-signature': 'invalid-signature-hex',
        },
        rawBody,
        body: payload,
      } as unknown as FastifyRequest;

      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(false);
    });

    it('should throw error if secret is too short', () => {
      const shortSecretConfig: HMACConfig = {
        secret: 'short-secret',
        algorithm: 'sha256',
        headerName: 'x-webhook-signature',
      };

      const request = {
        headers: {
          'x-webhook-signature': 'some-signature',
        },
        rawBody: '{"test":"data"}',
        body: { test: 'data' },
      } as unknown as FastifyRequest;

      expect(() => validateHMACSignature(request, shortSecretConfig)).toThrow(
        'HMAC secret must be at least 32 characters for security',
      );
    });
  });

  describe('Signature generation for testing', () => {
    it('should generate correct signature format for Auth0', () => {
      const payload = {
        user_id: 'auth0|123',
        email: `${v4()}@example.com`,
        timestamp: '2025-01-08T12:00:00.000Z',
      };

      const signature = generateHMACSignature(payload, config);

      // Should be raw hex (64 characters for sha256)
      expect(signature).toMatch(/^[a-f0-9]{64}$/);

      // Verify it can be validated
      const request = {
        headers: {
          'x-webhook-signature': signature,
        },
        rawBody: JSON.stringify(payload),
        body: payload,
      } as unknown as FastifyRequest;

      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(true);
    });
  });

  describe('Real-world scenario', () => {
    it('should handle Auth0 webhook with all fields populated', () => {
      // This simulates a real Auth0 webhook payload
      const auth0Payload = {
        user_id: 'auth0|507f1f77bcf86cd799439011',
        email: 'user@equipmentshare.com',
        email_verified: true,
        name: 'John Smith',
        given_name: 'John',
        family_name: 'Smith',
        nickname: 'jsmith',
        picture: 'https://s.gravatar.com/avatar/123456789',
        company_id: 'ES-COMPANY-123',
        es_user_id: 'ES-USER-456',
        timestamp: new Date().toISOString(),
        event_type: 'post_login',
        connection: 'Username-Password-Authentication',
        connection_id: 'con_AbCdEfGhIjKlMnOp',
        client_id: 'qwertyuiopasdfghjklzxcvbnm123456',
        client_name: 'ES ERP Application',
        session_id: 'sess_1234567890abcdef',
        ip: '10.0.0.1',
        user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        user_metadata: {
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        app_metadata: {
          roles: ['admin', 'user'],
          permissions: ['read:all', 'write:all'],
        },
      };

      // Generate raw body exactly as Auth0 would send it
      const rawBody = JSON.stringify(auth0Payload);

      // Generate HMAC signature as Auth0 would
      const hmac = createHmac('sha256', testSecret);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest('hex');

      // Create request as Fastify would after preParsing hook
      const request = {
        headers: {
          'x-webhook-signature': expectedSignature,
          'x-webhook-timestamp': auth0Payload.timestamp,
          'content-type': 'application/json',
          'user-agent': 'Auth0-Action/1.0',
        },
        rawBody, // Captured by preParsing hook
        body: auth0Payload, // Parsed by Fastify
      } as unknown as FastifyRequest;

      // Validate the signature
      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(true);
    });

    it('should detect tampering in Auth0 webhook', () => {
      const auth0Payload = {
        user_id: 'auth0|507f1f77bcf86cd799439011',
        email: 'user@equipmentshare.com',
        email_verified: true,
        company_id: 'ES-COMPANY-123',
        es_user_id: 'ES-USER-456',
        timestamp: new Date().toISOString(),
        event_type: 'post_login',
      };

      // Generate signature for original payload
      const originalRawBody = JSON.stringify(auth0Payload);
      const hmac = createHmac('sha256', testSecret);
      hmac.update(originalRawBody);
      const signature = hmac.digest('hex');

      // Tamper with the payload (e.g., change company_id)
      const tamperedPayload = {
        ...auth0Payload,
        company_id: 'MALICIOUS-COMPANY-999', // Attempted injection
      };
      const tamperedRawBody = JSON.stringify(tamperedPayload);

      const request = {
        headers: {
          'x-webhook-signature': signature, // Original signature
        },
        rawBody: tamperedRawBody, // Tampered body
        body: tamperedPayload,
      } as unknown as FastifyRequest;

      // Should reject tampered payload
      const isValid = validateHMACSignature(request, config);
      expect(isValid).toBe(false);
    });
  });
});
