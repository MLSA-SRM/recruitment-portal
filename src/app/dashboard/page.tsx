import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import React from 'react'
import { Edit, Clock, AlertCircle, Calendar, CheckCircle, FileText } from 'lucide-react'
import { SubmissionWithTask } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-gray-600 mb-4">You need to be signed in to view your dashboard.</p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Setup Required</h1>
        <p className="text-gray-600 mb-4">Please complete your profile setup before accessing the dashboard.</p>
        <Link href="/profile/setup">
          <Button>Complete Profile</Button>
        </Link>
      </div>
    )
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submission_url,
      status,
      ai_score,
      ai_review,
      created_at,
      updated_at,
      tasks(title, domain, subdomain, target_year, deadline)
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  const typedSubmissions = submissions as SubmissionWithTask[]

  const now = new Date()

  function normalizeDeadlineToEndOfDay(dateLike: string): Date {
    const base = new Date(dateLike)
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)
  }

  

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold mb-1">My Dashboard</h1>
        <p className="text-sm text-gray-600">Track your submissions and updates</p>
      </div>

      {typedSubmissions && typedSubmissions.length > 0 ? (
        <div className="space-y-4">
          {typedSubmissions.map((submission) => {
            // Normalize task relation (can be object or single-item array depending on PostgREST)
            const rawTask = submission.tasks as unknown
            const task = Array.isArray(rawTask) ? rawTask[0] : (rawTask as (typeof submission.tasks extends Array<infer T> ? T : { title?: string; domain?: string; subdomain?: string; target_year?: number; deadline?: string }) | null)
            const deadline = task?.deadline ? normalizeDeadlineToEndOfDay(task.deadline) : null
            const deadlinePassed = deadline ? deadline < now : false
            const canEdit = submission.status === 'pending' && !deadlinePassed
            
            return (
              <div key={submission.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
                {/* Header Section */}
                <div className="relative bg-white px-4 py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {task?.title}
                    </h3>
                      
                    </div>
                    
                    {/* Header Actions */}
                    <div className="ml-4 flex-shrink-0">
                      {canEdit ? (
                        <Link href={`/dashboard/edit/${submission.id}`}>
                          <Button size="sm" variant="outline" className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Submission Details Grid (compact; removed Task/Domain/Status duplicates) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Target Year */}
                      <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-md">
                          <FileText className="h-4 w-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Target Year</div>
                          <div className="text-sm font-medium text-gray-900">{task?.target_year ? `${task.target_year === 1 ? '1st' : '2nd'} Year` : '—'}</div>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-md">
                          <Calendar className="h-4 w-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Submitted</div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(submission.created_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Last Edited */}
                      <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-md">
                          <Edit className="h-4 w-4 text-purple-700" />
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Last Edited</div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.updated_at ? new Date(submission.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Deadline */}
                      {task?.deadline && (
                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-md ${deadlinePassed ? 'bg-red-100' : 'bg-green-100'}`}>
                            <Clock className={`h-4 w-4 ${deadlinePassed ? 'text-red-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <div className="text-[11px] text-gray-500">Deadline</div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {deadlinePassed ? (
                                <Badge variant="destructive" className="ml-2 text-[10px]">Passed</Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-2 text-[10px]">Active</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    

                    {/* Action Section (no edit button here anymore) */}
                    <div className="flex items-center justify-end pt-1">
                      {deadlinePassed ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md">
                          <AlertCircle className="h-4 w-4" />
                          <span>Cannot Edit</span>
                        </div>
                      ) : submission.status !== 'pending' ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md">
                          <CheckCircle className="h-4 w-4" />
                          <span>Final</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven&apos;t submitted any tasks yet. Browse available tasks and submit your first task.
          </p>
          <Link href="/apply">
            <Button>Browse Tasks</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
