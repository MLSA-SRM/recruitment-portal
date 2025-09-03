'use client'

import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Eye, EyeOff, FileText, Shield, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { toast } from 'sonner'

interface FeedbackViewerProps {
  submission: Record<string, unknown>
  onToggleVisibility: (feedbackId: string, isShared: boolean) => void
}

export function FeedbackViewer({ submission, onToggleVisibility }: FeedbackViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const feedback = (submission.feedback as Record<string, unknown>[])?.[0]

  if (!feedback) {
    return null
  }

  const handleToggleVisibility = () => {
    onToggleVisibility(feedback.id as string, feedback.is_shared as boolean)
    toast.success(`Feedback ${!(feedback.is_shared as boolean) ? 'shared with user' : 'sharing disabled'}`)
  }





  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="p-1">
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Feedback Analysis
            <Badge variant={(feedback.is_shared as boolean) ? "default" : "secondary"}>
              {(feedback.is_shared as boolean) ? "Shared" : "Private"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Comprehensive AI evaluation for {(submission.profiles as Record<string, unknown>)?.full_name as string}&apos;s submission
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-4">
          <Button
            onClick={handleToggleVisibility}
            variant={(feedback.is_shared as boolean) ? "destructive" : "default"}
            size="sm"
          >
            {(feedback.is_shared as boolean) ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide from User
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Share with User
              </>
            )}
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto mt-4">
          {(() => {
            try {
              // Parse the structured feedback
              const feedbackData = JSON.parse(feedback.feedback_text as string)
              const adminFeedbackContent = feedbackData.admin_feedback || (feedback.feedback_text as string)
              
              return (
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}

                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Bot className="w-5 h-5" />{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6 flex items-center gap-2">
                        {String(children).toLowerCase().includes('technical') && <Bot className="w-4 h-4" />}
                        {String(children).toLowerCase().includes('plagiarism') && <Shield className="w-4 h-4" />}
                        {String(children).toLowerCase().includes('final') && <FileText className="w-4 h-4" />}
                        {String(children).toLowerCase().includes('admin') && <FileText className="w-4 h-4" />}
                        {children}
                      </h2>,
                      h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
                      ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>,
                      li: ({ children }) => <li className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 my-4 bg-muted/20 py-2 rounded">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted/20 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border/30">{children}</pre>,
                      table: ({ children }) => <table className="w-full border-collapse border border-border/30 my-4">{children}</table>,
                      th: ({ children }) => <th className="border border-border/30 px-2 py-1 bg-muted/20 text-left font-medium">{children}</th>,
                      td: ({ children }) => <td className="border border-border/30 px-2 py-1">{children}</td>,
                    }}
                  >
                    {adminFeedbackContent}
                  </ReactMarkdown>
                </div>
              )
            } catch {
              // Fallback for old format feedback
              return (
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}

                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Bot className="w-5 h-5" />{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6 flex items-center gap-2">
                        {String(children).toLowerCase().includes('technical') && <Bot className="w-4 h-4" />}
                        {String(children).toLowerCase().includes('plagiarism') && <Shield className="w-4 h-4" />}
                        {String(children).toLowerCase().includes('final') && <FileText className="w-4 h-4" />}
                        {children}
                      </h2>,
                      h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/90">{children}</p>,
                      ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal list-inside">{children}</ol>,
                      li: ({ children }) => <li className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-foreground/80 my-4 bg-muted/20 py-2 rounded">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted/20 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border/30">{children}</pre>,
                      table: ({ children }) => <table className="w-full border-collapse border border-border/30 my-4">{children}</table>,
                      th: ({ children }) => <th className="border border-border/30 px-2 py-1 bg-muted/20 text-left font-medium">{children}</th>,
                      td: ({ children }) => <td className="border border-border/30 px-2 py-1">{children}</td>,
                    }}
                  >
                    {feedback.feedback_text as string}
                  </ReactMarkdown>
                </div>
              )
            }
          })()}
        </div>

        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Generated: {new Date(feedback.created_at as string).toLocaleString()}</span>
            <span>Type: {feedback.feedback_type as string}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
