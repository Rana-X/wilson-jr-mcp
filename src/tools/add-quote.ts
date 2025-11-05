/**
 * Tool: add_quote
 * Adds a carrier quote to a shipment
 */

import { sql, executeQuery } from '../db.js';
import { AddQuoteInput, AddQuoteOutput } from '../types.js';
import { generateQuoteId } from '../utils/id-generator.js';
import {
  isValidShipmentId,
  isValidEmail,
  isPositiveNumber,
  isNonEmptyString,
  isValidServiceType,
  isValidOTIFScore,
  isValidDateString,
} from '../utils/validators.js';

export async function addQuote(input: AddQuoteInput): Promise<AddQuoteOutput> {
  // Validate required fields
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  if (!isNonEmptyString(input.carrier_name)) {
    throw new Error('Carrier name is required');
  }

  if (!isValidEmail(input.carrier_email)) {
    throw new Error('Invalid carrier email address');
  }

  if (!isPositiveNumber(input.total_cost)) {
    throw new Error('Total cost must be a positive number');
  }

  if (!isPositiveNumber(input.base_rate)) {
    throw new Error('Base rate must be a positive number');
  }

  if (!isPositiveNumber(input.fuel_surcharge)) {
    throw new Error('Fuel surcharge must be a positive number');
  }

  if (!Number.isInteger(input.transit_days) || input.transit_days <= 0) {
    throw new Error('Transit days must be a positive integer');
  }

  if (!isValidServiceType(input.service_type)) {
    throw new Error('Invalid service type (must be LTL, FTL, or Expedited)');
  }

  if (input.otif_score !== undefined && !isValidOTIFScore(input.otif_score)) {
    throw new Error('OTIF score must be between 0 and 100');
  }

  if (input.quote_valid_until && !isValidDateString(input.quote_valid_until)) {
    throw new Error('Invalid quote_valid_until date format');
  }

  // Check shipment exists
  const shipmentCheck = await sql`
    SELECT id FROM shipments WHERE id = ${input.shipment_id}
  `;

  if (shipmentCheck.length === 0) {
    throw new Error(`Shipment ${input.shipment_id} not found`);
  }

  // Generate quote ID
  const quoteId = generateQuoteId(input.carrier_name);

  // Insert quote into database
  const result = await executeQuery(
    async () => {
      const inserted = await sql`
        INSERT INTO quotes (
          id,
          shipment_id,
          carrier_name,
          carrier_email,
          total_cost,
          base_rate,
          fuel_surcharge,
          price_breakdown,
          transit_days,
          otif_score,
          service_type,
          is_selected,
          is_recommended,
          quote_valid_until,
          notes,
          created_at
        ) VALUES (
          ${quoteId},
          ${input.shipment_id},
          ${input.carrier_name},
          ${input.carrier_email},
          ${input.total_cost},
          ${input.base_rate},
          ${input.fuel_surcharge},
          ${input.price_breakdown ? JSON.stringify(input.price_breakdown) : null},
          ${input.transit_days},
          ${input.otif_score || null},
          ${input.service_type},
          false,
          false,
          ${input.quote_valid_until || null},
          ${input.notes || null},
          NOW()
        )
        RETURNING id, created_at
      `;
      return inserted[0];
    },
    'Failed to add quote'
  );

  // Update shipment status to 'quoted' if still 'pending'
  await executeQuery(
    async () => {
      await sql`
        UPDATE shipments
        SET status = 'quoted', updated_at = NOW()
        WHERE id = ${input.shipment_id} AND status = 'pending'
      `;
    },
    'Failed to update shipment status'
  );

  return {
    quote_id: result.id,
    created_at: result.created_at.toISOString(),
  };
}
