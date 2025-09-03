'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Github,
  Globe,
  Video,
  FileText,
  MessageSquare,
  ExternalLink,
  Calendar,
  Bot,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type SubmissionStatus = 'pending' | 'shortlisted' | 'rejected'

interface SubmissionCardProps {
  submission: {
    id: string
    status: SubmissionStatus
    github_link?: string | null
    deployed_link?: string | null
    video_url?: string | null
    document_url?: string | null
    description?: string
    created_at: string
    updated_at: string
    problem_statements?: {
      title?: string
      description?: string
      domain?: string
    }
    feedback?: Array<{
      id: string
      feedback_text: string
      score: number
      is_shared: boolean
      created_at: string
    }>
  }
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)

  // Status functions removed for anonymity - applicants shouldn't see submission status
  const visibleFeedback = submission.feedback?.find(f => f.is_shared)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="glass-card hover:border-primary/30 transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center`}>
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {submission.problem_statements?.title || 'Problem Statement'}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {submission.problem_statements?.domain}
                  </Badge>
                  {visibleFeedback && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Score: {visibleFeedback.score}/10
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {visibleFeedback && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFeedback(true)}
                  className="text-xs"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  View Feedback
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="mb-4">
            {submission.problem_statements?.description}
          </CardDescription>

          {/* Submission Links */}
          <div className="space-y-3 mb-4">
            {submission.github_link && (
              <div className="flex items-center space-x-2">
                <Github className="w-4 h-4 text-muted-foreground" />
                <a
                  href={submission.github_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  View Repository
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}

            {submission.deployed_link && (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a
                  href={submission.deployed_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  View Live Demo
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}

            {submission.video_url && (
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-muted-foreground" />
                <a
                  href={submission.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  Watch Demo Video
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}

            {submission.document_url && (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <a
                  href={submission.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  View Documentation
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {submission.description && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Description:</h4>
              <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg">
                {submission.description}
              </p>
            </div>
          )}

          {/* Submission Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Submitted on {new Date(submission.created_at).toLocaleDateString()}
            </div>
            {submission.updated_at !== submission.created_at && (
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Updated on {new Date(submission.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="glass-card max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b border-border/30">
            <DialogTitle className="neon-text-cyan text-lg">
              AI Feedback: {submission.problem_statements?.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              Comprehensive automated feedback and evaluation for your submission
            </DialogDescription>
          </DialogHeader>
          
          {visibleFeedback && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 feedback-dialog-content">

              {/* Feedback Text */}
              <div className="bg-muted/20 rounded-lg border border-border/40">
                <div className="p-4 border-b border-border/30">
                  <h4 className="font-medium text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    AI Evaluation Feedback
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed analysis based on your code, implementation, and requirements
                  </p>
                </div>
                <div className="p-6">
                  {(() => {
                    try {
                      // Parse the structured feedback
                      const feedbackData = JSON.parse(visibleFeedback.feedback_text)
                      const userFeedbackContent = feedbackData.user_feedback || visibleFeedback.feedback_text
                      
                      return (
                        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}

                            components={{
                              h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Bot className="w-5 h-5" />{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>,
                              p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
                              li: ({ children }) => <li className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 my-4">{children}</blockquote>,
                              code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                              pre: ({ children }) => <pre className="bg-muted/20 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border/30">{children}</pre>,
                            }}
                          >
                            {userFeedbackContent}
                          </ReactMarkdown>
                        </div>
                      )
                    } catch {
                      // Fallback for old format feedback - filter out admin sections and render as markdown
                      const filteredContent = visibleFeedback.feedback_text
                        .split('##')
                        .filter((section: string) => {
                          const title = section.trim().split('\n')[0].toLowerCase()
                          return !title.includes('admin notes') && 
                                 !title.includes('final recommendation') &&
                                 !title.includes('decision') &&
                                 !title.includes('overall score') &&
                                 !title.includes('originality score')
                        })
                        .join('##')
                      
                      return (
                        <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}

                            components={{
                              h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Bot className="w-5 h-5" />{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>,
                              p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
                              li: ({ children }) => <li className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 my-4">{children}</blockquote>,
                              code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                              pre: ({ children }) => <pre className="bg-muted/20 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border/30">{children}</pre>,
                            }}
                          >
                            {filteredContent}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>

              {/* Feedback Footer */}
              <div className="bg-muted/10 rounded-lg p-4 border-t border-border/30 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    <span>AI-Generated Feedback</span>
                  </div>
                  <div className="text-muted-foreground">
                    {(() => {
                      try {
                        const date = new Date(visibleFeedback.created_at)
                        if (isNaN(date.getTime())) {
                          return "Recently generated"
                        }
                        return `Generated on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
                      } catch {
                        return "Recently generated"
                      }
                    })()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  This feedback is based on automated analysis of your submission including code quality, implementation approach, and adherence to requirements.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
