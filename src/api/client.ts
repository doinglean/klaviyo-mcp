import type {
  Profile,
  ProfileListResponse,
  ProfileResponse,
  List,
  ListListResponse,
  ListResponse,
  BulkJobResponse,
  JsonApiErrorResponse,
  CreateProfileInput,
  UpdateProfileInput,
} from '../types/klaviyo.js';

// Error classes
export class KlaviyoError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: JsonApiErrorResponse['errors']
  ) {
    super(message);
    this.name = 'KlaviyoError';
  }
}

export class KlaviyoAuthError extends KlaviyoError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'KlaviyoAuthError';
  }
}

export class KlaviyoNotFoundError extends KlaviyoError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'KlaviyoNotFoundError';
  }
}

export class KlaviyoRateLimitError extends KlaviyoError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'KlaviyoRateLimitError';
  }
}

export class KlaviyoValidationError extends KlaviyoError {
  constructor(message: string, errors?: JsonApiErrorResponse['errors']) {
    super(message, 400, errors);
    this.name = 'KlaviyoValidationError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export class KlaviyoClient {
  private apiKey: string;
  private baseUrl = 'https://a.klaviyo.com';
  private revision: string;
  private timeout: number;

  constructor(apiKey: string, options?: { revision?: string; timeout?: number }) {
    if (!apiKey) {
      throw new KlaviyoAuthError('API key is required');
    }
    if (!apiKey.startsWith('pk_')) {
      throw new KlaviyoAuthError('Invalid API key format - must start with "pk_"');
    }
    this.apiKey = apiKey;
    this.revision = options?.revision ?? '2025-01-15';
    this.timeout = options?.timeout ?? 30000;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        // Skip undefined, null, and empty strings
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': this.revision,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KlaviyoError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new KlaviyoError('Request timeout', 408);
      }
      throw new KlaviyoError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: JsonApiErrorResponse | undefined;
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    try {
      errorData = await response.json() as JsonApiErrorResponse;
      if (errorData.errors?.length) {
        errorMessage = errorData.errors.map(e => e.detail || e.title || 'Unknown error').join('; ');
      }
    } catch {
      // Failed to parse error response
    }

    switch (response.status) {
      case 401:
      case 403:
        throw new KlaviyoAuthError(errorMessage);
      case 404:
        throw new KlaviyoNotFoundError(errorMessage);
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new KlaviyoRateLimitError(
          errorMessage,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      case 400:
      case 422:
        throw new KlaviyoValidationError(errorMessage, errorData?.errors);
      default:
        throw new KlaviyoError(errorMessage, response.status, errorData?.errors);
    }
  }

  // Helper to build filter string
  private buildProfileFilter(options: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    id?: string;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    filter?: string;
  }): string | undefined {
    // If raw filter provided, use it directly
    if (options.filter) {
      return options.filter;
    }

    const filters: string[] = [];
    if (options.email) {
      filters.push(`equals(email,"${options.email}")`);
    }
    if (options.phone_number) {
      filters.push(`equals(phone_number,"${options.phone_number}")`);
    }
    if (options.external_id) {
      filters.push(`equals(external_id,"${options.external_id}")`);
    }
    if (options.id) {
      filters.push(`equals(id,"${options.id}")`);
    }
    if (options.created_after) {
      filters.push(`greater-than(created,${options.created_after})`);
    }
    if (options.created_before) {
      filters.push(`less-than(created,${options.created_before})`);
    }
    if (options.updated_after) {
      filters.push(`greater-than(updated,${options.updated_after})`);
    }
    if (options.updated_before) {
      filters.push(`less-than(updated,${options.updated_before})`);
    }

    if (filters.length === 0) return undefined;
    return filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
  }

