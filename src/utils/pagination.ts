/**
 * Auto-pagination utilities for Klaviyo MCP
 * 
 * Fetches all pages automatically so AI agents don't have to manually paginate.
 * Supports compact mode for smaller responses.
 */

export interface PaginatedResponse<T = unknown> {
  data: T[];
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
  included?: unknown[];
}

export interface AutoPaginatedResponse<T = unknown> {
  data: T[];
  included?: unknown[];
  meta: {
    total: number;
    fetched: number;
    truncated: boolean;
    compact: boolean;
  };
  _hint?: string;
}

export interface PaginationOptions {
  /** Fetch all pages automatically (default: true) */
  fetch_all?: boolean;
  /** Maximum results to return (default: 500, safety limit) */
  max_results?: number;
  /** Return only essential fields (default: true) */
  compact?: boolean;
  /** Fields to keep in compact mode */
  compactFields?: string[];
  /** Hint for getting full details */
  detailHint?: string;
}

const DEFAULT_MAX_RESULTS = 500;

/**
 * Extracts cursor from a Klaviyo next link URL
 */
function extractCursor(nextUrl: string): string | null {
  try {
    const url = new URL(nextUrl);
    return url.searchParams.get('page[cursor]');
  } catch {
    return null;
  }
}

/**
 * Compacts a data item to only include specified fields
 */
function compactItem<T extends { id?: string; type?: string; attributes?: Record<string, unknown> }>(
  item: T,
  fields: string[]
): T {
  if (!item.attributes) return item;
  
  const compactedAttributes: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in item.attributes) {
      compactedAttributes[field] = item.attributes[field];
    }
  }
  
  return {
    ...item,
    attributes: compactedAttributes,
  } as T;
}

/**
 * Wraps a list function to support auto-pagination and compact mode
 * 
 * @param fetchFn - Function that fetches a single page
 * @param options - Pagination options (fetch_all, max_results, compact, compactFields)
 * @returns All results with metadata
 */
export async function fetchAllPages<T extends { id?: string; type?: string; attributes?: Record<string, unknown> }>(
  fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>,
  options: PaginationOptions = {}
): Promise<AutoPaginatedResponse<T>> {
  const fetchAll = options.fetch_all !== false; // Default true
  const maxResults = options.max_results ?? DEFAULT_MAX_RESULTS;
  const compact = options.compact !== false; // Default true
  const compactFields = options.compactFields ?? [];
  const detailHint = options.detailHint;
  
  const allData: T[] = [];
  const allIncluded: unknown[] = [];
  let cursor: string | undefined;
  let truncated = false;
  
  // Fetch first page
  const firstPage = await fetchFn();
  allData.push(...firstPage.data);
  if (firstPage.included) {
    allIncluded.push(...firstPage.included);
  }
  
  // If not fetching all or no next page, return single page
  if (!fetchAll || !firstPage.links?.next) {
    const resultData = compact && compactFields.length > 0 
      ? allData.map(item => compactItem(item, compactFields))
      : allData;
    
    const result: AutoPaginatedResponse<T> = {
      data: resultData,
      included: (!compact && allIncluded.length > 0) ? allIncluded : undefined,
      meta: {
        total: allData.length,
        fetched: allData.length,
        truncated: false,
        compact: compact && compactFields.length > 0,
      },
    };
    
    if (compact && detailHint) {
      result._hint = detailHint;
    }
    
    return result;
  }
  
  // Fetch remaining pages
  cursor = extractCursor(firstPage.links.next) ?? undefined;
  
  while (cursor && allData.length < maxResults) {
    const page = await fetchFn(cursor);
    allData.push(...page.data);
    if (page.included) {
      allIncluded.push(...page.included);
    }
    
    // Check for next page
    if (page.links?.next) {
      cursor = extractCursor(page.links.next) ?? undefined;
    } else {
      cursor = undefined;
    }
  }
  
  // Check if we hit the limit
  if (allData.length > maxResults) {
    truncated = true;
    allData.length = maxResults; // Trim to max
  } else if (cursor) {
    // Still have more pages but hit limit
    truncated = true;
  }
  
  // Apply compact mode
  const resultData = compact && compactFields.length > 0 
    ? allData.map(item => compactItem(item, compactFields))
    : allData;
  
  const result: AutoPaginatedResponse<T> = {
    data: resultData,
    included: (!compact && allIncluded.length > 0) ? allIncluded : undefined,
    meta: {
      total: allData.length,
      fetched: allData.length,
      truncated,
      compact: compact && compactFields.length > 0,
    },
  };
  
  if (compact && detailHint) {
    result._hint = detailHint;
  }
  
  return result;
}
