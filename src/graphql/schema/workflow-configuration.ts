import {
  objectType,
  inputObjectType,
  extendType,
  nonNull,
  arg,
  idArg,
} from 'nexus';
import { PaginationInfo } from './common';

// --- Object Types ---

export const WorkflowColumn = objectType({
  name: 'WorkflowColumn',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.string('colour'); // Optional, #RRGGBB format
  },
});

export const WorkflowConfiguration = objectType({
  name: 'WorkflowConfiguration',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('companyId');
    t.nonNull.string('name');
    t.nonNull.list.nonNull.field('columns', { type: WorkflowColumn });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.field('deletedAt', { type: 'DateTime' });
    t.string('deletedBy');
  },
});

// --- Input Types ---

export const WorkflowColumnInput = inputObjectType({
  name: 'WorkflowColumnInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.string('colour'); // Optional, #RRGGBB format
  },
});

export const CreateWorkflowConfigurationInput = inputObjectType({
  name: 'CreateWorkflowConfigurationInput',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.list.nonNull.field('columns', { type: WorkflowColumnInput });
  },
});

export const UpdateWorkflowConfigurationInput = inputObjectType({
  name: 'UpdateWorkflowConfigurationInput',
  definition(t) {
    t.string('name');
    t.nonNull.list.nonNull.field('columns', { type: WorkflowColumnInput });
  },
});

export const ListWorkflowConfigurationsPage = inputObjectType({
  name: 'ListWorkflowConfigurationsPage',
  definition(t) {
    t.int('number');
    t.int('size');
  },
});

export const ListWorkflowConfigurationsResult = objectType({
  name: 'ListWorkflowConfigurationsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkflowConfiguration });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// --- Queries & Mutations ---

export const WorkflowConfigurationQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getWorkflowConfigurationById', {
      type: WorkflowConfiguration,
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_, { id }, ctx) {
        const config =
          await ctx.services.workflowConfigurationService.getWorkflowConfigurationById(
            id,
            ctx.user,
          );
        return config;
      },
    });

    t.field('listWorkflowConfigurations', {
      type: ListWorkflowConfigurationsResult,
      args: {
        page: arg({ type: ListWorkflowConfigurationsPage }),
      },
      async resolve(_, { page }, ctx) {
        if (!ctx.user || !ctx.user.companyId) {
          throw new Error('Not authorized: missing user or company ID');
        }

        const mergedPage = {
          number: page?.number ?? 1,
          size: page?.size ?? 10,
        };
        const results =
          await ctx.services.workflowConfigurationService.listWorkflowConfigurations(
            {
              filter: {},
              page: mergedPage,
            },
            ctx.user,
          );
        return {
          ...results,
        };
      },
    });
  },
});

export const WorkflowConfigurationMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createWorkflowConfiguration', {
      type: WorkflowConfiguration,
      args: {
        input: nonNull(arg({ type: CreateWorkflowConfigurationInput })),
      },
      async resolve(_, { input }, ctx) {
        if (!ctx.user || !ctx.user.id || !ctx.user.companyId) {
          throw new Error('Not authorized: missing user or user ID');
        }

        const config =
          await ctx.services.workflowConfigurationService.createWorkflowConfiguration(
            {
              companyId: ctx.user.companyId,
              name: input.name,
              columns: input.columns,
              updatedBy: ctx.user.id,
            },
            ctx.user,
          );
        return config;
      },
    });

    t.field('updateWorkflowConfiguration', {
      type: WorkflowConfiguration,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateWorkflowConfigurationInput })),
      },
      async resolve(_, { id, input }, ctx) {
        // Filter out nulls from columns and nested arrays before passing to the service

        const config =
          await ctx.services.workflowConfigurationService.updateWorkflowConfiguration(
            id,
            {
              ...(input.name != null ? { name: input.name } : {}),
              ...(input.columns && { columns: input.columns }),
            },
            ctx.user,
          );
        return config;
      },
    });

    t.field('deleteWorkflowConfigurationById', {
      type: 'Boolean',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_, { id }, ctx) {
        await ctx.services.workflowConfigurationService.deleteWorkflowConfigurationById(
          id,
          ctx.user,
        );
        return true;
      },
    });
  },
});
