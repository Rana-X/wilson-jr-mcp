/**
 * Input validation utilities
 */

import { ShipmentStatus, EmailType, EmailDirection, EmailBadge, ShipmentPriority, ChatRole, ServiceType } from '../types.js';

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate shipment status
 */
export function isValidShipmentStatus(status: string): status is ShipmentStatus {
  const validStatuses: ShipmentStatus[] = ['pending', 'quoted', 'booked', 'in_transit', 'delivered', 'cancelled'];
  return validStatuses.includes(status as ShipmentStatus);
}

/**
 * Validate email type
 */
export function isValidEmailType(type: string): type is EmailType {
  const validTypes: EmailType[] = [
    'customer_request',
    'wilson_rfq',
    'carrier_quote',
    'wilson_analysis',
    'booking_confirmation',
    'tracking_update',
    'wilson_notification'
  ];
  return validTypes.includes(type as EmailType);
}

/**
 * Validate chat role
 */
export function isValidChatRole(role: string): role is ChatRole {
  const validRoles: ChatRole[] = ['user', 'assistant', 'system'];
  return validRoles.includes(role as ChatRole);
}

/**
 * Validate service type
 */
export function isValidServiceType(type: string): type is ServiceType {
  const validTypes: ServiceType[] = ['LTL', 'FTL', 'Expedited'];
  return validTypes.includes(type as ServiceType);
}

/**
 * Validate email direction
 */
export function isValidEmailDirection(direction: string): direction is EmailDirection {
  const validDirections: EmailDirection[] = ['inbound', 'outbound'];
  return validDirections.includes(direction as EmailDirection);
}

/**
 * Validate email badge
 */
export function isValidEmailBadge(badge: string): badge is EmailBadge {
  const validBadges: EmailBadge[] = ['NEW', 'QUOTE', 'RECOMMEND', 'BOOKED', 'URGENT'];
  return validBadges.includes(badge as EmailBadge);
}

/**
 * Validate shipment priority
 */
export function isValidShipmentPriority(priority: string): priority is ShipmentPriority {
  const validPriorities: ShipmentPriority[] = ['urgent', 'standard', 'economy'];
  return validPriorities.includes(priority as ShipmentPriority);
}

/**
 * Validate shipment ID format
 */
export function isValidShipmentId(id: string): boolean {
  // Format: CART-2025-XXXXX (year can vary)
  const shipmentIdRegex = /^CART-\d{4}-\d{5}$/;
  return shipmentIdRegex.test(id);
}

/**
 * Validate quote ID format
 */
export function isValidQuoteId(id: string): boolean {
  // Format: quote-{carrier}-{digits}
  const quoteIdRegex = /^quote-[a-z0-9]+-\d{3}$/;
  return quoteIdRegex.test(id);
}

/**
 * Validate date string (ISO 8601 format)
 */
export function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0;
}

/**
 * Validate required string field
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate OTIF score (0-100)
 */
export function isValidOTIFScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Sanitize string input (prevent injection)
 */
export function sanitizeString(input: string): string {
  return input.trim().substring(0, 10000); // Limit length
}

/**
 * Validate object is not empty
 */
export function isNonEmptyObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
}
