"use client"

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ResetStep = 'email' | 'otp' | 'password'

export default function ForgotPasswordPage() {
  const supabase = createSupabaseClient()
  const router = useRouter()

  const [step, setStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [resendCountdown, setResendCountdown] = useState(0)

  function resetMessages() {
    setMessage('')
    setMessageType('')
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    if (!email.endsWith('@srmist.edu.in')) {
      setMessage('Only SRMIST email addresses (@srmist.edu.in) are allowed.')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Verification code sent to your email.')
        setMessageType('success')
        setStep('otp')
        setResendCountdown(60)
        const t = setInterval(() => {
          setResendCountdown((s) => {
            if (s <= 1) {
              clearInterval(t)
              return 0
            }
            return s - 1
          })
        }, 1000)
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else if (data.session) {
        setMessage('Email verified! Please set a new password.')
        setMessageType('success')
        setStep('password')
      } else {
        setMessage('Verification succeeded but no session created. Try again.')
        setMessageType('error')
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      setMessageType('error')
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const { data: sessionCheck } = await supabase.auth.getSession()
      if (!sessionCheck.session) {
        setMessage('Session missing. Please verify the code again.')
        setMessageType('error')
        setLoading(false)
        setStep('otp')
        return
      }

      const { data: updateData, error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else if (updateData?.user) {
        try { await supabase.auth.signOut() } catch {}
        setMessage('Password updated. Redirecting to sign in...')
        setMessageType('success')
        setTimeout(() => router.replace('/auth/signin'), 1200)
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return
    resetMessages()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('A new verification code was sent.')
        setMessageType('success')
        setResendCountdown(60)
        const t = setInterval(() => {
          setResendCountdown((s) => {
            if (s <= 1) {
              clearInterval(t)
              return 0
            }
            return s - 1
          })
        }, 1000)
      }
    } catch {
      setMessage('Failed to resend code')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>
            {step === 'email' && 'Reset your password'}
            {step === 'otp' && 'Verify your email'}
            {step === 'password' && 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email to receive a verification code.'}
            {step === 'otp' && (
              <>
                Enter the 8-digit code sent to <span className="font-medium text-gray-900">{email}</span>.
              </>
            )}
            {step === 'password' && 'Enter and confirm your new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <p className={messageType === 'error' ? 'text-sm text-red-600 mb-3' : 'text-sm text-green-600 mb-3'}>{message}</p>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@srmist.edu.in"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending…' : 'Send verification code'}
              </Button>
              <div className="text-sm text-gray-600 text-center">
                Remembered your password?{' '}
                <Link className="text-indigo-600 hover:underline" href="/auth/signin">Sign in</Link>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Verification code</label>
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
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || resendCountdown > 0}
                    className="text-sm text-indigo-600 hover:underline disabled:text-gray-400"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Change email
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading || otp.length !== 8} className="w-full">
                {loading ? 'Verifying…' : 'Verify code'}
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">New password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirm password</label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


