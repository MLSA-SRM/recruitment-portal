'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  Users, 
  TrendingUp,
  GraduationCap,
  Target
} from 'lucide-react'

interface UserStatsCardProps {
  userStats: Record<string, unknown>[]
  detailed?: boolean
}

export function UserStatsCard({ userStats, detailed = false }: UserStatsCardProps) {
  // Calculate statistics
  const totalUsers = userStats.length
  const recentUsers = userStats.filter(user => {
    const createdAt = new Date(user.created_at as string)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return createdAt > oneWeekAgo
  }).length

  // Department distribution
  const departmentStats = userStats.reduce((acc: Record<string, number>, user) => {
    const dept = (user.department as string) || 'Unknown'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {})

  const topDepartments = Object.entries(departmentStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, detailed ? 10 : 5)

  // Domain distribution
  const domainStats = userStats.reduce((acc: Record<string, number>, user) => {
    (user.domains as string[])?.forEach((domain: string) => {
      acc[domain] = (acc[domain] || 0) + 1
    })
    return acc
  }, {})

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* User Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="neon-text-cyan">User Statistics</CardTitle>
            <CardDescription>Complete user registration analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold neon-text-purple">{totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold neon-text-pink">{recentUsers}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Department Distribution</h4>
              {topDepartments.map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{dept}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((count as number / totalUsers) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domain Interest */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="neon-text-purple">Domain Interest</CardTitle>
            <CardDescription>User preferences across different domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(domainStats).map(([domain, count]) => (
                <div key={domain} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">{domain}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all duration-500"
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
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="neon-text-cyan flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Stats
          </CardTitle>
          <CardDescription>Registration and engagement metrics</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold neon-text-purple">{totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-3 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold neon-text-pink">{recentUsers}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>

          {/* Top Departments */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              Top Departments
            </h4>
            {topDepartments.slice(0, 3).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between text-sm">
                <span className="truncate">{dept}</span>
                <Badge variant="secondary" className="text-xs">{count as number}</Badge>
              </div>
            ))}
          </div>

          {/* Growth Indicator */}
          <div className="flex items-center justify-center pt-3 divider-line">
            <div className="flex items-center text-sm text-green-500">
              <TrendingUp className="w-4 h-4 mr-1" />
              {recentUsers > 0 ? `+${recentUsers} new this week` : 'No new registrations'}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
