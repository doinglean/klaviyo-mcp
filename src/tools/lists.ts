import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import {
  listListsSchema,
  getListSchema,
  createListSchema,
  updateListSchema,
  deleteListSchema,
  getListProfilesSchema,
  addProfilesToListSchema,
  removeProfilesFromListSchema,
  getListTagsSchema,
  getListFlowTriggersSchema,
} from '../utils/validation.js';
import { fetchAllPages, type PaginatedResponse } from '../utils/pagination.js';

// Available sort options for lists
const LIST_SORT_OPTIONS = [
  'created', '-created',
  'id', '-id',
  'name', '-name',
  'updated', '-updated',
];

// Available sort options for list profiles
const LIST_PROFILES_SORT_OPTIONS = [
  'joined_group_at', '-joined_group_at',
];

// Available additional fields for profiles
const PROFILE_ADDITIONAL_FIELDS = ['subscriptions', 'predictive_analytics'];

// Available include options for lists
const LIST_INCLUDE_OPTIONS = ['flow-triggers', 'tags'];

export function getListTools(): Tool[] {
  return [
    {
      name: 'klaviyo_lists_list',
      description: 'Get all lists in your Klaviyo account. By default fetches ALL lists automatically (no manual pagination needed). Supports filtering, sorting, and relationship includes.',
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
            description: 'Filter by exact list name',
          },
          name_contains: {
            type: 'string',
            description: 'Filter by lists containing this text in name (uses any operator)',
          },
          id: {
            type: 'string',
            description: 'Filter by list ID',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - return lists created after this date',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - return lists updated after this date',
          },
          // Raw filter
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: LIST_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending. Options: created, id, name, updated',
          },
          // Include relationships
          include: {
            type: 'array',
            items: { type: 'string', enum: LIST_INCLUDE_OPTIONS },
            description: 'Include related resources: "flow-triggers", "tags"',
          },
          // Sparse fieldsets
          fields_list: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'created', 'updated', 'opt_in_process'] },
            description: 'Limit list fields returned',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Fields to include for related flows (when include contains flow-triggers)',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Fields to include for related tags (when include contains tags)',
          },
          // Pagination (only needed if fetch_all is false)
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination (only used when fetch_all is false)',
          },
        },
      },
    },
    {
      name: 'klaviyo_lists_get',
      description: 'Get details of a specific list by its ID. Includes profile_count by default.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
          },
          include_profile_count: {
            type: 'boolean',
            description: 'Include profile_count in response (default: true)',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: LIST_INCLUDE_OPTIONS },
            description: 'Include related resources: "flow-triggers", "tags"',
          },
          fields_list: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'created', 'updated', 'opt_in_process', 'profile_count'] },
            description: 'Limit list fields returned',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Fields to include for related flows',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Fields to include for related tags',
          },
        },
        required: ['list_id'],
      },
    },
    {
      name: 'klaviyo_lists_create',
      description: 'Create a new list in Klaviyo.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the new list (max 255 characters)',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'klaviyo_lists_update',
      description: 'Update an existing list\'s name.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to update',
          },
          name: {
            type: 'string',
            description: 'New name for the list (max 255 characters)',
          },
        },
        required: ['list_id', 'name'],
      },
    },
    {
      name: 'klaviyo_lists_delete',
      description: 'Delete a list from Klaviyo. This action cannot be undone.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to delete',
          },
        },
        required: ['list_id'],
      },
    },
    {
      name: 'klaviyo_lists_get_profiles',
      description: 'Get all profiles (subscribers) that are members of a specific list. Supports filtering, sorting, and additional profile fields.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
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
          joined_after: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles that joined the list after this date',
          },
          joined_before: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles that joined the list before this date',
          },
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering',
          },
          // Sort
          sort: {
            type: 'string',
            enum: LIST_PROFILES_SORT_OPTIONS,
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
            description: 'Limit profile fields returned. Special field: "joined_group_at"',
          },
          // Pagination
          page_size: {
            type: 'number',
            description: 'Number of results per page (max 100, default 20)',
          },
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination (from previous response)',
          },
        },
        required: ['list_id'],
      },
    },
    {
      name: 'klaviyo_lists_get_tags',
      description: 'Get all tags associated with a specific list.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
          },
          fields_tag: {
            type: 'array',
            items: { type: 'string', enum: ['name'] },
            description: 'Fields to include for tags',
          },
        },
        required: ['list_id'],
      },
    },
    {
      name: 'klaviyo_lists_get_flow_triggers',
      description: 'Get all flows that are triggered by this list.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
          },
          fields_flow: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'status', 'archived', 'created', 'updated', 'trigger_type'] },
            description: 'Fields to include for flows',
          },
        },
        required: ['list_id'],
      },
    },
    {
      name: 'klaviyo_lists_add_profiles',
      description: 'Add existing profiles to a list by their profile IDs. Profiles must already exist in Klaviyo.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to add profiles to',
          },
          profile_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of profile IDs to add to the list',
          },
        },
        required: ['list_id', 'profile_ids'],
      },
    },
    {
      name: 'klaviyo_lists_remove_profiles',
      description: 'Remove profiles from a list. This does not delete the profiles, only removes list membership.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to remove profiles from',
          },
          profile_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of profile IDs to remove from the list',
          },
        },
        required: ['list_id', 'profile_ids'],
      },
    },
  ];
}

