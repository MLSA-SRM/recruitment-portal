'use client'

import { useState, useEffect, useCallback } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Bot,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { FeedbackViewer } from './feedback-viewer'

interface SubmissionsTableProps {
  submissions: Record<string, unknown>[]
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [filteredSubmissions, setFilteredSubmissions] = useState(submissions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Filter submissions based on search and filters
  const filterSubmissions = useCallback(() => {
    let filtered = submissions

    if (searchTerm) {
      filtered = filtered.filter(submission =>
        ((submission.profiles as Record<string, unknown>)?.full_name as string)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((submission.profiles as Record<string, unknown>)?.email as string)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((submission.problem_statements as Record<string, unknown>)?.title as string)?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status as string === statusFilter)
    }

    if (domainFilter !== 'all') {
      filtered = filtered.filter(submission => (submission.problem_statements as Record<string, unknown>)?.domain === domainFilter)
    }

    setFilteredSubmissions(filtered)
  }, [submissions, searchTerm, statusFilter, domainFilter])

  // Update search and filters
  useEffect(() => {
    filterSubmissions()
  }, [searchTerm, statusFilter, domainFilter, filterSubmissions])

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    setIsUpdating(submissionId)
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to update submission')

      toast.success(`Submission ${newStatus} successfully!`)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating submission:', error)
      toast.error('Failed to update submission')
    } finally {
      setIsUpdating(null)
    }
  }

  const regenerateAIFeedback = async (submissionId: string) => {
    setIsUpdating(submissionId)
    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to regenerate feedback')

      toast.success('AI feedback regenerated successfully!')
      
      // Refresh the page to show updated feedback
      window.location.reload()
    } catch (error) {
      console.error('Error regenerating AI feedback:', error)
      toast.error('Failed to regenerate AI feedback')
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleFeedbackVisibility = async (feedbackId: string, isShared: boolean) => {
    try {
      const response = await fetch('/api/share-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, isShared: !isShared })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to update feedback sharing')

      toast.success(`Feedback ${!isShared ? 'shared with user' : 'sharing disabled'} successfully!`)
      
      // Refresh to show updated state
      window.location.reload()
    } catch (error) {
      console.error('Error updating feedback visibility:', error)
      toast.error('Failed to update feedback visibility')
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="neon-text-purple">Submissions Management</CardTitle>
        <CardDescription>
          Review, evaluate, and manage task submissions from participants
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or task title..."
              className="pl-10 bg-input/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-input/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-input/50">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
              <SelectItem value="Creatives">Creatives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border-visible overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead>Participant</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>AI Feedback</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id as string as string} className="hover:bg-muted/10">
                  <TableCell>
                    <div>
                      <div className="font-medium">{(submission.profiles as Record<string, unknown>)?.full_name as string}</div>
                      <div className="text-sm text-muted-foreground">
                        {(submission.profiles as Record<string, unknown>)?.email as string}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(submission.profiles as Record<string, unknown>)?.registration_number as string}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div className="font-medium truncate">
                        {(submission.problem_statements as Record<string, unknown>)?.title as string}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(submission.problem_statements as Record<string, unknown>)?.sub_domain as string}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {(submission.problem_statements as Record<string, unknown>)?.domain as string}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={
                      (submission.status as string) === 'shortlisted' ? 'default' :
                      (submission.status as string) === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {submission.status as string}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {submission.github_link as string && (
                        <a
                          href={submission.github_link as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center"
                        >
                          GitHub <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {submission.deployed_link as string && (
                        <a
                          href={submission.deployed_link as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center"
                        >
                          Live <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {(submission.feedback as Record<string, unknown>[])?.[0] ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            AI Analysis Complete
                          </Badge>
                          <FeedbackViewer 
                            submission={submission} 
                            onToggleVisibility={toggleFeedbackVisibility}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeedbackVisibility(
                              ((submission.feedback as Record<string, unknown>[])[0] as Record<string, unknown>).id as string,
                              ((submission.feedback as Record<string, unknown>[])[0] as Record<string, unknown>).is_shared as boolean
                            )}
                            className="p-1"
                            title={((submission.feedback as Record<string, unknown>[])[0] as Record<string, unknown>).is_shared as boolean ? "Hide from user" : "Share with user"}
                          >
                            {((submission.feedback as Record<string, unknown>[])[0] as Record<string, unknown>).is_shared as boolean ? (
                              <Eye className="w-3 h-3 text-green-600" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => regenerateAIFeedback(submission.id as string)}
                            disabled={isUpdating === submission.id as string}
                            className="p-1"
                            title="Regenerate AI feedback"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs text-yellow-600">
                            Generating...
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => regenerateAIFeedback(submission.id as string)}
                            disabled={isUpdating === submission.id as string}
                            className="text-xs"
                          >
                            <Bot className="w-3 h-3 mr-1" />
                            Generate
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-1">
                      {(submission.status as string) !== 'shortlisted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubmissionStatus(submission.id as string, 'shortlisted')}
                          disabled={isUpdating === submission.id as string}
                          className="text-xs"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      {(submission.status as string) !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubmissionStatus(submission.id as string, 'rejected')}
                          disabled={isUpdating === submission.id as string}
                          className="text-xs"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No submissions found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
