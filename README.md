# Klaviyo MCP Server

[![npm version](https://badge.fury.io/js/klaviyo-mcp.svg)](https://www.npmjs.com/package/klaviyo-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides AI assistants like Claude with seamless access to Klaviyo's email marketing and automation platform.

## Overview

This MCP server wraps Klaviyo's REST API, enabling AI assistants to:
- Manage subscriber profiles and lists
- Create and send email/SMS campaigns
- Build and analyze automation flows
- Organize resources with tags
- Track custom events and user behavior
- Query segments and analytics
- Work with email templates

**107 tools** covering Klaviyo's full marketing automation stack. Built with TypeScript and the official MCP SDK for reliable, type-safe interactions.

## Features

### Profile Management
- List, create, update, and search profiles (contacts)
- Subscribe/unsubscribe profiles to lists
- Manage profile properties and custom attributes
- Bulk profile operations

### List Management
- Create and manage mailing lists
- Add/remove profiles from lists
- Query list membership
- List statistics and insights

### Campaign Operations
- List and view campaigns (email & SMS)
- Create new campaigns
- Send campaigns to audiences
- Get recipient estimates

### Event Tracking
- Track custom events for profiles
- Query event history
- Access event metrics

### Segments & Analytics
- Query existing segments
- Get segment member profiles
- Access marketing metrics
- Aggregate metric queries

### Templates
- List and view email templates
- Create and update templates
- Render template previews

### Flow Automation
- List, view, and manage automation flows
- Access flow actions and messages
- Update flow status (live/draft/manual)
- **Flow Analytics**: Aggregate performance reports (opens, clicks, revenue)
- **Flow Time Series**: Daily/weekly/monthly performance data

### Tags & Organization
- Create and manage tags for organizing resources
- Tag groups for hierarchical organization
- Tag/untag campaigns, flows, lists, segments
- Query tagged resources

## Installation

### Prerequisites
- Node.js 18 or higher
- A Klaviyo account with API access
- Claude Desktop or Claude Code

### NPM Installation

```bash
npm install -g klaviyo-mcp
```

### Manual Installation

```bash
git clone https://github.com/doinglean/klaviyo-mcp.git
cd klaviyo-mcp
npm install
npm run build
```

## Configuration

### 1. Get Your Klaviyo API Key

1. Log in to your [Klaviyo account](https://www.klaviyo.com/login)
2. Go to **Settings** → **API Keys**
3. Click **Create Private API Key**
4. Select the required scopes (see [Required Scopes](#required-scopes))
5. Copy the generated key (starts with `pk_`)

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "klaviyo": {
      "command": "npx",
      "args": ["klaviyo-mcp"],
      "env": {
        "KLAVIYO_API_KEY": "pk_your_private_api_key_here"
      }
    }
  }
}
```

### 3. Configure Claude Code (CLI)

```bash
# Add the MCP server
claude mcp add klaviyo-mcp -e KLAVIYO_API_KEY=pk_your_private_api_key_here

# Or with environment variable
export KLAVIYO_API_KEY=pk_your_private_api_key_here
claude mcp add klaviyo-mcp
```

### Required Scopes

Your API key needs these scopes for full functionality:

| Scope | Required For |
|-------|--------------|
| `profiles:read` | List/get profiles |
| `profiles:write` | Create/update profiles, subscriptions |
| `lists:read` | List/get lists |
| `lists:write` | Create/update/delete lists, manage members |
| `campaigns:read` | List/get campaigns |
| `campaigns:write` | Create/send campaigns |
| `events:read` | Query events |
| `events:write` | Track events |
| `flows:read` | List/get flows, actions, messages |
| `flows:write` | Update flow/action status, delete flows |
| `segments:read` | List/get segments |
| `tags:read` | List/get tags and tag groups |
| `tags:write` | Create/update/delete tags, tag resources |
| `templates:read` | List/get templates |
| `templates:write` | Create/update templates |
| `metrics:read` | Query metrics/analytics |

## Usage Examples

### With Claude Desktop / Claude Code

Once configured, you can interact with Klaviyo naturally:

**Profile Management**
```
"Show me all profiles that subscribed this week"
"Create a new profile for john@example.com with first name John"
"Update the profile for sarah@example.com to add phone number +1234567890"
"Find the profile with email marketing@company.com"
```

**List Operations**
```
"List all my Klaviyo lists"
"Create a new list called 'Product Launch 2024'"
"Add john@example.com to the Newsletter list"
"How many subscribers are in my VIP Customers list?"
"Remove inactive users from the Weekly Digest list"
```

**Campaign Management**
```
"Show me all email campaigns from last month"
"What's the status of my Black Friday campaign?"
"How many recipients will receive the Welcome Series campaign?"
"Create a new email campaign targeting the Newsletter list"
```

**Event Tracking**
```
"Track a 'Product Viewed' event for john@example.com with product_id ABC123"
"Show me recent 'Placed Order' events"
"What events has sarah@example.com triggered?"
```

**Analytics**
```
"What are my email open rates this month?"
"Show me the available metrics in my account"
"How many emails were sent last week?"
```

**Templates**
```
"List my email templates"
"Show me the Welcome Email template"
"Render a preview of the Order Confirmation template"
```

**Flow Automation**
```
"List all my active flows"
"Show me the Welcome Series flow performance"
"What's the revenue from my Abandoned Cart flow this month?"
"Get daily open rates for my Post-Purchase flow"
"Pause the Flash Sale flow"
```

**Tags & Organization**
```
"Create a tag called 'Q1 2024' for organizing campaigns"
"Tag my Black Friday campaign with 'Holiday'"
"Show me all flows tagged with 'Automated'"
"List all my tag groups"
"What resources are tagged with 'VIP'?"
```

## Available Tools

### Profiles

| Tool | Description |
|------|-------------|
| `klaviyo_profiles_list` | List profiles with filtering (email, phone, dates) |
| `klaviyo_profiles_get` | Get a specific profile by ID |
| `klaviyo_profiles_create` | Create a new profile |
| `klaviyo_profiles_update` | Update profile properties |
| `klaviyo_profiles_subscribe` | Subscribe profile to list(s) |
| `klaviyo_profiles_suppress` | Suppress/unsubscribe a profile |

### Lists

| Tool | Description |
|------|-------------|
| `klaviyo_lists_list` | Get all lists in account |
| `klaviyo_lists_get` | Get list details by ID |
| `klaviyo_lists_create` | Create a new list |
| `klaviyo_lists_update` | Update list name/settings |
| `klaviyo_lists_delete` | Delete a list |
| `klaviyo_lists_add_profiles` | Add profile(s) to a list |
| `klaviyo_lists_remove_profiles` | Remove profile(s) from a list |
| `klaviyo_lists_get_profiles` | Get all profiles in a list |

### Campaigns

| Tool | Description |
|------|-------------|
| `klaviyo_campaigns_list` | List campaigns (filter by email/sms) |
| `klaviyo_campaigns_get` | Get campaign details |
| `klaviyo_campaigns_create` | Create a new campaign |
| `klaviyo_campaigns_update` | Update campaign settings |
| `klaviyo_campaigns_delete` | Delete a campaign |
| `klaviyo_campaigns_send` | Trigger campaign send |
| `klaviyo_campaigns_get_recipients` | Get recipient count estimate |

### Events

| Tool | Description |
|------|-------------|
| `klaviyo_events_track` | Track a custom event for a profile |
| `klaviyo_events_list` | List events with filtering |
| `klaviyo_events_get` | Get event details |

### Segments

| Tool | Description |
|------|-------------|
| `klaviyo_segments_list` | List all segments |
| `klaviyo_segments_get` | Get segment details |
| `klaviyo_segments_get_profiles` | Get profiles in a segment |

### Templates

| Tool | Description |
|------|-------------|
| `klaviyo_templates_list` | List email templates |
| `klaviyo_templates_get` | Get template content |
| `klaviyo_templates_create` | Create a new template |
| `klaviyo_templates_render` | Render template preview |

### Metrics

| Tool | Description |
|------|-------------|
| `klaviyo_metrics_list` | List available metrics |
| `klaviyo_metrics_query` | Query aggregate metric data |

### Flows

| Tool | Description |
|------|-------------|
| `klaviyo_flows_list` | List all flows with filtering |
| `klaviyo_flows_get` | Get flow details by ID |
| `klaviyo_flows_update` | Update flow status (live/draft/manual) |
| `klaviyo_flows_delete` | Delete a flow |
| `klaviyo_flows_get_actions` | Get all actions in a flow |
| `klaviyo_flows_get_messages` | Get all messages in a flow |
| `klaviyo_flows_get_tags` | Get tags for a flow |
| `klaviyo_flow_actions_get` | Get flow action details |
| `klaviyo_flow_actions_update` | Update flow action status |
| `klaviyo_flow_actions_get_messages` | Get messages for a flow action |
| `klaviyo_flow_actions_get_flow` | Get parent flow of an action |
| `klaviyo_flow_messages_get` | Get flow message details |
| `klaviyo_flow_messages_get_template` | Get template for a flow message |
| `klaviyo_flow_messages_get_action` | Get parent action of a message |
| `klaviyo_flow_values_report` | **Analytics**: Aggregate flow performance |
| `klaviyo_flow_series_report` | **Analytics**: Time series flow data |

### Tags

| Tool | Description |
|------|-------------|
| `klaviyo_tags_list` | List all tags |
| `klaviyo_tags_get` | Get tag details |
| `klaviyo_tags_create` | Create a new tag |
| `klaviyo_tags_update` | Update tag name |
| `klaviyo_tags_delete` | Delete a tag |
| `klaviyo_tags_add_to_resource` | Tag a resource (campaign, flow, list, segment) |
| `klaviyo_tags_remove_from_resource` | Remove tag from a resource |
| `klaviyo_tags_get_resources` | Get all resources with a tag |
| `klaviyo_tags_get_tag_group` | Get tag's parent group |
| `klaviyo_tag_groups_list` | List all tag groups |
| `klaviyo_tag_groups_get` | Get tag group details |
| `klaviyo_tag_groups_create` | Create a tag group |
| `klaviyo_tag_groups_update` | Update tag group |
| `klaviyo_tag_groups_delete` | Delete a tag group |
| `klaviyo_tag_groups_get_tags` | Get all tags in a group |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KLAVIYO_API_KEY` | Yes | - | Your Klaviyo private API key |
| `KLAVIYO_API_REVISION` | No | `2025-01-15` | API version to use |
| `KLAVIYO_TIMEOUT_MS` | No | `30000` | Request timeout in milliseconds |

## Error Handling

The server provides clear error messages for common issues:

- **Invalid API Key**: Check your key starts with `pk_` and has required scopes
- **Rate Limited**: Server respects Klaviyo's rate limits and provides retry guidance
- **Not Found**: Clear messages when profiles, lists, or campaigns don't exist
- **Validation Errors**: Detailed feedback on invalid input parameters

## Development

### Setup

```bash
git clone https://github.com/doinglean/klaviyo-mcp.git
cd klaviyo-mcp
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Run Locally

```bash
KLAVIYO_API_KEY=pk_your_key npm run dev
```

### Project Structure

```
src/
├── index.ts          # Entry point
├── server.ts         # MCP server setup
├── client/           # Klaviyo API client
├── tools/            # MCP tool implementations
└── utils/            # Helpers (pagination, filters)
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow the existing code style (TypeScript, ESLint)
- Add tests for new features
- Update documentation as needed
- Keep PRs focused on a single feature/fix

## Troubleshooting

### "Invalid API key" error
- Ensure your key starts with `pk_` (private key)
- Verify the key hasn't been revoked in Klaviyo dashboard
- Check that required scopes are enabled

### "Rate limited" responses
- Klaviyo has strict rate limits (varies by endpoint)
- The server automatically handles rate limiting with retries
- For bulk operations, allow time between requests

### Tools not appearing in Claude
- Restart Claude Desktop after config changes
- Check the config file syntax is valid JSON
- Verify the server starts without errors: `KLAVIYO_API_KEY=pk_test npx klaviyo-mcp`

### Connection timeout
- Check your network connection
- Verify Klaviyo's API status at [status.klaviyo.com](https://status.klaviyo.com)
- Try increasing `KLAVIYO_TIMEOUT_MS`

## API Reference

This server wraps Klaviyo's REST API. For detailed API documentation:
- [Klaviyo API Docs](https://developers.klaviyo.com/)
- [API Reference](https://developers.klaviyo.com/en/reference/api-overview)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Klaviyo](https://www.klaviyo.com/) for their comprehensive API
- [Anthropic](https://www.anthropic.com/) for the MCP specification
- The MCP community for tooling and examples

---

**Note:** This is an unofficial integration. Klaviyo is a trademark of Klaviyo, Inc.
