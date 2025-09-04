// Rate limiter for AI review requests to prevent API overload
// This ensures we don't overwhelm the AI service with too many concurrent requests

interface RateLimitConfig {
  maxConcurrent: number
  maxPerMinute: number
  maxPerHour: number
}

interface RateLimitState {
  concurrent: number
  requestsThisMinute: number
  requestsThisHour: number
  lastMinuteReset: number
  lastHourReset: number
}

class AIRateLimiter {
  private config: RateLimitConfig
  private state: RateLimitState
  private queue: Array<() => Promise<void>>
  private processing: boolean

  constructor(config: RateLimitConfig = {
    maxConcurrent: 5, // Max 5 concurrent AI reviews
    maxPerMinute: 20, // Max 20 AI reviews per minute
    maxPerHour: 200   // Max 200 AI reviews per hour
  }) {
    this.config = config
    this.state = {
      concurrent: 0,
      requestsThisMinute: 0,
      requestsThisHour: 0,
      lastMinuteReset: Date.now(),
      lastHourReset: Date.now()
    }
    this.queue = []
    this.processing = false
  }

  private resetCountersIfNeeded() {
    const now = Date.now()
    
    // Reset minute counter if needed
    if (now - this.state.lastMinuteReset >= 60000) {
      this.state.requestsThisMinute = 0
      this.state.lastMinuteReset = now
    }
    
    // Reset hour counter if needed
    if (now - this.state.lastHourReset >= 3600000) {
      this.state.requestsThisHour = 0
      this.state.lastHourReset = now
    }
  }

  private canProcess(): boolean {
    this.resetCountersIfNeeded()
    
    return (
      this.state.concurrent < this.config.maxConcurrent &&
      this.state.requestsThisMinute < this.config.maxPerMinute &&
      this.state.requestsThisHour < this.config.maxPerHour
    )
  }

  private getWaitTime(): number {
    this.resetCountersIfNeeded()
    
    if (this.state.concurrent >= this.config.maxConcurrent) {
      return 1000 // Wait 1 second if at concurrent limit
    }
    
    if (this.state.requestsThisMinute >= this.config.maxPerMinute) {
      return 60000 - (Date.now() - this.state.lastMinuteReset) // Wait until minute resets
    }
    
    if (this.state.requestsThisHour >= this.config.maxPerHour) {
      return 3600000 - (Date.now() - this.state.lastHourReset) // Wait until hour resets
    }
    
    return 0
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          this.state.concurrent++
          this.state.requestsThisMinute++
          this.state.requestsThisHour++
          
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.state.concurrent--
          this.processQueue()
        }
      }

      if (this.canProcess()) {
        executeRequest()
      } else {
        const waitTime = this.getWaitTime()
        if (waitTime > 0) {
          setTimeout(() => {
            this.queue.push(executeRequest)
            this.processQueue()
          }, waitTime)
        } else {
          this.queue.push(executeRequest)
          this.processQueue()
        }
      }
    })
  }

  private processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0 && this.canProcess()) {
      const nextRequest = this.queue.shift()
      if (nextRequest) {
        nextRequest()
      }
    }
    
    this.processing = false
  }

  getStatus() {
    this.resetCountersIfNeeded()
    return {
      concurrent: this.state.concurrent,
      requestsThisMinute: this.state.requestsThisMinute,
      requestsThisHour: this.state.requestsThisHour,
      queueLength: this.queue.length,
      canProcess: this.canProcess(),
      waitTime: this.getWaitTime()
    }
  }
}

// Global rate limiter instance
export const aiRateLimiter = new AIRateLimiter()

// Helper function to check if we should delay AI review
export function shouldDelayAIReview(): boolean {
  const status = aiRateLimiter.getStatus()
  return !status.canProcess || status.queueLength > 10
}

// Helper function to get estimated wait time
export function getAIReviewWaitTime(): number {
  return aiRateLimiter.getStatus().waitTime
}
