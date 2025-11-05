/**
 * Tool: update_shipment
 * Updates shipment fields (status, carrier, cost, dates, etc.)
 */

import { sql, executeQuery } from '../db.js';
import { UpdateShipmentInput, UpdateShipmentOutput, Shipment } from '../types.js';
import {
  isValidShipmentId,
  isValidShipmentStatus,
  isPositiveNumber,
  isValidDateString,
} from '../utils/validators.js';

export async function updateShipment(input: UpdateShipmentInput): Promise<UpdateShipmentOutput> {
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  // Validate optional fields
  if (input.status && !isValidShipmentStatus(input.status)) {
    throw new Error('Invalid shipment status');
  }

  if (input.total_cost !== undefined && !isPositiveNumber(input.total_cost)) {
    throw new Error('Total cost must be a positive number');
  }

  if (input.pickup_date && !isValidDateString(input.pickup_date)) {
    throw new Error('Invalid pickup date format');
  }

  if (input.delivery_date && !isValidDateString(input.delivery_date)) {
    throw new Error('Invalid delivery date format');
  }

  // Build dynamic update query
  const updates: any = {
    updated_at: sql`NOW()`,
  };

  if (input.status) {
    updates.status = input.status;
  }

  if (input.selected_carrier) {
    updates.selected_carrier = input.selected_carrier;
  }

  if (input.total_cost !== undefined) {
    updates.total_cost = input.total_cost;
  }

  if (input.pickup_date) {
    updates.pickup_date = input.pickup_date;
  }

  if (input.delivery_date) {
    updates.delivery_date = input.delivery_date;
  }

  // New structured cargo fields
  if (input.cargo_type !== undefined) {
    updates.cargo_type = input.cargo_type;
  }

  if (input.load_type !== undefined) {
    updates.load_type = input.load_type;
  }

  if (input.weight_kg !== undefined) {
    updates.weight_kg = input.weight_kg;
  }

  if (input.volume_cbm !== undefined) {
    updates.volume_cbm = input.volume_cbm;
  }

  if (input.loading_requirements !== undefined) {
    updates.loading_requirements = input.loading_requirements;
  }

  if (input.unloading_requirements !== undefined) {
    updates.unloading_requirements = input.unloading_requirements;
  }

  if (input.special_notes !== undefined) {
    updates.special_notes = input.special_notes;
  }

  // Business logic fields
  if (input.priority !== undefined) {
    updates.priority = input.priority;
  }

  if (input.wilson_agent !== undefined) {
    updates.wilson_agent = input.wilson_agent;
  }

  // Execute update
  const result = await executeQuery(
    async () => {
      const updated = await sql<Shipment[]>`
        UPDATE shipments
        SET ${sql(updates)}
        WHERE id = ${input.shipment_id}
        RETURNING *
      `;
      return updated[0];
    },
    'Failed to update shipment'
  );

  if (!result) {
    throw new Error(`Shipment ${input.shipment_id} not found`);
  }

  return {
    success: true,
    updated_shipment: result,
  };
}
