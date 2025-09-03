'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Target,
  Calendar,
  FileText,
  Upload,
  Github,
  Globe,
  Video,
  AlertCircle,
  CheckCircle,
  Clock,
  Flag,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Palette,
  Type,
  Hash,
  Mail,
  Phone,
  MapPin,
  Link,
  Image,
  Star,
  Heart,
  Bookmark,
  Tag,
  Code,
  Database,
  Settings,
  User,
  Users,
  Shield,
  Zap,
  Briefcase,
  Award,
  Trophy,
  Lightbulb,
  Rocket,
  Search,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Wifi,
  Smartphone,
  Laptop,
  Monitor,
  Copy,

  Save
} from 'lucide-react'

interface SubmissionFormField {
  id: string
  type: 'github_link' | 'deployed_link' | 'video_file' | 'document_file' | 'description' | 'custom_text' | 'custom_file' | 'email' | 'phone' | 'number' | 'url' | 'date' | 'select' | 'multiselect' | 'radio' | 'checkbox_group'
  label: string
  placeholder?: string
  required: boolean
  enabled: boolean
  helpText?: string
  fileTypes?: string[]
  maxSize?: number
  icon?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    customMessage?: string
  }
  options?: string[]
  conditional?: {
    dependsOn?: string
    showWhen?: string
  }
  styling?: {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
  }
  order: number
}

