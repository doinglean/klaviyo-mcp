import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';

// Available measurements for metric aggregates
const METRIC_MEASUREMENTS = ['count', 'sum_value', 'unique'];

// Available intervals for metric aggregates
const METRIC_INTERVALS = ['hour', 'day', 'week', 'month'];

// Available "by" dimensions for metric aggregates
const METRIC_BY_DIMENSIONS = [
  '$attributed_channel', '$attributed_flow', '$attributed_message', '$attributed_variation',
  '$campaign_channel', '$flow', '$flow_channel', '$message', '$message_send_cohort',
  '$variation', '$variation_send_cohort', '$value_currency',
  'Campaign Name', 'Email Domain', 'List', 'Message Name', 'Subject', 'URL',
  'Bounce Type', 'Client Type', 'Client Name', 'Failure Type',
];

// Metric fields
const METRIC_FIELDS = [
  'name', 'created', 'updated', 'integration',
];

export function getMetricTools(): Tool[] {
  return [
    // === METRICS LIST & GET ===
    {
      name: 'klaviyo_metrics_list',
      description: 'List all metrics (event types) in your Klaviyo account. By default fetches ALL metrics automatically (no manual pagination needed). Metrics represent different types of events like "Placed Order", "Opened Email", etc.',
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
            description: 'Maximum results to return when fetch_all is true (default: 500)',
          },
          // Filters
          name: {
            type: 'string',
            description: 'Filter by exact metric name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial metric name',
          },
          integration_name: {
            type: 'string',
            description: 'Filter by integration name (e.g., "API", "Shopify")',
          },
          integration_category: {
            type: 'string',
            description: 'Filter by integration category',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sparse fieldsets
          fields_metric: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit metric fields returned',
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
      name: 'klaviyo_metrics_get',
      description: 'Get a specific metric by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The Klaviyo metric ID',
          },
          fields_metric: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit metric fields returned',
          },
        },
        required: ['metric_id'],
      },
    },

    // === METRIC AGGREGATES (ANALYTICS) ===
    {
      name: 'klaviyo_metrics_query_aggregate',
      description: 'Query aggregated metric data for analytics. This is the main analytics endpoint - use it to get counts, sums, and unique values over time with various groupings.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID to query',
          },
          measurements: {
            type: 'array',
            items: { type: 'string', enum: METRIC_MEASUREMENTS },
            description: 'What to measure: "count" (events), "sum_value" (total value), "unique" (unique profiles)',
          },
          filter: {
            type: 'array',
            description: 'Filters to apply to the query',
            items: {
              type: 'string',
              description: 'Filter string (e.g., "greater-or-equal(datetime,2024-01-01)")',
            },
          },
          interval: {
            type: 'string',
            enum: METRIC_INTERVALS,
            description: 'Time interval for grouping: hour, day, week, month',
          },
          by: {
            type: 'array',
            items: { type: 'string' },
            description: 'Dimensions to group by (e.g., "$flow", "Campaign Name", "$attributed_message")',
          },
          timezone: {
            type: 'string',
            description: 'Timezone for the query (e.g., "America/New_York")',
          },
          page_size: {
            type: 'number',
            description: 'Number of results per page (default 500)',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
          // Convenience filters
          start_date: {
            type: 'string',
            description: 'Start date for the query (ISO 8601 or YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date for the query (ISO 8601 or YYYY-MM-DD)',
          },
        },
        required: ['metric_id', 'measurements'],
      },
    },

    // === CONVENIENCE ANALYTICS TOOLS ===
    {
      name: 'klaviyo_metrics_query_timeseries',
      description: 'Get a timeseries of metric counts over a date range. Simplified interface for common analytics queries.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID to query (find with klaviyo_metrics_list)',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD or ISO 8601)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD or ISO 8601)',
          },
          interval: {
            type: 'string',
            enum: METRIC_INTERVALS,
            description: 'Time grouping: hour, day, week, month',
          },
          measurement: {
            type: 'string',
            enum: METRIC_MEASUREMENTS,
            description: 'What to measure (default: count)',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (default: UTC)',
          },
        },
        required: ['metric_id', 'start_date', 'end_date'],
      },
    },
    {
      name: 'klaviyo_metrics_query_by_campaign',
      description: 'Get metric totals grouped by campaign. Useful for comparing campaign performance.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID (e.g., for "Opened Email" or "Clicked Email")',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          measurement: {
            type: 'string',
            enum: METRIC_MEASUREMENTS,
            description: 'What to measure (default: count)',
          },
        },
        required: ['metric_id', 'start_date', 'end_date'],
      },
    },
    {
      name: 'klaviyo_metrics_query_by_flow',
      description: 'Get metric totals grouped by flow. Useful for comparing flow performance.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          measurement: {
            type: 'string',
            enum: METRIC_MEASUREMENTS,
            description: 'What to measure (default: count)',
          },
        },
        required: ['metric_id', 'start_date', 'end_date'],
      },
    },

    // === METRIC RELATIONSHIPS ===
    {
      name: 'klaviyo_metrics_get_flow_triggers',
      description: 'Get all flows that are triggered by a specific metric.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit flow fields returned',
          },
        },
        required: ['metric_id'],
      },
    },
    {
      name: 'klaviyo_metrics_get_properties',
      description: 'Get all properties (custom fields) associated with a metric. Useful for understanding what data is tracked.',
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID',
          },
        },
        required: ['metric_id'],
      },
    },
    {
      name: 'klaviyo_metrics_get_property',
      description: 'Get details about a specific metric property.',
      inputSchema: {
        type: 'object',
        properties: {
          property_id: {
            type: 'string',
            description: 'The metric property ID',
          },
          fields_metric_property: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit property fields returned',
          },
        },
        required: ['property_id'],
      },
    },
  ];
}

