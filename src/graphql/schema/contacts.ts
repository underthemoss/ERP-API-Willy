import {
  extendType,
  objectType,
  unionType,
  inputObjectType,
  enumType,
  nonNull,
  arg,
  list,
} from 'nexus';
import { PaginationInfo } from './common';
import { assertNoNulls } from '../utils';
import { PersonContact as PersonContactType } from '../../services/contacts/index';

async function getWorkspaceOrgBusinessContactId(ctx: any, workspaceId: string) {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }

  const workspace = await ctx.services.workspaceService.getWorkspaceById(
    workspaceId,
    ctx.user,
  );
  if (!workspace) {
    throw new Error('Workspace not found');
  }
  const orgBusinessContactId = (workspace as any).orgBusinessContactId;
  if (!orgBusinessContactId) {
    throw new Error(
      'Workspace business is not configured (set orgBusinessContactId on the workspace)',
    );
  }
  return orgBusinessContactId as string;
}

export const ContactTypeEnum = enumType({
  name: 'ContactType',
  members: ['BUSINESS', 'PERSON'],
});

export const PersonContactTypeEnum = enumType({
  name: 'PersonContactType',
  members: ['EMPLOYEE', 'EXTERNAL'],
});

export const BusinessContact = objectType({
  name: 'BusinessContact',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('createdBy');
    t.nonNull.string('workspaceId');
    t.nonNull.field('contactType', { type: ContactTypeEnum });
    t.string('notes');
    t.string('profilePicture');
    t.nonNull.string('name');
    t.string('phone');
    t.string('address');
    t.string('taxId');
    t.string('website');
    t.string('accountsPayableContactId');
    t.string('brandId');
    t.string('placeId');
    t.float('latitude');
    t.float('longitude');
    t.field('brand', {
      type: 'Brand',
      resolve: async (parent, _, ctx) => {
        if (!parent.brandId) return null;
        const brand = await ctx.dataloaders.brands.getBrandsById.load(
          parent.brandId,
        );
        if (!brand) return null;

        return {
          id: brand._id,
          domain: brand.domain || '',
          name: brand.name,
          description: brand.description,
          longDescription: brand.longDescription,
          logos: brand.logos,
          colors: brand.colors,
          fonts: brand.fonts,
          images: brand.images,
          links: brand.links,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
          createdBy: brand.createdBy,
          updatedBy: brand.updatedBy,
        };
      },
    });
    t.field('employees', {
      type: ListPersonContactsResult,
      resolve: async (parent, _, ctx) => {
        const { items, page } = await ctx.services.contactsService.listContacts(
          {
            filter: {
              workspaceId: parent.workspaceId,
              businessId: parent.id,
              contactType: 'PERSON',
            },
          },
          ctx.user,
        );

        return {
          items: items as PersonContactType[],
          page,
        };
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.list.nonNull.string('resourceMapIds');
    t.nonNull.list.nonNull.field('resource_map_entries', {
      type: 'ResourceMapResource',
      async resolve(parent, _args, ctx) {
        const resourceMapIds = parent.resourceMapIds || [];
        if (!resourceMapIds.length) return [];
        // Use the data loader to batch load resource map entries
        const entries =
          await ctx.dataloaders.resourceMapResources.getResourceMapEntriesById.loadMany(
            resourceMapIds,
          );
        // Filter out nulls (not found)
        return entries.filter(Boolean);
      },
    });
    t.field('associatedPriceBooks', {
      type: 'ListPriceBooksResult',
      description: 'All price books associated with this business contact',
      async resolve(parent, _, ctx) {
        return ctx.services.pricesService.listPriceBooks(
          {
            filter: {
              workspaceId: parent.workspaceId,
              businessContactId: parent.id,
            },
            page: { number: 1, size: 1000 },
          },
          ctx.user,
        );
      },
    });
  },
});

// === Granular field update mutations ===

export const ContactFieldPatchMutations = extendType({
  type: 'Mutation',
  definition(t) {
    // PersonContact field mutations
    t.field('updatePersonResourceMap', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        resourceMapIds: nonNull(arg({ type: nonNull(list(nonNull('ID'))) })),
      },
      async resolve(_, { id, resourceMapIds }, ctx) {
        return ctx.services.contactsService.patchPersonContact(
          id,
          { resourceMapIds },
          ctx.user,
        );
      },
    });

    t.field('updatePersonBusiness', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        businessId: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id, businessId }, ctx) {
        const existing = await ctx.services.contactsService.getContactById(
          id,
          ctx.user,
        );
        if (!existing || existing.contactType !== 'PERSON') {
          throw new Error('Person contact not found');
        }
        if ((existing as any).personType === 'EMPLOYEE') {
          throw new Error(
            'Employee contacts are always tied to the workspace business and cannot change business',
          );
        }
        return ctx.services.contactsService.patchPersonContact(
          id,
          { businessId },
          ctx.user,
        );
      },
    });

    t.field('updatePersonEmail', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        email: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, email }, ctx) {
        return ctx.services.contactsService.patchPersonContact(
          id,
          { email },
          ctx.user,
        );
      },
    });

    t.field('updatePersonPhone', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        phone: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, phone }, ctx) {
        return ctx.services.contactsService.patchPersonContact(
          id,
          { phone },
          ctx.user,
        );
      },
    });

    t.field('updatePersonName', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        name: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, name }, ctx) {
        return ctx.services.contactsService.patchPersonContact(
          id,
          { name },
          ctx.user,
        );
      },
    });

    // BusinessContact field mutations
    t.field('updateBusinessName', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        name: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, name }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { name },
          ctx.user,
        );
      },
    });

    t.field('updateBusinessPhone', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        phone: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, phone }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { phone },
          ctx.user,
        );
      },
    });

    t.field('updateBusinessAddress', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        address: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, address }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { address },
          ctx.user,
        );
      },
    });

    t.field('updateBusinessTaxId', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        taxId: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, taxId }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { taxId },
          ctx.user,
        );
      },
    });

    t.field('updateBusinessWebsite', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        website: nonNull(arg({ type: 'String' })),
      },
      async resolve(_, { id, website }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { website },
          ctx.user,
        );
      },
    });

    t.field('updateBusinessBrandId', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        brandId: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id, brandId }, ctx) {
        return ctx.services.contactsService.patchBusinessContact(
          id,
          { brandId },
          ctx.user,
        );
      },
    });
  },
});

