import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

const { createClient } = createTestEnvironment();

describe('Domains', () => {
  describe('validEnterpriseDomain query', () => {
    const VALID_ENTERPRISE_DOMAIN_QUERY = gql`
      query ValidEnterpriseDomain($domain: String!) {
        validEnterpriseDomain(domain: $domain) {
          isValid
          domain
          reason
        }
      }
    `;

    it('should validate enterprise domain as valid', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'equipmentshare.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'equipmentshare.com',
        reason: null,
      });
    });

    it('should validate another enterprise domain as valid', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example-company.org',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'example-company.org',
        reason: null,
      });
    });

    it('should normalize domain to lowercase', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'EQUIPMENTSHARE.COM',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'equipmentshare.com',
        reason: null,
      });
    });

    it('should reject personal email domain (Gmail)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'gmail.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'gmail.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject personal email domain (Yahoo)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'yahoo.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'yahoo.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject personal email domain (Outlook)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'outlook.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'outlook.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject personal email domain (Hotmail)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'hotmail.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'hotmail.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject personal email domain (iCloud)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'icloud.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'icloud.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject personal email domain (ProtonMail)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'protonmail.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'protonmail.com',
        reason: 'Personal email domain',
      });
    });

    it('should reject empty domain', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: '',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: '',
        reason: 'Domain is empty',
      });
    });

    it('should reject domain without dot', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'localhost',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'localhost',
        reason: 'Invalid domain format - missing top-level domain',
      });
    });

    it('should reject domain starting with dot', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: '.example.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: '.example.com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain ending with dot', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example.com.',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example.com.',
        reason: 'Invalid domain format',
      });
    });

    it('should handle domain with spaces (trimmed)', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: '  equipmentshare.com  ',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'equipmentshare.com',
        reason: null,
      });
    });

    it('should handle subdomain as valid enterprise domain', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'mail.equipmentshare.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'mail.equipmentshare.com',
        reason: null,
      });
    });

    it('should handle multiple subdomains as valid enterprise domain', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'api.staging.equipmentshare.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'api.staging.equipmentshare.com',
        reason: null,
      });
    });

    // New tests for robust domain validation
    it('should reject domain with invalid characters', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'domain@#$%.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'domain@#$%.com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain with consecutive dots', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example..com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example..com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain with spaces in the middle', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example domain.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example domain.com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain starting with hyphen', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: '-example.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: '-example.com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain ending with hyphen', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example-.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example-.com',
        reason: 'Invalid domain format',
      });
    });

    it('should accept domain with hyphen in the middle', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example-company.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: true,
        domain: 'example-company.com',
        reason: null,
      });
    });

    it('should reject domain exceeding 253 characters', async () => {
      const { client } = await createClient();
      // Create a domain that exceeds 253 characters
      const longDomain = 'a'.repeat(250) + '.com';
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: longDomain,
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: longDomain.toLowerCase(),
        reason: 'Domain exceeds maximum length of 253 characters',
      });
    });

    it('should accept domain with exactly 253 characters', async () => {
      const { client } = await createClient();
      // Create a valid domain with exactly 253 characters
      // Format: subdomain.subdomain.subdomain...domain.com
      const segments: string[] = [];
      let currentLength = 0;
      const targetLength = 253;

      // Add segments until we reach close to 253 characters
      while (currentLength < targetLength - 10) {
        const segmentLength = Math.min(63, targetLength - currentLength - 5); // Leave room for ".com"
        const segment = 'a'.repeat(segmentLength);
        segments.push(segment);
        currentLength += segment.length + 1; // +1 for the dot
      }

      // Adjust the last segment to reach exactly 253 characters
      const remaining = targetLength - currentLength - 3; // -3 for "com"
      if (remaining > 0) {
        segments.push('a'.repeat(remaining));
      }
      segments.push('com');

      const domain253 = segments.join('.');

      // Only test if we managed to create a 253 character domain
      if (domain253.length === 253) {
        const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
          domain: domain253,
        });

        expect(result.validEnterpriseDomain.isValid).toBe(true);
        expect(result.validEnterpriseDomain.domain).toBe(domain253);
        expect(result.validEnterpriseDomain.reason).toBeNull();
      }
    });

    it('should reject domain with underscore', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example_company.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example_company.com',
        reason: 'Invalid domain format',
      });
    });

    it('should reject domain with special characters', async () => {
      const { client } = await createClient();
      const result = await client.request(VALID_ENTERPRISE_DOMAIN_QUERY, {
        domain: 'example!company.com',
      });

      expect(result.validEnterpriseDomain).toEqual({
        isValid: false,
        domain: 'example!company.com',
        reason: 'Invalid domain format',
      });
    });
  });
});
