'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  
  const getErrorMessage = () => {
    switch (error) {
      case 'verification_failed':
        return message || 'The password reset link could not be verified'
      case 'missing_parameters':
        return 'The password reset link is missing required information'
      case 'invalid_type':
        return 'This link is not valid for password reset'
      default:
        return 'There was an issue with your email confirmation link'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.svg"
            alt="MSA SRM"
            width={64}
            height={64}
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Microsoft Student Ambassadors SRM</h1>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {getErrorMessage()}
            </p>
            {!error && (
              <ul className="text-sm text-gray-600 text-left mb-6 space-y-2">
                <li>• The link has expired</li>
                <li>• The link has already been used</li>
                <li>• The link is invalid or corrupted</li>
              </ul>
            )}
          </div>

          <div className="space-y-3">
            {error === 'verification_failed' || error === 'missing_parameters' ? (
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <Link href="/auth/forgot-password">
                  Request New Password Reset
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <Link href="/auth/signin">
                  Try Signing In
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full h-12">
              <Link href="/auth/signup">
                Create New Account
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}
