import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import React from 'react'
import { Edit, Clock, AlertCircle } from 'lucide-react'
import AiReviewRefresher from '@/components/ai-review-refresher'
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
      tasks(title, domain, subdomain, deadline)
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  const typedSubmissions = submissions as SubmissionWithTask[]

  const now = new Date()

  // Determine if any submission is in evaluation
  const isAnyEvaluating = (typedSubmissions || []).some((submission) => submission.ai_score === null || String(submission.ai_review || '').toLowerCase().includes('in progress'))

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* While any submission is evaluating, periodically refresh the page to fetch new AI results */}
      {isAnyEvaluating ? <AiReviewRefresher /> : null}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-gray-600">Track your submissions and view AI feedback</p>
      </div>

      {typedSubmissions && typedSubmissions.length > 0 ? (
        <div className="space-y-6">
          {typedSubmissions.map((submission) => {
            // Check if deadline has passed
            const task = submission.tasks?.[0]
            const deadline = task?.deadline ? new Date(task.deadline) : null
            const deadlinePassed = deadline ? deadline < now : false
            const canEdit = submission.status === 'pending' && !deadlinePassed
            
            return (
              <div key={submission.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {task?.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span><strong>Domain:</strong> {task?.domain}</span>
                      {task?.subdomain && (
                        <span><strong>Subdomain:</strong>
                          {task?.subdomain}
                        </span>
                      )}
                      <span><strong>Submitted:</strong> {new Date(submission.created_at!).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Deadline Information */}
                    {task?.deadline && (
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                        </span>
                        {deadlinePassed ? (
                          <Badge variant="destructive" className="text-xs">
                            Deadline Passed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-3"></div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={
                        submission.status === 'shortlisted' ? 'default' : 
                        submission.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {submission.status}
                    </Badge>
                    
                    {/* Edit Button */}
                    {canEdit ? (
                      <Link href={`/dashboard/edit/${submission.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    ) : deadlinePassed ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>Deadline passed</span>
                      </div>
                    ) : submission.status !== 'pending' ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Already reviewed</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                
                {/* AI review is hidden for applicants */}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven&apos;t submitted any applications yet. Browse available positions and submit your first application.
          </p>
          <Link href="/apply">
            <Button>Browse Positions</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
