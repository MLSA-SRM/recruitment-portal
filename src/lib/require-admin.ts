import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'

// Server-side guard for /admin/* pages. Middleware should already block
// non-admins, but this is defense-in-depth in case middleware is bypassed
// or misconfigured — never rely on middleware alone for access control.
export async function requireAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  return user
}
