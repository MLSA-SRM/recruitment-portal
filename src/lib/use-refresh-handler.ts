/**
 * Custom hook for handling page refreshes and redirects
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { redirectWithRefresh, immediateRedirect } from './redirect-utils'

interface UseRefreshHandlerOptions {
  /**
   * Whether to refresh the page on mount
   */
  refreshOnMount?: boolean
  
  /**
   * Custom refresh function
   */
  customRefresh?: () => void
}

/**
 * Hook for handling page refreshes and authentication state changes
 */
export function useRefreshHandler(options: UseRefreshHandlerOptions = {}) {
  const router = useRouter()
  const { refreshOnMount = false, customRefresh } = options

  const refreshPage = useCallback(() => {
    if (customRefresh) {
      customRefresh()
    } else {
      window.location.reload()
    }
  }, [customRefresh])

  const redirectWithDelay = useCallback((
    url: string, 
    delay: number = 1000, 
    message?: string
  ) => {
    redirectWithRefresh(url, delay, message)
  }, [])

  const immediateRedirectTo = useCallback((url: string) => {
    immediateRedirect(url)
  }, [])

  useEffect(() => {
    if (refreshOnMount) {
      refreshPage()
    }
  }, [refreshOnMount, refreshPage])

  return {
    refreshPage,
    redirectWithDelay,
    immediateRedirectTo,
    router
  }
}

/**
 * Hook specifically for authentication-related redirects
 */
export function useAuthRedirect() {
  const { redirectWithDelay, immediateRedirectTo } = useRefreshHandler()

  const redirectAfterLogin = useCallback((url: string = '/apply') => {
    redirectWithDelay(url, 1000, 'Successfully signed in! Redirecting...')
  }, [redirectWithDelay])

  const redirectAfterSignup = useCallback(() => {
    // Signup doesn't redirect immediately, user needs to verify email
    // This is just for consistency
  }, [])

  const redirectAfterProfileSetup = useCallback(() => {
    redirectWithDelay('/dashboard', 1500, 'Profile created successfully! Redirecting...')
  }, [redirectWithDelay])

  const redirectToLogin = useCallback(() => {
    immediateRedirectTo('/auth/signin')
  }, [immediateRedirectTo])

  const redirectToProfileSetup = useCallback(() => {
    immediateRedirectTo('/profile/setup')
  }, [immediateRedirectTo])

  return {
    redirectAfterLogin,
    redirectAfterSignup,
    redirectAfterProfileSetup,
    redirectToLogin,
    redirectToProfileSetup
  }
}
