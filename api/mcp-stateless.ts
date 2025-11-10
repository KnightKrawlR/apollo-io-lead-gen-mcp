import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { ApolloClient } from '../dist/apollo-client.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  }
];

// Stateless request handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Apollo-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get API key from header
  const apiKey = req.headers['x-apollo-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Missing API key. Please provide your Apollo.io API key in the X-Apollo-API-Key header'
      },
      id: null
    });
  }

  try {
    const body = req.body;

    // Handle initialize request
    if (body.method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'apollo-lead-gen',
            version: '1.0.0'
          }
        },
        id: body.id
      });
    }

    // Handle tools/list request
    if (body.method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        result: {
          tools: tools
        },
        id: body.id
      });
    }

    // Handle tools/call request
    if (body.method === 'tools/call') {
      const apollo = new ApolloClient(apiKey);
      const { name, arguments: args } = body.params;

      let result;
      
      try {
        switch (name) {
          case 'organization_search':
            result = await apollo.searchOrganizations(args);
            break;
          case 'people_search':
            result = await apollo.searchPeople(args);
            break;
          case 'people_enrichment':
            result = await apollo.enrichPerson(args);
            break;
          case 'organization_enrichment':
            result = await apollo.enrichOrganization(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          },
          id: body.id
        });
      } catch (error: any) {
        return res.status(200).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message || 'Internal error'
          },
          id: body.id
        });
      }
    }

    // Unknown method
    return res.status(200).json({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: `Method not found: ${body.method}`
      },
      id: body.id
    });

  } catch (error: any) {
    console.error('Error handling request:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message || 'Internal server error'
      },
      id: null
    });
  }
}
