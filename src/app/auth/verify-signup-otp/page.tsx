'use client'

import { Suspense, useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { isRateLimitError, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import { WHATSAPP_GROUP_URL } from '@/lib/constants'

export default function VerifySignupOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifySignupOTPForm />
    </Suspense>
  )
}

function VerifySignupOTPForm() {
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
  const [isRateLimited, setIsRateLimited] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (!email) {
      router.replace('/auth/signup')
    }
  }, [email, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) return

    setLoading(true)
    setMessage('')
    setMessageType('')
    setIsRateLimited(false)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      })

      if (error) {
        if (isRateLimitError(error.message, error.status)) {
          setMessage(RATE_LIMIT_MESSAGE)
          setIsRateLimited(true)
        } else {
          setMessage(error.message)
        }
        setMessageType('error')
      } else if (data.session) {
        setMessage('Email verified! Redirecting...')
        setMessageType('success')
        setTimeout(() => router.push('/profile/setup'), 1000)
      } else {
        setMessage('Verification succeeded but no session was created. Please try signing in.')
        setMessageType('error')
      }
    } catch (err) {
      console.error('[verify-signup-otp] error:', err)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || countdown > 0) return

    setResending(true)
    setMessage('')
    setMessageType('')
    setIsRateLimited(false)

    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })

      if (error) {
        if (isRateLimitError(error.message, error.status)) {
          setMessage(RATE_LIMIT_MESSAGE)
          setIsRateLimited(true)
        } else {
          setMessage(error.message)
        }
        setMessageType('error')
      } else {
        setMessage('New verification code sent — check your inbox (and spam folder).')
        setMessageType('success')
        setCountdown(60)
      }
    } catch (err) {
      console.error('[verify-signup-otp] resend error:', err)
      setMessage('Failed to resend the verification code. Please try again shortly.')
      setMessageType('error')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <br />
            <span className="font-medium text-gray-900">{email}</span>
            <br />
            Check your inbox (and spam folder) and enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

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

            {isRateLimited && (
              <div className="text-center">
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                >
                  Join our WhatsApp group for updates
                </a>
              </div>
            )}

            <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center space-y-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-sm"
              >
                {resending
                  ? 'Sending...'
                  : countdown > 0
                    ? `Resend code in ${countdown}s`
                    : 'Resend code'}
              </Button>

              <div className="text-sm text-gray-600">
                Wrong email?{' '}
                <Link href="/auth/signup" className="text-indigo-600 hover:underline">
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
