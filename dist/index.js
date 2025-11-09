#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ApolloClient } from './apollo-client.js';
import dotenv from 'dotenv';
import { parseArgs } from 'node:util';
// Load environment variables
dotenv.config();
// Parse command line arguments
const { values } = parseArgs({
    options: {
        'api-key': { type: 'string' }
    }
});
// Initialize Apollo.io client
const apiKey = values['api-key'] || process.env.APOLLO_IO_API_KEY;
if (!apiKey) {
    throw new Error('APOLLO_IO_API_KEY environment variable is required');
}
class ApolloServer {
    // Core server properties
    server;
    apollo;
    constructor() {
        this.server = new Server({
            name: 'apollo-io-lead-gen',
            version: '1.0.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        this.apollo = new ApolloClient(apiKey);
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection at:', promise, 'reason:', reason);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            // Define available tools
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
            return { tools };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const args = request.params.arguments ?? {};
                switch (request.params.name) {
                    case 'people_enrichment': {
                        const result = await this.apollo.peopleEnrichment(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'organization_enrichment': {
                        const result = await this.apollo.organizationEnrichment(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'people_search': {
                        const result = await this.apollo.peopleSearch(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'organization_search': {
                        const result = await this.apollo.organizationSearch(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'organization_job_postings': {
                        const result = await this.apollo.organizationJobPostings(args.organization_id);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'get_person_email': {
                        const result = await this.apollo.getPersonEmail(args.apollo_id);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    case 'employees_of_company': {
                        const result = await this.apollo.employeesOfCompany(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error(`Error executing tool ${request.params.name}:`, error);
                return {
                    content: [{
                            type: 'text',
                            text: `Apollo.io API error: ${error.message}`
                        }],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('Apollo.io Lead Generation MCP server started');
    }
}
export async function serve() {
    const server = new ApolloServer();
    await server.run();
}
const server = new ApolloServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map