/**
 * Centralized configuration for the Klaviyo MCP Server
 *
 * This file contains all configurable parameters, valid API values,
 * and default settings. Centralizing these makes the codebase more
 * maintainable and helps Claude understand what values are valid.
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  baseURL: 'https://a.klaviyo.com/api',
  revision: process.env.KLAVIYO_API_REVISION || '2025-01-15',
  defaultPageSize: 50,
  maxPageSize: 100,
  defaultTimeoutMs: 30000,

  // Default metric IDs for common operations
  // "Placed Order" is the standard e-commerce conversion metric
  defaultConversionMetricId: process.env.KLAVIYO_DEFAULT_CONVERSION_METRIC_ID || null,

  // Default timeframe for reports
  defaultTimeframe: 'last_30_days',
};

// =============================================================================
// RATE LIMITING & RETRY CONFIGURATION
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitterMs: 100, // Random jitter to prevent thundering herd
};

// =============================================================================
// CACHING CONFIGURATION
// =============================================================================

export const CACHE_CONFIG = {
  enabled: process.env.KLAVIYO_CACHE_ENABLED !== 'false',
  ttlSeconds: {
    metrics: 3600,      // 1 hour - metrics rarely change
    campaigns: 1800,    // 30 minutes
    flows: 1800,        // 30 minutes
    templates: 3600,    // 1 hour
    lists: 900,         // 15 minutes
    segments: 900,      // 15 minutes
    profiles: 300,      // 5 minutes - profiles change frequently
    tags: 3600,         // 1 hour
    default: 600,       // 10 minutes
  },
  maxSize: 100, // Maximum items per cache type
};

// =============================================================================
// LOGGING CONFIGURATION
// =============================================================================

export const LOG_CONFIG = {
  level: (process.env.KLAVIYO_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  maskSensitiveData: true,
  logRequests: process.env.KLAVIYO_LOG_REQUESTS === 'true',
  logResponses: process.env.KLAVIYO_LOG_RESPONSES === 'true',
};

// =============================================================================
// VALID API VALUES - These are used in tool descriptions and validation
// =============================================================================

/**
 * Valid statistics for Flow Values Reports
 * NOTE: "revenue" is NOT a valid statistic name - use "conversion_value" instead
 */
export const VALID_FLOW_STATISTICS = [
  'recipients',
  'opens',
  'open_rate',
  'clicks',
  'click_rate',
  'deliveries',
  'delivery_rate',
  'bounces',
  'bounce_rate',
  'unsubscribes',
  'unsubscribe_rate',
  'spam_complaints',
  'spam_complaint_rate',
  // Revenue-related (requires conversion_metric_id)
  'conversion_value',
  'conversion_rate',
  'conversions',
  'revenue_per_recipient',
] as const;

/**
 * Valid statistics for Campaign Values Reports
 */
export const VALID_CAMPAIGN_STATISTICS = [
  'delivered',
  'open_rate',
  'click_rate',
  'bounce_rate',
  'unsubscribe_rate',
  'revenue_per_recipient',
] as const;

/**
 * Default statistics sets for different use cases
 */
export const DEFAULT_STATISTICS = {
  basic: ['recipients', 'deliveries'] as const,
  engagement: ['recipients', 'opens', 'open_rate', 'clicks', 'click_rate'] as const,
  comprehensive: [
    'recipients', 'opens', 'open_rate', 'clicks', 'click_rate',
    'deliveries', 'delivery_rate', 'bounces', 'bounce_rate', 'unsubscribes',
  ] as const,
};

/**
 * Valid measurements for Metric Aggregates
 */
export const VALID_MEASUREMENTS = ['count', 'sum_value', 'unique'] as const;

/**
 * Valid time intervals for analytics
 */
export const VALID_INTERVALS = ['hour', 'day', 'week', 'month'] as const;

/**
 * Valid dimensions for grouping metric aggregates
 * Use "$" prefix for system dimensions
 */
