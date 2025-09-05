import { createSupabaseClient } from './supabase-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Real-time subscription manager with connection pooling and optimization
export class RealtimeManager {
  private static instance: RealtimeManager
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, Set<string>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  private constructor() {
    this.startHeartbeat()
  }

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  // Subscribe to table changes with optimized filtering
  subscribeToTable(
    table: keyof Database['public']['Tables'],
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      filter?: string
      userId?: string
    } = {}
  ): () => void {
    const { event = '*', filter, userId } = options
    const channelName = `${table}_${event}_${filter || 'all'}`
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName)!
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(existingChannel as any).on('postgres_changes', {
        event,
        schema: 'public',
        table: table as string,
        filter
      }, callback)
      
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(existingChannel as any).off('postgres_changes', callback)
        this.cleanupChannel(channelName)
      }
    }

    // Create new channel
    const client = createSupabaseClient()
    const channel = client.channel(channelName)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(channel as any).on('postgres_changes', {
        event,
        schema: 'public',
        table: table as string,
        filter
      }, callback)
    channel.subscribe((status) => {
        this.handleChannelStatus(channelName, status)
      })

    this.channels.set(channelName, channel)
    this.trackSubscription(channelName, userId)

    return () => {
      this.unsubscribeFromTable(table, callback, options)
    }
  }

  // Subscribe to user-specific changes
  subscribeToUserChanges(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ): () => void {
    const unsubscribers: (() => void)[] = []

    // Subscribe to user's submissions
    unsubscribers.push(
      this.subscribeToTable('submissions', callback, {
        filter: `applicant_id=eq.${userId}`,
        userId
      })
    )

    // Subscribe to user's profile changes
    unsubscribers.push(
      this.subscribeToTable('profiles', callback, {
        filter: `id=eq.${userId}`,
        userId
      })
    )

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Subscribe to admin dashboard changes
  subscribeToAdminDashboard(
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ): () => void {
    const unsubscribers: (() => void)[] = []

    // Subscribe to all submission changes
    unsubscribers.push(
      this.subscribeToTable('submissions', callback, {
        event: '*'
      })
    )

    // Subscribe to task changes
    unsubscribers.push(
      this.subscribeToTable('tasks', callback, {
        event: '*'
      })
    )

    // Subscribe to profile changes (for admin users)
    unsubscribers.push(
      this.subscribeToTable('profiles', callback, {
        event: '*'
      })
    )

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Subscribe to task-specific changes
  subscribeToTaskChanges(
    taskId: number,
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ): () => void {
    return this.subscribeToTable('submissions', callback, {
      filter: `task_id=eq.${taskId}`
    })
  }

  // Subscribe to pending submissions (for real-time notifications)
  subscribeToPendingSubmissions(
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  ): () => void {
    return this.subscribeToTable('submissions', callback, {
      filter: 'status=eq.pending'
    })
  }

  // Unsubscribe from specific table
  private unsubscribeFromTable(
    table: keyof Database['public']['Tables'],
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
    options: { event?: string; filter?: string; userId?: string } = {}
  ): void {
    const { event = '*', filter } = options
    const channelName = `${table}_${event}_${filter || 'all'}`
    
    const channel = this.channels.get(channelName)
    if (channel) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(channel as any).off('postgres_changes', callback)
      this.cleanupChannel(channelName)
    }
  }

  // Clean up unused channels
  private cleanupChannel(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      // Check if channel has any active subscriptions
      const subscriptionSet = this.subscriptions.get(channelName)
      const hasActiveSubscriptions = subscriptionSet ? subscriptionSet.size > 0 : false
      
      if (!hasActiveSubscriptions) {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(channelName)
      }
    }
  }

  // Track subscriptions for cleanup
  private trackSubscription(channelName: string, userId?: string): void {
    if (!this.subscriptions.has(channelName)) {
      this.subscriptions.set(channelName, new Set())
    }
    
    if (userId) {
      this.subscriptions.get(channelName)!.add(userId)
    }
  }

  // Handle channel connection status
  private handleChannelStatus(channelName: string, status: string): void {
    console.log(`[Realtime] Channel ${channelName} status:`, status)
    
    if (status === 'SUBSCRIBED') {
      this.isConnected = true
      this.reconnectAttempts = 0
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this.isConnected = false
      this.handleReconnection()
    }
  }

  // Handle reconnection logic
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.reconnectAllChannels()
    }, delay)
  }

  // Reconnect all active channels
  private reconnectAllChannels(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
      // Channel will be recreated on next subscription
    })
    this.channels.clear()
  }

  // Heartbeat to maintain connection
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected && this.channels.size > 0) {
        console.log('[Realtime] Heartbeat: Reconnecting channels')
        this.reconnectAllChannels()
      }
    }, 30000) // 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Get connection status
  getStatus(): {
    isConnected: boolean
    activeChannels: number
    reconnectAttempts: number
  } {
    return {
      isConnected: this.isConnected,
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe()
    })
    this.channels.clear()
    this.subscriptions.clear()
    this.stopHeartbeat()
  }
}

// Singleton instance
export const realtimeManager = RealtimeManager.getInstance()

// React hooks for real-time subscriptions
export function useRealtimeSubscription(
  table: keyof Database['public']['Tables'],
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    filter?: string
    userId?: string
  } = {}
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect, useRef } = require('react')
  
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToTable(
      table,
      (payload) => callbackRef.current(payload),
      options
    )

    return unsubscribe
  }, [table, options])
}

// Utility functions for common real-time patterns
export const realtimeUtils = {
  // Subscribe to new submissions for a specific task
  subscribeToNewSubmissions: (taskId: number, callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) => {
    return realtimeManager.subscribeToTable('submissions', callback, {
      event: 'INSERT',
      filter: `task_id=eq.${taskId}`
    })
  },

  // Subscribe to submission status changes
  subscribeToSubmissionStatusChanges: (callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) => {
    return realtimeManager.subscribeToTable('submissions', callback, {
      event: 'UPDATE',
      filter: 'status=neq.pending'
    })
  },

  // Subscribe to AI review completions
  subscribeToAIReviews: (callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) => {
    return realtimeManager.subscribeToTable('submissions', callback, {
      event: 'UPDATE',
      filter: 'ai_review=not.is.null'
    })
  },

  // Subscribe to admin actions
  subscribeToAdminActions: (callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) => {
    return realtimeManager.subscribeToTable('submissions', callback, {
      event: 'UPDATE',
      filter: 'admin_review=not.is.null'
    })
  }
}

// Performance monitoring for real-time connections
export function withRealtimeMetrics<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T {
  return ((...args: unknown[]) => {
    const start = performance.now()
    const result = fn(...args)
    const duration = performance.now() - start
    
    console.log(`[Realtime] ${name} completed in ${duration.toFixed(2)}ms`)
    
    return result
  }) as T
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.cleanup()
  })
}
