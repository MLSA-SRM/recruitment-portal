// Connection pool configuration and error handling for high-load scenarios
// This helps manage database connections and provides graceful degradation

interface ConnectionPoolConfig {
  maxConnections: number
  minConnections: number
  connectionTimeout: number
  idleTimeout: number
  retryAttempts: number
  retryDelay: number
}

class ConnectionPool {
  private config: ConnectionPoolConfig
  private activeConnections: number = 0
  private isHealthy: boolean = true
  private lastHealthCheck: number = 0

  constructor(config: ConnectionPoolConfig = {
    maxConnections: 20,
    minConnections: 5,
    connectionTimeout: 30000, // 30 seconds
    idleTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  }) {
    this.config = config
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'database operation'
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (!this.isHealthy && attempt === 1) {
          await this.waitForHealthCheck()
        }
        
        const result = await Promise.race([
          operation(),
          this.timeoutPromise(this.config.connectionTimeout)
        ]) as T
        
        // Mark as healthy on successful operation
        this.isHealthy = true
        return result
        
      } catch (error) {
        lastError = error as Error
        console.warn(`[ConnectionPool] ${context} failed (attempt ${attempt}/${this.config.retryAttempts}):`, error)
        
        if (attempt < this.config.retryAttempts) {
          // Mark as unhealthy if it's a connection error
          if (this.isConnectionError(error)) {
            this.isHealthy = false
          }
          
          // Wait before retry
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }
    
    // All retries failed
    this.isHealthy = false
    throw new Error(`${context} failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`)
  }

  private isConnectionError(error: unknown): boolean {
    const connectionErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'connection timeout',
      'database is unavailable',
      'too many connections'
    ]
    
    const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase()
    return connectionErrors.some(err => errorMessage.includes(err))
  }

  private async waitForHealthCheck(): Promise<void> {
    const now = Date.now()
    if (now - this.lastHealthCheck < 5000) { // Don't check more than once every 5 seconds
      return
    }
    
    this.lastHealthCheck = now
    // In a real implementation, you might ping the database here
    // For now, we'll just wait a bit
    await this.delay(1000)
  }

  private timeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStatus() {
    return {
      isHealthy: this.isHealthy,
      activeConnections: this.activeConnections,
      lastHealthCheck: this.lastHealthCheck
    }
  }
}

// Global connection pool instance
export const connectionPool = new ConnectionPool()

// Helper function to execute database operations with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  return connectionPool.executeWithRetry(operation, context)
}

// Helper function to check if we should enable degraded mode
export function shouldEnableDegradedMode(): boolean {
  const status = connectionPool.getStatus()
  return !status.isHealthy
}
