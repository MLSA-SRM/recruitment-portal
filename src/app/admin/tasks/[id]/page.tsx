'use client'

import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Target,
  Users,
  FileText,
  Clock,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

export default function TaskViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: taskId } = use(params)
  const [task, setTask] = useState<{
    id: number
    title: string
    description: string | null
    domain: string
    subdomain: string | null
    target_year: number
    deadline: string | null
    requirements: string | null
    deliverables: string | null
    created_at: string | null
    updated_at: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

      useEffect(() => {
    const loadTask = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (error) throw error
        if (!data) {
          notFound()
        }

        setTask(data)
      } catch (error) {
        console.error('Error loading task:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId])

  const handleDeleteTask = async () => {
    if (!task) return
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      alert('Task deleted successfully!')
      router.push('/admin/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    notFound()
  }

  const getStatusColor = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDeadline < 0) return 'bg-red-100 text-red-800' // Overdue
    if (daysUntilDeadline <= 7) return 'bg-orange-100 text-orange-800' // Due soon
    return 'bg-green-100 text-green-800' // On track
  }

  const getStatusText = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDeadline < 0) return 'Overdue'
    if (daysUntilDeadline === 0) return 'Due today'
    if (daysUntilDeadline === 1) return 'Due tomorrow'
    if (daysUntilDeadline <= 7) return `Due in ${daysUntilDeadline} days`
    return `Due in ${daysUntilDeadline} days`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/tasks" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-lg text-gray-600 mt-2">
              Task Details and Information
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link href={`/admin/tasks/${task.id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Task
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 flex items-center gap-2"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{task.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  <strong>Domain:</strong> {task.domain}
                </span>
              </div>
              {task.subdomain && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    <strong>Subdomain:</strong> {task.subdomain}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  <strong>Target Year:</strong> {task.target_year}st Year
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  <strong>Created:</strong> {new Date(task.created_at!).toLocaleDateString()}
                </span>
              </div>
              {task.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    <strong>Updated:</strong> {new Date(task.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            {task.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                </span>
                <Badge className={getStatusColor(task.deadline)}>
                  {getStatusText(task.deadline)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements & Deliverables */}
        {(task.requirements || task.deliverables) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Requirements & Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements & Prerequisites</h3>
                  <p className="text-gray-600">{task.requirements}</p>
                </div>
              )}
              
              {task.deliverables && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Expected Deliverables</h3>
                  <p className="text-gray-600">{task.deliverables}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submissions Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Submissions Overview
            </CardTitle>
            <CardDescription>
              Track applications and submissions for this task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-600">
                Submissions tracking will be available here once students start applying.
              </p>
              <Link href="/admin/dashboard" className="inline-block mt-4">
                <Button variant="outline">
                  View All Submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
