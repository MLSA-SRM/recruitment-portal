'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2, Zap } from 'lucide-react'
import Image from 'next/image'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  text?: string
  className?: string
}

export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={cn(sizeClasses[size], 'text-primary')}
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
        )

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3',
                  'bg-primary rounded-full'
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <motion.div
            className={cn(sizeClasses[size], 'bg-primary rounded-full')}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
          />
        )

      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : 'w-1.5',
                  'bg-primary rounded-full'
                )}
                style={{ height: size === 'sm' ? '12px' : size === 'lg' ? '24px' : '16px' }}
                animate={{
                  scaleY: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn('flex items-center justify-center space-x-3', className)}>
      {renderLoadingIndicator()}
      {text && (
        <motion.span
          className="text-sm text-muted-foreground font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.span>
      )}
    </div>
  )
}

// Page-level loading component
interface PageLoadingProps {
  message?: string
  showLogo?: boolean
}

export function PageLoading({ message = 'Loading...', showLogo = true }: PageLoadingProps) {
  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-8">
      <motion.div
        className="text-center space-y-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {showLogo && (
          <motion.div
            className="w-20 h-20 mx-auto mb-8"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: { duration: 4, ease: 'easeInOut', repeat: Infinity },
              scale: { duration: 2, ease: 'easeInOut', repeat: Infinity }
            }}
          >
            <Image
              src="/logo.svg"
              alt="MSA SRM"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <Zap className="w-12 h-12 text-primary mx-auto" />
          </motion.div>

          <motion.p
            className="text-lg font-semibold text-primary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message}
          </motion.p>
        </div>

        <motion.div
          className="w-64 h-2 bg-muted/20 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

// Card loading state
export function CardLoading({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('glass-card p-6 space-y-4', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-muted/20 rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted/20 rounded animate-pulse" />
          <div className="h-3 bg-muted/20 rounded animate-pulse w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 bg-muted/20 rounded animate-pulse" />
        <div className="h-3 bg-muted/20 rounded animate-pulse w-3/4" />
      </div>
      <div className="flex justify-end space-x-2">
        <div className="h-8 w-16 bg-muted/20 rounded animate-pulse" />
        <div className="h-8 w-20 bg-muted/20 rounded animate-pulse" />
      </div>
    </motion.div>
  )
}

// Inline loading for buttons
interface ButtonLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ButtonLoading({ size = 'md', className }: ButtonLoadingProps) {
  return (
    <motion.div
      className={cn(
        'flex items-center space-x-2',
        size === 'sm' ? 'px-3 py-1.5' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
          'text-current'
        )}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      <span className="text-sm font-medium">Loading...</span>
    </motion.div>
  )
}

// Skeleton loading for forms
export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="h-4 bg-muted/20 rounded animate-pulse w-1/4" />
          <div className="h-11 bg-muted/20 rounded-xl animate-pulse" />
        </motion.div>
      ))}
      <div className="h-11 bg-primary/20 rounded-xl animate-pulse" />
    </div>
  )
}
