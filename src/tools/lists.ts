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
} from '../utils/validation.js';

export function getListTools(): Tool[] {
  return [
    {
      name: 'klaviyo_lists_list',
      description: 'Get all lists in your Klaviyo account. Returns list names, IDs, and creation dates.',
      inputSchema: {
        type: 'object',
        properties: {
          page_cursor: {
            type: 'string',
            description: 'Cursor for pagination (from previous response)',
          },
        },
      },
    },
    {
      name: 'klaviyo_lists_get',
      description: 'Get details of a specific list by its ID.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
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
      description: 'Get all profiles (subscribers) that are members of a specific list.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID',
          },
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
      return client.listLists({ page_cursor: input.page_cursor });
    }

    case 'klaviyo_lists_get': {
      const input = getListSchema.parse(args);
      return client.getList(input.list_id);
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
      return client.getListProfiles(input.list_id, {
        page_size: input.page_size,
        page_cursor: input.page_cursor,
      });
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
