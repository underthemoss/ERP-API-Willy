import { Redis } from 'ioredis';
import { AuthzedClient } from '../spiceDB-client';
import {
  ERP_DOMAIN_PERMISSIONS,
  ERP_DOMAIN_RELATIONS,
  ERP_DOMAIN_SUBJECT_PERMISSIONS,
  ERP_DOMAIN_SUBJECT_PERMISSIONS_MAP,
  ERP_DOMAIN_SUBJECT_RELATIONS,
  ERP_DOMAIN_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../spicedb-generated-types';
import { BaseResourceWithCaching } from '../../spicedb-base-resource/BaseResource';
// @ts-ignore - These packages don't have TypeScript definitions
import disposableEmailDomains from 'disposable-email-domains';
// @ts-ignore - These packages don't have TypeScript definitions
import freeEmailDomains from 'free-email-domains';

export class DomainResource extends BaseResourceWithCaching<
  ERP_DOMAIN_RELATIONS,
  ERP_DOMAIN_PERMISSIONS,
  RESOURCE_TYPES,
  ERP_DOMAIN_SUBJECT_RELATIONS,
  ERP_DOMAIN_SUBJECT_PERMISSIONS
> {
  constructor(client: AuthzedClient, redis: Redis) {
    super(
      client,
      redis,
      RESOURCE_TYPES.ERP_DOMAIN,
      ERP_DOMAIN_SUBJECT_RELATIONS_MAP,
      ERP_DOMAIN_SUBJECT_PERMISSIONS_MAP,
    );
  }

  /**
   * Check if an email domain is a personal/public email provider
   * that shouldn't be used for domain-based access control
   */
  static isPersonalEmailDomain(domain: string): boolean {
    const lowerDomain = domain.toLowerCase();

    // Check if it's a disposable/temporary email domain
    if (disposableEmailDomains.includes(lowerDomain)) {
      return true;
    }

    // Check if it's a free email provider (Gmail, Yahoo, etc.)
    if (freeEmailDomains.includes(lowerDomain)) {
      return true;
    }

    return false;
  }

  /**
   * Extract domain from email address
   */
  static extractDomainFromEmail(email: string): string | null {
    if (!email || !email.includes('@')) {
      return null;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
      return null;
    }

    // Check if the part before @ is empty (invalid email)
    if (!parts[0] || !parts[0].trim()) {
      return null;
    }

    const domain = parts[1].toLowerCase().trim();

    // Basic domain validation
    if (!domain || domain.length < 3 || !domain.includes('.')) {
      return null;
    }

    return domain;
  }

  /**
   * Add a user as a member of a domain
   */
  async addUserToDomain(userId: string, emailDomain: string) {
    return this.writeRelation({
      resourceId: emailDomain,
      subjectId: userId,
      relation: ERP_DOMAIN_SUBJECT_RELATIONS.USER_MEMBER,
    });
  }

  /**
   * Check if a user is a member of a domain
   */
  async isUserMemberOfDomain(userId: string, emailDomain: string) {
    return this.hasRelation({
      resourceId: emailDomain,
      subjectId: userId,
      relation: ERP_DOMAIN_SUBJECT_RELATIONS.USER_MEMBER,
    });
  }

  /**
   * Remove a user from a domain
   */
  async removeUserFromDomain(userId: string, emailDomain: string) {
    return this.deleteRelationships({
      resourceId: emailDomain,
      subjectId: userId,
      subjectType: RESOURCE_TYPES.ERP_USER,
      relation: ERP_DOMAIN_SUBJECT_RELATIONS.USER_MEMBER,
    });
  }

  /**
   * List all users in a domain
   */
  async listDomainUsers(emailDomain: string) {
    const relations = await this.listRelations({
      resourceId: emailDomain,
      relation: ERP_DOMAIN_RELATIONS.MEMBER,
      subjectType: RESOURCE_TYPES.ERP_USER,
    });

    return relations.map((rel) => ({
      userId: rel.relationship?.subject?.object?.objectId,
    }));
  }
}
