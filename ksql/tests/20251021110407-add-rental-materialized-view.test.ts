import { table, retry } from './utils/test-helpers.generated';

describe('Migration: add-rental-materialized-view', () => {
  describe('ESDB_RENTAL_MATERIALIZED_VIEW', () => {
    it('should aggregate rental with asset, status, and order', async () => {
      const testRentalId = 'test-rental-full-001';
      const testAssetId = 'test-asset-rental-001';
      const testOrderId = 'test-order-rental-001';
      const testCompanyId = 'test-company-rental-001';
      const testUserId = 'test-user-rental-001';

      // 1. Insert lookup data
      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-active',
        name: 'Active',
      });

      await table('ESDB_PUBLIC_ORDER_STATUSES').insert({
        order_status_id: 'status-confirmed',
        name: 'Confirmed',
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Test Rental Company',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'John',
        last_name: 'Renter',
        email_address: 'john.renter@test.com',
        username: 'johnrenter',
      });

      // 2. Insert asset
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        name: 'Rental Excavator',
        description: 'Heavy equipment for rent',
        company_id: testCompanyId,
      });

      // 3. Insert order
      await table('ESDB_PUBLIC_ORDERS').insert({
        order_id: testOrderId,
        order_status_id: 'status-confirmed',
        company_id: testCompanyId,
        user_id: testUserId,
        date_created: '2025-01-01T00:00:00Z',
        date_updated: '2025-01-01T00:00:00Z',
      });

      // 4. Insert rental
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRentalId,
        borrower_user_id: testUserId,
        rental_status_id: 'status-active',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '1500.00',
        order_id: testOrderId,
        asset_id: testAssetId,
        deleted: 'false',
      });

      // 5. Verify data in materialized view
      await retry(async () => {
        const rental = await table('ESDB_RENTAL_MATERIALIZED_VIEW').get(
          testRentalId,
        );

        // Verify rental exists
        expect(rental).toBeDefined();
        expect(rental.rental_id).toBe(testRentalId);

        // Verify rental details
        expect(rental.details).toBeDefined();
        expect(rental.details?.rental_id).toBe(testRentalId);
        expect(rental.details?.price).toBe('1500.00');
        expect(rental.details?.order_id).toBe(testOrderId);
        expect(rental.details?.asset_id).toBe(testAssetId);

        // Verify asset joined
        expect(rental.asset).toBeDefined();
        expect(rental.asset?.asset_id).toBe(testAssetId);
        expect(rental.asset?.details?.name).toBe('Rental Excavator');

        // Verify status joined
        expect(rental.status).toBeDefined();
        expect(rental.status?.name).toBe('Active');

        // Verify order joined
        expect(rental.order).toBeDefined();
        expect(rental.order?.order_id).toBe(testOrderId);
        expect(rental.order?.company_name).toBe('Test Rental Company');
      });
    });

    it('should exclude deleted rentals', async () => {
      const testRental1Id = 'test-rental-active-002';
      const testRental2Id = 'test-rental-deleted-002';
      const testCompanyId = 'test-company-deleted-002';
      const testUserId = 'test-user-deleted-002';

      // Insert lookup data
      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-cancelled',
        name: 'Cancelled',
      });

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Delete Test Company',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Jane',
        last_name: 'Deleter',
        email_address: 'jane.deleter@test.com',
        username: 'janedeleter',
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
        deleted: 'false',
      });

      // Insert deleted rental (should be filtered)
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRental2Id,
        borrower_user_id: testUserId,
        rental_status_id: 'status-cancelled',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '2000.00',
        deleted: 'true', // This should be filtered out
      });

      // Verify only active rental appears
      await retry(async () => {
        const rental1 = await table('ESDB_RENTAL_MATERIALIZED_VIEW').get(
          testRental1Id,
        );
        expect(rental1).toBeDefined();
        expect(rental1.details?.price).toBe('1000.00');
      });

      // Verify deleted rental does NOT appear
      await retry(async () => {
        const rental2 = await table('ESDB_RENTAL_MATERIALIZED_VIEW').get(
          testRental2Id,
        );
        expect(rental2).toBeUndefined();
      });
    });

    it('should handle rental without asset', async () => {
      const testRentalId = 'test-rental-no-asset-003';
      const testUserId = 'test-user-no-asset-003';

      // Insert lookup data
      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-pending',
        name: 'Pending',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Bob',
        last_name: 'NoAsset',
        email_address: 'bob.noasset@test.com',
        username: 'bobnoasset',
      });

      // Insert rental without asset_id
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRentalId,
        borrower_user_id: testUserId,
        rental_status_id: 'status-pending',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '500.00',
        asset_id: null, // No asset
        deleted: 'false',
      });

      // Verify rental exists with null asset
      await retry(async () => {
        const rental = await table('ESDB_RENTAL_MATERIALIZED_VIEW').get(
          testRentalId,
        );

        expect(rental).toBeDefined();
        expect(rental.rental_id).toBe(testRentalId);
        expect(rental.details?.price).toBe('500.00');

        // Asset should be null (LEFT JOIN with no match)
        expect(rental.asset).toBeNull();
      });
    });

    it('should handle rental without order', async () => {
      const testRentalId = 'test-rental-no-order-004';
      const testUserId = 'test-user-no-order-004';

      // Insert lookup data
      await table('ESDB_PUBLIC_RENTAL_STATUSES').insert({
        rental_status_id: 'status-draft',
        name: 'Draft',
      });

      await table('ESDB_PUBLIC_USERS').insert({
        user_id: testUserId,
        first_name: 'Alice',
        last_name: 'NoOrder',
        email_address: 'alice.noorder@test.com',
        username: 'alicenoorder',
      });

      // Insert rental without order_id
      await table('ESDB_PUBLIC_RENTALS').insert({
        rental_id: testRentalId,
        borrower_user_id: testUserId,
        rental_status_id: 'status-draft',
        date_created: '2025-01-01T00:00:00Z',
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-10T00:00:00Z',
        price: '750.00',
        order_id: null, // No order
        deleted: 'false',
      });

      // Verify rental exists with null order
      await retry(async () => {
        const rental = await table('ESDB_RENTAL_MATERIALIZED_VIEW').get(
          testRentalId,
        );

        expect(rental).toBeDefined();
        expect(rental.rental_id).toBe(testRentalId);
        expect(rental.details?.price).toBe('750.00');

        // Order should be null (LEFT JOIN with no match)
        expect(rental.order).toBeNull();
      });
    });
  });
});
