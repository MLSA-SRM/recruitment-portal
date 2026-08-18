'use client'

import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AdminLayout } from '@/components/admin-layout'
import MarkdownRenderer from '@/components/markdown-renderer'
import { deleteTask } from '@/app/actions'
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
  FileText,
  Search,
  Filter,
  Check,
  ChevronsUpDown,
  X
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
  const [error, setError] = useState<string | null>(null)
  const [applicantCounts, setApplicantCounts] = useState<Record<number, number>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedSubdomain, setSelectedSubdomain] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [domainOpen, setDomainOpen] = useState(false)
  const [subdomainOpen, setSubdomainOpen] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])

      const { data: submissionRows, error: submissionsError } = await supabase
        .from('submissions')
        .select('task_id')

      if (!submissionsError && submissionRows) {
        const counts: Record<number, number> = {}
        for (const row of submissionRows as { task_id: number }[]) {
          counts[row.task_id] = (counts[row.task_id] || 0) + 1
        }
        setApplicantCounts(counts)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      await deleteTask(taskId)

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
    const matchesSubdomain = selectedSubdomain === '' || task.subdomain === selectedSubdomain
    const matchesYear = selectedYear === '' || selectedYear === 'all' || task.target_year.toString() === selectedYear
    
    return matchesSearch && matchesDomain && matchesSubdomain && matchesYear
  })

  // Get available subdomains based on selected domain
  const availableSubdomains = selectedDomain ? (DOMAIN_SUBDOMAINS[selectedDomain as keyof typeof DOMAIN_SUBDOMAINS] || []) : []

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDomain('')
    setSelectedSubdomain('')
    setSelectedYear('all')
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
    <AdminLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Task Management</h1>
            <p className="text-xl text-gray-600 mt-3 font-light leading-relaxed">
            Create, manage, and monitor all recruitment tasks
          </p>
        </div>
        <Link href="/admin/tasks/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-5 w-5 mr-2" />
            Create New Task
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Search & Filter Tasks</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
                placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
          />
        </div>

            {/* Domain Combobox */}
            <Popover open={domainOpen} onOpenChange={setDomainOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={domainOpen}
                  className="justify-between"
                >
                  {selectedDomain || "All Domains"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search domains..." />
                  <CommandList>
                    <CommandEmpty>No domain found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          setSelectedDomain("")
                          setSelectedSubdomain("")
                          setDomainOpen(false)
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedDomain === "" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        All Domains
                      </CommandItem>
            {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
                        <CommandItem
                          key={domain}
                          value={domain}
                          onSelect={() => {
                            setSelectedDomain(domain === selectedDomain ? "" : domain)
                            setSelectedSubdomain("")
                            setDomainOpen(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedDomain === domain ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {domain}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Subdomain Combobox */}
            <Popover open={subdomainOpen} onOpenChange={setSubdomainOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={subdomainOpen}
                  className="justify-between"
                  disabled={!selectedDomain}
                >
                  {selectedSubdomain || "All Subdomains"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Search subdomains..." />
                  <CommandList>
                    <CommandEmpty>No subdomain found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          setSelectedSubdomain("")
                          setSubdomainOpen(false)
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedSubdomain === "" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        All Subdomains
                      </CommandItem>
                      {availableSubdomains.map((subdomain: string) => (
                        <CommandItem
                          key={subdomain}
                          value={subdomain}
                          onSelect={() => {
                            setSelectedSubdomain(subdomain === selectedSubdomain ? "" : subdomain)
                            setSubdomainOpen(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedSubdomain === subdomain ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {subdomain}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Year Select */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters & Clear Button */}
          {(searchTerm || selectedDomain || selectedSubdomain || (selectedYear && selectedYear !== 'all')) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {selectedDomain && (
                <Badge variant="secondary" className="gap-1">
                  Domain: {selectedDomain}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => {
                    setSelectedDomain('')
                    setSelectedSubdomain('')
                  }} />
                </Badge>
              )}
              {selectedSubdomain && (
                <Badge variant="secondary" className="gap-1">
                  Subdomain: {selectedSubdomain}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSubdomain('')} />
                </Badge>
              )}
              {selectedYear && selectedYear !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Year: {selectedYear === '1' ? '1st' : '2nd'} Year
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedYear('all')} />
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold text-foreground">{filteredTasks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">All tasks</p>
              </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                  <p className="text-3xl font-bold text-green-600">
                  {filteredTasks.filter(task => new Date(task.deadline || '') > new Date()).length}
                </p>
                  <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
                  <p className="text-3xl font-bold text-orange-600">
                  {tasks?.filter(task => {
                    const deadline = new Date(task.deadline || '')
                    const today = new Date()
                    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return daysUntilDeadline >= 0 && daysUntilDeadline <= 7
                  }).length || 0}
                </p>
                  <p className="text-xs text-muted-foreground mt-1">Urgent deadlines</p>
              </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {tasks?.filter(task => new Date(task.deadline || '') < new Date()).length || 0}
                </p>
                  <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
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
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Tasks...</h3>
            <p className="text-gray-600">Please wait while we fetch your tasks.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12 border-red-200 bg-red-50">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-red-500 text-6xl">⚠️</div>
                <div>
                  <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Tasks</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Button onClick={loadTasks} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    Try Again
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
        {!isLoading && !error && filteredTasks.length > 0 ? (
        <div className="grid gap-6">
          {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.01] border-l-4 border-l-blue-500">
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span><strong>Applicants:</strong> {applicantCounts[task.id] || 0}</span>
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
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300 transition-colors">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/tasks/${task.id}/edit`}>
                          <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300 transition-colors">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
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
        ) : !isLoading && !error && (
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
                  onClick={clearFilters}
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
