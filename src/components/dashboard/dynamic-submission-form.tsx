'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Upload, 
  Github, 
  Globe, 
  Video, 
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface SubmissionFormField {
  id: string
  type: 'github_link' | 'deployed_link' | 'video_file' | 'document_file' | 'description' | 'custom_text' | 'custom_file'
  label: string
  placeholder?: string
  required: boolean
  enabled: boolean
  helpText?: string
  fileTypes?: string[]
  maxSize?: number
}



interface DynamicSubmissionFormProps {
  problem: Record<string, unknown>
  onSuccess: () => void
}

const defaultFormFields: SubmissionFormField[] = [
  {
    id: 'github_link',
    type: 'github_link',
    label: 'GitHub Repository Link',
    placeholder: 'https://github.com/username/repository',
    required: false,
    enabled: true,
    helpText: 'Link to your GitHub repository containing the source code'
  },
  {
    id: 'deployed_link',
    type: 'deployed_link',
    label: 'Deployed Application Link',
    placeholder: 'https://your-app.vercel.app',
    required: false,
    enabled: true,
    helpText: 'Link to your live deployed application'
  },
  {
    id: 'video_file',
    type: 'video_file',
    label: 'Demo Video',
    required: false,
    enabled: true,
    helpText: 'Upload a video demonstration of your solution',
    fileTypes: ['mp4', 'mov', 'avi', 'webm'],
    maxSize: 50
  },
  {
    id: 'document_file',
    type: 'document_file',
    label: 'Documentation',
    required: false,
    enabled: true,
    helpText: 'Upload documentation or additional files',
    fileTypes: ['pdf', 'doc', 'docx', 'txt', 'md'],
    maxSize: 10
  },
  {
    id: 'description',
    type: 'description',
    label: 'Project Description',
    placeholder: 'Describe your solution, approach, and key features...',
    required: true,
    enabled: true,
    helpText: 'Provide a detailed description of your solution'
  }
]

