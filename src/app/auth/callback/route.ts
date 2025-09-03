import { createSupabaseServer } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const next = searchParams.get('next') ?? '/profile/setup'

  if (code) {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user already has a profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          // User has a profile, redirect to dashboard
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
      
      // User doesn't have a profile, redirect to profile setup
      return NextResponse.redirect(`${origin}/profile/setup`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
