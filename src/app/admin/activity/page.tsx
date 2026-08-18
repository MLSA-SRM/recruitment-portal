import { createSupabaseServer } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, CheckCircle2, XCircle, Trash2, Plus } from 'lucide-react'

type ActivityRow = {
  id: number
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
  profiles: { name: string | null } | null
}

function actionIcon(action: string) {
  switch (action) {
    case 'status_change':
      return null
    case 'delete':
      return <Trash2 className="h-3.5 w-3.5" />
    case 'create':
      return <Plus className="h-3.5 w-3.5" />
    default:
      return null
  }
}

function describeActivity(row: ActivityRow): string {
  const details = row.details || {}
  if (row.action === 'status_change' && row.target_type === 'submission') {
    const status = details.status as string | undefined
    return `${status === 'shortlisted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Updated'} submission #${row.target_id}`
  }
  if (row.action === 'delete' && row.target_type === 'submission') {
    const name = details.applicantName as string | undefined
    return `Deleted submission #${row.target_id}${name ? ` (${name})` : ''}`
  }
  if (row.action === 'delete' && row.target_type === 'task') {
    const title = details.title as string | undefined
    return `Deleted task${title ? ` "${title}"` : ` #${row.target_id}`}`
  }
  if (row.action === 'create' && row.target_type === 'task') {
    const title = details.title as string | undefined
    return `Created task${title ? ` "${title}"` : ` #${row.target_id}`}`
  }
  return `${row.action} ${row.target_type} #${row.target_id}`
}

function statusBadge(row: ActivityRow) {
  if (row.action === 'status_change') {
    const status = (row.details?.status as string) || ''
    if (status === 'shortlisted') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" />Accepted</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" />Rejected</Badge>
    }
  }
  if (row.action === 'delete') {
    return <Badge variant="destructive" className="flex items-center gap-1 w-fit"><Trash2 className="h-3 w-3" />Deleted</Badge>
  }
  if (row.action === 'create') {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1 w-fit"><Plus className="h-3 w-3" />Created</Badge>
  }
  return <Badge variant="secondary">{row.action}</Badge>
}

export default async function AdminActivityPage() {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('id, action, target_type, target_id, details, created_at, profiles(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (error ? [] : (data || [])) as unknown as ActivityRow[]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <History className="h-8 w-8 text-blue-600" />
            Activity Log
          </h1>
          <p className="text-xl text-gray-600 mt-3 font-light leading-relaxed">
            Recent admin actions across submissions and tasks
          </p>
        </div>

        <Card>
          <CardContent className="px-6 py-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">When</TableHead>
                  <TableHead className="font-semibold">Admin</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No admin activity recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{row.profiles?.name || 'Unknown admin'}</TableCell>
                    <TableCell>{statusBadge(row)}</TableCell>
                    <TableCell className="flex items-center gap-1.5 text-sm text-gray-700">
                      {actionIcon(row.action)}
                      {describeActivity(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
