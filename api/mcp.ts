import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { ApolloClient } from '../dist/apollo-client.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Apollo.io client with API key from environment
const apiKey = process.env.APOLLO_IO_API_KEY;
if (!apiKey) {
  throw new Error('APOLLO_IO_API_KEY environment variable is required');
}

const apollo = new ApolloClient(apiKey);

// Define tools configuration
const tools: Tool[] = [
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
async function executeTool(toolName: string, args: any) {
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
        const result = await apollo.organizationJobPostings(args.organization_id as string);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
      
      case 'get_person_email': {
        const result = await apollo.getPersonEmail(args.apollo_id as string);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
      
      case 'employees_of_company': {
        const result = await apollo.employeesOfCompany(args as any);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
    }
  } catch (error: any) {
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

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Create MCP server instance
  const server = new Server(
    {
      name: 'apollo-io-lead-gen',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Setup tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = request.params.arguments ?? {};
    return await executeTool(request.params.name, args);
  });

  // Handle SSE transport for MCP
  const transport = new SSEServerTransport('/api/mcp', res);
  await server.connect(transport);

  // Keep connection alive
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
}
