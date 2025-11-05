/**
 * Tool: mark_email_processed
 * Marks an email as processed after Wilson AI has handled it
 */

import { sql, executeQuery } from '../db.js';
import { MarkEmailProcessedOutput } from '../types.js';

interface MarkEmailProcessedInput {
  email_id: number;
}

/**
 * Mark an email as processed
 * Called after Wilson successfully processes and responds to an email
 *
 * @param input - Email ID to mark as processed
 * @returns Success status
 */
export async function markEmailProcessed(
  input: MarkEmailProcessedInput
): Promise<MarkEmailProcessedOutput> {
  if (!Number.isInteger(input.email_id) || input.email_id <= 0) {
    throw new Error('Invalid email_id (must be a positive integer)');
  }

  // Verify email exists before updating
  const emailCheck = await sql`
    SELECT id FROM emails WHERE id = ${input.email_id}
  `;

  if (emailCheck.length === 0) {
    throw new Error(`Email ${input.email_id} not found`);
  }

  // Mark as processed
  await executeQuery(
    async () => {
      await sql`
        UPDATE emails
        SET processed = true
        WHERE id = ${input.email_id}
      `;
    },
    'Failed to mark email as processed'
  );

  return { success: true };
}
