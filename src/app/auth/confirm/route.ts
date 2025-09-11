import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { getProductionSiteUrl } from '@/lib/url-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  // Build redirect target without sensitive params
  const baseUrl = getProductionSiteUrl()
  
  // Only allow internal paths for next
  const safeNext = next && next.startsWith('/') ? next : '/auth/update-password'
  const redirectTo = new URL(`${baseUrl}${safeNext}`)
  
  // Clean up sensitive parameters from the redirect URL
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  try {
    console.log('[auth/confirm] request.url', request.url)
    console.log('[auth/confirm] redirectTo', redirectTo.toString())
  } catch {}

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
      console.log('[auth/confirm] OTP verification successful, redirecting to:', redirectTo.toString())
      return NextResponse.redirect(redirectTo)
    }
    
    console.log('[auth/confirm] OTP verification failed:', error.message)
    // Add error details to help with debugging
    redirectTo.pathname = '/auth/auth-code-error'
    redirectTo.searchParams.set('error', 'verification_failed')
    redirectTo.searchParams.set('message', error.message)
    return NextResponse.redirect(redirectTo)
  }

  // If no token_hash or type provided
  console.log('[auth/confirm] Missing token_hash or type parameters')
  redirectTo.pathname = '/auth/auth-code-error'
  redirectTo.searchParams.set('error', 'missing_parameters')
  redirectTo.searchParams.set('message', 'Password reset link is missing required parameters')
  return NextResponse.redirect(redirectTo)
}


