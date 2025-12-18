import {
  objectType,
  queryField,
  mutationField,
  stringArg,
  nonNull,
  arg,
  inputObjectType,
  list,
  enumType,
  intArg,
} from 'nexus';

import { ListTemplatesQuery } from '../../services/reference-numbers';

export const ReferenceNumberType = enumType({
  name: 'ReferenceNumberType',
  members: ['PO', 'SO', 'INVOICE'],
});

export const ResetFrequency = enumType({
  name: 'ResetFrequency',
  members: ['never', 'yearly', 'monthly', 'daily'],
});

export const ReferenceNumberTemplate = objectType({
  name: 'ReferenceNumberTemplate',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('workspaceId');
    t.string('companyId', {
      deprecation: 'Use workspaceId instead',
      resolve: (template, args, ctx) => ctx.user?.companyId || '',
    });
    t.nonNull.field('type', { type: 'ReferenceNumberType' });
    t.nonNull.string('template'); // e.g. 'PO-{YY}-{seq}', supports: YY, YYYY, MM, DD, seq, projectCode, parentProjectCode
    t.int('seqPadding');
    t.int('startAt');
    t.nonNull.field('resetFrequency', { type: 'ResetFrequency' });
    t.nonNull.boolean('useGlobalSequence');
    t.nonNull.string('createdBy');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('updatedBy');
    t.string('businessContactId');
    t.string('projectId');
    t.nonNull.boolean('deleted');

    // Resolve related entities
    t.field('createdByUser', {
      type: 'User',
      async resolve(template, _args, ctx) {
        if (!template.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(template.createdBy);
      },
    });

    t.field('updatedByUser', {
      type: 'User',
      async resolve(template, _args, ctx) {
        if (!template.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(template.updatedBy);
      },
    });

    t.field('project', {
      type: 'Project',
      async resolve(template, _args, ctx) {
        if (!template.projectId) return null;
        return ctx.dataloaders.projects.getProjectsById.load(
          template.projectId,
        );
      },
    });

    t.field('businessContact', {
      type: 'Contact',
      async resolve(template, _args, ctx) {
        if (!template.businessContactId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(
          template.businessContactId,
        );
      },
    });
  },
});

export const SequenceNumber = objectType({
  name: 'SequenceNumber',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('workspaceId');
    t.string('companyId', {
      deprecation: 'Use workspaceId instead',
      resolve: (sequence, args, ctx) => ctx.user?.companyId || '',
    });
    t.nonNull.field('type', { type: 'ReferenceNumberType' });
    t.string('templateId');
    t.nonNull.int('value');
    t.nonNull.string('createdBy');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('updatedBy');
    t.nonNull.boolean('deleted');

    t.field('template', {
      type: 'ReferenceNumberTemplate',
      async resolve(sequence, _args, ctx) {
        if (!sequence.templateId) return null;

        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.referenceNumberService.getTemplateById(
          sequence.templateId,
          ctx.user,
        );
      },
    });
  },
});

export const GenerateReferenceNumberResult = objectType({
  name: 'GenerateReferenceNumberResult',
  definition(t) {
    t.nonNull.string('referenceNumber');
    t.nonNull.field('templateUsed', { type: 'ReferenceNumberTemplate' });
    t.nonNull.int('sequenceNumber');
  },
});

// Input Types
export const CreateReferenceNumberTemplateInput = inputObjectType({
  name: 'CreateReferenceNumberTemplateInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.field('type', { type: 'ReferenceNumberType' });
    t.nonNull.string('template'); // e.g. 'PO-{YY}-{seq}', supports: YY, YYYY, MM, DD, seq, projectCode, parentProjectCode
    t.int('seqPadding');
    t.int('startAt');
    t.nonNull.field('resetFrequency', { type: 'ResetFrequency' });
    t.nonNull.boolean('useGlobalSequence');
    t.string('businessContactId');
    t.string('projectId');
  },
});

export const UpdateReferenceNumberTemplateInput = inputObjectType({
  name: 'UpdateReferenceNumberTemplateInput',
  definition(t) {
    t.nonNull.string('id');
    t.field('type', { type: 'ReferenceNumberType' });
    t.string('template'); // e.g. 'PO-{YY}-{seq}', supports: YY, YYYY, MM, DD, seq, projectCode, parentProjectCode
    t.int('seqPadding');
    t.int('startAt');
    t.field('resetFrequency', { type: 'ResetFrequency' });
    t.boolean('useGlobalSequence');
    t.string('businessContactId');
    t.string('projectId');
  },
});

export const ReferenceNumberTemplateFilterInput = inputObjectType({
  name: 'ReferenceNumberTemplateFilterInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.field('type', { type: 'ReferenceNumberType' });
    t.string('projectId');
    t.string('businessContactId');
  },
});

export const GenerateReferenceNumberInput = inputObjectType({
  name: 'GenerateReferenceNumberInput',
  definition(t) {
    t.string('projectCode');
    t.string('parentProjectCode');
    t.nonNull.string('templateId');
  },
});

// Queries
export const listReferenceNumberTemplates = queryField(
  'listReferenceNumberTemplates',
  {
    type: nonNull(list(nonNull('ReferenceNumberTemplate'))),
    args: {
      filter: nonNull(arg({ type: 'ReferenceNumberTemplateFilterInput' })),
      page: arg({ type: 'PageInfoInput' }),
    },
    async resolve(_root, args, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      const filter: ListTemplatesQuery['filter'] = {
        workspaceId: args.filter?.workspaceId,
      };

      if (args.filter?.type) {
        filter.type = args.filter.type;
      }
      if (args.filter?.projectId) {
        filter.projectId = args.filter.projectId;
      }
      if (args.filter?.businessContactId) {
        filter.businessContactId = args.filter.businessContactId;
      }

      return ctx.services.referenceNumberService.listTemplates(
        {
          filter,
          page: {
            size: args.page?.size || undefined,
            number: args.page?.number || undefined,
          },
        },
        ctx.user,
      );
    },
  },
);

