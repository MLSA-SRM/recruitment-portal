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
  const [relativeDeadline, setRelativeDeadline] = useState<string>('')
  const [isDeadlinePassed, setIsDeadlinePassed] = useState<boolean>(false)
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

  // Calculate relative deadline and deadline status on client side to prevent hydration mismatch
  useEffect(() => {
    if (deadlineDate) {
      const getRelativeDeadline = () => {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const msPerDay = 24 * 60 * 60 * 1000
        const diffDays = Math.floor((deadlineDate.getTime() - startOfToday.getTime()) / msPerDay)
        if (diffDays < 0) return 'Overdue'
        if (diffDays === 0) return 'Due today'
        if (diffDays === 1) return 'Due tomorrow'
        return `Due in ${diffDays} days`
      }
      
      setRelativeDeadline(getRelativeDeadline())
      setIsDeadlinePassed(deadlineDate < new Date())
    }
  }, [deadlineDate])

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
        <Button size="sm" className="w-full h-10 font-medium" disabled>
          Loading...
        </Button>
      )
    }

    if (submissionStatus?.hasSubmitted) {
      if (submissionStatus.canEdit) {
        return (
          <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
            <Button size="sm" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Edit className="h-4 w-4 mr-2" />
              <span>Edit Submission</span>
            </Button>
          </Link>
        )
      } else {
        return (
          <Link href={`/dashboard`}>
            <Button size="sm" className="w-full h-10 bg-gray-600 hover:bg-gray-700 text-white font-medium">
              <Eye className="h-4 w-4 mr-2" />
              <span>View Submission</span>
            </Button>
          </Link>
        )
      }
    }

    if (isDeadlinePassed) {
      return (
        <Button size="sm" className="w-full h-10 font-medium" disabled>
          Deadline Passed
        </Button>
      )
    }

    if (submissionStatus?.canSubmit) {
      return (
        <Link href={`/apply/${task.id}`}>
          <Button size="sm" className="w-full h-10 font-medium">
            Submit Task
          </Button>
        </Link>
      )
    }

    return (
      <Button size="sm" className="w-full h-10 font-medium" disabled>
        Cannot Submit
      </Button>
    )
  }

  const getStatusMessage = () => {
    if (loading) return null

    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Already Submitted</p>
              {submissionStatus.canEdit ? (
                <p className="text-blue-600">You can edit your submission until the deadline.</p>
              ) : (
                <p className="text-blue-600">The deadline has passed, so you can no longer edit your submission.</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (isDeadlinePassed && !submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-semibold mb-1">Deadline Passed</p>
              <p className="text-red-600">You can no longer submit applications for this task.</p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden">
      {task.image_url && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.image_url}
            alt="Task image thumbnail"
            className="w-full h-48 object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
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
      
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
            {task.title}
          </h3>
          
          <p className="text-gray-600 line-clamp-3 leading-relaxed text-sm">
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Tags Section */}
        <div className="flex flex-wrap gap-2">
          {task.domain && (
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
              {task.domain}
            </Badge>
          )}
          {task.subdomain && (
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-gray-300">
              {task.subdomain}
            </Badge>
          )}
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            {ordinal(task.target_year)} Year
          </Badge>
        </div>

        {/* Timeline Section */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {deadlineDate && (
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Deadline:</span>
                <span className="ml-1">{deadlineDate.toLocaleDateString()}</span>
              </div>
            )}
            {deadlineDate && relativeDeadline && (
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Status:</span>
                <span className="ml-1">{relativeDeadline}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-4 pt-2">
          <Link href={`/apply/${task.id}`}>
            <Button variant="outline" size="sm" className="w-full h-10 font-medium">
              <Eye className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </Link>
          
          {getActionButton()}
        </div>

        {/* Status Message Section */}
        <div className="pt-2">
          {getStatusMessage()}
        </div>
      </div>
    </div>
  )
}
