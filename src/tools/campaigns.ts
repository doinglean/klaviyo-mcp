import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';

// Sort options for campaigns
const CAMPAIGN_SORT_OPTIONS = [
  'created_at', '-created_at',
  'id', '-id',
  'name', '-name',
  'scheduled_at', '-scheduled_at',
  'updated_at', '-updated_at',
];

// Include options for campaigns
const CAMPAIGN_INCLUDE_OPTIONS = ['campaign-messages', 'tags'];

// Fields for campaigns
const CAMPAIGN_FIELDS = [
  'name', 'status', 'archived', 'audiences',
  'send_options', 'tracking_options', 'send_strategy',
  'created_at', 'scheduled_at', 'updated_at', 'send_time',
];

// Campaign message fields
const CAMPAIGN_MESSAGE_FIELDS = [
  'label', 'channel', 'content', 'send_times',
  'render_options', 'created_at', 'updated_at',
];

export function getCampaignTools(): Tool[] {
  return [
    // === CAMPAIGNS CRUD ===
    {
      name: 'klaviyo_campaigns_list',
      description: 'List all campaigns (compact: id, name, status, channel). For full campaign details, use klaviyo_campaigns_get(campaign_id). Fetches ALL campaigns automatically.',
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
            description: 'Filter by campaign name (equals)',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial campaign name (contains)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'scheduled', 'sent', 'cancelled'],
            description: 'Filter by campaign status',
          },
          channel: {
            type: 'string',
            enum: ['email', 'sms', 'push'],
            description: 'Filter by campaign channel type',
          },
          archived: {
            type: 'boolean',
            description: 'Filter by archived status',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter campaigns created after',
          },
          created_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter campaigns created before',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter campaigns updated after',
          },
          scheduled_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter campaigns scheduled after',
          },
          scheduled_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter campaigns scheduled before',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: CAMPAIGN_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending.',
          },
          // Include
          include: {
            type: 'array',
            items: { type: 'string', enum: CAMPAIGN_INCLUDE_OPTIONS },
            description: 'Include related resources: campaign-messages, tags',
          },
          // Sparse fieldsets
          fields_campaign: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit campaign fields returned',
          },
          fields_campaign_message: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit campaign message fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit tag fields returned',
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
      name: 'klaviyo_campaigns_get',
      description: 'Get a specific campaign by ID with optional includes for messages and tags.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The Klaviyo campaign ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: CAMPAIGN_INCLUDE_OPTIONS },
            description: 'Include related resources',
          },
          fields_campaign: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit campaign fields returned',
          },
          fields_campaign_message: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit campaign message fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit tag fields returned',
          },
        },
        required: ['campaign_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_create',
      description: 'Create a new campaign. Requires name, audiences (lists to include/exclude), and at least one message.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Campaign name',
          },
          channel: {
            type: 'string',
            enum: ['email', 'sms', 'push'],
            description: 'Campaign channel type (default: email)',
          },
          audiences: {
            type: 'object',
            description: 'Target audiences configuration',
            properties: {
              included: {
                type: 'array',
                items: { type: 'string' },
                description: 'List IDs to include',
              },
              excluded: {
                type: 'array',
                items: { type: 'string' },
                description: 'List IDs to exclude',
              },
            },
            required: ['included'],
          },
          message: {
            type: 'object',
            description: 'Campaign message content',
            properties: {
              label: {
                type: 'string',
                description: 'Message label/name',
              },
              subject: {
                type: 'string',
                description: 'Email subject line (for email campaigns)',
              },
              preview_text: {
                type: 'string',
                description: 'Email preview text',
              },
              from_email: {
                type: 'string',
                description: 'From email address',
              },
              from_label: {
                type: 'string',
                description: 'From name/label',
              },
              reply_to_email: {
                type: 'string',
                description: 'Reply-to email address',
              },
              body: {
                type: 'string',
                description: 'SMS/Push message body (for non-email campaigns)',
              },
            },
          },
          send_strategy: {
            type: 'object',
            description: 'Send strategy configuration',
            properties: {
              method: {
                type: 'string',
                enum: ['immediate', 'static', 'throttled', 'smart_send_time'],
                description: 'Send method type',
              },
              datetime: {
                type: 'string',
                description: 'Scheduled datetime for static sends (ISO 8601)',
              },
              is_local: {
                type: 'boolean',
                description: 'Use recipient local time (for static sends)',
              },
              throttle_percentage: {
                type: 'number',
                description: 'Percentage for throttled sends (1-100)',
              },
            },
          },
          tracking_options: {
            type: 'object',
            description: 'Tracking configuration',
            properties: {
              is_tracking_opens: {
                type: 'boolean',
                description: 'Track email opens',
              },
              is_tracking_clicks: {
                type: 'boolean',
                description: 'Track link clicks',
              },
              is_add_utm: {
                type: 'boolean',
                description: 'Add UTM parameters',
              },
              utm_params: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    value: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        required: ['name', 'audiences'],
      },
    },
    {
      name: 'klaviyo_campaigns_update',
      description: 'Update an existing campaign. Only draft campaigns can be updated.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to update',
          },
          name: {
            type: 'string',
            description: 'New campaign name',
          },
          audiences: {
            type: 'object',
            description: 'Updated audiences configuration',
            properties: {
              included: {
                type: 'array',
                items: { type: 'string' },
                description: 'List IDs to include',
              },
              excluded: {
                type: 'array',
                items: { type: 'string' },
                description: 'List IDs to exclude',
              },
            },
          },
          send_strategy: {
            type: 'object',
            description: 'Updated send strategy',
            properties: {
              method: {
                type: 'string',
                enum: ['immediate', 'static', 'throttled', 'smart_send_time'],
              },
              datetime: { type: 'string' },
              is_local: { type: 'boolean' },
              throttle_percentage: { type: 'number' },
            },
          },
          tracking_options: {
            type: 'object',
            properties: {
              is_tracking_opens: { type: 'boolean' },
              is_tracking_clicks: { type: 'boolean' },
              is_add_utm: { type: 'boolean' },
            },
          },
        },
        required: ['campaign_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_delete',
      description: 'Delete a campaign. Only draft campaigns can be deleted.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to delete',
          },
        },
        required: ['campaign_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_clone',
      description: 'Clone an existing campaign to create a copy.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to clone',
          },
          new_name: {
            type: 'string',
            description: 'Name for the cloned campaign (optional)',
          },
        },
        required: ['campaign_id'],
      },
    },

    // === CAMPAIGN SEND ===
    {
      name: 'klaviyo_campaigns_send',
      description: 'Trigger sending of a campaign. Campaign must be in "scheduled" status.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to send',
          },
        },
        required: ['campaign_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_cancel_send',
      description: 'Cancel a scheduled campaign send job.',
      inputSchema: {
        type: 'object',
        properties: {
          send_job_id: {
            type: 'string',
            description: 'The send job ID to cancel',
          },
        },
        required: ['send_job_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_get_send_job',
      description: 'Get the status of a campaign send job.',
      inputSchema: {
        type: 'object',
        properties: {
          send_job_id: {
            type: 'string',
            description: 'The send job ID',
          },
        },
        required: ['send_job_id'],
      },
    },

    // === RECIPIENT ESTIMATION ===
    {
      name: 'klaviyo_campaigns_estimate_recipients',
      description: 'Create a job to estimate the number of recipients for a campaign.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to estimate recipients for',
          },
        },
        required: ['campaign_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_get_recipient_estimation_job',
      description: 'Get the status of a recipient estimation job.',
      inputSchema: {
        type: 'object',
        properties: {
          job_id: {
            type: 'string',
            description: 'The recipient estimation job ID',
          },
        },
        required: ['job_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_get_recipient_estimation',
      description: 'Get the results of a completed recipient estimation.',
      inputSchema: {
        type: 'object',
        properties: {
          estimation_id: {
            type: 'string',
            description: 'The recipient estimation ID',
          },
        },
        required: ['estimation_id'],
      },
    },

    // === CAMPAIGN MESSAGES ===
    {
      name: 'klaviyo_campaigns_get_message',
      description: 'Get a specific campaign message by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: 'The campaign message ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['campaign', 'template', 'image'] },
            description: 'Include related resources',
          },
          fields_campaign_message: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit message fields returned',
          },
          fields_campaign: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit campaign fields returned',
          },
          fields_template: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit template fields returned',
          },
        },
        required: ['message_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_update_message',
      description: 'Update a campaign message content (subject, body, etc.).',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: 'The campaign message ID to update',
          },
          label: {
            type: 'string',
            description: 'Message label/name',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          preview_text: {
            type: 'string',
            description: 'Email preview text',
          },
          from_email: {
            type: 'string',
            description: 'From email address',
          },
          from_label: {
            type: 'string',
            description: 'From name/label',
          },
          reply_to_email: {
            type: 'string',
            description: 'Reply-to email address',
          },
          body: {
            type: 'string',
            description: 'Message body (for SMS/Push)',
          },
        },
        required: ['message_id'],
      },
    },
    {
      name: 'klaviyo_campaigns_assign_template',
      description: 'Assign a template to a campaign message.',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: 'The campaign message ID',
          },
          template_id: {
            type: 'string',
            description: 'The template ID to assign',
          },
        },
        required: ['message_id', 'template_id'],
      },
    },

    // === CAMPAIGN MESSAGES RELATIONSHIPS ===
    {
      name: 'klaviyo_campaigns_get_messages',
      description: 'Get all messages for a campaign.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID',
          },
          fields_campaign_message: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit message fields returned',
          },
        },
        required: ['campaign_id'],
      },
    },

    // === CAMPAIGN TAGS ===
    {
      name: 'klaviyo_campaigns_get_tags',
      description: 'Get all tags for a campaign.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit tag fields returned',
          },
        },
        required: ['campaign_id'],
      },
    },

    // === CAMPAIGN VALUES REPORTS ===
    {
      name: 'klaviyo_campaigns_create_values_report',
      description: 'Create a campaign values report for analytics. Get detailed statistics on campaign performance.',
      inputSchema: {
        type: 'object',
        properties: {
          campaign_id: {
            type: 'string',
            description: 'The campaign ID to report on',
          },
          statistics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Statistics to include (e.g., opens, clicks, bounces, conversions)',
          },
          timeframe: {
            type: 'object',
            description: 'Report timeframe',
            properties: {
              start: { type: 'string', description: 'Start date (ISO 8601)' },
              end: { type: 'string', description: 'End date (ISO 8601)' },
            },
          },
        },
        required: ['campaign_id'],
      },
    },
  ];
}

