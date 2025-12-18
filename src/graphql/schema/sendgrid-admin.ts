import { objectType, extendType, stringArg, intArg, nonNull } from 'nexus';

// Email Activity Types
export const EmailActivity = objectType({
  name: 'EmailActivity',
  definition(t) {
    t.nonNull.string('msgId');
    t.nonNull.string('email');
    t.string('fromEmail');
    t.string('subject');
    t.nonNull.string('event');
    t.nonNull.float('timestamp');
    t.string('status');
    t.int('opens');
    t.int('clicks');
    t.string('htmlContent');
    t.string('plainContent');
  },
});

export const EmailDetails = objectType({
  name: 'EmailDetails',
  definition(t) {
    t.nonNull.string('msgId');
    t.nonNull.string('to');
    t.nonNull.string('from');
    t.nonNull.string('subject');
    t.string('htmlContent');
    t.string('plainContent');
    t.nonNull.float('timestamp');
    t.nonNull.string('status');
  },
});

// Extend the AdminQueryNamespace with SendGrid queries
export const SendGridAdminQueries = extendType({
  type: 'AdminQueryNamespace',
  definition(t) {
    t.nonNull.list.nonNull.field('sendGridEmailActivity', {
      type: EmailActivity,
      description: 'Get recent SendGrid email activity (Admin only)',
      args: {
        limit: intArg({
          description: 'Maximum number of results',
          default: 50,
        }),
        query: stringArg({ description: 'Query string for filtering' }),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.sendGridAdminService) {
          throw new Error('SendGrid Admin Service not available');
        }

        return ctx.services.sendGridAdminService.getEmailActivity(
          {
            limit: args.limit || undefined,
            query: args.query || undefined,
          },
          ctx.user,
        );
      },
    });

    t.field('sendGridEmailDetails', {
      type: EmailDetails,
      description:
        'Get email details including content by SendGrid message ID (Admin only)',
      args: {
        msgId: nonNull(stringArg({ description: 'SendGrid Message ID' })),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.sendGridAdminService) {
          throw new Error('SendGrid Admin Service not available');
        }

        const details = await ctx.services.sendGridAdminService.getEmailDetails(
          args.msgId,
          ctx.user,
        );
        if (!details) {
          throw new Error('Email not found');
        }

        return details;
      },
    });
  },
});
