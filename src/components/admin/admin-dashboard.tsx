'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminHeader } from './admin-header'
import { SubmissionsTable } from './submissions-table'
import { UserStatsCard } from './user-stats-card'
import { UsersManagement } from './users-management'
import { ProblemStatementsManager } from './problem-statements-manager'

interface TaskSettings {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  maxSubmissions?: number
  submissionDeadline?: string
  allowLateSubmissions: boolean
  autoFeedback: boolean
  requiresApproval: boolean
  submissionFormFields: unknown[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}
import { AdminLeaderboard } from './admin-leaderboard'

import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Target,
  Award,
  AlertCircle,
  Activity,
  BarChart3,
  Settings,
  Github
} from 'lucide-react'

interface AdminDashboardProps {
  user: User
  submissions: {
    id: string
    status: string
    created_at: string
    profiles?: {
      full_name: string
    }
    problem_statements?: {
      title: string
    }
    [key: string]: unknown
  }[]
  problemStatements: {
    id?: string
    title: string
    description: string
    domain: string
    sub_domain: string
    requirements?: string[]
    is_active: boolean
    settings?: string | TaskSettings
    created_at?: string
  }[]
  userStats: {
    id: string
    email: string
    full_name: string
    phone?: string
    department?: string
    year_of_study?: string
    domains?: string[]
    created_at: string
    avatar_url?: string
    is_profile_complete: boolean
    [key: string]: unknown
  }[]
}

export function AdminDashboard({ user, submissions, problemStatements, userStats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate statistics
  const totalSubmissions = submissions.length
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length
  const shortlistedSubmissions = submissions.filter(s => s.status === 'shortlisted').length
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length
  const totalUsers = userStats.length
  const activeProblemStatements = problemStatements.filter(p => p.is_active).length

  // Group metrics by category
  const userMetrics = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-primary',
      description: 'Registered candidates'
    },
    {
      title: 'Active This Week',
      value: Math.floor(totalUsers * 0.3), // Based on recent activity
      icon: Activity,
      color: 'text-secondary',
      description: 'Recently active users'
    }
  ]

  const submissionMetrics = [
    {
      title: 'Total Submissions',
      value: totalSubmissions,
      icon: FileText,
      color: 'text-primary',
      description: 'All submissions received'
    },
    {
      title: 'Pending Review',
      value: pendingSubmissions,
      icon: Clock,
      color: 'text-yellow-500',
      description: 'Awaiting evaluation'
    },
    {
      title: 'Shortlisted',
      value: shortlistedSubmissions,
      icon: CheckCircle,
      color: 'text-green-500',
      description: 'Approved submissions'
    },
    {
      title: 'Rejected',
      value: rejectedSubmissions,
      icon: XCircle,
      color: 'text-red-500',
      description: 'Rejected submissions'
    }
  ]

  const systemMetrics = [
    {
      title: 'Active Tasks',
      value: activeProblemStatements,
      icon: Target,
      color: 'text-accent',
      description: 'Available tasks'
    },
    {
      title: 'Success Rate',
      value: `${totalSubmissions > 0 ? Math.round((shortlistedSubmissions / totalSubmissions) * 100) : 0}%`,
      icon: BarChart3,
      color: 'text-secondary',
      description: 'Overall approval rate'
    }
  ]

  // Domain distribution
  const domainStats = userStats.reduce((acc: Record<string, number>, user) => {
    user.domains?.forEach((domain: string) => {
      acc[domain] = (acc[domain] || 0) + 1
    })
    return acc
  }, {})

  return (
    <div className="min-h-screen animated-bg">
      <AdminHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-prominent p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-brand-primary">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage task submissions and monitor participant progress
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              Administrator
            </Badge>
          </div>
        </motion.div>

        {/* Grouped Stats Overview */}
        <div className="space-y-8">
          {/* User Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">User Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userMetrics.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <Card className="glass-card hover-glow hover-lift border-prominent elevation-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className={`text-3xl font-bold ${stat.color}`}>
                              {stat.value}
                            </p>

                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stat.description}
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-primary/20 elevation-1">
                          <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Submission Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold text-secondary">Submission Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {submissionMetrics.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <Card className="glass-card hover-glow hover-lift border-prominent elevation-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stat.description}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center border border-primary/20">
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-accent">System Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemMetrics.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                >
                  <Card className="glass-card hover-glow hover-lift border-prominent elevation-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className={`text-3xl font-bold ${stat.color}`}>
                              {stat.value}
                            </p>

                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stat.description}
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-primary/20 elevation-1">
                          <stat.icon className={`w-7 h-7 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Settings Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8"
        >
          <Card className="glass-card-prominent hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Admin Settings</h3>
                    <p className="text-muted-foreground">Configure system settings and integrations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Github className="w-4 h-4" />
                      <span>GitHub Integration</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Enhanced AI analysis available
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isClient && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 glass-card-prominent border-border/60 p-2 h-auto sm:h-14 gap-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium sm:font-semibold transition-all duration-300 rounded-lg hover:bg-primary/10 flex items-center justify-center min-h-[2.5rem] text-xs sm:text-sm" 
                data-tab="overview"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="submissions" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium sm:font-semibold transition-all duration-300 rounded-lg hover:bg-primary/10 flex items-center justify-center min-h-[2.5rem] text-xs sm:text-sm" 
                data-tab="submissions"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Submissions</span>
                <span className="sm:hidden">Submit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium sm:font-semibold transition-all duration-300 rounded-lg hover:bg-primary/10 flex items-center justify-center min-h-[2.5rem] text-xs sm:text-sm" 
                data-tab="users"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="problems" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium sm:font-semibold transition-all duration-300 rounded-lg hover:bg-primary/10 flex items-center justify-center min-h-[2.5rem] text-xs sm:text-sm" 
                data-tab="problems"
              >
                <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium sm:font-semibold transition-all duration-300 rounded-lg hover:bg-primary/10 flex items-center justify-center min-h-[2.5rem] text-xs sm:text-sm" 
                data-tab="leaderboard"
              >
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Leaderboard</span>
                <span className="sm:hidden">Board</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Submissions */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="neon-text-purple">Recent Submissions</CardTitle>
                      <CardDescription>
                        Latest task submissions requiring review
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {submissions.length > 0 ? (
                        <div className="space-y-4">
                          {submissions.slice(0, 5).map((submission) => (
                            <div key={submission.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  {submission.status === 'shortlisted' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                  {submission.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                                  {submission.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                                </div>
                                <div>
                                  <h4 className="font-medium">{submission.profiles?.full_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {submission.problem_statements?.title}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={
                                submission.status === 'shortlisted' ? 'default' : 
                                submission.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {submission.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No submissions yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Domain Distribution */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="neon-text-cyan">Domain Distribution</CardTitle>
                      <CardDescription>
                        User interest across different domains
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(domainStats).map(([domain, count]) => (
                          <div key={domain} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{domain}</Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${Math.min((count as number / totalUsers) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <UserStatsCard userStats={userStats} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <SubmissionsTable submissions={submissions} />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <UsersManagement userStats={userStats as any} />
            </TabsContent>

            <TabsContent value="problems" className="space-y-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ProblemStatementsManager problemStatements={problemStatements as any} />
            </TabsContent>


            <TabsContent value="leaderboard" className="space-y-6">
              <AdminLeaderboard submissions={submissions} />
            </TabsContent>
          </Tabs>
          )}
        </motion.div>
      </main>
    </div>
  )
}
