import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { supabaseOptimized } from './supabase-optimized'
import type { Database } from './database.types'

// Cache configuration
const CACHE_TAGS = {
  PROFILES: 'profiles',
  TASKS: 'tasks',
  SUBMISSIONS: 'submissions',
  SUBMISSION_FIELDS: 'submission-fields',
} as const

const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
} as const

// React cache for server components (request-scoped)
export const getCachedProfile = cache(async (userId: string) => {
  const { data, error } = await supabaseOptimized.getProfile(userId)
  if (error) throw error
  return data
})

export const getCachedTask = cache(async (taskId: number) => {
  const { data, error } = await supabaseOptimized.executeQuery(
    (client) => client
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single(),
    `getTask(${taskId})`
  )
  if (error) throw error
  return data
})

export const getCachedTasks = cache(async (filters?: {
  domain?: string
  subdomain?: string
  targetYear?: number
  limit?: number
}) => {
  const { data, error } = await supabaseOptimized.getTasks(filters)
  if (error) throw error
  return data
})

export const getCachedSubmissions = cache(async (filters?: {
  applicantId?: string
  taskId?: number
  status?: string
  limit?: number
}) => {
  const { data, error } = await supabaseOptimized.getSubmissions(filters)
  if (error) throw error
  return data
})

export const getCachedSubmissionFields = cache(async (taskId: number) => {
  const { data, error } = await supabaseOptimized.executeQuery(
    (client) => client
      .from('submission_fields')
      .select('*')
      .eq('task_id', taskId)
      .order('display_order'),
    `getSubmissionFields(${taskId})`
  )
  if (error) throw error
  return data
})

// Next.js unstable_cache for longer-term caching (across requests)
export const getCachedTasksWithFields = unstable_cache(
  async (filters?: {
    domain?: string
    subdomain?: string
    targetYear?: number
    limit?: number
  }) => {
    const { data: tasks, error: tasksError } = await supabaseOptimized.getTasks(filters)
    if (tasksError) throw tasksError

    // Fetch submission fields for each task
    const tasksWithFields = await Promise.all(
      (tasks || []).map(async (task) => {
        const { data: fields, error: fieldsError } = await supabaseOptimized.executeQuery(
          (client) => client
            .from('submission_fields')
            .select('*')
            .eq('task_id', task.id)
            .order('display_order'),
          `getSubmissionFields(${task.id})`
        )
        
        return {
          ...task,
          submission_fields: fields || []
        }
      })
    )

    return tasksWithFields
  },
  ['tasks-with-fields'],
  {
    tags: [CACHE_TAGS.TASKS, CACHE_TAGS.SUBMISSION_FIELDS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
)

export const getCachedSubmissionsWithJoins = unstable_cache(
  async (filters?: {
    applicantId?: string
    taskId?: number
    status?: string
    limit?: number
  }) => {
    const { data, error } = await supabaseOptimized.getSubmissions(filters)
    if (error) throw error
    return data
  },
  ['submissions-with-joins'],
  {
    tags: [CACHE_TAGS.SUBMISSIONS, CACHE_TAGS.PROFILES, CACHE_TAGS.TASKS],
    revalidate: CACHE_DURATION.SHORT,
  }
)

export const getCachedAdminDashboard = unstable_cache(
  async () => {
    const { data, error } = await supabaseOptimized.executeQuery(
      (client) => client
        .from('submissions')
        .select(`
          *,
          task:tasks(*),
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      'getAdminDashboard'
    )
    if (error) throw error
    return data
  },
  ['admin-dashboard'],
  {
    tags: [CACHE_TAGS.SUBMISSIONS, CACHE_TAGS.PROFILES, CACHE_TAGS.TASKS],
    revalidate: CACHE_DURATION.SHORT,
  }
)

// Cache invalidation utilities
export async function invalidateProfileCache(userId?: string) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.PROFILES)
  if (userId) {
    // Invalidate specific user profile cache
    revalidateTag(`profile-${userId}`)
  }
}

export async function invalidateTaskCache(taskId?: number) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.TASKS)
  if (taskId) {
    revalidateTag(`task-${taskId}`)
  }
}

export async function invalidateSubmissionCache(submissionId?: number) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.SUBMISSIONS)
  if (submissionId) {
    revalidateTag(`submission-${submissionId}`)
  }
}

export async function invalidateAllCaches() {
  const { revalidateTag } = await import('next/cache')
  Object.values(CACHE_TAGS).forEach(tag => revalidateTag(tag))
}

// Optimized query helpers with caching
export async function getTasksForUser(
  userId: string,
  filters?: {
    domain?: string
    subdomain?: string
    targetYear?: number
  }
) {
  // Get user profile first
  const profile = await getCachedProfile(userId)
  
  // Get tasks with user's year as default
  const targetYear = filters?.targetYear || profile?.year
  const tasks = await getCachedTasks({
    ...filters,
    targetYear
  })

  return tasks
}

export async function getUserSubmissions(userId: string) {
  return getCachedSubmissions({ applicantId: userId })
}

export async function getTaskSubmissions(taskId: number) {
  return getCachedSubmissions({ taskId })
}

// Batch operations with cache invalidation
export async function createSubmissionWithCache(
  data: Database['public']['Tables']['submissions']['Insert']
) {
  const result = await supabaseOptimized.createSubmission(data)
  
  // Invalidate relevant caches
  await invalidateSubmissionCache()
  if (data.task_id) {
    await invalidateTaskCache(data.task_id)
  }
  if (data.applicant_id) {
    await invalidateProfileCache(data.applicant_id)
  }
  
  return result
}

export async function updateSubmissionWithCache(
  id: number,
  data: Database['public']['Tables']['submissions']['Update']
) {
  const result = await supabaseOptimized.updateSubmission(id, data)
  
  // Invalidate relevant caches
  await invalidateSubmissionCache(id)
  
  return result
}

// Performance monitoring
export function withCacheMetrics<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      console.log(`[Cache] ${name} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[Cache] ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }) as T
}
