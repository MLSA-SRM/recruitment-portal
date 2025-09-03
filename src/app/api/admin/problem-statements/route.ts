import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Create the problem statement using service role (bypasses RLS)
    const { data, error: insertError } = await adminSupabase
      .from('problem_statements')
      .insert(body)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating problem statement:', insertError)
      return NextResponse.json(
        { error: 'Failed to create problem statement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Problem statement created successfully'
    })

  } catch (error) {
    console.error('Error in create API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
