# Klaviyo MCP Server - Implementation Plan

## Overview

This document outlines the implementation plan for building a Model Context Protocol (MCP) server that wraps Klaviyo's REST API, enabling AI assistants like Claude to interact with Klaviyo for email marketing automation.

**Repository:** https://github.com/doinglean/klaviyo-mcp

---

## 1. API Analysis Summary

### Klaviyo API Characteristics
- **Base URL:** `https://a.klaviyo.com`
- **API Version:** `2026-01-15` (specified via `revision` header)
- **Format:** JSON:API specification
- **Authentication:** Private API Key (header-based)
- **Rate Limits:** Vary by endpoint (typically 10-350 burst/s, 150-3500 steady/m)

### Key API Categories (from OpenAPI spec)
| Category | Description | Priority |
|----------|-------------|----------|
| Profiles | Contact/subscriber management | **HIGH** |
| Lists | Mailing list management | **HIGH** |
| Campaigns | Email/SMS campaign operations | **HIGH** |
| Events | Track custom events | **HIGH** |
| Segments | Audience segmentation | MEDIUM |
| Flows | Automation workflows | MEDIUM |
| Templates | Email templates | MEDIUM |
| Metrics | Analytics and reporting | MEDIUM |
| Catalogs | Product catalog management | LOW |
| Tags | Resource organization | LOW |
| Accounts | Account information | LOW |

---

## 2. Prioritized Endpoints (MVP Scope)

### Phase 1: Core Profile & List Management (Essential)

**Profiles (Contacts)**
- `GET /api/profiles` - List profiles with filtering
- `GET /api/profiles/{id}` - Get profile by ID
- `POST /api/profiles` - Create profile
- `PATCH /api/profiles/{id}` - Update profile
- `POST /api/profile-subscription-bulk-create-jobs` - Subscribe profiles to lists
- `POST /api/profile-suppression-bulk-create-jobs` - Suppress profiles

**Lists**
- `GET /api/lists` - Get all lists
- `GET /api/lists/{id}` - Get list by ID
- `POST /api/lists` - Create list
- `PATCH /api/lists/{id}` - Update list
- `DELETE /api/lists/{id}` - Delete list
- `GET /api/lists/{id}/profiles` - Get profiles in list
- `POST /api/lists/{id}/relationships/profiles` - Add profiles to list
- `DELETE /api/lists/{id}/relationships/profiles` - Remove profiles from list

### Phase 2: Campaigns & Events (High Value)

**Campaigns**
- `GET /api/campaigns` - List campaigns (filter by channel: email/sms)
- `GET /api/campaigns/{id}` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `PATCH /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign
- `POST /api/campaign-send-jobs` - Send campaign
- `GET /api/campaign-recipient-estimations/{id}` - Get recipient count

**Events (Tracking)**
- `POST /api/events` - Create/track event
- `GET /api/events` - List events
- `GET /api/events/{id}` - Get event details
- `GET /api/metrics` - Get available metrics
- `GET /api/metrics/{id}` - Get metric details

### Phase 3: Segments & Templates (Enhanced)

**Segments**
- `GET /api/segments` - List segments
- `GET /api/segments/{id}` - Get segment details
- `GET /api/segments/{id}/profiles` - Get profiles in segment
- `POST /api/segments` - Create segment
- `PATCH /api/segments/{id}` - Update segment

**Templates**
- `GET /api/templates` - List templates
- `GET /api/templates/{id}` - Get template
- `POST /api/templates` - Create template
- `PATCH /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/template-clone` - Clone template
- `POST /api/template-render` - Render template preview

### Phase 4: Analytics & Flows (Advanced)

**Metrics & Reporting**
- `POST /api/metric-aggregates` - Query aggregate metrics
- `GET /api/metrics/{id}/export` - Export metric data

**Flows**
- `GET /api/flows` - List flows
- `GET /api/flows/{id}` - Get flow details
- `PATCH /api/flows/{id}` - Update flow status (draft/live)

---

## 3. Tech Stack

### Core Technologies
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | **TypeScript** | Type safety, excellent MCP SDK support |
| Runtime | **Node.js 18+** | LTS, native fetch, stable |
| MCP SDK | **@modelcontextprotocol/sdk** | Official SDK |
| HTTP Client | **Native fetch** | Built-in, no dependencies |
| Validation | **Zod** | Runtime type validation, schema inference |
| Build | **tsup** | Fast, zero-config bundler |
| Testing | **Vitest** | Fast, TypeScript native |

### Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 4. Project Structure

```
klaviyo-mcp/
├── src/
│   ├── index.ts              # Entry point, MCP server setup
│   ├── server.ts             # MCP server implementation
│   ├── client/
│   │   ├── klaviyo.ts        # Klaviyo API client
│   │   ├── types.ts          # API response types
│   │   └── errors.ts         # Custom error classes
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── profiles.ts       # Profile tools
│   │   ├── lists.ts          # List tools
│   │   ├── campaigns.ts      # Campaign tools
│   │   ├── events.ts         # Event/tracking tools
│   │   ├── segments.ts       # Segment tools
│   │   ├── templates.ts      # Template tools
│   │   └── metrics.ts        # Metrics/analytics tools
│   ├── resources/
│   │   └── index.ts          # MCP resources (if needed)
│   └── utils/
│       ├── pagination.ts     # Cursor pagination helpers
│       ├── filters.ts        # Klaviyo filter builder
│       └── validation.ts     # Input validation schemas
├── tests/
│   ├── client.test.ts
│   ├── tools/
│   │   └── *.test.ts
│   └── fixtures/
│       └── *.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 5. Authentication Handling

