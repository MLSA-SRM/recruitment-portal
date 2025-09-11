"use client"

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { env } from '@/env'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const supabase = createSupabaseClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    // Optional domain check to align with sign-in policy
    if (!email.endsWith('@srmist.edu.in')) {
      setMessage('Only SRMIST email addresses (@srmist.edu.in) are allowed.')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/update-password`,
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Password reset email sent. Check your inbox for the link.')
        setMessageType('success')
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {message && (
              <p className={messageType === 'error' ? 'text-sm text-red-600' : 'text-sm text-green-600'}>{message}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <div className="text-sm text-gray-600 text-center">
              Remembered your password?{' '}
              <Link className="text-indigo-600 hover:underline" href="/auth/signin">Sign in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