export const VALID_METRIC_DIMENSIONS = [
  // Attribution dimensions
  '$attributed_channel',
  '$attributed_flow',
  '$attributed_message',
  '$attributed_variation',
  // Campaign/Flow dimensions
  '$campaign_channel',
  '$flow',
  '$flow_channel',
  '$message',
  '$message_send_cohort',
  '$variation',
  '$variation_send_cohort',
  // Value dimensions
  '$value_currency',
  // Named dimensions (no $ prefix)
  'Campaign Name',
  'Email Domain',
  'List',
  'Message Name',
  'Subject',
  'URL',
  'Bounce Type',
  'Client Type',
  'Client Name',
  'Failure Type',
] as const;

/**
 * Valid timeframe keys for reports
 */
export const VALID_TIMEFRAMES = [
  'today',
  'yesterday',
  'last_7_days',
  'last_14_days',
  'last_30_days',
  'last_90_days',
  'last_month',
  'this_month',
  'all_time',
] as const;

/**
 * Flow status values
 */
export const VALID_FLOW_STATUSES = ['draft', 'live', 'manual'] as const;

/**
 * Campaign channel types
 */
export const VALID_CAMPAIGN_CHANNELS = ['email', 'sms'] as const;

// =============================================================================
// FILTER TEMPLATES - Pre-built filter strings for common operations
// =============================================================================

export const FILTER_TEMPLATES = {
  // ID filters
  equals: (field: string, value: string) => `equals(${field},"${value}")`,
  any: (field: string, values: string[]) => `any(${field},["${values.join('","')}"])`,

  // Date filters
  dateRange: (start: string, end: string) => [
    `greater-or-equal(datetime,${start})`,
    `less-than(datetime,${end})`,
  ],

  // Flow filters
  flowId: (id: string) => `equals(flow_id,"${id}")`,
  flowIds: (ids: string[]) => `any(flow_id,["${ids.join('","')}"])`,

  // Campaign filters
  campaignId: (id: string) => `equals(campaign_id,"${id}")`,
  campaignIds: (ids: string[]) => `any(campaign_id,["${ids.join('","')}"])`,

  // String filters
  contains: (field: string, value: string) => `contains(${field},"${value}")`,
  startsWith: (field: string, value: string) => `starts-with(${field},"${value}")`,
};

// =============================================================================
// WORKFLOW DOCUMENTATION - Embedded in tool descriptions
// =============================================================================

export const WORKFLOW_HINTS = {
  findMetricId: `
WORKFLOW TO GET METRIC ID:
1. Use klaviyo_metrics_list to search for the metric (e.g., "Placed Order", "Opened Email")
2. The metric_id will be in the response (e.g., "VAHVeq")
3. Use that metric_id in analytics queries`,

  revenueReport: `
FOR REVENUE DATA:
1. First find "Placed Order" metric: klaviyo_metrics_list(integration_name="Shopify")
2. Use the metric_id as conversion_metric_id in this tool
3. Or set KLAVIYO_DEFAULT_CONVERSION_METRIC_ID environment variable`,

  flowAnalytics: `
FOR FLOW REVENUE ANALYSIS:
Use klaviyo_metrics_query_by_flow with:
- metric_id: The "Placed Order" metric ID
- measurement: "sum_value" (not "count") to get revenue amounts
- This groups revenue by flow, showing which flows generate most revenue`,

  filterSyntax: `
FILTER SYNTAX:
- equals(field,"value") - Exact match
- contains(field,"text") - Contains text
- greater-or-equal(datetime,2024-01-01) - Date comparison
- any(field,["val1","val2"]) - Match any value
- Combine multiple filters with comma separation (implicit AND)`,
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FlowStatistic = typeof VALID_FLOW_STATISTICS[number];
export type CampaignStatistic = typeof VALID_CAMPAIGN_STATISTICS[number];
export type Measurement = typeof VALID_MEASUREMENTS[number];
export type Interval = typeof VALID_INTERVALS[number];
export type MetricDimension = typeof VALID_METRIC_DIMENSIONS[number];
export type Timeframe = typeof VALID_TIMEFRAMES[number];
export type FlowStatus = typeof VALID_FLOW_STATUSES[number];
export type CampaignChannel = typeof VALID_CAMPAIGN_CHANNELS[number];
