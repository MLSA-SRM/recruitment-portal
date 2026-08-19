import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { requireAdmin } from '@/lib/require-admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PaginationControls } from '@/components/pagination-controls'
import { Users } from 'lucide-react'

type Filters = { q?: string; year?: string; department?: string; page?: string; limit?: string }

type ProfileRow = {
  id: string
  name: string | null
  ra_number: string | null
  phone_number: number | null
  department: string | null
  branch: string | null
  year: number | null
  domain: string | null
  subdomain: string | null
  is_admin: boolean
  created_at: string | null
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin()
  const resolvedSearchParams = await searchParams
  const supabase = await createSupabaseServer()

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const limit = Math.max(1, Math.min(200, Number(resolvedSearchParams.limit) || 50))

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, ra_number, phone_number, department, branch, year, domain, subdomain, is_admin, created_at')
    .order('created_at', { ascending: false })

  let rows = (error ? [] : (data || [])) as ProfileRow[]

  if (resolvedSearchParams.q) {
    const q = resolvedSearchParams.q.toLowerCase()
    rows = rows.filter((r) => `${r.name ?? ''} ${r.ra_number ?? ''}`.toLowerCase().includes(q))
  }
  if (resolvedSearchParams.year) {
    rows = rows.filter((r) => String(r.year ?? '') === resolvedSearchParams.year)
  }
  if (resolvedSearchParams.department) {
    rows = rows.filter((r) => (r.department ?? '') === resolvedSearchParams.department)
  }

  const total = rows.length
  const totalPages = Math.ceil(total / limit)
  const validatedPage = Math.min(page, Math.max(1, totalPages))
  const offset = (validatedPage - 1) * limit
  const paginatedRows = rows.slice(offset, offset + limit)

  const departments = Array.from(new Set((data || []).map((r) => r.department).filter(Boolean))) as string[]

  function hrefWith(key: string, value?: string) {
    const params = new URLSearchParams()
    if (resolvedSearchParams.q && key !== 'q') params.set('q', resolvedSearchParams.q)
    if (resolvedSearchParams.year && key !== 'year') params.set('year', resolvedSearchParams.year)
    if (resolvedSearchParams.department && key !== 'department') params.set('department', resolvedSearchParams.department)
    if (value) params.set(key, value)
    return `/admin/users?${params.toString()}`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            All Users
          </h1>
          <p className="text-xl text-gray-600 mt-3 font-light leading-relaxed">
            {total} registered {total === 1 ? 'user' : 'users'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <form className="w-full sm:flex-1 sm:w-auto" method="get">
            <Input name="q" defaultValue={resolvedSearchParams.q} placeholder="Search name or RA number" />
            {resolvedSearchParams.year && <input type="hidden" name="year" value={resolvedSearchParams.year} />}
            {resolvedSearchParams.department && <input type="hidden" name="department" value={resolvedSearchParams.department} />}
            {resolvedSearchParams.limit && <input type="hidden" name="limit" value={resolvedSearchParams.limit} />}
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Year {resolvedSearchParams.year ? `: ${resolvedSearchParams.year}` : ''}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
              <DropdownMenuItem asChild><Link href={hrefWith('year')}>Any</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={hrefWith('year', '1')}>1st Year</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={hrefWith('year', '2')}>2nd Year</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {departments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  Department {resolvedSearchParams.department ? `: ${resolvedSearchParams.department}` : ''}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href={hrefWith('department')}>Any</Link></DropdownMenuItem>
                {departments.map((d) => (
                  <DropdownMenuItem key={d} asChild><Link href={hrefWith('department', d)}>{d}</Link></DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Card>
          <CardContent className="px-6 py-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">RA Number</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Domain / Subdomain</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No users match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.name || '—'}
                      {r.is_admin && <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">Admin</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.ra_number || '—'}</TableCell>
                    <TableCell>
                      {r.year ? (
                        <Badge variant="outline" className="text-xs">
                          {r.year}{r.year === 1 ? 'st' : r.year === 2 ? 'nd' : r.year === 3 ? 'rd' : 'th'} Year
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.department || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.branch || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone_number || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.domain ? `${r.domain}${r.subdomain ? ` — ${r.subdomain}` : ''}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <PaginationControls
          page={validatedPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          searchParams={resolvedSearchParams}
        />
      </div>
    </AdminLayout>
  )
}
