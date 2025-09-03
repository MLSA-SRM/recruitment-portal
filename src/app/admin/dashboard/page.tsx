import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { updateSubmissionStatus } from '@/app/actions'
import { revalidatePath } from 'next/cache'
import { AdminLayout } from '@/components/admin-layout'
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  BarChart3,
  Plus
} from 'lucide-react'

type Filters = { q?: string; year?: string; domain?: string; subdomain?: string; status?: string }

type SubmissionWithJoins = {
  id: number
  submission_url: string
  status: 'pending' | 'shortlisted' | 'rejected'
  ai_score: number | null
  profiles: {
    name: string | null
    ra_number: string | null
    year: number | null
  } | null
  tasks: {
    domain: string
    subdomain: string | null
  } | null
}

async function getSubmissions(filters: Filters): Promise<SubmissionWithJoins[]> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('submissions')
    .select('id, submission_url, status, ai_score, profiles(name, ra_number, year), tasks(domain, subdomain)')
  let rows = (data || []) as unknown as SubmissionWithJoins[]
  if (filters.q) {
    const q = filters.q.toLowerCase()
    rows = rows.filter((row) => {
      const hay = `${row.profiles?.name ?? ''} ${row.profiles?.ra_number ?? ''} ${row.tasks?.domain ?? ''} ${row.tasks?.subdomain ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }
  if (filters.year) rows = rows.filter((r) => String(r.profiles?.year ?? '') === String(filters.year))
  if (filters.domain) rows = rows.filter((r) => (r.tasks?.domain ?? '') === filters.domain)
  if (filters.subdomain) rows = rows.filter((r) => (r.tasks?.subdomain ?? '') === filters.subdomain)
  if (filters.status) rows = rows.filter((r) => (r.status ?? '') === filters.status)
  return rows
}

function rowClass(status: string) {
  if (status === 'shortlisted') return 'bg-green-100'
  if (status === 'rejected') return 'bg-red-100'
  return ''
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Filters> }) {
  const resolvedSearchParams = await searchParams
  const submissions = await getSubmissions(resolvedSearchParams as Filters)
  
  // Get analytics data
  const supabase = await createSupabaseServer()
  const { data: totalSubmissions } = await supabase.from('submissions').select('status', { count: 'exact' })
  const { data: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact' })
  const { data: totalProfiles } = await supabase.from('profiles').select('*', { count: 'exact' })
  
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const shortlistedCount = submissions.filter(s => s.status === 'shortlisted').length
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length
  
  function hrefWith(key: string, value?: string) {
    const params = new URLSearchParams()
    if (resolvedSearchParams.q && key !== 'q') params.set('q', resolvedSearchParams.q)
    if (resolvedSearchParams.year && key !== 'year') params.set('year', resolvedSearchParams.year)
    if (resolvedSearchParams.domain && key !== 'domain') params.set('domain', resolvedSearchParams.domain)
    if (resolvedSearchParams.subdomain && key !== 'subdomain') params.set('subdomain', resolvedSearchParams.subdomain)
    if (resolvedSearchParams.status && key !== 'status') params.set('status', resolvedSearchParams.status)
    if (value) params.set(key, value)
    return `/admin/dashboard?${params.toString()}`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
                            {/* Header with Quick Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900">Admin Dashboard</h1>
                        <p className="text-xl text-gray-600 mt-3 font-light leading-relaxed">Manage applications, tasks, and recruitment process</p>
                      </div>
        <div className="flex gap-3">
          <Link href="/admin/tasks/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </Link>
          <Link href="/admin/export">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSubmissions?.length || 0}</div>
            <p className="text-sm text-gray-500 mt-1">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-sm text-gray-500 mt-1">Awaiting AI review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Shortlisted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{shortlistedCount}</div>
            <p className="text-sm text-gray-500 mt-1">Selected candidates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-sm text-gray-500 mt-1">Not selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Users:</span>
                <span className="text-lg font-bold text-gray-900">{totalProfiles?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Tasks:</span>
                <span className="text-lg font-bold text-gray-900">{totalTasks?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Success Rate:</span>
                <span className="text-lg font-bold text-gray-900">
                  {totalSubmissions?.length ? Math.round((shortlistedCount / totalSubmissions.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Avg AI Score:</span>
                <span className="text-lg font-bold text-gray-900">
                  {submissions.length ? Math.round(submissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / submissions.length) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3">
        <form className="flex-1" action="/admin/dashboard" method="get">
          <Input name="q" defaultValue={resolvedSearchParams.q} placeholder="Search name, RA, domain, subdomain" />
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Year {resolvedSearchParams.year ? `: ${resolvedSearchParams.year}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('year')}>Any</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('year', '1')}>1</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('year', '2')}>2</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('year', '3')}>3</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Domain {resolvedSearchParams.domain ? `: ${resolvedSearchParams.domain}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Domain</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('domain')}>Any</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('domain', 'Technical')}>Technical</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('domain', 'Creatives')}>Creatives</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('domain', 'Corporate')}>Corporate</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Subdomain {resolvedSearchParams.subdomain ? `: ${resolvedSearchParams.subdomain}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Filter by Subdomain</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain')}>Any</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">Technical</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Web Development: Frontend')}>Web Development: Frontend</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Web Development: Backend')}>Web Development: Backend</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Web Development: Full Stack')}>Web Development: Full Stack</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'AI/ML')}>AI/ML</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">Corporate</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Sponsorships & Partnerships')}>Sponsorships & Partnerships</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Event Management & Logistics')}>Event Management & Logistics</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'PR & Outreach')}>PR & Outreach</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Team Operations')}>Team Operations</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Content Writing')}>Content Writing</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">Creatives</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Graphic Design')}>Graphic Design</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'Video Editing & Motion Graphics')}>Video Editing & Motion Graphics</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('subdomain', 'UI/UX Design')}>UI/UX Design</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Status {resolvedSearchParams.status ? `: ${resolvedSearchParams.status}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('status')}>Any</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('status', 'pending')}>Pending</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('status', 'shortlisted')}>Shortlisted</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('status', 'rejected')}>Rejected</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/admin/export"><Button type="button">Export Shortlisted CSV</Button></Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Applicant</th>
              <th className="p-2">RA Number</th>
              <th className="p-2">Year</th>
              <th className="p-2">Domain</th>
              <th className="p-2">Subdomain</th>
              <th className="p-2">Submission</th>
              <th className="p-2">AI Score</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s: SubmissionWithJoins) => (
              <tr key={s.id} className={`${rowClass(s.status)} border-b`}>
                <td className="p-2">{s.profiles?.name}</td>
                <td className="p-2">{s.profiles?.ra_number}</td>
                <td className="p-2">{s.profiles?.year}</td>
                <td className="p-2">{s.tasks?.domain}</td>
                <td className="p-2">{s.tasks?.subdomain}</td>
                <td className="p-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={s.submission_url} target="_blank" rel="noreferrer">Open</a>
                  </Button>
                </td>
                <td className="p-2">{s.ai_score ?? '-'}</td>
                <td className="p-2">
                  <Badge variant={s.status === 'shortlisted' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {s.status}
                  </Badge>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/submission/${s.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                    <form action={async () => { 'use server'; await updateSubmissionStatus(s.id as number, 'shortlisted'); revalidatePath('/admin/dashboard') }}>
                      <Button type="submit" size="sm" className={`${typeof s.ai_score === 'number' && s.ai_score >= 800 ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>Accept</Button>
                    </form>
                    <form action={async () => { 'use server'; await updateSubmissionStatus(s.id as number, 'rejected'); revalidatePath('/admin/dashboard') }}>
                      <Button type="submit" variant="destructive" size="sm" className={`${typeof s.ai_score === 'number' && s.ai_score <= 400 ? 'ring-2 ring-red-400 animate-pulse' : ''}`}>Reject</Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </AdminLayout>
  )
}


