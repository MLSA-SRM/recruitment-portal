import { NextRequest, NextResponse } from 'next/server'
import { canSubmitToTask } from '@/app/actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }
    
    const status = await canSubmitToTask(Number(taskId))
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching submission status:', error)
    return NextResponse.json({ error: 'Failed to fetch submission status' }, { status: 500 })
  }
}
