import {
  objectType,
  queryField,
  intArg,
  inputObjectType,
  mutationField,
  arg,
  stringArg,
} from 'nexus';
import { AssetScheduleDoc } from '../../services/asset_schedules';

export const AssetSchedule = objectType({
  name: 'AssetSchedule',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('asset_id');
    t.nonNull.string('project_id');
    t.nonNull.string('company_id');
    t.nonNull.string('start_date');
    t.nonNull.string('end_date');
    t.nonNull.string('created_at');
    t.nonNull.string('created_by');
    t.nonNull.string('updated_at');
    t.nonNull.string('updated_by');
  },
});

export const AssetScheduleInput = inputObjectType({
  name: 'AssetScheduleInput',
  definition(t) {
    t.nonNull.string('asset_id');
    t.nonNull.string('project_id');
    t.nonNull.string('start_date');
    t.nonNull.string('end_date');
  },
});

export const createAssetSchedule = mutationField('createAssetSchedule', {
  type: 'AssetSchedule',
  args: {
    input: arg({ type: 'AssetScheduleInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }
    const created =
      await ctx.services.assetSchedulesService.createAssetSchedule(
        {
          asset_id: input.asset_id,
          project_id: input.project_id,
          start_date: new Date(input.start_date),
          end_date: new Date(input.end_date),
        },
        ctx.user,
      );
    if (!created) {
      return null;
    }
    return {
      id: created._id,
      asset_id: created.asset_id,
      project_id: created.project_id,
      company_id: created.companyId,
      start_date: created.start_date.toISOString(),
      end_date: created.end_date.toISOString(),
      created_at: created.created_at.toISOString(),
      created_by: created.created_by,
      updated_at: created.updated_at.toISOString(),
      updated_by: created.updated_by,
    };
  },
});

export const AssetScheduleListResult = objectType({
  name: 'AssetScheduleListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: 'AssetSchedule' });
    t.nonNull.int('total');
    t.nonNull.int('limit');
    t.nonNull.int('offset');
  },
});

export const listAssetSchedules = queryField('listAssetSchedules', {
  type: 'AssetScheduleListResult',
  args: {
    asset_id: stringArg(),
    project_id: stringArg(),
    limit: intArg({ default: 20 }),
    offset: intArg({ default: 0 }),
  },
  resolve: async (_root, args, ctx) => {
    const filter: Record<string, any> = {};
    if (args.asset_id) filter.asset_id = args.asset_id;
    if (args.project_id) filter.project_id = args.project_id;
    const limit = args.limit ?? undefined;
    const offset = args.offset ?? undefined;
    const result = await ctx.services.assetSchedulesService.listAssetSchedules(
      { filter, limit, offset },
      ctx.user,
    );
    return {
      items: result.data.map((dbSchedule: AssetScheduleDoc) => ({
        id: dbSchedule._id,
        asset_id: dbSchedule.asset_id,
        project_id: dbSchedule.project_id,
        company_id: dbSchedule.companyId,
        start_date: dbSchedule.start_date.toISOString(),
        end_date: dbSchedule.end_date.toISOString(),
        created_at: dbSchedule.created_at.toISOString(),
        created_by: dbSchedule.created_by,
        updated_at: dbSchedule.updated_at.toISOString(),
        updated_by: dbSchedule.updated_by,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },
});
