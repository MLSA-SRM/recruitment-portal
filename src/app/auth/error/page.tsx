'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'An unexpected error occurred'

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-4 w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We encountered an issue while processing your request
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-destructive/10 rounded-lg border border-destructive/20"
            >
              <p className="text-sm text-foreground">{message}</p>
            </motion.div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-2"
            >
              <Button asChild className="w-full neon-button-cyan">
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">
                  Try Creating Account Again
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-muted-foreground"
            >
              Need help? Contact{' '}
              <a
                href="mailto:hello@mlsasrm.in"
                className="neon-text-purple hover:underline"
              >
                hello@mlsasrm.in
              </a>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-6 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
