# Apollo.io Lead Generation MCP - Manus Configuration Guide

## 🎉 Your MCP Server is Live!

**Server URL:** `https://apollo-mcp-enhanced.vercel.app/api/mcp`

**GitHub Repository:** https://github.com/KnightKrawlR/apollo-io-lead-gen-mcp

---

## Quick Start: Add to Manus

To use this MCP server in Manus, you need to add it as a custom MCP server with your Apollo.io API key.

### Step 1: Get Your Apollo.io API Key

1. Go to https://app.apollo.io/
2. Navigate to **Settings** > **API**
3. Generate an API key (or use your existing one)
4. Copy the API key

### Step 2: Add Custom MCP Server in Manus

In Manus, add the following custom MCP server configuration:

**Server URL:**
```
https://apollo-mcp-enhanced.vercel.app/api/mcp
```

**Headers:**
```json
{
  "X-Apollo-API-Key": "YOUR_APOLLO_IO_API_KEY_HERE"
}
```

**Replace** `YOUR_APOLLO_IO_API_KEY_HERE` with your actual Apollo.io API key from Step 1.

---

## Available Tools

Once configured, you'll have access to these 7 powerful lead generation tools:

### 1. **organization_search**
Search for companies by industry, location, size, and revenue.

**Example prompts:**
- "Find HVAC companies in North Carolina with 10-50 employees"
- "Search for heating and cooling businesses in Texas"
- "Find companies in the HVAC industry with revenue between $1M-$5M"

**Key parameters:**
- `q_organization_keyword_tags`: ["hvac", "heating", "cooling"]
- `organization_locations`: ["north carolina", "texas"]
- `organization_num_employees_ranges`: ["1,10", "10,50", "50,100"]
- `revenue_range`: {min: 1000000, max: 5000000}
- `per_page`: 100 (max)

### 2. **people_search**
Find decision makers by job title, seniority, and company criteria.

**Example prompts:**
- "Find owners and CEOs at HVAC companies in North Carolina"
- "Search for office managers at heating companies with verified emails"
- "Find decision makers at HVAC businesses in Atlanta"

**Key parameters:**
- `person_titles`: ["owner", "ceo", "president", "office manager"]
- `person_seniorities`: ["owner", "founder", "c_suite", "manager"]
- `q_organization_keyword_tags`: ["hvac", "heating"]
- `organization_locations`: ["north carolina"]
- `contact_email_status`: ["verified", "likely_to_engage"]
- `per_page`: 100 (max)

### 3. **people_enrichment**
Get detailed contact information for a specific person.

**Example prompts:**
- "Enrich contact data for John Smith at ABC HVAC"
- "Get detailed information for john.smith@abchvac.com"

### 4. **organization_enrichment**
Get detailed company information including revenue, employee count, and technologies.

**Example prompts:**
- "Get detailed information about ABC HVAC Company"
- "Enrich data for abchvac.com"

### 5. **organization_job_postings**
Find active job postings at a company (requires organization ID from search).

**Example prompts:**
- "Find job postings at this company" (after getting organization ID)

### 6. **get_person_email**
Reveal the actual email address for a contact (requires person ID from search).

**Example prompts:**
- "Get the email address for this person" (after getting person ID)

### 7. **employees_of_company**
Find all employees at a specific company with optional filters.

**Example prompts:**
- "Find all employees at ABC HVAC"
- "Get owners and managers at XYZ Heating & Cooling"

---

## Complete Lead Generation Workflow

Here's how to use these tools together for HVAC lead generation:

### Workflow 1: Find HVAC Companies in a Region

**Step 1:** Search for companies
```
"Find HVAC companies in North Carolina with 10-50 employees"
```
This uses `organization_search` with:
- Keywords: ["hvac", "heating", "cooling"]
- Location: ["north carolina"]
- Employee range: ["10,50"]

