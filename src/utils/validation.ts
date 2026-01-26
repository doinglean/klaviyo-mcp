import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

// Profile additional fields and includes
const profileAdditionalFieldsSchema = z.array(z.enum(['subscriptions', 'predictive_analytics'])).optional();
const profileIncludeSchema = z.array(z.enum(['lists', 'segments', 'push-tokens'])).optional();
const profileSortSchema = z.enum([
  'created', '-created',
  'email', '-email',
  'id', '-id',
  'updated', '-updated',
  'subscriptions.email.marketing.list_suppressions.timestamp',
  '-subscriptions.email.marketing.list_suppressions.timestamp',
  'subscriptions.email.marketing.suppression.timestamp',
  '-subscriptions.email.marketing.suppression.timestamp',
]).optional();

// List includes and sort
const listIncludeSchema = z.array(z.enum(['flow-triggers', 'tags'])).optional();
const listSortSchema = z.enum([
  'created', '-created',
  'id', '-id',
  'name', '-name',
  'updated', '-updated',
]).optional();
const listProfilesSortSchema = z.enum(['joined_group_at', '-joined_group_at']).optional();

// Profile schemas
export const listProfilesSchema = z.object({
  // Simple filters
  email: z.string().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  id: z.string().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  updated_before: z.string().optional(),
  // Advanced filter
  filter: z.string().optional(),
  // Sort
  sort: profileSortSchema,
  // Additional fields
  additional_fields: profileAdditionalFieldsSchema,
  // Sparse fieldsets
  fields_profile: z.array(z.string()).optional(),
  // Pagination
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

export const getProfileSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
  additional_fields: profileAdditionalFieldsSchema,
  include: profileIncludeSchema,
  fields_profile: z.array(z.string()).optional(),
  fields_list: z.array(z.enum(['name', 'created', 'updated', 'opt_in_process'])).optional(),
  fields_segment: z.array(z.enum(['name', 'definition', 'created', 'updated', 'is_active', 'is_processing', 'is_starred'])).optional(),
});

export const createProfileSchema = z.object({
  email: z.string().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  image: z.string().optional(),
  location: z.object({
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    zip: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  properties: z.record(z.unknown()).optional(),
  additional_fields: profileAdditionalFieldsSchema,
}).refine(
  (data) => data.email || data.phone_number || data.external_id,
  { message: 'At least one of email, phone_number, or external_id is required' }
);

export const updateProfileSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  image: z.string().optional(),
  location: z.object({
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    zip: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  properties: z.record(z.unknown()).optional(),
  additional_fields: profileAdditionalFieldsSchema,
});

export const upsertProfileSchema = z.object({
  email: z.string().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  image: z.string().optional(),
  location: z.object({
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    zip: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  properties: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.email || data.phone_number || data.external_id,
  { message: 'At least one of email, phone_number, or external_id is required' }
);

export const mergeProfilesSchema = z.object({
  source_profile_id: z.string().min(1, 'Source profile ID is required'),
  destination_profile_id: z.string().min(1, 'Destination profile ID is required'),
});

export const getProfileListsSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
  fields_list: z.array(z.enum(['name', 'created', 'updated', 'opt_in_process'])).optional(),
});

export const getProfileSegmentsSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
  fields_segment: z.array(z.enum(['name', 'definition', 'created', 'updated', 'is_active', 'is_processing', 'is_starred'])).optional(),
});

export const subscribeProfilesSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  profiles: z.array(z.object({
    email: z.string().optional(),
    phone_number: z.string().optional(),
  })).min(1, 'At least one profile is required'),
  email_consent: z.boolean().optional().default(true),
  sms_consent: z.boolean().optional().default(false),
});

export const unsubscribeProfilesSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  profiles: z.array(z.object({
    email: z.string().optional(),
    phone_number: z.string().optional(),
  })).min(1, 'At least one profile is required'),
  email_unsubscribe: z.boolean().optional().default(true),
  sms_unsubscribe: z.boolean().optional().default(false),
});

export const suppressProfilesSchema = z.object({
  profiles: z.array(z.object({
    email: z.string().optional(),
    phone_number: z.string().optional(),
  }).refine(
    (data) => data.email || data.phone_number,
    { message: 'Each profile must have an email or phone_number' }
  )).min(1, 'At least one profile is required'),
});

