import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, is_shared } = await request.json()
    const { id: submissionId } = await params

    const supabase = await createClient()

    // Update submission status
    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if (is_shared !== undefined) updates.is_shared = is_shared

    // Update submission first
    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', submissionId)
      .select(`
        *,
        problem_statements (
          title,
          domain,
          sub_domain
        )
      `)
      .single()

    if (submissionError) throw submissionError

    // Get user profile separately
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        full_name,
        registration_number,
        department
      `)
      .eq('id', submissionData.user_id)
      .single()

    if (profileError) {
      console.warn('Could not fetch user profile:', profileError)
    }

    // Combine the data
    const data = {
      ...submissionData,
      profiles: profile
    }

    // Update leaderboard if status changed to shortlisted
    if (status === 'shortlisted') {
      const { error: leaderboardError } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: data.user_id,
          score: 100, // Base score for shortlisted submission
          domain: data.problem_statements?.domain,
          sub_domain: data.problem_statements?.sub_domain,
          updated_at: new Date().toISOString()
        })

      if (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError)
      }
    }

    return NextResponse.json({
      success: true,
      submission: data,
      message: 'Submission updated successfully'
    })

  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params
    const supabase = await createClient()

    // Delete related feedback first
    await supabase
      .from('feedback')
      .delete()
      .eq('submission_id', submissionId)

    // Delete submission
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
