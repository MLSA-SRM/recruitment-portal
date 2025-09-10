import { NextRequest, NextResponse } from 'next/server'
import { canSubmitToTask } from '@/app/actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const retry = searchParams.get('retry')
    const forceRefresh = searchParams.get('forceRefresh')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }
    
    // Add a small delay for retry requests to handle race conditions
    if (retry === 'true') {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Force refresh by clearing cache if requested
    if (forceRefresh === 'true') {
      const { cache } = await import('@/lib/cache')
      cache.invalidatePattern('user_submissions:')
      cache.invalidatePattern('admin_submissions:')
    }
    
    const status = await canSubmitToTask(Number(taskId))
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching submission status:', error)
    return NextResponse.json({ error: 'Failed to fetch submission status' }, { status: 500 })
  }
}
