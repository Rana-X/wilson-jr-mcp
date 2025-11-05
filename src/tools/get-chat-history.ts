/**
 * Tool: get_chat_history
 * Retrieves chat message history for a shipment
 */

import { sql, executeQuery } from '../db.js';
import { GetChatHistoryOutput, ChatMessage } from '../types.js';
import { isValidShipmentId } from '../utils/validators.js';

interface GetChatHistoryInput {
  shipment_id: string;
  limit?: number;
}

export async function getChatHistory(input: GetChatHistoryInput): Promise<GetChatHistoryOutput> {
  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  const limit = input.limit && input.limit > 0 ? input.limit : 100;

  const messages = await executeQuery(
    async () => {
      return await sql<ChatMessage[]>`
        SELECT * FROM chat_messages
        WHERE shipment_id = ${input.shipment_id}
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
    },
    'Failed to fetch chat history'
  );

  return { messages };
}
