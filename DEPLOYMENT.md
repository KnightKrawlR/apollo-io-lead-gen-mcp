# Apollo.io Lead Generation MCP Server - Deployment Guide

## SaaS Architecture

This MCP server is designed as a **multi-tenant SaaS service** where:

- ✅ The server is hosted on Vercel (publicly accessible)
- ✅ No API keys are stored on the server
- ✅ Each user provides their own Apollo.io API key
- ✅ API keys are sent securely via HTTPS headers
- ✅ Fully scalable - unlimited users can use the same deployment

## How It Works

1. **Server Deployment**: The MCP server runs on Vercel at a public URL
2. **Client Configuration**: Users configure their MCP client (e.g., Manus) with:
   - The server URL
   - Their Apollo.io API key (sent via HTTP header)
3. **Request Flow**: 
   - Client sends request with API key in `X-Apollo-API-Key` header
   - Server creates Apollo.io client with that key
   - Server makes API call to Apollo.io
   - Results returned to client

## Security

- **HTTPS encryption**: All communication is encrypted in transit
- **No server-side storage**: API keys are never stored on the server
- **Per-request authentication**: Each request includes the API key
- **User isolation**: Each user's API key is used only for their requests

## Manus Configuration

To use this MCP server in Manus, add the following configuration:

```json
{
  "mcpServers": {
    "apollo-lead-gen": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "X-Apollo-API-Key": "YOUR_APOLLO_IO_API_KEY_HERE"
      }
    }
  }
}
```

Replace:
- `your-deployment.vercel.app` with your actual Vercel deployment URL
- `YOUR_APOLLO_IO_API_KEY_HERE` with your Apollo.io API key

## Getting Your Apollo.io API Key

1. Go to https://app.apollo.io/
2. Navigate to Settings > API
3. Generate an API key
4. Copy the key and use it in your Manus configuration

## Deployment to Vercel

1. Fork or clone this repository
2. Connect to Vercel:
   ```bash
   vercel login
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```
4. Your MCP server will be available at the provided Vercel URL

## No Environment Variables Required

Unlike traditional deployments, this server **does not require any environment variables** to be set on Vercel. All authentication is handled via HTTP headers from the client.

## Sharing Your Deployment

You can share your Vercel deployment URL with others! Each user simply needs to:
1. Get their own Apollo.io API key
2. Configure their MCP client with the URL and their API key
3. Start using the tools

## Cost Considerations

- **Vercel**: Free tier supports this use case (serverless functions)
- **Apollo.io**: Each user's API calls count against their own Apollo.io account limits
- **Scalability**: The server can handle multiple users simultaneously

## Available Tools

Once configured, you'll have access to these tools in Manus:

1. **organization_search** - Find companies by industry, location, size
2. **people_search** - Find decision makers by title, seniority
3. **people_enrichment** - Get detailed contact information
4. **organization_enrichment** - Get detailed company information
5. **organization_job_postings** - Find job postings
6. **get_person_email** - Reveal email addresses
7. **employees_of_company** - Find employees at specific companies

## Example Usage in Manus

After configuration, you can ask Manus:

- "Find HVAC companies in North Carolina with 10-50 employees"
- "Search for owners and CEOs at HVAC companies in Texas"
- "Get contact information for decision makers at [Company Name]"
- "Find all employees at [Company Name]"

The MCP server will automatically use your Apollo.io API key to fulfill these requests.
