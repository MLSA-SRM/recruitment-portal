'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  FileText,
  Briefcase,
  UserCheck,
  Menu,
  X,
  Plus, // eslint-disable-line @typescript-eslint/no-unused-vars
  Download,
  History,
} from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
      const supabase = createSupabaseClient()
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
      
      setLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUser()
      } else {
        setProfile(null)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [supabase])
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  const isActive = (path: string) => pathname === path
  
  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-black tracking-tight text-gray-900">
              MSA SRM
            </Link>
            <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }
  
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image 
                src="/logo.svg" 
                alt="MSA SRM" 
                width={32}
                height={32}
                className="h-8 w-8 transition-transform group-hover:scale-110"
              />
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                MSA SRM
              </span>
            </Link>
          </div>
          
          {/* Navigation Links (center) */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
            {!user || !profile ? (
              // For unauthenticated or incomplete profile, keep center empty to avoid layout shifts
              <></>
            ) : (
              // Authenticated with profile - show appropriate navigation
              <div className="flex items-center space-x-1">
                <Link href="/apply">
                  <Button 
                    variant={isActive('/apply') ? 'default' : 'ghost'} 
                    size="sm"
                    className="px-3"
                  >
                    <Briefcase className="h-4 w-4 mr-1.5" />
                    Browse Tasks
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button 
                    variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                    size="sm"
                    className="px-3"
                  >
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    My Submissions
                  </Button>
                </Link>
                
                {/* Admin Navigation */}
                {profile.is_admin && (
                  <>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Admin
                      </span>
                      <Link href="/admin/dashboard">
                        <Button 
                          variant={isActive('/admin/dashboard') ? 'default' : 'ghost'} 
                          size="sm"
                          className="px-3"
                        >
                          <BarChart3 className="h-4 w-4 mr-1.5" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/tasks">
                        <Button
                          variant={isActive('/admin/tasks') ? 'default' : 'ghost'}
                          size="sm"
                          className="px-3"
                        >
                          <FileText className="h-4 w-4 mr-1.5" />
                          Tasks
                        </Button>
                      </Link>
                      <Link href="/admin/activity">
                        <Button
                          variant={isActive('/admin/activity') ? 'default' : 'ghost'}
                          size="sm"
                          className="px-3"
                        >
                          <History className="h-4 w-4 mr-1.5" />
                          Activity
                        </Button>
                      </Link>
                      <Link href="/admin/export">
                        <Button
                          variant={isActive('/admin/export') ? 'default' : 'ghost'}
                          size="sm"
                          className="px-3"
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          Export
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Menu / Mobile Menu (right) */}
          <div className="flex items-center space-x-2 ml-auto">
            {!user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="px-4">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="px-4">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
            {user && !profile && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/profile/setup">
                  <Button size="sm" className="px-4">
                    Complete Profile
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut} size="sm" className="px-4">
                  Sign Out
                </Button>
              </div>
            )}
            {user && profile && (
              <div className="hidden md:flex items-center space-x-3">
                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-blue-700">
                      {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {profile.name}
                  </span>
                </div>
                
                {/* Sign Out Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                >
                  Sign Out
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50 py-4 shadow-lg">
            <div className="space-y-1 px-4">
              {!user ? (
                // Not authenticated - show login/signup
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="w-full justify-start">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : !profile ? (
                // Authenticated but no profile - show profile setup
                <>
                  <Link href="/profile/setup">
                    <Button className="w-full justify-start">
                      Complete Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                    Sign Out
                  </Button>
                </>
              ) : (
                // Authenticated with profile - show appropriate navigation
                <>
                  <Link href="/apply">
                    <Button variant={isActive('/apply') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Tasks
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                      <UserCheck className="h-4 w-4 mr-2" />
                      My Submissions
                    </Button>
                  </Link>
                  {profile.is_admin && (
                    <>
                      <div className="pt-2 pb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</span>
                      </div>
                      <Link href="/admin/dashboard">
                        <Button variant={isActive('/admin/dashboard') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/tasks">
                        <Button variant={isActive('/admin/tasks') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                          <FileText className="h-4 w-4 mr-2" />
                          Tasks
                        </Button>
                      </Link>
                      <Link href="/admin/activity">
                        <Button variant={isActive('/admin/activity') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                          <History className="h-4 w-4 mr-2" />
                          Activity
                        </Button>
                      </Link>
                      <Link href="/admin/export">
                        <Button variant={isActive('/admin/export') ? 'default' : 'ghost'} className="w-full justify-start h-10">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </Link>
                    </>
                  )}
                  {user && profile && (
                    <>
                      <div className="pt-2 pb-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {profile.name}
                        </span>
                      </div>
                      <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                        Sign Out
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