// Validation schemas
const listCampaignsSchema = z.object({
  compact: z.boolean().optional(),
  fetch_all: z.boolean().optional(),
  max_results: z.number().optional(),
  name: z.string().optional(),
  name_contains: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'sent', 'cancelled']).optional(),
  channel: z.enum(['email', 'sms', 'push']).optional(),
  archived: z.boolean().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  scheduled_after: z.string().optional(),
  scheduled_before: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  include: z.array(z.string()).optional(),
  fields_campaign: z.array(z.string()).optional(),
  fields_campaign_message: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getCampaignSchema = z.object({
  campaign_id: z.string(),
  include: z.array(z.string()).optional(),
  fields_campaign: z.array(z.string()).optional(),
  fields_campaign_message: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
});

const createCampaignSchema = z.object({
  name: z.string(),
  channel: z.enum(['email', 'sms', 'push']).optional().default('email'),
  audiences: z.object({
    included: z.array(z.string()),
    excluded: z.array(z.string()).optional(),
  }),
  message: z.object({
    label: z.string().optional(),
    subject: z.string().optional(),
    preview_text: z.string().optional(),
    from_email: z.string().optional(),
    from_label: z.string().optional(),
    reply_to_email: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  send_strategy: z.object({
    method: z.enum(['immediate', 'static', 'throttled', 'smart_send_time']).optional(),
    datetime: z.string().optional(),
    is_local: z.boolean().optional(),
    throttle_percentage: z.number().optional(),
  }).optional(),
  tracking_options: z.object({
    is_tracking_opens: z.boolean().optional(),
    is_tracking_clicks: z.boolean().optional(),
    is_add_utm: z.boolean().optional(),
    utm_params: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })).optional(),
  }).optional(),
});

