import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { env } from '@/env'

// Optimized server client with proper cookie handling and configuration
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookie setting errors gracefully
          console.warn('Failed to set cookie:', name, error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle cookie removal errors gracefully
          console.warn('Failed to remove cookie:', name, error)
        }
      }
    },
    auth: {
      // Enable automatic token refresh on server
      autoRefreshToken: true,
      // Persist session in cookies
      persistSession: true,
      // Detect session from URL
      detectSessionInUrl: true,
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


