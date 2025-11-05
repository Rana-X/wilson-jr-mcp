/**
 * Tool: create_shipment
 * Creates a new shipment in the database
 */

import { sql, executeQuery } from '../db.js';
import { CreateShipmentInput, CreateShipmentOutput } from '../types.js';
import { generateShipmentId } from '../utils/id-generator.js';
import { isValidEmail, isNonEmptyString, isValidDateString } from '../utils/validators.js';

export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentOutput> {
  // Validate required fields
  if (!isValidEmail(input.customer_email)) {
    throw new Error('Invalid customer email address');
  }

  if (!isNonEmptyString(input.customer_name)) {
    throw new Error('Customer name is required');
  }

  if (!isNonEmptyString(input.pickup_address)) {
    throw new Error('Pickup address is required');
  }

  if (!isNonEmptyString(input.delivery_address)) {
    throw new Error('Delivery address is required');
  }

  // Validate dates if provided
  if (input.pickup_date && !isValidDateString(input.pickup_date)) {
    throw new Error('Invalid pickup date format (use ISO 8601)');
  }

  if (input.delivery_date && !isValidDateString(input.delivery_date)) {
    throw new Error('Invalid delivery date format (use ISO 8601)');
  }

  // Generate new shipment ID
  const shipmentId = await generateShipmentId();

  // Insert shipment into database
  const result = await executeQuery(
    async () => {
      const inserted = await sql`
        INSERT INTO shipments (
          id,
          customer_email,
          customer_name,
          status,
          pickup_address,
          pickup_date,
          delivery_address,
          delivery_date,
          cargo_type,
          load_type,
          weight_kg,
          volume_cbm,
          loading_requirements,
          unloading_requirements,
          special_notes,
          cargo_details,
          priority,
          wilson_agent,
          created_at,
          updated_at
        ) VALUES (
          ${shipmentId},
          ${input.customer_email},
          ${input.customer_name},
          'pending',
          ${input.pickup_address},
          ${input.pickup_date || null},
          ${input.delivery_address},
          ${input.delivery_date || null},
          ${input.cargo_type || null},
          ${input.load_type || null},
          ${input.weight_kg || null},
          ${input.volume_cbm || null},
          ${input.loading_requirements || null},
          ${input.unloading_requirements || null},
          ${input.special_notes || null},
          ${input.cargo_details ? JSON.stringify(input.cargo_details) : null},
          ${input.priority || null},
          ${input.wilson_agent || null},
          NOW(),
          NOW()
        )
        RETURNING id, created_at
      `;
      return inserted[0];
    },
    'Failed to create shipment'
  );

  return {
    shipment_id: result.id,
    created_at: result.created_at.toISOString(),
  };
}
