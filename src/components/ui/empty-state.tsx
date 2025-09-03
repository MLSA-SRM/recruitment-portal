import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, Target, FileText, Search } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6"
      >
        <Icon className="w-8 h-8 text-muted-foreground" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
        
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="touch-target"
            >
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

export function EmptyStateCard({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyStateProps) {
  return (
    <Card className={`glass-card ${className}`}>
      <CardContent className="p-8">
        <EmptyState
          icon={Icon}
          title={title}
          description={description}
          action={action}
          className="py-4"
        />
      </CardContent>
    </Card>
  )
}

// Specialized empty states for common scenarios
export function NoSubmissionsState({ onCreateSubmission }: { onCreateSubmission: () => void }) {
  return (
    <EmptyState
      icon={Target}
      title="No Submissions Yet"
      description="Start your journey by submitting your first solution to showcase your skills."
      action={{
        label: "View Available Tasks",
        onClick: onCreateSubmission,
      }}
    />
  )
}

export function NoTasksState() {
  return (
    <EmptyState
      icon={FileText}
      title="No Tasks Available"
      description="New challenges will be posted soon. Stay tuned for exciting opportunities!"
    />
  )
}

export function NoResultsState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
      action={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline"
      } : undefined}
    />
  )
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
      />
      <p className="text-muted-foreground">{message}</p>
    </motion.div>
  )
}
