import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { KlaviyoClient, KlaviyoError, KlaviyoRateLimitError } from './api/client.js';
import { getAllTools, handleToolCall } from './tools/index.js';

// Get configuration from environment
const apiKey = process.env.KLAVIYO_API_KEY;
const revision = process.env.KLAVIYO_API_REVISION;
const timeout = process.env.KLAVIYO_TIMEOUT_MS
  ? parseInt(process.env.KLAVIYO_TIMEOUT_MS, 10)
  : undefined;

if (!apiKey) {
  console.error('Error: KLAVIYO_API_KEY environment variable is required');
  console.error('Set it to your Klaviyo private API key (starts with pk_)');
  process.exit(1);
}

// Initialize Klaviyo client
const client = new KlaviyoClient(apiKey, { revision, timeout });

// Initialize MCP server
const server = new Server(
  {
    name: 'klaviyo-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getAllTools(),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(client, name, args ?? {});

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      return {
        content: [
          {
            type: 'text',
            text: `Validation error: ${issues}`,
          },
        ],
        isError: true,
      };
    }

    // Handle Klaviyo rate limit errors
    if (error instanceof KlaviyoRateLimitError) {
      const retryMsg = error.retryAfter
        ? ` Retry after ${error.retryAfter} seconds.`
        : '';
      return {
        content: [
          {
            type: 'text',
            text: `Rate limit exceeded.${retryMsg}`,
          },
        ],
        isError: true,
      };
    }

    // Handle other Klaviyo errors
    if (error instanceof KlaviyoError) {
      return {
        content: [
          {
            type: 'text',
            text: `Klaviyo API error (${error.statusCode ?? 'unknown'}): ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    // Handle unknown errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Klaviyo MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
