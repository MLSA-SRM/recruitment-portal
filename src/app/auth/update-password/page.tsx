"use client"

import { useEffect, useState } from 'react'
//
import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/env'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UpdatePasswordPage() {
  // Use a transient client that does NOT persist session, to keep user logged out
  const supabase = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
    global: { fetch: (...args) => fetch(...args) },
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  // Session readiness is validated inline before update; no separate UI gating needed

  // Handle recovery type when Supabase redirects after reset link
  useEffect(() => {
    async function ensureRecoverySession() {
      // Supabase sends recovery details in the URL hash, not query params
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const type = params.get('type') || searchParams.get('type')
      const code = searchParams.get('code')

      // Diagnostics
      try {
        console.log('[update-password] location', {
          href: typeof window !== 'undefined' ? window.location.href : 'ssr',
          hash,
        })
        console.log('[update-password] parsed params', {
          type,
          code,
          has_access_token: Boolean(params.get('access_token')),
          has_refresh_token: Boolean(params.get('refresh_token')),
        })
      } catch {}

      // If tokens exist in hash, set the session explicitly (robust across routers)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      try {
        // PKCE flow: if "code" exists, exchange it for a session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('[update-password] exchangeCodeForSession result', { hasSession: Boolean(data?.session), error })
          if (error) {
            setMessage(error.message)
            setMessageType('error')
          }
        }

        // Implicit flow: if tokens are present, set the session
        if (type === 'recovery' && accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          console.log('[update-password] setSession result', { hasSession: Boolean(data?.session), error })
          if (error) {
            setMessage(error.message)
            setMessageType('error')
          }
        }

        // Verify session availability
        const { data } = await supabase.auth.getSession()
        console.log('[update-password] getSession check', { hasSession: Boolean(data.session) })
        if (!data.session) {
          setMessage('Recovery session not found. Please open the reset link from your email again.')
          setMessageType('error')
        }
      } catch {
        setMessage('An unexpected error occurred while preparing your session')
        setMessageType('error')
      }
    }

    ensureRecoverySession()
  }, [searchParams, supabase])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

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
      // Guard: ensure we have a recovery session before attempting password update
      const { data } = await supabase.auth.getSession()
      console.log('[update-password] before updateUser, hasSession', Boolean(data.session))
      if (!data.session) {
        setMessage('Auth session missing. Please use the password reset link from your email.')
        setMessageType('error')
        setLoading(false)
        return
      }

      const { data: updateData, error } = await supabase.auth.updateUser({ password })
      console.log('[update-password] updateUser result', { error, updatedUser: Boolean(updateData?.user) })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        // Ensure user remains logged out after reset
        try { await supabase.auth.signOut() } catch {}
        setMessage('Password updated successfully. Redirecting to sign in...')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Enter and confirm your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
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
            {message && (
              <p className={messageType === 'error' ? 'text-sm text-red-600' : 'text-sm text-green-600'}>{message}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


