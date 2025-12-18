import { generateId, isIdFromTenant } from '../id-generator';

describe('id-generator', () => {
  it('generates an ID with the correct prefix and format', () => {
    const id = generateId('PO', 'tenant-123');
    expect(id.startsWith('PO-')).toBe(true);
    expect(id.length).toBeGreaterThan(6);
    // Should only contain allowed chars
    expect(id).toMatch(/^PO-[A-Z0-9]+$/);
  });

  it('IDs are unique for the same tenant and prefix', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId('SO', 'tenant-abc'));
    }
    expect(ids.size).toBe(100);
  });

  it('isIdFromTenant returns true for correct tenant', () => {
    const tenantId = 'company-xyz';
    const id = generateId('BIZ', tenantId);
    expect(isIdFromTenant(id, tenantId)).toBe(true);
  });

  it('isIdFromTenant returns false for wrong tenant', () => {
    const id = generateId('PER', 'tenant-1');
    expect(isIdFromTenant(id, 'tenant-2')).toBe(false);
  });

  it('isIdFromTenant returns false for malformed ID', () => {
    expect(isIdFromTenant('INVALIDID', 'tenant-1')).toBe(false);
    expect(isIdFromTenant('PO-', 'tenant-1')).toBe(false);
    expect(isIdFromTenant('PO-$$$$$', 'tenant-1')).toBe(false);
  });

  it('works with numeric tenant IDs', () => {
    const id = generateId('PR', '12345');
    expect(isIdFromTenant(id, '12345')).toBe(true);
    expect(isIdFromTenant(id, '54321')).toBe(false);
  });

  it('IDs for different tenants are different', () => {
    const id1 = generateId('PB', 'tenantA');
    const id2 = generateId('PB', 'tenantB');
    expect(id1).not.toEqual(id2);
  });
});
