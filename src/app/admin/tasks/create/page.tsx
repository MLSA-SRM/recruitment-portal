'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Target, FileText, AlertCircle, CheckCircle, ClipboardList, Image as ImageIcon, Maximize2, X } from 'lucide-react'
import Link from 'next/link'
import { createTask } from '@/app/actions'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { useState, useRef, useEffect } from 'react'
import SubmissionFieldsManager from '@/components/submission-fields-manager'
import { type SubmissionField } from '@/lib/types'
import { toast } from 'sonner'
import { createSupabaseClient } from '@/lib/supabase-client'
import NextImage from 'next/image'

export default function CreateTaskPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'none',
    subdomain: 'none',
    target_year: 'all',
    deadline: '',
    estimated_duration: '',
    requirements: '',
    deliverables: ''
  })

  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const hasSubmitted = useRef(false)
  const submissionId = useRef(Date.now().toString() + Math.random().toString(36).substr(2, 9))
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showZoom, setShowZoom] = useState(false)

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('CreateTaskPage component mounted with submission ID:', submissionId.current)
    return () => {
      console.log('CreateTaskPage component unmounting')
    }
  }, [])

  const calculateEstimatedDuration = (deadline: string) => {
    if (!deadline) return ''
    
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Overdue'
    if (diffDays === 1) return '1 day'
    if (diffDays < 7) return `${diffDays} days`
    if (diffDays < 14) return '1 week'
    if (diffDays < 21) return '1-2 weeks'
    if (diffDays < 30) return '2-3 weeks'
    if (diffDays < 60) return '1 month'
    if (diffDays < 90) return '1-2 months'
    return '2+ months'
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-calculate estimated duration when deadline changes
      if (field === 'deadline') {
        // If it's a date-only input, set time to 23:59 (end of day)
        if (value && !value.includes('T')) {
          const dateOnly = value
          const endOfDay = `${dateOnly}T23:59`
          newData.deadline = endOfDay
          newData.estimated_duration = calculateEstimatedDuration(endOfDay)
        } else {
          newData.estimated_duration = calculateEstimatedDuration(value)
        }
      }
      
      return newData
    })
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Real-time validation for better UX
    validateField(field, value)
  }

  const validateField = (field: string, value: string) => {
    const newErrors: Record<string, string> = { ...errors }
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Task title is required'
        } else if (value.trim().length < 5) {
          newErrors.title = 'Task title must be at least 5 characters'
        } else {
          delete newErrors.title
        }
        break
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required'
        } else if (value.trim().length < 20) {
          newErrors.description = 'Description must be at least 20 characters'
        } else {
          delete newErrors.description
        }
        break
      case 'domain':
        if (!value || value === 'none') {
          newErrors.domain = 'Domain is required'
        } else {
          delete newErrors.domain
        }
        break
      case 'subdomain':
        if (!value || value === 'none') {
          newErrors.subdomain = 'Subdomain is required'
        } else {
          delete newErrors.subdomain
        }
        break
      case 'target_year':
        if (!value || value === 'all') {
          newErrors.target_year = 'Target year is required'
        } else {
          delete newErrors.target_year
        }
        break
      case 'deadline':
        if (!value) {
          newErrors.deadline = 'Deadline is required'
        } else {
          const deadlineDate = new Date(value)
          const today = new Date()
          if (deadlineDate <= today) {
            newErrors.deadline = 'Deadline must be in the future'
          } else {
            delete newErrors.deadline
          }
        }
        break
    }
    
    setErrors(newErrors)
  }

  // Compress image using canvas to WebP with max width/height and quality
  const compressImage = async (file: File, maxSize = 1400, quality = 0.8): Promise<Blob> => {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const scale = Math.min(1, maxSize / Math.max(width, height))
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(b => resolve(b), 'image/webp', quality))
    if (!blob) throw new Error('Failed to compress image')
    return blob
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    setImageUploading(true)
    try {
      const supabase = createSupabaseClient()
      const compressed = await compressImage(file)
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.webp`
      const path = `tasks/tmp/${submissionId.current}/${fileName}`
      const { error } = await supabase.storage.from('task-images').upload(path, compressed, {
        upsert: true,
        contentType: 'image/webp'
      })
      if (error) throw error
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/task-images/${path}`
      setImageUrl(url)
      toast.success('Image uploaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload image', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setImageUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) newErrors.title = 'Task title is required'
    if (!formData.domain || formData.domain === 'none') newErrors.domain = 'Domain is required'
    if (!formData.subdomain || formData.subdomain === 'none') newErrors.subdomain = 'Subdomain is required'
    if (!formData.target_year || formData.target_year === 'all') newErrors.target_year = 'Target year is required'
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
      
      if (imageUrl) formDataObj.append('image_url', imageUrl)
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
    if (!formData.domain || formData.domain === 'none') return []
    return DOMAIN_SUBDOMAINS[formData.domain as Domain] || []
  }

  // Calculate form completion percentage
  const getFormProgress = () => {
    const requiredFields = ['title', 'description', 'domain', 'subdomain', 'target_year', 'deadline']
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData]
      return value && value !== 'all' && value !== 'none' && value.trim() !== ''
    })
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const isFormValid = () => {
    return Object.keys(errors).length === 0 && 
           formData.title.trim() !== '' &&
           formData.description.trim() !== '' &&
           formData.domain !== '' && formData.domain !== 'none' &&
           formData.subdomain !== '' && formData.subdomain !== 'none' &&
           formData.target_year !== '' && formData.target_year !== 'all' &&
           formData.deadline !== ''
  }



  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/tasks" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-6">
            <span className="mr-2">←</span>
            Back to Tasks
          </Link>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Create New Task</h1>
            <p className="text-xl text-gray-600 mt-3 font-light leading-relaxed">
              Design a comprehensive task that will attract the right candidates
            </p>
            
            {/* Form Progress Indicator */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Form Progress</span>
                <span className="font-medium text-gray-900">{getFormProgress()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getFormProgress()}%` }}
                />
              </div>
              {isFormValid() && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Form is ready to submit!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" id="create-task-form">
          {/* Basic Information Card */}
          <Card className="shadow-lg border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6 -mx-6 -mt-6 mb-6">
              <div className="px-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  Basic Information
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Provide the essential details about the task
                </CardDescription>
              </div>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Task Image (optional)
              </label>
              {imageUrl ? (
                <div className="relative">
                  <button type="button" className="absolute top-2 right-2 bg-black/60 text-white rounded p-1" onClick={() => setShowZoom(true)}>
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <NextImage src={imageUrl} alt="Task image" width={600} height={338} className="rounded border" />
                </div>
              ) : null}
              <Input type="file" accept="image/*" onChange={handleImageChange} disabled={imageUploading} />
              {imageUploading && <p className="text-xs text-gray-500">Uploading...</p>}
            </div>
          </CardContent>
        </Card>

        {showZoom && imageUrl && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="relative max-w-5xl w-full px-4">
              <button className="absolute -top-10 right-0 text-white" onClick={() => setShowZoom(false)}>
                <X className="h-6 w-6" />
              </button>
              <NextImage src={imageUrl} alt="Task image large" width={1600} height={900} className="w-full h-auto rounded" />
            </div>
          </div>
        )}

          {/* Task Details Card */}
          <Card className="shadow-lg border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b p-6 -mx-6 -mt-6 mb-6">
              <div className="px-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  Task Details
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Specify the domain, target audience, and requirements
                </CardDescription>
              </div>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium text-gray-700">Domain *</Label>
                <Select 
                  value={formData.domain} 
                  onValueChange={(value) => {
                    handleInputChange('domain', value)
                    handleInputChange('subdomain', 'none') // Reset subdomain when domain changes
                    if (value && value !== 'none') {
                      toast.info('Domain changed', {
                        description: 'Please select a subdomain for the new domain'
                      })
                    }
                  }}
                >
                  <SelectTrigger className={errors.domain ? 'border-red-500 focus:ring-red-500' : ''}>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Domain</SelectItem>
                    {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.domain && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.domain}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-sm font-medium text-gray-700">Subdomain *</Label>
                <Select 
                  value={formData.subdomain} 
                  onValueChange={(value) => handleInputChange('subdomain', value)}
                  disabled={!formData.domain}
                >
                  <SelectTrigger 
                    className={`${errors.subdomain ? 'border-red-500 focus:ring-red-500' : ''} ${
                      !formData.domain ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select Subdomain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Subdomain</SelectItem>
                    {getSubdomainOptions().map((subdomain) => (
                      <SelectItem key={subdomain} value={subdomain}>{subdomain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subdomain && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.subdomain}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_year" className="text-sm font-medium text-gray-700">Target Year *</Label>
              <Select 
                value={formData.target_year} 
                onValueChange={(value) => handleInputChange('target_year', value)}
              >
                <SelectTrigger className={errors.target_year ? 'border-red-500 focus:ring-red-500' : ''}>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                </SelectContent>
              </Select>
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
          <Card className="shadow-lg border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b p-6 -mx-6 -mt-6 mb-6">
              <div className="px-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  Timeline & Requirements
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Set deadlines and define clear deliverables
                </CardDescription>
              </div>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Deadline *</label>
                <Input 
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
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
                  placeholder="Auto-calculated from deadline"
                  value={formData.estimated_duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('estimated_duration', e.target.value)}
                  readOnly={!!formData.deadline}
                  className={formData.deadline ? 'bg-gray-50' : ''}
                />
                {formData.deadline && (
                  <p className="text-xs text-gray-500">Auto-calculated from deadline. You can edit manually if needed.</p>
                )}
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
          <Card className="shadow-lg border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b p-6 -mx-6 -mt-6 mb-6">
              <div className="px-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                  </div>
                  Custom Submission Fields
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Define what information applicants need to provide when applying
                </CardDescription>
              </div>
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 border-b p-6 -mx-6 -mt-6 mb-6">
              <div className="px-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  Task Preview
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Review how your task will appear to applicants
                </CardDescription>
              </div>
            </CardHeader>
          <CardContent>
            {formData.title ? (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.title}</h3>
                      {formData.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">{formData.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.domain && formData.domain !== 'none' && (
                          <Badge variant="secondary" className="px-3 py-1">
                            {formData.domain}
                          </Badge>
                        )}
                        {formData.subdomain && formData.subdomain !== 'none' && (
                          <Badge variant="outline" className="px-3 py-1">
                            {formData.subdomain}
                          </Badge>
                        )}
                        {formData.target_year && formData.target_year !== 'all' && (
                          <Badge variant="secondary" className="px-3 py-1">
                            {formData.target_year === '1' ? '1st' : '2nd'} Year
                          </Badge>
                        )}
                      </div>
                      
                      {formData.deadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Deadline:</span>
                          <span>{new Date(formData.deadline).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      )}
                      
                      {formData.estimated_duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                          <Clock className="h-4 w-4" />
                          <span>Estimated Duration: {formData.estimated_duration}</span>
                        </div>
                      )}
                    </div>
                    
                    {imageUrl && (
                      <div className="ml-4">
                        <NextImage 
                          src={imageUrl} 
                          alt="Task preview" 
                          width={120} 
                          height={68} 
                          className="rounded-lg border shadow-sm" 
                        />
                      </div>
                    )}
                  </div>
                  
                  {(formData.requirements || formData.deliverables) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.requirements && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Requirements</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{formData.requirements}</p>
                          </div>
                        )}
                        {formData.deliverables && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Deliverables</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{formData.deliverables}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Start filling out the form to see a preview of your task</p>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Action Buttons */}
          <div className="space-y-6 pt-8">
            {hasSubmitted.current && (
              <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <p className="text-yellow-800 text-sm font-medium">
                    Task creation has been initiated. Please wait for the process to complete.
                  </p>
                </div>
              </div>
            )}
            {submitError && (
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-800 text-sm font-medium">{submitError}</p>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-200"
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
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Task...
                  </div>
                ) : hasSubmitted.current ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Task Created!
                  </div>
                ) : (
                  'Create Task'
                )}
              </Button>
              <Link href="/admin/tasks">
                <Button type="button" variant="outline" className="text-lg py-6 px-8 hover:bg-gray-50 transition-colors">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
