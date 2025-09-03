import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function ProfileCheck() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }
  
  // Check if profile already exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // If profile exists, redirect to dashboard
  if (profile && !profileError) {
    redirect('/dashboard')
  }
  
  // If profile doesn't exist, allow profile setup to continue
  return null
}
