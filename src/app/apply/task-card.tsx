'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, Eye } from 'lucide-react'
import { canSubmitToTask } from '@/app/actions'
import { toast } from 'sonner'

interface Task {
  id: number
  title: string
  description: string
  domain: string
  subdomain: string
  target_year: number
  deadline: string
  created_at: string
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

  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const isDeadlinePassed = deadlineDate && deadlineDate < new Date()

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
            Apply Now
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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
        {getStatusBadge()}
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">
        {task.description || 'No description provided.'}
      </p>
      
      <div className="space-y-2 mb-4">
        {task.subdomain && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Subdomain:</span>
            <span className="ml-2">{task.subdomain}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">Target Year:</span>
          <span className="ml-2">{task.target_year}</span>
        </div>
        {deadlineDate && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-medium">Deadline:</span>
            <span className="ml-2">{deadlineDate.toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {getActionButton()}
      
      {getStatusMessage()}
    </div>
  )
}
