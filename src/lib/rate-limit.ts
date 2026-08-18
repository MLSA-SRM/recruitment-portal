export function isRateLimitError(message: string | undefined | null, status?: number): boolean {
  if (status === 429) return true
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('rate limit') || m.includes('too many requests')
}

export const RATE_LIMIT_MESSAGE =
  "We're getting a lot of requests right now. Please wait about 20 minutes and try again."
