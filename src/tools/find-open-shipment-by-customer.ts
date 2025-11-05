/**
 * Tool: find_open_shipment_by_customer
 * Finds a customer's most recent open shipment when they reply without a shipment ID
 */

import { sql, executeQuery } from '../db.js';
import { FindOpenShipmentByCustomerOutput } from '../types.js';
import { isValidEmail } from '../utils/validators.js';

interface FindOpenShipmentByCustomerInput {
  customer_email: string;
}

/**
 * Find a customer's open shipment
 * Used when customer replies without [CASE-ID] in subject
 *
 * Searches for shipments with status 'pending' or 'quoted'
 * Returns the most recent one
 *
 * @param input - Customer email address
 * @returns Shipment ID or null if no open shipment found
 */
export async function findOpenShipmentByCustomer(
  input: FindOpenShipmentByCustomerInput
): Promise<FindOpenShipmentByCustomerOutput> {
  if (!isValidEmail(input.customer_email)) {
    throw new Error('Invalid customer email address');
  }

  const result = await executeQuery(
    async () => {
      return await sql`
        SELECT id FROM shipments
        WHERE customer_email = ${input.customer_email}
          AND status IN ('pending', 'quoted')
        ORDER BY created_at DESC
        LIMIT 1
      `;
    },
    'Failed to find open shipment'
  );

  // Return shipment_id or null if not found
  return {
    shipment_id: result.length > 0 ? result[0].id : null,
  };
}