  // Profile methods
  async listProfiles(options: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    id?: string;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    filter?: string;
    sort?: string;
    additional_fields?: string[];
    fields_profile?: string[];
    page_size?: number;
    page_cursor?: string;
  } = {}): Promise<ProfileListResponse> {
    const params: Record<string, string | number | undefined> = {
      'page[size]': options.page_size,
      'page[cursor]': options.page_cursor,
    };

    // Build filter
    const filter = this.buildProfileFilter(options);
    if (filter) {
      params['filter'] = filter;
    }

    // Sort
    if (options.sort) {
      params['sort'] = options.sort;
    }

    // Additional fields
    if (options.additional_fields?.length) {
      params['additional-fields[profile]'] = options.additional_fields.join(',');
    }

    // Sparse fieldsets
    if (options.fields_profile?.length) {
      params['fields[profile]'] = options.fields_profile.join(',');
    }

    return this.request<ProfileListResponse>('/api/profiles', { params });
  }

  async getProfile(profileId: string, options: {
    additional_fields?: string[];
    include?: string[];
    fields_profile?: string[];
    fields_list?: string[];
    fields_segment?: string[];
  } = {}): Promise<ProfileResponse> {
    const params: Record<string, string | number | undefined> = {};

    if (options.additional_fields?.length) {
      params['additional-fields[profile]'] = options.additional_fields.join(',');
    }
    if (options.include?.length) {
      params['include'] = options.include.join(',');
    }
    if (options.fields_profile?.length) {
      params['fields[profile]'] = options.fields_profile.join(',');
    }
    if (options.fields_list?.length) {
      params['fields[list]'] = options.fields_list.join(',');
    }
    if (options.fields_segment?.length) {
      params['fields[segment]'] = options.fields_segment.join(',');
    }

    return this.request<ProfileResponse>(`/api/profiles/${profileId}`, { params });
  }

  async createProfile(
    input: CreateProfileInput,
    options: { additional_fields?: string[] } = {}
  ): Promise<ProfileResponse> {
    const body = {
      data: {
        type: 'profile',
        attributes: input,
      },
    };

    const params: Record<string, string | number | undefined> = {};
    if (options.additional_fields?.length) {
      params['additional-fields[profile]'] = options.additional_fields.join(',');
    }

    return this.request<ProfileResponse>('/api/profiles', { method: 'POST', body, params });
  }

  async updateProfile(
    profileId: string,
    input: UpdateProfileInput,
    options: { additional_fields?: string[] } = {}
  ): Promise<ProfileResponse> {
    const body = {
      data: {
        type: 'profile',
        id: profileId,
        attributes: input,
      },
    };

    const params: Record<string, string | number | undefined> = {};
    if (options.additional_fields?.length) {
      params['additional-fields[profile]'] = options.additional_fields.join(',');
    }

    return this.request<ProfileResponse>(`/api/profiles/${profileId}`, { method: 'PATCH', body, params });
  }

  async upsertProfile(input: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    title?: string;
    image?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
      timezone?: string;
    };
    properties?: Record<string, unknown>;
  }): Promise<ProfileResponse> {
    const body = {
      data: {
        type: 'profile',
        attributes: input,
      },
    };
    return this.request<ProfileResponse>('/api/profile-import', { method: 'POST', body });
  }

  async mergeProfiles(sourceProfileId: string, destinationProfileId: string): Promise<ProfileResponse> {
    const body = {
      data: {
        type: 'profile-merge',
        id: sourceProfileId,
        relationships: {
          profile: {
            data: {
              type: 'profile',
              id: destinationProfileId,
            },
          },
        },
      },
    };
    return this.request<ProfileResponse>('/api/profile-merge', { method: 'POST', body });
  }

  async getProfileLists(profileId: string, options: {
    fields_list?: string[];
  } = {}): Promise<ListListResponse> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_list?.length) {
      params['fields[list]'] = options.fields_list.join(',');
    }
    return this.request<ListListResponse>(`/api/profiles/${profileId}/lists`, { params });
  }

  async getProfileSegments(profileId: string, options: {
    fields_segment?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_segment?.length) {
      params['fields[segment]'] = options.fields_segment.join(',');
    }
    return this.request<unknown>(`/api/profiles/${profileId}/segments`, { params });
  }

  async subscribeProfiles(options: {
    listId: string;
    profiles: Array<{ email?: string; phone_number?: string }>;
    emailConsent?: boolean;
    smsConsent?: boolean;
  }): Promise<BulkJobResponse> {
    const subscriptions: Record<string, unknown> = {};

    if (options.emailConsent !== false) {
      subscriptions.email = { marketing: { consent: 'SUBSCRIBED' } };
    }
    if (options.smsConsent) {
      subscriptions.sms = { marketing: { consent: 'SUBSCRIBED' } };
    }

    const body = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: options.profiles.map(p => ({
              type: 'profile',
              attributes: {
                email: p.email,
                phone_number: p.phone_number,
                subscriptions,
              },
            })),
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: options.listId,
            },
          },
        },
      },
    };

    return this.request<BulkJobResponse>('/api/profile-subscription-bulk-create-jobs', {
      method: 'POST',
      body,
    });
  }

  async unsubscribeProfiles(options: {
    listId: string;
    profiles: Array<{ email?: string; phone_number?: string }>;
    emailUnsubscribe?: boolean;
    smsUnsubscribe?: boolean;
  }): Promise<BulkJobResponse> {
    const unsubscriptions: Record<string, unknown> = {};

    if (options.emailUnsubscribe !== false) {
      unsubscriptions.email = { marketing: { consent: 'UNSUBSCRIBED' } };
    }
    if (options.smsUnsubscribe) {
      unsubscriptions.sms = { marketing: { consent: 'UNSUBSCRIBED' } };
    }

    const body = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: options.profiles.map(p => ({
              type: 'profile',
              attributes: {
                email: p.email,
                phone_number: p.phone_number,
              },
            })),
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: options.listId,
            },
          },
        },
      },
    };

    return this.request<BulkJobResponse>('/api/profile-subscription-bulk-delete-jobs', {
      method: 'POST',
      body,
    });
  }

  async suppressProfiles(profiles: Array<{ email?: string; phone_number?: string }>): Promise<BulkJobResponse> {
    const body = {
      data: {
        type: 'profile-suppression-bulk-create-job',
        attributes: {
          profiles: {
            data: profiles.map(p => ({
              type: 'profile',
              attributes: {
                email: p.email,
                phone_number: p.phone_number,
              },
            })),
          },
        },
      },
    };

    return this.request<BulkJobResponse>('/api/profile-suppression-bulk-create-jobs', {
      method: 'POST',
      body,
    });
  }

  async unsuppressProfiles(profiles: Array<{ email?: string; phone_number?: string }>): Promise<BulkJobResponse> {
    const body = {
      data: {
        type: 'profile-suppression-bulk-delete-job',
        attributes: {
          profiles: {
            data: profiles.map(p => ({
              type: 'profile',
              attributes: {
                email: p.email,
                phone_number: p.phone_number,
              },
            })),
          },
        },
      },
    };

    return this.request<BulkJobResponse>('/api/profile-suppression-bulk-delete-jobs', {
      method: 'POST',
      body,
    });
  }

  // List methods
  async listLists(options: {
    name?: string;
    name_contains?: string;
    id?: string;
    created_after?: string;
    updated_after?: string;
    filter?: string;
    sort?: string;
    include?: string[];
    fields_list?: string[];
    fields_flow?: string[];
    fields_tag?: string[];
    page_cursor?: string;
  } = {}): Promise<ListListResponse> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
    };

    // Build filter
    if (options.filter) {
      params['filter'] = options.filter;
    } else {
      const filters: string[] = [];
      if (options.name) {
        filters.push(`equals(name,"${options.name}")`);
      }
      if (options.name_contains) {
        filters.push(`any(name,["${options.name_contains}"])`);
      }
      if (options.id) {
        filters.push(`equals(id,"${options.id}")`);
      }
      if (options.created_after) {
        filters.push(`greater-than(created,${options.created_after})`);
      }
      if (options.updated_after) {
        filters.push(`greater-than(updated,${options.updated_after})`);
      }
      if (filters.length > 0) {
        params['filter'] = filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
      }
    }

    // Sort
    if (options.sort) {
      params['sort'] = options.sort;
    }

    // Include
    if (options.include?.length) {
      params['include'] = options.include.join(',');
    }

    // Sparse fieldsets
    if (options.fields_list?.length) {
      params['fields[list]'] = options.fields_list.join(',');
    }
    if (options.fields_flow?.length) {
      params['fields[flow]'] = options.fields_flow.join(',');
    }
    if (options.fields_tag?.length) {
      params['fields[tag]'] = options.fields_tag.join(',');
    }

    return this.request<ListListResponse>('/api/lists', { params });
  }

  async getList(listId: string, options: {
    include_profile_count?: boolean;
    include?: string[];
    fields_list?: string[];
    fields_flow?: string[];
    fields_tag?: string[];
  } = {}): Promise<ListResponse> {
    const params: Record<string, string | number | undefined> = {};

    if (options.include_profile_count !== false) {
      params['additional-fields[list]'] = 'profile_count';
    }
    if (options.include?.length) {
      params['include'] = options.include.join(',');
    }
    if (options.fields_list?.length) {
      params['fields[list]'] = options.fields_list.join(',');
    }
    if (options.fields_flow?.length) {
      params['fields[flow]'] = options.fields_flow.join(',');
    }
    if (options.fields_tag?.length) {
      params['fields[tag]'] = options.fields_tag.join(',');
    }

    return this.request<ListResponse>(`/api/lists/${listId}`, { params });
  }

  async createList(name: string): Promise<ListResponse> {
    const body = {
      data: {
        type: 'list',
        attributes: { name },
      },
    };
    return this.request<ListResponse>('/api/lists', { method: 'POST', body });
  }

  async updateList(listId: string, name: string): Promise<ListResponse> {
    const body = {
      data: {
        type: 'list',
        id: listId,
        attributes: { name },
      },
    };
    return this.request<ListResponse>(`/api/lists/${listId}`, { method: 'PATCH', body });
  }

  async deleteList(listId: string): Promise<void> {
    await this.request<void>(`/api/lists/${listId}`, { method: 'DELETE' });
  }

  async getListProfiles(
    listId: string,
    options: {
      email?: string;
      phone_number?: string;
      joined_after?: string;
      joined_before?: string;
      filter?: string;
      sort?: string;
      additional_fields?: string[];
      fields_profile?: string[];
      page_size?: number;
      page_cursor?: string;
    } = {}
  ): Promise<ProfileListResponse> {
    const params: Record<string, string | number | undefined> = {
      'page[size]': options.page_size,
      'page[cursor]': options.page_cursor,
    };

    // Build filter
    if (options.filter) {
      params['filter'] = options.filter;
    } else {
      const filters: string[] = [];
      if (options.email) {
        filters.push(`equals(email,"${options.email}")`);
      }
      if (options.phone_number) {
        filters.push(`equals(phone_number,"${options.phone_number}")`);
      }
      if (options.joined_after) {
        filters.push(`greater-than(joined_group_at,${options.joined_after})`);
      }
      if (options.joined_before) {
        filters.push(`less-than(joined_group_at,${options.joined_before})`);
      }
      if (filters.length > 0) {
        params['filter'] = filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
      }
    }

    // Sort
    if (options.sort) {
      params['sort'] = options.sort;
    }

    // Additional fields
    if (options.additional_fields?.length) {
      params['additional-fields[profile]'] = options.additional_fields.join(',');
    }

    // Sparse fieldsets
    if (options.fields_profile?.length) {
      params['fields[profile]'] = options.fields_profile.join(',');
    }

    return this.request<ProfileListResponse>(`/api/lists/${listId}/profiles`, { params });
  }

  async getListTags(listId: string, options: {
    fields_tag?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_tag?.length) {
      params['fields[tag]'] = options.fields_tag.join(',');
    }
    return this.request<unknown>(`/api/lists/${listId}/tags`, { params });
  }

  async getListFlowTriggers(listId: string, options: {
    fields_flow?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_flow?.length) {
      params['fields[flow]'] = options.fields_flow.join(',');
    }
    return this.request<unknown>(`/api/lists/${listId}/flow-triggers`, { params });
  }

  async addProfilesToList(listId: string, profileIds: string[]): Promise<void> {
    const body = {
      data: profileIds.map(id => ({ type: 'profile', id })),
    };
    await this.request<void>(`/api/lists/${listId}/relationships/profiles`, {
      method: 'POST',
      body,
    });
  }

  async removeProfilesFromList(listId: string, profileIds: string[]): Promise<void> {
    const body = {
      data: profileIds.map(id => ({ type: 'profile', id })),
    };
    await this.request<void>(`/api/lists/${listId}/relationships/profiles`, {
      method: 'DELETE',
      body,
    });
  }

  // Bulk Import Jobs
  async createBulkImportJob(options: {
    profiles: Array<{
      email?: string;
      phone_number?: string;
      external_id?: string;
      first_name?: string;
      last_name?: string;
      properties?: Record<string, unknown>;
    }>;
    list_ids?: string[];
  }): Promise<BulkJobResponse> {
    const body: Record<string, unknown> = {
      data: {
        type: 'profile-bulk-import-job',
        attributes: {
          profiles: {
            data: options.profiles.map(p => ({
              type: 'profile',
              attributes: p,
            })),
          },
        },
      },
    };
    
    if (options.list_ids?.length) {
      (body.data as Record<string, unknown>).relationships = {
        lists: {
          data: options.list_ids.map(id => ({ type: 'list', id })),
        },
      };
    }

    return this.request<BulkJobResponse>('/api/profile-bulk-import-jobs', {
      method: 'POST',
      body,
    });
  }

  async getBulkImportJobs(options: {
    page_cursor?: string;
    filter?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
      filter: options.filter,
    };
    return this.request<unknown>('/api/profile-bulk-import-jobs', { params });
  }

  async getBulkImportJob(jobId: string): Promise<BulkJobResponse> {
    return this.request<BulkJobResponse>(`/api/profile-bulk-import-jobs/${jobId}`);
  }

  // Suppression Job Status
  async getSuppressionCreateJobs(options: {
    page_cursor?: string;
    filter?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
      filter: options.filter,
    };
    return this.request<unknown>('/api/profile-suppression-bulk-create-jobs', { params });
  }

  async getSuppressionCreateJob(jobId: string): Promise<BulkJobResponse> {
    return this.request<BulkJobResponse>(`/api/profile-suppression-bulk-create-jobs/${jobId}`);
  }

  async getSuppressionDeleteJobs(options: {
    page_cursor?: string;
    filter?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
      filter: options.filter,
    };
    return this.request<unknown>('/api/profile-suppression-bulk-delete-jobs', { params });
  }

  async getSuppressionDeleteJob(jobId: string): Promise<BulkJobResponse> {
    return this.request<BulkJobResponse>(`/api/profile-suppression-bulk-delete-jobs/${jobId}`);
  }
}
