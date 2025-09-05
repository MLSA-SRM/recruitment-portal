import { createSupabaseServer } from './supabase'
import { createSupabaseClient } from './supabase-client'
import { executeWithRetry } from './connection-pool'
import { Database } from './database.types'
import { cache } from 'react'

// Optimized query builder with caching and retry logic
export class OptimizedSupabaseClient {
  private static instance: OptimizedSupabaseClient
  private serverClient: Awaited<ReturnType<typeof createSupabaseServer>> | null = null
  private client: ReturnType<typeof createSupabaseClient> | null = null

  private constructor() {}

  static getInstance(): OptimizedSupabaseClient {
    if (!OptimizedSupabaseClient.instance) {
      OptimizedSupabaseClient.instance = new OptimizedSupabaseClient()
    }
    return OptimizedSupabaseClient.instance
  }

  // Get server client with lazy initialization
  async getServerClient() {
    if (!this.serverClient) {
      this.serverClient = await createSupabaseServer()
    }
    return this.serverClient
  }

  // Get browser client with lazy initialization
  getClient() {
    if (!this.client) {
      this.client = createSupabaseClient()
    }
    return this.client
  }

  // Execute query with retry logic and error handling
  async executeQuery<T>(
    queryFn: (client: Awaited<ReturnType<typeof createSupabaseServer>>) => T,
    context: string = 'database query'
  ): Promise<T> {
    const client = await this.getServerClient()
    
    return executeWithRetry(
      async () => await queryFn(client),
      context
    )
  }

  // Cached profile queries
  async getProfile(userId: string) {
    return this.executeQuery(
      (client) => client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      `getProfile(${userId})`
    )
  }

  // Cached task queries
  async getTasks(filters?: {
    domain?: string
    subdomain?: string
    targetYear?: number
    limit?: number
  }) {
    return this.executeQuery(
      (client) => {
        let query = client.from('tasks').select('*')
        
        if (filters?.domain) {
          query = query.eq('domain', filters.domain)
        }
        if (filters?.subdomain) {
          query = query.eq('subdomain', filters.subdomain)
        }
        if (filters?.targetYear) {
          query = query.eq('target_year', filters.targetYear)
        }
        if (filters?.limit) {
          query = query.limit(filters.limit)
        }
        
        return query.order('created_at', { ascending: false })
      },
      `getTasks(${JSON.stringify(filters)})`
    )
  }

  // Cached submission queries
  async getSubmissions(filters?: {
    applicantId?: string
    taskId?: number
    status?: string
    limit?: number
  }) {
    return this.executeQuery(
      (client) => {
        let query = client.from('submissions').select(`
          *,
          task:tasks(*),
          profile:profiles(*)
        `)
        
        if (filters?.applicantId) {
          query = query.eq('applicant_id', filters.applicantId)
        }
        if (filters?.taskId) {
          query = query.eq('task_id', filters.taskId)
        }
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }
        if (filters?.limit) {
          query = query.limit(filters.limit)
        }
        
        return query.order('created_at', { ascending: false })
      },
      `getSubmissions(${JSON.stringify(filters)})`
    )
  }

  // Optimized submission creation with validation
  async createSubmission(data: Database['public']['Tables']['submissions']['Insert']) {
    return this.executeQuery(
      (client) => client
        .from('submissions')
        .insert(data)
        .select()
        .single(),
      `createSubmission(${data.task_id})`
    )
  }

  // Optimized submission update
  async updateSubmission(
    id: number, 
    data: Database['public']['Tables']['submissions']['Update']
  ) {
    return this.executeQuery(
      (client) => client
        .from('submissions')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
      `updateSubmission(${id})`
    )
  }

  // Batch operations for better performance
  async batchUpdateSubmissions(
    updates: Array<{ id: number; data: Database['public']['Tables']['submissions']['Update'] }>
  ) {
    return this.executeQuery(
      async (client) => {
        const results = []
        for (const update of updates) {
          const result = await client
            .from('submissions')
            .update({ ...update.data, updated_at: new Date().toISOString() })
            .eq('id', update.id)
            .select()
            .single()
          results.push(result)
        }
        return results
      },
      `batchUpdateSubmissions(${updates.length} items)`
    )
  }

  // Real-time subscription helper
  subscribeToTable(
    table: string,
    callback: (payload: unknown) => void,
    filter?: string
  ) {
    const client = this.getClient()
    const subscription = client
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        }, 
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  // Health check
  async healthCheck() {
    try {
      const client = await this.getServerClient()
      const { error } = await client
        .from('profiles')
        .select('count')
        .limit(1)
      
      return { healthy: !error, error }
    } catch (error) {
      return { healthy: false, error }
    }
  }
}

// Singleton instance
export const supabaseOptimized = OptimizedSupabaseClient.getInstance()

// React cache wrappers for server components
export const getCachedProfile = cache(async (userId: string) => {
  return supabaseOptimized.getProfile(userId)
})

export const getCachedTasks = cache(async (filters?: {
  domain?: string
  subdomain?: string
  targetYear?: number
  limit?: number
}) => {
  return supabaseOptimized.getTasks(filters)
})

export const getCachedSubmissions = cache(async (filters?: {
  applicantId?: string
  taskId?: number
  status?: string
  limit?: number
}) => {
  return supabaseOptimized.getSubmissions(filters)
})

// Utility functions for common operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string = 'operation'
): Promise<T> {
  return executeWithRetry(operation, context)
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
  })

  return Promise.race([operation, timeoutPromise])
}

// Error handling utilities
export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return !!(error && typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string')
}

export function handleSupabaseError(error: unknown, context: string = 'operation') {
  if (isSupabaseError(error)) {
    console.error(`[${context}] Supabase error:`, error.message, error.code)
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
  
  console.error(`[${context}] Unknown error:`, error)
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  }
}
