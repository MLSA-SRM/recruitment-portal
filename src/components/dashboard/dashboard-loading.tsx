import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLoading() {
  return (
    <div className="min-h-screen animated-bg">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-prominent p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="hidden md:flex flex-col items-end space-y-2">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-18" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className="glass-card elevation-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="w-14 h-14 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-card border-visible p-1 h-12 rounded-lg">
            <div className="grid grid-cols-3 gap-1 h-full">
              <Skeleton className="h-full rounded" />
              <Skeleton className="h-full rounded" />
              <Skeleton className="h-full rounded" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card className="glass-card elevation-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-14 h-14 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SubmissionCardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
