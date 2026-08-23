import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { updateSubmissionStatus, triggerAIReviewForSubmission, deleteSubmission } from '@/app/actions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, CheckCircle2, XCircle, FileText, User, Award, RefreshCw, Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cache } from '@/lib/cache'
import { requireAdmin } from '@/lib/require-admin'

type SubmissionFieldInfo = {
  value: unknown
  type: string
  label: string
}

type AdminSubmissionView = {
  id: number
  submission_url?: string
  status: string
  ai_score?: number
  ai_review?: string
  ai_recommendation?: 'shortlist' | 'reject' | null
  submission_data: Record<string, unknown>
  profiles: {
    name: string
    ra_number: string
    phone_number: string
    department: string
    branch: string
    year: number
  } | null
  tasks: {
    title: string
    domain: string
    subdomain?: string
    deadline?: string
  } | null
}

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      id,
      submission_url,
      status,
      ai_score,
      ai_review,
      ai_recommendation,
      submission_data,
      profiles:profiles!submissions_applicant_id_fkey(name, ra_number, phone_number, department, branch, year),
      tasks:tasks!submissions_task_id_fkey(title, domain, subdomain, deadline)
    `)
    .eq('id', Number(id))
    .single()

  type RawSubmission = {
    id: number
    submission_url?: string
    status: string
    ai_score?: number
    ai_review?: string
    ai_recommendation?: 'shortlist' | 'reject' | null
    submission_data?: Record<string, unknown>
    profiles?:
      | {
          name: string
          ra_number: string
          phone_number: string
          department: string
          branch: string
          year: number
        }
      | Array<{
          name: string
          ra_number: string
          phone_number: string
          department: string
          branch: string
          year: number
        }>
      | null
    tasks?:
      | {
          title: string
          domain: string
          subdomain?: string
          deadline?: string
        }
      | Array<{
          title: string
          domain: string
          subdomain?: string
          deadline?: string
        }>
      | null
  }

  const s = submission as unknown as RawSubmission | null

  const view: AdminSubmissionView | null = s
    ? {
        id: s.id,
        submission_url: s.submission_url,
        status: s.status,
        ai_score: s.ai_score,
        ai_review: s.ai_review,
        ai_recommendation: s.ai_recommendation ?? null,
        submission_data: s.submission_data || {},
        profiles: Array.isArray(s.profiles) ? s.profiles[0] ?? null : s.profiles ?? null,
        tasks: Array.isArray(s.tasks) ? s.tasks[0] ?? null : s.tasks ?? null
      }
    : null

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Submission Details</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={view?.status === 'shortlisted' ? 'default' : view?.status === 'rejected' ? 'destructive' : 'secondary'}>
              {view?.status}
            </Badge>
            <div className="flex items-center gap-2">
              <form action={async () => { 'use server'; await updateSubmissionStatus(Number(id), 'shortlisted') }}>
                <Button 
                  type="submit" 
                  size="sm" 
                  className={`relative flex items-center gap-2 ${
                    view?.ai_recommendation === 'shortlist'
                      ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-2'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept
                </Button>
              </form>
              <form action={async () => { 'use server'; await updateSubmissionStatus(Number(id), 'rejected') }}>
                <Button 
                  type="submit" 
                  size="sm" 
                  variant="destructive" 
                  className={`relative flex items-center gap-2 ${
                    view?.ai_recommendation === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400 ring-offset-2'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </form>
              
              {/* Delete Submission Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Submission</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this submission? This action cannot be undone.
                      <br />
                      <br />
                      <strong>Applicant:</strong> {view?.profiles?.name || 'Unknown'} ({view?.profiles?.ra_number || 'N/A'})
                      <br />
                      <strong>Task:</strong> {view?.tasks?.title || 'Unknown'}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                    <form action={async () => { 
                      'use server'
                      await deleteSubmission(Number(id))
                      // Aggressive cache invalidation
                      cache.invalidatePattern('admin_submissions:')
                      cache.invalidatePattern('user_submissions:')
                      cache.invalidatePattern('analytics:')
                      cache.clear()
                      revalidatePath('/admin/dashboard')
                      revalidatePath('/dashboard')
                      revalidatePath('/apply')
                      redirect('/admin/dashboard')
                    }}>
                      <Button 
                        type="submit" 
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Submission
                      </Button>
                    </form>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Applicant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div><span className="font-medium">Name:</span> {String(view?.profiles?.name || 'N/A')}</div>
                  <div><span className="font-medium">RA Number:</span> {String(view?.profiles?.ra_number || 'N/A')}</div>
                  <div><span className="font-medium">Year:</span> {String(view?.profiles?.year || 'N/A')}</div>
                  <div><span className="font-medium">Department:</span> {String(view?.profiles?.department || 'N/A')}</div>
                  <div><span className="font-medium">Branch:</span> {String(view?.profiles?.branch || 'N/A')}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Task</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div><span className="font-medium">Domain:</span> {String(view?.tasks?.domain || 'N/A')}</div>
                  <div><span className="font-medium">Subdomain:</span> {String(view?.tasks?.subdomain || 'N/A')}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Submission:</span>
                    {view?.submission_url ? (
                      <Button asChild size="sm" variant="outline" className="h-7 px-2">
                        <a href={view.submission_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Fields */}
            {view?.submission_data && Object.keys(view.submission_data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Submission Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-3">
                    {Object.entries(view.submission_data).map(([fieldName, fieldInfo]) => (
                      <div key={fieldName} className="border-l-2 border-blue-200 pl-3">
                        <div className="font-medium text-gray-900 mb-1">{(fieldInfo as SubmissionFieldInfo).label || fieldName}</div>
                        <div className="text-gray-700">
                          {(fieldInfo as SubmissionFieldInfo).type === 'file' ? (
                            <div className="space-y-1">
                              {/* eslint-disable @typescript-eslint/no-explicit-any */}
                              <div className="text-xs text-gray-500">File: {((fieldInfo as SubmissionFieldInfo).value as any)?.name || 'Unknown'}</div>
                              {((fieldInfo as SubmissionFieldInfo).value as any)?.size && (
                                <div className="text-xs text-gray-500">Size: {(((fieldInfo as SubmissionFieldInfo).value as any).size / 1024).toFixed(1)} KB</div>
                              )}
                              {((fieldInfo as SubmissionFieldInfo).value as any)?.type && (
                                <div className="text-xs text-gray-500">Type: {((fieldInfo as SubmissionFieldInfo).value as any).type}</div>
                              )}
                              {/* eslint-enable @typescript-eslint/no-explicit-any */}
                            </div>
                          ) : (fieldInfo as SubmissionFieldInfo).type === 'url' ? (
                            <Button asChild size="sm" variant="outline" className="h-8 px-3">
                              <a
                                href={(fieldInfo as SubmissionFieldInfo).value as string}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open Link
                              </a>
                            </Button>
                          ) : (fieldInfo as SubmissionFieldInfo).type === 'email' ? (
                            <Button asChild size="sm" variant="outline" className="h-8 px-3">
                                                            <a
                                href={`mailto:${String((fieldInfo as SubmissionFieldInfo).value)}`}
                                className="inline-flex items-center gap-2"
                              >
                                <span>{String((fieldInfo as SubmissionFieldInfo).value)}</span>
                              </a>
                            </Button>
                          ) : (fieldInfo as SubmissionFieldInfo).type === 'checkbox' ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                Boolean((fieldInfo as SubmissionFieldInfo).value) ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'
                              }`}>
                                {Boolean((fieldInfo as SubmissionFieldInfo).value) && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <span className={Boolean((fieldInfo as SubmissionFieldInfo).value) ? 'text-green-700' : 'text-gray-500'}>
                                {Boolean((fieldInfo as SubmissionFieldInfo).value) ? 'Yes' : 'No'}
                              </span>
                            </div>
                          ) : (fieldInfo as SubmissionFieldInfo).type === 'number' ? (
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                              {String((fieldInfo as SubmissionFieldInfo).value)}
                            </span>
                          ) : (
                            <div className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-sm">
                              {String((fieldInfo as SubmissionFieldInfo).value)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Type: {(fieldInfo as SubmissionFieldInfo).type}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">AI Review</CardTitle>
                <div className="flex items-center gap-3">
                  <form action={async () => { 'use server'; await triggerAIReviewForSubmission(Number(id)) }}>
                    <Button 
                      type="submit" 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Trigger AI Review
                    </Button>
                  </form>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="h-3 w-3" /> Score: {submission?.ai_score ?? '-'} / 1000
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="leading-7 text-gray-800 mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      table: ({ children }) => <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden mb-4">{children}</table>,
                      thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                      th: ({ children }) => <th className="border border-gray-200 px-3 py-2 text-left font-medium">{children}</th>,
                      td: ({ children }) => <td className="border border-gray-200 px-3 py-2 text-gray-800">{children}</td>,
                      code: ({ children }) => <code className="bg-gray-100 rounded px-1 py-0.5">{children}</code>
                    }}
                  >
                    {submission?.ai_review ?? 'AI review pending...'}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


