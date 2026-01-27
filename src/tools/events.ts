import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';

// Sort options for events
const EVENT_SORT_OPTIONS = [
  'datetime', '-datetime',
  'timestamp', '-timestamp',
];

// Include options for events
const EVENT_INCLUDE_OPTIONS = ['metric', 'profile'];

// Event fields
const EVENT_FIELDS = [
  'timestamp', 'datetime', 'event_properties', 'uuid',
];

export function getEventTools(): Tool[] {
  return [
    // === EVENTS CRUD ===
    {
      name: 'klaviyo_events_list',
      description: 'List events. By default fetches ALL events automatically (no manual pagination needed). WARNING: Large accounts may have millions of events - use filters (profile_id, metric_id, datetime range) or set max_results. Events track customer actions like purchases, page views, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          // Auto-pagination
          fetch_all: {
            type: 'boolean',
            description: 'Automatically fetch all pages (default: true). Set to false for single page only.',
          },
          max_results: {
            type: 'number',
            description: 'Maximum results to return when fetch_all is true (default: 500). Use lower values for large datasets!',
          },
          // Filters
          profile_id: {
            type: 'string',
            description: 'Filter events by profile ID',
          },
          metric_id: {
            type: 'string',
            description: 'Filter events by metric/event type ID',
          },
          datetime_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter events after this time',
          },
          datetime_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter events before this time',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: EVENT_SORT_OPTIONS,
            description: 'Sort by datetime or timestamp. Prefix with - for descending (newest first).',
          },
          // Include
          include: {
            type: 'array',
            items: { type: 'string', enum: EVENT_INCLUDE_OPTIONS },
            description: 'Include related resources: metric, profile',
          },
          // Sparse fieldsets
          fields_event: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit event fields returned',
          },
          fields_metric: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit metric fields returned (when included)',
          },
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned (when included)',
          },
          // Pagination
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
      },
    },
    {
      name: 'klaviyo_events_get',
      description: 'Get a specific event by ID with optional includes for metric and profile.',
      inputSchema: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: 'The Klaviyo event ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: EVENT_INCLUDE_OPTIONS },
            description: 'Include related resources',
          },
          fields_event: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit event fields returned',
          },
          fields_metric: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit metric fields returned',
          },
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned',
          },
        },
        required: ['event_id'],
      },
    },
    {
      name: 'klaviyo_events_create',
      description: 'Track a new event for a profile. Events are the foundation for Klaviyo analytics, segmentation, and automation.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_name: {
            type: 'string',
            description: 'The event/metric name (e.g., "Placed Order", "Viewed Product")',
          },
          profile: {
            type: 'object',
            description: 'Profile to associate the event with (at least one identifier required)',
            properties: {
              email: { type: 'string', description: 'Profile email' },
              phone_number: { type: 'string', description: 'Profile phone (E.164)' },
              external_id: { type: 'string', description: 'External ID' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              properties: { type: 'object', description: 'Additional profile properties' },
            },
          },
          properties: {
            type: 'object',
            description: 'Event properties (e.g., order items, product details)',
          },
          time: {
            type: 'string',
            description: 'Event timestamp (ISO 8601). Defaults to now if not provided.',
          },
          value: {
            type: 'number',
            description: 'Monetary value (e.g., order total)',
          },
          value_currency: {
            type: 'string',
            description: 'Currency code (ISO 4217, e.g., "USD")',
          },
          unique_id: {
            type: 'string',
            description: 'Unique identifier to prevent duplicate events',
          },
        },
        required: ['metric_name', 'profile', 'properties'],
      },
    },
    {
      name: 'klaviyo_events_bulk_create',
      description: 'Create multiple events in a single API call (bulk import). Efficient for syncing historical data.',
      inputSchema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            description: 'Array of events to create',
            items: {
              type: 'object',
              properties: {
                metric_name: {
                  type: 'string',
                  description: 'The event/metric name',
                },
                profile: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    phone_number: { type: 'string' },
                    external_id: { type: 'string' },
                  },
                },
                properties: {
                  type: 'object',
                  description: 'Event properties',
                },
                time: { type: 'string' },
                value: { type: 'number' },
                value_currency: { type: 'string' },
                unique_id: { type: 'string' },
              },
              required: ['metric_name', 'profile', 'properties'],
            },
          },
        },
        required: ['events'],
      },
    },

    // === EVENT RELATIONSHIPS ===
    {
      name: 'klaviyo_events_get_metric',
      description: 'Get the metric associated with an event.',
      inputSchema: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: 'The event ID',
          },
          fields_metric: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit metric fields returned',
          },
        },
        required: ['event_id'],
      },
    },
    {
      name: 'klaviyo_events_get_profile',
      description: 'Get the profile associated with an event.',
      inputSchema: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: 'The event ID',
          },
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: ['subscriptions', 'predictive_analytics'] },
            description: 'Additional profile fields to include',
          },
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned',
          },
        },
        required: ['event_id'],
      },
    },
  ];
}

