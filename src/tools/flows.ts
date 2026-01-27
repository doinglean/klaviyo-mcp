import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';

// Sort options for flows
const FLOW_SORT_OPTIONS = [
  'created', '-created',
  'id', '-id',
  'name', '-name',
  'status', '-status',
  'updated', '-updated',
  'archived', '-archived',
  'trigger_type', '-trigger_type',
];

// Available include options for flows
const FLOW_INCLUDE_OPTIONS = ['flow-actions', 'tags'];

// Available fields for flows
const FLOW_FIELDS = [
  'name', 'status', 'archived', 'created', 'updated',
  'trigger_type',
];

// Flow status values
const FLOW_STATUS_VALUES = ['draft', 'live', 'manual'] as const;

// Available fields for flow actions
const FLOW_ACTION_FIELDS = [
  'action_type', 'status', 'created', 'updated',
  'settings', 'tracking_options', 'send_options',
  'render_options',
];

// Available fields for flow messages
const FLOW_MESSAGE_FIELDS = [
  'name', 'channel', 'content', 'created', 'updated',
];

export function getFlowTools(): Tool[] {
  return [
    {
      name: 'klaviyo_flows_list',
      description: 'List all automation flows with filtering, sorting, and pagination. Filter by name, status, trigger type, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          // Filters
          name: {
            type: 'string',
            description: 'Filter by exact flow name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial flow name (contains)',
          },
          id: {
            type: 'string',
            description: 'Filter by flow ID',
          },
          status: {
            type: 'string',
            enum: ['draft', 'live', 'manual'],
            description: 'Filter by flow status: draft, live, or manual',
          },
          archived: {
            type: 'boolean',
            description: 'Filter by archived status (default: false)',
          },
          trigger_type: {
            type: 'string',
            description: 'Filter by trigger type (e.g., "Added to List", "Metric", "Price Drop")',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter flows created after',
          },
          created_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter flows created before',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter flows updated after',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: FLOW_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending.',
          },
          // Include relationships
          include: {
            type: 'array',
            items: { type: 'string', enum: FLOW_INCLUDE_OPTIONS },
            description: 'Include related resources: flow-actions, tags',
          },
          // Sparse fieldsets
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: FLOW_FIELDS },
            description: 'Limit flow fields returned',
          },
          fields_flow_action: {
            type: 'array',
            items: { type: 'string', enum: FLOW_ACTION_FIELDS },
            description: 'Limit flow action fields returned (when including flow-actions)',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned (when including tags)',
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
      name: 'klaviyo_flows_get',
      description: 'Get a specific flow by ID with optional includes for flow actions and tags.',
      inputSchema: {
        type: 'object',
        properties: {
          flow_id: {
            type: 'string',
            description: 'The Klaviyo flow ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: FLOW_INCLUDE_OPTIONS },
            description: 'Include related resources: flow-actions, tags',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: FLOW_FIELDS },
            description: 'Limit flow fields returned',
          },
          fields_flow_action: {
            type: 'array',
            items: { type: 'string', enum: FLOW_ACTION_FIELDS },
            description: 'Limit flow action fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned',
          },
        },
        required: ['flow_id'],
      },
    },
    {
      name: 'klaviyo_flows_update',
      description: 'Update a flow status. Use this to activate, deactivate, or set a flow to manual trigger mode.',
      inputSchema: {
        type: 'object',
        properties: {
          flow_id: {
            type: 'string',
            description: 'The Klaviyo flow ID to update',
          },
          status: {
            type: 'string',
            enum: ['draft', 'live', 'manual'],
            description: 'New flow status: "draft" (paused), "live" (active), or "manual" (trigger manually)',
          },
        },
        required: ['flow_id', 'status'],
      },
    },
    {
      name: 'klaviyo_flows_get_actions',
      description: 'Get all actions (steps) in a flow. Actions include emails, SMS, webhooks, time delays, and conditional splits.',
      inputSchema: {
        type: 'object',
        properties: {
          flow_id: {
            type: 'string',
            description: 'The Klaviyo flow ID',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for filtering actions',
          },
          sort: {
            type: 'string',
            enum: ['created', '-created', 'id', '-id', 'status', '-status', 'updated', '-updated'],
            description: 'Sort field. Prefix with - for descending.',
          },
          fields_flow_action: {
            type: 'array',
            items: { type: 'string', enum: FLOW_ACTION_FIELDS },
            description: 'Limit flow action fields returned',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['flow_id'],
      },
    },
    {
      name: 'klaviyo_flows_get_messages',
      description: 'Get all messages (email/SMS content) in a flow. Messages are the actual content sent by flow actions.',
      inputSchema: {
        type: 'object',
        properties: {
          flow_id: {
            type: 'string',
            description: 'The Klaviyo flow ID',
          },
          fields_flow_message: {
            type: 'array',
            items: { type: 'string', enum: FLOW_MESSAGE_FIELDS },
            description: 'Limit flow message fields returned',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['flow_id'],
      },
    },
    {
      name: 'klaviyo_flows_get_tags',
      description: 'Get all tags associated with a flow.',
      inputSchema: {
        type: 'object',
        properties: {
          flow_id: {
            type: 'string',
            description: 'The Klaviyo flow ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned',
          },
        },
        required: ['flow_id'],
      },
    },
    {
      name: 'klaviyo_flow_actions_get',
      description: 'Get a specific flow action by ID with detailed information about the action settings.',
      inputSchema: {
        type: 'object',
        properties: {
          action_id: {
            type: 'string',
            description: 'The Klaviyo flow action ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['flow', 'flow-messages'] },
            description: 'Include related resources: flow, flow-messages',
          },
          fields_flow_action: {
            type: 'array',
            items: { type: 'string', enum: FLOW_ACTION_FIELDS },
            description: 'Limit flow action fields returned',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: FLOW_FIELDS },
            description: 'Limit flow fields returned (when including flow)',
          },
          fields_flow_message: {
            type: 'array',
            items: { type: 'string', enum: FLOW_MESSAGE_FIELDS },
            description: 'Limit flow message fields returned (when including flow-messages)',
          },
        },
        required: ['action_id'],
      },
    },
    {
      name: 'klaviyo_flow_messages_get',
      description: 'Get a specific flow message by ID with detailed content information.',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: 'The Klaviyo flow message ID',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['flow-action', 'template'] },
            description: 'Include related resources: flow-action, template',
          },
          fields_flow_message: {
            type: 'array',
            items: { type: 'string', enum: FLOW_MESSAGE_FIELDS },
            description: 'Limit flow message fields returned',
          },
          fields_flow_action: {
            type: 'array',
            items: { type: 'string', enum: FLOW_ACTION_FIELDS },
            description: 'Limit flow action fields returned (when including flow-action)',
          },
          fields_template: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'editor_type', 'html', 'text', 'created', 'updated'] },
            description: 'Limit template fields returned (when including template)',
          },
        },
        required: ['message_id'],
      },
    },
  ];
}

