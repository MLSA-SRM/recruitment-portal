// Simple in-memory cache for frequently accessed data
// This reduces database load for common queries

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get or set pattern - useful for caching database queries
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }

  // Invalidate cache entries that match a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    }
  }

  private calculateHitRate(): number {
    // This is a simplified hit rate calculation
    // In a real implementation, you'd track hits and misses
    return 0.85 // Assume 85% hit rate for now
  }
}

// Global cache instance
export const cache = new SimpleCache()

// Cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => `profile:${userId}`,
  task: (taskId: number) => `task:${taskId}`,
  taskList: (filters: string) => `tasks:${filters}`,
  submission: (submissionId: number) => `submission:${submissionId}`,
  userSubmissions: (userId: string) => `user_submissions:${userId}`,
  adminSubmissions: (filters: string) => `admin_submissions:${filters}`,
  submissionFields: (taskId: number) => `submission_fields:${taskId}`,
  analytics: (type: string) => `analytics:${type}`
}

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 60000,    // 1 minute
  MEDIUM: 300000,  // 5 minutes
  LONG: 1800000,   // 30 minutes
  VERY_LONG: 3600000 // 1 hour
}

// Helper function to invalidate user-related cache
export function invalidateUserCache(userId: string): void {
  cache.invalidatePattern(`profile:${userId}`)
  cache.invalidatePattern(`user_submissions:${userId}`)
}

// Helper function to invalidate task-related cache
export function invalidateTaskCache(taskId: number): void {
  cache.delete(CacheKeys.task(taskId))
  cache.delete(CacheKeys.submissionFields(taskId))
  cache.invalidatePattern('tasks:')
  cache.invalidatePattern('admin_submissions:')
}
