import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ApolloClient } from './apollo-client.js';
const SESSION_ID_HEADER = 'x-session-id';
// Define tools configuration
const tools = [
    {
        name: 'organization_search',
        description: 'Search for companies in Apollo.io database using comprehensive filters. Perfect for finding HVAC businesses or any other type of company by industry keywords, location, size, and revenue.',
        inputSchema: {
            type: 'object',
            properties: {
                q_organization_keyword_tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords associated with companies (e.g., "hvac", "heating", "cooling", "air conditioning", "plumbing")'
                },
                organization_locations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Company headquarters locations - cities, US states, or countries (e.g., "north carolina", "texas", "atlanta")'
                },
                organization_not_locations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Exclude companies from these locations'
                },
                organization_num_employees_ranges: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Employee count ranges as strings with comma-separated min,max (e.g., ["1,10", "10,50", "50,100"])'
                },
                q_organization_name: {
                    type: 'string',
                    description: 'Search by company name (partial matches accepted)'
                },
                revenue_range: {
                    type: 'object',
                    properties: {
                        min: { type: 'number', description: 'Minimum revenue (no symbols or commas)' },
                        max: { type: 'number', description: 'Maximum revenue (no symbols or commas)' }
                    },
                    description: 'Filter by revenue range'
                },
                currently_using_any_of_technology_uids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by technologies used (e.g., "salesforce", "google_analytics")'
                },
                page: {
                    type: 'number',
                    description: 'Page number for pagination (default: 1)'
                },
                per_page: {
                    type: 'number',
                    description: 'Results per page, max 100 (default: 25)'
                }
            }
        }
    },
    {
        name: 'people_search',
        description: 'Search for people/contacts in Apollo.io database using comprehensive filters. Find decision makers at companies by job title, seniority, location, and company criteria.',
        inputSchema: {
            type: 'object',
            properties: {
                person_titles: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Job titles to search for (e.g., "owner", "ceo", "president", "office manager", "operations manager")'
                },
                person_seniorities: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Seniority levels: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern'
                },
                person_locations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Where people live - cities, US states, or countries'
                },
                organization_locations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Company headquarters locations'
                },
                organization_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by specific Apollo.io organization IDs (from organization_search)'
                },
                organization_num_employees_ranges: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Employer size ranges (e.g., ["1,10", "10,50"])'
                },
                q_organization_keyword_tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by employer industry keywords (e.g., "hvac", "heating")'
                },
                contact_email_status: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Email status: verified, unverified, likely_to_engage, unavailable'
                },
                revenue_range: {
                    type: 'object',
                    properties: {
                        min: { type: 'number' },
                        max: { type: 'number' }
                    },
                    description: 'Filter by employer revenue range'
                },
                page: {
                    type: 'number',
                    description: 'Page number for pagination (default: 1)'
                },
                per_page: {
                    type: 'number',
                    description: 'Results per page, max 100 (default: 25)'
                }
            }
        }
    },
    {
        name: 'people_enrichment',
        description: 'Enrich data for a single person to get detailed contact information including email, phone, job history, and social profiles.',
        inputSchema: {
            type: 'object',
            properties: {
                first_name: {
                    type: 'string',
                    description: "Person's first name"
                },
                last_name: {
                    type: 'string',
                    description: "Person's last name"
                },
                email: {
                    type: 'string',
                    description: "Person's email address"
                },
                domain: {
                    type: 'string',
                    description: "Company domain (e.g., 'apollo.io')"
                },
                organization_name: {
                    type: 'string',
                    description: "Organization name"
                },
                linkedin_url: {
                    type: 'string',
                    description: "Person's LinkedIn profile URL"
                }
            }
        }
    },
    {
        name: 'organization_enrichment',
        description: 'Enrich data for a single company to get detailed information including industry, revenue, employee count, technologies used, and contact details.',
        inputSchema: {
            type: 'object',
            properties: {
                domain: {
                    type: 'string',
                    description: 'Company domain (e.g., "apollo.io")'
                },
                name: {
                    type: 'string',
                    description: 'Company name'
                }
            }
        }
    },
    {
        name: 'organization_job_postings',
        description: 'Find active job postings for a specific organization using its Apollo.io organization ID.',
        inputSchema: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Apollo.io organization ID (obtained from organization_search)'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'get_person_email',
        description: 'Get email address for a person using their Apollo.io person ID. This reveals the actual email address.',
        inputSchema: {
            type: 'object',
            properties: {
                apollo_id: {
                    type: 'string',
                    description: 'Apollo.io person ID (obtained from people_search)'
                }
            },
            required: ['apollo_id']
        }
    },
    {
        name: 'employees_of_company',
        description: 'Find employees of a specific company by company name, website URL, or LinkedIn URL. Optionally filter by seniority and email status.',
        inputSchema: {
            type: 'object',
            properties: {
                company: {
                    type: 'string',
                    description: 'Company name (required)'
                },
                website_url: {
                    type: 'string',
                    description: 'Company website URL (optional, helps narrow results)'
                },
                linkedin_url: {
                    type: 'string',
                    description: 'Company LinkedIn URL (optional, helps narrow results)'
                },
                person_seniorities: {
                    type: 'string',
                    description: 'Comma-separated seniority levels to filter by (e.g., "owner,c_suite,manager")'
                },
                contact_email_status: {
                    type: 'string',
                    description: 'Comma-separated email statuses (e.g., "verified,likely_to_engage")'
                }
            },
            required: ['company']
        }
    }
];
// Tool execution handler
async function executeTool(toolName, args, apollo) {
    try {
        switch (toolName) {
            case 'people_enrichment': {
                const result = await apollo.peopleEnrichment(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'organization_enrichment': {
                const result = await apollo.organizationEnrichment(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'people_search': {
                const result = await apollo.peopleSearch(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'organization_search': {
                const result = await apollo.organizationSearch(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'organization_job_postings': {
                const result = await apollo.organizationJobPostings(args.organization_id);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'get_person_email': {
                const result = await apollo.getPersonEmail(args.apollo_id);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            case 'employees_of_company': {
                const result = await apollo.employeesOfCompany(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
        }
    }
    catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        return {
            content: [{
                    type: 'text',
                    text: `Apollo.io API error: ${error.message}`
                }],
            isError: true,
        };
    }
}
function createMcpServer(apiKey) {
    const apollo = new ApolloClient(apiKey);
    const server = new Server({
        name: 'apollo-io-lead-gen',
        version: '1.0.0',
    }, {
        capabilities: {
            resources: {},
            tools: {},
        },
    });
    // Setup tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const args = request.params.arguments ?? {};
        return await executeTool(request.params.name, args, apollo);
    });
    return server;
}
// Store active transports by session ID
const transports = new Map();
// Create Express app
const app = express();
app.use(express.json());
// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', `Content-Type, X-Apollo-API-Key, ${SESSION_ID_HEADER}`);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'apollo-mcp-lead-gen', sessions: transports.size });
});
// MCP SSE endpoint (GET) - establishes SSE connection
app.get('/mcp', async (req, res) => {
    try {
        const apiKey = req.headers['x-apollo-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                error: 'Missing API key',
                message: 'Please provide your Apollo.io API key in the X-Apollo-API-Key header'
            });
        }
        // Create new server and transport for this session
        const server = createMcpServer(apiKey);
        const transport = new SSEServerTransport('/mcp', res);
        // Store transport by session ID
        transports.set(transport.sessionId, transport);
        console.log(`New SSE connection established. Session: ${transport.sessionId}`);
        // Connect server to transport (this automatically starts the SSE stream)
        await server.connect(transport);
        // Clean up on close
        transport.onclose = () => {
            console.log(`SSE connection closed. Session: ${transport.sessionId}`);
            transports.delete(transport.sessionId);
        };
    }
    catch (error) {
        console.error('Error establishing SSE connection:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to establish SSE connection', message: error.message });
        }
    }
});
// MCP POST endpoint - receives messages from client
app.post('/mcp', async (req, res) => {
    try {
        const sessionId = req.headers[SESSION_ID_HEADER];
        if (!sessionId) {
            return res.status(400).json({
                error: 'Missing session ID',
                message: `Please provide session ID in ${SESSION_ID_HEADER} header`
            });
        }
        const transport = transports.get(sessionId);
        if (!transport) {
            return res.status(404).json({
                error: 'Session not found',
                message: 'Invalid or expired session ID. Please establish a new SSE connection.'
            });
        }
        // Handle the POST message
        await transport.handlePostMessage(req, res, req.body);
    }
    catch (error) {
        console.error('Error handling POST message:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to handle message', message: error.message });
        }
    }
});
// Get port from environment or default to 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Apollo.io MCP Server listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`✅ Ready to accept connections!`);
});
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server...');
    // Close all transports
    for (const transport of transports.values()) {
        await transport.close();
    }
    process.exit(0);
});
//# sourceMappingURL=railway-server.js.map