interface TaskSettings {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  maxSubmissions?: number
  submissionDeadline?: string
  allowLateSubmissions: boolean
  autoFeedback: boolean
  requiresApproval: boolean
  submissionFormFields: SubmissionFormField[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}

interface ProblemStatement {
  id?: string
  title: string
  description: string
  domain: string
  sub_domain: string
  requirements: string[]
  is_active: boolean
  settings: TaskSettings
  created_at?: string
}

interface ProblemStatementsManagerProps {
  problemStatements: {
    id?: string
    title: string
    description: string
    domain: string
    sub_domain: string
    requirements?: string[]
    is_active: boolean
    settings?: string | TaskSettings
    created_at?: string
  }[]
}

// Available icons for form fields
const availableIcons = [
  { name: 'Github', icon: Github, category: 'Development' },
  { name: 'Globe', icon: Globe, category: 'Web' },
  { name: 'Video', icon: Video, category: 'Media' },
  { name: 'FileText', icon: FileText, category: 'Document' },
  { name: 'Upload', icon: Upload, category: 'File' },
  { name: 'Mail', icon: Mail, category: 'Contact' },
  { name: 'Phone', icon: Phone, category: 'Contact' },
  { name: 'MapPin', icon: MapPin, category: 'Location' },
  { name: 'Link', icon: Link, category: 'Web' },
  { name: 'Image', icon: Image, category: 'Media' },
  { name: 'Star', icon: Star, category: 'Rating' },
  { name: 'Heart', icon: Heart, category: 'Social' },
  { name: 'Bookmark', icon: Bookmark, category: 'Save' },
  { name: 'Tag', icon: Tag, category: 'Category' },
  { name: 'Code', icon: Code, category: 'Development' },
  { name: 'Database', icon: Database, category: 'Data' },
  { name: 'User', icon: User, category: 'Profile' },
  { name: 'Users', icon: Users, category: 'Team' },
  { name: 'Shield', icon: Shield, category: 'Security' },
  { name: 'Zap', icon: Zap, category: 'Performance' },
  { name: 'Briefcase', icon: Briefcase, category: 'Business' },
  { name: 'Award', icon: Award, category: 'Achievement' },
  { name: 'Trophy', icon: Trophy, category: 'Achievement' },
  { name: 'Lightbulb', icon: Lightbulb, category: 'Ideas' },
  { name: 'Rocket', icon: Rocket, category: 'Launch' },
  { name: 'Search', icon: Search, category: 'Discovery' },
  { name: 'Filter', icon: Filter, category: 'Sort' },
  { name: 'BarChart3', icon: BarChart3, category: 'Analytics' },
  { name: 'PieChart', icon: PieChart, category: 'Analytics' },
  { name: 'TrendingUp', icon: TrendingUp, category: 'Growth' },
  { name: 'Activity', icon: Activity, category: 'Monitoring' },
  { name: 'Wifi', icon: Wifi, category: 'Network' },
  { name: 'Smartphone', icon: Smartphone, category: 'Device' },
  { name: 'Laptop', icon: Laptop, category: 'Device' },
  { name: 'Monitor', icon: Monitor, category: 'Device' },
  { name: 'Type', icon: Type, category: 'Text' },
  { name: 'Hash', icon: Hash, category: 'Number' },
  { name: 'Calendar', icon: Calendar, category: 'Date' },
  { name: 'Clock', icon: Clock, category: 'Time' }
]

const defaultFormFields: SubmissionFormField[] = [
  {
    id: 'github_link',
    type: 'github_link',
    label: 'GitHub Repository Link',
    placeholder: 'https://github.com/username/repository',
    required: false,
    enabled: true,
    helpText: 'Link to your GitHub repository containing the source code',
    icon: 'Github',
    order: 1
  },
  {
    id: 'deployed_link',
    type: 'deployed_link',
    label: 'Deployed Application Link',
    placeholder: 'https://your-app.vercel.app',
    required: false,
    enabled: true,
    helpText: 'Link to your live deployed application',
    icon: 'Globe',
    order: 2
  },
  {
    id: 'video_file',
    type: 'video_file',
    label: 'Demo Video',
    required: false,
    enabled: true,
    helpText: 'Upload a video demonstration of your solution',
    fileTypes: ['mp4', 'mov', 'avi', 'webm'],
    maxSize: 50,
    icon: 'Video',
    order: 3
  },
  {
    id: 'document_file',
    type: 'document_file',
    label: 'Documentation',
    required: false,
    enabled: true,
    helpText: 'Upload documentation or additional files',
    fileTypes: ['pdf', 'doc', 'docx', 'txt', 'md'],
    maxSize: 10,
    icon: 'FileText',
    order: 4
  },
  {
    id: 'description',
    type: 'description',
    label: 'Project Description',
    placeholder: 'Describe your solution, approach, and key features...',
    required: true,
    enabled: true,
    helpText: 'Provide a detailed description of your solution',
    icon: 'Type',
    order: 5
  }
]

export function ProblemStatementsManager({ problemStatements }: ProblemStatementsManagerProps) {
  const [problems, setProblems] = useState<ProblemStatement[]>(
    problemStatements.map(p => ({
      ...p,
      requirements: p.requirements || [],
      settings: {
        priority: 'medium' as const,
        allowLateSubmissions: true,
        autoFeedback: false,
        requiresApproval: true,
        submissionFormFields: defaultFormFields,
        ...((typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings) || {})
      }
    }))
  )
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState<ProblemStatement | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [formData, setFormData] = useState<ProblemStatement>({
    title: '',
    description: '',
    domain: '',
    sub_domain: '',
    requirements: [],
    is_active: true,
    settings: {
      priority: 'medium',
      allowLateSubmissions: true,
      autoFeedback: false,
      requiresApproval: true,
      submissionFormFields: [...defaultFormFields]
    }
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      domain: '',
      sub_domain: '',
      requirements: [],
      is_active: true,
      settings: {
        priority: 'medium',
        allowLateSubmissions: true,
        autoFeedback: false,
        requiresApproval: true,
        submissionFormFields: [...defaultFormFields]
      }
    })
    setEditingProblem(null)
    setActiveTab('basic')
    setSelectedFieldId(null)
  }

