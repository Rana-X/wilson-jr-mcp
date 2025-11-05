/**
 * Tool: add_chat_message
 * Adds a chat message to the conversation history
 */

import { sql, executeQuery } from '../db.js';
import { AddChatMessageInput, AddChatMessageOutput } from '../types.js';
import { isValidShipmentId, isValidChatRole, isNonEmptyString } from '../utils/validators.js';

export async function addChatMessage(input: AddChatMessageInput): Promise<AddChatMessageOutput> {
  // Validate required fields
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  if (!isValidChatRole(input.role)) {
    throw new Error('Invalid chat role (must be user, assistant, or system)');
  }

  if (!isNonEmptyString(input.message)) {
    throw new Error('Message is required');
  }

  // Check shipment exists
  const shipmentCheck = await sql`
    SELECT id FROM shipments WHERE id = ${input.shipment_id}
  `;

  if (shipmentCheck.length === 0) {
    throw new Error(`Shipment ${input.shipment_id} not found`);
  }

  // Insert chat message into database
  const result = await executeQuery(
    async () => {
      const inserted = await sql`
        INSERT INTO chat_messages (
          shipment_id,
          role,
          message,
          metadata,
          created_at
        ) VALUES (
          ${input.shipment_id},
          ${input.role},
          ${input.message},
          ${input.metadata ? JSON.stringify(input.metadata) : null},
          NOW()
        )
        RETURNING id, created_at
      `;
      return inserted[0];
    },
    'Failed to add chat message'
  );

  return {
    message_id: result.id,
    created_at: result.created_at.toISOString(),
  };
}
