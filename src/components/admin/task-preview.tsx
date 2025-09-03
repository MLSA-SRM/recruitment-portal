'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Target, Trophy, FileText, Upload, Star } from 'lucide-react'

import type { TaskTemplate, TaskField } from '@/lib/types/task-builder'

interface TaskPreviewProps {
  task: TaskTemplate
}

function renderField(field: TaskField, sectionIndex: number) {
  const fieldId = `${sectionIndex}-${field.id}`

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'number':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <Input
            id={fieldId}
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className="bg-muted/50"
          />
        </div>
      )

    case 'textarea':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <Textarea
            id={fieldId}
            placeholder={field.placeholder}
            disabled
            className="bg-muted/50"
            rows={field.metadata?.rows || 3}
          />
        </div>
      )

    case 'select':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <Select disabled>
            <SelectTrigger className="bg-muted/50">
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'radio':
      return (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <RadioGroup disabled className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} disabled />
                <Label htmlFor={`${fieldId}-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )

    case 'checkbox':
      return (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox id={`${fieldId}-${option.value}`} disabled />
                <Label htmlFor={`${fieldId}-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )

    case 'file':
    case 'image':
    case 'video':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId} className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-muted/50">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {field.placeholder || `Drop ${field.type} files here or click to browse`}
            </p>
            {field.metadata?.accept && (
              <p className="text-xs text-muted-foreground mt-1">
                Accepted: {field.metadata.accept}
              </p>
            )}
          </div>
        </div>
      )

    case 'rating':
      return (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <div className="flex space-x-1">
            {Array.from({ length: field.metadata?.maxRating || 5 }).map((_, i) => (
              <Star key={i} className="w-6 h-6 text-muted-foreground" />
            ))}
          </div>
        </div>
      )

    case 'boolean':
      return (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.description && (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          )}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${fieldId}-yes`} disabled />
              <Label htmlFor={`${fieldId}-yes`} className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${fieldId}-no`} disabled />
              <Label htmlFor={`${fieldId}-no`} className="text-sm">No</Label>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div key={field.id} className="space-y-2">
          <Label className="flex items-center">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
            Preview not available for {field.type} field
          </div>
        </div>
      )
  }
}

export function TaskPreview({ task }: TaskPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Task Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <CardDescription className="text-base">{task.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className="text-sm px-3 py-1">
                {task.difficulty}
              </Badge>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{task.estimatedTime} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{task.maxScore} pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              {task.domain}
            </Badge>
            {task.subdomain && (
              <Badge variant="outline" className="text-xs">
                {task.subdomain}
              </Badge>
            )}
            {task.yearRequirement && task.yearRequirement.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Years: {task.yearRequirement.join(', ')}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Task Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Task Submission Form</span>
          </CardTitle>
          <CardDescription>
            Preview of how candidates will see and fill out the task form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {task.sections.map((section, sectionIndex) => (
              <div key={section.id} className="space-y-6">
                {/* Section Header */}
                <div className="border-t pt-6 first:border-t-0 first:pt-0">
                  <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                  {section.description && (
                    <p className="text-muted-foreground text-sm">{section.description}</p>
                  )}
                </div>

                {/* Section Fields */}
                <div className="grid gap-6">
                  {section.fields
                    .filter(field => field.isVisible)
                    .sort((a, b) => a.order - b.order)
                    .map((field) => renderField(field, sectionIndex))
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button Preview */}
          <div className="flex justify-end mt-8 pt-6 border-t">
            <Button disabled className="px-8 py-3">
              Submit Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Criteria Preview */}
      {task.scoringCriteria && task.scoringCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Scoring Criteria</span>
            </CardTitle>
            <CardDescription>
              How submissions will be evaluated (Admin Only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.scoringCriteria.map((criteria, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{criteria.criteria}</h4>
                    {criteria.description && (
                      <p className="text-sm text-muted-foreground mt-1">{criteria.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {criteria.maxPoints} pts
                  </Badge>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Total Possible Score</span>
                <Badge className="text-lg px-4 py-2">
                  {task.scoringCriteria.reduce((total, criteria) => total + criteria.maxPoints, 0)} pts
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Note */}
      <div className="text-center text-muted-foreground text-sm">
        <p>This is a preview of how the task will appear to candidates. Some interactive features are disabled in preview mode.</p>
      </div>
    </div>
  )
}