const updateCampaignSchema = z.object({
  campaign_id: z.string(),
  name: z.string().optional(),
  audiences: z.object({
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional(),
  }).optional(),
  send_strategy: z.object({
    method: z.enum(['immediate', 'static', 'throttled', 'smart_send_time']).optional(),
    datetime: z.string().optional(),
    is_local: z.boolean().optional(),
    throttle_percentage: z.number().optional(),
  }).optional(),
  tracking_options: z.object({
    is_tracking_opens: z.boolean().optional(),
    is_tracking_clicks: z.boolean().optional(),
    is_add_utm: z.boolean().optional(),
  }).optional(),
});

export async function handleCampaignTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_campaigns_list': {
      const input = listCampaignsSchema.parse(args);
      const { compact, fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination with compact mode by default
      return fetchAllPages(
        (cursor) => client.listCampaigns({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { 
          fetch_all, 
          max_results,
          compact,
          compactFields: ['name', 'status', 'archived', 'created_at', 'scheduled_at', 'send_time'],
          detailHint: 'Use klaviyo_campaigns_get(campaign_id) for full campaign details including messages and audiences',
        }
      );
    }

    case 'klaviyo_campaigns_get': {
      const input = getCampaignSchema.parse(args);
      return client.getCampaign(input.campaign_id, {
        include: input.include,
        fields_campaign: input.fields_campaign,
        fields_campaign_message: input.fields_campaign_message,
        fields_tag: input.fields_tag,
      });
    }

    case 'klaviyo_campaigns_create': {
      const input = createCampaignSchema.parse(args);
      return client.createCampaign(input);
    }

    case 'klaviyo_campaigns_update': {
      const input = updateCampaignSchema.parse(args);
      const { campaign_id, ...updateData } = input;
      return client.updateCampaign(campaign_id, updateData);
    }

    case 'klaviyo_campaigns_delete': {
      const input = z.object({ campaign_id: z.string() }).parse(args);
      return client.deleteCampaign(input.campaign_id);
    }

    case 'klaviyo_campaigns_clone': {
      const input = z.object({
        campaign_id: z.string(),
        new_name: z.string().optional(),
      }).parse(args);
      return client.cloneCampaign(input.campaign_id, input.new_name);
    }

    case 'klaviyo_campaigns_send': {
      const input = z.object({ campaign_id: z.string() }).parse(args);
      return client.sendCampaign(input.campaign_id);
    }

    case 'klaviyo_campaigns_cancel_send': {
      const input = z.object({ send_job_id: z.string() }).parse(args);
      return client.cancelCampaignSend(input.send_job_id);
    }

    case 'klaviyo_campaigns_get_send_job': {
      const input = z.object({ send_job_id: z.string() }).parse(args);
      return client.getCampaignSendJob(input.send_job_id);
    }

    case 'klaviyo_campaigns_estimate_recipients': {
      const input = z.object({ campaign_id: z.string() }).parse(args);
      return client.estimateCampaignRecipients(input.campaign_id);
    }

    case 'klaviyo_campaigns_get_recipient_estimation_job': {
      const input = z.object({ job_id: z.string() }).parse(args);
      return client.getRecipientEstimationJob(input.job_id);
    }

    case 'klaviyo_campaigns_get_recipient_estimation': {
      const input = z.object({ estimation_id: z.string() }).parse(args);
      return client.getRecipientEstimation(input.estimation_id);
    }

    case 'klaviyo_campaigns_get_message': {
      const input = z.object({
        message_id: z.string(),
        include: z.array(z.string()).optional(),
        fields_campaign_message: z.array(z.string()).optional(),
        fields_campaign: z.array(z.string()).optional(),
        fields_template: z.array(z.string()).optional(),
      }).parse(args);
      return client.getCampaignMessage(input.message_id, {
        include: input.include,
        fields_campaign_message: input.fields_campaign_message,
        fields_campaign: input.fields_campaign,
        fields_template: input.fields_template,
      });
    }

    case 'klaviyo_campaigns_update_message': {
      const input = z.object({
        message_id: z.string(),
        label: z.string().optional(),
        subject: z.string().optional(),
        preview_text: z.string().optional(),
        from_email: z.string().optional(),
        from_label: z.string().optional(),
        reply_to_email: z.string().optional(),
        body: z.string().optional(),
      }).parse(args);
      const { message_id, ...content } = input;
      return client.updateCampaignMessage(message_id, content);
    }

    case 'klaviyo_campaigns_assign_template': {
      const input = z.object({
        message_id: z.string(),
        template_id: z.string(),
      }).parse(args);
      return client.assignTemplateToMessage(input.message_id, input.template_id);
    }

    case 'klaviyo_campaigns_get_messages': {
      const input = z.object({
        campaign_id: z.string(),
        fields_campaign_message: z.array(z.string()).optional(),
      }).parse(args);
      return client.getCampaignMessages(input.campaign_id, {
        fields_campaign_message: input.fields_campaign_message,
      });
    }

    case 'klaviyo_campaigns_get_tags': {
      const input = z.object({
        campaign_id: z.string(),
        fields_tag: z.array(z.string()).optional(),
      }).parse(args);
      return client.getCampaignTags(input.campaign_id, {
        fields_tag: input.fields_tag,
      });
    }

    case 'klaviyo_campaigns_create_values_report': {
      const input = z.object({
        campaign_id: z.string(),
        statistics: z.array(z.string()).optional(),
        timeframe: z.object({
          start: z.string().optional(),
          end: z.string().optional(),
        }).optional(),
      }).parse(args);
      return client.createCampaignValuesReport(input);
    }

    default:
      throw new Error(`Unknown campaign tool: ${toolName}`);
  }
}
