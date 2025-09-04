import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/env'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client for middleware
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(name: string, value: string, options: any) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove(name: string, options: any) {
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
    }
  )

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

  // Check if user has a profile for protected routes
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
