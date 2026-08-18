"use client"

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyOTPPage() {
  const supabase = createSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.replace('/auth/forgot-password')
    }
  }, [email, router])

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) return
    
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      // For password reset, we use 'email' type for OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email' // Use 'email' type for sign-in OTP verification
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else if (data.session) {
        setMessage('Email verified successfully! Redirecting to password update...')
        setMessageType('success')
        // Redirect to update password page with active session
        setTimeout(() => router.push('/auth/update-password'), 1500)
      } else {
        setMessage('Verification successful but no session created. Please try again.')
        setMessageType('error')
      }
    } catch (err) {
      console.error('[verify-otp] error:', err)
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email || countdown > 0) return
    
    setResending(true)
    setMessage('')
    setMessageType('')

    try {
      // Resend the OTP using signInWithOtp again
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('New verification code sent to your email')
        setMessageType('success')
        setCountdown(60) // 60 second cooldown
      }
    } catch (err) {
      console.error('[verify-otp] resend error:', err)
      setMessage('Failed to resend verification code')
      setMessageType('error')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 8-digit code sent to <br />
            <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000000"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 8-digit code from your email
              </p>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                messageType === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || otp.length !== 8}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOTP}
                disabled={resending || countdown > 0}
                className="text-sm"
              >
                {resending 
                  ? 'Sending...' 
                  : countdown > 0 
                    ? `Resend code in ${countdown}s`
                    : 'Resend code'
                }
              </Button>

              <div className="text-sm text-gray-600">
                Wrong email?{' '}
                <Link 
                  href="/auth/forgot-password" 
                  className="text-indigo-600 hover:underline"
                >
                  Go back
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
