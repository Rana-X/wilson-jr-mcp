/**
 * Tool: get_quotes
 * Retrieves all quotes for a shipment, sorted by cost
 */

import { sql, executeQuery } from '../db.js';
import { GetQuotesOutput, Quote } from '../types.js';
import { isValidShipmentId } from '../utils/validators.js';

export async function getQuotes(shipment_id: string): Promise<GetQuotesOutput> {
  if (!isValidShipmentId(shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

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

  return { quotes };
}
