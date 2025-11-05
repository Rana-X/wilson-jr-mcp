#!/usr/bin/env node

/**
 * Wilson Jr MCP Server - HTTP Transport
 * Deploys to Dedalus Labs with proper HTTP endpoints
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from 'express';
import { Request, Response } from 'express';

// Import tool functions
import { createShipment } from './tools/create-shipment.js';
import { getShipment } from './tools/get-shipment.js';
import { updateShipment } from './tools/update-shipment.js';
import { listShipments } from './tools/list-shipments.js';
import { addQuote } from './tools/add-quote.js';
import { getQuotes } from './tools/get-quotes.js';
import { selectQuote } from './tools/select-quote.js';
import { addEmail } from './tools/add-email.js';
import { getEmails } from './tools/get-emails.js';
import { getUnprocessedEmails } from './tools/get-unprocessed-emails.js';
import { markEmailProcessed } from './tools/mark-email-processed.js';
import { findOpenShipmentByCustomer } from './tools/find-open-shipment-by-customer.js';
import { sendEmail } from './tools/send-email.js';
import { addChatMessage } from './tools/add-chat-message.js';
import { getChatHistory } from './tools/get-chat-history.js';

// Initialize MCP Server
const server = new Server(
  {
    name: "wilson-jr-freight-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools with MCP SDK schema
const tools = [
  {
    name: "create_shipment",
    description: "Create a new freight shipment record",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer_email: { type: "string", description: "Customer email address" },
        customer_name: { type: "string", description: "Customer name" },
        pickup_address: { type: "string", description: "Pickup location address" },
        delivery_address: { type: "string", description: "Delivery location address" },
        pickup_date: { type: "string", description: "Pickup date (ISO 8601)" },
        delivery_date: { type: "string", description: "Delivery date (ISO 8601)" },
        cargo_type: { type: "string", description: "Type of cargo" },
        weight_kg: { type: "number", description: "Weight in kilograms" },
        priority: { type: "string", description: "Priority level" },
      },
      required: ["customer_email", "customer_name", "pickup_address", "delivery_address"],
    },
  },
  {
    name: "get_shipment",
    description: "Get shipment details by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string", description: "Shipment ID (CART-2025-XXXXX)" },
      },
      required: ["shipment_id"],
    },
  },
  {
    name: "update_shipment",
    description: "Update shipment fields",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string", description: "Shipment ID" },
        pickup_address: { type: "string" },
        delivery_address: { type: "string" },
        cargo_type: { type: "string" },
        weight_kg: { type: "number" },
        status: { type: "string" },
      },
      required: ["shipment_id"],
    },
  },
  {
    name: "list_shipments",
    description: "List shipments with optional filtering",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max number of results" },
        status: { type: "string", description: "Filter by status" },
      },
    },
  },
  {
    name: "add_quote",
    description: "Add a carrier quote for a shipment",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
        carrier_name: { type: "string" },
        quote_amount: { type: "number" },
        currency: { type: "string" },
        transit_days: { type: "number" },
      },
      required: ["shipment_id", "carrier_name", "quote_amount"],
    },
  },
  {
    name: "get_quotes",
    description: "Get all quotes for a shipment",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
      },
      required: ["shipment_id"],
    },
  },
  {
    name: "select_quote",
    description: "Mark a quote as selected",
    inputSchema: {
      type: "object" as const,
      properties: {
        quote_id: { type: "string" },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "add_email",
    description: "Add email record to database",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
        from_email: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        direction: { type: "string", enum: ["inbound", "outbound"] },
      },
      required: ["shipment_id", "from_email", "subject", "body"],
    },
  },
  {
    name: "get_emails",
    description: "Get emails for a shipment",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
      },
      required: ["shipment_id"],
    },
  },
  {
    name: "get_unprocessed_emails",
    description: "Get unprocessed freight request emails",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max number of results" },
      },
    },
  },
  {
    name: "mark_email_processed",
    description: "Mark an email as processed",
    inputSchema: {
      type: "object" as const,
      properties: {
        email_id: { type: "number" },
      },
      required: ["email_id"],
    },
  },
  {
    name: "find_open_shipment_by_customer",
    description: "Find customer's most recent open shipment",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer_email: { type: "string" },
      },
      required: ["customer_email"],
    },
  },
  {
    name: "send_email",
    description: "Send email via Resend API",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
        to_email: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to_email", "subject", "body"],
    },
  },
  {
    name: "add_chat_message",
    description: "Add message to chat history",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
        sender: { type: "string" },
        message: { type: "string" },
      },
      required: ["shipment_id", "sender", "message"],
    },
  },
  {
    name: "get_chat_history",
    description: "Get chat conversation for a shipment",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_id: { type: "string" },
      },
      required: ["shipment_id"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    // Route to appropriate tool handler
    switch (name) {
      case "create_shipment":
        result = await createShipment(args as any);
        break;
      case "get_shipment":
        result = await getShipment((args as any).shipment_id);
        break;
      case "update_shipment":
        result = await updateShipment(args as any);
        break;
      case "list_shipments":
        result = await listShipments((args as any) || {});
        break;
      case "add_quote":
        result = await addQuote(args as any);
        break;
      case "get_quotes":
        result = await getQuotes((args as any).shipment_id);
        break;
      case "select_quote":
        result = await selectQuote(args as any);
        break;
      case "add_email":
        result = await addEmail(args as any);
        break;
      case "get_emails":
        result = await getEmails(args as any);
        break;
      case "get_unprocessed_emails":
        result = await getUnprocessedEmails((args as any) || {});
        break;
      case "mark_email_processed":
        result = await markEmailProcessed(args as any);
        break;
      case "find_open_shipment_by_customer":
        result = await findOpenShipmentByCustomer(args as any);
        break;
      case "send_email":
        result = await sendEmail(args as any);
        break;
      case "add_chat_message":
        result = await addChatMessage(args as any);
        break;
      case "get_chat_history":
        result = await getChatHistory(args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// HTTP Transport Setup
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'wilson-jr-mcp-server',
    version: '1.0.0',
    tools: tools.length,
  });
});

// MCP endpoint for session-based requests
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const request = req.body;
    res.json({
      jsonrpc: '2.0',
      id: request.id,
      result: { ok: true },
    });
  } catch (error: any) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id,
      error: {
        code: -32603,
        message: error.message,
      },
    });
  }
});

// SSE endpoint
app.get('/sse', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('data: {"type":"connected"}\n\n');

  const keepAlive = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Start server
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--stdio')) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP server running on stdio');
  } else {
    app.listen(PORT, () => {
      console.log(`Wilson Jr MCP Server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Tools: ${tools.length}`);
    });
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
