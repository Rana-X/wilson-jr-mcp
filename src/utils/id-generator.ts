/**
 * ID generation utilities for shipments and quotes
 */

import { sql } from '../db.js';

/**
 * Generate a new shipment ID in format: CART-2025-XXXXX
 * Queries the database for the highest existing ID and increments
 */
export async function generateShipmentId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CART-${currentYear}-`;

  try {
    // Get the highest shipment ID for the current year
    const result = await sql`
      SELECT id FROM shipments
      WHERE id LIKE ${prefix + '%'}
      ORDER BY id DESC
      LIMIT 1
    `;

    let nextNumber = 1;

    if (result.length > 0) {
      // Extract the number from the last ID (e.g., "CART-2025-00123" -> "00123")
      const lastId = result[0].id;
      const lastNumber = parseInt(lastId.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    // Format with leading zeros (5 digits)
    const formattedNumber = String(nextNumber).padStart(5, '0');
    return `${prefix}${formattedNumber}`;
  } catch (error) {
    console.error('Error generating shipment ID:', error);
    // Fallback to random number if query fails
    const randomNum = Math.floor(Math.random() * 100000);
    return `${prefix}${String(randomNum).padStart(5, '0')}`;
  }
}

/**
 * Generate a quote ID in format: quote-{carrier}-{random3digits}
 */
export function generateQuoteId(carrierName: string): string {
  // Sanitize carrier name (lowercase, remove spaces, limit length)
  const sanitizedCarrier = carrierName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);

  // Generate 3 random digits
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `quote-${sanitizedCarrier}-${randomDigits}`;
}

/**
 * Generate a case ID in format: CASE-XXXXXXXX (8 random hex characters)
 * Used for email routing system
 */
export function generateCaseId(): string {
  const randomHex = Math.floor(Math.random() * 0xFFFFFFFF)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');

  return `CASE-${randomHex}`;
}
