'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Target, FileText, AlertCircle, CheckCircle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { createTask } from '@/app/actions'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { useState, useRef, useEffect } from 'react'
import SubmissionFieldsManager from '@/components/submission-fields-manager'
import { type SubmissionField } from '@/lib/types'
import { toast } from 'sonner'

export default function CreateTaskPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    subdomain: '',
    target_year: '',
    deadline: '',
    requirements: '',
    deliverables: ''
  })

  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const hasSubmitted = useRef(false)
  const submissionId = useRef(Date.now().toString() + Math.random().toString(36).substr(2, 9))

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('CreateTaskPage component mounted with submission ID:', submissionId.current)
    return () => {
      console.log('CreateTaskPage component unmounting')
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) newErrors.title = 'Task title is required'
    if (!formData.domain) newErrors.domain = 'Domain is required'
    if (!formData.subdomain) newErrors.subdomain = 'Subdomain is required'
    if (!formData.target_year) newErrors.target_year = 'Target year is required'
    if (!formData.deadline) newErrors.deadline = 'Deadline is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    
    setErrors(newErrors)
    
    // Show toast for validation errors
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the form errors', {
        description: 'Please fill in all required fields'
      })
    } else {
      // Show success toast when all fields are valid
      toast.success('Form is ready to submit!', {
        description: 'All required fields are filled out'
      })
    }
    
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submit event triggered')
    
    // Prevent multiple submissions - once submitted, never allow again
    if (hasSubmitted.current || isSubmitting) {
      console.log('Form submission blocked - already submitted or submitting')
      toast.info('Task creation already in progress')
      return
    }
    
    if (!validateForm()) return
    
    // Clear any previous submit errors
    setSubmitError(null)
    
    // Mark as submitted immediately to prevent any further submissions
    hasSubmitted.current = true
    setIsSubmitting(true)
    
    // Show loading toast
    const loadingToast = toast.loading('Creating task...', {
      description: 'Please wait while we create your task'
    })
    
    try {
      console.log('Creating task...')
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })
      
      // Add submission ID and submission fields to form data
      formDataObj.append('submissionId', submissionId.current)
      formDataObj.append('timestamp', Date.now().toString())
      if (submissionFields.length > 0) {
        formDataObj.append('submissionFields', JSON.stringify(submissionFields))
      }
      
      const result = await createTask(formDataObj)
      console.log('Task created successfully:', result)
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success('Task created successfully!', {
        description: 'Redirecting to tasks list...'
      })
      
      // Use window.location instead of redirect to prevent multiple redirects
      setTimeout(() => {
        window.location.href = '/admin/tasks'
      }, 1500)
      
    } catch (error) {
      console.error('Error creating task:', error)
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast)
      toast.error('Failed to create task', {
        description: error instanceof Error ? error.message : 'An error occurred while creating the task'
      })
      
      // Set the error message for display
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while creating the task')
      // Don't reset hasSubmitted on error to prevent multiple submissions
      // Only reset isSubmitting to allow user to see the error
      setIsSubmitting(false)
    }
  }

  const getSubdomainOptions = () => {
    if (!formData.domain) return []
    return DOMAIN_SUBDOMAINS[formData.domain as Domain] || []
  }



  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/tasks" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
          <span className="mr-2">←</span>
          Back to Tasks
        </Link>
        <div className="mt-4">
          <h1 className="text-4xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-lg text-gray-600 mt-2">
            Design a comprehensive task that will attract the right candidates
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" id="create-task-form">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Provide the essential details about the task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Task Title *</label>
              <Input 
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Build a Portfolio Website with React" 
                className={errors.title ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <Textarea 
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                placeholder="Describe the task requirements, expectations, and any specific guidelines..."
                rows={4}
                className={errors.description ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Details
            </CardTitle>
            <CardDescription>
              Specify the domain, target audience, and requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Domain *</label>
                <select 
                  value={formData.domain}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    handleInputChange('domain', e.target.value)
                    handleInputChange('subdomain', '') // Reset subdomain when domain changes
                    if (e.target.value) {
                      toast.info('Domain changed', {
                        description: 'Please select a subdomain for the new domain'
                      })
                    }
                  }}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.domain ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Domain</option>
                  {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
                {errors.domain && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.domain}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subdomain *</label>
                <select 
                  value={formData.subdomain}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('subdomain', e.target.value)}
                  disabled={!formData.domain}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subdomain ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.domain ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Subdomain</option>
                  {getSubdomainOptions().map((subdomain) => (
                    <option key={subdomain} value={subdomain}>{subdomain}</option>
                  ))}
                </select>
                {errors.subdomain && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.subdomain}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Target Year *</label>
              <select 
                value={formData.target_year}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('target_year', e.target.value)}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.target_year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {errors.target_year && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.target_year}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline & Requirements
            </CardTitle>
            <CardDescription>
              Set deadlines and define clear deliverables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Deadline *</label>
                <Input 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.deadline ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {errors.deadline && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.deadline}
                  </p>
                )}
              </div>

                             <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Estimated Duration</label>
                 <Input 
                   placeholder="e.g., 2-3 weeks"
                   value={formData.requirements}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('requirements', e.target.value)}
                 />
               </div>
            </div>

                         <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Requirements & Prerequisites</label>
               <Textarea 
                 placeholder="List any specific skills, tools, or knowledge required..."
                 rows={3}
                 value={formData.requirements}
                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('requirements', e.target.value)}
               />
             </div>

                         <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Expected Deliverables</label>
               <Textarea 
                 placeholder="Clearly define what should be submitted (e.g., GitHub repo, document, presentation)..."
                 rows={3}
                 value={formData.deliverables}
                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('deliverables', e.target.value)}
               />
             </div>
          </CardContent>
        </Card>

        {/* Submission Fields Manager */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-600" />
              Custom Submission Fields
            </CardTitle>
            <CardDescription>
              Define what information applicants need to provide when applying
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionFieldsManager
              taskId={0} // Will be set when task is created
              initialFields={submissionFields}
              onFieldsChange={setSubmissionFields}
            />
          </CardContent>
        </Card>

        {/* Task Preview Card */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Task Preview
            </CardTitle>
            <CardDescription>
              Review how your task will appear to applicants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formData.title && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900">{formData.title}</h3>
                  {formData.description && (
                    <p className="text-gray-600 mt-2">{formData.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.domain && (
                      <Badge variant="secondary">{formData.domain}</Badge>
                    )}
                    {formData.subdomain && (
                      <Badge variant="outline">{formData.subdomain}</Badge>
                    )}

                    {formData.target_year && (
                      <Badge variant="secondary">{formData.target_year}st Year</Badge>
                    )}
                  </div>
                  {formData.deadline && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Deadline: {new Date(formData.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4 pt-6">
          {hasSubmitted.current && (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                Task creation has been initiated. Please wait for the process to complete.
              </p>
            </div>
          )}
          {submitError && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{submitError}</p>
            </div>
          )}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || hasSubmitted.current}
              onClick={(e) => {
                if (hasSubmitted.current || isSubmitting) {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button click blocked - already submitted or submitting')
                  return false
                }
              }}
            >
              {isSubmitting ? 'Creating Task...' : hasSubmitted.current ? 'Task Created!' : 'Create Task'}
            </Button>
            <Link href="/admin/tasks">
              <Button type="button" variant="outline" className="px-8 py-3 text-lg">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
