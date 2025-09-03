import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const supabase = await createSupabaseServer()
    
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
