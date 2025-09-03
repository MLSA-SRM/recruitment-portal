'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy,
  Medal,
  Award,
  Target,
  Crown,
  Users
} from 'lucide-react'

interface LeaderboardCardProps {
  detailed?: boolean
  userOnly?: boolean
  submissions?: unknown[] | null
}

export function LeaderboardCard({ detailed = false, userOnly = false, submissions }: LeaderboardCardProps) {
  const [leaderboardData, setLeaderboardData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)


  const supabase = createClient()

  const fetchLeaderboardData = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Use provided submissions data or fetch from database
      let submissionData = submissions

      if (!submissionData) {
        const { data } = await supabase
          .from('submissions')
          .select(`
            *,
            profiles (
              id,
              full_name,
              department,
              domains
            ),
            problem_statements (
              title,
              domain
            )
          `)
          .order('created_at', { ascending: false })

        submissionData = data
      }

      if (submissionData && Array.isArray(submissionData) && submissionData.length > 0) {
        // Calculate scores for each user based on submissions
        const userScores: { [key: string]: Record<string, unknown> } = {}

        submissionData.forEach((submission) => {
          const sub = submission as Record<string, unknown>
          const userId = sub.user_id as string
          const status = sub.status as string

          if (!userScores[userId]) {
            userScores[userId] = {
              userId,
              profile: sub.profiles,
              totalScore: 0,
              submissionCount: 0,
              shortlistedCount: 0
            }
          }

          const userData = userScores[userId]
          userData.submissionCount = (userData.submissionCount as number) + 1

          // Calculate score based on status (similar to admin leaderboard)
          let score = 0
          switch (status) {
            case 'shortlisted':
              score = 85
              userData.shortlistedCount = (userData.shortlistedCount as number) + 1
              break
            case 'pending':
              score = 50
              break
            case 'rejected':
              score = 10
              break
            default:
              score = 0
          }

          userData.totalScore = (userData.totalScore as number) + score
        })

        // Calculate average scores and sort
        const leaderboard = Object.values(userScores)
          .map((user: Record<string, unknown>) => ({
            ...user,
            averageScore: (user.totalScore as number) / (user.submissionCount as number) || 0,
            totalScore: user.totalScore as number
          }))
          .sort((a, b) => {
            // Sort by total score (higher is better)
            return (b.totalScore as number) - (a.totalScore as number)
          })
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }))

        // Find current user's rank and data
        if (user) {
          const userEntry = leaderboard.find(entry => (entry as Record<string, unknown>).userId === user.id)
          if (userEntry) {
            setCurrentUserRank((userEntry as Record<string, unknown>).rank as number)
          }
        }

        // Set data based on mode
        if (userOnly && user) {
          const userEntry = leaderboard.find(entry => (entry as Record<string, unknown>).userId === user.id)
          setLeaderboardData(userEntry ? [userEntry] : [])
        } else {
          setLeaderboardData(detailed ? leaderboard : leaderboard.slice(0, 5))
        }
      } else {
        // No submissions data available
        setLeaderboardData([])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboardData([])
    } finally {
      setLoading(false)
    }
  }, [supabase, detailed, userOnly, submissions])

  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return Crown
      case 2:
        return Trophy
      case 3:
        return Medal
      default:
        return Award
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'
      case 2:
        return 'text-gray-400'
      case 3:
        return 'text-amber-600'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="neon-text-purple">
            {detailed ? 'Leaderboard' : 'Top Performers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(detailed ? 10 : 5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted/20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: detailed ? 0 : 0.4 }}
      className={detailed ? 'space-y-6' : ''}
    >
      <Card className="glass-card">

        
        <CardContent>
          {leaderboardData.length > 0 ? (
            userOnly ? (
              // Simplified display for user's own ranking
              <div className="text-center space-y-6">
                {leaderboardData.map((user) => {
                  const RankIcon = getRankIcon((user as Record<string, unknown>).rank as number)
                  return (
                    <motion.div
                      key={(user as Record<string, unknown>).userId as string}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      {/* Rank Display */}
                      <div className="flex items-center justify-center space-x-3">
                        <RankIcon className={`w-8 h-8 ${getRankColor((user as Record<string, unknown>).rank as number)}`} />
                        <div className="text-center">
                          <div className="text-3xl font-bold neon-text-cyan">
                            #{(user as Record<string, unknown>).rank as number}
                          </div>
                          <div className="text-sm text-muted-foreground">Your Rank</div>
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="text-center">
                        <div className="text-2xl font-bold neon-text-purple">
                          {(user as Record<string, unknown>).totalScore as number}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Points</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              // Regular leaderboard display
              <div className="space-y-4">
                {leaderboardData.map((user, index) => {
                const RankIcon = getRankIcon((user as Record<string, unknown>).rank as number)
                return (
                  <motion.div
                    key={(user as Record<string, unknown>).userId as string}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8">
                      <RankIcon className={`w-5 h-5 ${getRankColor((user as Record<string, unknown>).rank as number)}`} />
                    </div>

                    {/* User Info */}
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {((user as Record<string, unknown>).profile as Record<string, unknown>)?.full_name ? (((user as Record<string, unknown>).profile as Record<string, unknown>).full_name as string).charAt(0) : '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">
                          {((user as Record<string, unknown>).profile as Record<string, unknown>)?.full_name as string || 'Anonymous'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          #{(user as Record<string, unknown>).rank as number}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {(user as Record<string, unknown>).submissionCount as number} submissions
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="font-bold neon-text-cyan">
                        {(user as Record<string, unknown>).totalScore as number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        total score
                      </div>
                    </div>
                  </motion.div>
                )
              })}

                {/* Current User Rank (if not in top list) */}
                {!detailed && !userOnly && currentUserRank && currentUserRank > 5 && (
                  <div className="pt-3 divider-line">
                    <div className="text-center text-sm text-muted-foreground">
                      Your rank: <span className="font-medium neon-text-cyan">#{currentUserRank}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {userOnly ? 'No ranking available' : 'No rankings available yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userOnly 
                  ? 'Submit tasks to get ranked on the leaderboard!'
                  : 'Complete submissions to see the leaderboard!'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card for detailed view - Hidden for anonymity */}
      {false && detailed && leaderboardData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="neon-text-cyan">Statistics</CardTitle>
            <CardDescription>Overall recruitment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold neon-text-purple">
                  {leaderboardData.length}
                </div>
                <div className="text-sm text-muted-foreground">Active Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold neon-text-pink">
                  {leaderboardData.reduce((sum, user) => sum + ((user as Record<string, unknown>).shortlistedCount as number), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
