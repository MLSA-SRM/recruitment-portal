'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminHeader } from '@/components/admin/admin-header'
import { GitHubIntegrationSettings } from '@/components/admin/github-integration-settings'
import { SystemSettings } from '@/components/admin/system-settings'
import { NotificationSettings } from '@/components/admin/notification-settings'
import {
  Settings,
  Github,
  Bell,
  Shield,
  Database,
  Users
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface AdminSettingsClientProps {
  user: User
}

export function AdminSettingsClient({ user }: AdminSettingsClientProps) {
  const [activeTab, setActiveTab] = useState('github')

  const settingsTabs = [
    {
      id: 'github',
      label: 'GitHub Integration',
      icon: Github,
      description: 'Configure GitHub API access and code analysis'
    },
    {
      id: 'system',
      label: 'System',
      icon: Database,
      description: 'Database and performance settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Email and alert preferences'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Access control and authentication'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'User roles and permissions'
    }
  ]

  return (
    <div className="min-h-screen animated-bg">
      <AdminHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-prominent p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-brand-primary flex items-center gap-3">
                <Settings className="w-8 h-8" />
                Admin Settings
              </h1>
              <p className="text-muted-foreground text-lg">
                Configure system settings, integrations, and administrative preferences
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 glass-card-prominent border-border/60 p-2 h-auto gap-1">
              {settingsTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 rounded-lg hover:bg-primary/10 flex flex-col items-center justify-center min-h-[3rem] p-3 text-xs gap-1"
                  data-tab={tab.id}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-center leading-tight">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="github" className="space-y-6">
              <GitHubIntegrationSettings />
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <SystemSettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure access control, authentication, and security policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
                    <p className="text-muted-foreground">
                      Advanced security configuration coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user roles, permissions, and access levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-muted-foreground">
                      Advanced user management features coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}
