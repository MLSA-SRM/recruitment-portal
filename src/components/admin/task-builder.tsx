'use client'

import React, { useState, useCallback, ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Save,
  Eye,
  Settings,
  Trash2,
  FileText,
  Image,
  Link,
  Code,
  CheckSquare,
  Type,
  Hash,
  Calendar,
  Upload,
  Star
} from 'lucide-react'

import type { TaskTemplate, TaskSection, TaskField, FieldType } from '@/lib/types/task-builder'
import { DOMAINS, COLLEGE_YEARS, TASK_DIFFICULTY, getSubdomainOptions } from '@/lib/constants/domains'
import { TaskFieldBuilder } from './task-field-builder'
import { TaskPreview } from './task-preview'
import { ScoringCriteriaBuilder } from './scoring-criteria-builder'

interface TaskBuilderProps {
  initialTask?: Partial<TaskTemplate>
  onSave: (task: TaskTemplate) => Promise<void>
  onCancel: () => void
}

const FIELD_TYPES: Array<{
  type: FieldType
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
}> = [
  { type: 'text', label: 'Text Input', icon: Type, description: 'Single line text input' },
  { type: 'textarea', label: 'Text Area', icon: FileText, description: 'Multi-line text input' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'email', label: 'Email', icon: Type, description: 'Email address input' },
  { type: 'url', label: 'URL', icon: Link, description: 'Website URL input' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'select', label: 'Select', icon: CheckSquare, description: 'Dropdown selection' },
  { type: 'multiselect', label: 'Multi-Select', icon: CheckSquare, description: 'Multiple selection' },
  { type: 'radio', label: 'Radio Buttons', icon: CheckSquare, description: 'Single choice selection' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Multiple choice selection' },
  { type: 'file', label: 'File Upload', icon: Upload, description: 'File attachment' },
  { type: 'image', label: 'Image Upload', icon: Image, description: 'Image attachment' },
  { type: 'video', label: 'Video Upload', icon: Upload, description: 'Video attachment' },
  { type: 'code', label: 'Code Editor', icon: Code, description: 'Code snippet input' },
  { type: 'rating', label: 'Rating', icon: Star, description: 'Star rating input' },
  { type: 'boolean', label: 'Yes/No', icon: CheckSquare, description: 'Boolean choice' }
]

export function TaskBuilder({ initialTask, onSave, onCancel }: TaskBuilderProps) {
  const [activeTab, setActiveTab] = useState('builder')
  const [task, setTask] = useState<Partial<TaskTemplate>>({
    title: '',
    description: '',
    domain: '',
    subdomain: '',
    yearRequirement: [],
    difficulty: 'Beginner',
    estimatedTime: 60,
    maxScore: 100,
    sections: [],
    scoringCriteria: [],
    status: 'draft',
    metadata: {
      tags: [],
      isActive: true
    },
    ...initialTask
  })

  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)

  const addSection = useCallback(() => {
    const newSection: TaskSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      description: '',
      fields: [],
      order: task.sections?.length || 0,
      isVisible: true
    }

    setTask(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }))
  }, [task.sections])

  const addField = useCallback((sectionId: string, fieldType: FieldType) => {
    const section = task.sections?.find(s => s.id === sectionId)
    if (!section) return

    const newField: TaskField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      label: 'New Field',
      placeholder: '',
      description: '',
      required: false,
      order: section.fields.length,
      isVisible: true
    }

    setTask(prev => ({
      ...prev,
      sections: prev.sections?.map(s =>
        s.id === sectionId
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    }))
  }, [task.sections])

  const updateTask = useCallback((updates: Partial<TaskTemplate>) => {
    setTask(prev => ({ ...prev, ...updates }))
  }, [])

  const updateSection = useCallback((sectionId: string, updates: Partial<TaskSection>) => {
    setTask(prev => ({
      ...prev,
      sections: prev.sections?.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }))
  }, [])

  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<TaskField>) => {
    setTask(prev => ({
      ...prev,
      sections: prev.sections?.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
              )
            }
          : s
      )
    }))
  }, [])

  const deleteSection = useCallback((sectionId: string) => {
    setTask(prev => ({
      ...prev,
      sections: prev.sections?.filter(s => s.id !== sectionId) || []
    }))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
      setSelectedField(null)
    }
  }, [selectedSection])

  const deleteField = useCallback((sectionId: string, fieldId: string) => {
    setTask(prev => ({
      ...prev,
      sections: prev.sections?.map(s =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) }
          : s
      )
    }))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }, [selectedField])

  const handleSave = async () => {
    if (!task.title || !task.domain) return

    const completeTask: TaskTemplate = {
      ...task,
      id: task.id || `task_${Date.now()}`,
      createdBy: 'admin', // This should come from auth
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as TaskTemplate

    await onSave(completeTask)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create custom tasks with dynamic forms and scoring criteria
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setActiveTab(activeTab === 'builder' ? 'preview' : 'builder')}
          >
            <Eye className="w-4 h-4 mr-2" />
            {activeTab === 'builder' ? 'Preview' : 'Builder'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!task.title || !task.domain}>
            <Save className="w-4 h-4 mr-2" />
            Save Task
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Task Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
              <CardDescription>
                Set up the basic information and requirements for your task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={task.title || ''}
                    onChange={(e) => updateTask({ title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="domain">Domain *</Label>
                  <Select
                    value={task.domain || ''}
                    onValueChange={(value) => updateTask({ domain: value, subdomain: '', subSubdomain: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOMAINS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {task.domain && (
                  <div className="space-y-3">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Select
                      value={task.subdomain || ''}
                      onValueChange={(value) => updateTask({ subdomain: value, subSubdomain: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subdomain" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubdomainOptions(task.domain as keyof typeof DOMAINS).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={task.difficulty || 'Beginner'}
                    onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') => updateTask({ difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_DIFFICULTY.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={task.estimatedTime || 60}
                    onChange={(e) => updateTask({ estimatedTime: parseInt(e.target.value) })}
                    min="15"
                    max="480"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={task.maxScore || 100}
                    onChange={(e) => updateTask({ maxScore: parseInt(e.target.value) })}
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Task Description</Label>
                <Textarea
                  id="description"
                  value={task.description || ''}
                  onChange={(e) => updateTask({ description: e.target.value })}
                  placeholder="Describe the task requirements and objectives"
                  rows={4}
                />
              </div>

              {/* Year Requirements */}
              <div className="space-y-3">
                <Label>Eligible Years (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {COLLEGE_YEARS.map((year) => (
                    <Button
                      key={year}
                      variant={task.yearRequirement?.includes(year) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = task.yearRequirement || []
                        const updated = current.includes(year)
                          ? current.filter(y => y !== year)
                          : [...current, year]
                        updateTask({ yearRequirement: updated })
                      }}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Sections Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Sections</CardTitle>
                  <CardDescription>
                    Organize your task into logical sections with custom form fields
                  </CardDescription>
                </div>
                <Button onClick={addSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.sections?.map((section) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
                          placeholder="Section title"
                        />
                        <Textarea
                          value={section.description || ''}
                          onChange={(e) => updateSection(section.id, { description: e.target.value })}
                          placeholder="Section description (optional)"
                          className="mt-2 text-sm border-none p-0 h-auto focus:ring-0 resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Fields in this section */}
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              {FIELD_TYPES.find(ft => ft.type === field.type)?.icon &&
                                React.createElement(FIELD_TYPES.find(ft => ft.type === field.type)!.icon, {
                                  className: "w-4 h-4 text-primary"
                                })
                              }
                            </div>
                            <div>
                              <div className="font-medium">{field.label}</div>
                              <div className="text-sm text-muted-foreground capitalize">{field.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedField(field.id)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteField(section.id, field.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Add Field Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                        {FIELD_TYPES.map((fieldType) => (
                          <Button
                            key={fieldType.type}
                            variant="outline"
                            size="sm"
                            onClick={() => addField(section.id, fieldType.type)}
                            className="flex flex-col items-center space-y-1 h-auto py-3"
                          >
                            <fieldType.icon className="w-4 h-4" />
                            <span className="text-xs text-center leading-tight">{fieldType.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {task.sections?.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first section to start building the task form
                    </p>
                    <Button onClick={addSection}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Section
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <ScoringCriteriaBuilder
            criteria={task.scoringCriteria || []}
            maxScore={task.maxScore || 100}
            onUpdate={(criteria) => updateTask({ scoringCriteria: criteria })}
          />
        </TabsContent>

        <TabsContent value="preview">
          <TaskPreview task={task as TaskTemplate} />
        </TabsContent>
      </Tabs>

      {/* Field Editor Modal */}
      <AnimatePresence>
        {selectedField && (
          <TaskFieldBuilder
            field={task.sections?.find(s => s.fields.find(f => f.id === selectedField))?.fields.find(f => f.id === selectedField)}
            onUpdate={(updates) => {
              const section = task.sections?.find(s => s.fields.find(f => f.id === selectedField))
              if (section) {
                updateField(section.id, selectedField, updates)
              }
            }}
            onClose={() => setSelectedField(null)}
            availableFields={task.sections?.flatMap(s => s.fields.map(f => f.id)) || []}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
