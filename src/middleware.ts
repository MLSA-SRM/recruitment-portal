import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/env'

// Cache for user sessions to reduce database calls
const sessionCache = new Map<string, { user: unknown; profile: unknown; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create optimized Supabase client for middleware
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { [key: string]: unknown }) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { [key: string]: unknown }) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
      auth: {
        // Optimize auth settings for middleware
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )

  // Get user with caching
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/callback', '/auth/auth-code-error']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    return res
  }

  // If user is not authenticated, redirect to signin
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Check cache for user profile
  const cacheKey = user.id
  const cached = sessionCache.get(cacheKey)
  const now = Date.now()
  
  let profile = null
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    // Use cached profile
    profile = cached.profile
  } else {
    // Fetch fresh profile and cache it
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = profileData
    
    // Update cache
    sessionCache.set(cacheKey, {
      user,
      profile,
      timestamp: now
    })
    
    // Clean up old cache entries
    if (sessionCache.size > 100) {
      const oldestKey = sessionCache.keys().next().value
      if (oldestKey) {
        sessionCache.delete(oldestKey)
      }
    }
  }

  // Routes that require a complete profile
  const profileRequiredRoutes = ['/dashboard', '/apply']
  const requiresProfile = profileRequiredRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (requiresProfile && !profile) {
    return NextResponse.redirect(new URL('/profile/setup', req.url))
  }

  // Admin routes require admin privileges
  const adminRoutes = ['/admin']
  const requiresAdmin = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (requiresAdmin && !(profile && profile.is_admin === true)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
