import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';
import { VALID_MEASUREMENTS, VALID_INTERVALS, VALID_METRIC_DIMENSIONS } from '../config.js';
import { logger } from '../utils/logger.js';

// Re-export for schema compatibility
const METRIC_MEASUREMENTS = [...VALID_MEASUREMENTS];
const METRIC_INTERVALS = [...VALID_INTERVALS];
const METRIC_BY_DIMENSIONS = [...VALID_METRIC_DIMENSIONS];

// Metric fields
const METRIC_FIELDS = [
  'name', 'created', 'updated', 'integration',
];

export function getMetricTools(): Tool[] {
  return [
    // === METRICS LIST & GET ===
    {
      name: 'klaviyo_metrics_list',
      description: `List all metrics/event types - USE THIS FIRST to find metric IDs for analytics.

COMMON METRICS TO FIND:
- "Placed Order" (Shopify): For revenue analytics - use integration_name="Shopify"
- "Opened Email": For email engagement
- "Clicked Email": For click tracking
- "Received Email": For delivery tracking

WORKFLOW:
1. Call this to find the metric_id you need
2. Use that metric_id in klaviyo_metrics_query_aggregate or klaviyo_metrics_query_by_flow

FILTERING: Use integration_name to narrow results (e.g., "Shopify", "API", "Klaviyo")

Returns compact format by default (id, name, integration).`,
      inputSchema: {
        type: 'object',
        properties: {
          // Compact mode
          compact: {
            type: 'boolean',
            description: 'Return only essential fields (default: true). Set to false for all fields.',
          },
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
      description: `Query aggregated metric data - the MAIN ANALYTICS ENDPOINT.

WORKFLOW TO GET METRIC ID:
1. Use klaviyo_metrics_list to find the metric (e.g., "Placed Order", "Opened Email")
2. Use the metric_id from the response in this query

MEASUREMENTS (required):
- "count": Number of events (e.g., how many orders)
- "sum_value": Total value (USE THIS FOR REVENUE - sums the "value" field)
- "unique": Unique profiles (e.g., unique customers)

GROUPING ("by" parameter):
- $flow, $attributed_flow: Group by flow
- $campaign_channel: Group by campaign
- Campaign Name, Message Name: Group by name
- Use multiple: by=["$flow","$flow_channel"]

FILTER SYNTAX (array of strings):
- Date: "greater-or-equal(datetime,2024-01-01T00:00:00)"
- Date: "less-than(datetime,2024-01-31T23:59:59)"
- Multiple filters = implicit AND

EXAMPLE - Revenue by flow last 30 days:
  metric_id="VAHVeq" (Placed Order)
  measurements=["sum_value"]
  by=["$attributed_flow"]
  start_date="2024-01-01", end_date="2024-01-31"`,
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID to query. REQUIRED. Find it with klaviyo_metrics_list first.',
          },
          measurements: {
            type: 'array',
            items: { type: 'string', enum: METRIC_MEASUREMENTS },
            description: 'What to measure: "count" (event count), "sum_value" (USE FOR REVENUE), "unique" (unique profiles)',
          },
          filter: {
            type: 'array',
            description: 'Filter strings. Use start_date/end_date instead for simpler date filtering.',
            items: {
              type: 'string',
              description: 'e.g., "greater-or-equal(datetime,2024-01-01T00:00:00)"',
            },
          },
          interval: {
            type: 'string',
            enum: METRIC_INTERVALS,
            description: 'Time grouping for time series: hour, day, week, month',
          },
          by: {
            type: 'array',
            items: { type: 'string', enum: METRIC_BY_DIMENSIONS },
            description: 'Group results by dimension. Use $flow for flow breakdown, $attributed_flow for revenue attribution.',
          },
          timezone: {
            type: 'string',
            description: 'Timezone (e.g., "Europe/Berlin", "America/New_York"). Default: UTC',
          },
          page_size: {
            type: 'number',
            description: 'Results per page (default 500, max 500)',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD or ISO 8601). Easier than filter array.',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD or ISO 8601). Easier than filter array.',
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
      description: `Get metric totals GROUPED BY FLOW - ideal for comparing flow performance and REVENUE.

THIS IS THE BEST TOOL FOR: "How much revenue did each flow generate?"

WORKFLOW FOR FLOW REVENUE:
1. Find "Placed Order" metric: klaviyo_metrics_list(integration_name="Shopify")
   The metric_id will be something like "VAHVeq"
2. Call this tool with:
   - metric_id: the "Placed Order" metric ID
   - measurement: "sum_value" (NOT "count"!) to get actual revenue
   - start_date/end_date: your date range

MEASUREMENTS:
- "count": Number of events (e.g., number of orders)
- "sum_value": USE THIS FOR REVENUE - sums the monetary values
- "unique": Unique customers

NOTE: This automatically groups by $flow and $flow_channel.

EXAMPLE: Revenue by flow for last 30 days
  metric_id="VAHVeq", measurement="sum_value", start_date="2024-01-01", end_date="2024-01-31"`,
      inputSchema: {
        type: 'object',
        properties: {
          metric_id: {
            type: 'string',
            description: 'The metric ID. For revenue, find "Placed Order" via klaviyo_metrics_list(integration_name="Shopify")',
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
            description: '"count" for event count, "sum_value" FOR REVENUE, "unique" for unique profiles. Default: count',
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
  compact: z.boolean().optional(),
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
      const { compact, fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination with compact mode by default
      return fetchAllPages(
        (cursor) => client.listMetrics({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { 
          fetch_all, 
          max_results,
          compact,
          compactFields: ['name', 'created', 'updated', 'integration'],
          detailHint: 'Use klaviyo_metrics_get(metric_id) for full metric details',
        }
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

      // Auto-correct invalid "by" dimensions
      let by = input.by;
      if (by && by.length > 0) {
        const validDimensions = by.filter(dim =>
          VALID_METRIC_DIMENSIONS.includes(dim as typeof VALID_METRIC_DIMENSIONS[number])
        );
        const invalidDimensions = by.filter(dim =>
          !VALID_METRIC_DIMENSIONS.includes(dim as typeof VALID_METRIC_DIMENSIONS[number])
        );

        if (invalidDimensions.length > 0) {
          logger.warn(`Invalid dimensions removed: ${invalidDimensions.join(', ')}. Valid: ${VALID_METRIC_DIMENSIONS.slice(0, 5).join(', ')}...`);
        }

        by = validDimensions.length > 0 ? validDimensions : undefined;
      }

      return client.queryMetricAggregate({
        ...input,
        by,
      });
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
