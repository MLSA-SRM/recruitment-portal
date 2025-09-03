'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Plus,
  Trash2,
  Settings,
  Type,
  CheckSquare,
  FileText
} from 'lucide-react'

import type { TaskField, FieldOption, ValidationRule, FieldType } from '@/lib/types/task-builder'

interface TaskFieldBuilderProps {
  field?: TaskField
  onUpdate: (field: Partial<TaskField>) => void
  onClose: () => void
  availableFields: string[]
}

const VALIDATION_TYPES = [
  { value: 'required', label: 'Required', description: 'Field must be filled' },
  { value: 'min', label: 'Minimum Length', description: 'Minimum character count' },
  { value: 'max', label: 'Maximum Length', description: 'Maximum character count' },
  { value: 'pattern', label: 'Pattern', description: 'Regular expression pattern' }
]

export function TaskFieldBuilder({ field, onUpdate, onClose, availableFields }: TaskFieldBuilderProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [newOption, setNewOption] = useState('')

  if (!field) return null

  const addOption = () => {
    if (!newOption.trim()) return

    const options = field.options || []
    const newOptionObj: FieldOption = {
      value: newOption.toLowerCase().replace(/\s+/g, '_'),
      label: newOption.trim()
    }

    onUpdate({
      options: [...options, newOptionObj]
    })
    setNewOption('')
  }

  const removeOption = (index: number) => {
    const options = field.options || []
    onUpdate({
      options: options.filter((_, i) => i !== index)
    })
  }

  const addValidation = (type: string) => {
    const validation = field.validation || []
    const newRule: ValidationRule = {
      type: type as ValidationRule['type'],
      message: `Please provide a valid ${field.label.toLowerCase()}`
    }

    onUpdate({
      validation: [...validation, newRule]
    })
  }

  const removeValidation = (index: number) => {
    const validation = field.validation || []
    onUpdate({
      validation: validation.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={!!field} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Edit Field: {field.label}</DialogTitle>
              <DialogDescription>
                Configure the field properties and validation rules
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            {[
              { id: 'basic', label: 'Basic', icon: Settings },
              { id: 'options', label: 'Options', icon: CheckSquare },
              { id: 'validation', label: 'Validation', icon: FileText },
              { id: 'advanced', label: 'Advanced', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Basic Settings */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="field-label">Field Label *</Label>
                  <Input
                    id="field-label"
                    value={field.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="Enter field label"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value: FieldType) => onUpdate({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Input</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select Dropdown</SelectItem>
                      <SelectItem value="multiselect">Multi-Select</SelectItem>
                      <SelectItem value="radio">Radio Buttons</SelectItem>
                      <SelectItem value="checkbox">Checkboxes</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="image">Image Upload</SelectItem>
                      <SelectItem value="video">Video Upload</SelectItem>
                      <SelectItem value="code">Code Editor</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="field-description">Description (optional)</Label>
                <Textarea
                  id="field-description"
                  value={field.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Help text for the field"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="field-placeholder">Placeholder Text</Label>
                <Input
                  id="field-placeholder"
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Placeholder text for the input"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="required"
                    checked={field.required}
                    onCheckedChange={(checked) => onUpdate({ required: checked })}
                  />
                  <Label htmlFor="required">Required Field</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="visible"
                    checked={field.isVisible}
                    onCheckedChange={(checked) => onUpdate({ isVisible: checked })}
                  />
                  <Label htmlFor="visible">Visible</Label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {['select', 'multiselect', 'radio', 'checkbox'].includes(field.type) ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Field Options</Label>
                    <Badge variant="outline">{field.options?.length || 0} options</Badge>
                  </div>

                  {/* Add New Option */}
                  <div className="flex space-x-3">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add new option"
                      onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    />
                    <Button onClick={addOption} disabled={!newOption.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Existing Options */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {field.options?.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{option.label}</span>
                          <Badge variant="outline" className="text-xs">{option.value}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        No options added yet. Add options for selection fields.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Type className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This field type doesn&apos;t require options configuration.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Validation Rules</Label>
                  <Select onValueChange={addValidation}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add validation" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALIDATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {field.validation?.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{rule.type}</Badge>
                          <span className="text-sm font-medium">{rule.message}</span>
                        </div>
                        {rule.type === 'min' || rule.type === 'max' ? (
                          <Input
                            type="number"
                            value={typeof rule.value === 'number' ? rule.value : ''}
                            onChange={(e) => {
                              const validation = [...(field.validation || [])]
                              validation[index].value = parseInt(e.target.value)
                              onUpdate({ validation })
                            }}
                            placeholder={`Enter ${rule.type} value`}
                            className="w-32"
                          />
                        ) : rule.type === 'pattern' ? (
                          <Input
                            value={typeof rule.value === 'string' ? rule.value : ''}
                            onChange={(e) => {
                              const validation = [...(field.validation || [])]
                              validation[index].value = e.target.value
                              onUpdate({ validation })
                            }}
                            placeholder="Enter regex pattern"
                          />
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeValidation(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-8">
                      No validation rules added. Add rules to ensure data quality.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label>Conditional Visibility</Label>
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="conditional-visibility"
                      checked={!!field.visibilityCondition}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          onUpdate({ visibilityCondition: undefined })
                        } else {
                          onUpdate({
                            visibilityCondition: {
                              field: '',
                              operator: 'equals',
                              value: ''
                            }
                          })
                        }
                      }}
                    />
                    <Label htmlFor="conditional-visibility">Enable conditional visibility</Label>
                  </div>

                  {field.visibilityCondition && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Select
                        value={field.visibilityCondition.field}
                        onValueChange={(value) => onUpdate({
                          visibilityCondition: {
                            ...field.visibilityCondition!,
                            field: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.filter(id => id !== field.id).map((fieldId) => (
                            <SelectItem key={fieldId} value={fieldId}>
                              {fieldId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={field.visibilityCondition.operator}
                        onValueChange={(value) => onUpdate({
                          visibilityCondition: {
                            ...field.visibilityCondition!,
                            operator: value as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={typeof field.visibilityCondition.value === 'string' || typeof field.visibilityCondition.value === 'number' ? String(field.visibilityCondition.value) : ''}
                        onChange={(e) => onUpdate({
                          visibilityCondition: {
                            ...field.visibilityCondition!,
                            value: e.target.value
                          }
                        })}
                        placeholder="Condition value"
                      />
                    </div>
                  )}
                </div>

                {/* Field Metadata */}
                <div className="space-y-3">
                  <Label>Field Metadata</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {field.type === 'textarea' && (
                      <div className="space-y-2">
                        <Label htmlFor="rows">Rows</Label>
                        <Input
                          id="rows"
                          type="number"
                          value={field.metadata?.rows || 3}
                          onChange={(e) => onUpdate({
                            metadata: {
                              ...field.metadata,
                              rows: parseInt(e.target.value)
                            }
                          })}
                          min="1"
                          max="20"
                        />
                      </div>
                    )}

                    {(field.type === 'text' || field.type === 'textarea') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="min-length">Min Length</Label>
                          <Input
                            id="min-length"
                            type="number"
                            value={field.metadata?.minLength || ''}
                            onChange={(e) => onUpdate({
                              metadata: {
                                ...field.metadata,
                                minLength: parseInt(e.target.value) || undefined
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-length">Max Length</Label>
                          <Input
                            id="max-length"
                            type="number"
                            value={field.metadata?.maxLength || ''}
                            onChange={(e) => onUpdate({
                              metadata: {
                                ...field.metadata,
                                maxLength: parseInt(e.target.value) || undefined
                              }
                            })}
                          />
                        </div>
                      </>
                    )}

                    {field.type === 'rating' && (
                      <div className="space-y-2">
                        <Label htmlFor="max-rating">Max Rating</Label>
                        <Input
                          id="max-rating"
                          type="number"
                          value={field.metadata?.maxRating || 5}
                          onChange={(e) => onUpdate({
                            metadata: {
                              ...field.metadata,
                              maxRating: parseInt(e.target.value) || 5
                            }
                          })}
                          min="1"
                          max="10"
                        />
                      </div>
                    )}

                    {(field.type === 'file' || field.type === 'image' || field.type === 'video') && (
                      <div className="space-y-2">
                        <Label htmlFor="accept">Accepted File Types</Label>
                        <Input
                          id="accept"
                          value={field.metadata?.accept || ''}
                          onChange={(e) => onUpdate({
                            metadata: {
                              ...field.metadata,
                              accept: e.target.value
                            }
                          })}
                          placeholder="e.g., .pdf,.doc,.docx"
                        />
                      </div>
                    )}

                    {field.type === 'code' && (
                      <div className="space-y-2">
                        <Label htmlFor="language">Programming Language</Label>
                        <Select
                          value={field.metadata?.language || ''}
                          onValueChange={(value) => onUpdate({
                            metadata: {
                              ...field.metadata,
                              language: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="csharp">C#</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="css">CSS</SelectItem>
                            <SelectItem value="sql">SQL</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
