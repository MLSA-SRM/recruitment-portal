import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import TaskCard from './task-card'
import { Calendar, Users, Target, AlertCircle, Info } from 'lucide-react'

export default async function ApplyPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-6xl mb-6">🔐</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Please sign in to view and apply for available positions. You&apos;ll need to create an account or sign in with your existing credentials.
            </p>
            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full sm:w-auto">Sign In</Button>
              </Link>
              <p className="text-sm text-gray-500">
                Don&apos;t have an account? <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign up here</Link>
              </p>
            </div>
          </div>
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
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-6xl mb-6">👤</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Setup Required</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Please complete your profile setup before applying for positions. This helps us match you with the right opportunities.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What you&apos;ll need:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Your personal information (name, RA number, etc.)</li>
                    <li>• Academic details (department, branch, year)</li>
                    <li>• Domain and subdomain preferences</li>
                  </ul>
                </div>
              </div>
            </div>
            <Link href="/profile/setup">
              <Button className="w-full sm:w-auto">Complete Profile Setup</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get tasks filtered by user's domains, subdomains, and year
  // Support both legacy single values and new array values
  const userDomains = profile.domains && profile.domains.length > 0 ? profile.domains : [profile.domain].filter(Boolean)
  const userSubdomains = profile.subdomains && profile.subdomains.length > 0 ? profile.subdomains : [profile.subdomain].filter(Boolean)
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('domain', userDomains)
    .in('subdomain', userSubdomains)
    .eq('target_year', profile.year)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-6">
            Available Positions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Showing tasks matching your profile preferences and academic level.
          </p>
          
          {/* Profile Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl mx-auto mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Domains</p>
                  <p className="text-gray-900">{userDomains.join(', ') || 'None selected'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Subdomains</p>
                  <p className="text-gray-900">{userSubdomains.join(', ') || 'None selected'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Year Level</p>
                  <p className="text-gray-900">{profile.year === 1 ? '1st Year' : '2nd Year'}</p>
                </div>
              </div>
            </div>
          </div>
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
            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
              <div className="text-gray-400 text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Tasks Available</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                There are currently no open positions matching your profile. This could be because:
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <ul className="space-y-1">
                      <li>• No tasks are currently open for your domains/subdomains</li>
                      <li>• All positions for your year level are filled</li>
                      <li>• New tasks haven&apos;t been posted yet</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Check back regularly for new opportunities, or contact an administrator if you believe this is an error.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
