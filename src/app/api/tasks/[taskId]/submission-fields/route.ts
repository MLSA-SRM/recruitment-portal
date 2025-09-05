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
    const { data, error } = await supabase
      .from('submission_fields')
      .select('*')
      .eq('task_id', parsed.data.taskId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching submission fields:', error)
      return NextResponse.json({ error: 'Failed to fetch submission fields' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in submission fields API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}