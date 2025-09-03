'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Trophy,
  Settings,
  BarChart3
} from 'lucide-react'

import type { ScoringCriteria } from '@/lib/types/task-builder'

interface ScoringCriteriaBuilderProps {
  criteria: ScoringCriteria[]
  maxScore: number
  onUpdate: (criteria: ScoringCriteria[]) => void
}

export function ScoringCriteriaBuilder({ criteria, maxScore, onUpdate }: ScoringCriteriaBuilderProps) {
  const [newCriteria, setNewCriteria] = useState<Partial<ScoringCriteria>>({
    criteria: '',
    maxPoints: 10,
    weight: 1,
    description: ''
  })

  const addCriteria = () => {
    if (!newCriteria.criteria?.trim()) return

    const criteriaToAdd: ScoringCriteria = {
      fieldId: `criteria_${Date.now()}`,
      criteria: newCriteria.criteria,
      maxPoints: newCriteria.maxPoints || 10,
      weight: newCriteria.weight || 1,
      description: newCriteria.description || ''
    }

    onUpdate([...criteria, criteriaToAdd])
    setNewCriteria({
      criteria: '',
      maxPoints: 10,
      weight: 1,
      description: ''
    })
  }

  const updateCriteria = (index: number, updates: Partial<ScoringCriteria>) => {
    const updated = criteria.map((c, i) => i === index ? { ...c, ...updates } : c)
    onUpdate(updated)
  }

  const removeCriteria = (index: number) => {
    onUpdate(criteria.filter((_, i) => i !== index))
  }

  const totalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0)
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{criteria.length}</div>
            <div className="text-sm text-blue-600/70 dark:text-blue-400/70">Criteria</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPoints}</div>
            <div className="text-sm text-green-600/70 dark:text-green-400/70">Total Points</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalWeight}</div>
            <div className="text-sm text-purple-600/70 dark:text-purple-400/70">Total Weight</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{maxScore}</div>
            <div className="text-sm text-orange-600/70 dark:text-orange-400/70">Max Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Scoring Criteria</span>
          </CardTitle>
          <CardDescription>
            Define evaluation criteria for assessing task submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="criteria-name">Criteria Name *</Label>
              <Input
                id="criteria-name"
                value={newCriteria.criteria || ''}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, criteria: e.target.value }))}
                placeholder="e.g., Code Quality, Innovation, Completeness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria-points">Maximum Points</Label>
              <Input
                id="criteria-points"
                type="number"
                value={newCriteria.maxPoints || 10}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 10 }))}
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria-weight">Weight (Importance)</Label>
              <Input
                id="criteria-weight"
                type="number"
                value={newCriteria.weight || 1}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, weight: parseFloat(e.target.value) || 1 }))}
                min="0.1"
                max="5"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteria-description">Description (Optional)</Label>
            <Textarea
              id="criteria-description"
              value={newCriteria.description || ''}
              onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this criteria evaluates..."
              rows={2}
            />
          </div>

          <Button
            onClick={addCriteria}
            disabled={!newCriteria.criteria?.trim()}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Criteria
          </Button>
        </CardContent>
      </Card>

      {/* Existing Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Scoring Criteria ({criteria.length})</span>
          </CardTitle>
          <CardDescription>
            Manage and configure evaluation criteria for this task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {criteria.length > 0 ? (
              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <motion.div
                    key={criterion.fieldId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <Input
                            value={criterion.criteria}
                            onChange={(e) => updateCriteria(index, { criteria: e.target.value })}
                            className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
                            placeholder="Criteria name"
                          />
                          <Badge variant="outline" className="text-sm">
                            {criterion.maxPoints} pts
                          </Badge>
                          <Badge variant="secondary" className="text-sm">
                            Weight: {criterion.weight}
                          </Badge>
                        </div>

                        {criterion.description && (
                          <Textarea
                            value={criterion.description}
                            onChange={(e) => updateCriteria(index, { description: e.target.value })}
                            placeholder="Criteria description"
                            className="text-sm border-none p-0 h-auto focus:ring-0 resize-none"
                            rows={2}
                          />
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriteria(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Quick Edit */}
                    <div className="flex items-center space-x-4 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`points-${index}`} className="text-sm">Points:</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          value={criterion.maxPoints}
                          onChange={(e) => updateCriteria(index, { maxPoints: parseInt(e.target.value) || 0 })}
                          className="w-20 h-8 text-sm"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`weight-${index}`} className="text-sm">Weight:</Label>
                        <Input
                          id={`weight-${index}`}
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => updateCriteria(index, { weight: parseFloat(e.target.value) || 1 })}
                          className="w-20 h-8 text-sm"
                          min="0.1"
                          max="5"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 border-t-2 border-primary/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{totalPoints}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">{totalWeight.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Total Weight</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-accent">{maxScore}</div>
                      <div className="text-sm text-muted-foreground">Task Max Score</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${totalPoints > maxScore ? 'text-destructive' : 'text-success'}`}>
                        {totalPoints <= maxScore ? '✓' : '⚠'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {totalPoints <= maxScore ? 'Valid' : 'Over Limit'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scoring Criteria</h3>
                <p className="text-muted-foreground mb-4">
                  Add evaluation criteria to define how submissions will be scored.
                </p>
                <Button variant="outline" onClick={() => document.getElementById('criteria-name')?.focus()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Criteria
                </Button>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Scoring Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Settings className="w-5 h-5" />
            <span>Scoring Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Clear Criteria</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Define specific evaluation standards</li>
                <li>• Use measurable criteria when possible</li>
                <li>• Include examples of good vs poor work</li>
                <li>• Align with learning objectives</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Fair Weighting</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Weight technical skills appropriately</li>
                <li>• Consider effort and creativity</li>
                <li>• Balance different aspects of work</li>
                <li>• Ensure total points match task value</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
