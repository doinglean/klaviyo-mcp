/**
 * In-memory caching for Klaviyo API responses
 *
 * Features:
 * - TTL-based expiration per resource type
 * - Automatic cleanup of expired items
 * - LRU-style eviction when max size reached
 */

import { CACHE_CONFIG } from '../config.js';
import { logger } from './logger.js';

interface CacheEntry<T> {
  value: T;
  type: string;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
}

// Cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Cleanup interval reference
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Determine cache type from key
 */
function getCacheType(key: string): keyof typeof CACHE_CONFIG.ttlSeconds {
  if (key.includes('/metrics')) return 'metrics';
  if (key.includes('/campaigns')) return 'campaigns';
  if (key.includes('/flows')) return 'flows';
  if (key.includes('/templates')) return 'templates';
  if (key.includes('/lists')) return 'lists';
  if (key.includes('/segments')) return 'segments';
  if (key.includes('/profiles')) return 'profiles';
  if (key.includes('/tags')) return 'tags';
  return 'default';
}

/**
 * Get TTL for cache type in milliseconds
 */
function getTtlMs(type: keyof typeof CACHE_CONFIG.ttlSeconds): number {
  return (CACHE_CONFIG.ttlSeconds[type] ?? CACHE_CONFIG.ttlSeconds.default) * 1000;
}

/**
 * Check if caching is enabled
 */
export function isCacheEnabled(): boolean {
  return CACHE_CONFIG.enabled;
}

/**
 * Generate a cache key from method and URL
 */
export function generateCacheKey(method: string, url: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramStr}`;
}

/**
 * Check if a key exists in cache and is not expired
 */
export function hasCache(key: string): boolean {
  if (!isCacheEnabled()) return false;
  if (!cache.has(key)) return false;

  const entry = cache.get(key)!;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return false;
  }

  return true;
}

/**
 * Get value from cache
 */
export function getCache<T>(key: string): T | undefined {
  if (!hasCache(key)) return undefined;

  const entry = cache.get(key)!;
  entry.lastAccessed = Date.now();

  logger.debug(`Cache hit: ${key.substring(0, 60)}${key.length > 60 ? '...' : ''}`);
  return entry.value as T;
}

/**
 * Set value in cache
 */
export function setCache<T>(key: string, value: T): boolean {
  if (!isCacheEnabled()) return false;
  if (value === null || value === undefined) return false;

  const type = getCacheType(key);
  const ttlMs = getTtlMs(type);

  // Evict if at max size
  if (cache.size >= CACHE_CONFIG.maxSize) {
    evictOldestItems();
  }

  const now = Date.now();
  cache.set(key, {
    value,
    type,
    createdAt: now,
    lastAccessed: now,
    expiresAt: now + ttlMs,
  });

  logger.debug(`Cache set: ${key.substring(0, 60)}${key.length > 60 ? '...' : ''} (TTL: ${ttlMs / 1000}s)`);
  return true;
}

/**
 * Evict oldest items when cache is full
 */
function evictOldestItems(): void {
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

  // Remove oldest 20%
  const toRemove = Math.max(1, Math.ceil(entries.length * 0.2));
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
    logger.debug(`Cache evicted: ${entries[i][0].substring(0, 60)}...`);
  }
}

/**
 * Clear expired items from cache
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  let count = 0;

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      count++;
    }
  }

  if (count > 0) {
    logger.debug(`Cleared ${count} expired cache items`);
  }
}

/**
 * Clear all items from cache
 */
export function clearCache(): void {
  cache.clear();
  logger.info('Cache cleared');
}

/**
 * Clear items of a specific type from cache
 */
export function clearCacheByType(type: string): void {
  let count = 0;

  for (const [key, entry] of cache.entries()) {
    if (entry.type === type) {
      cache.delete(key);
      count++;
    }
  }

  if (count > 0) {
    logger.info(`Cleared ${count} ${type} cache items`);
  }
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  let count = 0;

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }

  if (count > 0) {
    logger.debug(`Invalidated ${count} cache entries matching ${pattern}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  enabled: boolean;
  size: number;
  maxSize: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};

  for (const entry of cache.values()) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
  }

  return {
    enabled: isCacheEnabled(),
    size: cache.size,
    maxSize: CACHE_CONFIG.maxSize,
    byType,
  };
}

/**
 * Initialize cache with periodic cleanup
 */
export function initCache(): void {
  if (!isCacheEnabled()) {
    logger.info('Cache is disabled');
    return;
  }

  // Clear expired items every minute
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  cleanupInterval = setInterval(clearExpiredCache, 60000);

  logger.info('Cache initialized', {
    enabled: CACHE_CONFIG.enabled,
    maxSize: CACHE_CONFIG.maxSize,
    ttlSeconds: CACHE_CONFIG.ttlSeconds,
  });
}

/**
 * Shutdown cache and cleanup
 */
export function shutdownCache(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  clearCache();
}

export default {
  hasCache,
  getCache,
  setCache,
  clearCache,
  clearCacheByType,
  invalidateCache,
  getCacheStats,
  initCache,
  shutdownCache,
  generateCacheKey,
  isCacheEnabled,
};
