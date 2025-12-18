import { BaseIndex } from './baseIndex';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import { UserAuthPayload } from '../../../authentication';

export class OrdersIndex extends BaseIndex {
  readonly indexName = 't3_orders';

  getSearchSettings(): SearchSettingsConfig {
    return {
      fuzziness: 'AUTO',
      search_attributes: [
        { field: 'details.order_id', weight: 10 },
        { field: 'details.company_name', weight: 8 },
        { field: 'details.user_first_name', weight: 7 },
        { field: 'details.user_last_name', weight: 7 },
        { field: 'details.user_email', weight: 6 },
        { field: 'rentals.asset_name', weight: 6 },
        { field: 'details.order_status_name', weight: 5 },
        { field: 'rentals.asset_description', weight: 4 },
      ],
      result_attributes: [
        'details.order_id',
        'details.order_status_id',
        'details.order_status_name',
        'details.company_id',
        'details.company_name',
        'details.user_id',
        'details.user_first_name',
        'details.user_last_name',
        'details.user_email',
        'details.date_created',
        'details.date_updated',
        'rentals',
      ],
      facet_attributes: [
        {
          attribute: 'order_status',
          field: 'details.order_status_name.keyword',
          type: 'string',
        },
        {
          attribute: 'company',
          field: 'details.company_name.keyword',
          type: 'string',
        },
      ],
      highlight_attributes: [
        'details.order_id',
        'details.company_name',
        'details.user_first_name',
        'details.user_last_name',
        'details.user_email',
      ],
      snippet_attributes: [],
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
      return [{ term: { 'details.company_id': user.companyId } }];
    }
    return [{ term: { _id: 'no-match' } }];
  }
}
