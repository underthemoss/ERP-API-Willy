import { BaseIndex } from './baseIndex';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import { UserAuthPayload } from '../../../authentication';

export class RentalsIndex extends BaseIndex {
  readonly indexName = 't3_rentals';

  getSearchSettings(): SearchSettingsConfig {
    return {
      fuzziness: 'AUTO',
      search_attributes: [
        { field: 'details.rental_id', weight: 10 },
        { field: 'asset.details.custom_name', weight: 9 },
        { field: 'asset.details.name', weight: 8 },
        { field: 'asset.make.name', weight: 7 },
        { field: 'asset.model.name', weight: 7 },
        { field: 'asset.details.description', weight: 6 },
        { field: 'asset.class.name', weight: 6 },
        { field: 'order.company_name', weight: 5 },
        { field: 'status.name', weight: 5 },
        { field: 'details.job_description', weight: 4 },
        { field: 'asset.details.serial_number', weight: 8 },
        { field: 'asset.details.vin', weight: 8 },
      ],
      result_attributes: [
        'details.rental_id',
        'details.order_id',
        'details.start_date',
        'details.end_date',
        'details.price',
        'details.price_per_day',
        'details.price_per_week',
        'details.price_per_month',
        'details.job_description',
        'details.rental_status_id',
        'details.borrower_user_id',
        'details.date_created',
        'asset.asset_id',
        'asset.details',
        'asset.company',
        'asset.type',
        'asset.make',
        'asset.model',
        'asset.class',
        'asset.photo',
        'asset.inventory_branch',
        'status.id',
        'status.name',
        'order.order_id',
        'order.company_id',
        'order.company_name',
        'order.order_status_name',
      ],
      facet_attributes: [
        {
          attribute: 'status',
          field: 'status.name.keyword',
          type: 'string',
        },
        {
          attribute: 'asset_type',
          field: 'asset.type.name.keyword',
          type: 'string',
        },
        {
          attribute: 'asset_make',
          field: 'asset.make.name.keyword',
          type: 'string',
        },
        {
          attribute: 'asset_class',
          field: 'asset.class.name.keyword',
          type: 'string',
        },
        {
          attribute: 'company',
          field: 'order.company_name.keyword',
          type: 'string',
        },
      ],
      highlight_attributes: [
        'asset.details.name',
        'asset.details.custom_name',
        'asset.details.description',
        'details.job_description',
        'status.name',
        'asset.make.name',
        'asset.model.name',
      ],
      snippet_attributes: [
        'asset.details.description',
        'details.job_description',
      ],
      sorting: {
        default: {
          field: '_score',
          order: 'desc',
        },
        _date_created_asc: {
          field: 'details.date_created.keyword',
          order: 'asc',
        },
        _date_created_desc: {
          field: 'details.date_created.keyword',
          order: 'desc',
        },
      },
    };
  }

  getBaseFilters(user: UserAuthPayload): ElasticsearchQuery[] {
    if (user.companyId) {
      return [{ term: { 'order.company_id': user.companyId } }];
    }
    return [{ term: { _id: 'no-match' } }];
  }
}
