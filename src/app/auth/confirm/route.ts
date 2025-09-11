import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Build redirect target without sensitive params
  const redirectTo = new URL(request.url)
  redirectTo.pathname = '/auth/update-password'
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    // We only support recovery here. Any other type is invalid for this route.
    if (type !== 'recovery') {
      redirectTo.pathname = '/auth/auth-code-error'
      redirectTo.searchParams.set('error', 'invalid_type')
      return NextResponse.redirect(redirectTo)
    }

    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // If verification failed, send to error page
  redirectTo.pathname = '/auth/auth-code-error'
  return NextResponse.redirect(redirectTo)
}


