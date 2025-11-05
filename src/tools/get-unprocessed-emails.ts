/**
 * Tool: get_unprocessed_emails
 * Retrieves emails that haven't been processed yet by Wilson AI
 */

import { sql, executeQuery } from '../db.js';
import { GetUnprocessedEmailsOutput, Email } from '../types.js';

interface GetUnprocessedEmailsInput {
  limit?: number;
}

/**
 * Get unprocessed emails from the database
 * These are emails that Wilson needs to handle
 *
 * @param input - Optional limit on number of emails to return
 * @returns Array of unprocessed emails, oldest first
 */
export async function getUnprocessedEmails(
  input: GetUnprocessedEmailsInput = {}
): Promise<GetUnprocessedEmailsOutput> {
  const limit = input.limit && input.limit > 0 ? input.limit : 50;

  const emails = await executeQuery(
    async () => {
      return await sql<Email[]>`
        SELECT * FROM emails
        WHERE processed = false
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
    },
    'Failed to fetch unprocessed emails'
  );

  return { emails };
}
