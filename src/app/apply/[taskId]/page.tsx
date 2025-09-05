'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { handleSubmission, canSubmitToTask } from '@/app/actions'
import { useState, useEffect } from 'react'
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
  image_url?: string
  requirements?: string
  deliverables?: string
}

interface SubmissionField {
  id: number
  field_name: string
  field_type: string
  field_label: string
  field_description?: string
  is_required: boolean
  field_options?: Record<string, string | number>
}

interface SubmissionStatus {
  canSubmit: boolean
  canEdit: boolean
  deadlinePassed: boolean
  hasSubmitted: boolean
  existingSubmissionId?: number
  deadline?: string
}

export default function ApplyPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params)
  const [task, setTask] = useState<Task | null>(null)
  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showZoom, setShowZoom] = useState(false)

  useEffect(() => {
    const fetchTaskAndStatus = async () => {
      try {
        // Fetch task details
        const response = await fetch(`/api/tasks/${taskId}`)
        if (response.ok) {
          const taskData = await response.json()
          setTask(taskData)
        }

        // Fetch submission fields
        const fieldsResponse = await fetch(`/api/tasks/${taskId}/submission-fields`)
        if (fieldsResponse.ok) {
          const fieldsData = await fieldsResponse.json()
          setSubmissionFields(fieldsData)
        }

        // Check submission status
        const statusResponse = await canSubmitToTask(Number(taskId))
        setSubmissionStatus(statusResponse)
      } catch (error) {
        console.error('Error fetching task or status:', error)
        toast.error('Failed to load task information')
      } finally {
        setLoading(false)
      }
    }

    fetchTaskAndStatus()
  }, [taskId])

  const handleFormSubmit = async (formData: FormData) => {
    if (!submissionStatus?.canSubmit) {
      toast.error('You cannot submit to this task')
      return
    }

    setIsSubmitting(true)
    try {
      await handleSubmission(formData)
      toast.success('Application submitted successfully!')
      // Refresh submission status
      const statusResponse = await canSubmitToTask(Number(taskId))
      setSubmissionStatus(statusResponse)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-10 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-2xl py-10 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600">Task Not Found</h1>
          <p className="text-muted-foreground mt-2">The task you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/apply" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Available Tasks
          </Link>
        </div>
      </div>
    )
  }

  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const isDeadlinePassed = deadlineDate && deadlineDate < new Date()

  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        {task.image_url && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.image_url}
              alt="Task image thumbnail"
              className="w-full h-48 object-cover rounded border cursor-zoom-in"
              onClick={() => setShowZoom(true)}
            />
          </div>
        )}
        <p className="text-muted-foreground mt-2">{task.description}</p>
        <div className="text-sm text-muted-foreground mt-1">
          {task.domain}{task.subdomain ? ` • ${task.subdomain}` : ''} • Target Year: {task.target_year}
        </div>
        
        {/* Deadline and Status Information */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Deadline: {deadlineDate ? deadlineDate.toLocaleDateString() : 'No deadline set'}
              </span>
            </div>
            
            {submissionStatus && (
              <div className="flex items-center space-x-2">
                {submissionStatus.hasSubmitted ? (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Submitted</span>
                  </Badge>
                ) : isDeadlinePassed ? (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Deadline Passed</span>
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Open</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements & Deliverables */}
      {(task.requirements || task.deliverables) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.requirements && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements & Prerequisites</h3>
                <MarkdownRenderer content={task.requirements} />
              </div>
            )}
            
            {task.deliverables && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expected Deliverables</h3>
                <MarkdownRenderer content={task.deliverables} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Status Messages */}
      {submissionStatus && (
        <div className="space-y-3">
          {submissionStatus.hasSubmitted && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">Already Submitted</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You have already submitted an application for this task.
                      {submissionStatus.canEdit ? (
                        <span> You can edit your submission until the deadline.</span>
                      ) : (
                        <span> The deadline has passed, so you can no longer edit your submission.</span>
                      )}
                    </p>
                    {submissionStatus.canEdit ? (
                      <Link href={`/dashboard/edit/${submissionStatus.existingSubmissionId}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Submission
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard`}>
                        <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                          <Eye className="h-4 w-4 mr-2" />
                          View Submission
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isDeadlinePassed && !submissionStatus.hasSubmitted && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Deadline Passed</h3>
                    <p className="text-sm text-red-700 mt-1">
                      The submission deadline for this task has passed. You can no longer submit applications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Application Form - Only show if user can submit */}
      {submissionStatus?.canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              Submit Application
            </CardTitle>
            <CardDescription>
              Fill out the application form below to submit your application for this task.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleFormSubmit} className="space-y-6">
              <input type="hidden" name="taskId" defaultValue={task.id} />
              
              {/* Custom Submission Fields */}
              {submissionFields && submissionFields.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Application Requirements</h3>
                  <p className="text-sm text-gray-600 mb-4">Please provide the following information:</p>
                  
                  {submissionFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.field_description && (
                        <p className="text-xs text-gray-500">{field.field_description}</p>
                      )}
                      
                      {field.field_type === 'text' && (
                        <Input 
                          name={`field_${field.field_name}`}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'textarea' && (
                        <Textarea 
                          name={`field_${field.field_name}`}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          required={field.is_required}
                          rows={4}
                        />
                      )}
                      
                      {field.field_type === 'number' && (
                        <Input 
                          type="number"
                          name={`field_${field.field_name}`}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'email' && (
                        <Input 
                          type="email"
                          name={`field_${field.field_name}`}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'url' && (
                        <Input 
                          type="url"
                          name={`field_${field.field_name}`}
                          placeholder={`Enter ${field.field_label.toLowerCase()}`}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'select' && field.field_options && (
                        <select 
                          name={`field_${field.field_name}`}
                          required={field.is_required}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select {field.field_label.toLowerCase()}</option>
                          {Object.entries(field.field_options).map(([key, value]) => (
                            <option key={key} value={key}>{String(value)}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.field_type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.field_options && Object.entries(field.field_options).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                name={`field_${field.field_name}[]`}
                                value={key}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{String(value)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.field_type === 'file' && (
                        <input 
                          type="file"
                          name={`field_${field.field_name}`}
                          required={field.is_required}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback to simple submission URL if no custom fields */
                <div className="space-y-2">
                  <label className="text-sm font-medium">Submission URL</label>
                  <Input 
                    name="submissionUrl" 
                    placeholder="https://github.com/username/repo or a public document link" 
                    required 
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Back to Tasks Link */}
      <div className="text-center">
        <Link href="/apply" className="text-blue-600 hover:text-blue-700">
          ← Back to Available Tasks
        </Link>
      </div>
      {showZoom && task.image_url && (
        <ImageLightbox src={task.image_url} alt="Task image" onClose={() => setShowZoom(false)} />
      )}
    </div>
  )
}