export async function handleListTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_lists_list': {
      const input = listListsSchema.parse(args);
      const { fetch_all, max_results, ...listOptions } = input;
      
      // Use auto-pagination by default
      return fetchAllPages(
        (cursor) => client.listLists({ ...listOptions, page_cursor: cursor }) as Promise<PaginatedResponse>,
        { fetch_all, max_results }
      );
    }

    case 'klaviyo_lists_get': {
      const input = getListSchema.parse(args);
      return client.getList(input.list_id, {
        include_profile_count: input.include_profile_count,
        include: input.include,
        fields_list: input.fields_list,
        fields_flow: input.fields_flow,
        fields_tag: input.fields_tag,
      });
    }

    case 'klaviyo_lists_create': {
      const input = createListSchema.parse(args);
      return client.createList(input.name);
    }

    case 'klaviyo_lists_update': {
      const input = updateListSchema.parse(args);
      return client.updateList(input.list_id, input.name);
    }

    case 'klaviyo_lists_delete': {
      const input = deleteListSchema.parse(args);
      await client.deleteList(input.list_id);
      return { success: true, message: `List ${input.list_id} deleted successfully` };
    }

    case 'klaviyo_lists_get_profiles': {
      const input = getListProfilesSchema.parse(args);
      return client.getListProfiles(input.list_id, input);
    }

    case 'klaviyo_lists_get_tags': {
      const input = getListTagsSchema.parse(args);
      return client.getListTags(input.list_id, { fields_tag: input.fields_tag });
    }

    case 'klaviyo_lists_get_flow_triggers': {
      const input = getListFlowTriggersSchema.parse(args);
      return client.getListFlowTriggers(input.list_id, { fields_flow: input.fields_flow });
    }

    case 'klaviyo_lists_add_profiles': {
      const input = addProfilesToListSchema.parse(args);
      await client.addProfilesToList(input.list_id, input.profile_ids);
      return { 
        success: true, 
        message: `Added ${input.profile_ids.length} profile(s) to list ${input.list_id}` 
      };
    }

    case 'klaviyo_lists_remove_profiles': {
      const input = removeProfilesFromListSchema.parse(args);
      await client.removeProfilesFromList(input.list_id, input.profile_ids);
      return { 
        success: true, 
        message: `Removed ${input.profile_ids.length} profile(s) from list ${input.list_id}` 
      };
    }

    default:
      throw new Error(`Unknown list tool: ${toolName}`);
  }
}