**Step 2:** Get decision makers
```
"Find owners and CEOs at these companies"
```
This uses `people_search` with the organization IDs from Step 1.

**Step 3:** Enrich contact data
```
"Get email addresses for these contacts"
```
This uses `get_person_email` for each person ID.

### Workflow 2: Deep Dive on Specific Company

**Step 1:** Find the company
```
"Search for ABC HVAC in Atlanta"
```

**Step 2:** Get company details
```
"Get detailed information about this company"
```
Uses `organization_enrichment`.

**Step 3:** Find employees
```
"Find all employees at this company"
```
Uses `employees_of_company`.

**Step 4:** Get contact details
```
"Get verified email addresses for the owner and office manager"
```

---

## Example Manus Conversations

Once configured, you can have natural conversations like:

**You:** "I need to build a list of HVAC companies in North Carolina that have 10-50 employees. I want to find the owners and get their contact information."

**Manus will:**
1. Use `organization_search` to find HVAC companies
2. Use `people_search` to find owners at those companies
3. Use `get_person_email` to reveal email addresses
4. Compile the results into a structured list for you

**You:** "Find heating and cooling businesses in Texas with verified email addresses for decision makers."

**Manus will:**
1. Search for companies with keywords ["heating", "cooling"]
2. Filter for Texas location
3. Find people with seniority levels ["owner", "c_suite", "manager"]
4. Filter for verified email status
5. Return the results

---

## Important Notes

### API Credits
- Each search and enrichment call consumes Apollo.io API credits
- Credits are deducted from YOUR Apollo.io account
- Monitor your usage in your Apollo.io dashboard

### Rate Limits
- Apollo.io enforces rate limits on API calls
- The MCP server will return error messages if limits are exceeded
- Spread out large searches to avoid hitting limits

### Pagination
- Search results are paginated (max 100 per page)
- Use the `page` parameter to get additional results
- Example: "Get page 2 of the previous search"

### Security
- Your API key is sent via HTTPS (encrypted)
- Your API key is NOT stored on the server
- Each request includes your API key in the header
- Keep your API key confidential

---

## Troubleshooting

### "Missing API key" error
- Check that you've added the `X-Apollo-API-Key` header in Manus
- Verify your API key is correct (no extra spaces)

### "Invalid API key" error
- Your Apollo.io API key may be incorrect or expired
- Generate a new API key in Apollo.io settings

### No results returned
- Try broader search criteria
- Check that your Apollo.io account has access to the data
- Verify your account has available credits

### Rate limit errors
- Wait a few minutes before trying again
- Reduce the number of requests
- Contact Apollo.io support to increase your limits

---

## Sharing This MCP Server

You can share the server URL with others! Each person needs to:
1. Get their own Apollo.io API key
2. Add the custom MCP server in Manus with their API key
3. Start using the tools

The server is multi-tenant and scales automatically.

---

## Technical Details

**Architecture:**
- Hosted on Vercel (serverless)
- No API keys stored on server
- Stateless (each request is independent)
- HTTPS encrypted communication

**GitHub Repository:**
https://github.com/KnightKrawlR/apollo-io-lead-gen-mcp

**Source Code:**
- TypeScript
- MCP SDK 1.8.0
- Apollo.io API v1
- Vercel Serverless Functions

---

## Support & Updates

**Issues or Questions:**
- Check the GitHub repository for updates
- Review Apollo.io API documentation: https://docs.apollo.io/

**Future Enhancements:**
- Additional search filters
- Bulk operations
- Export functionality
- Integration with CRM systems

---

## Summary

You now have a fully functional, production-ready MCP server for Apollo.io lead generation!

**Your Configuration String:**
```
Server URL: https://apollo-mcp-enhanced.vercel.app/api/mcp
Header: X-Apollo-API-Key: YOUR_APOLLO_IO_API_KEY_HERE
```

Start generating leads for your HVAC AI customer support platform! 🚀
