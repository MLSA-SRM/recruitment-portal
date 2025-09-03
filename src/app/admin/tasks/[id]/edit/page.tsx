'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Target, FileText, AlertCircle, ArrowLeft, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import SubmissionFieldsManager from '@/components/submission-fields-manager'
import { type SubmissionField } from '@/lib/types'

export default function EditTaskPage() {
  const params = useParams<{ id: string }>()
  const taskId = params?.id
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
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

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submissionFields, setSubmissionFields] = useState<SubmissionField[]>([])

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
        setFormData({
          title: task.title || '',
          description: task.description || '',
          domain: task.domain || '',
          subdomain: task.subdomain || '',
          target_year: task.target_year?.toString() || '',
          deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
          requirements: task.requirements || '',
          deliverables: task.deliverables || ''
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !taskId) return
    
    console.log('Attempting to update task:', taskId)
    setIsSubmitting(true)
    
    try {
      const supabase = createSupabaseClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error:', authError)
        throw new Error('User not authenticated')
      }
      
      console.log('User authenticated:', user.id)
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw new Error('Failed to fetch user profile')
      }
      
      console.log('User profile:', profile)
      
      if (!profile?.is_admin) {
        throw new Error('Unauthorized: Admin access required')
      }
      
      // Update the task
      console.log('Updating task in database...')
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          description: formData.description,
          domain: formData.domain,
          subdomain: formData.subdomain,
          target_year: parseInt(formData.target_year),
          deadline: formData.deadline,
          requirements: formData.requirements,
          deliverables: formData.deliverables
        })
        .eq('id', taskId)

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      // Update submission fields
      if (submissionFields.length > 0) {
        console.log('Updating submission fields...')
        
        // First, delete existing submission fields
        const { error: deleteError } = await supabase
          .from('submission_fields')
          .delete()
          .eq('task_id', taskId)

        if (deleteError) {
          console.error('Error deleting existing submission fields:', deleteError)
        }

        // Then insert the new submission fields
        const fieldsToInsert = submissionFields.map(field => ({
          task_id: Number(taskId),
          field_name: field.field_name,
          field_type: field.field_type,
          field_label: field.field_label,
          field_description: field.field_description,
          is_required: field.is_required,
          field_options: field.field_options,
          validation_rules: field.validation_rules,
          display_order: field.display_order
        }))

        const { error: fieldsError } = await supabase
          .from('submission_fields')
          .insert(fieldsToInsert)

        if (fieldsError) {
          console.error('Error updating submission fields:', fieldsError)
          // Don't fail the entire operation if fields fail
        } else {
          console.log('Submission fields updated successfully')
        }
      }

      console.log('Task updated successfully')
      router.push('/admin/tasks')
    } catch (error) {
      console.error('Error updating task:', error)
      alert(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSubmitting(false)
    }
  }

  const getSubdomainOptions = () => {
    if (!formData.domain) return []
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
                <label className="text-sm font-medium text-gray-700">Domain *</label>
                <select 
                  value={formData.domain}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    handleInputChange('domain', e.target.value)
                    handleInputChange('subdomain', '') // Reset subdomain when domain changes
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
              Update deadlines and define clear deliverables
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
      </form>

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
        <Button 
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating Task...' : 'Update Task'}
        </Button>
        <Link href={`/admin/tasks/${taskId}`}>
          <Button type="button" variant="outline" className="px-8 py-3 text-lg">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  )
}
