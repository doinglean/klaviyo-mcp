import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';

// Sort options for segments
const SEGMENT_SORT_OPTIONS = [
  'created', '-created',
  'id', '-id',
  'name', '-name',
  'updated', '-updated',
];

// Available include options for segments
const SEGMENT_INCLUDE_OPTIONS = ['tags', 'flow-triggers'];

// Available fields for segments
const SEGMENT_FIELDS = [
  'name', 'definition', 'created', 'updated',
  'is_active', 'is_processing', 'is_starred',
];

// Available additional fields for profiles
const PROFILE_ADDITIONAL_FIELDS = ['subscriptions', 'predictive_analytics'];

export function getSegmentTools(): Tool[] {
  return [
    {
      name: 'klaviyo_segments_list',
      description: 'List all segments with filtering, sorting, and pagination. Filter by name, creation date, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          // Filters
          name: {
            type: 'string',
            description: 'Filter by exact segment name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial segment name (contains)',
          },
          id: {
            type: 'string',
            description: 'Filter by segment ID',
          },
          is_active: {
            type: 'boolean',
            description: 'Filter by active status',
          },
          is_starred: {
            type: 'boolean',
            description: 'Filter by starred status',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter segments created after',
          },
          created_before: {
            type: 'string',
            description: 'ISO 8601 datetime - filter segments created before',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - filter segments updated after',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: SEGMENT_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending.',
          },
          // Include relationships
          include: {
            type: 'array',
            items: { type: 'string', enum: SEGMENT_INCLUDE_OPTIONS },
            description: 'Include related resources: tags, flow-triggers',
          },
          // Sparse fieldsets
          fields_segment: {
            type: 'array',
            items: { type: 'string', enum: SEGMENT_FIELDS },
            description: 'Limit segment fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Limit flow fields returned',
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
      name: 'klaviyo_segments_get',
      description: 'Get a specific segment by ID with optional includes for tags and flow triggers. Includes profile_count by default.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID',
          },
          include_profile_count: {
            type: 'boolean',
            description: 'Include profile_count in response (default: true)',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: SEGMENT_INCLUDE_OPTIONS },
            description: 'Include related resources: tags, flow-triggers',
          },
          fields_segment: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit segment fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Limit flow fields returned',
          },
        },
        required: ['segment_id'],
      },
    },
    {
      name: 'klaviyo_segments_get_profiles',
      description: 'Get all profiles in a segment with filtering, sorting, and pagination. Supports subscription status and predictive analytics.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID',
          },
          // Filters
          email: {
            type: 'string',
            description: 'Filter by exact email address',
          },
          phone_number: {
            type: 'string',
            description: 'Filter by phone number',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: ['joined_group_at', '-joined_group_at'],
            description: 'Sort by joined_group_at. Prefix with - for descending.',
          },
          // Additional fields
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_ADDITIONAL_FIELDS },
            description: 'Request additional fields: "subscriptions", "predictive_analytics"',
          },
          // Sparse fieldsets
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned',
          },
          // Pagination
          page_size: {
            type: 'number',
            description: 'Number of results per page (max 100, default 20)',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['segment_id'],
      },
    },
    {
      name: 'klaviyo_segments_create',
      description: 'Create a new segment with a definition. Segments dynamically group profiles based on conditions.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the segment (max 255 characters)',
          },
          definition: {
            type: 'object',
            description: 'Segment definition with conditions. Complex object defining the segment criteria.',
            properties: {
              condition_groups: {
                type: 'array',
                description: 'Array of condition groups (OR logic between groups)',
                items: {
                  type: 'object',
                  properties: {
                    conditions: {
                      type: 'array',
                      description: 'Array of conditions (AND logic within group)',
                      items: {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            description: 'Condition type (e.g., "profile_property", "metric", "list")',
                          },
                          dimension: {
                            type: 'string',
                            description: 'The property/metric to evaluate',
                          },
                          operator: {
                            type: 'string',
                            description: 'Comparison operator (e.g., "equals", "contains", "greater-than")',
                          },
                          value: {
                            description: 'Value to compare against',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        required: ['name', 'definition'],
      },
    },
    {
      name: 'klaviyo_segments_update',
      description: 'Update an existing segment name or definition.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID to update',
          },
          name: {
            type: 'string',
            description: 'New segment name (max 255 characters)',
          },
          definition: {
            type: 'object',
            description: 'Updated segment definition with conditions',
          },
          is_starred: {
            type: 'boolean',
            description: 'Set starred status',
          },
        },
        required: ['segment_id'],
      },
    },
    {
      name: 'klaviyo_segments_delete',
      description: 'Delete a segment. This action cannot be undone.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID to delete',
          },
        },
        required: ['segment_id'],
      },
    },
    {
      name: 'klaviyo_segments_get_tags',
      description: 'Get all tags associated with a segment.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Limit tag fields returned',
          },
        },
        required: ['segment_id'],
      },
    },
    {
      name: 'klaviyo_segments_get_flow_triggers',
      description: 'Get all flows that are triggered by this segment.',
      inputSchema: {
        type: 'object',
        properties: {
          segment_id: {
            type: 'string',
            description: 'The Klaviyo segment ID',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Limit flow fields returned',
          },
        },
        required: ['segment_id'],
      },
    },
  ];
}

