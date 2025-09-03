'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/auth-actions'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { MLSALogo } from '@/components/ui/mlsa-logo'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await login(formData)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-border/80 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-6"
            >
              <MLSALogo size="xl" animate={true} />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-brand-primary mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sign in to your MSA SRM task submission account
            </CardDescription>
          </CardHeader>
          
          <form action={handleSubmit}>
            <CardContent className="space-y-6 px-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  SRM Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="xxxx@srmist.edu.in"
                    className="pl-12 pr-4 py-3 bg-card/60 border-2 border-border/80 focus:border-primary focus:bg-card/80 transition-all duration-200 rounded-lg text-base"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Label htmlFor="password" className="text-foreground font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 py-3 bg-card/60 border-2 border-border/80 focus:border-primary focus:bg-card/80 transition-all duration-200 rounded-lg text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-6 px-8 pt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className="w-full btn-primary py-3 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-base"
              >
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link
                  href="/auth/signup"
                  className="text-brand-secondary hover:text-secondary hover:underline font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
