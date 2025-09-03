'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/auth-actions'
import { 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Menu,
  X,
  Home
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface AdminHeaderProps {
  user: User
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 navbar-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Logo 
              size="md" 
              showText={false} 
              href="/admin" 
              animate={true}
              className="hover:scale-105 transition-transform duration-200"
            />
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Admin Panel
                </span>
                <p className="text-xs text-muted-foreground">Management Dashboard</p>
              </div>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Use tabs below to navigate</p>
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Back to User Dashboard */}
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                User View
              </Link>
            </Button>

            {/* User Menu */}
            {isClient && (
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user?.email?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none neon-text-cyan">
                      Administrator
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'admin@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    View as User
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 py-4"
          >
            <div className="flex flex-col space-y-4">
              <Link 
                href="/admin" 
                className="text-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/submissions" 
                className="text-muted-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Submissions
              </Link>
              <Link 
                href="/admin/users" 
                className="text-muted-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link 
                href="/admin/analytics" 
                className="text-muted-foreground hover:text-primary transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  )
}
