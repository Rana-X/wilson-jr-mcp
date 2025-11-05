/**
 * TypeScript type definitions for Wilson Jr Database
 */

export type ShipmentStatus = 'pending' | 'quoted' | 'booked' | 'in_transit' | 'delivered' | 'cancelled';

export type EmailType =
  | 'customer_request'
  | 'wilson_rfq'
  | 'carrier_quote'
  | 'wilson_analysis'
  | 'booking_confirmation'
  | 'tracking_update'
  | 'wilson_notification';

export type EmailBadge = 'NEW' | 'QUOTE' | 'RECOMMEND' | 'BOOKED' | 'URGENT';

export type EmailDirection = 'inbound' | 'outbound';

export type ShipmentPriority = 'urgent' | 'standard' | 'economy';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ServiceType = 'LTL' | 'FTL' | 'Expedited';

export interface CargoDetails {
  weight?: number;
  pallets?: number;
  commodity?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  [key: string]: any; // Allow additional properties
}

export interface Shipment {
  id: string;
  customer_email: string;
  customer_name: string;
  status: ShipmentStatus;
  pickup_address: string;
  pickup_date: Date | null;
  delivery_address: string;
  delivery_date: Date | null;

  // Structured cargo fields
  cargo_type: string | null;
  load_type: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  loading_requirements: string | null;
  unloading_requirements: string | null;
  special_notes: string | null;

  // Legacy JSONB for additional flexibility
  cargo_details: CargoDetails | null;

  // Business logic fields
  priority: ShipmentPriority | null;
  wilson_agent: string | null;

  selected_carrier: string | null;
  total_cost: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Email {
  id: number;
  shipment_id: string;
  thread_id: string | null;
  type: EmailType;
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  subject: string;
  body: string;
  preview: string;
  direction: EmailDirection | null;
  badge: EmailBadge | null;
  parsed_data: Record<string, any> | null;
  processed: boolean;
  created_at: Date;
}

export interface Quote {
  id: string;
  shipment_id: string;
  carrier_name: string;
  carrier_email: string;
  total_cost: number;
  base_rate: number;
  fuel_surcharge: number;
  price_breakdown: Record<string, any> | null;
  transit_days: number;
  otif_score: number | null;
  service_type: ServiceType;
  is_selected: boolean;
  is_recommended: boolean;
  quote_valid_until: Date | null;
  notes: string | null;
  created_at: Date;
}

export interface ChatMessage {
  id: number;
  shipment_id: string;
  role: ChatRole;
  message: string;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export interface TrackingEvent {
  id: number;
  shipment_id: string;
  event_type: string;
  location: string | null;
  description: string;
  occurred_at: Date;
  created_at: Date;
}

// Tool input types
export interface CreateShipmentInput {
  customer_email: string;
  customer_name: string;
  pickup_address: string;
  delivery_address: string;

  // Structured cargo fields (optional - can use either these or cargo_details)
  cargo_type?: string;
  load_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  loading_requirements?: string;
  unloading_requirements?: string;
  special_notes?: string;

  // Legacy JSONB (optional)
  cargo_details?: CargoDetails;

  // Business logic fields (optional)
  priority?: ShipmentPriority;
  wilson_agent?: string;

  // Dates (optional)
  pickup_date?: string;
  delivery_date?: string;
}

export interface UpdateShipmentInput {
  shipment_id: string;
  status?: ShipmentStatus;
  selected_carrier?: string;
  total_cost?: number;
  pickup_date?: string;
  delivery_date?: string;

  // New structured cargo fields
  cargo_type?: string;
  load_type?: string;
  weight_kg?: number;
  volume_cbm?: number;
  loading_requirements?: string;
  unloading_requirements?: string;
  special_notes?: string;

  // Business logic fields
  priority?: ShipmentPriority;
  wilson_agent?: string;

  // Legacy field (for backward compatibility)
  notes?: string;
}

export interface AddQuoteInput {
  shipment_id: string;
  carrier_name: string;
  carrier_email: string;
  total_cost: number;
  base_rate: number;
  fuel_surcharge: number;
  price_breakdown?: Record<string, any>;
  transit_days: number;
  otif_score?: number;
  service_type: ServiceType;
  notes?: string;
  quote_valid_until?: string;
}

export interface AddEmailInput {
  shipment_id: string;
  thread_id?: string;
  type: EmailType;
  from_email: string;
  from_name?: string;
  to_email: string;
  to_name?: string;
  subject: string;
  body: string;
  direction?: EmailDirection;
  badge?: EmailBadge;
  parsed_data?: Record<string, any>;
}

export interface AddChatMessageInput {
  shipment_id: string;
  role: ChatRole;
  message: string;
  metadata?: Record<string, any>;
}

// Tool output types
export interface CreateShipmentOutput {
  shipment_id: string;
  created_at: string;
}

export interface GetShipmentOutput {
  shipment: Shipment;
  quotes: Quote[];
  emails: Email[];
  chat_messages: ChatMessage[];
}

export interface UpdateShipmentOutput {
  success: boolean;
  updated_shipment: Shipment;
}

export interface ListShipmentsOutput {
  shipments: Shipment[];
  total: number;
}

export interface AddQuoteOutput {
  quote_id: string;
  created_at: string;
}

export interface GetQuotesOutput {
  quotes: Quote[];
}

export interface SelectQuoteOutput {
  success: boolean;
  selected_quote: Quote;
}

export interface AddEmailOutput {
  email_id: number;
  created_at: string;
}

export interface GetEmailsOutput {
  emails: Email[];
}

export interface AddChatMessageOutput {
  message_id: number;
  created_at: string;
}

export interface GetChatHistoryOutput {
  messages: ChatMessage[];
}

// New email processing tool outputs
export interface GetUnprocessedEmailsOutput {
  emails: Email[];
}

export interface MarkEmailProcessedOutput {
  success: boolean;
}

export interface FindOpenShipmentByCustomerOutput {
  shipment_id: string | null;
}

// Send email tool types
export interface SendEmailInput {
  shipment_id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  type: EmailType;
}

export interface SendEmailOutput {
  success: boolean;
  email_id?: number;
  resend_id?: string;
  error?: string;
}
