'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  Home,
  FileText,
  TrendingUp,
  Bell,
  Search,
  Plus,
  Sparkles
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface DashboardHeaderProps {
  user: User
  profile: Record<string, unknown>
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, active: true },
    { href: '/dashboard?tab=submissions', label: 'Submissions', icon: TrendingUp },
    { href: '/dashboard?tab=problems', label: 'Tasks', icon: FileText },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Logo
              size="md"
              showText={true}
              href="/dashboard"
              animate={true}
              className="hover:scale-105 transition-transform duration-200"
            />


          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-all duration-200 font-medium px-4 py-2.5 rounded-xl hover:bg-primary/10 group"
                >
                  <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            ))}

            {/* Admin Link - only show for admin users */}
            {(user.email === 'hello@mlsasrm.in' || user.email === 'lk7565@srmist.edu.in') && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 text-accent hover:text-accent/80 transition-all duration-200 font-medium px-4 py-2.5 rounded-xl hover:bg-accent/10 border border-accent/20 group"
                >
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>Admin Panel</span>
                </Link>
              </motion.div>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex h-10 w-10 p-0 hover:bg-primary/10"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Quick Actions */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/dashboard?tab=problems">
                  <Plus className="w-4 h-4 mr-2" />
                  New Submission
                </Link>
              </Button>
            </motion.div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative h-10 w-10 p-0 hover:bg-primary/10"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full border border-background"></span>
            </Button>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 p-0 hover:bg-primary/10"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full touch-target hover:bg-primary/10">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                      {(profile.full_name as string)?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 glass-card border-0 shadow-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-base font-bold leading-none text-foreground">
                      {profile.full_name as string}
                    </p>
                    <p className="text-sm leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-xs text-success font-medium">Active</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="p-3 hover:bg-primary/10 focus:bg-primary/10">
                  <Link href="/dashboard/profile" className="cursor-pointer flex items-center">
                    <UserIcon className="mr-3 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-3 hover:bg-primary/10 focus:bg-primary/10">
                  <Link href="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive p-3 hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="lg:hidden border-t border-border/50 bg-gradient-to-b from-background to-muted/10 backdrop-blur-xl"
            >
              <div className="px-6 py-8 space-y-6">
                {/* Navigation Items */}
                <div className="space-y-2">
                  {navigationItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-all duration-200 font-medium px-4 py-3 rounded-xl hover:bg-primary/10 group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}

                  {/* Admin Link for mobile */}
                  {(user.email === 'hello@mlsasrm.in' || user.email === 'lk7565@srmist.edu.in') && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 text-accent hover:text-accent/80 transition-all duration-200 font-medium px-4 py-3 rounded-xl hover:bg-accent/10 border border-accent/20 group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Admin Panel</span>
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="border-t border-border/50 pt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      href="/dashboard?tab=problems"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        New Submission
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {/* User Profile Section */}
                <motion.div
                  className="border-t border-border/50 pt-6 space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url as string} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                        {(profile?.full_name as string)?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold truncate text-foreground">
                        {(profile?.full_name as string) || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-xs text-success font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
