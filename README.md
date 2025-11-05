# Wilson Jr MCP Server

Model Context Protocol server providing 15 freight coordination tools for Wilson AI agent.

## Features

- ✅ HTTP transport for production deployment
- ✅ 15 MCP tools for freight management
- ✅ PostgreSQL database integration
- ✅ Resend email API integration
- ✅ Health check endpoint
- ✅ Server-Sent Events support

## Tools Available

### Shipment Management (4 tools)
1. `create_shipment` - Create new shipment record
2. `get_shipment` - Get shipment details by ID
3. `update_shipment` - Update shipment fields
4. `list_shipments` - List shipments with optional filtering

### Quote Management (3 tools)
5. `add_quote` - Add carrier quote
6. `get_quotes` - Get quotes for shipment
7. `select_quote` - Mark quote as selected

### Email Management (6 tools)
8. `add_email` - Add email record
9. `get_emails` - Get emails for shipment
10. `get_unprocessed_emails` - Get unprocessed emails
11. `mark_email_processed` - Mark email as processed
12. `find_open_shipment_by_customer` - Find customer's open shipment
13. `send_email` - Send email via Resend API

### Chat Management (2 tools)
14. `add_chat_message` - Add chat message
15. `get_chat_history` - Get chat history

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key
- `FROM_EMAIL` - Default from email
- `RFQ_EMAIL` - RFQ email address
- `SUPPORT_EMAIL` - Support email address

### 3. Build

```bash
npm run build
```

### 4. Run Locally

**HTTP mode (production):**
```bash
npm start
```

**STDIO mode (local testing):**
```bash
npm run stdio
```

## Deployment to Dedalus Labs

### Prerequisites

- GitHub account
- Dedalus Labs account (https://dedaluslabs.ai)
- API key from Dedalus dashboard

### Deployment Steps

1. **Create GitHub Repository**

```bash
# Initialize git (if not already)
git init

# Add files
git add .

# Commit
git commit -m "Initial MCP server deployment"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/wilson-mcp-server.git
git push -u origin main
```

2. **Deploy to Dedalus**

- Go to https://dedaluslabs.ai
- Click "Deploy New Server" or "Create MCP Server"
- Connect GitHub repository
- Configure:
  - **Name**: `wilson-jr` (or your preferred name)
  - **Entry Point**: `src/index.ts`
  - **Runtime**: Node.js/TypeScript
  - **Build Command**: `npm run build`
  - **Start Command**: `npm start`

3. **Set Environment Variables**

In Dedalus dashboard, add:
- `DATABASE_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `RFQ_EMAIL`
- `SUPPORT_EMAIL`

4. **Deploy**

Click "Deploy" and wait for build to complete (1-3 minutes).

5. **Get Server ID**

After deployment, Dedalus will provide your server ID, e.g.:
- `username/wilson-jr`
- `rana-x/wilson-jr`

## Using the MCP Server

### With Dedalus Python SDK

```python
from dedalus_labs import AsyncDedalus, DedalusRunner

client = AsyncDedalus(api_key="your_api_key")
runner = DedalusRunner(client)

result = await runner.run(
    input="Get all unprocessed emails",
    model="openai/gpt-4o-mini",
    mcp_servers=["username/wilson-jr"]  # Your server ID
)
```

### With Dedalus TypeScript SDK

```typescript
import Dedalus from 'dedalus-labs';

const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY
});

const response = await client.chat.create({
  input: [{
    role: 'user',
    content: 'Use get_unprocessed_emails tool to get unprocessed emails'
  }],
  model: 'gpt-4o-mini',
  mcp_servers: ['username/wilson-jr']
});
```

## API Endpoints

When running locally or deployed:

- **GET /health** - Health check
  ```bash
  curl http://localhost:8080/health
  ```

- **POST /mcp** - MCP protocol endpoint
  ```bash
  curl -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  ```

- **GET /sse** - Server-Sent Events
  ```bash
  curl http://localhost:8080/sse
  ```

## Development

### Run in development mode with auto-reload:

```bash
npm run dev
```

### Test with STDIO transport:

```bash
npm run stdio
```

Then interact via standard input/output (useful for local MCP testing).

## Troubleshooting

### Tools not accessible after deployment

1. Verify deployment status in Dedalus dashboard
2. Check build logs for errors
3. Verify environment variables are set
4. Check server ID is correct
5. Test health endpoint: `https://your-server.dedaluslabs.ai/health`

### Database connection errors

- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Dedalus IPs
- Ensure `sslmode=require` is in connection string

### Email sending fails

- Verify `RESEND_API_KEY` is correct
- Check `FROM_EMAIL` domain is verified in Resend
- Review Resend dashboard for delivery status

## License

MIT

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@go2irl.com
