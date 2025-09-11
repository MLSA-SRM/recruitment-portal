import { env } from '@/env'

/**
 * Get the production site URL, with consistent fallback logic
 * This ensures we always use the production domain for password reset emails
 */
export function getProductionSiteUrl(): string {
  // Primary: Use the environment variable
  let baseUrl = env.NEXT_PUBLIC_SITE_URL
  
  // Fallback: Use Vercel URL if available
  if (!baseUrl && process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    baseUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
  }
  
  // Final fallback: Use production domain
  if (!baseUrl || baseUrl.includes('localhost')) {
    baseUrl = 'https://task.mlsasrm.in'
  }
  
  // Ensure it starts with https
  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`
  }
  
  // Remove trailing slash
  if (baseUrl && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }
  
  return baseUrl
}

/**
 * Build a complete URL for password reset redirects
 */
export function buildPasswordResetUrl(path: string = '/auth/update-password'): string {
  const baseUrl = getProductionSiteUrl()
  const safePath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${safePath}`
}
