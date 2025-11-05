/**
 * Tool: select_quote
 * Marks a quote as selected and updates shipment status to 'booked'
 */

import { sql, executeQuery } from '../db.js';
import { SelectQuoteOutput, Quote } from '../types.js';
import { isValidQuoteId, isValidShipmentId } from '../utils/validators.js';

interface SelectQuoteInput {
  quote_id: string;
  shipment_id: string;
}

export async function selectQuote(input: SelectQuoteInput): Promise<SelectQuoteOutput> {
  if (!isValidQuoteId(input.quote_id)) {
    throw new Error('Invalid quote ID format');
  }

  if (!isValidShipmentId(input.shipment_id)) {
    throw new Error('Invalid shipment ID format');
  }

  // Verify quote exists and belongs to the shipment
  const quoteCheck = await sql<Quote[]>`
    SELECT * FROM quotes
    WHERE id = ${input.quote_id} AND shipment_id = ${input.shipment_id}
  `;

  if (quoteCheck.length === 0) {
    throw new Error(`Quote ${input.quote_id} not found for shipment ${input.shipment_id}`);
  }

  const selectedQuote = quoteCheck[0];

  // Deselect all other quotes for this shipment
  await executeQuery(
    async () => {
      await sql`
        UPDATE quotes
        SET is_selected = false
        WHERE shipment_id = ${input.shipment_id}
      `;
    },
    'Failed to deselect other quotes'
  );

  // Select the chosen quote
  await executeQuery(
    async () => {
      await sql`
        UPDATE quotes
        SET is_selected = true
        WHERE id = ${input.quote_id}
      `;
    },
    'Failed to select quote'
  );

  // Update shipment with selected carrier and status
  await executeQuery(
    async () => {
      await sql`
        UPDATE shipments
        SET
          status = 'booked',
          selected_carrier = ${selectedQuote.carrier_name},
          total_cost = ${selectedQuote.total_cost},
          updated_at = NOW()
        WHERE id = ${input.shipment_id}
      `;
    },
    'Failed to update shipment'
  );

  // Fetch updated quote
  const updatedQuote = await executeQuery(
    async () => {
      const result = await sql<Quote[]>`
        SELECT * FROM quotes WHERE id = ${input.quote_id}
      `;
      return result[0];
    },
    'Failed to fetch updated quote'
  );

  return {
    success: true,
    selected_quote: updatedQuote,
  };
}
