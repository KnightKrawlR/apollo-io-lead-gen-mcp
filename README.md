# Apollo.io Lead Generation MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Apollo.io API](https://img.shields.io/badge/Apollo.io%20API-v1-orange.svg)](https://docs.apollo.io/reference/introduction)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.8.0-green.svg)](https://github.com/modelcontextprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enhanced Model Context Protocol (MCP) server for Apollo.io with comprehensive lead generation capabilities. Perfect for finding HVAC businesses, decision makers, and building targeted prospect lists.

## Overview

This MCP server provides powerful lead generation tools for interacting with the Apollo.io API, allowing AI assistants to:

- **Search for companies** by industry keywords (e.g., "hvac", "heating", "cooling"), location, size, and revenue
- **Find decision makers** by job title, seniority level, and company criteria
- **Enrich contact data** to get detailed information including emails and phone numbers
- **Build targeted prospect lists** for B2B sales and marketing campaigns
- **Automate lead research** without leaving your AI assistant interface

## Key Features

### Enhanced Organization Search
- Search by industry keywords (`q_organization_keyword_tags`)
- Filter by location, employee count, and revenue
- Exclude specific locations
- Filter by technologies used
- Full pagination support

### Enhanced People Search
- Find people by job title and seniority level
- Filter by personal location or company location
- Search within specific companies (by organization IDs)
- Filter by email availability status
- Filter by employer size and revenue
- Full pagination support

### Additional Tools
- **People Enrichment**: Get detailed contact information for individuals
- **Organization Enrichment**: Get comprehensive company data
- **Organization Job Postings**: Find active job listings
- **Get Person Email**: Reveal email addresses for contacts
- **Employees of Company**: Find all employees at a specific company

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd apollo-io-lead-gen-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

The server requires an Apollo.io API access token. You can obtain one by:

1. Going to your [Apollo.io Account](https://app.apollo.io/)
2. Navigating to Settings > API
3. Generating an API key

You can provide the token in two ways:

1. As an environment variable:
   ```
   APOLLO_IO_API_KEY=your-api-key
   ```

2. As a command-line argument:
   ```
   npm start -- --api-key=your-api-key
   ```

For development, create a `.env` file in the project root:

```
APOLLO_IO_API_KEY=your-api-key
```

## Usage

### Starting the Server

```bash
# Start the server
npm start

# Or with a specific API key
npm start -- --api-key=your-api-key

# Run the SSE server with authentication
npx mcp-proxy-auth node dist/index.js
```

### Example: Finding HVAC Businesses in North Carolina

Using the `organization_search` tool:

```json
{
  "q_organization_keyword_tags": ["hvac", "heating", "cooling"],
  "organization_locations": ["north carolina"],
  "organization_num_employees_ranges": ["1,50"],
  "per_page": 100
}
```

### Example: Finding Decision Makers at HVAC Companies

Using the `people_search` tool:

```json
{
  "q_organization_keyword_tags": ["hvac"],
  "organization_locations": ["north carolina"],
  "person_seniorities": ["owner", "c_suite", "manager"],
  "person_titles": ["owner", "president", "ceo", "office manager"],
  "contact_email_status": ["verified", "likely_to_engage"],
  "per_page": 100
}
```

## Available Tools

### 1. organization_search
Search for companies using comprehensive filters.

**Parameters:**
- `q_organization_keyword_tags` (array): Industry keywords (e.g., ["hvac", "heating"])
- `organization_locations` (array): HQ locations (e.g., ["north carolina", "texas"])
- `organization_not_locations` (array): Locations to exclude
- `organization_num_employees_ranges` (array): Employee ranges (e.g., ["1,10", "10,50"])
- `q_organization_name` (string): Company name (partial matches)
- `revenue_range` (object): Min/max revenue filter
- `currently_using_any_of_technology_uids` (array): Technologies used
- `page` (number): Page number for pagination
- `per_page` (number): Results per page (max 100)

### 2. people_search
Search for people/contacts using comprehensive filters.

**Parameters:**
- `person_titles` (array): Job titles (e.g., ["owner", "ceo", "president"])
- `person_seniorities` (array): Seniority levels (owner, founder, c_suite, vp, manager, etc.)
- `person_locations` (array): Where people live
- `organization_locations` (array): Company HQ locations
- `organization_ids` (array): Specific company IDs from organization_search
- `organization_num_employees_ranges` (array): Employer size
- `q_organization_keyword_tags` (array): Employer industry keywords
- `contact_email_status` (array): Email status (verified, unverified, likely_to_engage)
- `revenue_range` (object): Employer revenue filter
- `page` (number): Page number
- `per_page` (number): Results per page (max 100)

### 3. people_enrichment
Enrich a single person's data.

**Parameters:**
- `first_name` (string): Person's first name
- `last_name` (string): Person's last name
- `email` (string): Person's email
- `domain` (string): Company domain
- `organization_name` (string): Organization name
- `linkedin_url` (string): LinkedIn profile URL

### 4. organization_enrichment
Enrich a single company's data.

**Parameters:**
- `domain` (string): Company domain
- `name` (string): Company name

### 5. organization_job_postings
Find job postings for a company.

**Parameters:**
- `organization_id` (string, required): Apollo.io organization ID

### 6. get_person_email
Get email address for a person.

**Parameters:**
- `apollo_id` (string, required): Apollo.io person ID

### 7. employees_of_company
Find employees at a specific company.

**Parameters:**
- `company` (string, required): Company name
- `website_url` (string): Company website
- `linkedin_url` (string): Company LinkedIn URL
- `person_seniorities` (string): Comma-separated seniority levels
- `contact_email_status` (string): Comma-separated email statuses

## Lead Generation Workflow

### Step 1: Find Target Companies
Use `organization_search` to find companies matching your criteria (e.g., HVAC businesses in specific locations).

### Step 2: Find Decision Makers
Use `people_search` with the organization IDs from Step 1 to find decision makers at those companies.

### Step 3: Enrich Contact Data
Use `get_person_email` or `people_enrichment` to get full contact details for your prospects.

### Step 4: Build Your List
Export the results and use them for your sales and marketing campaigns.

## Deployment on Vercel

This MCP server can be deployed on Vercel for production use. See the deployment guide in the repository for instructions.

## API Credits

**Important:** This server uses the Apollo.io API, which consumes credits per call. The search endpoints are not available on Apollo.io free plans. Make sure you have an appropriate Apollo.io subscription.

## Rate Limits

Apollo.io enforces rate limits on API calls. The server will return appropriate error messages if rate limits are exceeded.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Enhanced by Manus AI based on the original [apollo-io-mcp-server](https://github.com/lkm1developer/apollo-io-mcp-server) by Lakhvinder Singh.

## Keywords

Apollo.io, Model Context Protocol, MCP, AI Assistant, TypeScript, API Integration, Lead Generation, HVAC, B2B Sales, People Search, Organization Search, Contact Enrichment, Prospect Research
