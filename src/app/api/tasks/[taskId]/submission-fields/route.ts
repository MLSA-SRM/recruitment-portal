import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const supabase = await createSupabaseServer()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile to check if they can access this task
    const { data: profile } = await supabase
      .from('profiles')
      .select('domain, subdomain, year, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // First check if the task exists and user can access it
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('domain, subdomain, target_year')
      .eq('id', taskId)
      .single()

    if (taskError) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user can access this task (admin can see all, others only see matching tasks)
    if (!profile.is_admin) {
      const canAccess = task.domain === profile.domain && 
                       task.subdomain === profile.subdomain && 
                       task.target_year === profile.year
      
      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied - task does not match your profile' }, { status: 403 })
      }
    }
    
    const { data: submissionFields, error } = await supabase
      .from('submission_fields')
      .select('*')
      .eq('task_id', taskId)
      .order('display_order')

    if (error) {
      console.error('Error fetching submission fields:', error)
      // Return empty array if no fields found (not an error)
      return NextResponse.json([])
    }

    return NextResponse.json(submissionFields || [])
  } catch (error) {
    console.error('Error fetching submission fields:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
