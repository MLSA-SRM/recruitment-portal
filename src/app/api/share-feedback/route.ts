import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { feedbackId, isShared } = await request.json()

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update feedback sharing status
    const { data, error } = await supabase
      .from('feedback')
      .update({
        is_shared: isShared,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update feedback sharing status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback: data,
      message: isShared ? 'Feedback shared with user' : 'Feedback sharing disabled'
    })

  } catch (error) {
    console.error('Error updating feedback sharing:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback sharing' },
      { status: 500 }
    )
  }
}
