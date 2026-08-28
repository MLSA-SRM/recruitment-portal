import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/env'

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
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/callback', '/auth/auth-code-error', '/auth/forgot-password', '/auth/update-password', '/auth/confirm', '/auth/verify-otp', '/auth/verify-signup-otp']
  const isPublicRoute = req.nextUrl.pathname === '/' || publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    return res
  }

  // If user is not authenticated, redirect to signin
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Admin routes require admin privileges. This is the only check left here
  // that needs a database read, and it runs only for /admin/* — a handful of
  // people — so it stays off the hot path that students are on.
  //
  // It cannot be dropped: of the nine pages under /admin, only four are server
  // components calling requireAdmin(). The other five are client components
  // with no server-side guard of their own, so this middleware check is what
  // actually protects them.
  //
  // The onboarding check that used to live here was removed. It ran an
  // auth_check query on every authenticated request, and /apply and /dashboard
  // each already query auth_check themselves and render a "Profile Setup
  // Required" card — so it was a duplicate round-trip on the two hottest
  // routes. Combined with a profiles select('*'), every request made three
  // sequential network calls; under deadline-night traffic that exhausted the
  // connection pool and tripped MIDDLEWARE_INVOCATION_TIMEOUT (504) sitewide.
  const requiresAdmin = req.nextUrl.pathname.startsWith('/admin')

  if (requiresAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets served from /public by extension (the task guide PDF,
     *   the logo, icons). These must stay reachable without a session so a
     *   link shared in the WhatsApp group opens for someone who isn't logged
     *   in, instead of bouncing them to /auth/signin.
     *
     * This cannot expose a protected route: every guarded path is matched by
     * prefix (/dashboard, /apply, /admin, /profile) and none of them end in a
     * file extension, so a request like /admin/x.pdf simply 404s in routing.
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:pdf|docx|svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
}
