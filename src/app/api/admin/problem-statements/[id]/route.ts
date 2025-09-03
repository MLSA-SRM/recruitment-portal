import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE API called')
    const { id: problemId } = await params
    console.log('Problem ID:', problemId)
    
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User:', user?.email, 'Error:', userError)
    
    if (userError || !user) {
      console.log('Unauthorized - no user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminEmails = ['hello@mlsasrm.in']
    if (!user.email || !adminEmails.includes(user.email)) {
      console.log('Access denied - not admin:', user.email)
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('Admin verified, proceeding with deletion')

    // Use service role client for admin operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Service client created, deleting from database')

    // Delete the problem statement using service role (bypasses RLS)
    const { error: deleteError, data } = await adminSupabase
      .from('problem_statements')
      .delete()
      .eq('id', problemId)

    console.log('Delete result:', { error: deleteError, data })

    if (deleteError) {
      console.error('Error deleting problem statement:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete problem statement: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Delete successful')
    return NextResponse.json({
      success: true,
      message: 'Problem statement deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminEmails = ['hello@mlsasrm.in']
    if (!user.email || !adminEmails.includes(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Use service role client for admin operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the problem statement using service role (bypasses RLS)
    const { data, error: updateError } = await adminSupabase
      .from('problem_statements')
      .update(body)
      .eq('id', problemId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating problem statement:', updateError)
      return NextResponse.json(
        { error: 'Failed to update problem statement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Problem statement updated successfully'
    })

  } catch (error) {
    console.error('Error in update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