### API Key Configuration
```typescript
// Environment variable
KLAVIYO_API_KEY=pk_xxxxxxxxxxxxxxxxxxxxx

// Header format
Authorization: Klaviyo-API-Key pk_xxxxxxxxxxxxxxxxxxxxx

// Required revision header
revision: 2026-01-15
```

### Client Implementation
```typescript
class KlaviyoClient {
  private apiKey: string;
  private baseUrl = 'https://a.klaviyo.com';
  private revision = '2026-01-15';

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('pk_')) {
      throw new KlaviyoAuthError('Invalid API key format');
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
        'revision': this.revision,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    return response.json();
  }
}
```

---

## 6. Error Handling Strategy

### Error Types
```typescript
// Base error class
class KlaviyoError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: KlaviyoApiError[]
  ) {
    super(message);
    this.name = 'KlaviyoError';
  }
}

// Specific error types
class KlaviyoAuthError extends KlaviyoError {}      // 401/403
class KlaviyoNotFoundError extends KlaviyoError {}  // 404
class KlaviyoRateLimitError extends KlaviyoError {  // 429
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 429);
  }
}
class KlaviyoValidationError extends KlaviyoError {} // 400/422
```

### Error Handling in Tools
```typescript
async function handleToolExecution<T>(
  operation: () => Promise<T>,
  toolName: string
): Promise<ToolResult> {
  try {
    const result = await operation();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    if (error instanceof KlaviyoRateLimitError) {
      return {
        content: [{
          type: 'text',
          text: `Rate limited. Retry after ${error.retryAfter}s`
        }],
        isError: true
      };
    }
    // ... handle other error types
  }
}
```

---

## 7. MCP Tool Definitions

### Tool Naming Convention
`klaviyo_<resource>_<action>` (e.g., `klaviyo_profiles_list`, `klaviyo_campaigns_send`)

### Example Tool Definition
```typescript
const listProfilesTool: Tool = {
  name: 'klaviyo_profiles_list',
  description: 'List profiles (contacts) in Klaviyo with optional filtering',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Filter by email address'
      },
      phone_number: {
        type: 'string',
        description: 'Filter by phone number'
      },
      created_after: {
        type: 'string',
        description: 'ISO 8601 datetime - profiles created after this date'
      },
      page_size: {
        type: 'number',
        description: 'Number of results per page (max 100)',
        default: 20
      },
      page_cursor: {
        type: 'string',
        description: 'Pagination cursor for next page'
      }
    }
  }
};
```

### Full Tool List (MVP)

| Tool Name | Description |
|-----------|-------------|
| **Profiles** | |
| `klaviyo_profiles_list` | List profiles with filtering |
| `klaviyo_profiles_get` | Get profile by ID |
| `klaviyo_profiles_create` | Create new profile |
| `klaviyo_profiles_update` | Update existing profile |
| `klaviyo_profiles_subscribe` | Subscribe profile to list(s) |
| `klaviyo_profiles_suppress` | Suppress profile (unsubscribe) |
| **Lists** | |
| `klaviyo_lists_list` | Get all lists |
| `klaviyo_lists_get` | Get list details |
| `klaviyo_lists_create` | Create new list |
| `klaviyo_lists_update` | Update list |
| `klaviyo_lists_delete` | Delete list |
| `klaviyo_lists_add_profiles` | Add profiles to list |
| `klaviyo_lists_remove_profiles` | Remove profiles from list |
| `klaviyo_lists_get_profiles` | Get profiles in list |
| **Campaigns** | |
| `klaviyo_campaigns_list` | List campaigns (email/sms) |
| `klaviyo_campaigns_get` | Get campaign details |
| `klaviyo_campaigns_create` | Create campaign |
| `klaviyo_campaigns_update` | Update campaign |
| `klaviyo_campaigns_delete` | Delete campaign |
| `klaviyo_campaigns_send` | Trigger campaign send |
| `klaviyo_campaigns_get_recipients` | Get recipient estimate |
| **Events** | |
| `klaviyo_events_track` | Track custom event |
| `klaviyo_events_list` | List events |
| `klaviyo_events_get` | Get event details |
| **Segments** | |
| `klaviyo_segments_list` | List segments |
| `klaviyo_segments_get` | Get segment details |
| `klaviyo_segments_get_profiles` | Get profiles in segment |
| **Templates** | |
| `klaviyo_templates_list` | List templates |
| `klaviyo_templates_get` | Get template |
| `klaviyo_templates_create` | Create template |
| `klaviyo_templates_render` | Render template preview |
| **Metrics** | |
| `klaviyo_metrics_list` | List available metrics |
| `klaviyo_metrics_query` | Query metric aggregates |

