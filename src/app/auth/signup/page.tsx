'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/lib/auth-actions'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { MLSALogo } from '@/components/ui/mlsa-logo'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (formData: FormData) => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    setIsLoading(true)
    try {
      await signup(formData)
    } catch (error) {
      console.error('Signup error:', error)
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
            <CardTitle className="text-3xl font-bold text-brand-secondary mb-2">
              Join MSA SRM
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Create your task submission account with your SRM email
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
                    className="pl-12 pr-4 py-3 bg-card/60 border-2 border-border/80 focus:border-secondary focus:bg-card/80 transition-all duration-200 rounded-lg text-base"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Must be a valid SRM email address
                </p>
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
                    placeholder="Create a strong password (min. 6 characters)"
                    className="pl-12 pr-12 py-3 bg-card/60 border-2 border-border/80 focus:border-secondary focus:bg-card/80 transition-all duration-200 rounded-lg text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-12 pr-12 py-3 bg-card/60 border-2 border-border/80 focus:border-secondary focus:bg-card/80 transition-all duration-200 rounded-lg text-base"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive font-medium">
                    Passwords do not match
                  </p>
                )}
              </motion.div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-6 px-8 pt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className="w-full btn-secondary py-3 text-base font-semibold"
                  disabled={isLoading || (!!password && !!confirmPassword && password !== confirmPassword)}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-base"
              >
                <span className="text-muted-foreground">Already have an account? </span>
                <Link
                  href="/auth/login"
                  className="text-brand-primary hover:text-primary hover:underline font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
