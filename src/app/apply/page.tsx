import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, User } from 'lucide-react'
import TaskCard from './task-card'

export default async function ApplyPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is authenticated
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-destructive">Authentication Required</h1>
                <p className="text-muted-foreground mt-2">Please sign in to view and apply for available positions.</p>
              </div>
              <Link href="/auth/signin">
                <Button className="mt-4">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has completed onboarding
  const { data: authCheck } = await supabase
    .from('auth_check')
    .select('is_onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (!authCheck?.is_onboarding_complete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-orange-800">Profile Setup Required</h1>
                <p className="text-orange-700 mt-2">Please complete your profile setup to access the dashboard.</p>
              </div>
              <Link href="/profile/setup">
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                  <User className="h-4 w-4 mr-2" />
                  Complete Profile Setup
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get user profile for domain/subdomain filtering
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-destructive">Profile Not Found</h1>
                <p className="text-muted-foreground mt-2">There was an issue loading your profile. Please try again.</p>
              </div>
              <Link href="/profile/setup">
                <Button className="mt-4">
                  <User className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get tasks filtered by user's domains and subdomains
  // Support both legacy single values and new array values
  const userDomains = profile.domains && profile.domains.length > 0 ? profile.domains : [profile.domain].filter(Boolean)
  const userSubdomains = profile.subdomains && profile.subdomains.length > 0 ? profile.subdomains : [profile.subdomain].filter(Boolean)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('domain', userDomains)
    .in('subdomain', userSubdomains)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-6">
            Available Tasks for Your Domains
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Showing tasks matching your domains ({userDomains.join(', ')}) and subdomains ({userSubdomains.join(', ')}).
            {(!tasks || tasks.length === 0) && 
              ` No tasks are currently available for your specific profile. Check back later for new opportunities.`
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