export function DynamicSubmissionForm({ problem, onSuccess }: DynamicSubmissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Parse task settings
  const taskSettings = useMemo(() => {
    if (problem.settings && typeof problem.settings === 'object') {
      return {
        ...problem.settings,
        submissionFormFields: (problem.settings as Record<string, unknown>).submissionFormFields || defaultFormFields
      }
    }
    return {
      priority: 'medium',
      allowLateSubmissions: true,
      autoFeedback: false,
      requiresApproval: true,
      submissionFormFields: defaultFormFields
    }
  }, [problem.settings])

  // Get enabled form fields
  const enabledFields = useMemo(() => {
    return (taskSettings.submissionFormFields as SubmissionFormField[]).filter(field => field.enabled)
  }, [taskSettings.submissionFormFields])

  // Initialize form data based on enabled fields
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initialData: Record<string, unknown> = {}
    enabledFields.forEach(field => {
      if (field.type.includes('file')) {
        initialData[field.id] = null
      } else {
        initialData[field.id] = ''
      }
    })
    return initialData
  })

  const supabase = createClient()

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleFileChange = (fieldId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const field = enabledFields.find(f => f.id === fieldId)
      if (field && field.maxSize && file.size > field.maxSize * 1024 * 1024) {
        toast.error(`File is too large. Maximum size is ${field.maxSize}MB.`)
        return
      }
      
      setFormData(prev => ({
        ...prev,
        [fieldId]: file
      }))
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string, allowedTypes: string[]) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  }

  const validateForm = () => {
    const requiredFields = enabledFields.filter(field => field.required)
    const errors: string[] = []

    for (const field of requiredFields) {
      const value = formData[field.id]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field.label} is required`)
      }
    }

    // Validate URLs
    enabledFields.forEach(field => {
      if (field.type.includes('link') && formData[field.id]) {
        if (!isValidUrl(formData[field.id] as string)) {
          errors.push(`Please provide a valid URL for ${field.label}`)
        }
      }
    })

    // Check if at least one field is filled (if no required fields)
    if (requiredFields.length === 0) {
      const hasAnyValue = enabledFields.some(field => {
        const value = formData[field.id]
        return value && (typeof value === 'string' ? value.trim() !== '' : true)
      })
      
      if (!hasAnyValue) {
        errors.push('Please provide at least one submission item')
      }
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      const errors = validateForm()
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
        setIsSubmitting(false)
        return
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Please log in to submit')
        setIsSubmitting(false)
        return
      }

      // Upload files and prepare submission data
      const submissionData: Record<string, unknown> = {
        user_id: user.id,
        problem_statement_id: problem.id,
        status: 'pending'
      }

      // Process each enabled field
      for (const field of enabledFields) {
        const value = formData[field.id]
        if (!value) continue

        if (field.type.includes('file')) {
          const file = value as File
          const fileTypes = field.fileTypes || ['pdf', 'doc', 'docx', 'txt']
          const path = `submissions/${user.id}/${problem.id}/${field.id}_${Date.now()}.${file.name.split('.').pop()}`
          
          try {
            const url = await uploadFile(file, 'submissions', path, fileTypes)
            
            // Map to database columns
            if (field.type === 'video_file') {
              submissionData.video_url = url
            } else if (field.type === 'document_file') {
              submissionData.document_url = url
            } else {
              // For custom files, we'll store in a JSON field or extend the schema
              submissionData[field.id] = url
            }
          } catch (uploadError) {
            toast.error(uploadError instanceof Error ? uploadError.message : 'File upload failed')
            setIsSubmitting(false)
            return
          }
        } else {
          // Map to database columns
          if (field.type === 'github_link') {
            submissionData.github_link = value
          } else if (field.type === 'deployed_link') {
            submissionData.deployed_link = value
          } else if (field.type === 'description') {
            submissionData.description = value
          } else {
            // For custom fields, we'll store in a JSON field or extend the schema
            submissionData[field.id] = value
          }
        }
      }

      // Check if user already has a submission for this problem
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_statement_id', problem.id)
        .single()

      let response
      if (existingSubmission) {
        // Update existing submission
        response = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id)
          .select()
          .single()
      } else {
        // Create new submission
        response = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()
          .single()
      }

      if (response.error) {
        console.error('Submission error:', response.error)
        toast.error('Failed to submit solution')
        setIsSubmitting(false)
        return
      }

      toast.success(
        existingSubmission 
          ? 'Solution updated successfully!' 
          : 'Solution submitted successfully!'
      )
      
      onSuccess()
      router.refresh()

    } catch (error) {
      console.error('Error submitting solution:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: SubmissionFormField) => {
    const fieldIcon = {
      github_link: Github,
      deployed_link: Globe,
      video_file: Video,
      document_file: FileText,
      description: FileText,
      custom_text: FileText,
      custom_file: Upload
    }

    const Icon = fieldIcon[field.type] || Upload

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <Label className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </Label>
        
        {field.type === 'description' || field.type === 'custom_text' ? (
          <Textarea
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px]"
            required={field.required}
          />
        ) : field.type.includes('file') ? (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                onChange={handleFileChange(field.id)}
                accept={field.fileTypes?.map(type => `.${type}`).join(',')}
                className="hidden"
                id={field.id}
              />
              <label htmlFor={field.id} className="cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {formData[field.id] 
                    ? `Selected: ${(formData[field.id] as File).name}`
                    : 'Click to upload or drag and drop'
                  }
                </p>
                {field.fileTypes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: {field.fileTypes.join(', ')}
                  </p>
                )}
                {field.maxSize && (
                  <p className="text-xs text-muted-foreground">
                    Max size: {field.maxSize}MB
                  </p>
                )}
              </label>
            </div>
          </div>
        ) : (
          <Input
            value={(formData[field.id] as string) || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )}
        
        {field.helpText && (
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {field.helpText}
          </p>
        )}
      </motion.div>
    )
  }

  // Check if submission deadline has passed
  const submissionDeadline = (taskSettings as Record<string, unknown>).submissionDeadline as string
  const isDeadlinePassed = useMemo(() => {
    if (!submissionDeadline) return false
    return new Date() > new Date(submissionDeadline)
  }, [submissionDeadline])

  const canSubmit = (taskSettings as Record<string, unknown>).allowLateSubmissions || !isDeadlinePassed

  if (!canSubmit) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-500 mb-2">Submission Deadline Passed</h3>
        <p className="text-muted-foreground">
          The deadline for this task was {new Date(submissionDeadline).toLocaleString()}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!!(taskSettings as Record<string, unknown>).submissionDeadline && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Deadline: {new Date(submissionDeadline).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {enabledFields.map(renderField)}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="neon-button-cyan"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Solution
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
