/**
 * Tool: get_emails
 * Retrieves emails for a shipment, optionally filtered by type
 */

import { sql, executeQuery } from '../db.js';
import { GetEmailsOutput, Email, EmailType } from '../types.js';
import { isValidShipmentId, isValidEmailType } from '../utils/validators.js';

interface GetEmailsInput {
  shipment_id: string;
  type?: EmailType;
}

export async function getEmails(input: GetEmailsInput): Promise<GetEmailsOutput> {
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  if (input.type && !isValidEmailType(input.type)) {
    throw new Error('Invalid email type');
  }

  const emails = await executeQuery(
    async () => {
      if (input.type) {
        // Filter by type
        return await sql<Email[]>`
          SELECT * FROM emails
          WHERE shipment_id = ${input.shipment_id} AND type = ${input.type}
          ORDER BY created_at DESC
        `;
      } else {
        // All emails
        return await sql<Email[]>`
          SELECT * FROM emails
          WHERE shipment_id = ${input.shipment_id}
          ORDER BY created_at DESC
        `;
      }
    },
    'Failed to fetch emails'
  );

  return { emails };
}
