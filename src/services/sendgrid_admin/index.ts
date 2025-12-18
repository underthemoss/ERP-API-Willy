import client from '@sendgrid/client';
import { MongoClient } from 'mongodb';
import { type AuthZ } from '../../lib/authz';
import { type EnvConfig } from '../../config';
import { UserAuthPayload } from '../../authentication';
import { logger } from '../../lib/logger';
import { EmailActivity, GetEmailActivityInput, EmailDetails } from './types';
import { EmailModel, createEmailModel } from '../email/model';

export class SendGridAdminService {
  private authZ: AuthZ;
  private envConfig: EnvConfig;
  private emailModel: EmailModel;

  constructor(config: {
    envConfig: EnvConfig;
    authZ: AuthZ;
    emailModel: EmailModel;
  }) {
    this.authZ = config.authZ;
    this.envConfig = config.envConfig;
    this.emailModel = config.emailModel;

    if (config.envConfig.SENDGRID_API_KEY) {
      client.setApiKey(config.envConfig.SENDGRID_API_KEY);
    }
  }

  /**
   * Check if user has admin permissions
   */
  private checkAdminPermissions(user?: UserAuthPayload): void {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.authZ.isERPAdmin(user)) {
      throw new Error('Insufficient permissions: Admin access required');
    }
  }

  /**
   * Get recent email activity from MongoDB
   * Requires admin permissions
   */
  async getEmailActivity(
    input: GetEmailActivityInput,
    user?: UserAuthPayload,
  ): Promise<EmailActivity[]> {
    this.checkAdminPermissions(user);

    try {
      // Build filters based on the query parameter
      const filters: any = {};

      if (input.query) {
        // Support searching by email address or subject
        // Using regex for partial matching
        const searchRegex = new RegExp(input.query, 'i');
        filters.$or = [
          { to: searchRegex },
          { from: searchRegex },
          { subject: searchRegex },
        ];
      }

      // If msgId is provided, filter by it
      if (input.msgId) {
        filters.msgId = input.msgId;
      }

      // Fetch emails from MongoDB
      const emails = await this.emailModel.listEmails({
        filter: filters,
        page: {
          size: input.limit || 50,
          number: 1,
        },
        sort: {
          field: 'createdAt',
          order: 'desc',
        },
      });

      // Map the emails to EmailActivity format
      return emails.map((email) => ({
        msgId: email.msgId || email.id,
        email: email.to,
        fromEmail: email.from,
        subject: email.subject,
        event: email.status,
        timestamp: email.sentAt
          ? email.sentAt.getTime() / 1000
          : email.createdAt.getTime() / 1000,
        status: email.status,
        opens: 0, // We don't track opens in our database yet
        clicks: 0, // We don't track clicks in our database yet
        htmlContent: email.htmlContent,
        plainContent: email.plainContent,
      }));
    } catch (error: any) {
      logger.error('Failed to get email activity from database', { error });
      throw new Error(`Failed to get email activity: ${error.message}`);
    }
  }

  /**
   * Get email details including content
   * Combines data from MongoDB with authoritative status from SendGrid
   * Requires admin permissions
   */
  async getEmailDetails(
    msgId: string,
    user?: UserAuthPayload,
  ): Promise<EmailDetails | null> {
    this.checkAdminPermissions(user);

    let emailFromDb = null;
    let sendGridStatus = null;

    // First try to get from database
    try {
      emailFromDb = await this.emailModel.getEmailByMsgId(msgId);
    } catch (error) {
      logger.warn('Failed to get email from database', {
        error,
        msgId,
      });
    }

    // Always try to get the latest status from SendGrid if we have the msgId
    if (msgId) {
      try {
        const messagesRequest: any = {
          method: 'GET',
          url: '/v3/messages',
          qs: {
            msg_id: msgId,
            limit: 1,
          },
        };

        const [messagesResponse] = await client.request(messagesRequest);
        const messagesBody = messagesResponse.body as any;
        const messages = messagesBody.messages || [];

        if (messages.length > 0) {
          const message = messages[0];
          sendGridStatus = {
            status: message.status,
            timestamp: new Date(message.last_event_time).getTime() / 1000,
            opens: message.opens_count || 0,
            clicks: message.clicks_count || 0,
          };

          // If we don't have the email in DB, build it from SendGrid data
          if (!emailFromDb) {
            // Try to get the email content from the activity feed
            let emailContent: any = {};
            try {
              const activityRequest: any = {
                method: 'GET',
                url: `/v3/messages/${msgId}`,
              };
              const [activityResponse] = await client.request(activityRequest);
              emailContent = activityResponse.body as any;
            } catch (contentError) {
              logger.warn('Could not retrieve email content from SendGrid', {
                msgId,
                error: contentError,
              });
            }

            return {
              msgId: message.msg_id,
              to: message.to_email,
              from: message.from_email || 'Unknown',
              subject: message.subject || 'No Subject',
              htmlContent: emailContent.html || message.html || undefined,
              plainContent: emailContent.text || message.text || undefined,
              timestamp: sendGridStatus.timestamp,
              status: sendGridStatus.status,
            };
          }
        }
      } catch (error) {
        logger.warn('Failed to get status from SendGrid', {
          error,
          msgId,
        });
      }
    }

    // If we have email from DB, return it with overlaid SendGrid status
    if (emailFromDb) {
      return {
        msgId: emailFromDb.msgId || msgId,
        to: emailFromDb.to,
        from: emailFromDb.from,
        subject: emailFromDb.subject,
        htmlContent: emailFromDb.htmlContent,
        plainContent: emailFromDb.plainContent,
        // Use SendGrid timestamp and status if available, otherwise use DB values
        timestamp:
          sendGridStatus?.timestamp ||
          (emailFromDb.sentAt
            ? emailFromDb.sentAt.getTime() / 1000
            : emailFromDb.createdAt.getTime() / 1000),
        status: sendGridStatus?.status || emailFromDb.status,
      };
    }

    // No data found in either source
    return null;
  }
}

export const createSendGridAdminService = (config: {
  envConfig: EnvConfig;
  authZ: AuthZ;
  mongoClient: MongoClient;
}) => {
  const emailModel = createEmailModel({ mongoClient: config.mongoClient });
  return new SendGridAdminService({
    ...config,
    emailModel,
  });
};
