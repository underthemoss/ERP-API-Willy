import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { type KsqlEsdbRentalMaterializedView } from '../../generated/ksql/KsqlEsdbRentalMaterializedView.generated';

/* GraphQL operations for codegen */
gql`
  query ListRentalViews(
    $filter: RentalViewFilterInput
    $page: ListRentalViewsPageInput
  ) {
    listRentalViews(filter: $filter, page: $page) {
      items {
        rentalId
        details {
          rentalId
          borrowerUserId
          rentalStatusId
          startDate
          endDate
          price
          orderId
        }
        asset {
          assetId
          details {
            name
            description
          }
          company {
            id
            name
          }
        }
        status {
          id
          name
        }
        order {
          orderId
          companyId
          companyName
          orderStatusName
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`;

const { createClient, getMongoClient } = createTestEnvironment();

// Helper function to create test rental view data
function createTestRentalView(
  overrides: {
    rental_id?: string;
    details?: Partial<KsqlEsdbRentalMaterializedView['details']>;
    asset?: Partial<KsqlEsdbRentalMaterializedView['asset']>;
    status?: Partial<KsqlEsdbRentalMaterializedView['status']>;
    order?: Partial<KsqlEsdbRentalMaterializedView['order']>;
  } = {},
): KsqlEsdbRentalMaterializedView & { _id: any } {
  const rentalId = overrides.rental_id || `rental-${Date.now()}`;
  const orderId = overrides.order?.order_id || `order-${Date.now()}`;
  const assetId = overrides.asset?.asset_id || `asset-${Date.now()}`;

  return {
    _id: rentalId,
    rental_id: rentalId,
    details: {
      rental_id: rentalId,
      borrower_user_id: 'user-123',
      rental_status_id: '1',
      date_created: '2025-01-10T10:00:00Z',
      start_date: '2025-01-15T00:00:00Z',
      end_date: '2025-01-22T00:00:00Z',
      amount_received: '500.00',
      price: '700.00',
      delivery_charge: '50.00',
      return_charge: '50.00',
      delivery_required: 'true',
      delivery_instructions: 'Call before delivery',
      order_id: orderId,
      drop_off_delivery_id: null,
      return_delivery_id: null,
      price_per_day: '100.00',
      price_per_week: '600.00',
      price_per_month: '2000.00',
      start_date_estimated: null,
      end_date_estimated: null,
      job_description: null,
      equipment_class_id: null,
      price_per_hour: null,
      deleted: null,
      rental_protection_plan_id: null,
      taxable: 'true',
      asset_id: assetId,
      drop_off_delivery_required: null,
      return_delivery_required: null,
      lien_notice_sent: null,
      off_rent_date_requested: null,
      external_id: null,
      rental_type_id: '1',
      part_type_id: null,
      quantity: '1',
      purchase_price: null,
      rental_purchase_option_id: null,
      rate_type_id: '1',
      has_re_rent: null,
      is_below_floor_rate: null,
      is_flat_monthly_rate: null,
      is_flexible_rate: null,
      inventory_product_id: null,
      inventory_product_name: null,
      inventory_product_name_historical: null,
      one_time_charge: null,
      rental_pricing_structure_id: null,
      ...overrides.details,
    },
    asset: {
      asset_id: assetId,
      details: {
        asset_id: assetId,
        name: 'Excavator',
        description: 'Heavy duty excavator',
        custom_name: null,
        model: 'EX-2000',
        year: '2023',
        tracker_id: null,
        vin: null,
        serial_number: 'SN123456',
        driver_name: null,
        camera_id: null,
        photo_id: null,
      },
      photo: null,
      company: {
        id: 'company-123',
        name: 'Test Company',
      },
      type: {
        id: 'type-1',
        name: 'Heavy Equipment',
      },
      make: {
        id: 'make-1',
        name: 'Caterpillar',
      },
      model: {
        id: 'model-1',
        name: 'EX-2000',
      },
      class: {
        id: 'class-1',
        name: 'Excavators',
        description: 'Excavation equipment',
      },
      inventory_branch: overrides.asset?.inventory_branch || null,
      msp_branch: overrides.asset?.msp_branch || null,
      rsp_branch: overrides.asset?.rsp_branch || null,
      groups: overrides.asset?.groups || null,
      tsp_companies: overrides.asset?.tsp_companies || null,
      tracker: overrides.asset?.tracker || null,
      keypad: overrides.asset?.keypad || null,
      ...overrides.asset,
    },
    status: {
      id: '1',
      name: 'Active',
      ...overrides.status,
    },
    order: {
      order_id: orderId,
      order_status_id: '1',
      order_status_name: 'Open',
      company_id: 'company-123',
      company_name: 'Test Company',
      ordered_by_user_id: 'user-123',
      ordered_by_first_name: 'John',
      ordered_by_last_name: 'Doe',
      ordered_by_email: 'john.doe@example.com',
      date_created: '2025-01-10T10:00:00Z',
      date_updated: '2025-01-10T10:00:00Z',
      ...overrides.order,
    },
  };
}

