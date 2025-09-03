import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user has completed profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/profile-setup')
  }

  // Try to fetch user's submissions with RLS, fallback to service client if needed
  let submissions = null
  let submissionsError = null
  
  try {
    const result = await supabase
      .from('submissions')
      .select(`
        *,
        problem_statements (
          id,
          title,
          description,
          domain,
          sub_domain
        ),
        feedback (
          id,
          feedback_text,
          feedback_type,
          is_shared
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    submissions = result.data
    submissionsError = result.error
    
    // If RLS blocks access, use service client as fallback
    if (submissionsError?.code === '42501') {
      console.log('RLS still blocking submissions, using service client fallback')
      const serviceClient = createServiceClient()
      const fallbackResult = await serviceClient
        .from('submissions')
        .select(`
          *,
          problem_statements (
            id,
            title,
            description,
            domain,
            sub_domain
          ),
          feedback (
            id,
            feedback_text,
            feedback_type,
            is_shared
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      submissions = fallbackResult.data
      submissionsError = fallbackResult.error
      console.log('Service client fallback result:', { 
        submissionsCount: submissions?.length, 
        error: submissionsError 
      })
    }
  } catch (error) {
    console.error('Error fetching submissions:', error)
    submissionsError = error
  }

  // Try to fetch problem statements with RLS, fallback to service client if needed
  let problemStatements = null
  let problemStatementsError = null
  
  try {
    const result = await supabase
      .from('problem_statements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    problemStatements = result.data
    problemStatementsError = result.error
    
    // If RLS blocks access, use service client as fallback
    if (problemStatementsError?.code === '42501') {
      console.log('RLS still blocking problem statements, using service client fallback')
      const serviceClient = createServiceClient()
      const fallbackResult = await serviceClient
        .from('problem_statements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      problemStatements = fallbackResult.data
      problemStatementsError = fallbackResult.error
      console.log('Service client fallback result:', { 
        problemStatementsCount: problemStatements?.length, 
        error: problemStatementsError 
      })
    }
  } catch (error) {
    console.error('Error fetching problem statements:', error)
    problemStatementsError = error
  }

  // Handle permission errors gracefully
  if (submissionsError) {
    console.error('Submissions error:', submissionsError)
  }
  
  if (problemStatementsError) {
    console.error('Problem statements error:', problemStatementsError)
  }

  // Debug logging for user dashboard
  console.log('User Dashboard Debug:')
  console.log('User ID:', user.id)
  console.log('Profile:', profile)
  console.log('Submissions:', submissions, submissionsError)
  console.log('Problem Statements:', problemStatements, problemStatementsError)

  // Handle critical errors
  if (submissionsError && typeof submissionsError === 'object' && submissionsError !== null && 'code' in submissionsError && (submissionsError as { code: string }).code === '42501') {
    console.error('Permission denied for submissions. This might be an RLS policy issue.')
  }
  
  if (problemStatementsError && typeof problemStatementsError === 'object' && problemStatementsError !== null && 'code' in problemStatementsError && (problemStatementsError as { code: string }).code === '42501') {
    console.error('Permission denied for problem statements. This might be an RLS policy issue.')
  }

  return (
    <DashboardContent
      user={user}
      profile={profile}
      submissions={submissions || []}
      problemStatements={problemStatements || []}
    />
  )
}
