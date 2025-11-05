#!/usr/bin/env node

/**
 * Wilson Jr MCP Server - HTTP Transport
 * Deploys to Dedalus Labs with proper HTTP endpoints
 */

import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

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

// HTTP Transport Setup with proper MCP SDK
const PORT = parseInt(process.env.PORT || '8080', 10);
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

function createServerInstance(): Server {
  const serverInstance = new Server(
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

  // List tools handler
  serverInstance.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Call tool handler
  serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
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

  return serverInstance;
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end('Session not found');
      return;
    }
    return await session.transport.handleRequest(req, res);
  }

  if (req.method === 'POST') {
    await createNewSession(req, res);
    return;
  }

  res.statusCode = 400;
  res.end('Invalid request');
}

async function createNewSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const serverInstance = createServerInstance();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport, server: serverInstance });
      console.log('New Wilson session created:', sessionId);
    }
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      console.log('Wilson session closed:', transport.sessionId);
    }
  };

  try {
    await serverInstance.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Streamable HTTP connection error:', error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
}

async function handleSSERequest(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const serverInstance = createServerInstance();
  const transport = new SSEServerTransport('/sse', res);

  try {
    await serverInstance.connect(transport);
    console.log('SSE connection established');
  } catch (error) {
    console.error('SSE connection error:', error);
    res.statusCode = 500;
    res.end('SSE connection failed');
  }
}

function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'wilson-jr-mcp-server',
    version: '1.0.0',
    tools: tools.length
  }));
}

function startHttpTransport(): void {
  const httpServer = createServer();

  httpServer.on('request', async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    switch (url.pathname) {
      case '/mcp':
        await handleMcpRequest(req, res);
        break;
      case '/sse':
        await handleSSERequest(req, res);
        break;
      case '/health':
        handleHealthCheck(res);
        break;
      default:
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
  });

  const host = '0.0.0.0';

  httpServer.listen(PORT, host, () => {
    console.log(`Wilson Jr MCP Server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`Tools: ${tools.length}`);
  });
}

// Start server
async function main() {
  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'RESEND_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these environment variables and try again.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY?.substring(0, 10)}...`);

  const args = process.argv.slice(2);

  if (args.includes('--stdio')) {
    const serverInstance = createServerInstance();
    const transport = new StdioServerTransport();
    await serverInstance.connect(transport);
    console.error('MCP server running on stdio');
  } else {
    startHttpTransport();
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
