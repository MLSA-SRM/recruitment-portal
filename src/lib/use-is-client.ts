'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to check if code is running on the client side
 * This helps prevent hydration mismatches by ensuring consistent rendering
 * between server and client on the initial render
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
