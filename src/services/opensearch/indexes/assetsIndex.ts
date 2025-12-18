import { BaseIndex } from './baseIndex';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import { UserAuthPayload } from '../../../authentication';

export class AssetsIndex extends BaseIndex {
  readonly indexName = 't3_assets';

  getSearchSettings(): SearchSettingsConfig {
    return {
      fuzziness: 'AUTO',
      search_attributes: [
        { field: 'details.custom_name', weight: 10 },
        { field: 'details.asset_id', weight: 10 },
        { field: 'details.name', weight: 8 },
        { field: 'details.description', weight: 6 },
        { field: 'make.name', weight: 7 },
        { field: 'model.name', weight: 7 },
        { field: 'class.name', weight: 5 },
        { field: 'details.serial_number', weight: 8 },
        { field: 'details.vin', weight: 8 },
        { field: 'details.model', weight: 6 },
        { field: 'company.name', weight: 5 },
        { field: 'inventory_branch.name', weight: 3 },
        { field: 'msp_branch.name', weight: 3 },
        { field: 'tracker.device_serial', weight: 4 },
        { field: 'details.tracker_id', weight: 4 },
        { field: 'keypad', weight: 3 },
        { field: 'details.driver_name', weight: 2 },
      ],
      result_attributes: [
        'details.asset_id',
        'details.custom_name',
        'details.name',
        'details.description',
        'details.year',
        'details.model',
        'details.serial_number',
        'details.vin',
        'type.id',
        'type.name',
        'make.id',
        'make.name',
        'model.id',
        'model.name',
        'class.id',
        'class.name',
        'class.description',
        'company.id',
        'company.name',
        'inventory_branch.id',
        'inventory_branch.name',
        'inventory_branch.company_id',
        'inventory_branch.company_name',
        'msp_branch.id',
        'msp_branch.name',
        'msp_branch.company_id',
        'msp_branch.company_name',
        'rsp_branch',
        'tracker.id',
        'tracker.device_serial',
        'tracker.tracker_type_id',
        'details.tracker_id',
        'photo.filename',
        'photo.photo_id',
        'details.photo_id',
        'keypad',
        'groups',
        'tsp_companies',
        'details.driver_name',
        'details.camera_id',
      ],
      facet_attributes: [
        { attribute: 'type', field: 'type.name.keyword', type: 'string' },
        { attribute: 'make', field: 'make.name.keyword', type: 'string' },
        { attribute: 'model', field: 'model.name.keyword', type: 'string' },
        { attribute: 'class', field: 'class.name.keyword', type: 'string' },
        { attribute: 'company', field: 'company.name.keyword', type: 'string' },
        {
          attribute: 'inventory_branch',
          field: 'inventory_branch.name.keyword',
          type: 'string',
        },
        {
          attribute: 'msp_branch',
          field: 'msp_branch.name.keyword',
          type: 'string',
        },
        { attribute: 'year', field: 'details.year.keyword', type: 'string' },
        {
          attribute: 'has_tracker',
          field: 'tracker.id.keyword',
          type: 'string',
        },
        {
          attribute: 'has_photo',
          field: 'photo.photo_id.keyword',
          type: 'string',
        },
      ],
      highlight_attributes: [
        'details.custom_name',
        'details.name',
        'details.description',
        'make.name',
        'model.name',
        'company.name',
        'details.serial_number',
        'details.vin',
      ],
      snippet_attributes: ['details.description', 'class.description'],
    };
  }

  getBaseFilters(user: UserAuthPayload): ElasticsearchQuery[] {
    if (user.companyId) {
      return [{ term: { 'company.id': user.companyId } }];
    }
    return [{ term: { _id: 'no-match' } }];
  }
}
