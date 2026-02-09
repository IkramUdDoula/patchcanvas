/**
 * Simplified IndexedDB stub
 * Removed complex caching - React Query handles this now
 */

// Stub functions for backward compatibility
export async function cacheGet<T>(category: string, key?: string): Promise<T | null> {
  // No-op: React Query handles caching
  return null;
}

export async function cacheSet<T>(category: string, key: string, value: T, ttl?: number): Promise<void> {
  // No-op: React Query handles caching
}

export async function cacheDelete(category: string, key?: string): Promise<void> {
  // No-op: React Query handles cache invalidation
}

export async function cacheClear(): Promise<void> {
  // No-op: React Query handles cache clearing
}
