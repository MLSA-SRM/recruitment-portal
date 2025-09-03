import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import TaskCard from './task-card'

export default async function ApplyPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view and apply for available positions.</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Setup Required</h1>
          <p className="text-gray-600 mb-6">Please complete your profile setup before applying for positions.</p>
          <Link href="/profile/setup">
            <Button>Complete Profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get tasks filtered by user's exact domain, subdomain, and year
  let { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('domain', profile.domain)
    .eq('subdomain', profile.subdomain)
    .eq('target_year', profile.year)
    .order('created_at', { ascending: false })

  // If no exact match found, show tasks for user's domain and year (without subdomain restriction)
  if (!tasks || tasks.length === 0) {
    const { data: fallbackTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('domain', profile.domain)
      .eq('target_year', profile.year)
      .order('created_at', { ascending: false })
    tasks = fallbackTasks
  }

  // If still no tasks found, show all tasks for the user's year
  if (!tasks || tasks.length === 0) {
    const { data: yearTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('target_year', profile.year)
      .order('created_at', { ascending: false })
    tasks = yearTasks
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-6">
            Available Positions for {profile.domain} - {profile.subdomain}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Showing tasks matching your {profile.domain} domain, {profile.subdomain} subdomain, and {profile.year === 1 ? '1st' : '2nd'} year level. 
            {tasks && tasks.length > 0 && (tasks[0]?.domain !== profile.domain || tasks[0]?.subdomain !== profile.subdomain) && 
              ` No exact matches found, showing related tasks.`
            }
          </p>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Available</h3>
            <p className="text-gray-600">
              There are currently no open positions. Please check back later or contact an administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
