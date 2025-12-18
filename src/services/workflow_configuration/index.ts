import { type MongoClient } from 'mongodb';
import {
  createWorkflowConfigurationModel,
  WorkflowConfigurationModel,
  CreateWorkflowConfigurationInput,
  UpdateWorkflowConfigurationInput,
  ListWorkflowConfigurationsQuery,
} from './model';
import { UserAuthPayload } from '../../authentication';

// re-export DTOs
export type { WorkflowConfiguration } from './model';

export class WorkflowConfigurationService {
  private model: WorkflowConfigurationModel;
  constructor(config: { model: WorkflowConfigurationModel }) {
    this.model = config.model;
  }

  async createWorkflowConfiguration(
    input: Omit<CreateWorkflowConfigurationInput, 'createdBy'>,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.createWorkflowConfiguration({
      ...input,
      createdBy: user.id,
    });
  }

  async updateWorkflowConfiguration(
    id: string,
    input: UpdateWorkflowConfigurationInput,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.updateWorkflowConfiguration(id, input, user.id);
  }

  async deleteWorkflowConfigurationById(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.deleteWorkflowConfigurationById(id, user.id);
  }

  async getWorkflowConfigurationById(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const config = await this.model.getWorkflowConfigurationById(id);
    if (!config) {
      throw new Error('WorkflowConfiguration not found');
    }
    return config;
  }

  async listWorkflowConfigurations(
    query: ListWorkflowConfigurationsQuery,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const items = await this.model.listWorkflowConfigurations({
      ...query,
      filter: { ...query.filter, companyId: user.companyId },
    });
    return {
      items,
      page: {
        number: 1,
        size: items.length,
        totalItems: items.length,
        totalPages: 1,
      },
    };
  }
}

export const createWorkflowConfigurationService = (config: {
  mongoClient: MongoClient;
}) => {
  const model = createWorkflowConfigurationModel(config);
  return new WorkflowConfigurationService({ model });
};
