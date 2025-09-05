import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/env'

// Optimized browser client with proper configuration
export function createSupabaseClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session across browser sessions
      persistSession: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Enable multi-tab synchronization
      multiTab: true,
    },
    // Enable real-time features
    realtime: {
      // Enable real-time subscriptions
      enabled: true,
      // Configure heartbeat interval
      heartbeatIntervalMs: 30000,
    },
    // Global configuration
    global: {
      // Use native fetch for better performance
      fetch: (...args) => fetch(...args),
    },
  })
}

// Re-export the comprehensive database types
export type { Database } from './database.types'
