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
  Plus,
  Briefcase,
  UserCheck,
  Menu,
  X
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
              MSASRM
            </Link>
            <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }
  
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image 
              src="/logo.svg" 
              alt="MSASRM" 
              width={32}
              height={32}
              className="h-8 w-8 transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              MSASRM
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className={`hidden md:flex items-center space-x-2 ${!user ? 'ml-auto' : ''}`}>
            {!user ? (
              // Not authenticated - show login/signup
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : !profile ? (
              // Authenticated but no profile - show profile setup
              <>
                <Link href="/profile/setup">
                  <Button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-105">
                    Complete Profile
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut} className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105">
                  Sign Out
                </Button>
              </>
            ) : (
              // Authenticated with profile - show appropriate navigation
              <>
                <Link href="/apply">
                  <Button
                    variant={isActive('/apply') ? 'default' : 'ghost'}
                    className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isActive('/apply') 
                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse Tasks
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant={isActive('/dashboard') ? 'default' : 'ghost'}
                    className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      isActive('/dashboard') 
                        ? 'bg-blue-600 text-white shadow-md scale-105' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    My Submissions
                  </Button>
                </Link>
                
                {/* Admin Navigation Separator */}
                {profile.is_admin && (
                  <div className="w-px h-6 bg-gray-300 mx-2 transition-all duration-300 ease-in-out opacity-60 hover:opacity-100"></div>
                )}
                
                {profile.is_admin && (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-blue-100">
                        Admin
                      </span>
                    </div>
                    <Link href="/admin/dashboard">
                      <Button
                        variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
                        className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                          isActive('/admin/dashboard') 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin/tasks">
                      <Button
                        variant={isActive('/admin/tasks') ? 'default' : 'ghost'}
                        className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                          isActive('/admin/tasks') 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Tasks
                      </Button>
                    </Link>
                    <Link href="/admin/tasks/create">
                      <Button
                        variant={isActive('/admin/tasks/create') ? 'default' : 'ghost'}
                        className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                          isActive('/admin/tasks/create') 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </Link>
                    <Link href="/admin/export">
                      <Button
                        variant={isActive('/admin/export') ? 'default' : 'ghost'}
                        className={`px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                          isActive('/admin/export') 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Menu / Mobile Menu */}
          <div className="flex items-center space-x-2">
            {user && profile && (
              <div className="hidden md:flex items-center space-x-3">
                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
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
                  className="px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Sign Out
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 transition-transform duration-300 ease-in-out" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-300 ease-in-out" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50 py-4 animate-in slide-in-from-top-2 duration-300 ease-out">
            <div className="space-y-2 px-4">
              {!user ? (
                // Not authenticated - show login/signup
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : !profile ? (
                // Authenticated but no profile - show profile setup
                <>
                  <Link href="/profile/setup">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
                      Complete Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105">
                    Sign Out
                  </Button>
                </>
              ) : (
                // Authenticated with profile - show appropriate navigation
                <>
                  <Link href="/apply">
                    <Button
                      variant={isActive('/apply') ? 'default' : 'ghost'}
                      className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                        isActive('/apply') 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Tasks
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant={isActive('/dashboard') ? 'default' : 'ghost'}
                      className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                        isActive('/dashboard') 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
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
                        <Button
                          variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
                          className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                            isActive('/admin/dashboard') 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/tasks">
                        <Button
                          variant={isActive('/admin/tasks') ? 'default' : 'ghost'}
                          className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                            isActive('/admin/tasks') 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Tasks
                        </Button>
                      </Link>
                      <Link href="/admin/tasks/create">
                        <Button
                          variant={isActive('/admin/tasks/create') ? 'default' : 'ghost'}
                          className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                            isActive('/admin/tasks/create') 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </Link>
                      <Link href="/admin/export">
                        <Button
                          variant={isActive('/admin/export') ? 'default' : 'ghost'}
                          className={`w-full justify-start transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                            isActive('/admin/export') 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
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
                      <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
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
