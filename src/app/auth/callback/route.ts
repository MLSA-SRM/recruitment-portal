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
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: authCheck } = await supabase
          .from('auth_check')
          .select('is_onboarding_complete')
          .eq('user_id', user.id)
          .single()
        
        if (authCheck?.is_onboarding_complete) {
          // User has completed onboarding, redirect to apply page
          return NextResponse.redirect(`${origin}/apply`)
        }
      }
      
      // User hasn't completed onboarding, redirect to profile setup
      return NextResponse.redirect(`${origin}/profile/setup`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