// Validation schemas
const listMetricsSchema = z.object({
  fetch_all: z.boolean().optional(),
  max_results: z.number().optional(),
  name: z.string().optional(),
  name_contains: z.string().optional(),
  integration_name: z.string().optional(),
  integration_category: z.string().optional(),
  filter: z.string().optional(),
  fields_metric: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getMetricSchema = z.object({
  metric_id: z.string(),
  fields_metric: z.array(z.string()).optional(),
});

const queryAggregateSchema = z.object({
  metric_id: z.string(),
  measurements: z.array(z.enum(['count', 'sum_value', 'unique'])),
  filter: z.array(z.string()).optional(),
  interval: z.enum(['hour', 'day', 'week', 'month']).optional(),
  by: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  page_size: z.number().optional(),
  page_cursor: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const queryTimeseriesSchema = z.object({
  metric_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  interval: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  measurement: z.enum(['count', 'sum_value', 'unique']).optional().default('count'),
  timezone: z.string().optional(),
});

const queryByCampaignSchema = z.object({
  metric_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  measurement: z.enum(['count', 'sum_value', 'unique']).optional().default('count'),
});

const queryByFlowSchema = z.object({
  metric_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  measurement: z.enum(['count', 'sum_value', 'unique']).optional().default('count'),
});

export async function handleMetricTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_metrics_list': {
      const input = listMetricsSchema.parse(args);
      const { fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination by default
      return fetchAllPages(
        (cursor) => client.listMetrics({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { fetch_all, max_results }
      );
    }

    case 'klaviyo_metrics_get': {
      const input = getMetricSchema.parse(args);
      return client.getMetric(input.metric_id, {
        fields_metric: input.fields_metric,
      });
    }

    case 'klaviyo_metrics_query_aggregate': {
      const input = queryAggregateSchema.parse(args);
      return client.queryMetricAggregate(input);
    }

    case 'klaviyo_metrics_query_timeseries': {
      const input = queryTimeseriesSchema.parse(args);
      // Build the filter for date range
      const filter = [
        `greater-or-equal(datetime,${input.start_date}T00:00:00)`,
        `less-than(datetime,${input.end_date}T23:59:59)`,
      ];
      return client.queryMetricAggregate({
        metric_id: input.metric_id,
        measurements: [input.measurement],
        filter,
        interval: input.interval,
        timezone: input.timezone,
      });
    }

    case 'klaviyo_metrics_query_by_campaign': {
      const input = queryByCampaignSchema.parse(args);
      const filter = [
        `greater-or-equal(datetime,${input.start_date}T00:00:00)`,
        `less-than(datetime,${input.end_date}T23:59:59)`,
      ];
      return client.queryMetricAggregate({
        metric_id: input.metric_id,
        measurements: [input.measurement],
        filter,
        by: ['Campaign Name', '$attributed_message'],
      });
    }

    case 'klaviyo_metrics_query_by_flow': {
      const input = queryByFlowSchema.parse(args);
      const filter = [
        `greater-or-equal(datetime,${input.start_date}T00:00:00)`,
        `less-than(datetime,${input.end_date}T23:59:59)`,
      ];
      return client.queryMetricAggregate({
        metric_id: input.metric_id,
        measurements: [input.measurement],
        filter,
        by: ['$flow', '$flow_channel'],
      });
    }

    case 'klaviyo_metrics_get_flow_triggers': {
      const input = z.object({
        metric_id: z.string(),
        fields_flow: z.array(z.string()).optional(),
      }).parse(args);
      return client.getMetricFlowTriggers(input.metric_id, {
        fields_flow: input.fields_flow,
      });
    }

    case 'klaviyo_metrics_get_properties': {
      const input = z.object({ metric_id: z.string() }).parse(args);
      return client.getMetricProperties(input.metric_id);
    }

    case 'klaviyo_metrics_get_property': {
      const input = z.object({
        property_id: z.string(),
        fields_metric_property: z.array(z.string()).optional(),
      }).parse(args);
      return client.getMetricProperty(input.property_id, {
        fields_metric_property: input.fields_metric_property,
      });
    }

    default:
      throw new Error(`Unknown metric tool: ${toolName}`);
  }
}
