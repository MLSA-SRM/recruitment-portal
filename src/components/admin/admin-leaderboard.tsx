'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Users,
  Target,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react'

interface UserStats {
  userId: string
  profile: Record<string, unknown>
  totalSubmissions: number
  shortlistedCount: number
  pendingCount: number
  rejectedCount: number
  totalScore: number
  averageScore: number
  successRate: number
  domains: string[]
  latestSubmission: string
  submissions: Record<string, unknown>[]
  rank?: number
  currentRank?: number
}

interface AdminLeaderboardProps {
  submissions: unknown[]
}

export function AdminLeaderboard({ submissions }: AdminLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<UserStats[]>([])
  const [filteredData, setFilteredData] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('score')

  const fetchLeaderboardData = useCallback(async () => {
    try {
      // Use the passed submissions data instead of querying directly
      const submissionData = submissions

      if (submissionData && submissionData.length > 0) {
        // Calculate user statistics
        const userStats: { [key: string]: UserStats } = {}

        submissionData.forEach((submission) => {
          const sub = submission as Record<string, unknown>
          const userId = sub.user_id as string
          const profile = sub.profiles as Record<string, unknown>

          if (!profile) return
          
          if (!userStats[userId]) {
            userStats[userId] = {
              userId,
              profile,
              totalSubmissions: 0,
              shortlistedCount: 0,
              pendingCount: 0,
              rejectedCount: 0,
              totalScore: 0,
              averageScore: 0,
              successRate: 0,
              domains: (profile.domains as string[]) || [],
              latestSubmission: sub.created_at as string,
              submissions: []
            }
          }

          const stats = userStats[userId]
          stats.totalSubmissions += 1
          stats.submissions.push(sub)
          
          // Update counts based on status
          switch (sub.status) {
            case 'shortlisted':
              stats.shortlistedCount += 1
              stats.totalScore += 85 // Base score for shortlisted
              break
            case 'pending':
              stats.pendingCount += 1
              stats.totalScore += 50 // Base score for pending
              break
            case 'rejected':
              stats.rejectedCount += 1
              stats.totalScore += 10 // Minimal score for participation
              break
          }
          
          // Update latest submission date
          if (new Date(sub.created_at as string) > new Date(stats.latestSubmission)) {
            stats.latestSubmission = sub.created_at as string
          }
        })

        // Calculate final scores and rankings
        const leaderboard = Object.values(userStats)
          .map((user: UserStats) => ({
            ...user,
            averageScore: user.totalSubmissions > 0 ? user.totalScore / user.totalSubmissions : 0,
            successRate: user.totalSubmissions > 0 ? (user.shortlistedCount / user.totalSubmissions) * 100 : 0
          }))
          .sort((a, b) => {
            // Primary sort: shortlisted count
            if (b.shortlistedCount !== a.shortlistedCount) {
              return b.shortlistedCount - a.shortlistedCount
            }
            // Secondary sort: total score
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore
            }
            // Tertiary sort: success rate
            return b.successRate - a.successRate
          })
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }))

        setLeaderboardData(leaderboard)
      }
    } catch (error) {
      console.error('Error fetching admin leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [submissions])

  const filterAndSortData = useCallback(() => {
    let filtered = [...leaderboardData]
    
    // Apply domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.domains.some((domain: string) => 
          domain.toLowerCase().includes(domainFilter.toLowerCase())
        )
      )
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'score':
        filtered.sort((a, b) => b.totalScore - a.totalScore)
        break
      case 'shortlisted':
        filtered.sort((a, b) => b.shortlistedCount - a.shortlistedCount)
        break
      case 'submissions':
        filtered.sort((a, b) => b.totalSubmissions - a.totalSubmissions)
        break
      case 'success_rate':
        filtered.sort((a, b) => b.successRate - a.successRate)
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.latestSubmission).getTime() - new Date(a.latestSubmission).getTime())
        break
      default:
        break
    }
    
    // Re-assign ranks based on current sort
    filtered = filtered.map((user, index) => ({
      ...user,
      currentRank: index + 1
    }))
    
    setFilteredData(filtered)
  }, [leaderboardData, domainFilter, sortBy])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData, submissions])

  useEffect(() => {
    filterAndSortData()
  }, [leaderboardData, domainFilter, sortBy, filterAndSortData])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return Crown
      case 2: return Trophy
      case 3: return Medal
      default: return Award
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-amber-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusBadge = (user: UserStats) => {
    if (user.shortlistedCount > user.pendingCount + user.rejectedCount) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Top Performer</Badge>
    } else if (user.successRate > 50) {
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Good Performance</Badge>
    } else if (user.totalSubmissions > 3) {
      return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Active</Badge>
    }
    return <Badge variant="outline">Participant</Badge>
  }

  if (loading) {
    return (
      <Card className="glass-card border-visible">
        <CardHeader>
          <CardTitle className="text-brand-primary">Admin Leaderboard</CardTitle>
          <CardDescription>Loading participant rankings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted/20 rounded-full"></div>
                <div className="w-10 h-10 bg-muted/20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/20 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-muted/20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card className="glass-card border-visible">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-primary flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Admin Leaderboard
              </CardTitle>
              <CardDescription>
                Complete participant rankings with domain filtering
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="creative">Creatives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Total Score</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted Count</SelectItem>
                  <SelectItem value="submissions">Total Submissions</SelectItem>
                  <SelectItem value="success_rate">Success Rate</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {filteredData.length} participants
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="glass-card border-visible">
        <CardContent className="p-0">
          {filteredData.length > 0 ? (
            <div className="space-y-1">
              {filteredData.map((user, index) => {
                const RankIcon = getRankIcon(user.currentRank || user.rank || index + 1)
                return (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-4 hover:bg-card/50 transition-colors border-b border-border/20 last:border-b-0"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/20">
                      <RankIcon className={`w-5 h-5 ${getRankColor(user.currentRank || user.rank || index + 1)}`} />
                    </div>

                    {/* User Info */}
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {(user.profile?.full_name as string)?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold truncate">
                          {(user.profile?.full_name as string) || 'Anonymous'}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          #{user.currentRank || user.rank || index + 1}
                        </Badge>
                        {getStatusBadge(user)}
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-2">
                        {user.domains.slice(0, 3).map((domain: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                            {domain}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {user.shortlistedCount}/{user.totalSubmissions} shortlisted
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {user.successRate.toFixed(1)}% success rate
                        </div>
                        <div className="text-xs">
                          {(user.profile?.department as string)}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right space-y-1">
                      <div className="font-bold text-lg text-brand-primary">
                        {user.totalScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        total score
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.averageScore.toFixed(1)} avg
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No participants found</p>
              <p className="text-sm text-muted-foreground">
                {domainFilter !== 'all' 
                  ? 'Try adjusting your domain filter'
                  : 'Participants will appear here after submitting tasks'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card-subtle">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-primary">
                {filteredData.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </CardContent>
          </Card>
          <Card className="glass-card-subtle">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-secondary">
                {filteredData.reduce((sum, user) => sum + user.shortlistedCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Shortlisted</div>
            </CardContent>
          </Card>
          <Card className="glass-card-subtle">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-accent">
                {filteredData.reduce((sum, user) => sum + user.totalSubmissions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </CardContent>
          </Card>
          <Card className="glass-card-subtle">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {filteredData.length > 0 
                  ? ((filteredData.reduce((sum, user) => sum + user.successRate, 0) / filteredData.length).toFixed(1))
                  : '0'
                }%
              </div>
              <div className="text-sm text-muted-foreground">Avg Success Rate</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
