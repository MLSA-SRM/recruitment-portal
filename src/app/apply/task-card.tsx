'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, Eye } from 'lucide-react'
import { canSubmitToTask } from '@/app/actions'
import { toast } from 'sonner'
import ImageLightbox from '@/components/image-lightbox'

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

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showZoom, setShowZoom] = useState(false)

  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      try {
        const status = await canSubmitToTask(task.id)
        setSubmissionStatus(status)
      } catch (error) {
        console.error('Error fetching submission status:', error)
        toast.error('Failed to load submission status')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissionStatus()
  }, [task.id])

  function normalizeDeadlineToEndOfDay(dateLike: string): Date {
    const base = new Date(dateLike)
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)
  }

  const deadlineDate = task.deadline ? normalizeDeadlineToEndOfDay(task.deadline) : null
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

  const getStatusBadge = () => {
    if (loading) return null
    
    if (submissionStatus?.hasSubmitted) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Submitted</span>
        </Badge>
      )
    } else if (isDeadlinePassed) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Deadline Passed</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Open</span>
        </Badge>
      )
    }
  }

  const getActionButton = () => {
    if (loading) {
      return (
        <Button className="w-full" disabled>
          Loading...
        </Button>
      )
    }

    if (submissionStatus?.hasSubmitted) {
      if (submissionStatus.canEdit) {
        return (
          <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Edit className="h-4 w-4 mr-2" />
              <span>Edit Submission</span>
            </Button>
          </Link>
        )
      } else {
        return (
          <Link href={`/dashboard`}>
            <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
              <Eye className="h-4 w-4 mr-2" />
              <span>View Submission</span>
            </Button>
          </Link>
        )
      }
    }

    if (isDeadlinePassed) {
      return (
        <Button className="w-full" disabled>
          Deadline Passed
        </Button>
      )
    }

    if (submissionStatus?.canSubmit) {
      return (
        <Link href={`/apply/${task.id}`}>
          <Button className="w-full">
            Submit Task
          </Button>
        </Link>
      )
    }

    return (
      <Button className="w-full" disabled>
        Cannot Apply
      </Button>
    )
  }

  const getStatusMessage = () => {
    if (loading) return null

    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Already Submitted</p>
              {submissionStatus.canEdit ? (
                <p>You can edit your submission until the deadline.</p>
              ) : (
                <p>The deadline has passed, so you can no longer edit your submission.</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (isDeadlinePassed && !submissionStatus?.hasSubmitted) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
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

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all overflow-hidden">
      {task.image_url && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.image_url}
            alt="Task image thumbnail"
            className="w-full h-48 object-cover cursor-zoom-in"
            onClick={() => setShowZoom(true)}
          />
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        </div>
      )}
      {showZoom && task.image_url && (
        <ImageLightbox src={task.image_url} alt="Task image" onClose={() => setShowZoom(false)} />
      )}
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{task.title}</h3>

        <p className="text-gray-600 line-clamp-3">
          {task.description || 'No description provided.'}
        </p>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {task.domain && (<Badge variant="secondary">{task.domain}</Badge>)}
            {task.subdomain && (<Badge variant="outline">{task.subdomain}</Badge>)}
            <Badge variant="secondary">{ordinal(task.target_year)} Year</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            {deadlineDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
              </div>
            )}
            {deadlineDate && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{getRelativeDeadline()}</span>
              </div>
            )}
          </div>

          {(task.requirements || task.deliverables) && (
            <div className="rounded-md border bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {task.requirements && (
                <p><span className="font-medium">Requirements:</span> {task.requirements.length > 120 ? `${task.requirements.slice(0, 120)}…` : task.requirements}</p>
              )}
              {task.deliverables && (
                <p className="mt-1"><span className="font-medium">Deliverables:</span> {task.deliverables.length > 120 ? `${task.deliverables.slice(0, 120)}…` : task.deliverables}</p>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          {getActionButton()}
        </div>

        <div className="pt-1">
          {getStatusMessage()}
        </div>
      </div>
    </div>
  )
}
