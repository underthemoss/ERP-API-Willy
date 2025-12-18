import { table, retry } from './utils/test-helpers.generated';

describe('Migration: add-esdb-assets', () => {
  describe('ESDB_ASSET_MATERIALIZED_VIEW', () => {
    it('should aggregate asset with all relationships', async () => {
      const testAssetId = 'test-asset-full-001';
      const testCompanyId = 'test-company-001';
      const testAssetTypeId = 'test-asset-type-001';
      const testMakeId = 'test-make-001';
      const testModelId = 'test-model-001';
      const testClassId = 'test-class-001';
      const testBranchId = 'test-branch-001';
      const testGroupId = 'test-group-001';
      const testOrgXrefId = 'test-org-xref-001';
      const testTspId = 'test-tsp-001';
      const testTrackerId = 'test-tracker-001';
      const testPhotoId = 'test-photo-001';
      const testKeypadId = 'test-keypad-001';

      // 1. Insert lookup data
      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Test Asset Company',
      });

      await table('ESDB_PUBLIC_ASSET_TYPES').insert({
        asset_type_id: testAssetTypeId,
        name: 'Excavator',
      });

      await table('ESDB_PUBLIC_EQUIPMENT_MAKES').insert({
        equipment_make_id: testMakeId,
        name: 'Caterpillar',
      });

      await table('ESDB_PUBLIC_EQUIPMENT_MODELS').insert({
        equipment_model_id: testModelId,
        name: 'CAT 320',
      });

      await table('ESDB_PUBLIC_EQUIPMENT_CLASSES').insert({
        equipment_class_id: testClassId,
        name: 'Heavy Equipment',
        description: 'Large construction equipment',
      });

      await table('ESDB_PUBLIC_MARKETS').insert({
        market_id: testBranchId,
        name: 'Test Branch',
        description: 'Test branch location',
        company_id: testCompanyId,
      });

      await table('ESDB_PUBLIC_ORGANIZATIONS').insert({
        organization_id: testGroupId,
        name: 'Test Organization',
        company_id: testCompanyId,
      });

      await table('ESDB_PUBLIC_TRACKERS').insert({
        tracker_id: testTrackerId,
        device_serial: 'TRACKER-123',
        company_id: testCompanyId,
        vendor_id: 'vendor-001',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
        tracker_type_id: 'type-001',
      });

      await table('ESDB_PUBLIC_PHOTOS').insert({
        photo_id: testPhotoId,
        filename: 'excavator.jpg',
      });

      // 2. Insert asset
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        asset_type_id: testAssetTypeId,
        name: 'Test Excavator',
        description: 'Heavy duty excavator',
        custom_name: 'Big Digger',
        model: 'Model 320',
        year: '2023',
        company_id: testCompanyId,
        tracker_id: testTrackerId,
        vin: 'VIN123456789',
        serial_number: 'SN123456',
        equipment_make_id: testMakeId,
        equipment_model_id: testModelId,
        equipment_class_id: testClassId,
        service_branch_id: testBranchId,
        inventory_branch_id: testBranchId,
        rental_branch_id: testBranchId,
        photo_id: testPhotoId,
      });

      // 3. Insert related data
      await table('ESDB_PUBLIC_ORGANIZATION_ASSET_XREF').insert({
        organization_asset_xref_id: testOrgXrefId,
        organization_id: testGroupId,
        asset_id: testAssetId,
      });

      await table('ESDB_PUBLIC_TELEMATICS_SERVICE_PROVIDERS_ASSETS').insert({
        telematics_service_providers_asset_id: testTspId,
        asset_id: testAssetId,
        company_id: testCompanyId,
      });

      await table('ESDB_PUBLIC_KEYPADS').insert({
        keypad_id: testKeypadId,
        asset_id: testAssetId,
      });

      // 4. Verify data in materialized view
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );

        // Verify asset exists
        expect(asset).toBeDefined();
        expect(asset.asset_id).toBe(testAssetId);

        // Verify asset details
        expect(asset.details).toBeDefined();
        expect(asset.details?.name).toBe('Test Excavator');
        expect(asset.details?.description).toBe('Heavy duty excavator');
        expect(asset.details?.vin).toBe('VIN123456789');

        // Verify company
        expect(asset.company).toBeDefined();
        expect(asset.company?.name).toBe('Test Asset Company');

        // Verify type
        expect(asset.type).toBeDefined();
        expect(asset.type?.name).toBe('Excavator');

        // Verify make
        expect(asset.make).toBeDefined();
        expect(asset.make?.name).toBe('Caterpillar');

        // Verify model
        expect(asset.model).toBeDefined();
        expect(asset.model?.name).toBe('CAT 320');

        // Verify class
        expect(asset.class).toBeDefined();
        expect(asset.class?.name).toBe('Heavy Equipment');

        // Verify branches
        expect(asset.inventory_branch).toBeDefined();
        expect(asset.inventory_branch?.name).toBe('Test Branch');
        expect(asset.msp_branch).toBeDefined();
        expect(asset.msp_branch?.name).toBe('Test Branch');
        expect(asset.rsp_branch).toBeDefined();
        expect(asset.rsp_branch?.name).toBe('Test Branch');

        // Verify groups array
        expect(asset.groups).toBeDefined();
        expect(Array.isArray(asset.groups)).toBe(true);
        expect(asset.groups).toHaveLength(1);
        expect(asset.groups![0].name).toBe('Test Organization');

        // Verify TSP companies array
        expect(asset.tsp_companies).toBeDefined();
        expect(Array.isArray(asset.tsp_companies)).toBe(true);
        expect(asset.tsp_companies).toHaveLength(1);
        expect(asset.tsp_companies![0].company_name).toBe('Test Asset Company');

        // Verify tracker
        expect(asset.tracker).toBeDefined();
        expect(asset.tracker?.device_serial).toBe('TRACKER-123');

        // Verify photo
        expect(asset.photo).toBeDefined();
        expect(asset.photo?.filename).toBe('excavator.jpg');

        // Verify keypads array
        expect(asset.keypad).toBeDefined();
        expect(Array.isArray(asset.keypad)).toBe(true);
        expect(asset.keypad).toHaveLength(1);
        expect(asset.keypad![0]).toBe(testKeypadId);
      });
    });

    it('should handle RSP branch as nullable', async () => {
      const testAssetId = 'test-asset-rsp-002';
      const testCompanyId = 'test-company-rsp-002';
      const testBranchId = 'test-branch-rsp-002';

      // Insert lookup data
      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'RSP Test Company',
      });

      await table('ESDB_PUBLIC_MARKETS').insert({
        market_id: testBranchId,
        name: 'RSP Test Branch',
        company_id: testCompanyId,
      });

      // Insert asset WITH RSP branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        rental_branch_id: testBranchId,
      });

      // Verify RSP branch is set
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.rsp_branch).toBeDefined();
        expect(asset.rsp_branch?.name).toBe('RSP Test Branch');
      });

      // Update asset to remove RSP branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        rental_branch_id: null,
      });

      // Verify RSP branch is now null
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.rsp_branch).toBeNull();
      });
    });

    it('should handle MSP branch as nullable', async () => {
      const testAssetId = 'test-asset-msp-003';
      const testCompanyId = 'test-company-msp-003';
      const testBranchId = 'test-branch-msp-003';

      // Insert lookup data
      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'MSP Test Company',
      });

      await table('ESDB_PUBLIC_MARKETS').insert({
        market_id: testBranchId,
        name: 'MSP Test Branch',
        company_id: testCompanyId,
      });

      // Insert asset WITH MSP branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        service_branch_id: testBranchId,
      });

      // Verify MSP branch is set
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.msp_branch).toBeDefined();
        expect(asset.msp_branch?.name).toBe('MSP Test Branch');
      });

      // Update asset to remove MSP branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        service_branch_id: null,
      });

      // Verify MSP branch is now null
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.msp_branch).toBeNull();
      });
    });

    it('should handle inventory branch as nullable', async () => {
      const testAssetId = 'test-asset-inv-004';
      const testCompanyId = 'test-company-inv-004';
      const testBranchId = 'test-branch-inv-004';

      // Insert lookup data
      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Inventory Test Company',
      });

      await table('ESDB_PUBLIC_MARKETS').insert({
        market_id: testBranchId,
        name: 'Inventory Test Branch',
        company_id: testCompanyId,
      });

      // Insert asset WITH inventory branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        inventory_branch_id: testBranchId,
      });

      // Verify inventory branch is set
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.inventory_branch).toBeDefined();
        expect(asset.inventory_branch?.name).toBe('Inventory Test Branch');
      });

      // Update asset to remove inventory branch
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        inventory_branch_id: null,
      });

      // Verify inventory branch is now null
      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(
          testAssetId,
        );
        expect(asset).toBeDefined();
        expect(asset.inventory_branch).toBeNull();
      });
    });

    it('should create basic asset with company relationship', async () => {
      const testAssetId = 'test-asset-basic-001';
      const testCompanyId = 'test-company-basic-001';

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Basic Test Company',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        name: 'Basic Test Asset',
      });

      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(testAssetId);
        expect(asset).toBeDefined();
        expect(asset.details?.name).toBe('Basic Test Asset');
        expect(asset.company?.name).toBe('Basic Test Company');
      });
    });

    it('should update asset details', async () => {
      const testAssetId = 'test-asset-update-002';
      const testCompanyId = 'test-company-update-002';

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Update Test Company',
      });

      // Create initial asset
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        name: 'Original Name',
        vin: 'VIN-ORIGINAL',
      });

      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(testAssetId);
        expect(asset.details?.name).toBe('Original Name');
        expect(asset.details?.vin).toBe('VIN-ORIGINAL');
      });

      // Update asset
      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        name: 'Updated Name',
        vin: 'VIN-UPDATED',
      });

      await retry(async () => {
        const asset = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(testAssetId);
        expect(asset.details?.name).toBe('Updated Name');
        expect(asset.details?.vin).toBe('VIN-UPDATED');
      });
    });

    it('should handle multiple assets for same company', async () => {
      const testCompanyId = 'test-company-multi-003';
      const testAsset1Id = 'test-asset-multi-003-1';
      const testAsset2Id = 'test-asset-multi-003-2';

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Multi Asset Company',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAsset1Id,
        company_id: testCompanyId,
        name: 'Asset One',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAsset2Id,
        company_id: testCompanyId,
        name: 'Asset Two',
      });

      await retry(async () => {
        const asset1 = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(testAsset1Id);
        const asset2 = await table('ESDB_ASSET_MATERIALIZED_VIEW').get(testAsset2Id);
        
        expect(asset1.details?.name).toBe('Asset One');
        expect(asset1.company?.name).toBe('Multi Asset Company');
        
        expect(asset2.details?.name).toBe('Asset Two');
        expect(asset2.company?.name).toBe('Multi Asset Company');
      });
    });

    it('should delete record when tombstoned', async () => {
      const testAssetId = 'test-asset-tombstone-005';
      const testCompanyId = 'test-company-tombstone-005';

      await table('ESDB_PUBLIC_COMPANIES').insert({
        company_id: testCompanyId,
        name: 'Tombstone Test Company',
      });

      await table('ESDB_PUBLIC_ASSETS').insert({
        asset_id: testAssetId,
        company_id: testCompanyId,
        name: 'Tombstone Test Asset',
      });

      // Verify the asset company relationship exists
      await retry(async () => {
        const assetCompany = await table('ESDB_ASSET_COMPANY').get(
          testAssetId,
        );
        expect(assetCompany).toBeDefined();
        expect(assetCompany.company).toBeDefined();
        expect(assetCompany.company?.name).toBe('Tombstone Test Company');
      });

      // Tombstone the ASSET (not the company) to delete the derived row
      await table('ESDB_PUBLIC_ASSETS').tombstone(testAssetId);

      // Verify the derived table row is deleted
      await retry(async () => {
        const assetCompany = await table('ESDB_ASSET_COMPANY').get(
          testAssetId,
        );
        expect(assetCompany).toBeUndefined();
      });
    });
  });
});
