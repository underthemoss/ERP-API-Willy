import { generateKeyPairSync } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const KEYS_DIR = join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = join(KEYS_DIR, 'public.pem');

interface JWTKeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Loads existing JWT keys from disk or generates new ones if they don't exist.
 * Keys are stored in the 'keys/' directory (git-ignored) to persist across hot reloads.
 *
 * This is only used in development environments.
 */
export function getOrCreateDevJWTKeys(): JWTKeyPair {
  // Try to load existing keys from disk
  if (existsSync(PRIVATE_KEY_PATH) && existsSync(PUBLIC_KEY_PATH)) {
    try {
      const privateKeyPem = readFileSync(PRIVATE_KEY_PATH, 'utf-8');
      const publicKeyPem = readFileSync(PUBLIC_KEY_PATH, 'utf-8');

      const privateKey = Buffer.from(privateKeyPem).toString('base64');
      const publicKey = Buffer.from(publicKeyPem).toString('base64');

      console.log(
        '✅ JWT keys loaded from disk (keys/private.pem, keys/public.pem)',
      );

      return { privateKey, publicKey };
    } catch (error) {
      console.warn(
        '⚠️  Failed to load JWT keys from disk, generating new ones...',
        error,
      );
      // Fall through to generate new keys
    }
  }

  // Generate new RSA key pair
  const { publicKey: publicKeyPem, privateKey: privateKeyPem } =
    generateKeyPairSync('rsa', {
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

  // Ensure keys directory exists
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true });
  }

  // Save keys to disk
  try {
    writeFileSync(PRIVATE_KEY_PATH, privateKeyPem, 'utf-8');
    writeFileSync(PUBLIC_KEY_PATH, publicKeyPem, 'utf-8');
    console.log(
      '✅ JWT keys generated and saved to disk (keys/private.pem, keys/public.pem)',
    );
  } catch (error) {
    console.warn('⚠️  Failed to save JWT keys to disk:', error);
    // Continue anyway with in-memory keys
  }

  const privateKey = Buffer.from(privateKeyPem).toString('base64');
  const publicKey = Buffer.from(publicKeyPem).toString('base64');

  return { privateKey, publicKey };
}
