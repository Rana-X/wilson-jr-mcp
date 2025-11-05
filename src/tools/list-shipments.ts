/**
 * Tool: list_shipments
 * Lists shipments with optional filtering by status or customer email
 */

import { sql, executeQuery } from '../db.js';
import { ListShipmentsOutput, Shipment, ShipmentStatus } from '../types.js';
import { isValidShipmentStatus, isValidEmail } from '../utils/validators.js';

interface ListShipmentsInput {
  status?: ShipmentStatus;
  limit?: number;
  offset?: number;
  customer_email?: string;
}

export async function listShipments(input: ListShipmentsInput = {}): Promise<ListShipmentsOutput> {
  const limit = input.limit && input.limit > 0 ? input.limit : 50;
  const offset = input.offset && input.offset >= 0 ? input.offset : 0;

  // Validate inputs
  if (input.status && !isValidShipmentStatus(input.status)) {
    throw new Error('Invalid shipment status');
  }

  if (input.customer_email && !isValidEmail(input.customer_email)) {
    throw new Error('Invalid customer email format');
  }

  // Fetch shipments based on filters
  const shipments = await executeQuery(
    async () => {
      // Build query based on filters
      if (input.status && input.customer_email) {
        // Both filters
        return await sql<Shipment[]>`
          SELECT * FROM shipments
          WHERE status = ${input.status} AND customer_email = ${input.customer_email}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (input.status) {
        // Status filter only
        return await sql<Shipment[]>`
          SELECT * FROM shipments
          WHERE status = ${input.status}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (input.customer_email) {
        // Email filter only
        return await sql<Shipment[]>`
          SELECT * FROM shipments
          WHERE customer_email = ${input.customer_email}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        // No filters
        return await sql<Shipment[]>`
          SELECT * FROM shipments
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
    },
    'Failed to list shipments'
  );

  // Get total count based on filters
  const countResult = await executeQuery(
    async () => {
      if (input.status && input.customer_email) {
        return await sql`
          SELECT COUNT(*) as total FROM shipments
          WHERE status = ${input.status} AND customer_email = ${input.customer_email}
        `;
      } else if (input.status) {
        return await sql`
          SELECT COUNT(*) as total FROM shipments
          WHERE status = ${input.status}
        `;
      } else if (input.customer_email) {
        return await sql`
          SELECT COUNT(*) as total FROM shipments
          WHERE customer_email = ${input.customer_email}
        `;
      } else {
        return await sql`
          SELECT COUNT(*) as total FROM shipments
        `;
      }
    },
    'Failed to count shipments'
  );

  const total = parseInt(countResult[0].total, 10);

  return {
    shipments,
    total,
  };
}
