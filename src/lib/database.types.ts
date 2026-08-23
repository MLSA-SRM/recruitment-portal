// Auto-generated database types based on the actual schema
// This should be regenerated when the database schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          ra_number: string | null
          phone_number: number | null
          department: string | null
          branch: string | null
          year: number | null
          is_admin: boolean
          domain: string | null
          subdomain: string | null
          domains: string[]
          subdomains: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          ra_number?: string | null
          phone_number?: number | null
          department?: string | null
          branch?: string | null
          year?: number | null
          is_admin?: boolean
          domain?: string | null
          subdomain?: string | null
          domains?: string[]
          subdomains?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          ra_number?: string | null
          phone_number?: number | null
          department?: string | null
          branch?: string | null
          year?: number | null
          is_admin?: boolean
          domain?: string | null
          subdomain?: string | null
          domains?: string[]
          subdomains?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          title: string
          description: string | null
          domain: string
          subdomain: string | null
          target_year: number | null
          deadline: string | null
          requirements: string | null
          deliverables: string | null
          estimated_duration: string | null
          image_url: string | null
          created_by: string | null
        }
        Insert: {
          id?: never
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          domain: string
          subdomain?: string | null
          target_year?: number | null
          deadline?: string | null
          requirements?: string | null
          deliverables?: string | null
          estimated_duration?: string | null
          image_url?: string | null
          created_by?: string | null
        }
        Update: {
          id?: never
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          domain?: string
          subdomain?: string | null
          target_year?: number | null
          deadline?: string | null
          requirements?: string | null
          deliverables?: string | null
          estimated_duration?: string | null
          image_url?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          applicant_id: string | null
          task_id: number | null
          submission_url: string
          status: 'pending' | 'shortlisted' | 'rejected'
          ai_score: number | null
          ai_review: string | null
          ai_recommendation: 'shortlist' | 'reject' | 'neutral' | null
          admin_review: string | null
          submitted_at: string
          submission_data: Json
        }
        Insert: {
          id?: never
          created_at?: string
          updated_at?: string
          applicant_id?: string | null
          task_id?: number | null
          submission_url?: string
          status?: 'pending' | 'shortlisted' | 'rejected'
          ai_score?: number | null
          ai_review?: string | null
          ai_recommendation?: 'shortlist' | 'reject' | 'neutral' | null
          admin_review?: string | null
          submitted_at?: string
          submission_data?: Json
        }
        Update: {
          id?: never
          created_at?: string
          updated_at?: string
          applicant_id?: string | null
          task_id?: number | null
          submission_url?: string
          status?: 'pending' | 'shortlisted' | 'rejected'
          ai_score?: number | null
          ai_review?: string | null
          ai_recommendation?: 'shortlist' | 'reject' | 'neutral' | null
          admin_review?: string | null
          submitted_at?: string
          submission_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "submissions_applicant_id_fkey"
            columns: ["applicant_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      submission_fields: {
        Row: {
          id: number
          task_id: number
          field_name: string
          field_type: 'text' | 'textarea' | 'file' | 'checkbox' | 'select' | 'number' | 'url' | 'email'
          field_label: string
          field_description: string | null
          is_required: boolean
          field_options: Json | null
          validation_rules: Json | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          task_id: number
          field_name: string
          field_type: 'text' | 'textarea' | 'file' | 'checkbox' | 'select' | 'number' | 'url' | 'email'
          field_label: string
          field_description?: string | null
          is_required?: boolean
          field_options?: Json | null
          validation_rules?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          task_id?: number
          field_name?: string
          field_type?: 'text' | 'textarea' | 'file' | 'checkbox' | 'select' | 'number' | 'url' | 'email'
          field_label?: string
          field_description?: string | null
          is_required?: boolean
          field_options?: Json | null
          validation_rules?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_fields_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Profile = Tables<'profiles'>
export type Task = Tables<'tasks'>
export type Submission = Tables<'submissions'>
export type SubmissionField = Tables<'submission_fields'>

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
export type SubmissionFieldInsert = Database['public']['Tables']['submission_fields']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']
export type SubmissionFieldUpdate = Database['public']['Tables']['submission_fields']['Update']

// Extended types with relationships
export type SubmissionWithTask = Submission & {
  task: Task | null
}

export type SubmissionWithProfile = Submission & {
  profile: Profile | null
}

export type SubmissionWithJoins = Submission & {
  task: Task | null
  profile: Profile | null
}

export type TaskWithFields = Task & {
  submission_fields: SubmissionField[]
}

export type TaskWithSubmissions = Task & {
  submissions: Submission[]
}