  const handleInputChange = (field: string, value: unknown) => {
    if (field.startsWith('settings.')) {
      const settingField = field.replace('settings.', '')
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: value
        }
      }))
    } else {
    setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFormFieldChange = (fieldId: string, updates: Partial<SubmissionFormField>) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        submissionFormFields: prev.settings.submissionFormFields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        )
      }
    }))
  }

  const addCustomField = (type: SubmissionFormField['type']) => {
    const maxOrder = Math.max(...formData.settings.submissionFormFields.map(f => f.order || 0))
    const newField: SubmissionFormField = {
      id: `custom_${Date.now()}`,
      type,
      label: getDefaultLabelForType(type),
      placeholder: getDefaultPlaceholderForType(type),
      required: false,
      enabled: true,
      helpText: 'Custom field description',
      icon: getDefaultIconForType(type),
      order: maxOrder + 1,
      ...(type.includes('file') && {
        fileTypes: ['pdf', 'doc', 'docx', 'txt'],
        maxSize: 5
      }),
      ...(type === 'select' || type === 'multiselect' || type === 'radio' || type === 'checkbox_group') && {
        options: ['Option 1', 'Option 2', 'Option 3']
      }
    }

    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        submissionFormFields: [...prev.settings.submissionFormFields, newField]
      }
    }))
  }

  const removeCustomField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        submissionFormFields: prev.settings.submissionFormFields.filter(field => field.id !== fieldId)
      }
    }))
  }

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = formData.settings.submissionFormFields.find(f => f.id === fieldId)
    if (fieldToDuplicate) {
      const maxOrder = Math.max(...formData.settings.submissionFormFields.map(f => f.order || 0))
      const duplicatedField: SubmissionFormField = {
        ...fieldToDuplicate,
        id: `${fieldToDuplicate.id}_copy_${Date.now()}`,
        label: `${fieldToDuplicate.label} (Copy)`,
        order: maxOrder + 1
      }
      
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          submissionFormFields: [...prev.settings.submissionFormFields, duplicatedField]
        }
      }))
    }
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fields = [...formData.settings.submissionFormFields]
    const fieldIndex = fields.findIndex(f => f.id === fieldId)
    
    if (fieldIndex === -1) return
    
    if (direction === 'up' && fieldIndex > 0) {
      [fields[fieldIndex], fields[fieldIndex - 1]] = [fields[fieldIndex - 1], fields[fieldIndex]]
    } else if (direction === 'down' && fieldIndex < fields.length - 1) {
      [fields[fieldIndex], fields[fieldIndex + 1]] = [fields[fieldIndex + 1], fields[fieldIndex]]
    }
    
    // Update order values
    fields.forEach((field, index) => {
      field.order = index + 1
    })
    
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        submissionFormFields: fields
      }
    }))
  }

  const getDefaultLabelForType = (type: SubmissionFormField['type']): string => {
    const labels: Record<SubmissionFormField['type'], string> = {
      github_link: 'GitHub Repository Link',
      deployed_link: 'Deployed Application Link',
      video_file: 'Demo Video',
      document_file: 'Documentation',
      description: 'Project Description',
      custom_text: 'Custom Text Field',
      custom_file: 'Custom File Field',
      email: 'Email Address',
      phone: 'Phone Number',
      number: 'Number',
      url: 'Website URL',
      date: 'Date',
      select: 'Select Option',
      multiselect: 'Multiple Selection',
      radio: 'Radio Button',
      checkbox_group: 'Checkbox Group'
    }
    return labels[type] || 'Custom Field'
  }

  const getDefaultPlaceholderForType = (type: SubmissionFormField['type']): string => {
    const placeholders: Record<SubmissionFormField['type'], string> = {
      github_link: 'https://github.com/username/repository',
      deployed_link: 'https://your-app.vercel.app',
      video_file: '',
      document_file: '',
      description: 'Describe your solution...',
      custom_text: 'Enter your response...',
      custom_file: '',
      email: 'example@domain.com',
      phone: '+1 (555) 123-4567',
      number: '0',
      url: 'https://example.com',
      date: '',
      select: 'Choose an option',
      multiselect: 'Select multiple options',
      radio: 'Choose one option',
      checkbox_group: 'Select all that apply'
    }
    return placeholders[type] || ''
  }

  const getDefaultIconForType = (type: SubmissionFormField['type']): string => {
    const icons: Record<SubmissionFormField['type'], string> = {
      github_link: 'Github',
      deployed_link: 'Globe',
      video_file: 'Video',
      document_file: 'FileText',
      description: 'Type',
      custom_text: 'Type',
      custom_file: 'Upload',
      email: 'Mail',
      phone: 'Phone',
      number: 'Hash',
      url: 'Link',
      date: 'Calendar',
      select: 'ChevronDown',
      multiselect: 'CheckSquare',
      radio: 'Circle',
      checkbox_group: 'Square'
    }
    return icons[type] || 'Type'
  }

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName)
    return iconData ? iconData.icon : Type
  }

  const groupedIcons = useMemo(() => {
    return availableIcons.reduce((acc, icon) => {
      if (!acc[icon.category]) {
        acc[icon.category] = []
      }
      acc[icon.category].push(icon)
      return acc
    }, {} as Record<string, typeof availableIcons>)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const problemData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        settings: JSON.stringify(formData.settings)
      }

      let response
      if (editingProblem) {
        response = await fetch(`/api/admin/problem-statements/${editingProblem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(problemData)
        })
      } else {
        response = await fetch('/api/admin/problem-statements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(problemData)
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save task statement')
      }

      const enhancedResult = {
        ...result.data,
        settings: typeof result.data.settings === 'string' 
          ? JSON.parse(result.data.settings) 
          : result.data.settings || formData.settings
      }

      if (editingProblem) {
        setProblems(prev => prev.map(p => 
          p.id === editingProblem.id ? enhancedResult : p
        ))
        toast.success('Task statement updated successfully!')
      } else {
        setProblems(prev => [enhancedResult, ...prev])
        toast.success('Task statement created successfully!')
      }

      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error saving task statement:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save task statement')
    }
  }

  const deleteProblem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task statement?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/problem-statements/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete task statement')
      }

      setProblems(prev => prev.filter(p => p.id !== id))
      toast.success('Task statement deleted successfully!')
    } catch (error) {
      console.error('Error deleting task statement:', error)
      toast.error('Failed to delete task statement')
    }
  }

  const openEditDialog = (problem: ProblemStatementsManagerProps['problemStatements'][0]) => {
    const settings = typeof problem.settings === 'string' 
      ? JSON.parse(problem.settings) 
      : problem.settings || {
          priority: 'medium',
          allowLateSubmissions: true,
          autoFeedback: false,
          requiresApproval: true,
          submissionFormFields: [...defaultFormFields]
        }

    setEditingProblem({
      ...problem,
      requirements: problem.requirements || [],
      settings
    } as ProblemStatement)
    setFormData({
      title: problem.title,
      description: problem.description,
      domain: problem.domain,
      sub_domain: problem.sub_domain,
      requirements: problem.requirements || [],
      is_active: problem.is_active,
      settings
    })
    setIsCreateDialogOpen(true)
  }

  const toggleProblemStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/problem-statements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      setProblems(prev => prev.map(p => 
        p.id === id ? { ...p, is_active: !currentStatus } : p
      ))
      toast.success(`Task ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 border-red-500 bg-red-500/10'
      case 'high': return 'text-orange-500 border-orange-500 bg-orange-500/10'
      case 'medium': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10'
      case 'low': return 'text-green-500 border-green-500 bg-green-500/10'
      default: return 'text-gray-500 border-gray-500 bg-gray-500/10'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return AlertCircle
      case 'high': return Flag
      case 'medium': return Clock
      case 'low': return CheckCircle
      default: return Clock
    }
  }

  const renderFieldPreview = (field: SubmissionFormField) => {
    const IconComponent = getIconComponent(field.icon || 'Type')
    
    return (
      <div key={field.id} className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <IconComponent className="w-4 h-4 text-primary" />
          {field.label}
          {field.required && <span className="text-red-500 text-xs">*</span>}
        </Label>
        
        {field.type === 'description' || field.type === 'custom_text' ? (
          <div className="relative">
            <Textarea 
              placeholder={field.placeholder}
              className="min-h-[100px] form-input-enhanced transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled
            />
          </div>
        ) : field.type.includes('file') ? (
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center bg-primary/5 hover:bg-primary/10 transition-colors">
            <Upload className="w-8 h-8 text-primary/60 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              Click to upload or drag and drop
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
          </div>
        ) : field.type === 'select' ? (
          <Select disabled>
            <SelectTrigger className="form-input-enhanced">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
          </Select>
        ) : field.type === 'radio' && field.options ? (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="radio" disabled className="text-primary focus:ring-primary" />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        ) : field.type === 'checkbox_group' && field.options ? (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox disabled />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        ) : (
          <Input 
            placeholder={field.placeholder}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            className="form-input-enhanced transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled
          />
        )}
        
        {field.helpText && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            {field.helpText}
          </p>
        )}
      </div>
    )
  }

  const renderSubmissionPreview = () => {
    const enabledFields = formData.settings.submissionFormFields
      .filter(field => field.enabled)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    
    return (
      <Card className="glass-card-prominent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Submit Solution: {formData.title || 'Task Title'}
              </CardTitle>
              <CardDescription className="text-sm">
                Upload your solution and provide the required information below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {enabledFields.map((field) => renderFieldPreview(field))}
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-border/50">
            <Button variant="outline" disabled className="hover-lift">
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white hover-lift" disabled>
              <Save className="w-4 h-4 mr-2" />
              Submit Solution
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderIconPicker = () => (
    <Dialog open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
      <DialogContent className="glass-card max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Choose Icon
          </DialogTitle>
          <DialogDescription>
            Select an icon for your form field
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] space-y-6">
          {Object.entries(groupedIcons).map(([category, icons]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="grid grid-cols-8 gap-2">
                {icons.map((iconData) => {
                  const IconComponent = iconData.icon
                  return (
                    <Button
                      key={iconData.name}
                      variant="outline"
                      size="sm"
                      className="h-12 w-12 p-0 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                      onClick={() => {
                        if (selectedFieldId) {
                          handleFormFieldChange(selectedFieldId, { icon: iconData.name })
                        }
                        setIconPickerOpen(false)
                      }}
                      title={iconData.name}
                    >
                      <IconComponent className="w-5 h-5" />
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <Card className="glass-card-prominent">
        <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
          <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Task Management Studio
                </CardTitle>
                <CardDescription className="text-base">
                  Create and manage tasks with advanced form builders and customization
            </CardDescription>
              </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white hover-lift" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                  Create Task
              </Button>
            </DialogTrigger>
              <DialogContent className="glass-card-prominent max-w-7xl max-h-[95vh] overflow-hidden">
                <DialogHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {editingProblem ? 'Edit Task Statement' : 'Create Task Statement'}
                </DialogTitle>
                <DialogDescription>
                        Configure task details, advanced settings, and custom submission form
                </DialogDescription>
                    </div>
                  </div>
              </DialogHeader>
              
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="form" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Form Builder
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="overflow-y-auto max-h-[calc(95vh-180px)] mt-6">
                    <form onSubmit={handleSubmit}>
                      <TabsContent value="basic" className="space-y-6 mt-0">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="space-y-3">
                            <Label htmlFor="title" className="text-sm font-semibold">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                              placeholder="Enter an engaging task title..."
                    required
                              className="form-input-enhanced h-12 text-lg"
                  />
                </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="domain" className="text-sm font-semibold">Domain</Label>
                    <Select
                      value={formData.domain}
                      onValueChange={(value) => handleInputChange('domain', value)}
                    >
                                <SelectTrigger className="form-input-enhanced h-12">
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                                  <SelectItem value="Technical">
                                    <div className="flex items-center gap-2">
                                      <Code className="w-4 h-4" />
                                      Technical
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="Corporate">
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="w-4 h-4" />
                                      Corporate
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="Creatives">
                                    <div className="flex items-center gap-2">
                                      <Palette className="w-4 h-4" />
                                      Creatives
                                    </div>
                                  </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                            <div className="space-y-3">
                              <Label htmlFor="sub_domain" className="text-sm font-semibold">Sub-domain</Label>
                    <Input
                      id="sub_domain"
                      value={formData.sub_domain}
                      onChange={(e) => handleInputChange('sub_domain', e.target.value)}
                                placeholder="e.g., Web Development, Marketing, Design"
                      required
                                className="form-input-enhanced h-12"
                    />
                  </div>
                </div>

                          <div className="space-y-3">
                            <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                              placeholder="Provide a comprehensive description of the task, objectives, and expectations..."
                              className="min-h-[120px] form-input-enhanced"
                    required
                  />
                </div>

                          <div className="space-y-4">
                            <Label className="text-sm font-semibold">Requirements</Label>
                            <AnimatePresence>
                  {formData.requirements.map((req, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className="flex gap-3"
                                >
                                  <div className="flex-1">
                      <Input
                        value={req}
                                      onChange={(e) => {
                                        const newRequirements = [...formData.requirements]
                                        newRequirements[index] = e.target.value
                                        handleInputChange('requirements', newRequirements)
                                      }}
                        placeholder={`Requirement ${index + 1}`}
                                      className="form-input-enhanced"
                      />
                                  </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                                    onClick={() => {
                                      const newRequirements = formData.requirements.filter((_, i) => i !== index)
                                      handleInputChange('requirements', newRequirements)
                                    }}
                                    className="hover:border-red-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                                </motion.div>
                  ))}
                            </AnimatePresence>
                  <Button
                    type="button"
                    variant="outline"
                              onClick={() => handleInputChange('requirements', [...formData.requirements, ''])}
                              className="w-full border-dashed hover:border-primary hover:text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
                        </motion.div>
                      </TabsContent>
                      
                      <TabsContent value="settings" className="space-y-6 mt-0">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                          <Card className="glass-card">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Task Configuration
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="space-y-3">
                                <Label className="text-sm font-semibold">Priority Level</Label>
                                <Select
                                  value={formData.settings.priority}
                                  onValueChange={(value) => handleInputChange('settings.priority', value)}
                                >
                                  <SelectTrigger className="form-input-enhanced">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Low Priority
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                        Medium Priority
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="high">
                                      <div className="flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-orange-500" />
                                        High Priority
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="urgent">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        Urgent
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-3">
                                <Label className="text-sm font-semibold">Max Submissions (Optional)</Label>
                                <Input
                                  type="number"
                                  value={formData.settings.maxSubmissions || ''}
                                  onChange={(e) => handleInputChange('settings.maxSubmissions', 
                                    e.target.value ? parseInt(e.target.value) : undefined)}
                                  placeholder="No limit"
                                  className="form-input-enhanced"
                                />
                              </div>

                              <div className="space-y-3">
                                <Label className="text-sm font-semibold">Submission Deadline (Optional)</Label>
                                <Input
                                  type="datetime-local"
                                  value={formData.settings.submissionDeadline || ''}
                                  onChange={(e) => handleInputChange('settings.submissionDeadline', e.target.value)}
                                  className="form-input-enhanced"
                                />
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="glass-card">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Submission Rules
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                  <div className="flex items-center space-x-3">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <Label className="text-sm font-medium">Allow late submissions</Label>
                                      <p className="text-xs text-muted-foreground">Accept submissions after deadline</p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    id="allowLateSubmissions"
                                    checked={formData.settings.allowLateSubmissions}
                                    onCheckedChange={(checked) => 
                                      handleInputChange('settings.allowLateSubmissions', checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                  <div className="flex items-center space-x-3">
                                    <Zap className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <Label className="text-sm font-medium">Enable AI auto-feedback</Label>
                                      <p className="text-xs text-muted-foreground">Automatic AI evaluation</p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    id="autoFeedback"
                                    checked={formData.settings.autoFeedback}
                                    onCheckedChange={(checked) => 
                                      handleInputChange('settings.autoFeedback', checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                  <div className="flex items-center space-x-3">
                                    <Shield className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <Label className="text-sm font-medium">Require manual approval</Label>
                                      <p className="text-xs text-muted-foreground">Admin review required</p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    id="requiresApproval"
                                    checked={formData.settings.requiresApproval}
                                    onCheckedChange={(checked) => 
                                      handleInputChange('settings.requiresApproval', checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                  <div className="flex items-center space-x-3">
                                    <Eye className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <Label className="text-sm font-medium">Publish task immediately</Label>
                                      <p className="text-xs text-muted-foreground">Make task visible to participants</p>
                                    </div>
                                  </div>
                                  <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => 
                                      handleInputChange('is_active', checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>
                      
                      <TabsContent value="form" className="space-y-6 mt-0">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-semibold flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Form Builder
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Customize the submission form with drag-and-drop fields
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Select onValueChange={(value) => addCustomField(value as SubmissionFormField['type'])}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Add Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="custom_text">
                                    <div className="flex items-center gap-2">
                                      <Type className="w-4 h-4" />
                                      Text Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="custom_file">
                                    <div className="flex items-center gap-2">
                                      <Upload className="w-4 h-4" />
                                      File Upload
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="email">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4" />
                                      Email Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="phone">
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      Phone Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="number">
                                    <div className="flex items-center gap-2">
                                      <Hash className="w-4 h-4" />
                                      Number Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="url">
                                    <div className="flex items-center gap-2">
                                      <Link className="w-4 h-4" />
                                      URL Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="date">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Date Field
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="select">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className="w-4 h-4" />
                                      Dropdown
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="radio">
                                    <div className="flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      Radio Buttons
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="checkbox_group">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      Checkbox Group
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {formData.settings.submissionFormFields
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
                              .map((field, index) => {
                                const IconComponent = getIconComponent(field.icon || 'Type')
                                return (
                                  <motion.div
                                    key={field.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Card className={`glass-card hover:border-primary/30 transition-all duration-200 ${!field.enabled ? 'opacity-50' : ''}`}>
                                      <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-6">
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                              <Checkbox
                                                checked={field.enabled}
                                                onCheckedChange={(checked) => 
                                                  handleFormFieldChange(field.id, { enabled: !!checked })}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                              />
                                            </div>
                                            <div className="flex items-center space-x-3">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedFieldId(field.id)
                                                  setIconPickerOpen(true)
                                                }}
                                                className="h-10 w-10 p-0"
                                              >
                                                <IconComponent className="w-4 h-4" />
                                              </Button>
                                              <div>
                                                <h4 className="font-semibold text-base">{field.label}</h4>
                                                <div className="flex items-center space-x-2">
                                                  <Badge variant={field.required ? 'destructive' : 'secondary'} className="text-xs">
                                                    {field.required ? 'Required' : 'Optional'}
                                                  </Badge>
                                                  <Badge variant="outline" className="text-xs">
                                                    {field.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => moveField(field.id, 'up')}
                                              disabled={index === 0}
                                              title="Move up"
                                            >
                                              <ChevronUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => moveField(field.id, 'down')}
                                              disabled={index === formData.settings.submissionFormFields.length - 1}
                                              title="Move down"
                                            >
                                              <ChevronDown className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => duplicateField(field.id)}
                                              title="Duplicate field"
                                            >
                                              <Copy className="w-4 h-4" />
                                            </Button>
                                            {field.id.startsWith('custom_') && (
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeCustomField(field.id)}
                                                className="text-red-500 hover:text-red-600 hover:border-red-500"
                                                title="Delete field"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Field Label</Label>
                                              <Input
                                                value={field.label}
                                                onChange={(e) => 
                                                  handleFormFieldChange(field.id, { label: e.target.value })}
                                                className="form-input-enhanced"
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Placeholder Text</Label>
                                              <Input
                                                value={field.placeholder || ''}
                                                onChange={(e) => 
                                                  handleFormFieldChange(field.id, { placeholder: e.target.value })}
                                                className="form-input-enhanced"
                                              />
                                            </div>

                                            {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'checkbox_group') && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium">Options (one per line)</Label>
                                                <Textarea
                                                  value={(field.options || []).join('\n')}
                                                  onChange={(e) => 
                                                    handleFormFieldChange(field.id, { 
                                                      options: e.target.value.split('\n').filter(opt => opt.trim())
                                                    })}
                                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                                  className="form-input-enhanced min-h-[80px]"
                                                />
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="space-y-4">
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Help Text</Label>
                                              <Textarea
                                                value={field.helpText || ''}
                                                onChange={(e) => 
                                                  handleFormFieldChange(field.id, { helpText: e.target.value })}
                                                className="form-input-enhanced min-h-[80px]"
                                                placeholder="Provide additional guidance for this field..."
                                              />
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                              <Label className="text-sm font-medium">Required field</Label>
                                              <Checkbox
                                                checked={field.required}
                                                onCheckedChange={(checked) => 
                                                  handleFormFieldChange(field.id, { required: !!checked })}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                              />
                                            </div>

                                            {field.type.includes('file') && (
                                              <div className="space-y-3">
                                                <div className="space-y-2">
                                                  <Label className="text-sm font-medium">Allowed File Types</Label>
                                                  <Input
                                                    value={(field.fileTypes || []).join(', ')}
                                                    onChange={(e) => 
                                                      handleFormFieldChange(field.id, { 
                                                        fileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                                      })}
                                                    placeholder="pdf, doc, docx, txt"
                                                    className="form-input-enhanced"
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-sm font-medium">Max File Size (MB)</Label>
                                                  <Input
                                                    type="number"
                                                    value={field.maxSize || ''}
                                                    onChange={(e) => 
                                                      handleFormFieldChange(field.id, { 
                                                        maxSize: e.target.value ? parseInt(e.target.value) : undefined
                                                      })}
                                                    className="form-input-enhanced"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )
                              })}
                          </div>
                        </motion.div>
                      </TabsContent>
                      
                      <TabsContent value="preview" className="mt-0">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Submission Form Preview</h3>
                            <p className="text-sm text-muted-foreground">
                              This is how the submission form will appear to participants
                            </p>
                          </div>
                          {renderSubmissionPreview()}
                        </motion.div>
                      </TabsContent>
                      
                      <div className="flex justify-end space-x-3 pt-8 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                          className="hover-lift"
                  >
                    Cancel
                  </Button>
                        <Button 
                          type="submit" 
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white hover-lift"
                        >
                          <Save className="w-4 h-4 mr-2" />
                    {editingProblem ? 'Update' : 'Create'} Task
                  </Button>
                </div>
              </form>
                  </div>
                </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
          <div className="space-y-6">
            {problems.map((problem, index) => {
              const PriorityIcon = getPriorityIcon(problem.settings?.priority || 'medium')
              
              return (
            <motion.div
              key={problem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
                  className="group relative"
            >
                  <Card className="glass-card hover:border-primary/30 transition-all duration-300 hover-lift">
                    <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold">{problem.title}</h3>
                    <Badge variant="outline" className={
                              problem.domain === 'Technical' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' :
                              problem.domain === 'Corporate' ? 'border-purple-500 text-purple-500 bg-purple-500/10' :
                              'border-pink-500 text-pink-500 bg-pink-500/10'
                    }>
                      {problem.domain}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {problem.sub_domain}
                    </Badge>
                            <Badge variant="outline" className={getPriorityColor(problem.settings?.priority || 'medium')}>
                              <PriorityIcon className="w-3 h-3 mr-1" />
                              {(problem.settings?.priority || 'medium').toUpperCase()}
                    </Badge>
                    {!problem.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {problem.description}
                  </p>
                  
                          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                              Created {new Date(problem.created_at || '').toLocaleDateString()}
                    </div>
                    {problem.requirements && (
                      <div className="flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        {problem.requirements.length} requirements
                      </div>
                    )}
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {problem.settings?.submissionFormFields?.filter(f => f.enabled).length || 5} form fields
                            </div>
                            {problem.settings?.submissionDeadline && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Due {new Date(problem.settings.submissionDeadline).toLocaleDateString()}
                              </div>
                            )}
                  </div>
                </div>
                
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                            onClick={() => toggleProblemStatus(problem.id!, problem.is_active)}
                            title={problem.is_active ? 'Deactivate task' : 'Activate task'}
                            className="hover-lift"
                          >
                            {problem.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(problem)}
                            title="Edit task"
                            className="hover-lift"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                            onClick={() => deleteProblem(problem.id!)}
                            title="Delete task"
                            className="text-red-500 hover:text-red-600 hover:border-red-500 hover-lift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
                    </CardContent>
                  </Card>
            </motion.div>
              )
            })}

          {problems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-primary" />
            </div>
                <h3 className="text-lg font-semibold mb-2">No tasks created yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first task with custom forms and advanced settings!
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white hover-lift"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </Button>
              </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
      
      {renderIconPicker()}
    </>
  )
}