import { table, retry } from './utils/test-helpers.generated';

describe('Migration: add-order-materialized-view', () => {
  describe('ESDB_ORDER_MATERIALIZED_VIEW', () => {
    it('should aggregate order with rentals from source tables', async () => {
      const testOrderId = 'test-order-mv-001';
      const testRentalId = 'test-rental-mv-001';
      const testCompanyId = 'test-company-mv-001';
      const testUserId = 'test-user-mv-001';
      const testAssetId = 'test-asset-mv-001';

      // 1. Insert lookup data and asset
      await table('ESDB_PUBLIC_ORDER_STATUSES').insert({
        order_status_id: 'status-1',
        name: 'Pending',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        name: 'Test Excavator',
        description: 'Heavy equipment for testing',
        company_id: testCompanyId,
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Test Company',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john.doe@test.com',
        username: 'johndoe',
      });

      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'rental-status-1',
        name: 'Active',
      });

      // 2. Insert order (will flow through pipeline to ESDB_ORDER_ENRICHED)
      await table('ESDB_PUBLIC_ORDERS').insert({
        order_id: testOrderId,
        order_status_id: 'status-1',
        company_id: testCompanyId,
        user_id: testUserId,
        date_created: '2025-01-01T00:00:00Z',
        date_updated: '2025-01-01T00:00:00Z',
      });

      // 3. Insert rental (will flow through pipeline to ESDB_RENTAL_MATERIALIZED_VIEW)
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRentalId,
        borrower_user_id: testUserId,
        rental_status_id: 'rental-status-1',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '1000.00',
        order_id: testOrderId,
        asset_id: testAssetId,
        deleted: 'false',
      });

      // 4. Verify data propagated through pipeline to final materialized view
      await retry(async () => {
        const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(
          testOrderId,
        );

        // Verify order exists
        expect(order).toBeDefined();
        expect(order.order_id).toBe(testOrderId);

        // Verify order details structure
        expect(order.details).toBeDefined();
        expect(order.details?.order_id).toBe(testOrderId);
        expect(order.details?.order_status_name).toBe('Pending');
        expect(order.details?.company_name).toBe('Test Company');
        expect(order.details?.user_first_name).toBe('John');
        expect(order.details?.user_last_name).toBe('Doe');
        expect(order.details?.user_email).toBe('john.doe@test.com');

        // Verify rentals array
        expect(order.rentals).toBeDefined();
        expect(Array.isArray(order.rentals)).toBe(true);
        expect(order.rentals).toHaveLength(1);

        // Verify rental details (flattened structure)
        const rental = order.rentals![0];
        expect(rental.rental_id).toBe(testRentalId);
        expect(rental.order_id).toBe(testOrderId);
        expect(rental.price).toBe('1000.00');

        // Verify rental asset (flattened structure)
        expect(rental.asset_id).toBe(testAssetId);
        expect(rental.asset_name).toBe('Test Excavator');

        // Verify rental status (flattened structure)
        expect(rental.status_name).toBe('Active');
      });
    });

    it('should handle order with no rentals', async () => {
      const testOrderId = 'test-order-no-rentals';
      const testCompanyId = 'test-company-no-rentals';
      const testUserId = 'test-user-no-rentals';

      // Insert lookup data
      await table('ESDB_PUBLIC_ORDER_STATUSES').insert({
        order_status_id: 'status-2',
        name: 'Draft',
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Company Without Rentals',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Jane',
        last_name: 'Smith',
        email_address: 'jane.smith@test.com',
        username: 'janesmith',
      });

      // Insert order without any rentals
      await table('ESDB_PUBLIC_ORDERS').insert({
        order_id: testOrderId,
        order_status_id: 'status-2',
        company_id: testCompanyId,
        user_id: testUserId,
        date_created: '2025-01-01T00:00:00Z',
        date_updated: '2025-01-01T00:00:00Z',
      });

      // Verify order exists with empty rentals array
      await retry(async () => {
        const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(
          testOrderId,
        );

        expect(order).toBeDefined();
        expect(order.order_id).toBe(testOrderId);
        expect(order.details?.company_name).toBe('Company Without Rentals');

        // Verify rentals is null or empty array (LEFT JOIN with no matches)
        expect(order.rentals === null || order.rentals?.length === 0).toBe(true);
      });
    });

    it('should aggregate multiple rentals for same order', async () => {
      const testOrderId = 'test-order-multi-rentals';
      const testRental1Id = 'test-rental-1';
      const testRental2Id = 'test-rental-2';
      const testRental3Id = 'test-rental-3';
      const testCompanyId = 'test-company-multi';
      const testUserId = 'test-user-multi';
      const testAsset1Id = 'test-asset-1';
      const testAsset2Id = 'test-asset-2';

      // Insert lookup data
      await table('ESDB_PUBLIC_ORDER_STATUSES').insert({
        order_status_id: 'status-3',
        name: 'Confirmed',
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Multi Rental Company',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Bob',
        last_name: 'Johnson',
        email_address: 'bob.johnson@test.com',
        username: 'bobjohnson',
      });

      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-active',
        name: 'Active',
      });

      // Insert assets
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAsset1Id,
        name: 'Excavator 1',
        description: 'First excavator',
        company_id: testCompanyId,
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAsset2Id,
        name: 'Excavator 2',
        description: 'Second excavator',
        company_id: testCompanyId,
      });

      // Insert order
      await table('ESDB_PUBLIC_ORDERS').insert({
        order_id: testOrderId,
        order_status_id: 'status-3',
        company_id: testCompanyId,
        user_id: testUserId,
        date_created: '2025-01-01T00:00:00Z',
        date_updated: '2025-01-01T00:00:00Z',
      });

      // Insert multiple rentals for the same order
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental1Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-active',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '1000.00',
        order_id: testOrderId,
        asset_id: testAsset1Id,
        deleted: 'false',
      });

      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental2Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-active',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-15T00:00:00Z',
        price: '1500.00',
        order_id: testOrderId,
        asset_id: testAsset2Id,
        deleted: 'false',
      });

      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental3Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-active',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-20T00:00:00Z',
        price: '2000.00',
        order_id: testOrderId,
        asset_id: testAsset1Id, // Reusing asset 1
        deleted: 'false',
      });

      // Verify all rentals are aggregated
      await retry(async () => {
        const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(
          testOrderId,
        );

        expect(order).toBeDefined();
        expect(order.order_id).toBe(testOrderId);

        // Verify rentals array contains all 3 rentals
        expect(order.rentals).toBeDefined();
        expect(Array.isArray(order.rentals)).toBe(true);
        expect(order.rentals).toHaveLength(3);

        // Verify each rental's price (flattened structure)
        const prices = order.rentals!.map((r) => r.price).sort();
        expect(prices).toEqual(['1000.00', '1500.00', '2000.00']);

        // Verify rental IDs are all present (flattened structure)
        const rentalIds = order.rentals!.map((r) => r.rental_id).sort();
        expect(rentalIds).toEqual([testRental1Id, testRental2Id, testRental3Id].sort());
      });
    });

    it('should exclude deleted rentals', async () => {
      const testOrderId = 'test-order-deleted-rental';
      const testRental1Id = 'test-rental-active';
      const testRental2Id = 'test-rental-deleted';
      const testCompanyId = 'test-company-deleted';
      const testUserId = 'test-user-deleted';
      const testAssetId = 'test-asset-deleted';

      // Insert lookup data
      await table('ESDB_PUBLIC_ORDER_STATUSES').insert({
        order_status_id: 'status-4',
        name: 'Active',
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Company With Deleted Rental',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Alice',
        last_name: 'Williams',
        email_address: 'alice.williams@test.com',
        username: 'alicewilliams',
      });

      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-cancelled',
        name: 'Cancelled',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        name: 'Test Equipment',
        description: 'Equipment for testing',
        company_id: testCompanyId,
      });

      // Insert order
      await table('ESDB_PUBLIC_ORDERS').insert({
        order_id: testOrderId,
        order_status_id: 'status-4',
        company_id: testCompanyId,
        user_id: testUserId,
        date_created: '2025-01-01T00:00:00Z',
        date_updated: '2025-01-01T00:00:00Z',
      });

      // Insert active rental
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental1Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-cancelled',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '1000.00',
        order_id: testOrderId,
        asset_id: testAssetId,
        deleted: 'false',
      });

      // Insert deleted rental (should be filtered out)
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental2Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-cancelled',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-15T00:00:00Z',
        price: '1500.00',
        order_id: testOrderId,
        asset_id: testAssetId,
        deleted: 'true', // Marked as deleted
      });

      // Verify only active rental appears
      await retry(async () => {
        const order = await table('ESDB_ORDER_MATERIALIZED_VIEW').get(
          testOrderId,
        );

        expect(order).toBeDefined();
        expect(order.order_id).toBe(testOrderId);

        // Should only have 1 rental (the deleted one is filtered)
        expect(order.rentals).toBeDefined();
        expect(Array.isArray(order.rentals)).toBe(true);
        expect(order.rentals).toHaveLength(1);

        // Verify it's the active rental
        const rental = order.rentals![0];
        expect(rental.rental_id).toBe(testRental1Id);
        expect(rental.price).toBe('1000.00');
      });
    });
  });
});
