import Sqids from 'sqids';
import crypto from 'crypto';

const sqids = new Sqids({
  // Uppercase, no ambiguous chars, 8+ chars for entropy
  alphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  minLength: 8,
});

/**
 * Generates a unique ID with a given prefix, encoding the tenantId and a random value.
 *
 * --- Collision Resistance ---
 * - The tenant component is 32 bits (from the first 4 bytes of SHA-256(tenantId)), giving 4.3 billion possible tenant hashes.
 * - The random component is 32 bits (crypto-random), giving 4.3 billion possible values per tenant.
 * - For a single tenant, you can generate about 77,000 unique IDs before the probability of a collision reaches 1% (birthday bound).
 * - For most business use cases, this is highly collision-resistant and IDs remain short and user-friendly.
 * - If you need to generate millions of IDs per tenant, consider increasing the random component to 48 bits (at the cost of longer IDs).
 *
 * Example: PO-E2H55S32WX
 * @param prefix e.g. "PO", "WO", "SO", "BIZ", "PER"
 * @param tenantId string (will be hashed to a number)
 * @returns string in the format PREFIX-<sqid>
 */
export function generateId(prefix: string, tenantId: string): string {
  // Convert tenantId to a conflict-resistant number (32 bits)
  const hash = crypto.createHash('sha256').update(tenantId).digest();
  const tenantNum = hash.readUInt32BE(0);

  // Generate a random 32-bit number
  const randomNum = crypto.randomBytes(4).readUInt32BE(0);

  // Encode both numbers with Sqids (number array)
  const sqid = sqids.encode([tenantNum, randomNum]);

  return `${prefix}-${sqid}`;
}

/**
 * Verifies if a given ID was generated for the provided tenantId.
 * @param id The full ID string (e.g., "PO-E2H55S32WX")
 * @param tenantId The tenantId to check against (string)
 * @returns true if the ID matches the tenant, false otherwise
 */
export function isIdFromTenant(id: string, tenantId: string): boolean {
  // Extract the sqid part (after the first dash)
  const dashIdx = id.indexOf('-');
  if (dashIdx === -1 || dashIdx === id.length - 1) return false;
  const sqid = id.slice(dashIdx + 1);

  // Decode the sqid
  const decoded = sqids.decode(sqid);
  if (!decoded || decoded.length < 2) return false;

  // Recompute tenantNum from tenantId
  const hash = crypto.createHash('sha256').update(tenantId).digest();
  const tenantNum = hash.readUInt32BE(0);

  // Compare the first decoded value to tenantNum
  return decoded[0] === tenantNum;
}
