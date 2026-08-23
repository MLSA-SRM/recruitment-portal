'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, AlertCircle, Edit, Eye, ExternalLink, Target } from 'lucide-react'
import { toast } from 'sonner'
import ImageLightbox from '@/components/image-lightbox'
import { getDomainColor } from '@/lib/constants'

interface Task {
  id: number
  title: string
  description: string
  domain: string
  subdomain: string
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
        const response = await fetch(`/api/submission-status?taskId=${task.id}`)
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

  const getStatusBadge = () => {
    if (loading) return null
    
    if (submissionStatus?.hasSubmitted) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1 bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm">
          <CheckCircle className="h-3 w-3" />
          <span className="font-medium">Submitted</span>
        </Badge>
      )
    } else if (isDeadlinePassed) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm">
          <Clock className="h-3 w-3" />
          <span className="font-medium">Closed</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center space-x-1 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors shadow-sm">
          <Clock className="h-3 w-3" />
          <span className="font-medium">Open</span>
        </Badge>
      )
    }
  }

  const getActionButton = () => {
    if (loading) {
      return (
        <Button size="sm" className="w-full h-10 font-medium" disabled>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </Button>
      )
    }

    if (submissionStatus?.hasSubmitted) {
      if (submissionStatus.canEdit) {
        return (
          <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
            <Button size="sm" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Submission</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </Link>
        )
      } else {
        return (
          <Link href={`/dashboard`}>
            <Button size="sm" className="w-full h-10 bg-slate-600 hover:bg-slate-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200">
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Submission</span>
              <span className="sm:hidden">View</span>
            </Button>
          </Link>
        )
      }
    }

    if (isDeadlinePassed) {
      return (
        <Button size="sm" className="w-full h-10 font-medium" disabled variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Deadline Passed</span>
          <span className="sm:hidden">Closed</span>
        </Button>
      )
    }

    if (submissionStatus?.canSubmit) {
      return (
        <Link href={`/apply/${task.id}`}>
          <Button size="sm" className="w-full h-10 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200">
            <Target className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Submit Task</span>
            <span className="sm:hidden">Submit</span>
          </Button>
        </Link>
      )
    }

    return (
      <Button size="sm" className="w-full h-10 font-medium" disabled variant="outline">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Cannot Submit</span>
        <span className="sm:hidden">Cannot Submit</span>
      </Button>
    )
  }

  const getStatusMessage = () => {
    if (loading) return null

    if (submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-semibold mb-1">Submission Complete</p>
              {submissionStatus.canEdit ? (
                <p className="text-green-600">You can edit your submission until the deadline.</p>
              ) : (
                <p className="text-green-600">The deadline has passed, so you can no longer edit your submission.</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (isDeadlinePassed && !submissionStatus?.hasSubmitted) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
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

  const domainColor = getDomainColor(task.domain)

  return (
    <Card className={`group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 ${domainColor.border}`}>
      {/* Image Section */}
      {task.image_url && (
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.image_url}
            alt="Task image thumbnail"
            className="w-full h-48 object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-110"
            onClick={() => setShowZoom(true)}
          />
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      {showZoom && task.image_url && (
        <ImageLightbox src={task.image_url} alt="Task image" onClose={() => setShowZoom(false)} />
      )}

      {/* Card Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {task.title}
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground line-clamp-3 leading-relaxed">
              {task.description || 'No description provided.'}
            </CardDescription>
          </div>
          {!task.image_url && (
            <div className="flex-shrink-0">
              {getStatusBadge()}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="flex-1 space-y-4">
        {/* Tags Section */}
        <div className="flex flex-wrap gap-2">
          {task.domain && (
            <Badge variant="secondary" className={`px-3 py-1 text-xs font-medium transition-colors ${domainColor.badge}`}>
              <Target className="h-3 w-3 mr-1" />
              {task.domain}
            </Badge>
          )}
          {task.subdomain && (
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-border hover:bg-accent transition-colors">
              {task.subdomain}
            </Badge>
          )}
        </div>

        {/* Timeline Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {deadlineDate && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground/70" />
                <span className="font-medium">Deadline:</span>
                <span className="ml-1 font-mono text-xs">{deadlineDate.toLocaleDateString()}</span>
              </div>
            )}
            {deadlineDate && relativeDeadline && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground/70" />
                <span className="font-medium">Status:</span>
                <span className={`ml-1 font-medium ${
                  isDeadlinePassed ? 'text-destructive' : 
                  relativeDeadline.includes('today') || relativeDeadline.includes('tomorrow') ? 'text-orange-600' : 
                  'text-green-600'
                }`}>
                  {relativeDeadline}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Message Section */}
        {getStatusMessage()}
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="pt-4 border-t bg-muted/30">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
          <Link href={`/apply/task/${task.id}`} className="block">
            <Button variant="outline" size="sm" className="w-full h-10 font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Full Details</span>
              <span className="sm:hidden">View Details</span>
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Link>
          
          {getActionButton()}
        </div>
      </CardFooter>
    </Card>
  )
}
