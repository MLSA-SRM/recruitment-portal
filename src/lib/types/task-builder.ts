// Task Builder Types and Interfaces

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'link'
  | 'code'
  | 'rating'
  | 'boolean'

export interface FieldOption {
  value: string
  label: string
  description?: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: string | number | boolean | null
  message: string
  condition?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: string | number | boolean | null
  }
}

export interface ScoringCriteria {
  fieldId: string
  criteria: string
  maxPoints: number
  weight: number
  description?: string
}

export interface TaskField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  description?: string
  required: boolean
  options?: FieldOption[]
  validation?: ValidationRule[]
  defaultValue?: string | number | boolean | null
  order: number
  isVisible: boolean
  visibilityCondition?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: string | number | boolean | null
  }
  metadata?: {
    maxLength?: number
    minLength?: number
    accept?: string // for file uploads
    rows?: number // for textarea
    language?: string // for code fields
    maxRating?: number // for rating fields
  }
}

export interface TaskSection {
  id: string
  title: string
  description?: string
  fields: TaskField[]
  order: number
  isVisible: boolean
  visibilityCondition?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: string | number | boolean | null
  }
}

export interface TaskTemplate {
  id: string
  title: string
  description: string
  domain: string
  subdomain?: string
  subSubdomain?: string
  yearRequirement?: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  estimatedTime: number // in minutes
  maxScore: number
  sections: TaskSection[]
  scoringCriteria: ScoringCriteria[]
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
  metadata: {
    tags: string[]
    prerequisites?: string[]
    resources?: string[]
    deadline?: string
    isActive: boolean
  }
}

export interface SubmissionData {
  [fieldId: string]: string | number | boolean | string[] | File | null
}

export interface SubmissionReview {
  submissionId: string
  reviewerId: string
  overallScore: number
  maxScore: number
  criteriaScores: {
    criteriaId: string
    score: number
    maxScore: number
    feedback: string
  }[]
  overallFeedback: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  status: 'draft' | 'completed'
  reviewedAt: string
  aiAnalysis?: {
    automatedScore: number
    keyInsights: string[]
    codeQuality?: number
    innovation?: number
    completeness?: number
    technicalSkills?: number
  }
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  domain: string
  subdomain?: string
  subSubdomain?: string
  year: string
  totalScore: number
  submissionCount: number
  averageScore: number
  bestScore: number
  rank: number
  status: 'active' | 'shortlisted' | 'accepted'
  lastSubmissionDate: string
  achievements: string[]
}

export interface LeaderboardFilters {
  domain?: string
  subdomain?: string
  subSubdomain?: string
  year?: string
  status?: string
  sortBy?: 'score' | 'rank' | 'submissions' | 'recent'
  sortOrder?: 'asc' | 'desc'
}

// Task Builder State Management
export interface TaskBuilderState {
  currentTask: Partial<TaskTemplate>
  selectedSection: string | null
  selectedField: string | null
  previewMode: boolean
  validationErrors: Record<string, string>
}

// Form Field Components Props
export interface BaseFieldProps {
  field: TaskField
  value: string | number | boolean | string[] | File | null
  onChange: (value: string | number | boolean | string[] | File | null) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
}

export interface FieldBuilderProps {
  field: Partial<TaskField>
  onUpdate: (field: Partial<TaskField>) => void
  onDelete: () => void
  availableFields: string[]
}

// Report Generation Types
export interface SubmissionReport {
  submissionId: string
  taskId: string
  taskTitle: string
  userId: string
  userName: string
  userEmail: string
  submittedAt: string
  reviewedAt?: string
  status: string
  score?: number
  maxScore: number
  percentage?: number
  grade?: string
  review?: SubmissionReview
  submissionData: SubmissionData
  timeSpent?: number // in minutes
  attempts: number
}

export interface AdminReport {
  totalSubmissions: number
  reviewedSubmissions: number
  pendingReviews: number
  averageScore: number
  topPerformers: LeaderboardEntry[]
  domainStats: {
    domain: string
    submissions: number
    averageScore: number
    completionRate: number
  }[]
  timeStats: {
    averageTimeSpent: number
    fastestCompletion: number
    slowestCompletion: number
  }
  qualityMetrics: {
    codeQuality: number
    innovation: number
    completeness: number
    technicalSkills: number
  }
}

// Utility Types
export type TaskFieldMap = Record<string, TaskField>
export type SubmissionFieldMap = Record<string, string | number | boolean | string[] | File | null>
export type ValidationResult = {
  isValid: boolean
  errors: Record<string, string>
}
