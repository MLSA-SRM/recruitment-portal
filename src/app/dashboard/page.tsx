import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import React from 'react'
import { Edit, Clock, AlertCircle, Calendar, CheckCircle, FileText, Target, Users, Eye, User, MessageCircle, Circle } from 'lucide-react'
import { SubmissionWithTask } from '@/lib/types'
import { formatDateForDisplay, isDeadlinePassed } from '@/lib/date-utils'
import { WHATSAPP_GROUP_URL, DOMAIN_SUBDOMAINS, getDomainColor, type Domain } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-destructive">Authentication Required</h1>
                <p className="text-muted-foreground mt-2">You need to be signed in to view your dashboard.</p>
              </div>
              <Link href="/auth/signin">
                <Button className="mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has completed onboarding
  const { data: authCheck } = await supabase
    .from('auth_check')
    .select('is_onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!authCheck?.is_onboarding_complete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-orange-800">Profile Setup Required</h1>
                <p className="text-orange-700 mt-2">Please complete your profile setup to access the dashboard.</p>
              </div>
              <Link href="/profile/setup">
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                  <User className="h-4 w-4 mr-2" />
                  Complete Profile Setup
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get user profile for dashboard display
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-destructive">Profile Not Found</h1>
                <p className="text-muted-foreground mt-2">Your profile could not be found. Please contact support.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get user submissions
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
      tasks!submissions_task_id_fkey(title, domain, subdomain, target_year, deadline)
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  const typedSubmissions = submissions as SubmissionWithTask[]

  // Which domains the applicant is interested in (supports legacy single-value profiles too)
  const interestedDomains: string[] = profile.domains && profile.domains.length > 0
    ? profile.domains
    : (profile.domain ? [profile.domain] : [])
  const interestedSubdomains: string[] = profile.subdomains && profile.subdomains.length > 0
    ? profile.subdomains
    : (profile.subdomain ? [profile.subdomain] : [])

  const submittedDomains = new Set(
    (typedSubmissions || []).map((s) => {
      const rawTask = s.tasks as unknown
      const t = Array.isArray(rawTask) ? rawTask[0] : rawTask
      return (t as { domain?: string } | null)?.domain
    }).filter(Boolean)
  )

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span>My Dashboard</span>
          </CardTitle>
          <CardDescription>
            Track your submissions and monitor your progress across all tasks
          </CardDescription>
        </CardHeader>
      </Card>

      {interestedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              <span>Your Domains</span>
            </CardTitle>
            <CardDescription>
              You need at least one submission per domain you&apos;re interested in. Pick any of your subdomains within that domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interestedDomains.map((domain) => {
              const color = getDomainColor(domain)
              const subdomainsInDomain = DOMAIN_SUBDOMAINS[domain as Domain] || []
              const mySubdomainsHere = interestedSubdomains.filter((s) => subdomainsInDomain.includes(s))
              const hasSubmittedThisDomain = submittedDomains.has(domain)

              return (
                <div key={domain} className={`rounded-lg border p-4 space-y-3 ${color.soft}`}>
                  <div className="flex items-center justify-between">
                    <Badge className={`${color.badge} font-semibold`}>{domain}</Badge>
                    {hasSubmittedThisDomain ? (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-600">
                        <Circle className="h-3 w-3" />
                        Not yet
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mySubdomainsHere.map((sub) => (
                      <Badge key={sub} variant="outline" className="text-xs bg-white/70">{sub}</Badge>
                    ))}
                  </div>
                  {!hasSubmittedThisDomain && (
                    <Link href="/apply">
                      <Button size="sm" variant="outline" className="w-full bg-white/70 hover:bg-white">
                        <Target className="h-3.5 w-3.5 mr-1.5" />
                        Browse {domain} Tasks
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {typedSubmissions && typedSubmissions.length > 0 ? (
        <div className="space-y-4">
          {typedSubmissions.map((submission) => {
            // Normalize task relation (can be object or single-item array depending on PostgREST)
            const rawTask = submission.tasks as unknown
            const task = Array.isArray(rawTask) ? rawTask[0] : (rawTask as (typeof submission.tasks extends Array<infer T> ? T : { title?: string; domain?: string; subdomain?: string; target_year?: number; deadline?: string }) | null)
            const deadlinePassed = task?.deadline ? isDeadlinePassed(task.deadline) : false
            const canEdit = submission.status === 'pending' && !deadlinePassed
            
            return (
              <Card key={submission.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {task?.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {task?.domain}{task?.subdomain ? ` • ${task.subdomain}` : ''}
                      </CardDescription>
                    </div>
                    
                    {/* Header Actions */}
                    <div className="ml-4 flex-shrink-0">
                      {canEdit ? (
                        <Link href={`/dashboard/edit/${submission.id}`}>
                          <Button size="sm" variant="outline" className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary transition-colors">
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                      ) : (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          {submission.status === 'pending' ? (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>Pending</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              <span>Reviewed</span>
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Submission Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Target Year */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-md">
                          <Users className="h-4 w-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Target Year</div>
                          <div className="text-sm font-medium text-foreground">
                            {task?.target_year ? `${task.target_year === 1 ? '1st' : task.target_year === 2 ? '2nd' : task.target_year === 3 ? '3rd' : `${task.target_year}th`} Year` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-md">
                          <Calendar className="h-4 w-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Submitted</div>
                          <div className="text-sm font-medium text-foreground">
                            {new Date(submission.created_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Last Edited */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-md">
                          <Edit className="h-4 w-4 text-purple-700" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Last Edited</div>
                          <div className="text-sm font-medium text-foreground">
                            {submission.updated_at ? new Date(submission.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Deadline */}
                      {task?.deadline && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-md ${deadlinePassed ? 'bg-red-100' : 'bg-green-100'}`}>
                            <Clock className={`h-4 w-4 ${deadlinePassed ? 'text-red-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Deadline</div>
                            <div className="text-sm font-medium text-foreground">
                              {formatDateForDisplay(task.deadline)}
                              {deadlinePassed ? (
                                <Badge variant="destructive" className="ml-2 text-xs">Passed</Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Information */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {deadlinePassed ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Deadline Passed</span>
                          </Badge>
                        ) : submission.status !== 'pending' ? (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            <span>Final Submission</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                            <Clock className="h-3 w-3" />
                            <span>Pending Review</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You haven&apos;t submitted any tasks yet. Browse available tasks and submit your first task to get started.
                </p>
              </div>
              <Link href="/apply">
                <Button className="mt-4">
                  <Target className="h-4 w-4 mr-2" />
                  Browse Available Tasks
                </Button>
              </Link>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Have questions or facing issues?</p>
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Join our WhatsApp group
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}