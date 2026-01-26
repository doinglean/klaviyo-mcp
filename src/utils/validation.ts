import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

// Profile schemas
export const listProfilesSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  updated_after: z.string().datetime().optional(),
  updated_before: z.string().datetime().optional(),
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
});

export const getProfileSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
});

export const createProfileSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  image: z.string().url().optional(),
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

export const updateProfileSchema = z.object({
  profile_id: z.string().min(1, 'Profile ID is required'),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  external_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  image: z.string().url().optional(),
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
});

export const subscribeProfilesSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
  profiles: z.array(z.object({
    email: z.string().email().optional(),
    phone_number: z.string().optional(),
  })).min(1, 'At least one profile is required'),
  email_consent: z.boolean().optional().default(true),
  sms_consent: z.boolean().optional().default(false),
});

export const suppressProfilesSchema = z.object({
  profiles: z.array(z.object({
    email: z.string().email().optional(),
    phone_number: z.string().optional(),
  }).refine(
    (data) => data.email || data.phone_number,
    { message: 'Each profile must have an email or phone_number' }
  )).min(1, 'At least one profile is required'),
});

// List schemas
// Note: Klaviyo's /lists endpoint does NOT support page[size], only page[cursor]
export const listListsSchema = z.object({
  page_cursor: z.string().optional(),
});

export const getListSchema = z.object({
  list_id: z.string().min(1, 'List ID is required'),
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
  page_size: z.number().min(1).max(100).optional().default(20),
  page_cursor: z.string().optional(),
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
export type SubscribeProfilesInput = z.infer<typeof subscribeProfilesSchema>;
export type SuppressProfilesInput = z.infer<typeof suppressProfilesSchema>;

export type ListListsInput = z.infer<typeof listListsSchema>;
export type GetListInput = z.infer<typeof getListSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type DeleteListInput = z.infer<typeof deleteListSchema>;
export type GetListProfilesInput = z.infer<typeof getListProfilesSchema>;
export type AddProfilesToListInput = z.infer<typeof addProfilesToListSchema>;
export type RemoveProfilesFromListInput = z.infer<typeof removeProfilesFromListSchema>;
