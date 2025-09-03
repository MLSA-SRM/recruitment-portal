export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          registration_number: string
          department: string
          phone: string
          domains: string[]
          sub_domains: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          registration_number: string
          department: string
          phone: string
          domains: string[]
          sub_domains: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          registration_number?: string
          department?: string
          phone?: string
          domains?: string[]
          sub_domains?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      problem_statements: {
        Row: {
          id: string
          title: string
          description: string
          domain: string
          sub_domain: string
          requirements: string[]
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          domain: string
          sub_domain: string
          requirements: string[]
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          domain?: string
          sub_domain?: string
          requirements?: string[]
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          problem_statement_id: string
          github_link: string | null
          deployed_link: string | null
          video_url: string | null
          document_url: string | null
          status: 'pending' | 'shortlisted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem_statement_id: string
          github_link?: string | null
          deployed_link?: string | null
          video_url?: string | null
          document_url?: string | null
          status?: 'pending' | 'shortlisted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          problem_statement_id?: string
          github_link?: string | null
          deployed_link?: string | null
          video_url?: string | null
          document_url?: string | null
          status?: 'pending' | 'shortlisted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      ai_feedback: {
        Row: {
          id: string
          submission_id: string
          feedback: string
          score: number
          is_visible_to_candidate: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          feedback: string
          score: number
          is_visible_to_candidate?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          feedback?: string
          score?: number
          is_visible_to_candidate?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leaderboard: {
        Row: {
          id: string
          user_id: string
          total_submissions: number
          shortlisted_count: number
          score: number
          rank: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_submissions?: number
          shortlisted_count?: number
          score?: number
          rank?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_submissions?: number
          shortlisted_count?: number
          score?: number
          rank?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