export const PersonContact = objectType({
  name: 'PersonContact',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('createdBy');
    t.nonNull.string('workspaceId');
    t.nonNull.field('contactType', { type: ContactTypeEnum });
    t.string('notes');
    t.string('profilePicture');
    t.nonNull.string('name');
    t.string('phone');
    t.nonNull.string('email');
    t.field('personType', { type: PersonContactTypeEnum });
    t.nonNull.string('businessId');
    t.field('business', {
      type: BusinessContact,
      resolve(parent, _, ctx) {
        return ctx.dataloaders.contacts.getContactsById.load(parent.businessId);
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.list.nonNull.string('resourceMapIds');
    t.nonNull.list.nonNull.field('resource_map_entries', {
      type: 'ResourceMapResource',
      async resolve(parent, _args, ctx) {
        const resourceMapIds = parent.resourceMapIds || [];
        if (!resourceMapIds.length) return [];
        // Use the data loader to batch load resource map entries
        const entries =
          await ctx.dataloaders.resourceMapResources.getResourceMapEntriesById.loadMany(
            resourceMapIds,
          );
        // Filter out nulls (not found)
        return entries.filter(Boolean);
      },
    });
  },
});

export const Contact = unionType({
  name: 'Contact',
  resolveType: (item) =>
    item.contactType === 'BUSINESS' ? 'BusinessContact' : 'PersonContact',
  definition(t) {
    t.members(BusinessContact, PersonContact);
  },
});

// === Input types ===

export const BusinessContactInput = inputObjectType({
  name: 'BusinessContactInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('notes');
    t.string('profilePicture');
    t.nonNull.string('name');
    t.string('phone');
    t.string('address');
    t.string('taxId');
    t.string('website');
    t.id('accountsPayableContactId');
    t.id('brandId');
    t.list.nonNull.id('resourceMapIds');
    t.string('placeId');
    t.float('latitude');
    t.float('longitude');
  },
});

export const PersonContactInput = inputObjectType({
  name: 'PersonContactInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('notes');
    t.string('profilePicture');
    t.nonNull.string('name');
    t.string('phone');
    t.nonNull.string('email');
    t.field('personType', { type: PersonContactTypeEnum });
    t.nonNull.id('businessId');
    t.list.nonNull.id('resourceMapIds');
  },
});

export const UpdatePersonContactInput = inputObjectType({
  name: 'UpdatePersonContactInput',
  definition(t) {
    t.string('notes');
    t.string('profilePicture');
    t.string('name');
    t.string('phone');
    t.string('email');
    t.field('personType', { type: PersonContactTypeEnum });
    t.id('businessId');
    t.list.nonNull.id('resourceMapIds');
  },
});

export const UpdateBusinessContactInput = inputObjectType({
  name: 'UpdateBusinessContactInput',
  definition(t) {
    t.string('notes');
    t.string('profilePicture');
    t.string('name');
    t.string('phone');
    t.string('address');
    t.string('taxId');
    t.string('website');
    t.id('accountsPayableContactId');
    t.id('brandId');
    t.list.nonNull.id('resourceMapIds');
    t.string('placeId');
    t.float('latitude');
    t.float('longitude');
  },
});

