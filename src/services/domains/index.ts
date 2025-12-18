import { DomainResource } from '../../lib/authz/resources/DomainResource';
import { logger } from '../../lib/logger';

export interface ValidEnterpriseDomainResult {
  isValid: boolean;
  domain: string;
  reason: string | null;
}

export class DomainsService {
  /**
   * Validates if a domain is a valid enterprise domain (not personal/disposable)
   * @param domain - The domain to validate (e.g., "equipmentshare.com")
   * @returns Validation result with normalized domain and reason if invalid
   */
  isValidEnterpriseDomain(domain: string): ValidEnterpriseDomainResult {
    // Normalize the domain to lowercase and trim whitespace
    const normalizedDomain = domain.toLowerCase().trim();

    // Basic domain validation
    if (!normalizedDomain) {
      return {
        isValid: false,
        domain: normalizedDomain,
        reason: 'Domain is empty',
      };
    }

    // RFC 1035 compliant domain validation
    // - Each label must be 1-63 characters long
    // - Labels can contain letters, numbers, and hyphens
    // - Labels cannot start or end with hyphens
    // - Total domain length cannot exceed 253 characters
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Check domain length (RFC 1035 limits to 253 characters)
    if (normalizedDomain.length > 253) {
      return {
        isValid: false,
        domain: normalizedDomain,
        reason: 'Domain exceeds maximum length of 253 characters',
      };
    }

    // Validate domain format with regex
    if (!domainRegex.test(normalizedDomain)) {
      return {
        isValid: false,
        domain: normalizedDomain,
        reason: 'Invalid domain format',
      };
    }

    // Additional check: domain must have at least one dot (TLD required)
    if (!normalizedDomain.includes('.')) {
      return {
        isValid: false,
        domain: normalizedDomain,
        reason: 'Invalid domain format - missing top-level domain',
      };
    }

    // Check if it's a personal email domain using the existing DomainResource logic
    if (DomainResource.isPersonalEmailDomain(normalizedDomain)) {
      logger.debug({
        msg: 'Domain identified as personal/disposable',
        domain: normalizedDomain,
      });

      return {
        isValid: false,
        domain: normalizedDomain,
        reason: 'Personal email domain',
      };
    }

    // If all checks pass, it's a valid enterprise domain
    logger.debug({
      msg: 'Domain validated as enterprise domain',
      domain: normalizedDomain,
    });

    return {
      isValid: true,
      domain: normalizedDomain,
      reason: null,
    };
  }
}