describe('Rental Views', () => {
  let mongoClient: ReturnType<typeof getMongoClient>;
  const COLLECTION_NAME = 't3_rentals_materialized';

  beforeAll(() => {
    mongoClient = getMongoClient();
  });

  afterEach(async () => {
    // Clean up test data after each test
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.deleteMany({});
  });

  it('queries rental views without filters', async () => {
    const { sdk, user } = await createClient();

    // Seed 3 rental records for this user's company
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    const testRentals = [
      createTestRentalView({
        rental_id: 'rental-1',
        order: { company_id: user.companyId, order_id: 'order-1' },
      }),
      createTestRentalView({
        rental_id: 'rental-2',
        order: { company_id: user.companyId, order_id: 'order-2' },
      }),
      createTestRentalView({
        rental_id: 'rental-3',
        order: { company_id: user.companyId, order_id: 'order-3' },
      }),
    ];
    await collection.insertMany(testRentals);

    // Query without filters
    const { listRentalViews } = await sdk.ListRentalViews({
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(3);
    expect(listRentalViews.page.totalItems).toBe(3);
    expect(listRentalViews.page.totalPages).toBe(1);

    // Verify rental IDs
    const rentalIds = listRentalViews.items.map((item) => item.rentalId);
    expect(rentalIds).toContain('rental-1');
    expect(rentalIds).toContain('rental-2');
    expect(rentalIds).toContain('rental-3');
  });

  it('paginates rental views correctly', async () => {
    const { sdk, user } = await createClient();

    // Seed 25 rental records
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    const testRentals = Array.from({ length: 25 }, (_, i) =>
      createTestRentalView({
        rental_id: `rental-${i + 1}`,
        order: { company_id: user.companyId, order_id: `order-${i + 1}` },
      }),
    );
    await collection.insertMany(testRentals);

    // Query page 1
    const page1 = await sdk.ListRentalViews({
      page: { number: 1, size: 10 },
    });

    expect(page1.listRentalViews).toBeDefined();
    if (!page1.listRentalViews) {
      throw new Error('Expected page1.listRentalViews');
    }

    expect(page1.listRentalViews.items).toHaveLength(10);
    expect(page1.listRentalViews.page.number).toBe(1);
    expect(page1.listRentalViews.page.totalItems).toBe(25);
    expect(page1.listRentalViews.page.totalPages).toBe(3);

    // Query page 2
    const page2 = await sdk.ListRentalViews({
      page: { number: 2, size: 10 },
    });

    expect(page2.listRentalViews).toBeDefined();
    if (!page2.listRentalViews) {
      throw new Error('Expected page2.listRentalViews');
    }

    expect(page2.listRentalViews.items).toHaveLength(10);
    expect(page2.listRentalViews.page.number).toBe(2);
    expect(page2.listRentalViews.page.totalItems).toBe(25);

    // Query page 3 (last page with 5 items)
    const page3 = await sdk.ListRentalViews({
      page: { number: 3, size: 10 },
    });

    expect(page3.listRentalViews).toBeDefined();
    if (!page3.listRentalViews) {
      throw new Error('Expected page3.listRentalViews');
    }

    expect(page3.listRentalViews.items).toHaveLength(5);
    expect(page3.listRentalViews.page.number).toBe(3);

    // Verify no overlap between pages
    const page1Ids = page1.listRentalViews.items.map((r) => r.rentalId);
    const page2Ids = page2.listRentalViews.items.map((r) => r.rentalId);
    const page3Ids = page3.listRentalViews.items.map((r) => r.rentalId);

    const allIds = new Set([...page1Ids, ...page2Ids, ...page3Ids]);
    expect(allIds.size).toBe(25); // No duplicates
  });

  it('filters rental views by rental status', async () => {
    const { sdk, user } = await createClient();

    // Seed rentals with different statuses
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-active-1',
        status: { id: '1', name: 'Active' },
        details: { rental_status_id: '1' },
        order: { company_id: user.companyId },
      }),
      createTestRentalView({
        rental_id: 'rental-active-2',
        status: { id: '1', name: 'Active' },
        details: { rental_status_id: '1' },
        order: { company_id: user.companyId },
      }),
      createTestRentalView({
        rental_id: 'rental-completed',
        status: { id: '2', name: 'Completed' },
        details: { rental_status_id: '2' },
        order: { company_id: user.companyId },
      }),
    ]);

    // Filter by Active status
    const { listRentalViews } = await sdk.ListRentalViews({
      filter: { rentalStatusId: '1' },
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(2);
    listRentalViews.items.forEach((rental) => {
      expect(rental.status?.id).toBe('1');
      expect(rental.details?.rentalStatusId).toBe('1');
    });
  });

  it('filters rental views by date range', async () => {
    const { sdk, user } = await createClient();

    // Seed rentals with different start dates
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-jan',
        details: { start_date: '2025-01-15T00:00:00Z' },
        order: { company_id: user.companyId },
      }),
      createTestRentalView({
        rental_id: 'rental-feb',
        details: { start_date: '2025-02-15T00:00:00Z' },
        order: { company_id: user.companyId },
      }),
      createTestRentalView({
        rental_id: 'rental-mar',
        details: { start_date: '2025-03-15T00:00:00Z' },
        order: { company_id: user.companyId },
      }),
    ]);

    // Filter by January to February
    const { listRentalViews } = await sdk.ListRentalViews({
      filter: {
        startDateFrom: '2025-01-01T00:00:00Z',
        startDateTo: '2025-02-28T23:59:59Z',
      },
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(2);
    const rentalIds = listRentalViews.items.map((r) => r.rentalId);
    expect(rentalIds).toContain('rental-jan');
    expect(rentalIds).toContain('rental-feb');
    expect(rentalIds).not.toContain('rental-mar');
  });

  it('filters rental views by order_id', async () => {
    const { sdk, user } = await createClient();

    // Seed rentals for different orders
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-1',
        order: { company_id: user.companyId, order_id: 'order-123' },
      }),
      createTestRentalView({
        rental_id: 'rental-2',
        order: { company_id: user.companyId, order_id: 'order-123' },
      }),
      createTestRentalView({
        rental_id: 'rental-3',
        order: { company_id: user.companyId, order_id: 'order-456' },
      }),
    ]);

    // Filter by specific order
    const { listRentalViews } = await sdk.ListRentalViews({
      filter: { orderId: 'order-123' },
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(2);
    listRentalViews.items.forEach((rental) => {
      expect(rental.order?.orderId).toBe('order-123');
    });
  });

  it('isolates rental views between different companies', async () => {
    // Create two clients with different companies
    const { sdk: sdkA } = await createClient({
      userId: 'userA',
      companyId: 'companyA',
    });
    const { sdk: sdkB } = await createClient({
      userId: 'userB',
      companyId: 'companyB',
    });

    // Seed rentals for both companies
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-companyA-1',
        order: { company_id: 'companyA', order_id: 'order-A1' },
      }),
      createTestRentalView({
        rental_id: 'rental-companyA-2',
        order: { company_id: 'companyA', order_id: 'order-A2' },
      }),
      createTestRentalView({
        rental_id: 'rental-companyB-1',
        order: { company_id: 'companyB', order_id: 'order-B1' },
      }),
    ]);

    // Company A queries - should only see their rentals
    const resultA = await sdkA.ListRentalViews({
      page: { number: 1, size: 10 },
    });

    expect(resultA.listRentalViews).toBeDefined();
    if (!resultA.listRentalViews) {
      throw new Error('Expected resultA.listRentalViews');
    }

    expect(resultA.listRentalViews.items).toHaveLength(2);
    const rentalIdsA = resultA.listRentalViews.items.map((r) => r.rentalId);
    expect(rentalIdsA).toContain('rental-companyA-1');
    expect(rentalIdsA).toContain('rental-companyA-2');
    expect(rentalIdsA).not.toContain('rental-companyB-1');

    // Company B queries - should only see their rentals
    const resultB = await sdkB.ListRentalViews({
      page: { number: 1, size: 10 },
    });

    expect(resultB.listRentalViews).toBeDefined();
    if (!resultB.listRentalViews) {
      throw new Error('Expected resultB.listRentalViews');
    }

    expect(resultB.listRentalViews.items).toHaveLength(1);
    expect(resultB.listRentalViews.items[0].rentalId).toBe('rental-companyB-1');
  });

  it('returns empty results when no rentals match filters', async () => {
    const { sdk, user } = await createClient();

    // Seed some rentals
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-1',
        status: { id: '1', name: 'Active' },
        details: { rental_status_id: '1' },
        order: { company_id: user.companyId },
      }),
    ]);

    // Query with impossible filter
    const { listRentalViews } = await sdk.ListRentalViews({
      filter: { rentalStatusId: '999' }, // Non-existent status
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(0);
    expect(listRentalViews.page.totalItems).toBe(0);
    expect(listRentalViews.page.totalPages).toBe(0);
  });

  it('properly maps nested data structures', async () => {
    const { sdk, user } = await createClient();

    // Seed a rental with complete nested data
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertOne(
      createTestRentalView({
        rental_id: 'rental-nested',
        order: {
          company_id: user.companyId,
          order_id: 'order-123',
          company_name: 'Test Company Inc',
          order_status_name: 'Open',
        },
        asset: {
          asset_id: 'asset-456',
          details: {
            asset_id: 'asset-456',
            name: 'Excavator XL',
            description: 'Large excavator',
            custom_name: null,
            model: null,
            year: null,
            tracker_id: null,
            vin: null,
            serial_number: null,
            driver_name: null,
            camera_id: null,
            photo_id: null,
          },
          company: {
            id: user.companyId,
            name: 'Test Company Inc',
          },
        },
        status: {
          id: '2',
          name: 'On Rent',
        },
        details: {
          price: '1500.00',
          start_date: '2025-01-20T00:00:00Z',
          end_date: '2025-02-20T00:00:00Z',
        },
      }),
    );

    // Query and verify all nested data is present
    const { listRentalViews } = await sdk.ListRentalViews({
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(1);
    const rental = listRentalViews.items[0];

    // Verify main fields
    expect(rental.rentalId).toBe('rental-nested');

    // Verify details
    expect(rental.details).toBeDefined();
    expect(rental.details?.price).toBe('1500.00');
    expect(rental.details?.startDate).toBe('2025-01-20T00:00:00Z');
    expect(rental.details?.endDate).toBe('2025-02-20T00:00:00Z');

    // Verify asset data
    expect(rental.asset).toBeDefined();
    expect(rental.asset?.assetId).toBe('asset-456');
    expect(rental.asset?.details?.name).toBe('Excavator XL');
    expect(rental.asset?.details?.description).toBe('Large excavator');
    expect(rental.asset?.company?.name).toBe('Test Company Inc');

    // Verify status
    expect(rental.status).toBeDefined();
    expect(rental.status?.id).toBe('2');
    expect(rental.status?.name).toBe('On Rent');

    // Verify order data
    expect(rental.order).toBeDefined();
    expect(rental.order?.orderId).toBe('order-123');
    expect(rental.order?.companyName).toBe('Test Company Inc');
    expect(rental.order?.orderStatusName).toBe('Open');
  });

  it('combines multiple filters correctly', async () => {
    const { sdk, user } = await createClient();

    // Seed rentals with various combinations
    const collection = mongoClient.db('es-erp').collection(COLLECTION_NAME);
    await collection.insertMany([
      createTestRentalView({
        rental_id: 'rental-match',
        status: { id: '1', name: 'Active' },
        details: {
          rental_status_id: '1',
          start_date: '2025-01-15T00:00:00Z',
        },
        order: { company_id: user.companyId, order_id: 'order-123' },
      }),
      createTestRentalView({
        rental_id: 'rental-wrong-status',
        status: { id: '2', name: 'Completed' },
        details: {
          rental_status_id: '2',
          start_date: '2025-01-15T00:00:00Z',
        },
        order: { company_id: user.companyId, order_id: 'order-123' },
      }),
      createTestRentalView({
        rental_id: 'rental-wrong-date',
        status: { id: '1', name: 'Active' },
        details: {
          rental_status_id: '1',
          start_date: '2025-03-15T00:00:00Z',
        },
        order: { company_id: user.companyId, order_id: 'order-123' },
      }),
      createTestRentalView({
        rental_id: 'rental-wrong-order',
        status: { id: '1', name: 'Active' },
        details: {
          rental_status_id: '1',
          start_date: '2025-01-15T00:00:00Z',
        },
        order: { company_id: user.companyId, order_id: 'order-456' },
      }),
    ]);

    // Query with multiple filters - should match only one rental
    const { listRentalViews } = await sdk.ListRentalViews({
      filter: {
        rentalStatusId: '1',
        startDateFrom: '2025-01-01T00:00:00Z',
        startDateTo: '2025-02-01T00:00:00Z',
        orderId: 'order-123',
      },
      page: { number: 1, size: 10 },
    });

    expect(listRentalViews).toBeDefined();
    if (!listRentalViews) throw new Error('Expected listRentalViews');

    expect(listRentalViews.items).toHaveLength(1);
    expect(listRentalViews.items[0].rentalId).toBe('rental-match');
  });
});
