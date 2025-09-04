import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { z } from 'zod'

const paramsSchema = z.object({ taskId: z.coerce.number().int().positive() })

export async function GET(_: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId: idParam } = await params
    const parsed = paramsSchema.safeParse({ taskId: idParam })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', parsed.data.taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in task API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}