---

## 8. Implementation Phases

### Phase 1: Foundation (Day 1) - ~2 hours
- [ ] Initialize project with TypeScript/tsup
- [ ] Set up MCP server boilerplate
- [ ] Implement Klaviyo API client base
- [ ] Add authentication handling
- [ ] Create error handling framework
- [ ] Write basic tests

### Phase 2: Core Tools (Day 1-2) - ~3 hours
- [ ] Implement profile tools (list, get, create, update)
- [ ] Implement list tools (CRUD + member management)
- [ ] Add pagination helpers
- [ ] Add filter builder utility
- [ ] Test with Claude Code

### Phase 3: Campaign & Event Tools (Day 2) - ~2 hours
- [ ] Implement campaign tools
- [ ] Implement event tracking tools
- [ ] Add campaign send functionality
- [ ] Test full workflow

### Phase 4: Extended Features (Day 2-3) - ~2 hours
- [ ] Implement segment tools
- [ ] Implement template tools
- [ ] Add metrics/analytics tools
- [ ] Documentation and examples

### Phase 5: Polish & Release (Day 3) - ~1 hour
- [ ] Complete README with examples
- [ ] Add CHANGELOG
- [ ] Final testing
- [ ] Publish to npm (optional)
- [ ] Push to GitHub

---

## 9. Testing Strategy

### Unit Tests
```typescript
describe('KlaviyoClient', () => {
  it('should include correct headers', async () => {
    const client = new KlaviyoClient('pk_test_key');
    // Mock fetch and verify headers
  });

  it('should handle rate limiting', async () => {
    // Mock 429 response
    // Verify KlaviyoRateLimitError is thrown
  });
});
```

### Integration Tests (with mock server)
```typescript
describe('Profile Tools', () => {
  it('should list profiles', async () => {
    // Use MSW or similar to mock Klaviyo API
  });
});
```

### Manual Testing with Claude
```bash
# Start server
npx klaviyo-mcp

# In Claude Code
/mcp add klaviyo-mcp

# Test commands
"List all my Klaviyo lists"
"Get the profile for email test@example.com"
"Create a new list called 'Newsletter Subscribers'"
```

---

## 10. Configuration Options

### Environment Variables
```bash
# Required
KLAVIYO_API_KEY=pk_your_private_api_key

# Optional
KLAVIYO_API_REVISION=2026-01-15    # API version
KLAVIYO_TIMEOUT_MS=30000           # Request timeout
KLAVIYO_MAX_RETRIES=3              # Retry count for rate limits
```

### MCP Server Config (claude_desktop_config.json)
```json
{
  "mcpServers": {
    "klaviyo": {
      "command": "npx",
      "args": ["klaviyo-mcp"],
      "env": {
        "KLAVIYO_API_KEY": "pk_your_api_key"
      }
    }
  }
}
```

---

## 11. Security Considerations

1. **API Key Protection**
   - Never log or expose API keys
   - Use environment variables only
   - Validate key format on startup

2. **Input Validation**
   - Validate all user inputs with Zod
   - Sanitize email/phone inputs
   - Limit page sizes to prevent abuse

3. **Rate Limit Respect**
   - Implement exponential backoff
   - Honor retry-after headers
   - Provide clear feedback on limits

4. **Data Handling**
   - Don't cache sensitive profile data
   - Truncate large responses for MCP output
   - Mask PII in error logs

---

## 12. Future Enhancements (Post-MVP)

1. **Bulk Operations**
   - Bulk profile import
   - Bulk event tracking
   - Bulk list management

2. **Webhooks Support**
   - Webhook registration tools
   - Event listener integration

3. **Advanced Analytics**
   - Revenue attribution
   - Campaign performance reports
   - A/B test results

4. **Flow Management**
   - Create/update flows
   - Flow action management
   - Trigger flow for profile

5. **E-commerce Integration**
   - Catalog management
   - Order tracking
   - Back-in-stock alerts

---

## Appendix: Klaviyo Filter Syntax

Klaviyo uses a custom filter syntax:
```
# Equals
equals(email,'test@example.com')

# Greater than
greater-than(created,2024-01-01T00:00:00Z)

# Any (in list)
any(id,['id1','id2'])

# Contains
contains(name,'newsletter')

# Combined
and(equals(subscribed,true),greater-than(created,2024-01-01))
```

### Filter Builder Utility
```typescript
class KlaviyoFilter {
  static equals(field: string, value: string | boolean): string {
    return `equals(${field},'${value}')`;
  }

  static greaterThan(field: string, value: string): string {
    return `greater-than(${field},${value})`;
  }

  static any(field: string, values: string[]): string {
    const formatted = values.map(v => `'${v}'`).join(',');
    return `any(${field},[${formatted}])`;
  }

  static and(...filters: string[]): string {
    return `and(${filters.join(',')})`;
  }
}
```

---

*Last Updated: 2026-01-26*
*Estimated Build Time: 8-10 hours*
