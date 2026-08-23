import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminLayout } from '@/components/admin-layout'
import { PaginationControls } from '@/components/pagination-controls'
import { SubmissionsTable } from '@/components/submissions-table'
import { requireAdmin } from '@/lib/require-admin'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { DOMAIN_SUBDOMAINS } from '@/lib/constants'
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

type Filters = { q?: string; year?: string; domain?: string; subdomain?: string; status?: string; minScore?: string; maxScore?: string; sort?: string; page?: string; limit?: string }

type SubmissionWithJoins = {
  id: number
  submission_url: string
  status: 'pending' | 'shortlisted' | 'rejected'
  ai_score: number | null
  ai_recommendation: 'shortlist' | 'reject' | null
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

type SubmissionAggregates = {
  pending: number
  shortlisted: number
  rejected: number
  averageScore: number
}

async function getSubmissions(filters: Filters): Promise<{ submissions: SubmissionWithJoins[], total: number, page: number, totalPages: number, aggregates: SubmissionAggregates }> {
  const page = Math.max(1, Number(filters.page) || 1) // Ensure page is at least 1
  const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50)) // Ensure limit is between 1 and 200

  // Create cache key from filters
  const cacheKey = CacheKeys.adminSubmissions(JSON.stringify({ ...filters, page, limit }))
  
  // Try to get from cache first
  const cached = cache.get<{ submissions: SubmissionWithJoins[], total: number, page: number, totalPages: number, aggregates: SubmissionAggregates }>(cacheKey)
  if (cached) {
    return cached
  }

  const supabase = await createSupabaseServer()

  // Build query with filters - fetch ALL data first for consistent filtering
  let query = supabase
    .from('submissions')
    .select(`
      id, 
      submission_url, 
      status, 
      ai_score, 
      ai_recommendation, 
      created_at, 
      profiles!submissions_applicant_id_fkey(name, ra_number, year), 
      tasks!submissions_task_id_fkey(domain, subdomain)
    `, { count: 'exact' })

  // Apply database-level filters that are efficient
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.minScore) {
    query = query.gte('ai_score', Number(filters.minScore))
  }
  if (filters.maxScore) {
    query = query.lte('ai_score', Number(filters.maxScore))
  }

  // Apply consistent sorting with secondary sort for ties
  if (filters.sort === 'score_desc') {
    query = query.order('ai_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }) // Secondary sort for ties
  } else if (filters.sort === 'score_asc') {
    query = query.order('ai_score', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }) // Secondary sort for ties
  } else {
    query = query.order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Secondary sort for ties
  }

  // Get ALL data first (no pagination yet)
  const { data, error } = await query

  if (error) {
    console.error('Error fetching submissions:', error)
    return { submissions: [], total: 0, page: 1, totalPages: 0, aggregates: { pending: 0, shortlisted: 0, rejected: 0, averageScore: 0 } }
  }

  let rows = (data || []) as unknown as SubmissionWithJoins[]

  // Apply client-side filters that can't be done at DB level
  if (filters.q) {
    const q = filters.q.toLowerCase()
    rows = rows.filter((row) => {
      const hay = `${row.profiles?.name ?? ''} ${row.profiles?.ra_number ?? ''} ${row.tasks?.domain ?? ''} ${row.tasks?.subdomain ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }
  if (filters.year) {
    rows = rows.filter((r) => String(r.profiles?.year ?? '') === String(filters.year))
  }
  if (filters.domain) {
    rows = rows.filter((r) => (r.tasks?.domain ?? '') === filters.domain)
  }
  if (filters.subdomain) {
    rows = rows.filter((r) => (r.tasks?.subdomain ?? '') === filters.subdomain)
  }

  // Compute aggregates on the full filtered result set (pre-pagination)
  const aggregates: SubmissionAggregates = rows.reduce(
    (acc, row) => {
      if (row.status === 'pending') acc.pending += 1
      if (row.status === 'shortlisted') acc.shortlisted += 1
      if (row.status === 'rejected') acc.rejected += 1
      if (typeof row.ai_score === 'number') {
        acc.averageScore += row.ai_score
      }
      return acc
    },
    { pending: 0, shortlisted: 0, rejected: 0, averageScore: 0 }
  )
  const scoreDenominator = rows.filter(r => typeof r.ai_score === 'number').length
  aggregates.averageScore = scoreDenominator > 0 ? Math.round(aggregates.averageScore / scoreDenominator) : 0

  // Now apply pagination to the filtered results
  const total = rows.length
  const totalPages = Math.ceil(total / limit)
  const validatedPage = Math.min(page, Math.max(1, totalPages)) // Ensure page doesn't exceed total pages
  const offset = (validatedPage - 1) * limit
  const paginatedRows = rows.slice(offset, offset + limit)

  const result = { submissions: paginatedRows, total, page: validatedPage, totalPages, aggregates }
  
  // Cache the result for 2 minutes
  cache.set(cacheKey, result, CacheTTL.SHORT * 2)

  return result
}


export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin()
  const resolvedSearchParams = await searchParams
  const { submissions, total, page, totalPages, aggregates } = await getSubmissions(resolvedSearchParams as Filters)
  
  // Get analytics data
  const supabase = await createSupabaseServer()
  const { data: totalSubmissions } = await supabase.from('submissions').select('status', { count: 'exact' })
  const { data: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact' })
  const { data: totalProfiles } = await supabase.from('profiles').select('*', { count: 'exact' })
  
  // Use aggregates computed from the full filtered dataset (not paginated)
  const pendingCount = aggregates.pending
  const shortlistedCount = aggregates.shortlisted
  const rejectedCount = aggregates.rejected
  
  function hrefWith(key: string, value?: string) {
    const params = new URLSearchParams()
    if (resolvedSearchParams.q && key !== 'q') params.set('q', resolvedSearchParams.q)
    if (resolvedSearchParams.year && key !== 'year') params.set('year', resolvedSearchParams.year)
    if (resolvedSearchParams.domain && key !== 'domain') params.set('domain', resolvedSearchParams.domain)
    if (resolvedSearchParams.subdomain && key !== 'subdomain') params.set('subdomain', resolvedSearchParams.subdomain)
    if (resolvedSearchParams.status && key !== 'status') params.set('status', resolvedSearchParams.status)
    if (resolvedSearchParams.minScore && key !== 'minScore') params.set('minScore', resolvedSearchParams.minScore)
    if (resolvedSearchParams.maxScore && key !== 'maxScore') params.set('maxScore', resolvedSearchParams.maxScore)
    if (resolvedSearchParams.sort && key !== 'sort') params.set('sort', resolvedSearchParams.sort)
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
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSubmissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
            <div className="mt-2 h-1 bg-muted rounded-full">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting AI review</p>
            <div className="mt-2 h-1 bg-muted rounded-full">
              <div 
                className="h-1 bg-yellow-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalSubmissions?.length ? (pendingCount / totalSubmissions.length) * 100 : 0}%` }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{shortlistedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Selected candidates</p>
            <div className="mt-2 h-1 bg-muted rounded-full">
              <div 
                className="h-1 bg-green-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalSubmissions?.length ? (shortlistedCount / totalSubmissions.length) * 100 : 0}%` }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Not selected</p>
            <div className="mt-2 h-1 bg-muted rounded-full">
              <div 
                className="h-1 bg-red-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalSubmissions?.length ? (rejectedCount / totalSubmissions.length) * 100 : 0}%` }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-muted-foreground">Total Users:</span>
                </div>
                <span className="text-xl font-bold text-foreground">{totalProfiles?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-muted-foreground">Total Tasks:</span>
                </div>
                <span className="text-xl font-bold text-foreground">{totalTasks?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-muted-foreground">Success Rate:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-600">
                    {totalSubmissions?.length ? Math.round((shortlistedCount / totalSubmissions.length) * 100) : 0}%
                  </span>
                  <div className="w-12 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full transition-all duration-500" 
                      style={{ width: `${totalSubmissions?.length ? (shortlistedCount / totalSubmissions.length) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-muted-foreground">Avg AI Score:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-600">
                    {submissions.length ? Math.round(submissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / submissions.length) : 0}
                  </span>
                  <div className="w-12 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${submissions.length ? (submissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / submissions.length) / 10 : 0}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="w-full sm:flex-1 sm:w-auto" method="get">
          <Input name="q" defaultValue={resolvedSearchParams.q} placeholder="Search name, RA, domain, subdomain" />
          {/* Preserve other search parameters */}
          {resolvedSearchParams.year && <input type="hidden" name="year" value={resolvedSearchParams.year} />}
          {resolvedSearchParams.domain && <input type="hidden" name="domain" value={resolvedSearchParams.domain} />}
          {resolvedSearchParams.subdomain && <input type="hidden" name="subdomain" value={resolvedSearchParams.subdomain} />}
          {resolvedSearchParams.status && <input type="hidden" name="status" value={resolvedSearchParams.status} />}
          {resolvedSearchParams.minScore && <input type="hidden" name="minScore" value={resolvedSearchParams.minScore} />}
          {resolvedSearchParams.maxScore && <input type="hidden" name="maxScore" value={resolvedSearchParams.maxScore} />}
          {resolvedSearchParams.sort && <input type="hidden" name="sort" value={resolvedSearchParams.sort} />}
          {resolvedSearchParams.limit && <input type="hidden" name="limit" value={resolvedSearchParams.limit} />}
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
            {Object.entries(DOMAIN_SUBDOMAINS).map(([domain, subdomains]) => (
              <div key={domain}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">{domain}</DropdownMenuLabel>
                {subdomains.map((sub) => (
                  <DropdownMenuItem key={sub} asChild><Link href={hrefWith('subdomain', sub)}>{sub}</Link></DropdownMenuItem>
                ))}
              </div>
            ))}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">AI Score {resolvedSearchParams.minScore || resolvedSearchParams.maxScore ? `: ${resolvedSearchParams.minScore ?? 0}-${resolvedSearchParams.maxScore ?? '1000'}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by AI Score</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('minScore')}>Any</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`${hrefWith('minScore', '0')}&maxScore=400`}>0-400</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`${hrefWith('minScore', '401')}&maxScore=799`}>401-799</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('minScore', '800')}>800+</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Sort {resolvedSearchParams.sort ? `: ${resolvedSearchParams.sort === 'score_desc' ? 'Score High→Low' : 'Score Low→High'}` : ''}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={hrefWith('sort')}>Default</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('sort', 'score_desc')}>AI Score High→Low</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={hrefWith('sort', 'score_asc')}>AI Score Low→High</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/admin/export"><Button type="button">Export Shortlisted CSV</Button></Link>
      </div>
      <SubmissionsTable submissions={submissions} />

      {/* Pagination Controls */}
      <PaginationControls 
        page={page}
        totalPages={totalPages}
        total={total}
        limit={Number(resolvedSearchParams.limit) || 50}
        searchParams={resolvedSearchParams}
      />
      </div>
    </AdminLayout>
  )
}


