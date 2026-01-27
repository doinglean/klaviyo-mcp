import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';

// Sort options for tags
const TAG_SORT_OPTIONS = [
  'id', '-id',
  'name', '-name',
];

// Available fields for tags
const TAG_FIELDS = ['name'];

// Available fields for tag groups
const TAG_GROUP_FIELDS = ['name', 'exclusive', 'default'];

export function getTagTools(): Tool[] {
  return [
    {
      name: 'klaviyo_tags_list',
      description: 'List all tags. By default fetches ALL tags automatically (no manual pagination needed). Tags are used to organize and categorize resources.',
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
            description: 'Filter by exact tag name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by partial tag name (contains)',
          },
          id: {
            type: 'string',
            description: 'Filter by tag ID',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: TAG_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending.',
          },
          // Sparse fieldsets
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: TAG_FIELDS },
            description: 'Limit tag fields returned',
          },
          fields_tag_group: {
            type: 'array',
            items: { type: 'string', enum: TAG_GROUP_FIELDS },
            description: 'Limit tag group fields returned',
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
      name: 'klaviyo_tags_get',
      description: 'Get a specific tag by ID with optional tag group information.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: TAG_FIELDS },
            description: 'Limit tag fields returned',
          },
          fields_tag_group: {
            type: 'array',
            items: { type: 'string', enum: TAG_GROUP_FIELDS },
            description: 'Limit tag group fields returned',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['tag-group'] },
            description: 'Include related resources: tag-group',
          },
        },
        required: ['tag_id'],
      },
    },
    {
      name: 'klaviyo_tags_create',
      description: 'Create a new tag. Tags can be organized into tag groups for better organization.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the tag (required)',
          },
          tag_group_id: {
            type: 'string',
            description: 'Optional tag group ID to add the tag to. If not provided, tag will be created in the default group.',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'klaviyo_tags_update',
      description: 'Update an existing tag name.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID to update',
          },
          name: {
            type: 'string',
            description: 'New tag name',
          },
        },
        required: ['tag_id', 'name'],
      },
    },
    {
      name: 'klaviyo_tags_delete',
      description: 'Delete a tag. This will remove the tag from all resources it is associated with.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID to delete',
          },
        },
        required: ['tag_id'],
      },
    },
    {
      name: 'klaviyo_tag_groups_list',
      description: 'List all tag groups. Tag groups help organize tags into categories.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Filter by exact tag group name',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          sort: {
            type: 'string',
            enum: ['id', '-id', 'name', '-name'],
            description: 'Sort field. Prefix with - for descending.',
          },
          fields_tag_group: {
            type: 'array',
            items: { type: 'string', enum: TAG_GROUP_FIELDS },
            description: 'Limit tag group fields returned',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
      },
    },
    {
      name: 'klaviyo_tag_groups_get',
      description: 'Get a specific tag group by ID with its tags.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_group_id: {
            type: 'string',
            description: 'The Klaviyo tag group ID',
          },
          fields_tag_group: {
            type: 'array',
            items: { type: 'string', enum: TAG_GROUP_FIELDS },
            description: 'Limit tag group fields returned',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: TAG_FIELDS },
            description: 'Limit tag fields returned',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: ['tags'] },
            description: 'Include related resources: tags',
          },
        },
        required: ['tag_group_id'],
      },
    },
    {
      name: 'klaviyo_tag_groups_create',
      description: 'Create a new tag group. Tag groups help organize tags into logical categories.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the tag group (required)',
          },
          exclusive: {
            type: 'boolean',
            description: 'If true, resources can only have one tag from this group (default: false)',
          },
          default: {
            type: 'boolean',
            description: 'If true, this is the default tag group for new tags (default: false)',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'klaviyo_tag_groups_update',
      description: 'Update an existing tag group.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_group_id: {
            type: 'string',
            description: 'The Klaviyo tag group ID to update',
          },
          name: {
            type: 'string',
            description: 'New tag group name',
          },
          exclusive: {
            type: 'boolean',
            description: 'If true, resources can only have one tag from this group',
          },
          default: {
            type: 'boolean',
            description: 'If true, this is the default tag group for new tags',
          },
        },
        required: ['tag_group_id'],
      },
    },
    {
      name: 'klaviyo_tag_groups_delete',
      description: 'Delete a tag group. All tags in the group will be moved to the default group.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_group_id: {
            type: 'string',
            description: 'The Klaviyo tag group ID to delete',
          },
        },
        required: ['tag_group_id'],
      },
    },
    {
      name: 'klaviyo_tags_add_to_resource',
      description: 'Add a tag to a resource (campaign, flow, list, or segment).',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID',
          },
          resource_type: {
            type: 'string',
            enum: ['campaign', 'flow', 'list', 'segment'],
            description: 'Type of resource to tag',
          },
          resource_id: {
            type: 'string',
            description: 'ID of the resource to tag',
          },
        },
        required: ['tag_id', 'resource_type', 'resource_id'],
      },
    },
    {
      name: 'klaviyo_tags_remove_from_resource',
      description: 'Remove a tag from a resource (campaign, flow, list, or segment).',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID',
          },
          resource_type: {
            type: 'string',
            enum: ['campaign', 'flow', 'list', 'segment'],
            description: 'Type of resource to untag',
          },
          resource_id: {
            type: 'string',
            description: 'ID of the resource to untag',
          },
        },
        required: ['tag_id', 'resource_type', 'resource_id'],
      },
    },
    {
      name: 'klaviyo_tags_get_resources',
      description: 'Get all resources tagged with a specific tag. Returns flows, campaigns, lists, or segments.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID',
          },
          resource_type: {
            type: 'string',
            enum: ['campaigns', 'flows', 'lists', 'segments'],
            description: 'Type of resources to retrieve',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['tag_id', 'resource_type'],
      },
    },
    {
      name: 'klaviyo_tags_get_tag_group',
      description: 'Get the tag group that contains a specific tag.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_id: {
            type: 'string',
            description: 'The Klaviyo tag ID',
          },
          fields_tag_group: {
            type: 'array',
            items: { type: 'string', enum: TAG_GROUP_FIELDS },
            description: 'Limit tag group fields returned',
          },
        },
        required: ['tag_id'],
      },
    },
    {
      name: 'klaviyo_tag_groups_get_tags',
      description: 'Get all tags within a specific tag group.',
      inputSchema: {
        type: 'object',
        properties: {
          tag_group_id: {
            type: 'string',
            description: 'The Klaviyo tag group ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: TAG_FIELDS },
            description: 'Limit tag fields returned',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['tag_group_id'],
      },
    },
  ];
}

