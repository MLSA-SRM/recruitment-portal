'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const supabase = createSupabaseClient()

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: 'text-red-500' }
      case 2:
        return { label: 'Weak', color: 'text-orange-500' }
      case 3:
        return { label: 'Fair', color: 'text-yellow-500' }
      case 4:
        return { label: 'Good', color: 'text-blue-500' }
      case 5:
        return { label: 'Strong', color: 'text-green-500' }
      default:
        return { label: 'Very Weak', color: 'text-red-500' }
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate email domain
    if (!email.endsWith('@srmist.edu.in')) {
      setMessage('Only SRMIST email addresses (@srmist.edu.in) are allowed for registration.')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Validate password strength
    if (getPasswordStrength(password) < 3) {
      setMessage('Password is too weak. Please include uppercase, lowercase, numbers, and be at least 8 characters long.')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please check and try again.')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('User already registered') ||
            error.message.includes('already registered') ||
            error.message.includes('already been registered') ||
            error.status === 422) {
          setMessage('Email already exists. Please login instead.')
          setMessageType('error')
        } else {
          setMessage(error.message)
          setMessageType('error')
        }
      } else {
        setMessage('Account created successfully! Please check your email and click the confirmation link to activate your account.')
        setMessageType('success')
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)
  const passwordStrengthInfo = getPasswordStrengthLabel(passwordStrength)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <Image
              src="/logo.svg"
              alt="MSA SRM"
              width={80}
              height={80}
              className="h-20 w-20 mx-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Microsoft Student Ambassadors
          </h1>
          <p className="text-sm text-gray-600">SRM Institute of Science & Technology</p>
        </div>

        {/* Sign Up Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              Join MSA SRM
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Only SRMIST email addresses are accepted
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-10 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                        {passwordStrengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength === 2 ? 'bg-orange-500' :
                          passwordStrength === 3 ? 'bg-yellow-500' :
                          passwordStrength === 4 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-10 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600">Passwords match!</p>
                )}
              </div>

              {/* Error/Success Message */}
              {message && (
                <Alert variant={messageType === 'error' ? 'destructive' : 'default'} className="border-l-4">
                  {messageType === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription className={messageType === 'success' ? 'text-green-800' : ''}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword || passwordStrength < 3}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Separator />
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Already have an account?
              </p>
              <Link 
                href="/auth/signin"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
