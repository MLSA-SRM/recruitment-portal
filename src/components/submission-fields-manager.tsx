'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Trash2, 
  Settings,
  Type,
  AlignLeft,
  Upload,
  CheckSquare,
  ChevronDown,
  Hash,
  Link,
  Mail
} from 'lucide-react'
import { type SubmissionField } from '@/lib/types'

interface SubmissionFieldsManagerProps {
  taskId: number
  initialFields?: SubmissionField[]
  onFieldsChange: (fields: SubmissionField[]) => void
}

const FIELD_TYPES = [
  { key: 'text', label: 'Text Input', icon: Type, description: 'Single line text input' },
  { key: 'textarea', label: 'Text Area', icon: AlignLeft, description: 'Multi-line text input' },
  { key: 'file', label: 'File Upload', icon: Upload, description: 'File upload field' },
  { key: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Single checkbox or checkbox group' },
  { key: 'select', label: 'Dropdown Select', icon: ChevronDown, description: 'Dropdown selection from options' },
  { key: 'number', label: 'Number Input', icon: Hash, description: 'Numeric input field' },
  { key: 'url', label: 'URL Input', icon: Link, description: 'URL/website input field' },
  { key: 'email', label: 'Email Input', icon: Mail, description: 'Email address input field' }
]

export default function SubmissionFieldsManager({ 
  taskId, 
  initialFields = [], 
  onFieldsChange 
}: SubmissionFieldsManagerProps) {
  const [fields, setFields] = useState<SubmissionField[]>(initialFields)
  const [editingField, setEditingField] = useState<SubmissionField | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const addField = () => {
    const newField: SubmissionField = {
      id: -Date.now(), // Negative ID for new fields (will be replaced when saved)
      task_id: taskId,
      field_name: '',
      field_type: 'text',
      field_label: '',
      field_description: '',
      is_required: false,
      field_options: {},
      validation_rules: {},
      display_order: fields.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setFields([...fields, newField])
    setEditingField(newField)
    setShowAddForm(true)
  }

  const updateField = (fieldId: number, updates: Partial<SubmissionField>) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    )
    setFields(updatedFields)
    onFieldsChange(updatedFields)
  }

  const deleteField = (fieldId: number) => {
    const updatedFields = fields.filter(field => field.id !== fieldId)
    setFields(updatedFields)
    onFieldsChange(updatedFields)
  }

  const saveField = (field: SubmissionField) => {
    // Trim whitespace from text fields
    const trimmedField = {
      ...field,
      field_name: field.field_name?.trim() || '',
      field_label: field.field_label?.trim() || ''
    }

    if (!trimmedField.field_name || !trimmedField.field_label) {
      alert('Field name and label are required')
      return
    }

    // If this is a new field (temporary ID), assign a proper ID
    if (trimmedField.id < 0) {
      trimmedField.id = Date.now()
    }

    // Update the fields array
    let updatedFields
    if (trimmedField.id < 0) {
      // This is a new field, add it to the array
      updatedFields = [...fields, trimmedField]
    } else {
      // This is an existing field, update it
      updatedFields = fields.map(f => 
        f.id === trimmedField.id ? trimmedField : f
      )
    }

    setFields(updatedFields)
    onFieldsChange(updatedFields)
    setEditingField(null)
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setShowAddForm(false)
    setFields(fields.filter(f => f.id > 0))
  }

  const getFieldIcon = (fieldType: string) => {
    const fieldTypeConfig = FIELD_TYPES.find(ft => ft.key === fieldType)
    return fieldTypeConfig ? React.createElement(fieldTypeConfig.icon, { className: "w-4 h-4 text-blue-600" }) : null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Submission Fields</h3>
          <p className="text-sm text-gray-600">
            Define what information applicants need to provide when applying
          </p>
        </div>
        <Button type="button" onClick={addField}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        {fields.map((field) => (
          <Card key={field.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getFieldIcon(field.field_type)}
                    <span className="font-medium">{field.field_label}</span>
                    {field.is_required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingField(field)
                      setShowAddForm(true)
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => deleteField(field.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {field.field_description && (
                <p className="text-sm text-gray-600 mt-2">{field.field_description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Field Form */}
      {showAddForm && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingField?.id && editingField.id > 0 ? 'Edit Field' : 'Add New Field'}
            </CardTitle>
          </CardHeader>
                    <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field_name">Field Name *</Label>
                <Input
                  id="field_name"
                  value={editingField?.field_name || ''}
                  onChange={(e) => {
                    if (editingField) {
                      const updatedField = { ...editingField, field_name: e.target.value }
                      setEditingField(updatedField)
                      // Also update the fields array immediately for this field
                      const updatedFields = fields.map(f => 
                        f.id === editingField.id ? updatedField : f
                      )
                      setFields(updatedFields)
                    }
                  }}
                  placeholder="e.g., project_description"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal name (no spaces, used in code)
                </p>
              </div>

              <div>
                <Label htmlFor="field_type">Field Type *</Label>
                <Select
                  value={editingField?.field_type || 'text'}
                  onValueChange={(value) => {
                    if (editingField) {
                      const updatedField = { ...editingField, field_type: value as SubmissionField['field_type'] }
                      setEditingField(updatedField)
                      // Also update the fields array immediately for this field
                      const updatedFields = fields.map(f =>
                        f.id === editingField.id ? updatedField : f
                      )
                      setFields(updatedFields)
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((fieldType) => (
                      <SelectItem key={fieldType.key} value={fieldType.key}>
                        <div className="flex items-center space-x-2">
                          {React.createElement(fieldType.icon, { className: "w-4 h-4" })}
                          <span>{fieldType.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="field_label">Field Label *</Label>
                              <Input
                  id="field_label"
                  value={editingField?.field_label || ''}
                  onChange={(e) => {
                    if (editingField) {
                      const updatedField = { ...editingField, field_label: e.target.value }
                      setEditingField(updatedField)
                      // Also update the fields array immediately for this field
                      const updatedFields = fields.map(f => 
                        f.id === editingField.id ? updatedField : f
                      )
                      setFields(updatedFields)
                    }
                  }}
                  placeholder="e.g., Project Description"
                  className="mt-1"
                />
              <p className="text-xs text-gray-500 mt-1">
                Display label shown to applicants
              </p>
            </div>

            <div>
              <Label htmlFor="field_description">Description</Label>
                              <Textarea
                  id="field_description"
                  value={editingField?.field_description || ''}
                  onChange={(e) => {
                    if (editingField) {
                      const updatedField = { ...editingField, field_description: e.target.value }
                      setEditingField(updatedField)
                      // Also update the fields array immediately for this field
                      const updatedFields = fields.map(f => 
                        f.id === editingField.id ? updatedField : f
                      )
                      setFields(updatedFields)
                    }
                  }}
                  placeholder="Help text to guide applicants"
                  className="mt-1"
                  rows={2}
                />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_required"
                  checked={editingField?.is_required || false}
                  onCheckedChange={(checked) => {
                    if (editingField) {
                      const updatedField = { ...editingField, is_required: !!checked }
                      setEditingField(updatedField)
                      // Also update the fields array immediately for this field
                      const updatedFields = fields.map(f => 
                        f.id === editingField.id ? updatedField : f
                      )
                      setFields(updatedFields)
                    }
                  }}
                />
                <Label htmlFor="is_required">Required field</Label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button"
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault()
                  cancelEdit()
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (editingField) {
                    // Ensure we have the latest values from the form
                    const currentField = {
                      ...editingField,
                      field_name: (document.getElementById('field_name') as HTMLInputElement)?.value || editingField.field_name,
                      field_label: (document.getElementById('field_label') as HTMLInputElement)?.value || editingField.field_label,
                      field_description: (document.getElementById('field_description') as HTMLTextAreaElement)?.value || editingField.field_description,
                      is_required: (document.getElementById('is_required') as HTMLInputElement)?.checked || editingField.is_required
                    }
                    saveField(currentField)
                  }
                }}
              >
                {editingField?.id && editingField.id > 0 ? 'Update Field' : 'Add Field'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <p className="text-sm text-gray-600">
              How the submission form will look to applicants
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              {fields
                .sort((a, b) => a.display_order - b.display_order)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <span>{field.field_label}</span>
                      {field.is_required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </Label>
                    {field.field_description && (
                      <p className="text-sm text-gray-600">{field.field_description}</p>
                    )}
                    {renderFieldPreview(field)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function renderFieldPreview(field: SubmissionField) {
  switch (field.field_type) {
    case 'text':
      return (
        <Input 
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          disabled
        />
      )
    case 'textarea':
      return (
        <Textarea 
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          rows={3}
          disabled
        />
      )
    case 'select':
      return (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox disabled />
          <Label className="text-sm">Check this option</Label>
        </div>
      )
    case 'number':
      return (
        <Input 
          type="number" 
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          disabled
        />
      )
    case 'url':
      return (
        <Input 
          type="url" 
          placeholder="https://example.com"
          disabled
        />
      )
    case 'email':
      return (
        <Input 
          type="email" 
          placeholder="email@example.com"
          disabled
        />
      )
    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload file</p>
        </div>
      )
    default:
      return <Input disabled />
  }
}
