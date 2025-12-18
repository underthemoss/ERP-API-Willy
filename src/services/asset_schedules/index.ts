import { type MongoClient } from 'mongodb';
import {
  AssetSchedulesModel,
  createAssetSchedulesModel,
  AssetScheduleDoc,
} from './model';
import { UserAuthPayload } from '../../authentication';

export class AssetSchedulesService {
  private model: AssetSchedulesModel;
  constructor(config: { model: AssetSchedulesModel }) {
    this.model = config.model;
  }

  async createAssetSchedule(
    input: {
      asset_id: string;
      project_id: string;
      start_date: Date;
      end_date: Date;
    },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to create asset schedule');
    }
    const now = new Date();
    const doc = {
      asset_id: input.asset_id,
      project_id: input.project_id,
      companyId: user.companyId,
      start_date: input.start_date,
      end_date: input.end_date,
      created_at: now,
      created_by: user.id,
      updated_at: now,
      updated_by: user.id,
    };
    const created = await this.model.createAssetSchedule(doc);
    return created;
  }

  async listAssetSchedules(
    options: {
      filter?: { asset_id?: string; project_id?: string };
      limit?: number;
      offset?: number;
    } = {},
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to list asset schedules');
    }
    const { filter = {}, limit, offset } = options;
    const mergedFilter: Record<string, any> = { ...filter };
    if (user.companyId) {
      mergedFilter.companyId = user.companyId;
    }
    const result = await this.model.getAssetSchedules({
      filter: mergedFilter,
      limit,
      offset,
    });
    return result;
  }

  async batchGetAssetSchedulesById(
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(AssetScheduleDoc | null)[]> {
    if (!user) {
      throw new Error('User context is required for batch retrieval');
    }
    return this.model.batchGetAssetSchedulesById(ids, user.companyId);
  }
}

export const createAssetSchedulesService = async (config: {
  mongoClient: MongoClient;
}) => {
  const model = createAssetSchedulesModel(config);
  const assetSchedulesService = new AssetSchedulesService({
    model,
  });
  return assetSchedulesService;
};

export type { AssetScheduleDoc };
