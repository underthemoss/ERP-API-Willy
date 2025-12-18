import { BaseIndex } from './baseIndex';
import { SearchSettingsConfig, ElasticsearchQuery } from 'searchkit';
import { UserAuthPayload } from '../../../authentication';

export class PimCategoriesIndex extends BaseIndex {
  readonly indexName = 't3_pim_categories';

  getSearchSettings(): SearchSettingsConfig {
    return {
      fuzziness: 'AUTO',
      search_attributes: [
        { field: 'data.name', weight: 10 },
        { field: 'data.path', weight: 8 },
        { field: 'data.description', weight: 7 },
        { field: 'category_lvl1', weight: 5 },
        { field: 'category_lvl2', weight: 4 },
        { field: 'category_lvl3', weight: 4 },
        { field: 'category_lvl4', weight: 3 },
        { field: 'category_lvl5', weight: 3 },
      ],
      result_attributes: [
        'data.platform_id',
        'data.is_deleted',
        'data.name',
        'data.path',
        'data.description',
        'data.has_products',
        'data.tenant.id',
        'category_lvl1',
        'category_lvl2',
        'category_lvl3',
        'category_lvl4',
        'category_lvl5',
        'category_lvl6',
        'category_lvl7',
        'category_lvl8',
        'category_lvl9',
        'category_lvl10',
        'category_lvl11',
        'category_lvl12',
      ],
      facet_attributes: [
        {
          attribute: 'has_products',
          field: 'data.has_products',
          type: 'string',
        },
        {
          attribute: 'category_lvl1',
          field: 'category_lvl1.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl2',
          field: 'category_lvl2.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl3',
          field: 'category_lvl3.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl4',
          field: 'category_lvl4.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl5',
          field: 'category_lvl5.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl6',
          field: 'category_lvl6.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl7',
          field: 'category_lvl7.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl8',
          field: 'category_lvl8.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl9',
          field: 'category_lvl9.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl10',
          field: 'category_lvl10.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl11',
          field: 'category_lvl11.keyword',
          type: 'string',
        },
        {
          attribute: 'category_lvl12',
          field: 'category_lvl12.keyword',
          type: 'string',
        },
      ],
      highlight_attributes: ['data.name', 'data.description', 'data.path'],
      snippet_attributes: ['data.name'],
    };
  }

  getBaseFilters(user: UserAuthPayload): ElasticsearchQuery[] {
    const filters: ElasticsearchQuery[] = [
      { term: { 'data.is_deleted': false } },
    ];

    // Filter by tenant ID if configured, otherwise return no results
    if (this.envConfig.PIM_GLOBAL_TENANT_ID) {
      filters.push({
        term: { 'data.tenant.id': this.envConfig.PIM_GLOBAL_TENANT_ID },
      });
    } else {
      // Return no results if tenant ID is not configured
      filters.push({ term: { _id: 'no-match' } });
    }

    return filters;
  }
}
