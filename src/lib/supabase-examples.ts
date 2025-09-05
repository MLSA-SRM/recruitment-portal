// Examples of how to use the optimized Supabase implementation
// This file demonstrates best practices and common patterns

import { supabaseOptimized } from './supabase-optimized'
import { 
  getCachedProfile, 
  getCachedTasks, 
  getCachedSubmissions,
  createSubmissionWithCache
} from './supabase-cache'
import { realtimeManager, realtimeUtils } from './realtime-optimized'
import { withRetry, withTimeout, handleSupabaseError } from './supabase-optimized'
import type { Database } from './database.types'

// Example 1: Basic CRUD operations with caching
export async function getTasksForUser(userId: string) {
  try {
    // Get user profile first (cached)
    const profile = await getCachedProfile(userId)

    // Get tasks filtered by user's year (cached)
    const tasks = await getCachedTasks({
      targetYear: profile?.year,
      limit: 20
    })

    return { tasks, profile }
  } catch (error) {
    return handleSupabaseError(error, 'getTasksForUser')
  }
}

// Example 2: Optimized submission creation with validation
export async function createSubmissionOptimized(
  submissionData: Database['public']['Tables']['submissions']['Insert']
) {
  try {
    // Validate required fields
    if (!submissionData.applicant_id || !submissionData.task_id) {
      throw new Error('Missing required fields: applicant_id and task_id')
    }

    // Create submission with cache invalidation
    const data = await createSubmissionWithCache(submissionData)

    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'createSubmissionOptimized')
  }
}

// Example 3: Batch operations for better performance
export async function updateMultipleSubmissions(
  updates: Array<{
    id: number
    data: Database['public']['Tables']['submissions']['Update']
  }>
) {
  try {
    const results = await supabaseOptimized.batchUpdateSubmissions(updates)
    return { success: true, results }
  } catch (error) {
    return handleSupabaseError(error, 'updateMultipleSubmissions')
  }
}

// Example 4: Real-time subscriptions with proper cleanup
export function useSubmissionUpdates(taskId: number, callback: (payload: unknown) => void) {
  // Subscribe to task-specific submission changes
  const unsubscribe = realtimeManager.subscribeToTaskChanges(taskId, callback)
  
  // Return cleanup function
  return unsubscribe
}

// Example 5: Admin dashboard with real-time updates
export function useAdminDashboard(callback: (payload: unknown) => void) {
  // Subscribe to all relevant changes for admin dashboard
  const unsubscribe = realtimeManager.subscribeToAdminDashboard(callback)
  
  return unsubscribe
}

// Example 6: User-specific real-time updates
export function useUserUpdates(userId: string, callback: (payload: unknown) => void) {
  // Subscribe to user-specific changes
  const unsubscribe = realtimeManager.subscribeToUserChanges(userId, callback)
  
  return unsubscribe
}

// Example 7: Optimized query with joins and filtering
export async function getSubmissionsWithDetails(filters: {
  status?: string
  domain?: string
  limit?: number
}) {
  try {
    const { data, error } = await supabaseOptimized.executeQuery(
      (client) => {
        let query = client
          .from('submissions')
          .select(`
            *,
            task:tasks(
              id,
              title,
              domain,
              subdomain,
              target_year
            ),
            profile:profiles(
              id,
              name,
              year,
              department,
              branch
            )
          `)

        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.domain) {
          query = query.eq('task.domain', filters.domain)
        }
        if (filters.limit) {
          query = query.limit(filters.limit)
        }

        return query.order('created_at', { ascending: false })
      },
      `getSubmissionsWithDetails(${JSON.stringify(filters)})`
    )

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'getSubmissionsWithDetails')
  }
}

