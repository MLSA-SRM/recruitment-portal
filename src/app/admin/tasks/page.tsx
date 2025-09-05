'use client'

import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdminLayout } from '@/components/admin-layout'
import MarkdownRenderer from '@/components/markdown-renderer'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DOMAIN_SUBDOMAINS } from '@/lib/constants'


export default function TasksPage() {
  const [tasks, setTasks] = useState<{
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
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    console.log('Attempting to delete task:', taskId)

    try {
      const supabase = createSupabaseClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Authentication error:', authError)
        throw new Error('User not authenticated')
      }
      
      console.log('User authenticated:', user.id)
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw new Error('Failed to fetch user profile')
      }
      
      console.log('User profile:', profile)
      
      if (!profile?.is_admin) {
        throw new Error('Unauthorized: Admin access required')
      }
      
      // Test: Try to read the task first
      console.log('Testing task read access...')
      const { data: taskData, error: readError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (readError) {
        console.error('❌ Task read error:', readError)
        throw new Error(`Cannot read task: ${readError.message}`)
      }
      
      console.log('✅ Task read successful:', taskData)
      
      // Delete the task directly using Supabase client
      console.log('🗑️ Attempting to delete task from database...')
      const { error, count } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      console.log('Delete result:', { error, count })

      if (error) {
        console.error('❌ Supabase delete error:', error)
        throw new Error(error.message)
      }

      console.log('✅ Task deleted successfully')
      
      // Reload tasks after deletion
      await loadTasks()
      
      // Show success message
      alert('Task deleted successfully!')
    } catch (error) {
      console.error('Error deleting task:', error)
      alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDomain = selectedDomain === '' || task.domain === selectedDomain
    const matchesYear = selectedYear === '' || task.target_year.toString() === selectedYear
    
    return matchesSearch && matchesDomain && matchesYear
  })



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
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Task Management</h1>
          <p className="text-lg text-gray-600 mt-2">
            Create, manage, and monitor all recruitment tasks
          </p>
        </div>
        <Link href="/admin/tasks/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
            <Plus className="h-5 w-5 mr-2" />
            Create New Task
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks by title, description, or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Domains</option>
            {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{filteredTasks.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {filteredTasks.filter(task => new Date(task.deadline || '') > new Date()).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tasks?.filter(task => {
                    const deadline = new Date(task.deadline || '')
                    const today = new Date()
                    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return daysUntilDeadline >= 0 && daysUntilDeadline <= 7
                  }).length || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {tasks?.filter(task => new Date(task.deadline || '') < new Date()).length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Loading State */}
      {isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks...</h3>
            <p className="text-gray-600">Please wait while we fetch your tasks.</p>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {!isLoading && filteredTasks.length > 0 ? (
        <div className="grid gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getStatusColor(task.deadline || '')}>
                          {getStatusText(task.deadline || '')}
                        </Badge>
                      </div>
                    </div>

                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span><strong>Domain:</strong> {task.domain}</span>
                      </div>
                      {task.subdomain && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="h-4 w-4" />
                          <span><strong>Subdomain:</strong> {task.subdomain}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span><strong>Target Year:</strong> {task.target_year === 1 ? '1st' : '2nd'} Year</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span><strong>Deadline:</strong> {new Date(task.deadline || '').toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(task.requirements || task.deliverables) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {task.requirements && (
                          <div className="text-sm">
                            <strong className="text-gray-700">Requirements:</strong>
                            <div className="text-gray-600 mt-1 line-clamp-2">
                              <MarkdownRenderer content={task.requirements} />
                            </div>
                          </div>
                        )}
                        {task.deliverables && (
                          <div className="text-sm">
                            <strong className="text-gray-700">Deliverables:</strong>
                            <div className="text-gray-600 mt-1 line-clamp-2">
                              <MarkdownRenderer content={task.deliverables} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {new Date(task.created_at!).toLocaleDateString()}</span>
                        {task.updated_at && (
                          <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/tasks/${task.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/tasks/${task.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            {filteredTasks.length === 0 && tasks.length > 0 ? (
              <>
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                <p className="text-gray-600 mb-4">
                  No tasks match your current search criteria. Try adjusting your filters.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedDomain('')
                    setSelectedYear('')
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Created</h3>
                <p className="text-gray-600 mb-4">
                  Create your first task to start receiving applications from talented students.
                </p>
                <Link href="/admin/tasks/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Task
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </AdminLayout>
  )
}
