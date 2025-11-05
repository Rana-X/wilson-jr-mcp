/**
 * Tool: send_email
 * Send email via Resend API and automatically save to database
 */

import { sql } from '../db.js';
import { resend, isGo2IRLEmail, isResendConfigured } from '../resend.js';
import { SendEmailInput, SendEmailOutput } from '../types.js';
import { isValidEmail } from '../utils/validators.js';
import { addEmail } from './add-email.js';

/**
 * Send an email via Resend and save to database
 *
 * This tool:
 * 1. Validates sender domain (@go2irl.com only)
 * 2. Sends email via Resend API
 * 3. Automatically saves email to database
 * 4. Returns both Resend message ID and database email ID
 *
 * @param input - Email details (from, to, subject, body, shipment_id, type)
 * @returns Success status with email_id and resend_id, or error message
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  // 1. Validate Resend is configured
  if (!isResendConfigured()) {
    return {
      success: false,
      error: 'Resend API is not configured. Please set RESEND_API_KEY environment variable.',
    };
  }

  // 2. Validate sender domain
  if (!isGo2IRLEmail(input.from)) {
    return {
      success: false,
      error: `Invalid sender domain. Sender must be @go2irl.com (received: ${input.from})`,
    };
  }

  // 3. Validate email formats
  if (!isValidEmail(input.from)) {
    return {
      success: false,
      error: `Invalid sender email format: ${input.from}`,
    };
  }

  if (!isValidEmail(input.to)) {
    return {
      success: false,
      error: `Invalid recipient email format: ${input.to}`,
    };
  }

  // 4. Validate shipment exists
  try {
    const shipmentCheck = await sql`
      SELECT id FROM shipments WHERE id = ${input.shipment_id}
    `;

    if (shipmentCheck.length === 0) {
      return {
        success: false,
        error: `Shipment ${input.shipment_id} not found`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to verify shipment: ${message}`,
    };
  }

  // 5. Send email via Resend
  let resendId: string;
  try {
    const { data, error } = await resend.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.body, // Resend accepts both HTML and plain text
    });

    if (error) {
      return {
        success: false,
        error: `Resend API error: ${error.message}`,
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error: 'Resend API did not return a message ID',
      };
    }

    resendId = data.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to send email via Resend: ${message}`,
    };
  }

  // 6. Save email to database
  try {
    const emailResult = await addEmail({
      shipment_id: input.shipment_id,
      type: input.type,
      from_email: input.from,
      from_name: undefined, // Optional
      to_email: input.to,
      to_name: undefined, // Optional
      subject: input.subject,
      body: input.body,
      badge: undefined, // Optional
    });

    // 7. Return success with both IDs
    return {
      success: true,
      email_id: emailResult.email_id,
      resend_id: resendId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Email was sent but database save failed - return partial success
    return {
      success: false,
      resend_id: resendId,
      error: `Email sent via Resend (ID: ${resendId}) but failed to save to database: ${message}`,
    };
  }
}
