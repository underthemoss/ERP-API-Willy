import sgMail from '@sendgrid/mail';
import { MongoClient } from 'mongodb';
import { EnvConfig } from '../../config';
import { logger } from '../../lib/logger';
import {
  TemplateOptions,
  createEmailTemplate,
  createPlainTextFromTemplate,
} from './templates';
import { EmailModel, EmailInput, createEmailModel } from './model';
import { UserAuthPayload } from '../../authentication';

export interface EmailAttachment {
  content: string; // base64 encoded
  filename: string;
  type: string;
  disposition: 'attachment' | 'inline';
}

export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  workspaceId?: string;
  companyId?: string;
  user?: UserAuthPayload;
}

export interface TemplatedEmailOptions {
  to: string;
  from: string;
  subject: string;
  title: string;
  subtitle?: string;
  content: string;
  primaryCTA?: {
    text: string;
    url: string;
  };
  secondaryCTA?: {
    text: string;
    url: string;
  };
  bannerImgUrl?: string;
  iconUrl?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  workspaceId?: string;
  companyId?: string;
  user?: UserAuthPayload;
}

export class EmailService {
  private emailModel: EmailModel;

  constructor(
    private config: EnvConfig,
    emailModel: EmailModel,
  ) {
    if (config.SENDGRID_API_KEY) {
      sgMail.setApiKey(config.SENDGRID_API_KEY);
    }
    this.emailModel = emailModel;
  }

  private isEmailAllowed(email: string): boolean {
    // In dev or stage, only allow @equipmentshare.com emails
    if (this.config.LEVEL === 'dev' || this.config.LEVEL === 'stage') {
      if (!email.toLowerCase().endsWith('@equipmentshare.com')) {
        logger.warn('Email blocked in non-production environment', {
          blockedEmail: email,
          environment: this.config.LEVEL,
        });
        return false;
      }
    }
    return true;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // Check if recipient is allowed based on environment
    if (!this.isEmailAllowed(options.to)) {
      logger.warn('Email not sent - recipient blocked', {
        to: options.to,
        subject: options.subject,
        environment: this.config.LEVEL,
      });
      return;
    }

    // Try to create email record in database, but be tolerant of missing fields
    let emailId: string | undefined;
    logger.info(options, 'Preparing to send email');
    try {
      // Only attempt to save if we have at least the basic required fields
      if (options.to && options.from && options.subject) {
        const emailInput: EmailInput = {
          // Use defaults for missing workspace/company/user context
          workspaceId: options.workspaceId || 'unknown',
          companyId: options.companyId || 'unknown',
          to: options.to,
          from: options.from,
          subject: options.subject,
          htmlContent: options.html,
          plainContent: options.text,
          replyTo: options.replyTo,
          status: 'pending',
          createdBy: options.user?.id || 'system',
          updatedBy: options.user?.id || 'system',
          updatedAt: new Date(),
        };

        const email = await this.emailModel.createEmail(emailInput);
        emailId = email.id;

        logger.info('Email record created', {
          emailId,
          to: options.to,
          subject: options.subject,
        });
      }
    } catch (error) {
      // Log error but ALWAYS continue with sending email
      // MongoDB write failures should never prevent email delivery
      logger.error(
        'Failed to create email record, but continuing with email send',
        {
          error,
          to: options.to,
          subject: options.subject,
          workspaceId: options.workspaceId,
          companyId: options.companyId,
        },
      );
    }

    const msg: any = {
      to: options.to,
      from: options.from,
      subject: options.subject,
    };

    // Add content - prefer HTML over text
    if (options.html) {
      msg.html = options.html;
      if (options.text) msg.text = options.text;
    } else if (options.text) {
      msg.text = options.text;
    } else {
      msg.text = '';
    }

    // Add optional fields
    if (options.replyTo) msg.replyTo = options.replyTo;
    if (options.attachments && options.attachments.length > 0) {
      msg.attachments = options.attachments;
    }

    try {
      const [response] = await sgMail.send(msg);

      // Extract message ID from SendGrid response
      const msgId =
        response.headers['x-message-id'] ||
        response.headers['X-Message-Id'] ||
        response.headers['x-messageid'];

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        msgId,
      });

      // Update email record with SendGrid message ID
      if (emailId && msgId) {
        try {
          await this.emailModel.updateEmailWithSendGridResponse(
            emailId,
            msgId,
            'sent',
          );
          logger.info('Email record updated with SendGrid response', {
            emailId,
            msgId,
          });
        } catch (error) {
          logger.error('Failed to update email record', {
            error,
            emailId,
            msgId,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        to: options.to,
        subject: options.subject,
      });

      // Update email record with failure status
      if (emailId) {
        try {
          await this.emailModel.updateEmailWithSendGridResponse(
            emailId,
            '',
            'failed',
            error instanceof Error ? error.message : 'Unknown error',
          );
        } catch (updateError) {
          logger.error('Failed to update email record with failure', {
            error: updateError,
            emailId,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Generate a preview of the templated email HTML without sending it
   * @param options - The template options for generating the preview
   * @returns The generated HTML string
   */
  previewTemplatedEmail(
    options: Omit<
      TemplatedEmailOptions,
      | 'to'
      | 'from'
      | 'subject'
      | 'replyTo'
      | 'workspaceId'
      | 'companyId'
      | 'user'
    >,
  ): string {
    // Create the template options
    const templateOptions: TemplateOptions = {
      title: options.title,
      subtitle: options.subtitle,
      content: options.content,
      primaryCTA: options.primaryCTA,
      secondaryCTA: options.secondaryCTA,
      bannerImgUrl: options.bannerImgUrl,
      iconUrl: options.iconUrl,
    };

    // Generate and return HTML
    return createEmailTemplate(templateOptions);
  }

  /**
   * Send an email wrapped in a professional HTML template
   * @param options - The templated email options including title, content, and CTAs
   */
  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<void> {
    // Create the template options
    const templateOptions: TemplateOptions = {
      title: options.title,
      subtitle: options.subtitle,
      content: options.content,
      primaryCTA: options.primaryCTA,
      secondaryCTA: options.secondaryCTA,
      bannerImgUrl: options.bannerImgUrl,
      iconUrl: options.iconUrl,
    };

    // Generate HTML and plain text versions
    const html = createEmailTemplate(templateOptions);
    const text = createPlainTextFromTemplate(templateOptions);

    // Send the email using the existing sendEmail method
    await this.sendEmail({
      to: options.to,
      from: options.from,
      subject: options.subject,
      html,
      text,
      replyTo: options.replyTo,
      attachments: options.attachments,
      workspaceId: options.workspaceId,
      companyId: options.companyId,
      user: options.user,
    });
  }
}

export function createEmailService(
  config: EnvConfig,
  mongoClient: MongoClient,
): EmailService {
  const emailModel = createEmailModel({ mongoClient });
  return new EmailService(config, emailModel);
}