// Validation schemas
const listFlowsSchema = z.object({
  name: z.string().optional(),
  name_contains: z.string().optional(),
  id: z.string().optional(),
  status: z.enum(['draft', 'live', 'manual']).optional(),
  archived: z.boolean().optional(),
  trigger_type: z.string().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  include: z.array(z.string()).optional(),
  fields_flow: z.array(z.string()).optional(),
  fields_flow_action: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getFlowSchema = z.object({
  flow_id: z.string(),
  include: z.array(z.string()).optional(),
  fields_flow: z.array(z.string()).optional(),
  fields_flow_action: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
});

const updateFlowSchema = z.object({
  flow_id: z.string(),
  status: z.enum(['draft', 'live', 'manual']),
});

const getFlowActionsSchema = z.object({
  flow_id: z.string(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  fields_flow_action: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getFlowMessagesSchema = z.object({
  flow_id: z.string(),
  fields_flow_message: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getFlowTagsSchema = z.object({
  flow_id: z.string(),
  fields_tag: z.array(z.string()).optional(),
});

const getFlowActionSchema = z.object({
  action_id: z.string(),
  include: z.array(z.string()).optional(),
  fields_flow_action: z.array(z.string()).optional(),
  fields_flow: z.array(z.string()).optional(),
  fields_flow_message: z.array(z.string()).optional(),
});

const getFlowMessageSchema = z.object({
  message_id: z.string(),
  include: z.array(z.string()).optional(),
  fields_flow_message: z.array(z.string()).optional(),
  fields_flow_action: z.array(z.string()).optional(),
  fields_template: z.array(z.string()).optional(),
});

export async function handleFlowTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_flows_list': {
      const input = listFlowsSchema.parse(args);
      return client.listFlows(input);
    }

    case 'klaviyo_flows_get': {
      const input = getFlowSchema.parse(args);
      return client.getFlow(input.flow_id, {
        include: input.include,
        fields_flow: input.fields_flow,
        fields_flow_action: input.fields_flow_action,
        fields_tag: input.fields_tag,
      });
    }

    case 'klaviyo_flows_update': {
      const input = updateFlowSchema.parse(args);
      return client.updateFlow(input.flow_id, { status: input.status });
    }

    case 'klaviyo_flows_get_actions': {
      const input = getFlowActionsSchema.parse(args);
      return client.getFlowActions(input.flow_id, {
        filter: input.filter,
        sort: input.sort,
        fields_flow_action: input.fields_flow_action,
        page_cursor: input.page_cursor,
      });
    }

    case 'klaviyo_flows_get_messages': {
      const input = getFlowMessagesSchema.parse(args);
      return client.getFlowMessages(input.flow_id, {
        fields_flow_message: input.fields_flow_message,
        page_cursor: input.page_cursor,
      });
    }

    case 'klaviyo_flows_get_tags': {
      const input = getFlowTagsSchema.parse(args);
      return client.getFlowTags(input.flow_id, { fields_tag: input.fields_tag });
    }

    case 'klaviyo_flow_actions_get': {
      const input = getFlowActionSchema.parse(args);
      return client.getFlowAction(input.action_id, {
        include: input.include,
        fields_flow_action: input.fields_flow_action,
        fields_flow: input.fields_flow,
        fields_flow_message: input.fields_flow_message,
      });
    }

    case 'klaviyo_flow_messages_get': {
      const input = getFlowMessageSchema.parse(args);
      return client.getFlowMessage(input.message_id, {
        include: input.include,
        fields_flow_message: input.fields_flow_message,
        fields_flow_action: input.fields_flow_action,
        fields_template: input.fields_template,
      });
    }

    default:
      throw new Error(`Unknown flow tool: ${toolName}`);
  }
}
