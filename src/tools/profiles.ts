import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import {
  listProfilesSchema,
  getProfileSchema,
  createProfileSchema,
  updateProfileSchema,
  subscribeProfilesSchema,
  suppressProfilesSchema,
} from '../utils/validation.js';

export function getProfileTools(): Tool[] {
  return [
    {
      name: 'klaviyo_profiles_list',
      description: 'List profiles (contacts) in Klaviyo with optional filtering. Can filter by email, phone number, external ID, and date ranges.',
      inputSchema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Filter by exact email address',
          },
          phone_number: {
            type: 'string',
            description: 'Filter by phone number (E.164 format recommended)',
          },
          external_id: {
            type: 'string',
            description: 'Filter by external ID',
          },
          created_after: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles created after this date',
          },
          created_before: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles created before this date',
          },
          updated_after: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles updated after this date',
          },
          updated_before: {
            type: 'string',
            description: 'ISO 8601 datetime - return profiles updated before this date',
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
      },
    },
    {
      name: 'klaviyo_profiles_get',
      description: 'Get a specific profile by its Klaviyo ID. Returns full profile details including email, phone, name, and custom properties.',
      inputSchema: {
        type: 'object',
        properties: {
          profile_id: {
            type: 'string',
            description: 'The Klaviyo profile ID (e.g., "01GDDKASAP8TKDDA2GRZDSVP4H")',
          },
        },
        required: ['profile_id'],
      },
    },
    {
      name: 'klaviyo_profiles_create',
      description: 'Create a new profile in Klaviyo. At least one identifier (email, phone_number, or external_id) is required.',
      inputSchema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Email address',
          },
          phone_number: {
            type: 'string',
            description: 'Phone number in E.164 format (e.g., "+15551234567")',
          },
          external_id: {
            type: 'string',
            description: 'Your system\'s unique identifier for this contact',
          },
          first_name: {
            type: 'string',
            description: 'First name',
          },
          last_name: {
            type: 'string',
            description: 'Last name',
          },
          organization: {
            type: 'string',
            description: 'Company or organization name',
          },
          title: {
            type: 'string',
            description: 'Job title',
          },
          image: {
            type: 'string',
            description: 'URL to profile image',
          },
          location: {
            type: 'object',
            description: 'Location information',
            properties: {
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              country: { type: 'string' },
              region: { type: 'string' },
              zip: { type: 'string' },
              timezone: { type: 'string' },
            },
          },
          properties: {
            type: 'object',
            description: 'Custom properties as key-value pairs',
          },
        },
      },
    },
    {
      name: 'klaviyo_profiles_update',
      description: 'Update an existing profile in Klaviyo. Only provided fields will be updated.',
      inputSchema: {
        type: 'object',
        properties: {
          profile_id: {
            type: 'string',
            description: 'The Klaviyo profile ID to update',
          },
          email: {
            type: 'string',
            description: 'New email address',
          },
          phone_number: {
            type: 'string',
            description: 'New phone number in E.164 format',
          },
          external_id: {
            type: 'string',
            description: 'New external ID',
          },
          first_name: {
            type: 'string',
            description: 'First name',
          },
          last_name: {
            type: 'string',
            description: 'Last name',
          },
          organization: {
            type: 'string',
            description: 'Company or organization name',
          },
          title: {
            type: 'string',
            description: 'Job title',
          },
          image: {
            type: 'string',
            description: 'URL to profile image',
          },
          location: {
            type: 'object',
            description: 'Location information',
            properties: {
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              country: { type: 'string' },
              region: { type: 'string' },
              zip: { type: 'string' },
              timezone: { type: 'string' },
            },
          },
          properties: {
            type: 'object',
            description: 'Custom properties to set or update',
          },
        },
        required: ['profile_id'],
      },
    },
    {
      name: 'klaviyo_profiles_subscribe',
      description: 'Subscribe one or more profiles to a list with email and/or SMS consent. Creates profiles if they don\'t exist.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to subscribe profiles to',
          },
          profiles: {
            type: 'array',
            description: 'Array of profiles to subscribe (each needs email and/or phone_number)',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone_number: { type: 'string' },
              },
            },
          },
          email_consent: {
            type: 'boolean',
            description: 'Subscribe for email marketing (default: true)',
          },
          sms_consent: {
            type: 'boolean',
            description: 'Subscribe for SMS marketing (default: false)',
          },
        },
        required: ['list_id', 'profiles'],
      },
    },
    {
      name: 'klaviyo_profiles_suppress',
      description: 'Suppress (globally unsubscribe) one or more profiles. Suppressed profiles will not receive any marketing communications.',
      inputSchema: {
        type: 'object',
        properties: {
          profiles: {
            type: 'array',
            description: 'Array of profiles to suppress (each needs email and/or phone_number)',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone_number: { type: 'string' },
              },
            },
          },
        },
        required: ['profiles'],
      },
    },
  ];
}

export async function handleProfileTool(
  client: KlaviyoClient,
  toolName: string,
  args: unknown
): Promise<unknown> {
  switch (toolName) {
    case 'klaviyo_profiles_list': {
      const input = listProfilesSchema.parse(args);
      return client.listProfiles(input);
    }

    case 'klaviyo_profiles_get': {
      const input = getProfileSchema.parse(args);
      return client.getProfile(input.profile_id);
    }

    case 'klaviyo_profiles_create': {
      const input = createProfileSchema.parse(args);
      return client.createProfile(input);
    }

    case 'klaviyo_profiles_update': {
      const input = updateProfileSchema.parse(args);
      const { profile_id, ...updateData } = input;
      return client.updateProfile(profile_id, updateData);
    }

    case 'klaviyo_profiles_subscribe': {
      const input = subscribeProfilesSchema.parse(args);
      return client.subscribeProfiles({
        listId: input.list_id,
        profiles: input.profiles,
        emailConsent: input.email_consent,
        smsConsent: input.sms_consent,
      });
    }

    case 'klaviyo_profiles_suppress': {
      const input = suppressProfilesSchema.parse(args);
      return client.suppressProfiles(input.profiles);
    }

    default:
      throw new Error(`Unknown profile tool: ${toolName}`);
  }
}
