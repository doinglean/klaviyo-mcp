import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { KlaviyoClient } from '../api/client.js';
import {
  listProfilesSchema,
  getProfileSchema,
  createProfileSchema,
  updateProfileSchema,
  subscribeProfilesSchema,
  unsubscribeProfilesSchema,
  suppressProfilesSchema,
  unsuppressProfilesSchema,
  getProfileListsSchema,
  getProfileSegmentsSchema,
  upsertProfileSchema,
  mergeProfilesSchema,
} from '../utils/validation.js';

// Available sort options for profiles
const PROFILE_SORT_OPTIONS = [
  'created', '-created',
  'email', '-email',
  'id', '-id',
  'updated', '-updated',
  'subscriptions.email.marketing.list_suppressions.timestamp',
  '-subscriptions.email.marketing.list_suppressions.timestamp',
  'subscriptions.email.marketing.suppression.timestamp',
  '-subscriptions.email.marketing.suppression.timestamp',
];

// Available additional fields for profiles
const PROFILE_ADDITIONAL_FIELDS = ['subscriptions', 'predictive_analytics'];

// Available include options for profiles
const PROFILE_INCLUDE_OPTIONS = ['lists', 'push-tokens', 'segments'];

export function getProfileTools(): Tool[] {
  return [
    {
      name: 'klaviyo_profiles_list',
      description: 'List profiles (contacts) in Klaviyo with filtering, sorting, and relationship includes. Supports advanced filters on subscription status and predictive analytics.',
      inputSchema: {
        type: 'object',
        properties: {
          // Simple filters (convenience)
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
          id: {
            type: 'string',
            description: 'Filter by Klaviyo profile ID',
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
          // Advanced filter (raw)
          filter: {
            type: 'string',
            description: 'Raw Klaviyo filter string for advanced filtering (e.g., "equals(subscriptions.email.marketing.suppression.reason,\\"USER_SUPPRESSED\\")")',
          },
          // Sort
          sort: {
            type: 'string',
            enum: PROFILE_SORT_OPTIONS,
            description: 'Sort field. Prefix with - for descending. Options: created, email, id, updated, subscription timestamps',
          },
          // Additional fields
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_ADDITIONAL_FIELDS },
            description: 'Request additional fields: "subscriptions" (email/SMS consent status) or "predictive_analytics" (CLV, churn probability, etc.)',
          },
          // Sparse fieldsets
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned (sparse fieldsets). Examples: email, first_name, properties, subscriptions.email.marketing',
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
      },
    },
    {
      name: 'klaviyo_profiles_get',
      description: 'Get a specific profile by ID with optional relationship includes and additional fields like subscriptions and predictive analytics.',
      inputSchema: {
        type: 'object',
        properties: {
          profile_id: {
            type: 'string',
            description: 'The Klaviyo profile ID (e.g., "01GDDKASAP8TKDDA2GRZDSVP4H")',
          },
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_ADDITIONAL_FIELDS },
            description: 'Request additional fields: "subscriptions" or "predictive_analytics"',
          },
          include: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_INCLUDE_OPTIONS },
            description: 'Include related resources: "lists", "segments", "push-tokens"',
          },
          fields_profile: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit profile fields returned',
          },
          fields_list: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'created', 'updated', 'opt_in_process'] },
            description: 'Fields to include for related lists',
          },
          fields_segment: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'definition', 'created', 'updated', 'is_active', 'is_processing', 'is_starred'] },
            description: 'Fields to include for related segments',
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
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_ADDITIONAL_FIELDS },
            description: 'Request additional fields in response',
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
          additional_fields: {
            type: 'array',
            items: { type: 'string', enum: PROFILE_ADDITIONAL_FIELDS },
            description: 'Request additional fields in response',
          },
        },
        required: ['profile_id'],
      },
    },
    {
      name: 'klaviyo_profiles_upsert',
      description: 'Create or update a profile (upsert). If a profile with the given identifier exists, it will be updated; otherwise, a new profile is created. This is the preferred method for syncing data.',
      inputSchema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Email address (used as identifier)',
          },
          phone_number: {
            type: 'string',
            description: 'Phone number in E.164 format (used as identifier)',
          },
          external_id: {
            type: 'string',
            description: 'External ID (used as identifier)',
          },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          organization: { type: 'string' },
          title: { type: 'string' },
          image: { type: 'string' },
          location: {
            type: 'object',
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
            description: 'Custom properties',
          },
        },
      },
    },
    {
      name: 'klaviyo_profiles_merge',
      description: 'Merge two profiles into one. The source profile will be merged into the destination profile, and the source will be deleted.',
      inputSchema: {
        type: 'object',
        properties: {
          source_profile_id: {
            type: 'string',
            description: 'The profile ID to merge FROM (will be deleted)',
          },
          destination_profile_id: {
            type: 'string',
            description: 'The profile ID to merge INTO (will be kept)',
          },
        },
        required: ['source_profile_id', 'destination_profile_id'],
      },
    },
    {
      name: 'klaviyo_profiles_get_lists',
      description: 'Get all lists that a profile is a member of.',
      inputSchema: {
        type: 'object',
        properties: {
          profile_id: {
            type: 'string',
            description: 'The Klaviyo profile ID',
          },
          fields_list: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'created', 'updated', 'opt_in_process'] },
            description: 'Fields to include for lists',
          },
        },
        required: ['profile_id'],
      },
    },
    {
      name: 'klaviyo_profiles_get_segments',
      description: 'Get all segments that a profile is a member of.',
      inputSchema: {
        type: 'object',
        properties: {
          profile_id: {
            type: 'string',
            description: 'The Klaviyo profile ID',
          },
          fields_segment: {
            type: 'array',
            items: { type: 'string', enum: ['name', 'definition', 'created', 'updated', 'is_active', 'is_processing', 'is_starred'] },
            description: 'Fields to include for segments',
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
      name: 'klaviyo_profiles_unsubscribe',
      description: 'Unsubscribe one or more profiles from email and/or SMS marketing for a specific list.',
      inputSchema: {
        type: 'object',
        properties: {
          list_id: {
            type: 'string',
            description: 'The Klaviyo list ID to unsubscribe profiles from',
          },
          profiles: {
            type: 'array',
            description: 'Array of profiles to unsubscribe',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone_number: { type: 'string' },
              },
            },
          },
          email_unsubscribe: {
            type: 'boolean',
            description: 'Unsubscribe from email marketing (default: true)',
          },
          sms_unsubscribe: {
            type: 'boolean',
            description: 'Unsubscribe from SMS marketing (default: false)',
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
    {
      name: 'klaviyo_profiles_unsuppress',
      description: 'Remove suppression from one or more profiles, allowing them to receive marketing communications again.',
      inputSchema: {
        type: 'object',
        properties: {
          profiles: {
            type: 'array',
            description: 'Array of profiles to unsuppress',
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
    // Bulk Import Jobs
    {
      name: 'klaviyo_profiles_bulk_import',
      description: 'Create a bulk profile import job. Import multiple profiles at once, optionally adding them to lists.',
      inputSchema: {
        type: 'object',
        properties: {
          profiles: {
            type: 'array',
            description: 'Array of profile data to import',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone_number: { type: 'string' },
                external_id: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                properties: { type: 'object' },
              },
            },
          },
          list_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list IDs to add imported profiles to',
          },
        },
        required: ['profiles'],
      },
    },
    {
      name: 'klaviyo_profiles_bulk_import_jobs_list',
      description: 'List all bulk profile import jobs. Check status of import operations.',
      inputSchema: {
        type: 'object',
        properties: {
          page_cursor: { type: 'string', description: 'Cursor for pagination' },
          filter: { type: 'string', description: 'Filter expression' },
        },
      },
    },
    {
      name: 'klaviyo_profiles_bulk_import_job_get',
      description: 'Get details of a specific bulk import job by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          job_id: { type: 'string', description: 'The bulk import job ID' },
        },
        required: ['job_id'],
      },
    },
    // Suppression Job Status
    {
      name: 'klaviyo_profiles_suppression_jobs_list',
      description: 'List all profile suppression jobs (both create and delete). Monitor bulk suppression operations.',
      inputSchema: {
        type: 'object',
        properties: {
          job_type: {
            type: 'string',
            enum: ['create', 'delete'],
            description: 'Type of suppression job: "create" (suppress profiles) or "delete" (unsuppress profiles)',
          },
          page_cursor: { type: 'string', description: 'Cursor for pagination' },
          filter: { type: 'string', description: 'Filter expression' },
        },
        required: ['job_type'],
      },
    },
    {
      name: 'klaviyo_profiles_suppression_job_get',
      description: 'Get details of a specific suppression job by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          job_type: {
            type: 'string',
            enum: ['create', 'delete'],
            description: 'Type of suppression job: "create" or "delete"',
          },
          job_id: { type: 'string', description: 'The suppression job ID' },
        },
        required: ['job_type', 'job_id'],
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
      return client.getProfile(input.profile_id, {
        additional_fields: input.additional_fields,
        include: input.include,
        fields_profile: input.fields_profile,
        fields_list: input.fields_list,
        fields_segment: input.fields_segment,
      });
    }

    case 'klaviyo_profiles_create': {
      const input = createProfileSchema.parse(args);
      const { additional_fields, ...profileData } = input;
      return client.createProfile(profileData, { additional_fields });
    }

    case 'klaviyo_profiles_update': {
      const input = updateProfileSchema.parse(args);
      const { profile_id, additional_fields, ...updateData } = input;
      return client.updateProfile(profile_id, updateData, { additional_fields });
    }

    case 'klaviyo_profiles_upsert': {
      const input = upsertProfileSchema.parse(args);
      return client.upsertProfile(input);
    }

    case 'klaviyo_profiles_merge': {
      const input = mergeProfilesSchema.parse(args);
      return client.mergeProfiles(input.source_profile_id, input.destination_profile_id);
    }

    case 'klaviyo_profiles_get_lists': {
      const input = getProfileListsSchema.parse(args);
      return client.getProfileLists(input.profile_id, { fields_list: input.fields_list });
    }

    case 'klaviyo_profiles_get_segments': {
      const input = getProfileSegmentsSchema.parse(args);
      return client.getProfileSegments(input.profile_id, { fields_segment: input.fields_segment });
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

    case 'klaviyo_profiles_unsubscribe': {
      const input = unsubscribeProfilesSchema.parse(args);
      return client.unsubscribeProfiles({
        listId: input.list_id,
        profiles: input.profiles,
        emailUnsubscribe: input.email_unsubscribe,
        smsUnsubscribe: input.sms_unsubscribe,
      });
    }

    case 'klaviyo_profiles_suppress': {
      const input = suppressProfilesSchema.parse(args);
      return client.suppressProfiles(input.profiles);
    }

    case 'klaviyo_profiles_unsuppress': {
      const input = unsuppressProfilesSchema.parse(args);
      return client.unsuppressProfiles(input.profiles);
    }

    // Bulk Import Jobs
    case 'klaviyo_profiles_bulk_import': {
      const input = z.object({
        profiles: z.array(z.object({
          email: z.string().optional(),
          phone_number: z.string().optional(),
          external_id: z.string().optional(),
          first_name: z.string().optional(),
          last_name: z.string().optional(),
          properties: z.record(z.unknown()).optional(),
        })),
        list_ids: z.array(z.string()).optional(),
      }).parse(args);
      return client.createBulkImportJob(input);
    }

    case 'klaviyo_profiles_bulk_import_jobs_list': {
      const input = z.object({
        page_cursor: z.string().optional(),
        filter: z.string().optional(),
      }).parse(args);
      return client.getBulkImportJobs(input);
    }

    case 'klaviyo_profiles_bulk_import_job_get': {
      const input = z.object({
        job_id: z.string(),
      }).parse(args);
      return client.getBulkImportJob(input.job_id);
    }

    // Suppression Job Status
    case 'klaviyo_profiles_suppression_jobs_list': {
      const input = z.object({
        job_type: z.enum(['create', 'delete']),
        page_cursor: z.string().optional(),
        filter: z.string().optional(),
      }).parse(args);
      if (input.job_type === 'create') {
        return client.getSuppressionCreateJobs({ page_cursor: input.page_cursor, filter: input.filter });
      } else {
        return client.getSuppressionDeleteJobs({ page_cursor: input.page_cursor, filter: input.filter });
      }
    }

    case 'klaviyo_profiles_suppression_job_get': {
      const input = z.object({
        job_type: z.enum(['create', 'delete']),
        job_id: z.string(),
      }).parse(args);
      if (input.job_type === 'create') {
        return client.getSuppressionCreateJob(input.job_id);
      } else {
        return client.getSuppressionDeleteJob(input.job_id);
      }
    }

    default:
      throw new Error(`Unknown profile tool: ${toolName}`);
  }
}
