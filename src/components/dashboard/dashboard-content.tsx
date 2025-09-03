'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

import { DashboardHeader } from './dashboard-header'
import { ProblemStatementCard } from './problem-statement-card'

import { ProfileCard } from './profile-card'
import { LeaderboardCard } from './leaderboard-card'

import {
  Trophy,
  Target,
  AlertCircle,
  TrendingUp,
  LayoutDashboard,
  MoreHorizontal,
  GraduationCap,
  FileText,
  MessageSquare,
  Eye,
  Github,
  Globe,
  Video,
  ExternalLink,
  Star,
  Bot
} from 'lucide-react'

interface DashboardContentProps {
  user: User
  profile: Record<string, unknown>
  submissions: Record<string, unknown>[]
  problemStatements: Record<string, unknown>[]
}

export function DashboardContent({ user, profile, submissions, problemStatements }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, unknown> | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Debug logging
  console.log('Dashboard submissions:', submissions.length, submissions)

  // Handle URL tab parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'problems', 'submissions'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])
  
  // Add effect to refresh data periodically or on focus
  useEffect(() => {
    const handleFocus = () => {
      router.refresh()
    }
    
    // Refresh when window regains focus
    window.addEventListener('focus', handleFocus)
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [router])

  // Calculate stats
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length
  // Removed shortlisting calculations for anonymity

  // Statistics hidden for anonymity - applicants shouldn't see submission status counts
  const stats: Array<{
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color: string
    description: string
  }> = []

  // Helper functions for submission actions
  const handleViewFeedback = (submission: Record<string, unknown>) => {
    setSelectedSubmission(submission)
    setShowFeedbackDialog(true)
  }

  const handlePreviewSubmission = (submission: Record<string, unknown>) => {
    setSelectedSubmission(submission)
    setShowPreviewDialog(true)
  }

  // Get visible feedback for a submission
  const getVisibleFeedback = (submission: Record<string, unknown>) => {
    const feedback = submission.feedback as Record<string, unknown>[]
    return feedback?.find((f: Record<string, unknown>) => f.is_shared === true) || null
  }

  return (
    <div className="min-h-screen animated-bg">
      <DashboardHeader user={user} profile={profile} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-border/50 shadow-xl"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
              <motion.div
                className="space-y-4 flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 5, scale: 1.05 }}
                  >
                    <span className="text-white text-xl">👋</span>
                  </motion.div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Welcome back, {(profile.full_name as string)?.split(' ')[0]}!
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                      Ready to make your next big impact?
                    </p>
                  </div>
                </div>


              </motion.div>

              <motion.div
                className="flex flex-col items-end space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex flex-col items-end space-y-3">
                  <Badge className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {profile.department as string}
                  </Badge>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(profile.domains as string[]).slice(0, 3).map((domain: string, index) => (
                      <motion.div
                        key={domain}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Badge className="bg-gradient-to-r from-secondary/10 to-accent/10 text-secondary border-secondary/20 hover:border-secondary/40 transition-colors px-3 py-1">
                          {domain}
                        </Badge>
                      </motion.div>
                    ))}
                    {(profile.domains as string[]).length > 3 && (
                      <Badge variant="outline" className="border-border/50 text-muted-foreground px-3 py-1">
                        +{(profile.domains as string[]).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>


              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1 + 0.2,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="relative p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <motion.p
                          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        >
                          {stat.title}
                        </motion.p>
                        <motion.div
                          className="flex items-baseline gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.6 }}
                        >
                          <p className={`text-3xl md:text-4xl font-black ${stat.color} group-hover:scale-105 transition-transform duration-300`}>
                            {stat.value}
                          </p>
                        </motion.div>
                      </div>

                      <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-all duration-300"
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <stat.icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                      </motion.div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-3">
                      <div className="relative w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            stat.title.includes('Success') ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-sm' :
                            stat.title.includes('Pending') ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-sm' :
                            stat.title.includes('Shortlisted') ? 'bg-gradient-to-r from-primary to-secondary shadow-sm' :
                            'bg-gradient-to-r from-secondary to-accent shadow-sm'
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              stat.title.includes('Success') ? 0 :
                              stat.title.includes('Total') ? Math.min(100, (submissions.length / 10) * 100) :
                              stat.title.includes('Shortlisted') ? 0 :
                              Math.min(100, (pendingSubmissions / 3) * 100)
                            }%`
                          }}
                          transition={{ delay: index * 0.1 + 0.8, duration: 1.5, ease: "easeOut" }}
                        />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>

                      <motion.div
                        className="flex items-center justify-between"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 1 }}
                      >
                        <p className="text-xs text-muted-foreground font-medium">
                          {stat.description}
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            stat.title.includes('Success') ? 'bg-green-500' :
                            stat.title.includes('Pending') ? 'bg-yellow-500' :
                            stat.title.includes('Shortlisted') ? 'bg-primary' :
                            'bg-secondary'
                          } animate-pulse`} />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Enhanced Tabs List */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 p-2 h-14 rounded-2xl shadow-lg backdrop-blur-sm">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-md font-semibold transition-all duration-300 flex items-center gap-3 rounded-xl h-10 px-4 group"
                  >
                    <motion.div
                      animate={{
                        rotate: activeTab === 'overview' ? 0 : 0,
                        scale: activeTab === 'overview' ? 1.1 : 1
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <LayoutDashboard className={`w-5 h-5 transition-colors duration-300 ${
                        activeTab === 'overview'
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </motion.div>
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabsTrigger
                    value="problems"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-md font-semibold transition-all duration-300 flex items-center gap-3 rounded-xl h-10 px-4 group"
                  >
                    <motion.div
                      animate={{
                        rotate: activeTab === 'problems' ? 5 : 0,
                        scale: activeTab === 'problems' ? 1.1 : 1
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Target className={`w-5 h-5 transition-colors duration-300 ${
                        activeTab === 'problems'
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </motion.div>
                    <span className="hidden sm:inline">Tasks</span>
                  </TabsTrigger>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TabsTrigger
                    value="submissions"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-md font-semibold transition-all duration-300 flex items-center gap-3 rounded-xl h-10 px-4 group"
                  >
                    <motion.div
                      animate={{
                        rotate: activeTab === 'submissions' ? -5 : 0,
                        scale: activeTab === 'submissions' ? 1.1 : 1
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <TrendingUp className={`w-5 h-5 transition-colors duration-300 ${
                        activeTab === 'submissions'
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </motion.div>
                    <span className="hidden sm:inline">Progress</span>
                  </TabsTrigger>
                </motion.div>
              </TabsList>
            </motion.div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Activity */}
                  <Card className="glass-card border-visible">
                    <CardHeader>
                      <CardTitle className="text-brand-secondary">Recent Activity</CardTitle>
                      <CardDescription>
                        Your latest submissions and updates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {submissions.length > 0 ? (
                        <div className="space-y-4">
                          {submissions.slice(0, 3).map((submission) => (
                            <div key={submission.id as string} className="flex items-center space-x-4 p-4 bg-card/50 rounded-lg border border-border/60">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{(submission.problem_statements as Record<string, unknown>)?.title as string}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Submitted on {new Date(submission.created_at as string).toLocaleDateString()}
                                </p>
                              </div>
                              {(submission.feedback as Record<string, unknown>[])?.some((f: Record<string, unknown>) => f.is_shared) && (
                                <Badge variant="outline" className="text-green-600 text-xs">
                                  Feedback Available
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No submissions yet</p>
                          <p className="text-sm text-muted-foreground">Start by exploring problem statements!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Available Problems Preview */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="neon-text-cyan">Available Challenges</CardTitle>
                      <CardDescription>
                        New problem statements matching your interests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {problemStatements.length > 0 ? (
                        <div className="grid gap-4">
                          {problemStatements.slice(0, 2).map((problem) => (
                            <ProblemStatementCard key={problem.id as string} problem={problem} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No new challenges available</p>
                          <p className="text-sm text-muted-foreground">Check back later for new opportunities!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <ProfileCard profile={profile} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="problems" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="neon-text-cyan">Problem Statements</CardTitle>
                  <CardDescription>
                    Challenge yourself with these problem statements tailored to your domains
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {problemStatements.length > 0 ? (
                    <div className="grid gap-6">
                      {problemStatements.map((problem) => (
                        <ProblemStatementCard key={problem.id as string} problem={problem} detailed />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Problem Statements Available</h3>
                      <p className="text-muted-foreground">
                        New challenges will be posted soon. Stay tuned!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* My Submissions */}
                <Card className="glass-card elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <TrendingUp className="w-5 h-5" />
                      My Submissions
                    </CardTitle>
                    <CardDescription>
                      Track your progress and view feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submissions.length > 0 ? (
                      <div className="space-y-4">
                        {submissions.slice(0, 3).map((submission) => {
                          const visibleFeedback = getVisibleFeedback(submission)
                          return (
                            <div key={submission.id as string} className="border border-border/50 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{(submission.problem_statements as Record<string, unknown>)?.title as string}</h4>
                                <div className="flex items-center gap-2">
                                  {visibleFeedback && (
                                    <Badge variant="outline" className="text-green-600 text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      Score: {visibleFeedback.score as number}/10
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                                        <MoreHorizontal className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handlePreviewSubmission(submission)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview Submission
                                      </DropdownMenuItem>
                                      {visibleFeedback && (
                                        <DropdownMenuItem onClick={() => handleViewFeedback(submission)}>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          View Feedback
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {(submission.description as string) || 'No description provided'}
                              </p>
                            </div>
                          )
                        })}
                        {submissions.length > 3 && (
                          <Button variant="outline" className="w-full" size="sm">
                            View All Submissions ({submissions.length})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-medium mb-2">No Submissions Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start by selecting a problem statement
                        </p>
                        <Button onClick={() => setActiveTab('problems')} size="sm" className="btn-primary">
                          View Tasks
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Leaderboard & Stats */}
                <Card className="glass-card elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-secondary">
                      <Trophy className="w-5 h-5" />
                      Your Ranking
                    </CardTitle>
                    <CardDescription>
                      See how you rank among participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardCard userOnly={true} submissions={submissions} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Feedback Analysis
            </DialogTitle>
            <DialogDescription>
              Comprehensive AI evaluation for your submission
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            {selectedSubmission && getVisibleFeedback(selectedSubmission) && (() => {
              const feedback = getVisibleFeedback(selectedSubmission)
              let feedbackContent = ''
              
              try {
                const feedbackData = JSON.parse(feedback?.feedback_text as string)
                feedbackContent = feedbackData.user_feedback || feedbackData.feedback || (feedback?.feedback_text as string)
              } catch {
                feedbackContent = (feedback?.feedback_text as string) || 'No feedback content available.'
              }
              
              return (
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
                      ul: ({ children }) => <ul className="space-y-2 mb-4 list-disc list-inside">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>,
                      li: ({ children }) => <li className="text-sm text-foreground/90 ml-2">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                      code: ({ children }) => <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 mb-4">{children}</blockquote>
                    }}
                  >
                    {feedbackContent}
                  </ReactMarkdown>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-background border">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-6 h-6 text-primary" />
              Submission Preview
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedSubmission && (selectedSubmission.problem_statements as Record<string, unknown>)?.title as string}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto space-y-6 pr-2">
            {selectedSubmission && (
              <>
                {/* Problem Statement Info */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                  <h3 className="font-semibold text-base text-primary">Problem Statement</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {(selectedSubmission.problem_statements as Record<string, unknown>)?.domain as string}
                    </Badge>
                  </div>
                  <p className="text-base text-foreground leading-relaxed">
                    {(selectedSubmission.problem_statements as Record<string, unknown>)?.description as string}
                  </p>
                </div>

                {/* Submission Description */}
                {selectedSubmission.description && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <h3 className="font-semibold text-base text-primary">Your Solution</h3>
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedSubmission.description as string}
                    </p>
                  </div>
                )}

                {/* Submission Links */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <h3 className="font-semibold text-base text-primary">Links & Resources</h3>
                  
                  {(selectedSubmission.github_link as string) && (
                    <div className="flex items-start space-x-4 p-4 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                      <Github className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground mb-2">GitHub Repository</p>
                        <a
                          href={selectedSubmission.github_link as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-base break-all"
                        >
                          {selectedSubmission.github_link as string}
                          <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {(selectedSubmission.deployed_link as string) && (
                    <div className="flex items-start space-x-4 p-4 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                      <Globe className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground mb-2">Live Demo</p>
                        <a
                          href={selectedSubmission.deployed_link as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-base break-all"
                        >
                          {selectedSubmission.deployed_link as string}
                          <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {(selectedSubmission.video_url as string) && (
                    <div className="flex items-start space-x-4 p-4 bg-background rounded-lg border hover:bg-muted/50 transition-colors">
                      <Video className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground mb-2">Demo Video</p>
                        <a
                          href={selectedSubmission.video_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-base break-all"
                        >
                          {selectedSubmission.video_url as string}
                          <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}

                  {!(selectedSubmission.github_link as string) && !(selectedSubmission.deployed_link as string) && !(selectedSubmission.video_url as string) && (
                    <div className="text-center py-8 text-muted-foreground text-base">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No links provided for this submission
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
