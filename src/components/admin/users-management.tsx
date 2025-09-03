'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  Briefcase,
  Target,
  Activity,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  registration_number: string
  phone?: string
  department: string
  domains?: string[]
  sub_domains?: string[]
  created_at: string
  updated_at: string
}

interface UsersManagementProps {
  userStats: User[]
}

type SortField = 'name' | 'email' | 'department' | 'created_at' | 'registration_number'
type SortOrder = 'asc' | 'desc'

export function UsersManagement({ userStats }: UsersManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  // Get unique departments and domains for filters
  const departments = useMemo(() => {
    const depts = [...new Set(userStats.map(user => user.department).filter(Boolean))]
    return depts.sort()
  }, [userStats])

  const domains = useMemo(() => {
    const allDomains = userStats.flatMap(user => user.domains || [])
    return [...new Set(allDomains)].sort()
  }, [userStats])

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = userStats.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower) ||
        user.registration_number?.toLowerCase().includes(searchLower)

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter

      // Domain filter
      const matchesDomain = domainFilter === 'all' || user.domains?.includes(domainFilter)

      return matchesSearch && matchesDepartment && matchesDomain
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue: string | Date, bValue: string | Date

      switch (sortField) {
        case 'name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'department':
          aValue = a.department || ''
          bValue = b.department || ''
          break
        case 'registration_number':
          aValue = a.registration_number || ''
          bValue = b.registration_number || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = ''
          bValue = ''
      }

      if (sortField === 'created_at') {
        const dateA = aValue as Date
        const dateB = bValue as Date
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      const comparison = aValue.toString().localeCompare(bValue.toString())
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [userStats, searchTerm, departmentFilter, domainFilter, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDepartmentFilter('all')
    setDomainFilter('all')
    setSortField('created_at')
    setSortOrder('desc')
  }

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Registration Number', 'Department', 'Domains', 'Sub Domains', 'Phone', 'Joined'],
      ...filteredAndSortedUsers.map(user => [
        user.full_name || '',
        user.email || '',
        user.registration_number || '',
        user.department || '',
        (user.domains || []).join('; '),
        (user.sub_domains || []).join('; '),
        user.phone || '',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }



  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? 
      <SortAsc className="w-4 h-4 ml-1" /> : 
      <SortDesc className="w-4 h-4 ml-1" />
  }

  const UserDetailsModal = () => (
    <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
      <DialogContent className="bg-card border border-border shadow-xl max-w-3xl">
        <DialogHeader className="border-b border-border/60 pb-6">
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {selectedUser?.full_name?.charAt(0) || selectedUser?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <span className="text-2xl font-semibold text-foreground">{selectedUser?.full_name || 'User Profile'}</span>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              <Badge variant="outline" className="text-xs font-mono">
                {selectedUser?.registration_number}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
            <div className="space-y-6">
              <Card className="glass-card-subtle">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="text-sm font-medium text-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Phone className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                        <p className="text-sm font-medium text-foreground">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card-subtle">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-secondary" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium text-foreground">{selectedUser.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Briefcase className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Registration Number</p>
                      <p className="text-sm font-mono font-medium text-foreground">{selectedUser.registration_number}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass-card-subtle">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    Areas of Interest
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">PRIMARY DOMAINS</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.domains && selectedUser.domains.length > 0 ? (
                        selectedUser.domains.map(domain => (
                          <Badge key={domain} className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {domain}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No primary domains specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">SUB DOMAINS</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.sub_domains && selectedUser.sub_domains.length > 0 ? (
                        selectedUser.sub_domains.map(subDomain => (
                          <Badge key={subDomain} variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                            {subDomain}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No sub domains specified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card-subtle">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    Account Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selectedUser.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Activity className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Profile Update</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selectedUser.updated_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

      return (
      <div className="space-y-6 bg-background min-h-screen">
        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-semibold text-primary">{userStats.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Domains</p>
                  <p className="text-2xl font-semibold text-secondary">
                    {domains.length}
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Departments</p>
                  <p className="text-2xl font-semibold text-accent">{departments.length}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                  <p className="text-2xl font-semibold" style={{ color: 'var(--success)' }}>{filteredAndSortedUsers.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 124, 16, 0.1)' }}>
                  <Filter className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
              </div>
            </CardContent>
          </Card>
      </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card-prominent">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                Filters & Search
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Filter and search through user data with advanced options
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Search */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, registration..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 form-input-enhanced"
                    />
                  </div>
                </div>

                {/* Department Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="form-input-enhanced">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg">
                      <SelectItem value="all" className="hover:bg-muted">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept} className="hover:bg-muted">{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Domain Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Domain</Label>
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="form-input-enhanced">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg">
                      <SelectItem value="all" className="hover:bg-muted">All Domains</SelectItem>
                      {domains.map(domain => (
                        <SelectItem key={domain} value={domain} className="hover:bg-muted">{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {/* Actions */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">Actions</Label>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex-1 btn-outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                    <Button
                      size="sm"
                      onClick={exportUsers}
                      className="flex-1 btn-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card-prominent">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                Users Directory ({filteredAndSortedUsers.length} {filteredAndSortedUsers.length === 1 ? 'user' : 'users'})
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Comprehensive directory of all registered users with detailed profiles and activity information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border">
                      <TableHead className="text-foreground font-semibold py-4">User Profile</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/60 select-none text-foreground font-semibold py-4 transition-colors"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center gap-1">
                          Department
                          <SortIcon field="department" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/60 select-none text-foreground font-semibold py-4 transition-colors"
                        onClick={() => handleSort('registration_number')}
                      >
                        <div className="flex items-center gap-1">
                          Registration ID
                          <SortIcon field="registration_number" />
                        </div>
                      </TableHead>
                      <TableHead className="text-foreground font-semibold py-4">Areas of Interest</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/60 select-none text-foreground font-semibold py-4 transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-1">
                          Member Since
                          <SortIcon field="created_at" />
                        </div>
                      </TableHead>
                      <TableHead className="text-foreground font-semibold py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredAndSortedUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/40 transition-colors border-b border-border/40"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-border">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                                  {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-semibold text-sm text-foreground">{user.full_name || 'Unknown User'}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-foreground font-medium">{user.department || 'Not specified'}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="text-xs font-mono bg-muted/50 border-border text-foreground">
                              {user.registration_number}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-2">
                              {user.domains && user.domains.length > 0 ? (
                                <>
                                  {user.domains.slice(0, 2).map(domain => (
                                    <Badge key={domain} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                      {domain}
                                    </Badge>
                                  ))}
                                  {user.domains.length > 2 && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                      +{user.domains.length - 2} more
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">No domains specified</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-muted-foreground font-medium">
                              {new Date(user.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowUserDetails(true)
                              }}
                              className="btn-outline hover:bg-primary/10 hover:text-primary hover:border-primary/60"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
              </Table>
            </div>

              {filteredAndSortedUsers.length === 0 && (
                <div className="text-center py-16 bg-muted/20">
                  <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    No users match your current search and filter criteria. Try adjusting your filters or clearing them to see all users.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      </motion.div>

      <UserDetailsModal />
    </div>
  )
}
