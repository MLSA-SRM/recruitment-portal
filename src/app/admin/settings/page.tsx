import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettingsClient } from './admin-settings-client'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return <AdminSettingsClient user={user} />
}
