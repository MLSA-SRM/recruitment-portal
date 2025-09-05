'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Clock, Target, FileText, AlertCircle, ArrowLeft, ClipboardList, Image as ImageIcon, Maximize2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import SubmissionFieldsManager from '@/components/submission-fields-manager'
import { type SubmissionField } from '@/lib/types'
import NextImage from 'next/image'

export default function EditTaskPage() {
  const params = useParams<{ id: string }>()
  const taskId = params?.id
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
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
    deliverables: '',
    image_url: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [showZoom, setShowZoom] = useState(false)

  useEffect(() => {
    if (!taskId) return
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const loadTask = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) throw error

      if (task) {
        // Format deadline for datetime-local input (YYYY-MM-DDTHH:MM)
        const deadline = task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
        setFormData({
          title: task.title || '',
          description: task.description || '',
          domain: task.domain || 'none',
          subdomain: task.subdomain || 'none',
          target_year: task.target_year?.toString() || 'all',
          deadline: deadline,
          estimated_duration: task.estimated_duration || calculateEstimatedDuration(deadline),
          requirements: task.requirements || '',
          deliverables: task.deliverables || '',
          image_url: task.image_url || ''
        })

        // Load submission fields
        const { data: fields, error: fieldsError } = await supabase
          .from('submission_fields')
          .select('*')
          .eq('task_id', taskId)
          .order('display_order')

        if (!fieldsError && fields) {
          setSubmissionFields(fields)
        }
      }
    } catch (error) {
      console.error('Error loading task:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

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
      alert('Please select a valid image file')
      return
    }
    setImageUploading(true)
    try {
      const supabase = createSupabaseClient()
      const compressed = await compressImage(file)
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.webp`
      const path = `tasks/${taskId}/${fileName}`
      const { error } = await supabase.storage.from('task-images').upload(path, compressed, {
        upsert: true,
        contentType: 'image/webp'
      })
      if (error) throw error
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/task-images/${path}`
      setFormData(prev => ({ ...prev, image_url: url }))
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
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
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !taskId) return
    
    console.log('Attempting to update task:', taskId)
    setIsSubmitting(true)
    
    try {
      // Prepare the data for the API
      const updateData = {
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        subdomain: formData.subdomain,
        target_year: parseInt(formData.target_year),
        deadline: formData.deadline,
        estimated_duration: formData.estimated_duration,
        requirements: formData.requirements,
        deliverables: formData.deliverables,
        image_url: formData.image_url || null,
        submissionFields: submissionFields
      }

      console.log('Sending update request to API...')
      
      // Call the API route
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const updatedTask = await response.json()
      console.log('Task updated successfully:', updatedTask)
      
      router.push('/admin/tasks')
    } catch (error) {
      console.error('Error updating task:', error)
      alert(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSubmitting(false)
    }
  }

  const getSubdomainOptions = () => {
    if (!formData.domain || formData.domain === 'none') return []
    return DOMAIN_SUBDOMAINS[formData.domain as Domain] || []
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/admin/tasks/${taskId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Task
        </Link>
        
        <div className="mt-4">
          <h1 className="text-4xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-lg text-gray-600 mt-2">
            Update task information and requirements
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update the essential details about the task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Task Image (optional)
              </label>
              {formData.image_url ? (
                <div className="relative">
                  <button type="button" className="absolute top-2 right-2 bg-black/60 text-white rounded p-1" onClick={() => setShowZoom(true)}>
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <NextImage src={formData.image_url} alt="Task image" width={600} height={338} className="rounded border" />
                </div>
              ) : null}
              <Input type="file" accept="image/*" onChange={handleImageChange} disabled={imageUploading} />
              {imageUploading && <p className="text-xs text-gray-500">Uploading...</p>}
            </div>
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
              Update the domain, target audience, and requirements
            </CardDescription>
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
                  disabled={!formData.domain || formData.domain === 'none'}
                >
                  <SelectTrigger 
                    className={`${errors.subdomain ? 'border-red-500 focus:ring-red-500' : ''} ${
                      !formData.domain || formData.domain === 'none' ? 'bg-gray-50 cursor-not-allowed' : ''
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline & Requirements
            </CardTitle>
            <CardDescription>
              Update deadlines and define clear deliverables
            </CardDescription>
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
      </form>

      {showZoom && formData.image_url && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative max-w-5xl w-full px-4">
            <button className="absolute -top-10 right-0 text-white" onClick={() => setShowZoom(false)}>
              <X className="h-6 w-6" />
            </button>
            <NextImage src={formData.image_url} alt="Task image large" width={1600} height={900} className="w-full h-auto rounded" />
          </div>
        </div>
      )}

      {/* Submission Fields Manager - Outside the main form */}
      <Card className="mt-8">
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
            taskId={Number(taskId)}
            initialFields={submissionFields}
            onFieldsChange={setSubmissionFields}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6">
        <Button onClick={handleSubmit} className="flex-1 text-lg" disabled={isSubmitting}>
          {isSubmitting ? 'Updating Task...' : 'Update Task'}
        </Button>
        <Link href={`/admin/tasks/${taskId}`}>
          <Button type="button" variant="outline" className="text-lg">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  )
}
