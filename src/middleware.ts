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

  // Public routes are decided purely from the path, BEFORE any network call.
  //
  // getUser() used to run first, on every single request. It is a round-trip to
  // the Supabase Auth API, so loading /auth/signin — a page whose whole point is
  // that the visitor is not signed in yet — blocked on an auth lookup that could
  // never return anything useful. Under load those calls queue up and middleware
  // exceeds its execution limit, producing intermittent sitewide 504s
  // (MIDDLEWARE_INVOCATION_TIMEOUT) that come and go with traffic.
  //
  // Sign-in traffic is the heaviest thing hitting this app during recruitment,
  // so keeping it network-free in middleware matters most exactly when the site
  // is busiest.
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/callback', '/auth/auth-code-error', '/auth/forgot-password', '/auth/update-password', '/auth/confirm', '/auth/verify-otp', '/auth/verify-signup-otp']
  const isPublicRoute = req.nextUrl.pathname === '/' || publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (isPublicRoute) {
    return res
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
     * Only /admin/* runs through middleware.
     *
     * Middleware previously ran on nearly every request, and each authenticated
     * one made a getUser() round-trip to the Supabase Auth API. That call is the
     * thing that times out: at ~2.9K invocations against a hot /api route called
     * once per task card, the auth API becomes the bottleneck and middleware
     * exceeds its execution limit, producing intermittent sitewide 504s
     * (MIDDLEWARE_INVOCATION_TIMEOUT) whenever traffic climbs.
     *
     * Narrowing to /admin/* is safe because middleware is not the only guard —
     * it is the only guard for exactly one thing. Verified route by route:
     *   /apply, /dashboard  - server components that check getUser() themselves
     *                         and render "Authentication Required", then check
     *                         auth_check for onboarding
     *   /profile/setup      - checks getUser() and redirects to sign-in
     *   /api/submission-status      - canSubmitToTask() returns canSubmit:false
     *                                 when there is no session
     *   /api/tasks/[taskId]         - PUT verifies is_admin; GET returns task
     *                                 rows that are already anon-readable
     *   /api/submissions/[id]/trigger-ai - triggerAIReviewForSubmission()
     *                                 throws without a session and requires the
     *                                 submission's owner or an admin
     *   /admin/*            - only four of nine pages call requireAdmin(); the
     *                         other five are client components with no
     *                         server-side guard, so this matcher is what
     *                         actually protects them. Hence /admin stays.
     *
     * Static assets stop passing through middleware for free under this rule,
     * so the task guide PDF and logo remain reachable without a session.
     */
    '/admin/:path*',
  ],
}
