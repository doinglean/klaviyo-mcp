/**
 * Auto-pagination utilities for Klaviyo MCP
 * 
 * Fetches all pages automatically so AI agents don't have to manually paginate.
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
  };
}

export interface PaginationOptions {
  /** Fetch all pages automatically (default: true) */
  fetch_all?: boolean;
  /** Maximum results to return (default: 500, safety limit) */
  max_results?: number;
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
 * Wraps a list function to support auto-pagination
 * 
 * @param fetchFn - Function that fetches a single page
 * @param options - Pagination options (fetch_all, max_results)
 * @returns All results with metadata
 */
export async function fetchAllPages<T>(
  fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>,
  options: PaginationOptions = {}
): Promise<AutoPaginatedResponse<T>> {
  const fetchAll = options.fetch_all !== false; // Default true
  const maxResults = options.max_results ?? DEFAULT_MAX_RESULTS;
  
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
    return {
      data: allData,
      included: allIncluded.length > 0 ? allIncluded : undefined,
      meta: {
        total: allData.length,
        fetched: allData.length,
        truncated: false,
      },
    };
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
  
  return {
    data: allData,
    included: allIncluded.length > 0 ? allIncluded : undefined,
    meta: {
      total: allData.length,
      fetched: allData.length,
      truncated,
    },
  };
}
