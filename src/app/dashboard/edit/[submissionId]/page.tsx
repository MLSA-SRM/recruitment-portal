'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { redirectWithRefresh } from '@/lib/redirect-utils'
import { toast } from 'sonner'
import { formatDeadlineForDisplay } from '@/lib/date-utils'

interface SubmissionField {
  id: number
  field_name: string
  field_type: string
  field_label: string
  field_description: string
  is_required: boolean
  field_options?: string[]
  validation_rules?: Record<string, unknown>
  display_order: number
}

interface Task {
  id: number
  title: string
  description: string | null
  domain: string
  subdomain: string | null
  deadline: string | null
}

interface Submission {
  id: number
  submission_url: string
  status: string
  created_at: string
  updated_at: string
}

interface StructuredFieldValue {
  label?: string
  type?: string
  value?: string
}

type StructuredSubmissionData = Record<string, StructuredFieldValue>

interface SubmissionWithData extends Submission {
  submission_data?: StructuredSubmissionData
}

export default function EditSubmissionPage() {
  const params = useParams<{ submissionId: string }>()
  const submissionId = params?.submissionId
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [canEdit, setCanEdit] = useState(false)
  const [deadlinePassed, setDeadlinePassed] = useState(false)

  useEffect(() => {
    if (!submissionId) return

    const loadSubmissionData = async () => {
      try {
        const supabase = createSupabaseClient()

        // Get submission details
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select(`
            *,
            tasks(*)
          `)
          .eq('id', submissionId)
          .single()

        if (submissionError) throw submissionError
        if (!submissionData) throw new Error('Submission not found')

        setSubmission(submissionData)
        setTask(submissionData.tasks)

        // Check if deadline has passed
        if (submissionData.tasks?.deadline) {
          const deadline = new Date(submissionData.tasks.deadline)
          const now = new Date()
          const passed = deadline < now
          setDeadlinePassed(passed)
          setCanEdit(!passed && submissionData.status === 'pending')
        }

        // Get submission fields for this task
        const { data: fields, error: fieldsError } = await supabase
          .from('submission_fields')
          .select('*')
          .eq('task_id', submissionData.task_id)
          .order('display_order')

        if (!fieldsError && fields) {
          setSubmissionFields(fields)

          // Initialize form data with current submission values
          const initialData: Record<string, string> = {}
          const submissionDataMap = (submissionData as SubmissionWithData)?.submission_data || {}
          fields.forEach(field => {
            const key = `field_${field.field_name}`
            const fromStructured = submissionDataMap?.[field.field_name]?.value
            if (typeof fromStructured === 'string' && fromStructured.length > 0) {
              initialData[key] = fromStructured
            } else if (field.field_type === 'url') {
              // Fallback to legacy submission_url when appropriate
              initialData[key] = submissionData.submission_url || ''
            } else {
              initialData[key] = ''
            }
          })
          console.log('Initializing form data with fields:', fields.length, 'initialData:', initialData)
          setFormData(initialData)
        } else {
          // No custom fields - initialize with fallback submission URL
          setSubmissionFields([])
          setFormData({
            submissionUrl: submissionData.submission_url || ''
          })
        }

      } catch (error) {
        console.error('Error loading submission data:', error)
        toast.error('Failed to load submission data')
      } finally {
        setIsLoading(false)
      }
    }

    loadSubmissionData()
  }, [submissionId])

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (submissionFields.length > 0) {
      // Validate custom submission fields
      submissionFields.forEach(field => {
        if (field.is_required && (!formData[`field_${field.field_name}`] || formData[`field_${field.field_name}`].trim() === '')) {
          newErrors[`field_${field.field_name}`] = `${field.field_label} is required`
        }
      })
      
      // Only validate URL if there are URL-type fields
      const hasUrlFields = submissionFields.some(field => field.field_type === 'url')
      if (hasUrlFields) {
        const urlField = submissionFields.find(field => field.field_type === 'url')
        if (urlField && (!formData[`field_${urlField.field_name}`] || formData[`field_${urlField.field_name}`].trim() === '')) {
          newErrors[`field_${urlField.field_name}`] = `${urlField.field_label} is required`
        }
      }
    } else {
      // Validate fallback submission URL field
      if (!formData.submissionUrl || formData.submissionUrl.trim() === '') {
        newErrors.submissionUrl = 'Submission URL is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !canEdit) return
    
    setIsSubmitting(true)
    
    try {
      const supabase = createSupabaseClient()
      
      // Get the main submission URL from form data
      let submissionUrl = ''
      const hasUrlFieldsInSubmission = submissionFields.some(field => field.field_type === 'url')
      
      if (submissionFields.length > 0 && hasUrlFieldsInSubmission) {
        // Use custom submission fields that are URL type
        submissionFields.forEach(field => {
          if (field.field_type === 'url') {
            const value = formData[`field_${field.field_name}`]
            if (value && typeof value === 'string') {
              submissionUrl = value
            }
          }
        })
        // Heuristic: if no explicit url-type field provided value, look for fields labeled like a URL
        if (!submissionUrl) {
          const probableUrlField = submissionFields.find(f => {
            const label = (f.field_label || f.field_name || '').toLowerCase()
            return /github|url|link/.test(label)
          })
          if (probableUrlField) {
            const val = formData[`field_${probableUrlField.field_name}`]
            if (val && typeof val === 'string') submissionUrl = val.trim()
          }
        }
      } else if (submissionFields.length > 0 && !hasUrlFieldsInSubmission) {
        // Custom fields exist but no URL fields - use existing submission URL
        submissionUrl = submission?.submission_url || ''
      } else {
        // No custom fields - use fallback submission URL field
        submissionUrl = (formData.submissionUrl || submission?.submission_url || '').trim()
      }

      // Basic validation: require non-empty URL only if there are URL fields or no custom fields
      const shouldRequireUrl = hasUrlFieldsInSubmission || submissionFields.length === 0
      
      if (shouldRequireUrl && (!submissionUrl || submissionUrl.trim() === '')) {
        toast.error('Please provide a valid submission URL')
        setIsSubmitting(false)
        return
      }

      // Basic URL format validation only if URL is provided
      if (submissionUrl && submissionUrl.trim() !== '') {
        try {
          new URL(submissionUrl)
        } catch {
          toast.error('Please provide a valid URL format (e.g., https://github.com/username/repo)')
          setIsSubmitting(false)
          return
        }
      }

      console.log('Updating submission with URL:', submissionUrl)
      console.log('Submission ID:', submissionId)

      // Build structured submission_data from fields + existing
      const existingStructured: StructuredSubmissionData = (submission as SubmissionWithData)?.submission_data || {}
      const newStructured: StructuredSubmissionData = { ...existingStructured }
      if (submissionFields.length > 0) {
        submissionFields.forEach(field => {
          const key = field.field_name
          const value = (formData[`field_${field.field_name}`] || '').toString().trim()
          newStructured[key] = {
            label: field.field_label,
            type: field.field_type,
            value
          }
        })
      }

      // Update the submission
      const { data, error } = await supabase
        .from('submissions')
        .update({ 
          submission_url: submissionUrl,
          submission_data: newStructured,
          updated_at: new Date().toISOString()
        })
        .eq('id', Number(submissionId))
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        throw new Error(`Database update failed: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No rows were updated. Submission may not exist or you may not have permission.')
      }

      console.log('Submission updated successfully:', data)

      // Trigger server-side AI review (fire-and-forget) and navigate immediately
      try {
        fetch(`/api/submissions/${submissionId}/trigger-ai`, { method: 'POST' })
        console.log('Triggered server-side AI review')
      } catch (triggerError) {
        console.error('Failed to trigger server-side AI review:', triggerError)
      }

      toast.success('Submission updated successfully!')
      redirectWithRefresh('/dashboard', 1000, 'Submission updated successfully!')
      
    } catch (error) {
      console.error('Error updating submission:', error)
      
      // Better error message handling
      let errorMessage = 'Failed to update submission'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (!task || !submission) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Submission Not Found</h3>
          <p className="text-gray-600 mb-4">The submission you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (deadlinePassed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-400 text-4xl mb-4">⏰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Deadline Passed</h3>
          <p className="text-gray-600 mb-4">
            The deadline for this task has passed. You can no longer edit your submission.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-orange-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cannot Edit Submission</h3>
          <p className="text-gray-600 mb-4">
            This submission cannot be edited as it has already been reviewed or the deadline has passed.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold">Edit Submission</h1>
      </div>

      {/* Task Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Domain:</strong> {task.domain}
            </div>
            {task.subdomain && (
              <div>
                <strong>Subdomain:</strong> {task.subdomain}
              </div>
            )}
            <div>
              <strong>Deadline:</strong> {task.deadline ? formatDeadlineForDisplay(task.deadline) : 'No deadline'}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge className="ml-2" variant={submission.status === 'pending' ? 'secondary' : 'default'}>
                {submission.status}
              </Badge>
            </div>
            <div>
              <strong>Submitted:</strong> {new Date(submission.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Warning */}
      {task.deadline && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {(() => {
                  const d = new Date(task.deadline)
                  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
                  return `Deadline: ${end.toLocaleDateString()} at 23:59`
                })()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Submission</CardTitle>
          <CardDescription>
            Make changes to your submission. You can only edit until the deadline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {submissionFields.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Found {submissionFields.length} custom submission field{submissionFields.length > 1 ? 's' : ''} for this task.
                  {!submissionFields.some(field => field.field_type === 'url') && (
                    <span className="block mt-1 text-blue-600">
                      Note: This task doesn&apos;t require a URL submission.
                    </span>
                  )}
                </div>
                {submissionFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.field_type === 'url' ? (
                    <Input
                      type="url"
                      value={formData[`field_${field.field_name}`] || ''}
                      onChange={(e) => handleInputChange(`field_${field.field_name}`, e.target.value)}
                      placeholder={field.field_description || `Enter ${field.field_label.toLowerCase()}`}
                      className={errors[`field_${field.field_name}`] ? 'border-red-500' : ''}
                    />
                  ) : field.field_type === 'textarea' ? (
                    <Textarea
                      value={formData[`field_${field.field_name}`] || ''}
                      onChange={(e) => handleInputChange(`field_${field.field_name}`, e.target.value)}
                      placeholder={field.field_description || `Enter ${field.field_label.toLowerCase()}`}
                      rows={4}
                      className={errors[`field_${field.field_name}`] ? 'border-red-500' : ''}
                    />
                  ) : (
                    <Input
                      type="text"
                      value={formData[`field_${field.field_name}`] || ''}
                      onChange={(e) => handleInputChange(`field_${field.field_name}`, e.target.value)}
                      placeholder={field.field_description || `Enter ${field.field_label.toLowerCase()}`}
                      className={errors[`field_${field.field_name}`] ? 'border-red-500' : ''}
                    />
                  )}
                  
                  {errors[`field_${field.field_name}`] && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors[`field_${field.field_name}`]}
                    </p>
                  )}
                  
                  {field.field_description && (
                    <p className="text-sm text-gray-500">{field.field_description}</p>
                  )}
                </div>
                ))}
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  No custom submission fields found. Using default URL field.
                </div>
                <label className="text-sm font-medium text-gray-700">Submission URL *</label>
                <Input
                  type="url"
                  value={formData.submissionUrl || submission.submission_url || ''}
                  onChange={(e) => handleInputChange('submissionUrl', e.target.value)}
                  placeholder="Enter your submission URL (GitHub repo, document link, etc.)"
                  className={errors.submissionUrl ? 'border-red-500' : ''}
                />
                {errors.submissionUrl && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.submissionUrl}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Submission'}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
