// Klaviyo API Types following JSON:API specification

// Base JSON:API types
export interface JsonApiResource<T extends string, A extends object> {
  type: T;
  id: string;
  attributes: A;
  links?: {
    self?: string;
  };
  relationships?: Record<string, JsonApiRelationship>;
}

export interface JsonApiRelationship {
  data: { type: string; id: string } | { type: string; id: string }[] | null;
  links?: {
    self?: string;
    related?: string;
  };
}

export interface JsonApiResponse<T> {
  data: T;
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
  included?: JsonApiResource<string, object>[];
}

export interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  meta?: Record<string, unknown>;
}

export interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

// Profile types
export interface ProfileAttributes {
  email?: string;
  phone_number?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  title?: string;
  image?: string;
  created?: string;
  updated?: string;
  last_event_date?: string;
  location?: {
    address1?: string;
    address2?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    region?: string;
    zip?: string;
    timezone?: string;
  };
  properties?: Record<string, unknown>;
}

export type Profile = JsonApiResource<'profile', ProfileAttributes>;

// List types
export interface ListAttributes {
  name: string;
  created?: string;
  updated?: string;
  opt_in_process?: string;
}

export type List = JsonApiResource<'list', ListAttributes>;

// Subscription types
export interface SubscriptionAttributes {
  list_id: string;
  subscriptions: {
    email?: {
      marketing?: {
        consent: 'SUBSCRIBED' | 'UNSUBSCRIBED';
      };
    };
    sms?: {
      marketing?: {
        consent: 'SUBSCRIBED' | 'UNSUBSCRIBED';
      };
    };
  };
}

// Suppression types
export interface SuppressionAttributes {
  profiles: {
    data: Array<{
      type: 'profile';
      attributes: {
        email?: string;
        phone_number?: string;
      };
    }>;
  };
}

// API Response types
export type ProfileResponse = JsonApiResponse<Profile>;
export type ProfileListResponse = JsonApiResponse<Profile[]>;
export type ListResponse = JsonApiResponse<List>;
export type ListListResponse = JsonApiResponse<List[]>;

// Input types for creating/updating
export interface CreateProfileInput {
  email?: string;
  phone_number?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  title?: string;
  image?: string;
  location?: ProfileAttributes['location'];
  properties?: Record<string, unknown>;
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {}

export interface CreateListInput {
  name: string;
}

export interface UpdateListInput {
  name: string;
}

// Bulk job types
export interface BulkJobResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      status: string;
      created_at: string;
      expires_at?: string;
      completed_at?: string;
    };
  };
}