// Validation schemas
const listEventsSchema = z.object({
  fetch_all: z.boolean().optional(),
  max_results: z.number().optional(),
  profile_id: z.string().optional(),
  metric_id: z.string().optional(),
  datetime_after: z.string().optional(),
  datetime_before: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  include: z.array(z.string()).optional(),
  fields_event: z.array(z.string()).optional(),
  fields_metric: z.array(z.string()).optional(),
  fields_profile: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getEventSchema = z.object({
  event_id: z.string(),
  include: z.array(z.string()).optional(),
  fields_event: z.array(z.string()).optional(),
  fields_metric: z.array(z.string()).optional(),
  fields_profile: z.array(z.string()).optional(),
});

const createEventSchema = z.object({
  metric_name: z.string(),
  profile: z.object({
    email: z.string().optional(),
    phone_number: z.string().optional(),
    external_id: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    properties: z.record(z.unknown()).optional(),
  }),
  properties: z.record(z.unknown()),
  time: z.string().optional(),
  value: z.number().optional(),
  value_currency: z.string().optional(),
  unique_id: z.string().optional(),
});

const bulkCreateEventsSchema = z.object({
  events: z.array(z.object({
    metric_name: z.string(),
    profile: z.object({
      email: z.string().optional(),
      phone_number: z.string().optional(),
      external_id: z.string().optional(),
    }),
    properties: z.record(z.unknown()),
    time: z.string().optional(),
    value: z.number().optional(),
    value_currency: z.string().optional(),
    unique_id: z.string().optional(),
  })),
});

export async function handleEventTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_events_list': {
      const input = listEventsSchema.parse(args);
      const { fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination by default
      return fetchAllPages(
        (cursor) => client.listEvents({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { fetch_all, max_results }
      );
    }

    case 'klaviyo_events_get': {
      const input = getEventSchema.parse(args);
      return client.getEvent(input.event_id, {
        include: input.include,
        fields_event: input.fields_event,
        fields_metric: input.fields_metric,
        fields_profile: input.fields_profile,
      });
    }

    case 'klaviyo_events_create': {
      const input = createEventSchema.parse(args);
      return client.createEvent(input);
    }

    case 'klaviyo_events_bulk_create': {
      const input = bulkCreateEventsSchema.parse(args);
      return client.bulkCreateEvents(input.events);
    }

    case 'klaviyo_events_get_metric': {
      const input = z.object({
        event_id: z.string(),
        fields_metric: z.array(z.string()).optional(),
      }).parse(args);
      return client.getEventMetric(input.event_id, {
        fields_metric: input.fields_metric,
      });
    }

    case 'klaviyo_events_get_profile': {
      const input = z.object({
        event_id: z.string(),
        additional_fields: z.array(z.string()).optional(),
        fields_profile: z.array(z.string()).optional(),
      }).parse(args);
      return client.getEventProfile(input.event_id, {
        additional_fields: input.additional_fields,
        fields_profile: input.fields_profile,
      });
    }

    default:
      throw new Error(`Unknown event tool: ${toolName}`);
  }
}
