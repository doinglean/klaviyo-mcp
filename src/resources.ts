/**
 * MCP Resources for Klaviyo
 *
 * Resources provide URI-based access to Klaviyo data without requiring
 * explicit tool calls. This enables AI assistants to load context passively.
 *
 * URI Format: klaviyo://{resource_type}/{id}
 */

import type { KlaviyoClient } from './api/client.js';
import { logger } from './utils/logger.js';

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Available resource templates
 */
export const resourceTemplates: ResourceTemplate[] = [
  {
    uriTemplate: 'klaviyo://profile/{id}',
    name: 'Klaviyo Profile',
    description: 'Access a Klaviyo profile by ID. Returns profile attributes, subscriptions, and custom properties.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://list/{id}',
    name: 'Klaviyo List',
    description: 'Access a Klaviyo list by ID. Returns list details including profile count.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://segment/{id}',
    name: 'Klaviyo Segment',
    description: 'Access a Klaviyo segment by ID. Returns segment definition and profile count.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://campaign/{id}',
    name: 'Klaviyo Campaign',
    description: 'Access a Klaviyo campaign by ID. Returns campaign details, audiences, and send settings.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://flow/{id}',
    name: 'Klaviyo Flow',
    description: 'Access a Klaviyo flow by ID. Returns flow details, status, and trigger information.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://template/{id}',
    name: 'Klaviyo Template',
    description: 'Access a Klaviyo email template by ID. Returns template HTML and text content.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://metric/{id}',
    name: 'Klaviyo Metric',
    description: 'Access a Klaviyo metric by ID. Returns metric details and integration info.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'klaviyo://tag/{id}',
    name: 'Klaviyo Tag',
    description: 'Access a Klaviyo tag by ID. Returns tag details and associated resources.',
    mimeType: 'application/json',
  },
];

/**
 * Parse a resource URI and extract type and ID
 */
export function parseResourceUri(uri: string): { type: string; id: string } | null {
  const match = uri.match(/^klaviyo:\/\/(\w+)\/(.+)$/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

/**
 * Fetch resource content by URI
 */
export async function fetchResource(
  client: KlaviyoClient,
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  const parsed = parseResourceUri(uri);
  if (!parsed) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const { type, id } = parsed;
  logger.debug(`Fetching resource: ${type}/${id}`);

  try {
    let data: unknown;

    switch (type) {
      case 'profile':
        data = await client.getProfile(id, {
          additional_fields: ['subscriptions', 'predictive_analytics'],
        });
        break;

      case 'list':
        data = await client.getList(id, { include_profile_count: true });
        break;

      case 'segment':
        data = await client.getSegment(id, { include_profile_count: true });
        break;

      case 'campaign':
        data = await client.getCampaign(id, {
          include: ['campaign-messages', 'tags'],
        });
        break;

      case 'flow':
        data = await client.getFlow(id, {
          include: ['flow-actions', 'tags'],
        });
        break;

      case 'template':
        data = await client.getTemplate(id);
        break;

      case 'metric':
        data = await client.getMetric(id);
        break;

      case 'tag':
        data = await client.getTag(id, {
          include: ['tag-group'],
        });
        break;

      default:
        throw new Error(`Unknown resource type: ${type}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to fetch resource ${uri}: ${message}`);
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error fetching resource: ${message}`,
        },
      ],
    };
  }
}

/**
 * Get list of available resource templates
 */
export function getResourceTemplates(): ResourceTemplate[] {
  return resourceTemplates;
}