// Validation schemas
const listTagsSchema = z.object({
  fetch_all: z.boolean().optional(),
  max_results: z.number().optional(),
  name: z.string().optional(),
  name_contains: z.string().optional(),
  id: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  fields_tag: z.array(z.string()).optional(),
  fields_tag_group: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getTagSchema = z.object({
  tag_id: z.string(),
  fields_tag: z.array(z.string()).optional(),
  fields_tag_group: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});

const createTagSchema = z.object({
  name: z.string().min(1),
  tag_group_id: z.string().optional(),
});

const updateTagSchema = z.object({
  tag_id: z.string(),
  name: z.string().min(1),
});

const deleteTagSchema = z.object({
  tag_id: z.string(),
});

const listTagGroupsSchema = z.object({
  name: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  fields_tag_group: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

const getTagGroupSchema = z.object({
  tag_group_id: z.string(),
  fields_tag_group: z.array(z.string()).optional(),
  fields_tag: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});

const createTagGroupSchema = z.object({
  name: z.string().min(1),
  exclusive: z.boolean().optional(),
  default: z.boolean().optional(),
});

const updateTagGroupSchema = z.object({
  tag_group_id: z.string(),
  name: z.string().optional(),
  exclusive: z.boolean().optional(),
  default: z.boolean().optional(),
});

const deleteTagGroupSchema = z.object({
  tag_group_id: z.string(),
});

const tagResourceSchema = z.object({
  tag_id: z.string(),
  resource_type: z.enum(['campaign', 'flow', 'list', 'segment']),
  resource_id: z.string(),
});

const getTaggedResourcesSchema = z.object({
  tag_id: z.string(),
  resource_type: z.enum(['campaigns', 'flows', 'lists', 'segments']),
  page_cursor: z.string().optional(),
});

const getTagTagGroupSchema = z.object({
  tag_id: z.string(),
  fields_tag_group: z.array(z.string()).optional(),
});

const getTagGroupTagsSchema = z.object({
  tag_group_id: z.string(),
  fields_tag: z.array(z.string()).optional(),
  page_cursor: z.string().optional(),
});

export async function handleTagTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_tags_list': {
      const input = listTagsSchema.parse(args);
      const { fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination by default
      return fetchAllPages(
        (cursor) => client.listTags({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { fetch_all, max_results }
      );
    }

    case 'klaviyo_tags_get': {
      const input = getTagSchema.parse(args);
      return client.getTag(input.tag_id, {
        fields_tag: input.fields_tag,
        fields_tag_group: input.fields_tag_group,
        include: input.include,
      });
    }

    case 'klaviyo_tags_create': {
      const input = createTagSchema.parse(args);
      return client.createTag(input.name, input.tag_group_id);
    }

    case 'klaviyo_tags_update': {
      const input = updateTagSchema.parse(args);
      return client.updateTag(input.tag_id, input.name);
    }

    case 'klaviyo_tags_delete': {
      const input = deleteTagSchema.parse(args);
      await client.deleteTag(input.tag_id);
      return { success: true, message: `Tag ${input.tag_id} deleted successfully` };
    }

    case 'klaviyo_tag_groups_list': {
      const input = listTagGroupsSchema.parse(args);
      return client.listTagGroups(input);
    }

    case 'klaviyo_tag_groups_get': {
      const input = getTagGroupSchema.parse(args);
      return client.getTagGroup(input.tag_group_id, {
        fields_tag_group: input.fields_tag_group,
        fields_tag: input.fields_tag,
        include: input.include,
      });
    }

    case 'klaviyo_tag_groups_create': {
      const input = createTagGroupSchema.parse(args);
      return client.createTagGroup(input.name, {
        exclusive: input.exclusive,
        default: input.default,
      });
    }

    case 'klaviyo_tag_groups_update': {
      const input = updateTagGroupSchema.parse(args);
      const { tag_group_id, ...updateData } = input;
      return client.updateTagGroup(tag_group_id, updateData);
    }

    case 'klaviyo_tag_groups_delete': {
      const input = deleteTagGroupSchema.parse(args);
      await client.deleteTagGroup(input.tag_group_id);
      return { success: true, message: `Tag group ${input.tag_group_id} deleted successfully` };
    }

    case 'klaviyo_tags_add_to_resource': {
      const input = tagResourceSchema.parse(args);
      await client.addTagToResource(input.tag_id, input.resource_type, input.resource_id);
      return { success: true, message: `Tag ${input.tag_id} added to ${input.resource_type} ${input.resource_id}` };
    }

    case 'klaviyo_tags_remove_from_resource': {
      const input = tagResourceSchema.parse(args);
      await client.removeTagFromResource(input.tag_id, input.resource_type, input.resource_id);
      return { success: true, message: `Tag ${input.tag_id} removed from ${input.resource_type} ${input.resource_id}` };
    }

    case 'klaviyo_tags_get_resources': {
      const input = getTaggedResourcesSchema.parse(args);
      return client.getTaggedResources(input.tag_id, input.resource_type, {
        page_cursor: input.page_cursor,
      });
    }

    case 'klaviyo_tags_get_tag_group': {
      const input = getTagTagGroupSchema.parse(args);
      return client.getTagTagGroup(input.tag_id, {
        fields_tag_group: input.fields_tag_group,
      });
    }

    case 'klaviyo_tag_groups_get_tags': {
      const input = getTagGroupTagsSchema.parse(args);
      return client.getTagGroupTags(input.tag_group_id, {
        fields_tag: input.fields_tag,
        page_cursor: input.page_cursor,
      });
    }

    default:
      throw new Error(`Unknown tag tool: ${toolName}`);
  }
}
