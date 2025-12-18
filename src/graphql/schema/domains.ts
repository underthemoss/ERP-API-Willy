import { extendType, objectType, nonNull, stringArg } from 'nexus';

export const ValidEnterpriseDomainResult = objectType({
  name: 'ValidEnterpriseDomainResult',
  definition(t) {
    t.nonNull.boolean('isValid');
    t.nonNull.string('domain');
    t.string('reason');
  },
});

export const DomainQueries = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('validEnterpriseDomain', {
      type: ValidEnterpriseDomainResult,
      args: {
        domain: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        // Validate the domain
        const result = ctx.services.domainsService.isValidEnterpriseDomain(
          args.domain,
        );
        return result;
      },
    });
  },
});
