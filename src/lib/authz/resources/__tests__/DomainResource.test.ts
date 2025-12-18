import { DomainResource } from '../DomainResource';

describe('DomainResource', () => {
  describe('extractDomainFromEmail', () => {
    it('should extract domain from valid email', () => {
      expect(
        DomainResource.extractDomainFromEmail('user@equipmentshare.com'),
      ).toBe('equipmentshare.com');
      expect(DomainResource.extractDomainFromEmail('admin@example.org')).toBe(
        'example.org',
      );
      expect(DomainResource.extractDomainFromEmail('test@sub.domain.com')).toBe(
        'sub.domain.com',
      );
    });

    it('should handle invalid emails', () => {
      expect(DomainResource.extractDomainFromEmail('')).toBeNull();
      expect(DomainResource.extractDomainFromEmail('notanemail')).toBeNull();
      expect(DomainResource.extractDomainFromEmail('@domain.com')).toBeNull();
      expect(DomainResource.extractDomainFromEmail('user@')).toBeNull();
      expect(
        DomainResource.extractDomainFromEmail('user@@domain.com'),
      ).toBeNull();
    });

    it('should normalize domain to lowercase', () => {
      expect(
        DomainResource.extractDomainFromEmail('user@EQUIPMENTSHARE.COM'),
      ).toBe('equipmentshare.com');
      expect(DomainResource.extractDomainFromEmail('user@Example.Com')).toBe(
        'example.com',
      );
    });

    it('should handle emails with special characters', () => {
      expect(DomainResource.extractDomainFromEmail('user+tag@domain.com')).toBe(
        'domain.com',
      );
      expect(
        DomainResource.extractDomainFromEmail('user.name@domain.com'),
      ).toBe('domain.com');
      expect(
        DomainResource.extractDomainFromEmail('user_name@domain.com'),
      ).toBe('domain.com');
    });
  });

  describe('isPersonalEmailDomain', () => {
    it('should identify personal email domains', () => {
      expect(DomainResource.isPersonalEmailDomain('gmail.com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('yahoo.com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('outlook.com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('hotmail.com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('icloud.com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('protonmail.com')).toBe(true);
    });

    it('should identify corporate email domains', () => {
      expect(DomainResource.isPersonalEmailDomain('equipmentshare.com')).toBe(
        false,
      );
      expect(DomainResource.isPersonalEmailDomain('example.com')).toBe(false);
      expect(DomainResource.isPersonalEmailDomain('company.org')).toBe(false);
      expect(DomainResource.isPersonalEmailDomain('enterprise.net')).toBe(
        false,
      );
    });

    it('should be case insensitive', () => {
      expect(DomainResource.isPersonalEmailDomain('GMAIL.COM')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('Gmail.Com')).toBe(true);
      expect(DomainResource.isPersonalEmailDomain('EQUIPMENTSHARE.COM')).toBe(
        false,
      );
    });

    it('should handle edge cases', () => {
      expect(DomainResource.isPersonalEmailDomain('')).toBe(false);
      expect(DomainResource.isPersonalEmailDomain('gmail')).toBe(false);
      expect(DomainResource.isPersonalEmailDomain('.com')).toBe(false);
    });
  });
});
