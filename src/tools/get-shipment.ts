/**
 * Tool: get_shipment
 * Retrieves a shipment with all related data (quotes, emails, chat messages)
 */

import { sql, executeQuery } from '../db.js';
import { GetShipmentOutput, Shipment, Quote, Email, ChatMessage } from '../types.js';
import { isValidShipmentId } from '../utils/validators.js';

export async function getShipment(shipment_id: string): Promise<GetShipmentOutput> {
  if (!isValidShipmentId(shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  // Fetch shipment details
  const shipmentResult = await executeQuery(
    async () => {
      return await sql<Shipment[]>`
        SELECT * FROM shipments
        WHERE id = ${shipment_id}
      `;
    },
    'Failed to fetch shipment'
  );

  if (shipmentResult.length === 0) {
    throw new Error(`Shipment ${shipment_id} not found`);
  }

  const shipment = shipmentResult[0];

  // Fetch related quotes
  const quotes = await executeQuery(
    async () => {
      return await sql<Quote[]>`
        SELECT * FROM quotes
        WHERE shipment_id = ${shipment_id}
        ORDER BY total_cost ASC
      `;
    },
    'Failed to fetch quotes'
  );

  // Fetch related emails
  const emails = await executeQuery(
    async () => {
      return await sql<Email[]>`
        SELECT * FROM emails
        WHERE shipment_id = ${shipment_id}
        ORDER BY created_at DESC
      `;
    },
    'Failed to fetch emails'
  );

  // Fetch recent chat messages
  const chatMessages = await executeQuery(
    async () => {
      return await sql<ChatMessage[]>`
        SELECT * FROM chat_messages
        WHERE shipment_id = ${shipment_id}
        ORDER BY created_at ASC
      `;
    },
    'Failed to fetch chat messages'
  );

  return {
    shipment,
    quotes,
    emails,
    chat_messages: chatMessages,
  };
}
