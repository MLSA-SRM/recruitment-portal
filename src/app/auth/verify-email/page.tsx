'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function VerifyEmailPage() {
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
              className="mx-auto mb-4 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <Mail className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold neon-text-cyan">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We&apos;ve sent you a verification link
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Verification email sent</span>
              </div>
              
              <p className="text-sm text-foreground">
                Please check your SRM email inbox and click the verification link to complete your account setup.
              </p>
              
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> The link will expire in 24 hours. If you don&apos;t see the email, 
                  check your spam folder or try signing up again.
                </p>
              </div>
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
                  Resend Verification Email
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-muted-foreground"
            >
              Having trouble? Contact{' '}
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
