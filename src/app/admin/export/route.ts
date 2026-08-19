import { exportShortlistedCSV } from '@/app/actions'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return new Response('Forbidden', { status: 403 })
  }

  const csv = await exportShortlistedCSV()
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shortlisted.csv"'
    }
  })
}


