'use client'

import { useState } from 'react'
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
  CheckCircle
} from 'lucide-react'

interface SubmissionFormProps {
  problem: Record<string, unknown>
  onSuccess: () => void
}

export function SubmissionForm({ problem, onSuccess }: SubmissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    github_link: '',
    deployed_link: '',
    video_file: null as File | null,
    document_file: null as File | null,
    description: ''
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

  const handleFileChange = (field: 'video_file' | 'document_file') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }))
    }
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`)
    }

    // Validate file type
    const allowedTypes = [
      'video/mp4', 'video/quicktime', 'video/avi', 'video/webm',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Please upload PDF, DOC, DOCX, TXT, PPT, PPTX, or video files.`)
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      if (!formData.github_link && !formData.deployed_link && !formData.video_file && !formData.document_file) {
        toast.error('Please provide at least one submission item (GitHub link, deployed link, video, or document)')
        setIsSubmitting(false)
        return
      }

      // Validate URLs if provided
      if (formData.github_link && !isValidUrl(formData.github_link)) {
        toast.error('Please provide a valid GitHub URL')
        setIsSubmitting(false)
        return
      }

      if (formData.deployed_link && !isValidUrl(formData.deployed_link)) {
        toast.error('Please provide a valid deployment URL')
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

      let videoUrl = null
      let documentUrl = null

      // Upload video if provided
      if (formData.video_file) {
        const videoPath = `submissions/${user.id}/${problem.id}/video_${Date.now()}.${formData.video_file.name.split('.').pop()}`
        videoUrl = await uploadFile(formData.video_file, 'submissions', videoPath)
      }

      // Upload document if provided
      if (formData.document_file) {
        const docPath = `submissions/${user.id}/${problem.id}/document_${Date.now()}.${formData.document_file.name.split('.').pop()}`
        documentUrl = await uploadFile(formData.document_file, 'submissions', docPath)
      }

      // Check if user already has a submission for this problem
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_statement_id', problem.id)
        .single()

      const submissionData = {
        user_id: user.id,
        problem_statement_id: problem.id,
        github_link: formData.github_link || null,
        deployed_link: formData.deployed_link || null,
        video_url: videoUrl,
        document_url: documentUrl,
        description: formData.description || null,
        status: 'pending' as const
      }

      let result
      let submissionId
      
      if (existingSubmission) {
        // Update existing submission
        result = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id)
          .select('id')
          .single()
        submissionId = existingSubmission.id
      } else {
        // Create new submission
        result = await supabase
          .from('submissions')
          .insert(submissionData)
          .select('id')
          .single()
        submissionId = result.data?.id
      }

      if (result.error) {
        throw result.error
      }

      // Automatically generate AI feedback for the submission
      if (submissionId) {
        try {
          const feedbackResponse = await fetch('/api/ai-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId })
          })
          
          if (feedbackResponse.ok) {
            console.log('AI feedback generated automatically')
          } else {
            console.warn('Failed to generate AI feedback automatically')
          }
        } catch (feedbackError) {
          console.error('Error generating AI feedback:', feedbackError)
          // Don't throw error here - submission was successful, feedback generation is secondary
        }
      }

      toast.success(existingSubmission ? 'Submission updated successfully!' : 'Submission created successfully!')
      onSuccess()
      router.refresh()
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* GitHub Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="github_link" className="text-foreground font-medium">
          GitHub Repository Link
        </Label>
        <div className="relative">
          <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="github_link"
            type="url"
            placeholder="https://github.com/username/repository"
            className="pl-10 focus-ring bg-card/50 border-2 border-border/80 hover:border-primary/50 focus:border-primary transition-colors"
            value={formData.github_link}
            onChange={(e) => setFormData(prev => ({ ...prev, github_link: e.target.value }))}
          />
        </div>
      </motion.div>

      {/* Deployed Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Label htmlFor="deployed_link" className="text-foreground font-medium">
          Deployed Link <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <div className="relative">
          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="deployed_link"
            type="url"
            placeholder="https://your-project.vercel.app"
            className="pl-10 focus-ring bg-card/50 border-2 border-border/80 hover:border-primary/50 focus:border-primary transition-colors"
            value={formData.deployed_link}
            onChange={(e) => setFormData(prev => ({ ...prev, deployed_link: e.target.value }))}
          />
        </div>
      </motion.div>

      {/* File Uploads */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Video Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label htmlFor="video_file" className="text-foreground">
            Demo Video (Optional)
          </Label>
          <div className="relative">
            <input
              id="video_file"
              type="file"
              accept="video/*"
              onChange={handleFileChange('video_file')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border/80 rounded-lg bg-input/20 hover:bg-input/30 transition-colors">
              <div className="text-center">
                {formData.video_file ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-foreground">{formData.video_file.name}</p>
                  </>
                ) : (
                  <>
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload video</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Document Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <Label htmlFor="document_file" className="text-foreground">
            Documentation (Optional)
          </Label>
          <div className="relative">
            <input
              id="document_file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileChange('document_file')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border/80 rounded-lg bg-input/20 hover:bg-input/30 transition-colors">
              <div className="text-center">
                {formData.document_file ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-foreground">{formData.document_file.name}</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload document</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <Label htmlFor="description" className="text-foreground">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your solution, challenges faced, and key features..."
          className="bg-input/50 border-2 border-border/80 focus:border-primary min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end space-x-4"
      >
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="neon-button-cyan"
          disabled={isSubmitting || (!formData.github_link && !formData.video_file && !formData.document_file)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Solution
            </>
          )}
        </Button>
      </motion.div>

      {/* Requirements Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg"
      >
        <p className="font-medium mb-1">Submission Guidelines:</p>
        <ul className="space-y-1">
          <li>• At least one of GitHub link, video, or document is required</li>
          <li>• Video files should be under 100MB</li>
          <li>• Documents should be in PDF, DOC, or Markdown format</li>
          <li>• You can resubmit to update your solution</li>
        </ul>
      </motion.div>
    </form>
  )
}