export const ListContactsResult = objectType({
  name: 'ListContactsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Contact });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const ListPersonContactsResult = objectType({
  name: 'ListPersonContactsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: PersonContact });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// === Query and Mutation extensions ===

export const ContactQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getContactById', {
      type: Contact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        return ctx.services.contactsService.getContactById(id, ctx.user);
      },
    });
    t.field('listContacts', {
      type: ListContactsResult,
      args: {
        filter: nonNull(
          arg({
            type: inputObjectType({
              name: 'ListContactsFilter',
              definition(t) {
                t.nonNull.string('workspaceId');
                t.field('contactType', { type: ContactTypeEnum });
                t.id('businessId', {
                  description:
                    'Filter person contacts by their employer business ID',
                });
              },
            }),
          }),
        ),
        page: arg({
          type: inputObjectType({
            name: 'ListContactsPage',
            definition(t) {
              t.int('number', { default: 1 });
              t.int('size', { default: 10 });
            },
          }),
        }),
      },
      async resolve(_, args, ctx) {
        const { filter, page } = args;
        const results = await ctx.services.contactsService.listContacts(
          {
            filter: {
              workspaceId: filter.workspaceId,
              ...(filter.contactType && { contactType: filter.contactType }),
              ...(filter.businessId && { businessId: filter.businessId }),
            },
            page: {
              number: page?.number ?? 1,
              size: page?.size ?? 10,
            },
          },
          ctx.user,
        );

        return results;
      },
    });
  },
});

// Result type for touchAllContacts mutation
export const TouchAllContactsResult = objectType({
  name: 'TouchAllContactsResult',
  definition(t) {
    t.nonNull.int('touched');
  },
});

export const ContactMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('touchAllContacts', {
      type: TouchAllContactsResult,
      args: {
        batchSize: arg({ type: 'Int' }),
      },
      async resolve(_, { batchSize }, ctx) {
        return ctx.services.contactsService.touchAllContacts(
          batchSize ?? undefined,
          ctx.user,
        );
      },
    });

    t.field('createBusinessContact', {
      type: BusinessContact,
      args: {
        input: nonNull(arg({ type: BusinessContactInput })),
      },
      async resolve(_, { input }, ctx) {
        return ctx.services.contactsService.createBusinessContact(
          {
            ...input,
            notes: input.notes ?? undefined,
            accountsPayableContactId:
              input.accountsPayableContactId ?? undefined,
            address: input.address ?? undefined,
            taxId: input.taxId ?? undefined,
            website: input.website ?? undefined,
            phone: input.phone ?? undefined,
            profilePicture: input.profilePicture ?? undefined,
            brandId: input.brandId ?? undefined,
            resourceMapIds: input.resourceMapIds || undefined,
            placeId: input.placeId ?? undefined,
            latitude: input.latitude ?? undefined,
            longitude: input.longitude ?? undefined,
          },
          ctx.user,
        );
      },
    });

    t.field('createPersonContact', {
      type: PersonContact,
      args: {
        input: nonNull(arg({ type: PersonContactInput })),
      },
      async resolve(_, { input }, ctx) {
        if (input.personType === 'EMPLOYEE') {
          const orgBusinessContactId = await getWorkspaceOrgBusinessContactId(
            ctx,
            input.workspaceId,
          );
          if (input.businessId !== orgBusinessContactId) {
            throw new Error(
              'Employee contacts must use the workspace orgBusinessContactId as businessId',
            );
          }
        }
        return ctx.services.contactsService.createPersonContact(
          {
            ...input,
            notes: input.notes ?? undefined,
            phone: input.phone ?? undefined,
            profilePicture: input.profilePicture ?? undefined,
            personType: input.personType ?? undefined,
            resourceMapIds: input.resourceMapIds || undefined,
          },
          ctx.user,
        );
      },
    });

    t.field('deleteContactById', {
      type: 'Boolean',
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        await ctx.services.contactsService.deleteContactById(id, ctx.user);
        return true;
      },
    });

    t.field('updatePersonContact', {
      type: PersonContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        input: nonNull(arg({ type: UpdatePersonContactInput })),
      },
      async resolve(_, { id, input }, ctx) {
        assertNoNulls(input, 'UpdatePersonContactInput');

        const existing = await ctx.services.contactsService.getContactById(
          id,
          ctx.user,
        );
        if (!existing || existing.contactType !== 'PERSON') {
          throw new Error('Person contact not found');
        }

        const nextPersonType =
          input.personType ?? (existing as any).personType ?? undefined;
        const nextBusinessId =
          input.businessId ?? (existing as any).businessId ?? undefined;

        if (nextPersonType === 'EMPLOYEE') {
          const orgBusinessContactId = await getWorkspaceOrgBusinessContactId(
            ctx,
            (existing as any).workspaceId,
          );
          if (nextBusinessId !== orgBusinessContactId) {
            throw new Error(
              'Employee contacts must use the workspace orgBusinessContactId as businessId',
            );
          }
        }

        return ctx.services.contactsService.updatePersonContact(
          id,
          input,
          ctx.user,
        );
      },
    });

    t.field('updateBusinessContact', {
      type: BusinessContact,
      args: {
        id: nonNull(arg({ type: 'ID' })),
        input: nonNull(arg({ type: UpdateBusinessContactInput })),
      },
      async resolve(_, { id, input }, ctx) {
        assertNoNulls(input, 'UpdateBusinessContactInput');
        return ctx.services.contactsService.updateBusinessContact(
          id,
          input,
          ctx.user,
        );
      },
    });
  },
});
