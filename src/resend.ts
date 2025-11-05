/**
 * Resend email client
 * Used by send_email tool to send emails via Resend API
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Lazy-initialized Resend client (only created when needed)
let resendClient: Resend | null = null;

/**
 * Get Resend client instance (lazy initialization)
 * Only creates the client when actually needed, not at import time
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Legacy export for backwards compatibility
// Note: This is lazy-initialized via getter
// Using any to avoid TypeScript issues with Resend's internal types
export const resend: any = {
  get emails() {
    return getResendClient().emails;
  }
};

/**
 * Validate that email domain is @go2irl.com
 */
export function isGo2IRLEmail(email: string): boolean {
  return email.endsWith('@go2irl.com');
}

/**
 * Valid sender addresses for Wilson Jr
 */
export const VALID_FROM_ADDRESSES = [
  'wilsonjr@go2irl.com',
  'rfq@go2irl.com',
  'quotes@go2irl.com',
  'support@go2irl.com',
  'transportation@go2irl.com',
  'swiftship@go2irl.com',
  'inbox@go2irl.com',
  'ilovetrucks@go2irl.com',
  'realtruck@go2irl.com',
  'supertrucks@go2irl.com',
] as const;

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0;
}
