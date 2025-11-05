/**
 * Tool: add_email
 * Adds an email record to the database
 */

import { sql, executeQuery } from '../db.js';
import { AddEmailInput, AddEmailOutput } from '../types.js';
import { isValidShipmentId, isValidEmail, isValidEmailType, isNonEmptyString } from '../utils/validators.js';

export async function addEmail(input: AddEmailInput): Promise<AddEmailOutput> {
  // Validate required fields
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  if (!isValidEmailType(input.type)) {
    throw new Error('Invalid email type');
  }

  if (!isValidEmail(input.from_email)) {
    throw new Error('Invalid from_email address');
  }

  if (!isValidEmail(input.to_email)) {
    throw new Error('Invalid to_email address');
  }

  if (!isNonEmptyString(input.subject)) {
    throw new Error('Subject is required');
  }

  if (!isNonEmptyString(input.body)) {
    throw new Error('Email body is required');
  }

  // Check shipment exists
  const shipmentCheck = await sql`
    SELECT id FROM shipments WHERE id = ${input.shipment_id}
  `;

  if (shipmentCheck.length === 0) {
    throw new Error(`Shipment ${input.shipment_id} not found`);
  }

  // Generate preview (first 100 characters of body)
  const preview = input.body.substring(0, 100);

  // Insert email into database
  const result = await executeQuery(
    async () => {
      const inserted = await sql`
        INSERT INTO emails (
          shipment_id,
          thread_id,
          type,
          from_email,
          from_name,
          to_email,
          to_name,
          subject,
          body,
          preview,
          direction,
          badge,
          parsed_data,
          processed,
          created_at
        ) VALUES (
          ${input.shipment_id},
          ${input.thread_id || null},
          ${input.type},
          ${input.from_email},
          ${input.from_name || null},
          ${input.to_email},
          ${input.to_name || null},
          ${input.subject},
          ${input.body},
          ${preview},
          ${input.direction || null},
          ${input.badge || null},
          ${input.parsed_data ? JSON.stringify(input.parsed_data) : null},
          false,
          NOW()
        )
        RETURNING id, created_at
      `;
      return inserted[0];
    },
    'Failed to add email'
  );

  return {
    email_id: result.id,
    created_at: result.created_at.toISOString(),
  };
}