export const unsuppressProfilesSchema = z.object({
  profiles: z.array(z.object({
    email: z.string().optional(),
    phone_number: z.string().optional(),
  }).refine(
    (data) => data.email || data.phone_number,
    { message: 'Each profile must have an email or phone_number' }
  )).min(1, 'At least one profile is required'),
});

// List schemas
export const listListsSchema = z.object({
  // Filters
  name: z.string().optional(),
  name_contains: z.string().optional(),
  id: z.string().optional(),
  created_after: z.string().optional(),
  updated_after: z.string().optional(),
  filter: z.string().optional(),
  // Sort
  sort: listSortSchema,
  // Include
  include: listIncludeSchema,
  // Sparse fieldsets
  fields_list: z.array(z.enum(['name', 'created', 'updated', 'opt_in_process'])).optional(),
  fields_flow: z.array(z.enum(['name', 'status', 'archived', 'created', 'updated', 'trigger_type'])).optional(),
  fields_tag: z.array(z.enum(['name'])).optional(),
  // Pagination
  page_cursor: z.string().optional(),
});

export const getListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  include_profile_count: z.boolean().optional().default(true),
  include: listIncludeSchema,
  fields_list: z.array(z.enum(['name', 'created', 'updated', 'opt_in_process', 'profile_count'])).optional(),
  fields_flow: z.array(z.enum(['name', 'status', 'archived', 'created', 'updated', 'trigger_type'])).optional(),
  fields_tag: z.array(z.enum(['name'])).optional(),
});

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(255),
});

export const updateListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  name: z.string().min(1, 'List name is required').max(255),
});

export const deleteListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
});

export const getListProfilesSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  // Filters
  email: z.string().optional(),
  phone_number: z.string().optional(),
  joined_after: z.string().optional(),
  joined_before: z.string().optional(),
  filter: z.string().optional(),
  // Sort
  sort: listProfilesSortSchema,
  // Additional fields
  additional_fields: profileAdditionalFieldsSchema,
  // Sparse fieldsets
  fields_profile: z.array(z.string()).optional(),
  // Pagination
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

export const getListTagsSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  fields_tag: z.array(z.enum(['name'])).optional(),
});

export const getListFlowTriggersSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  fields_flow: z.array(z.enum(['name', 'status', 'archived', 'created', 'updated', 'trigger_type'])).optional(),
});

export const addProfilesToListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  profile_ids: z.array(z.string().min(1)).min(1, 'At least one profile ID is required'),
});

export const removeProfilesFromListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  profile_ids: z.array(z.string().min(1)).min(1, 'At least one profile ID is required'),
});

// Type exports
export type ListProfilesInput = z.infer<typeof listProfilesSchema>;
export type GetProfileInput = z.infer<typeof getProfileSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
export type MergeProfilesInput = z.infer<typeof mergeProfilesSchema>;
export type GetProfileListsInput = z.infer<typeof getProfileListsSchema>;
export type GetProfileSegmentsInput = z.infer<typeof getProfileSegmentsSchema>;
export type SubscribeProfilesInput = z.infer<typeof subscribeProfilesSchema>;
export type UnsubscribeProfilesInput = z.infer<typeof unsubscribeProfilesSchema>;
export type SuppressProfilesInput = z.infer<typeof suppressProfilesSchema>;
export type UnsuppressProfilesInput = z.infer<typeof unsuppressProfilesSchema>;

export type ListListsInput = z.infer<typeof listListsSchema>;
export type GetListInput = z.infer<typeof getListSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type DeleteListInput = z.infer<typeof deleteListSchema>;
export type GetListProfilesInput = z.infer<typeof getListProfilesSchema>;
export type GetListTagsInput = z.infer<typeof getListTagsSchema>;
export type GetListFlowTriggersInput = z.infer<typeof getListFlowTriggersSchema>;
export type AddProfilesToListInput = z.infer<typeof addProfilesToListSchema>;
export type RemoveProfilesFromListInput = z.infer<typeof removeProfilesFromListSchema>;