// Validation schemas
const listSegmentsSchema = z.object({
  name: z.string().optional(),
  name_contains: z.string().optional(),
  id: z.string().optional(),
  is_active: z.boolean().optional(),
  is_starred: z.boolean().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  include: z.array(z.string()).optional(),
  fields_segment: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
  fields_flow: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getSegmentSchema = z.object({
  segment_id: z.string(),
  include_profile_count: z.boolean().optional().default(true),
  include: z.array(z.string()).optional(),
  fields_segment: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
  fields_flow: z.array(z.string()).optional(),
});

const getSegmentProfilesSchema = z.object({
  segment_id: z.string(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  filter: z.string().optional(),
  sort: z.enum(['joined_group_at', '-joined_group_at']).optional(),
  additional_fields: z.array(z.enum(['subscriptions', 'predictive_analytics'])).optional(),
  fields_profile: z.array(z.string()).optional(),
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  definition: z.record(z.unknown()),
});

const updateSegmentSchema = z.object({
  segment_id: z.string(),
  name: z.string().min(1).max(255).optional(),
  definition: z.record(z.unknown()).optional(),
  is_starred: z.boolean().optional(),
});

const deleteSegmentSchema = z.object({
  segment_id: z.string(),
});

const getSegmentTagsSchema = z.object({
  segment_id: z.string(),
  fields_tag: z.array(z.string()).optional(),
});

const getSegmentFlowTriggersSchema = z.object({
  segment_id: z.string(),
  fields_flow: z.array(z.string()).optional(),
});

export async function handleSegmentTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_segments_list': {
      const input = listSegmentsSchema.parse(args);
      return client.listSegments(input);
    }

    case 'klaviyo_segments_get': {
      const input = getSegmentSchema.parse(args);
      return client.getSegment(input.segment_id, {
        include_profile_count: input.include_profile_count,
        include: input.include,
        fields_segment: input.fields_segment,
        fields_tag: input.fields_tag,
        fields_flow: input.fields_flow,
      });
    }

    case 'klaviyo_segments_get_profiles': {
      const input = getSegmentProfilesSchema.parse(args);
      return client.getSegmentProfiles(input.segment_id, input);
    }

    case 'klaviyo_segments_create': {
      const input = createSegmentSchema.parse(args);
      return client.createSegment(input.name, input.definition);
    }

    case 'klaviyo_segments_update': {
      const input = updateSegmentSchema.parse(args);
      const { segment_id, ...updateData } = input;
      return client.updateSegment(segment_id, updateData);
    }

    case 'klaviyo_segments_delete': {
      const input = deleteSegmentSchema.parse(args);
      await client.deleteSegment(input.segment_id);
      return { success: true, message: `Segment ${input.segment_id} deleted successfully` };
    }

    case 'klaviyo_segments_get_tags': {
      const input = getSegmentTagsSchema.parse(args);
      return client.getSegmentTags(input.segment_id, { fields_tag: input.fields_tag });
    }

    case 'klaviyo_segments_get_flow_triggers': {
      const input = getSegmentFlowTriggersSchema.parse(args);
      return client.getSegmentFlowTriggers(input.segment_id, { fields_flow: input.fields_flow });
    }

    default:
      throw new Error(`Unknown segment tool: ${toolName}`);
  }
}
