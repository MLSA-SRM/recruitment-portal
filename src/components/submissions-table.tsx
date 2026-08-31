'use client'

import { Fragment, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { updateSubmissionStatus, bulkUpdateSubmissionStatus, triggerAIReviewForSubmission, deleteSubmission } from '@/app/actions'
import { CheckCircle2, XCircle, RefreshCw, Trash2, Loader2 } from 'lucide-react'

type SubmissionWithJoins = {
  id: number
  applicant_id: string
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

type ApplicantGroup = {
  key: string
  name: string
  raNumber: string
  year: number | null
  rows: SubmissionWithJoins[]
  domains: string[]
  subdomains: string[]
}

export function SubmissionsTable({ submissions }: { submissions: SubmissionWithJoins[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pending, startTransition] = useTransition()
  const [rowPending, setRowPending] = useState<number | null>(null)

  const allSelected = submissions.length > 0 && selected.size === submissions.length

  // Group submissions by applicant, preserving the order the server sent them
  // in (which is already sorted and paginated by applicant, so every person's
  // submissions arrive contiguously and no group is split across pages).
  const groups: ApplicantGroup[] = []
  const groupIndex = new Map<string, ApplicantGroup>()

  for (const row of submissions) {
    const key = row.applicant_id ?? `submission-${row.id}`
    let group = groupIndex.get(key)
    if (!group) {
      group = {
        key,
        name: row.profiles?.name || 'Unknown applicant',
        raNumber: row.profiles?.ra_number || '—',
        year: row.profiles?.year ?? null,
        rows: [],
        domains: [],
        subdomains: [],
      }
      groupIndex.set(key, group)
      groups.push(group)
    }
    group.rows.push(row)

    const domain = row.tasks?.domain
    if (domain && !group.domains.includes(domain)) group.domains.push(domain)
    const subdomain = row.tasks?.subdomain
    if (subdomain && !group.subdomains.includes(subdomain)) group.subdomains.push(subdomain)
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(submissions.map((s) => s.id)))
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Select or clear every submission belonging to one applicant at once.
  function toggleGroup(group: ApplicantGroup) {
    const ids = group.rows.map((r) => r.id)
    const allInGroupSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allInGroupSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  function runBulk(status: 'shortlisted' | 'rejected') {
    startTransition(async () => {
      await bulkUpdateSubmissionStatus(Array.from(selected), status)
      setSelected(new Set())
      router.refresh()
    })
  }

  function runRowAction(id: number, fn: () => Promise<unknown>) {
    setRowPending(id)
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } finally {
        setRowPending(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex items-center justify-between gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-gray-700">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={pending}
              onClick={() => runBulk('shortlisted')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Accept Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => runBulk('rejected')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject Selected
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead className="font-semibold">Applicant</TableHead>
            <TableHead className="font-semibold">RA Number</TableHead>
            <TableHead className="font-semibold">Year</TableHead>
            <TableHead className="font-semibold">Domain</TableHead>
            <TableHead className="font-semibold">Subdomain</TableHead>
            <TableHead className="font-semibold">AI Score</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              {/* Applicant header — one per person, summarising everything they
                  attempted. Their individual submissions follow underneath with
                  all the usual per-row actions. */}
              <TableRow className="bg-slate-100 hover:bg-slate-100 border-t-2 border-slate-300">
                <TableCell>
                  <Checkbox
                    checked={group.rows.every((r) => selected.has(r.id))}
                    onCheckedChange={() => toggleGroup(group)}
                    aria-label={`Select all submissions by ${group.name}`}
                  />
                </TableCell>
                <TableCell className="font-semibold text-gray-900">{group.name}</TableCell>
                <TableCell className="text-muted-foreground">{group.raNumber}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {group.year ? `${group.year}${group.year === 1 ? 'st' : group.year === 2 ? 'nd' : group.year === 3 ? 'rd' : 'th'} Year` : '—'}
                  </Badge>
                </TableCell>
                <TableCell colSpan={4}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-600">
                      {group.rows.length} {group.rows.length === 1 ? 'submission' : 'submissions'} across
                    </span>
                    {group.domains.map((d) => (
                      <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                    ))}
                    {group.subdomains.map((sd) => (
                      <Badge key={sd} variant="outline" className="text-xs bg-white">{sd}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell />
              </TableRow>

              {group.rows.map((s) => (
            <TableRow
              key={s.id}
              className={`${
                s.status === 'shortlisted' ? 'bg-green-50 hover:bg-green-100' :
                s.status === 'rejected' ? 'bg-red-50 hover:bg-red-100' :
                'hover:bg-muted/50'
              } transition-colors`}
            >
              <TableCell className="pl-6">
                <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} aria-label={`Select submission ${s.id}`} />
              </TableCell>
              <TableCell className="font-medium text-muted-foreground pl-6">↳</TableCell>
              <TableCell className="text-muted-foreground">{s.profiles?.ra_number || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {s.profiles?.year ? `${s.profiles.year}${s.profiles.year === 1 ? 'st' : s.profiles.year === 2 ? 'nd' : s.profiles.year === 3 ? 'rd' : 'th'} Year` : '—'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{s.tasks?.domain || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{s.tasks?.subdomain || '—'}</TableCell>
              <TableCell>
                {s.ai_score ? (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{s.ai_score}</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          s.ai_score >= 800 ? 'bg-green-500' :
                          s.ai_score >= 600 ? 'bg-yellow-500' :
                          s.ai_score >= 400 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(s.ai_score / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={s.status === 'shortlisted' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}
                  className={`${
                    s.status === 'shortlisted' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    s.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {s.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/admin/submission/${s.id}`}>
                    <Button size="sm" variant="outline" className="h-8">
                      Review
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex items-center gap-1"
                    disabled={rowPending === s.id}
                    onClick={() => runRowAction(s.id, () => triggerAIReviewForSubmission(s.id))}
                  >
                    {rowPending === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    AI
                  </Button>
                  <Button
                    size="sm"
                    className={`h-8 relative ${
                      s.ai_recommendation === 'shortlist'
                        ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-2 animate-pulse shadow-lg'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={rowPending === s.id}
                    onClick={() => runRowAction(s.id, () => updateSubmissionStatus(s.id, 'shortlisted'))}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className={`h-8 relative ${
                      s.ai_recommendation === 'reject'
                        ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400 ring-offset-2 animate-pulse shadow-lg'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    disabled={rowPending === s.id}
                    onClick={() => runRowAction(s.id, () => updateSubmissionStatus(s.id, 'rejected'))}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Submission</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this submission? This action cannot be undone.
                          <br />
                          <br />
                          <strong>Applicant:</strong> {s.profiles?.name || 'Unknown'} ({s.profiles?.ra_number || 'N/A'})
                          <br />
                          <strong>Task:</strong> {s.tasks?.domain || 'Unknown'} - {s.tasks?.subdomain || 'N/A'}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                          disabled={rowPending === s.id}
                          onClick={() => runRowAction(s.id, () => deleteSubmission(s.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Submission
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
