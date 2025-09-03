'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DynamicSubmissionForm } from './dynamic-submission-form'
import { 
  Target, 
  Clock, 
  Users, 
  ArrowRight,
  CheckCircle,
  Code,
  Palette,
  Briefcase
} from 'lucide-react'

interface ProblemStatementCardProps {
  problem: Record<string, unknown>
  detailed?: boolean
}

// Type-safe helper functions to extract and validate problem data
const getProblemString = (value: unknown, fallback: string = ''): string => {
  return typeof value === 'string' ? value : fallback
}

const getProblemArray = (value: unknown): string[] => {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
}

export function ProblemStatementCard({ problem, detailed = false }: ProblemStatementCardProps) {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const router = useRouter()
  
  // Extract problem data safely
  const title = getProblemString(problem.title, 'Untitled Problem')
  const domain = getProblemString(problem.domain, 'general')
  const subDomain = getProblemString(problem.sub_domain, 'N/A')
  const description = getProblemString(problem.description, 'No description available')
  const requirements = getProblemArray(problem.requirements)
  
  const handleSubmissionSuccess = () => {
    setShowSubmissionForm(false)
    router.refresh() // Refresh the page data
  }

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'technical':
        return Code
      case 'creatives':
        return Palette
      case 'corporate':
        return Briefcase
      default:
        return Target
    }
  }

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'technical':
        return 'neon-text-cyan'
      case 'creatives':
        return 'neon-text-pink'
      case 'corporate':
        return 'neon-text-purple'
      default:
        return 'neon-text-cyan'
    }
  }

  const DomainIcon = getDomainIcon(domain)

  return (
    <>
      <motion.div
        whileHover={{ scale: detailed ? 1 : 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Card className="glass-card hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <DomainIcon className={`w-5 h-5 ${getDomainColor(domain)}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={`border-primary/30 ${getDomainColor(domain)}`}>
                      {domain}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {subDomain}
                    </Badge>
                  </div>
                </div>
              </div>
              {!detailed && (
                <Button
                  size="sm"
                  className="neon-button-cyan"
                  onClick={() => setShowSubmissionForm(true)}
                >
                  Submit
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <CardDescription className="text-foreground mb-4 line-clamp-3">
              {description}
            </CardDescription>
            
            {detailed && (
              <>
                {/* Requirements */}
                {requirements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Requirements:</h4>
                    <ul className="space-y-1">
                      {requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    className="neon-button-cyan"
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    Start Submission
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
            
            {!detailed && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Active
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Open
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Submission Form Dialog */}
      <Dialog open={showSubmissionForm} onOpenChange={setShowSubmissionForm}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="neon-text-cyan">
              Submit Solution: {title}
            </DialogTitle>
            <DialogDescription>
              Upload your solution and provide the required information below.
            </DialogDescription>
          </DialogHeader>
          <DynamicSubmissionForm 
            problem={problem} 
            onSuccess={handleSubmissionSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}