// Example 8: Health check and monitoring
export async function checkSystemHealth() {
  try {
    // Check database connection
    const { healthy: dbHealthy, error: dbError } = await supabaseOptimized.healthCheck()
    
    // Check real-time connection
    const realtimeStatus = realtimeManager.getStatus()
    
    return {
      database: {
        healthy: dbHealthy,
        error: dbError
      },
      realtime: {
        connected: realtimeStatus.isConnected,
        activeChannels: realtimeStatus.activeChannels,
        reconnectAttempts: realtimeStatus.reconnectAttempts
      },
      overall: dbHealthy && realtimeStatus.isConnected
    }
  } catch (error) {
    return {
      database: { healthy: false, error },
      realtime: { connected: false, activeChannels: 0, reconnectAttempts: 0 },
      overall: false
    }
  }
}

// Example 9: Error handling with retry logic
export async function robustDatabaseOperation<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await withRetry(operation, context)
    return { success: true, data }
  } catch (error) {
    const handled = handleSupabaseError(error, context)
    return { success: false, error: handled.error }
  }
}

// Example 10: Timeout protection for long-running operations
export async function getTasksWithTimeout(filters?: {
  domain?: string
  subdomain?: string
  targetYear?: number
  limit?: number
}) {
  try {
    const operation = () => getCachedTasks(filters)
    const data = await withTimeout(operation(), 10000) // 10 second timeout
    return { success: true, data }
  } catch (error) {
    return handleSupabaseError(error, 'getTasksWithTimeout')
  }
}

// Example 11: Real-time notifications for new submissions
export function setupSubmissionNotifications(callback: (submission: unknown) => void) {
  // Subscribe to new pending submissions
  const unsubscribe = realtimeUtils.subscribeToNewSubmissions(0, (payload) => {
    if (payload.eventType === 'INSERT') {
      callback(payload.new)
    }
  })

  return unsubscribe
}

// Example 12: AI review completion notifications
export function setupAIReviewNotifications(callback: (submission: unknown) => void) {
  // Subscribe to AI review completions
  const unsubscribe = realtimeUtils.subscribeToAIReviews((payload) => {
    if (payload.eventType === 'UPDATE' && payload.new.ai_review) {
      callback(payload.new)
    }
  })

  return unsubscribe
}

// Example 13: Admin action notifications
export function setupAdminActionNotifications(callback: (submission: unknown) => void) {
  // Subscribe to admin review actions
  const unsubscribe = realtimeUtils.subscribeToAdminActions((payload) => {
    if (payload.eventType === 'UPDATE' && payload.new.admin_review) {
      callback(payload.new)
    }
  })

  return unsubscribe
}

// Example 14: Performance monitoring wrapper
export function withPerformanceMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  name: string
): T {
  return (async (...args: unknown[]) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      console.log(`[Performance] ${name} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }) as T
}

// Example 15: Complete dashboard data fetching
export async function getDashboardData(userId: string, isAdmin: boolean = false) {
  try {
    const [profile, recentTasks, userSubmissions] = await Promise.all([
      getCachedProfile(userId),
      getCachedTasks({ limit: 10 }),
      getCachedSubmissions({ applicantId: userId, limit: 10 })
    ])

    const dashboardData: {
      profile: unknown
      recentTasks: unknown[]
      userSubmissions: unknown[]
      adminPendingSubmissions?: unknown
    } = {
      profile,
      recentTasks,
      userSubmissions
    }

    // Add admin-specific data if user is admin
    if (isAdmin) {
      const adminData = await getSubmissionsWithDetails({
        status: 'pending',
        limit: 20
      })
      
      if (adminData.success && 'data' in adminData) {
        dashboardData.adminPendingSubmissions = adminData.data
      }
    }

    return { success: true, data: dashboardData }
  } catch (error) {
    return handleSupabaseError(error, 'getDashboardData')
  }
}

// Example 16: Cleanup utilities
export function cleanupRealtimeConnections() {
  realtimeManager.cleanup()
}

// Example 17: Connection status monitoring
export function getConnectionStatus() {
  return {
    realtime: realtimeManager.getStatus(),
    timestamp: new Date().toISOString()
  }
}
