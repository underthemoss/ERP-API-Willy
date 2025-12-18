import { createHmac } from 'crypto';
import { FastifyRequest } from 'fastify';
import { HMACConfig } from '../types';

/**
 * Validates HMAC signature for webhook requests
 * Matches Auth0's webhook signature format
 */
export function validateHMACSignature(
  request: FastifyRequest,
  config: HMACConfig,
): boolean {
  const algorithm = config.algorithm || 'sha256';
  const headerName = config.headerName || 'x-webhook-signature';

  // Get the signature from the request header (Auth0 sends raw hex, not prefixed)
  const receivedSignature = request.headers[headerName] as string;

  if (!receivedSignature) {
    return false;
  }

  // Get the raw body (stored by preParsing hook)
  const rawBody = (request as any).rawBody;

  if (!rawBody) {
    // Fallback for testing or when raw body is not available
    return false;
  }

  // Validate HMAC secret meets minimum requirements
  if (config.secret.length < 32) {
    throw new Error('HMAC secret must be at least 32 characters for security');
  }

  // Calculate the expected signature
  const hmac = createHmac(algorithm, config.secret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(receivedSignature, expectedSignature);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generates an HMAC signature for testing purposes
 * Returns raw hex to match Auth0's format
 */
export function generateHMACSignature(body: any, config: HMACConfig): string {
  const algorithm = config.algorithm || 'sha256';
  const rawBody = JSON.stringify(body);

  const hmac = createHmac(algorithm, config.secret);
  hmac.update(rawBody);
  return hmac.digest('hex');
}
