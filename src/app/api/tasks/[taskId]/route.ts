import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { z } from 'zod'

const paramsSchema = z.object({ taskId: z.coerce.number().int().positive() })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const parsed = paramsSchema.safeParse({ taskId })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }
    const id = parsed.data.taskId
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

    // Fetch the task
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
