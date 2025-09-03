import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin - MSA SRM specific admin emails
  const adminEmails = [
    'hello@mlsasrm.in'
  ]
  const isAdmin = user.email && adminEmails.includes(user.email)
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Create service role client for admin operations (bypasses RLS)
  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all submissions first
  const { data: submissionsRaw, error: submissionsError } = await adminSupabase
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
    .order('created_at', { ascending: false })

  // Fetch all profiles separately
  const { data: allProfiles, error: profilesError } = await adminSupabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      registration_number,
      department,
      phone,
      domains,
      sub_domains
    `)

  // Manually join submissions with profiles
  const submissions = submissionsRaw?.map(submission => ({
    ...submission,
    profiles: allProfiles?.find(profile => profile.id === submission.user_id) || null
  })) || []

  // Fetch all problem statements
  const { data: problemStatements, error: problemStatementsError } = await adminSupabase
    .from('problem_statements')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch user statistics with complete profile data
  const { data: userStats, error: userStatsError } = await adminSupabase
    .from('profiles')
    .select('*')

  // Debug logging
  console.log('Admin Data Debug:')
  console.log('Submissions Raw:', submissionsRaw?.length, submissionsError)
  console.log('All Profiles:', allProfiles?.length, profilesError)
  console.log('Submissions (joined):', submissions?.length)
  console.log('Problem Statements:', problemStatements?.length, problemStatementsError)
  console.log('User Stats:', userStats?.length, userStatsError)
  console.log('Sample submission:', submissions?.[0])
  console.log('Sample user stat:', userStats?.[0])

  return (
    <AdminDashboard
      user={user}
      submissions={submissions || []}
      problemStatements={problemStatements || []}
      userStats={userStats || []}
    />
  )
}
