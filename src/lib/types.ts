// Types for the recruitment portal

export interface Profile {
  id: string
  name: string
  email: string
  domain: string
  subdomain: string
  target_year: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  domain: string
  subdomain: string
  target_year: number
  deadline: string
  requirements: string
  deliverables: string
  created_at: string
  updated_at: string
  submission_fields?: SubmissionField[]
  image_url?: string
}

export interface SubmissionField {
  id: number
  task_id: number
  field_name: string
  field_type: 'text' | 'textarea' | 'file' | 'checkbox' | 'select' | 'number' | 'url' | 'email'
  field_label: string
  field_description?: string
  is_required: boolean
  field_options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
  display_order: number
  created_at: string
  updated_at: string
}

export interface Submission {
  id: number
  task_id: number
  applicant_id: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  feedback?: string
  score?: number
  submitted_at: string
  reviewed_at?: string
  submission_data: Record<string, unknown> // Dynamic data based on submission fields
}

export interface SubmissionWithTask {
  id: number
  submission_url?: string
  status: string
  ai_score?: number
  ai_review?: string
  ai_recommendation?: 'shortlist' | 'reject'
  created_at: string
  updated_at?: string
  tasks: Array<{
    title: string
    domain: string
    subdomain?: string
    target_year?: number
    deadline?: string
  }> | null
}

export interface SubmissionFieldValue {
  field_id: number
  field_name: string
  field_type: string
  value: unknown
}

// Field type configurations
export const FIELD_TYPES = {
  text: {
    label: 'Text Input',
    description: 'Single line text input',
    icon: 'Type'
  },
  textarea: {
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: 'AlignLeft'
  },
  file: {
    label: 'File Upload',
    description: 'File upload field',
    icon: 'Upload'
  },
  checkbox: {
    label: 'Checkbox',
    description: 'Single checkbox or checkbox group',
    icon: 'CheckSquare'
  },
  select: {
    label: 'Dropdown Select',
    description: 'Dropdown selection from options',
    icon: 'ChevronDown'
  },
  number: {
    label: 'Number Input',
    description: 'Numeric input field',
    icon: 'Hash'
  },
  url: {
    label: 'URL Input',
    description: 'URL/website input field',
    icon: 'Link'
  },
  email: {
    label: 'Email Input',
    description: 'Email address input field',
    icon: 'Mail'
  }
} as const

// Validation rule types
export interface ValidationRules {
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  pattern?: string
  file_types?: string[]
  file_size?: number // in MB
  required?: boolean
}

// Field options for different field types
export interface FieldOptions {
  placeholder?: string
  default_value?: unknown
  options?: Array<{ label: string; value: string | number }>
  multiple?: boolean
  rows?: number
  min?: number
  max?: number
  step?: number
}