export const getReferenceNumberTemplate = queryField(
  'getReferenceNumberTemplate',
  {
    type: 'ReferenceNumberTemplate',
    args: {
      id: nonNull(stringArg()),
    },
    async resolve(_root, args, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      return ctx.services.referenceNumberService.getTemplateById(
        args.id,
        ctx.user,
      );
    },
  },
);

export const getCurrentSequenceNumber = queryField('getCurrentSequenceNumber', {
  type: nonNull('Int'),
  args: {
    workspaceId: nonNull(stringArg()),
    type: nonNull(arg({ type: 'ReferenceNumberType' })),
    templateId: nonNull(stringArg()),
  },
  async resolve(_root, args, ctx) {
    if (!ctx.user) {
      throw new Error('Unauthorized');
    }
    return ctx.services.referenceNumberService.getCurrentSequenceNumber(
      args.workspaceId,
      args.templateId,
      ctx.user,
    );
  },
});

export const getDefaultTemplates = queryField('getDefaultTemplates', {
  args: {
    workspaceId: nonNull(stringArg()),
  },
  type: nonNull(list(nonNull('ReferenceNumberTemplate'))),
  async resolve(_root, args, ctx) {
    if (!ctx.user) {
      throw new Error('Unauthorized');
    }

    const types: Array<'PO' | 'SO' | 'INVOICE'> = ['PO', 'SO', 'INVOICE'];
    const defaultTemplates = await Promise.all(
      types.map((type) =>
        ctx.services.referenceNumberService.getOrCreateDefaultTemplate(
          args.workspaceId,
          type,
          ctx.user!,
        ),
      ),
    );

    return defaultTemplates;
  },
});

// Mutations
export const createReferenceNumberTemplate = mutationField(
  'createReferenceNumberTemplate',
  {
    type: 'ReferenceNumberTemplate',
    args: {
      input: nonNull(arg({ type: 'CreateReferenceNumberTemplateInput' })),
    },
    async resolve(_root, { input }, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      const templateInput = {
        ...input,
        workspaceId: input.workspaceId,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
        deleted: false,
        businessContactId: input.businessContactId || undefined,
        projectId: input.projectId || undefined,
        seqPadding: input.seqPadding || undefined,
        startAt: input.startAt || undefined,
      };

      return ctx.services.referenceNumberService.createTemplate(
        templateInput,
        ctx.user,
      );
    },
  },
);

export const updateReferenceNumberTemplate = mutationField(
  'updateReferenceNumberTemplate',
  {
    type: 'ReferenceNumberTemplate',
    args: {
      input: nonNull(arg({ type: 'UpdateReferenceNumberTemplateInput' })),
    },
    async resolve(_root, { input }, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      // Get the existing template to get the createdBy field
      const existingTemplate =
        await ctx.services.referenceNumberService.getTemplateById(
          input.id,
          ctx.user,
        );
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updateInput = {
        ...input,
        workspaceId: existingTemplate.workspaceId,
        createdBy: existingTemplate.createdBy,
        updatedBy: ctx.user.id,
        deleted: false,
        businessContactId: input.businessContactId || undefined,
        projectId: input.projectId || undefined,
        seqPadding: input.seqPadding || undefined,
        startAt: input.startAt || undefined,
        resetFrequency: input.resetFrequency || existingTemplate.resetFrequency,
        useGlobalSequence:
          input.useGlobalSequence !== null &&
          input.useGlobalSequence !== undefined
            ? input.useGlobalSequence
            : existingTemplate.useGlobalSequence,
        type: input.type || existingTemplate.type,
        template: input.template || existingTemplate.template,
      };

      return ctx.services.referenceNumberService.updateTemplate(
        updateInput,
        ctx.user,
      );
    },
  },
);

export const deleteReferenceNumberTemplate = mutationField(
  'deleteReferenceNumberTemplate',
  {
    type: 'Boolean',
    args: {
      id: nonNull(stringArg()),
    },
    async resolve(_root, { id }, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      await ctx.services.referenceNumberService.deleteTemplate(id, ctx.user);
      return true;
    },
  },
);

export const resetSequenceNumber = mutationField('resetSequenceNumber', {
  type: 'Boolean',
  args: {
    templateId: nonNull(stringArg()),
    newValue: intArg({ default: 1 }),
  },
  async resolve(_root, { templateId, newValue }, ctx) {
    if (!ctx.user?.id) {
      throw new Error('Missing user_id in user context');
    }

    await ctx.services.referenceNumberService.resetSequenceNumber(
      templateId,
      newValue || 1,
      ctx.user,
    );
    return true;
  },
});

export const generateReferenceNumber = mutationField(
  'generateReferenceNumber',
  {
    type: 'GenerateReferenceNumberResult',
    args: {
      input: nonNull(arg({ type: 'GenerateReferenceNumberInput' })),
    },
    async resolve(_root, { input }, ctx) {
      if (!ctx.user) {
        throw new Error('Unauthorized');
      }

      const cleanInput = {
        templateId: input.templateId,
        projectCode: input.projectCode || undefined,
        parentProjectCode: input.parentProjectCode || undefined,
      };

      return ctx.services.referenceNumberService.generateNextReferenceNumber(
        cleanInput,
        ctx.user,
      );
    },
  },
);
