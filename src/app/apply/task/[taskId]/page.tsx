'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, ArrowLeft, FileText, Target, Users } from 'lucide-react'
// Removed direct import of server action
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
      return <Button disabled className="w-full">Loading...</Button>
    }

    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Submission
            </Link>
          </Button>
          {submissionStatus.canEdit && (
            <p className="text-sm text-gray-600 text-center">
              You can edit your submission until the deadline.
            </p>
          )}
        </div>
      )
    }

    if (isDeadlinePassed) {
      return (
        <Button disabled className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          Deadline Passed
        </Button>
      )
    }

    return (
      <Button asChild className="w-full">
        <Link href={`/apply/${taskId}`}>
          Submit Now
        </Link>
      </Button>
    )
  }

  const getStatusMessage = () => {
    if (loading) return null
    
    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Submission Complete</p>
              <p>Your application has been submitted successfully.</p>
            </div>
          </div>
        </div>
      )
    }

    if (isDeadlinePassed && !submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Deadline Passed</p>
              <p>You can no longer submit applications for this task.</p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  if (loading && !task) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Task Not Found</h1>
          <p className="text-gray-600 mb-6">The task you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/apply">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/apply" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Link>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{task.domain}</Badge>
                  {task.subdomain && <Badge variant="outline">{task.subdomain}</Badge>}
                  <Badge variant="secondary">{ordinal(task.target_year)} Year</Badge>
                </div>
              </div>
              
              <div className="ml-4">
                {getActionButton()}
              </div>
            </div>
          </div>

          {/* Task Image */}
          {task.image_url && (
            <Card className="mb-6">
              <CardContent className="p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={task.image_url}
                  alt="Task image"
                  className="w-full h-64 object-cover rounded-t-lg cursor-zoom-in"
                  onClick={() => setShowZoom(true)}
                />
              </CardContent>
            </Card>
          )}

          {showZoom && task.image_url && (
            <ImageLightbox src={task.image_url} alt="Task image" onClose={() => setShowZoom(false)} />
          )}

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={task.description || 'No description provided.'} />
            </CardContent>
          </Card>

          {/* Requirements */}
          {task.requirements && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Requirements & Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={task.requirements} />
              </CardContent>
            </Card>
          )}

          {/* Deliverables */}
          {task.deliverables && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Expected Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={task.deliverables} />
              </CardContent>
            </Card>
          )}

          {/* Task Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Task Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    <strong>Deadline:</strong> {deadlineDate ? deadlineDate.toLocaleDateString() : 'No deadline set'}
                  </span>
                </div>
                {deadlineDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Status:</strong> {getRelativeDeadline()}
                    </span>
                  </div>
                )}
                {task.estimated_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Estimated Duration:</strong> {task.estimated_duration}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Message */}
          {getStatusMessage()}
        </div>
      </div>
    </div>
  )
}
