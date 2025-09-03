import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { updateSubmissionStatus } from '@/app/actions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, CheckCircle2, XCircle, FileText, User, Award } from 'lucide-react'

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, submission_url, status, ai_score, ai_review, profiles(*), tasks(*)')
    .eq('id', Number(id))
    .single()

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
            <Badge variant={submission?.status === 'shortlisted' ? 'default' : submission?.status === 'rejected' ? 'destructive' : 'secondary'}>
              {submission?.status}
            </Badge>
            <div className="flex items-center gap-2">
              <form action={async () => { 'use server'; await updateSubmissionStatus(Number(id), 'shortlisted') }}>
                <Button type="submit" size="sm" className={`flex items-center gap-2 ${typeof submission?.ai_score === 'number' && submission.ai_score >= 800 ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
                  <CheckCircle2 className="h-4 w-4" /> Accept
                </Button>
              </form>
              <form action={async () => { 'use server'; await updateSubmissionStatus(Number(id), 'rejected') }}>
                <Button type="submit" size="sm" variant="destructive" className={`flex items-center gap-2 ${typeof submission?.ai_score === 'number' && submission.ai_score <= 400 ? 'ring-2 ring-red-400 animate-pulse' : ''}`}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </form>
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Name:</span> {String((submission as any)?.profiles?.name || 'N/A')}</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">RA Number:</span> {String((submission as any)?.profiles?.ra_number || 'N/A')}</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Year:</span> {String((submission as any)?.profiles?.year || 'N/A')}</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Department:</span> {String((submission as any)?.profiles?.department || 'N/A')}</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Branch:</span> {String((submission as any)?.profiles?.branch || 'N/A')}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Task</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Domain:</span> {String((submission as any)?.tasks?.domain || 'N/A')}</div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div><span className="font-medium">Subdomain:</span> {String((submission as any)?.tasks?.subdomain || 'N/A')}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Submission:</span>
                    {submission?.submission_url ? (
                      <Button asChild size="sm" variant="outline" className="h-7 px-2">
                        <a href={submission.submission_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
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
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">AI Review</CardTitle>
                <div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="h-3 w-3" /> Score: {submission?.ai_score ?? '-'} / 1000
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {/* Removed neutral suggestion; glow on buttons indicates AI suggestion */}
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


