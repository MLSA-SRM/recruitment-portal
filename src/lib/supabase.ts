import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      }
    }
  })
}




export type Database = {
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
          domain: string | null
          subdomain: string | null
          is_admin: boolean
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      tasks: {
        Row: {
          id: number
          created_at: string | null
          title: string
          description: string | null
          domain: string
          subdomain: string | null
          target_year: number
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['tasks']['Row']>
      }
      submissions: {
        Row: {
          id: number
          created_at: string | null
          applicant_id: string | null
          task_id: number | null
          submission_url: string
          status: 'pending' | 'shortlisted' | 'rejected'
          ai_score: number | null
          ai_review: string | null
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'status'> & { status?: 'pending' | 'shortlisted' | 'rejected' }
        Update: Partial<Database['public']['Tables']['submissions']['Row']>
      }
    }
  }
}


