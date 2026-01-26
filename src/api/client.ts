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

  // ============================================================
  // CAMPAIGN METHODS
  // ============================================================

  private buildCampaignFilter(options: {
    name?: string;
    name_contains?: string;
    status?: string;
    channel?: string;
    archived?: boolean;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    scheduled_after?: string;
    scheduled_before?: string;
    filter?: string;
  }): string | undefined {
    if (options.filter) return options.filter;
    
    const filters: string[] = [];
    if (options.name) filters.push(`equals(name,"${options.name}")`);
    if (options.name_contains) filters.push(`contains(name,"${options.name_contains}")`);
    if (options.status) filters.push(`equals(status,"${options.status}")`);
    if (options.channel) filters.push(`equals(messages.channel,"${options.channel}")`);
    if (options.archived !== undefined) filters.push(`equals(archived,${options.archived})`);
    if (options.created_after) filters.push(`greater-than(created_at,${options.created_after})`);
    if (options.created_before) filters.push(`less-than(created_at,${options.created_before})`);
    if (options.updated_after) filters.push(`greater-than(updated_at,${options.updated_after})`);
    if (options.scheduled_after) filters.push(`greater-than(scheduled_at,${options.scheduled_after})`);
    if (options.scheduled_before) filters.push(`less-than(scheduled_at,${options.scheduled_before})`);
    
    if (filters.length === 0) return undefined;
    return filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
  }

  async listCampaigns(options: {
    name?: string;
    name_contains?: string;
    status?: string;
    channel?: string;
    archived?: boolean;
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    scheduled_after?: string;
    scheduled_before?: string;
    filter?: string;
    sort?: string;
    include?: string[];
    fields_campaign?: string[];
    fields_campaign_message?: string[];
    fields_tag?: string[];
    page_cursor?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
    };

    const filter = this.buildCampaignFilter(options);
    if (filter) params['filter'] = filter;
    if (options.sort) params['sort'] = options.sort;
    if (options.include?.length) params['include'] = options.include.join(',');
    if (options.fields_campaign?.length) params['fields[campaign]'] = options.fields_campaign.join(',');
    if (options.fields_campaign_message?.length) params['fields[campaign-message]'] = options.fields_campaign_message.join(',');
    if (options.fields_tag?.length) params['fields[tag]'] = options.fields_tag.join(',');

    return this.request<unknown>('/api/campaigns', { params });
  }

  async getCampaign(campaignId: string, options: {
    include?: string[];
    fields_campaign?: string[];
    fields_campaign_message?: string[];
    fields_tag?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.include?.length) params['include'] = options.include.join(',');
    if (options.fields_campaign?.length) params['fields[campaign]'] = options.fields_campaign.join(',');
    if (options.fields_campaign_message?.length) params['fields[campaign-message]'] = options.fields_campaign_message.join(',');
    if (options.fields_tag?.length) params['fields[tag]'] = options.fields_tag.join(',');

    return this.request<unknown>(`/api/campaigns/${campaignId}`, { params });
  }

  async createCampaign(options: {
    name: string;
    channel?: string;
    audiences: {
      included: string[];
      excluded?: string[];
    };
    message?: {
      label?: string;
      subject?: string;
      preview_text?: string;
      from_email?: string;
      from_label?: string;
      reply_to_email?: string;
      body?: string;
    };
    send_strategy?: {
      method?: string;
      datetime?: string;
      is_local?: boolean;
      throttle_percentage?: number;
    };
    tracking_options?: {
      is_tracking_opens?: boolean;
      is_tracking_clicks?: boolean;
      is_add_utm?: boolean;
      utm_params?: Array<{ name: string; value: string }>;
    };
  }): Promise<unknown> {
    const channel = options.channel || 'email';
    
    // Build audiences
    const audiences: Record<string, unknown> = {
      included: options.audiences.included.map(id => ({ type: 'list', id })),
    };
    if (options.audiences.excluded?.length) {
      audiences.excluded = options.audiences.excluded.map(id => ({ type: 'list', id }));
    }

    // Build send strategy
    let sendStrategy: Record<string, unknown> | undefined;
    if (options.send_strategy) {
      const method = options.send_strategy.method || 'immediate';
      if (method === 'static') {
        sendStrategy = {
          method: 'static',
          options_static: {
            datetime: options.send_strategy.datetime,
            is_local: options.send_strategy.is_local || false,
          },
        };
      } else if (method === 'throttled') {
        sendStrategy = {
          method: 'throttled',
          options_throttled: {
            datetime: options.send_strategy.datetime,
            throttle_percentage: options.send_strategy.throttle_percentage || 10,
          },
        };
      } else if (method === 'smart_send_time') {
        sendStrategy = { method: 'smart_send_time' };
      } else {
        sendStrategy = { method: 'immediate' };
      }
    }

    // Build campaign message
    const messageContent: Record<string, unknown> = {};
    if (options.message) {
      if (channel === 'email') {
        messageContent.content = {
          subject: options.message.subject || '',
          preview_text: options.message.preview_text || '',
          from_email: options.message.from_email || '',
          from_label: options.message.from_label || '',
          reply_to_email: options.message.reply_to_email,
        };
      } else {
        messageContent.content = {
          body: options.message.body || '',
        };
      }
      if (options.message.label) {
        messageContent.label = options.message.label;
      }
    }

    const campaignMessages = [{
      type: 'campaign-message',
      attributes: {
        channel,
        ...messageContent,
      },
    }];

    const body = {
      data: {
        type: 'campaign',
        attributes: {
          name: options.name,
          audiences,
          send_strategy: sendStrategy,
          tracking_options: options.tracking_options,
          'campaign-messages': { data: campaignMessages },
        },
      },
    };

    return this.request<unknown>('/api/campaigns', { method: 'POST', body });
  }

  async updateCampaign(campaignId: string, options: {
    name?: string;
    audiences?: {
      included?: string[];
      excluded?: string[];
    };
    send_strategy?: {
      method?: string;
      datetime?: string;
      is_local?: boolean;
      throttle_percentage?: number;
    };
    tracking_options?: {
      is_tracking_opens?: boolean;
      is_tracking_clicks?: boolean;
      is_add_utm?: boolean;
    };
  }): Promise<unknown> {
    const attributes: Record<string, unknown> = {};
    
    if (options.name) attributes.name = options.name;
    
    if (options.audiences) {
      const audiences: Record<string, unknown> = {};
      if (options.audiences.included) {
        audiences.included = options.audiences.included.map(id => ({ type: 'list', id }));
      }
      if (options.audiences.excluded) {
        audiences.excluded = options.audiences.excluded.map(id => ({ type: 'list', id }));
      }
      attributes.audiences = audiences;
    }
    
    if (options.send_strategy) {
      const method = options.send_strategy.method || 'immediate';
      if (method === 'static') {
        attributes.send_strategy = {
          method: 'static',
          options_static: {
            datetime: options.send_strategy.datetime,
            is_local: options.send_strategy.is_local || false,
          },
        };
      } else if (method === 'throttled') {
        attributes.send_strategy = {
          method: 'throttled',
          options_throttled: {
            datetime: options.send_strategy.datetime,
            throttle_percentage: options.send_strategy.throttle_percentage || 10,
          },
        };
      } else {
        attributes.send_strategy = { method };
      }
    }
    
    if (options.tracking_options) {
      attributes.tracking_options = options.tracking_options;
    }

    const body = {
      data: {
        type: 'campaign',
        id: campaignId,
        attributes,
      },
    };

    return this.request<unknown>(`/api/campaigns/${campaignId}`, { method: 'PATCH', body });
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.request<void>(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
  }

  async cloneCampaign(campaignId: string, newName?: string): Promise<unknown> {
    const attributes: Record<string, unknown> = {};
    if (newName) attributes.name = newName;

    const body = {
      data: {
        type: 'campaign',
        id: campaignId,
        attributes,
      },
    };

    return this.request<unknown>('/api/campaign-clone', { method: 'POST', body });
  }

  async sendCampaign(campaignId: string): Promise<unknown> {
    const body = {
      data: {
        type: 'campaign-send-job',
        attributes: {},
        relationships: {
          campaign: {
            data: { type: 'campaign', id: campaignId },
          },
        },
      },
    };

    return this.request<unknown>('/api/campaign-send-jobs', { method: 'POST', body });
  }

  async cancelCampaignSend(sendJobId: string): Promise<unknown> {
    const body = {
      data: {
        type: 'campaign-send-job',
        id: sendJobId,
        attributes: {
          status: 'cancelled',
        },
      },
    };

    return this.request<unknown>(`/api/campaign-send-jobs/${sendJobId}`, { method: 'PATCH', body });
  }

  async getCampaignSendJob(sendJobId: string): Promise<unknown> {
    return this.request<unknown>(`/api/campaign-send-jobs/${sendJobId}`);
  }

  async estimateCampaignRecipients(campaignId: string): Promise<unknown> {
    const body = {
      data: {
        type: 'campaign-recipient-estimation-job',
        attributes: {},
        relationships: {
          campaign: {
            data: { type: 'campaign', id: campaignId },
          },
        },
      },
    };

    return this.request<unknown>('/api/campaign-recipient-estimation-jobs', { method: 'POST', body });
  }

  async getRecipientEstimationJob(jobId: string): Promise<unknown> {
    return this.request<unknown>(`/api/campaign-recipient-estimation-jobs/${jobId}`);
  }

  async getRecipientEstimation(estimationId: string): Promise<unknown> {
    return this.request<unknown>(`/api/campaign-recipient-estimations/${estimationId}`);
  }

  async getCampaignMessage(messageId: string, options: {
    include?: string[];
    fields_campaign_message?: string[];
    fields_campaign?: string[];
    fields_template?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.include?.length) params['include'] = options.include.join(',');
    if (options.fields_campaign_message?.length) params['fields[campaign-message]'] = options.fields_campaign_message.join(',');
    if (options.fields_campaign?.length) params['fields[campaign]'] = options.fields_campaign.join(',');
    if (options.fields_template?.length) params['fields[template]'] = options.fields_template.join(',');

    return this.request<unknown>(`/api/campaign-messages/${messageId}`, { params });
  }

  async updateCampaignMessage(messageId: string, content: {
    label?: string;
    subject?: string;
    preview_text?: string;
    from_email?: string;
    from_label?: string;
    reply_to_email?: string;
    body?: string;
  }): Promise<unknown> {
    const contentAttrs: Record<string, unknown> = {};
    if (content.subject) contentAttrs.subject = content.subject;
    if (content.preview_text) contentAttrs.preview_text = content.preview_text;
    if (content.from_email) contentAttrs.from_email = content.from_email;
    if (content.from_label) contentAttrs.from_label = content.from_label;
    if (content.reply_to_email) contentAttrs.reply_to_email = content.reply_to_email;
    if (content.body) contentAttrs.body = content.body;

    const attributes: Record<string, unknown> = {};
    if (content.label) attributes.label = content.label;
    if (Object.keys(contentAttrs).length > 0) attributes.content = contentAttrs;

    const body = {
      data: {
        type: 'campaign-message',
        id: messageId,
        attributes,
      },
    };

    return this.request<unknown>(`/api/campaign-messages/${messageId}`, { method: 'PATCH', body });
  }

  async assignTemplateToMessage(messageId: string, templateId: string): Promise<unknown> {
    const body = {
      data: {
        type: 'campaign-message',
        id: messageId,
        relationships: {
          template: {
            data: { type: 'template', id: templateId },
          },
        },
      },
    };

    return this.request<unknown>('/api/campaign-message-assign-template', { method: 'POST', body });
  }

  async getCampaignMessages(campaignId: string, options: {
    fields_campaign_message?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_campaign_message?.length) {
      params['fields[campaign-message]'] = options.fields_campaign_message.join(',');
    }
    return this.request<unknown>(`/api/campaigns/${campaignId}/campaign-messages`, { params });
  }

  async getCampaignTags(campaignId: string, options: {
    fields_tag?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_tag?.length) params['fields[tag]'] = options.fields_tag.join(',');
    return this.request<unknown>(`/api/campaigns/${campaignId}/tags`, { params });
  }

  async createCampaignValuesReport(options: {
    campaign_id: string;
    statistics?: string[];
    timeframe?: { start?: string; end?: string };
  }): Promise<unknown> {
    const body = {
      data: {
        type: 'campaign-values-report',
        attributes: {
          statistics: options.statistics || ['opens', 'clicks', 'recipients', 'bounces'],
          timeframe: options.timeframe,
        },
        relationships: {
          campaign: {
            data: { type: 'campaign', id: options.campaign_id },
          },
        },
      },
    };

    return this.request<unknown>('/api/campaign-values-reports', { method: 'POST', body });
  }

  // ============================================================
  // EVENT METHODS
  // ============================================================

  private buildEventFilter(options: {
    profile_id?: string;
    metric_id?: string;
    datetime_after?: string;
    datetime_before?: string;
    filter?: string;
  }): string | undefined {
    if (options.filter) return options.filter;

    const filters: string[] = [];
    if (options.profile_id) filters.push(`equals(profile_id,"${options.profile_id}")`);
    if (options.metric_id) filters.push(`equals(metric_id,"${options.metric_id}")`);
    if (options.datetime_after) filters.push(`greater-than(datetime,${options.datetime_after})`);
    if (options.datetime_before) filters.push(`less-than(datetime,${options.datetime_before})`);

    if (filters.length === 0) return undefined;
    return filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
  }

  async listEvents(options: {
    profile_id?: string;
    metric_id?: string;
    datetime_after?: string;
    datetime_before?: string;
    filter?: string;
    sort?: string;
    include?: string[];
    fields_event?: string[];
    fields_metric?: string[];
    fields_profile?: string[];
    page_cursor?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
    };

    const filter = this.buildEventFilter(options);
    if (filter) params['filter'] = filter;
    if (options.sort) params['sort'] = options.sort;
    if (options.include?.length) params['include'] = options.include.join(',');
    if (options.fields_event?.length) params['fields[event]'] = options.fields_event.join(',');
    if (options.fields_metric?.length) params['fields[metric]'] = options.fields_metric.join(',');
    if (options.fields_profile?.length) params['fields[profile]'] = options.fields_profile.join(',');

    return this.request<unknown>('/api/events', { params });
  }

  async getEvent(eventId: string, options: {
    include?: string[];
    fields_event?: string[];
    fields_metric?: string[];
    fields_profile?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.include?.length) params['include'] = options.include.join(',');
    if (options.fields_event?.length) params['fields[event]'] = options.fields_event.join(',');
    if (options.fields_metric?.length) params['fields[metric]'] = options.fields_metric.join(',');
    if (options.fields_profile?.length) params['fields[profile]'] = options.fields_profile.join(',');

    return this.request<unknown>(`/api/events/${eventId}`, { params });
  }

  async createEvent(options: {
    metric_name: string;
    profile: {
      email?: string;
      phone_number?: string;
      external_id?: string;
      first_name?: string;
      last_name?: string;
      properties?: Record<string, unknown>;
    };
    properties: Record<string, unknown>;
    time?: string;
    value?: number;
    value_currency?: string;
    unique_id?: string;
  }): Promise<unknown> {
    const profileAttrs: Record<string, unknown> = {};
    if (options.profile.email) profileAttrs.email = options.profile.email;
    if (options.profile.phone_number) profileAttrs.phone_number = options.profile.phone_number;
    if (options.profile.external_id) profileAttrs.external_id = options.profile.external_id;
    if (options.profile.first_name) profileAttrs.first_name = options.profile.first_name;
    if (options.profile.last_name) profileAttrs.last_name = options.profile.last_name;
    if (options.profile.properties) profileAttrs.properties = options.profile.properties;

    const attributes: Record<string, unknown> = {
      properties: options.properties,
      metric: {
        data: {
          type: 'metric',
          attributes: { name: options.metric_name },
        },
      },
      profile: {
        data: {
          type: 'profile',
          attributes: profileAttrs,
        },
      },
    };

    if (options.time) attributes.time = options.time;
    if (options.value !== undefined) attributes.value = options.value;
    if (options.value_currency) attributes.value_currency = options.value_currency;
    if (options.unique_id) attributes.unique_id = options.unique_id;

    const body = {
      data: {
        type: 'event',
        attributes,
      },
    };

    return this.request<unknown>('/api/events', { method: 'POST', body });
  }

  async bulkCreateEvents(events: Array<{
    metric_name: string;
    profile: {
      email?: string;
      phone_number?: string;
      external_id?: string;
    };
    properties: Record<string, unknown>;
    time?: string;
    value?: number;
    value_currency?: string;
    unique_id?: string;
  }>): Promise<unknown> {
    const eventData = events.map(event => {
      const profileAttrs: Record<string, unknown> = {};
      if (event.profile.email) profileAttrs.email = event.profile.email;
      if (event.profile.phone_number) profileAttrs.phone_number = event.profile.phone_number;
      if (event.profile.external_id) profileAttrs.external_id = event.profile.external_id;

      const attrs: Record<string, unknown> = {
        properties: event.properties,
        metric: {
          data: {
            type: 'metric',
            attributes: { name: event.metric_name },
          },
        },
        profile: {
          data: {
            type: 'profile',
            attributes: profileAttrs,
          },
        },
      };

      if (event.time) attrs.time = event.time;
      if (event.value !== undefined) attrs.value = event.value;
      if (event.value_currency) attrs.value_currency = event.value_currency;
      if (event.unique_id) attrs.unique_id = event.unique_id;

      return {
        type: 'event-bulk-create-job',
        attributes: attrs,
      };
    });

    const body = {
      data: {
        type: 'event-bulk-create-job',
        attributes: {
          events: { data: eventData },
        },
      },
    };

    return this.request<unknown>('/api/event-bulk-create-jobs', { method: 'POST', body });
  }

  async getEventMetric(eventId: string, options: {
    fields_metric?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_metric?.length) params['fields[metric]'] = options.fields_metric.join(',');
    return this.request<unknown>(`/api/events/${eventId}/metric`, { params });
  }

  async getEventProfile(eventId: string, options: {
    additional_fields?: string[];
    fields_profile?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.additional_fields?.length) params['additional-fields[profile]'] = options.additional_fields.join(',');
    if (options.fields_profile?.length) params['fields[profile]'] = options.fields_profile.join(',');
    return this.request<unknown>(`/api/events/${eventId}/profile`, { params });
  }

  // ============================================================
  // METRIC METHODS
  // ============================================================

  private buildMetricFilter(options: {
    name?: string;
    name_contains?: string;
    integration_name?: string;
    integration_category?: string;
    filter?: string;
  }): string | undefined {
    if (options.filter) return options.filter;

    const filters: string[] = [];
    if (options.name) filters.push(`equals(name,"${options.name}")`);
    if (options.name_contains) filters.push(`contains(name,"${options.name_contains}")`);
    if (options.integration_name) filters.push(`equals(integration.name,"${options.integration_name}")`);
    if (options.integration_category) filters.push(`equals(integration.category,"${options.integration_category}")`);

    if (filters.length === 0) return undefined;
    return filters.length === 1 ? filters[0] : `and(${filters.join(',')})`;
  }

  async listMetrics(options: {
    name?: string;
    name_contains?: string;
    integration_name?: string;
    integration_category?: string;
    filter?: string;
    fields_metric?: string[];
    page_cursor?: string;
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {
      'page[cursor]': options.page_cursor,
    };

    const filter = this.buildMetricFilter(options);
    if (filter) params['filter'] = filter;
    if (options.fields_metric?.length) params['fields[metric]'] = options.fields_metric.join(',');

    return this.request<unknown>('/api/metrics', { params });
  }

  async getMetric(metricId: string, options: {
    fields_metric?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_metric?.length) params['fields[metric]'] = options.fields_metric.join(',');
    return this.request<unknown>(`/api/metrics/${metricId}`, { params });
  }

  async queryMetricAggregate(options: {
    metric_id: string;
    measurements: string[];
    filter?: string[];
    interval?: string;
    by?: string[];
    timezone?: string;
    page_size?: number;
    page_cursor?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<unknown> {
    // Build filter array
    let filterArray = options.filter || [];
    
    // Add date filters if provided
    if (options.start_date) {
      filterArray = [...filterArray, `greater-or-equal(datetime,${options.start_date})`];
    }
    if (options.end_date) {
      filterArray = [...filterArray, `less-than(datetime,${options.end_date})`];
    }

    const attributes: Record<string, unknown> = {
      metric_id: options.metric_id,
      measurements: options.measurements,
    };

    if (filterArray.length > 0) attributes.filter = filterArray;
    if (options.interval) attributes.interval = options.interval;
    if (options.by?.length) attributes.by = options.by;
    if (options.timezone) attributes.timezone = options.timezone;
    if (options.page_size) attributes.page_size = options.page_size;
    if (options.page_cursor) attributes.page_cursor = options.page_cursor;

    const body = {
      data: {
        type: 'metric-aggregate',
        attributes,
      },
    };

    return this.request<unknown>('/api/metric-aggregates', { method: 'POST', body });
  }

  async getMetricFlowTriggers(metricId: string, options: {
    fields_flow?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_flow?.length) params['fields[flow]'] = options.fields_flow.join(',');
    return this.request<unknown>(`/api/metrics/${metricId}/flow-triggers`, { params });
  }

  async getMetricProperties(metricId: string): Promise<unknown> {
    return this.request<unknown>(`/api/metrics/${metricId}/metric-properties`);
  }

  async getMetricProperty(propertyId: string, options: {
    fields_metric_property?: string[];
  } = {}): Promise<unknown> {
    const params: Record<string, string | number | undefined> = {};
    if (options.fields_metric_property?.length) {
      params['fields[metric-property]'] = options.fields_metric_property.join(',');
    }
    return this.request<unknown>(`/api/metric-properties/${propertyId}`, { params });
  }
}
