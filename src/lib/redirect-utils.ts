/**
 * Utility functions for handling redirects and page refreshes
 */

/**
 * Performs a hard redirect with a delay to ensure proper state cleanup
 * @param url - The URL to redirect to
 * @param delay - Delay in milliseconds before redirect (default: 1000)
 * @param message - Optional message to show before redirect
 */
export function redirectWithRefresh(
  url: string, 
  delay: number = 1000, 
  message?: string
): void {
  if (message) {
    console.log(message)
  }
  
  setTimeout(() => {
    // Use window.location for a hard refresh to ensure clean state
    window.location.href = url
  }, delay)
}

/**
 * Performs an immediate hard redirect
 * @param url - The URL to redirect to
 */
export function immediateRedirect(url: string): void {
  window.location.href = url
}

/**
 * Performs a soft redirect using Next.js router (for same-page navigation)
 * @param router - Next.js router instance
 * @param url - The URL to redirect to
 * @param delay - Delay in milliseconds before redirect (default: 0)
 */
export function softRedirect(
  router: any, 
  url: string, 
  delay: number = 0
): void {
  if (delay > 0) {
    setTimeout(() => {
      router.push(url)
      router.refresh()
    }, delay)
  } else {
    router.push(url)
    router.refresh()
  }
}

/**
 * Checks if we should use hard redirect based on the context
 * @param fromPage - The page we're redirecting from
 * @param toPage - The page we're redirecting to
 * @returns boolean indicating if hard redirect should be used
 */
export function shouldUseHardRedirect(fromPage: string, toPage: string): boolean {
  // Use hard redirect for these scenarios to ensure clean state
  const hardRedirectScenarios = [
    { from: 'auth', to: 'dashboard' },
    { from: 'auth', to: 'apply' },
    { from: 'profile-setup', to: 'dashboard' },
    { from: 'dashboard-edit', to: 'dashboard' },
    { from: 'task-create', to: 'admin-tasks' },
    { from: 'task-edit', to: 'admin-tasks' }
  ]
  
  return hardRedirectScenarios.some(scenario => 
    fromPage.includes(scenario.from) && toPage.includes(scenario.to)
  )
}

/**
 * Smart redirect that chooses the appropriate redirect method
 * @param router - Next.js router instance
 * @param url - The URL to redirect to
 * @param fromPage - The current page context
 * @param delay - Delay in milliseconds before redirect (default: 1000)
 * @param message - Optional message to show before redirect
 */
export function smartRedirect(
  router: any,
  url: string,
  fromPage: string,
  delay: number = 1000,
  message?: string
): void {
  if (shouldUseHardRedirect(fromPage, url)) {
    redirectWithRefresh(url, delay, message)
  } else {
    softRedirect(router, url, delay)
  }
}
