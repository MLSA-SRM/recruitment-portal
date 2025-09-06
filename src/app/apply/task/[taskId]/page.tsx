'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, ArrowLeft, FileText, Target, Users, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { use } from 'react'
import ImageLightbox from '@/components/image-lightbox'
import MarkdownRenderer from '@/components/markdown-renderer'

interface Task {
  id: number
  title: string
  description: string
  domain: string
  subdomain: string
  target_year: number
  deadline: string
  created_at: string
  image_url?: string
  estimated_duration?: string
  requirements?: string
  deliverables?: string
}

interface SubmissionStatus {
  canSubmit: boolean
  canEdit: boolean
  deadlinePassed: boolean
  hasSubmitted: boolean
  existingSubmissionId?: number
  deadline?: string
}

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params)
  const [task, setTask] = useState<Task | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showZoom, setShowZoom] = useState(false)

  useEffect(() => {
    const loadTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`)
        if (!response.ok) {
          throw new Error('Task not found')
        }
        const taskData = await response.json()
        setTask(taskData)
      } catch (error) {
        console.error('Error loading task:', error)
        toast.error('Failed to load task details')
      }
    }

    const fetchSubmissionStatus = async () => {
      try {
        const response = await fetch(`/api/submission-status?taskId=${taskId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch submission status')
        }
        const status = await response.json()
        setSubmissionStatus(status)
      } catch (error) {
        console.error('Error fetching submission status:', error)
        toast.error('Failed to load submission status')
      } finally {
        setLoading(false)
      }
    }

    loadTask()
    fetchSubmissionStatus()
  }, [taskId])

  function normalizeDeadlineToEndOfDay(dateLike: string): Date {
    const base = new Date(dateLike)
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)
  }

  const deadlineDate = task?.deadline ? normalizeDeadlineToEndOfDay(task.deadline) : null
  const isDeadlinePassed = deadlineDate ? deadlineDate < new Date() : false

  const getRelativeDeadline = () => {
    if (!deadlineDate) return null
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msPerDay = 24 * 60 * 60 * 1000
    const diffDays = Math.floor((deadlineDate.getTime() - startOfToday.getTime()) / msPerDay)
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  function ordinal(n: number) {
    const s = ["th","st","nd","rd"]
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const getActionButton = () => {
    if (loading) {
      return <Skeleton className="h-10 w-full" />
    }

    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Your Application
            </Link>
          </Button>
          {submissionStatus.canEdit && (
            <p className="text-xs text-gray-600 text-center">
              You can edit until the deadline
            </p>
          )}
        </div>
      )
    }

    if (isDeadlinePassed) {
      return (
        <Button disabled className="w-full" variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Application Closed
        </Button>
      )
    }

    return (
      <Button asChild className="w-full">
        <Link href={`/apply/${taskId}`}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Submit Task
        </Link>
      </Button>
    )
  }

  const getStatusMessage = () => {
    if (loading) return null
    
    if (submissionStatus?.hasSubmitted) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Submission Complete!</strong> Your application has been submitted successfully.
          </AlertDescription>
        </Alert>
      )
    }

    if (isDeadlinePassed && !submissionStatus?.hasSubmitted) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Deadline Passed</strong> - You can no longer submit applications for this task.
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  if (loading && !task) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Skeleton */}
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
              </div>
              
              {/* Sidebar Skeleton */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-gray-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
              <p className="text-gray-600 mb-8">The task you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link href="/apply">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tasks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <nav>
            <Link href="/apply" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Tasks
            </Link>
          </nav>

          {/* Status Message */}
          {getStatusMessage() && (
            <div>
              {getStatusMessage()}
            </div>
          )}

          {/* Main Card */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">{task.title}</h1>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                      {task.domain}
                    </Badge>
                    {task.subdomain && (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-3 py-1">
                        {task.subdomain}
                      </Badge>
                    )}
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                      {ordinal(task.target_year)} Year
                    </Badge>
                  </div>

                  {/* Key Info */}
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                    {deadlineDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Due {deadlineDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.estimated_duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{task.estimated_duration}</span>
                      </div>
                    )}
                    {deadlineDate && (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDeadlinePassed 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {getRelativeDeadline()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Task Image */}
              {task.image_url && (
                <div className="overflow-hidden rounded-xl border bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={task.image_url}
                    alt="Task image"
                    className="w-full h-64 sm:h-80 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                    onClick={() => setShowZoom(true)}
                  />
                </div>
              )}

              {showZoom && task.image_url && (
                <ImageLightbox src={task.image_url} alt="Task image" onClose={() => setShowZoom(false)} />
              )}

              {/* Content Sections */}
              <div className="grid gap-8">
                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    About This Task
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                      <MarkdownRenderer content={task.description || 'No description provided.'} />
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {task.requirements && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Target className="h-5 w-5 text-orange-600" />
                      </div>
                      What You Need to Know
                    </h2>
                    <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                      <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                        <MarkdownRenderer content={task.requirements} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {task.deliverables && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      What You&apos;ll Deliver
                    </h2>
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                        <MarkdownRenderer content={task.deliverables} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Summary */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    Task Summary
                  </h2>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Domain */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">Domain</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{task.domain}</p>
                      </div>

                      {/* Subdomain */}
                      {task.subdomain && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-purple-700 uppercase tracking-wide">Subdomain</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{task.subdomain}</p>
                        </div>
                      )}

                      {/* Target Year */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-green-700 uppercase tracking-wide">Target Year</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{ordinal(task.target_year)}</p>
                      </div>

                      {/* Deadline */}
                      {deadlineDate && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium text-orange-700 uppercase tracking-wide">Deadline</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{deadlineDate.toLocaleDateString()}</p>
                        </div>
                      )}

                      {/* Duration */}
                      {task.estimated_duration && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <Clock className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-indigo-700 uppercase tracking-wide">Duration</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{task.estimated_duration}</p>
                        </div>
                      )}

                      {/* Status */}
                      {deadlineDate && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${isDeadlinePassed ? 'bg-red-100' : 'bg-green-100'}`}>
                              <div className={`h-4 w-4 rounded-full ${isDeadlinePassed ? 'bg-red-500' : 'bg-green-500'}`} />
                            </div>
                            <span className={`text-sm font-medium uppercase tracking-wide ${isDeadlinePassed ? 'text-red-700' : 'text-green-700'}`}>Status</span>
                          </div>
                          <p className={`text-lg font-semibold ${isDeadlinePassed ? 'text-red-600' : 'text-green-600'}`}>
                            {isDeadlinePassed ? 'Closed' : 'Open'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1 h-12 text-base">
              <Link href="/apply">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse More Tasks
              </Link>
            </Button>
            
            {!submissionStatus?.hasSubmitted && !isDeadlinePassed && (
              <Button asChild className="flex-1 sm:flex-none sm:w-56 h-12 text-base">
                <Link href={`/apply/${taskId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Submit Task
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
