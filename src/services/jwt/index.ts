import * as jose from 'jose';
import { UserAuthPayload } from '../../authentication';
import { type EnvConfig } from '../../config';

export interface SignTokenOptions {
  expiresIn?: string;
}

export interface JWTService {
  signToken(
    userPayload: UserAuthPayload,
    options?: SignTokenOptions,
  ): Promise<string>;
  verifyToken(token: string): Promise<UserAuthPayload>;
  isSelfSignedToken(token: string): boolean;
}

const ISSUER = 'es-erp-api';
const AUDIENCE = 'es-erp-api';

class JWTServiceImpl implements JWTService {
  private privateKey: Uint8Array | CryptoKey | null = null;
  private publicKey: Uint8Array | CryptoKey | null = null;
  private envConfig: EnvConfig;

  constructor(envConfig: EnvConfig) {
    this.envConfig = envConfig;
  }

  private async getPrivateKey(): Promise<Uint8Array | CryptoKey> {
    if (this.privateKey) {
      return this.privateKey;
    }

    try {
      // Decode private key - handle both base64-encoded and plain PEM formats
      let privateKeyPem: string;

      if (this.envConfig.JWT_PRIVATE_KEY.startsWith('-----BEGIN')) {
        // Already in PEM format (plain text)
        privateKeyPem = this.envConfig.JWT_PRIVATE_KEY;
      } else {
        // Base64-encoded PEM - decode it
        privateKeyPem = Buffer.from(
          this.envConfig.JWT_PRIVATE_KEY,
          'base64',
        ).toString('utf-8');
      }

      // Validate PEM format
      if (!privateKeyPem.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error(
          'Invalid private key format: must be a valid PKCS#8 PEM string',
        );
      }

      // Import the private key for signing
      this.privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
      return this.privateKey;
    } catch (error) {
      throw new Error(
        `Failed to load JWT private key: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async getPublicKey(): Promise<Uint8Array | CryptoKey> {
    if (this.publicKey) {
      return this.publicKey;
    }

    try {
      // Decode public key - handle both base64-encoded and plain PEM formats
      let publicKeyPem: string;

      if (this.envConfig.JWT_PUBLIC_KEY.startsWith('-----BEGIN')) {
        // Already in PEM format (plain text)
        publicKeyPem = this.envConfig.JWT_PUBLIC_KEY;
      } else {
        // Base64-encoded PEM - decode it
        publicKeyPem = Buffer.from(
          this.envConfig.JWT_PUBLIC_KEY,
          'base64',
        ).toString('utf-8');
      }

      // Validate PEM format
      if (!publicKeyPem.includes('-----BEGIN PUBLIC KEY-----')) {
        throw new Error(
          'Invalid public key format: must be a valid SPKI PEM string',
        );
      }

      // Import the public key for verification
      this.publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
      return this.publicKey;
    } catch (error) {
      throw new Error(
        `Failed to load JWT public key: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async signToken(
    userPayload: UserAuthPayload,
    options?: SignTokenOptions,
  ): Promise<string> {
    const privateKey = await this.getPrivateKey();

    const expiresIn = options?.expiresIn || this.envConfig.JWT_TOKEN_EXPIRY;

    // Create a minimal JWT payload that maps to UserAuthPayload
    const payload = {
      uid: userPayload.id,
      es_company_id: userPayload.companyId,
      sub: userPayload.auth0Sub,
      email: userPayload.email,
      ...(userPayload.es_erp_roles && {
        es_erp_roles: userPayload.es_erp_roles,
      }),
    };

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime(expiresIn)
      .sign(privateKey);

    return jwt;
  }

  async verifyToken(token: string): Promise<UserAuthPayload> {
    const publicKey = await this.getPublicKey();

    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // Map the JWT payload back to UserAuthPayload
    return {
      id: payload.uid as string,
      companyId: payload.es_company_id as string,
      auth0Sub: payload.sub as string,
      email: (payload.email as string) || '',
      es_erp_roles: payload.es_erp_roles as 'PLATFORM_ADMIN'[] | undefined,
    };
  }

  isSelfSignedToken(token: string): boolean {
    try {
      // Decode JWT payload without verifying signature
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = parts[1];
      const padded = payload.padEnd(
        payload.length + ((4 - (payload.length % 4)) % 4),
        '=',
      );
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);

      return parsed.iss === ISSUER;
    } catch {
      return false;
    }
  }
}

// Factory function to create JWT service
export function createJWTService(envConfig: EnvConfig): JWTService {
  return new JWTServiceImpl(envConfig);
}
