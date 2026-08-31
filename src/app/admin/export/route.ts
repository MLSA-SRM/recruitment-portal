import { exportShortlistedCSV } from '@/app/actions'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return new Response('Forbidden', { status: 403 })
  }

  // Filters are read from the query string so the Export button can carry
  // whatever the dashboard is currently filtered to. Previously none were
  // passed and the export always dumped every shortlisted submission.
  const { searchParams } = new URL(request.url)
  const filters = {
    domain: searchParams.get('domain') || undefined,
    subdomain: searchParams.get('subdomain') || undefined,
    year: searchParams.get('year') || undefined,
    status: searchParams.get('status') || undefined,
    group: searchParams.get('group') || undefined,
  }

  const csv = await exportShortlistedCSV(filters)

  // Name the file after what is actually in it, so a folder of exports stays
  // tellable apart.
  const parts = [filters.status || 'shortlisted', filters.domain, filters.subdomain, filters.year && `year${filters.year}`]
    .filter(Boolean)
    .map((p) => String(p).replace(/[^a-z0-9]+/gi, '-').toLowerCase())
  const filename = `${parts.join('_')}${filters.group === 'applicant' ? '_by-applicant' : ''}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}


