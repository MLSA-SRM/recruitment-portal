// Monitoring and error handling for high-load scenarios
// This provides insights into system performance and graceful degradation

interface SystemMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  activeUsers: number
  databaseConnections: number
  aiQueueLength: number
  cacheHitRate: number
  lastUpdated: number
}

interface ErrorInfo {
  message: string
  stack?: string
  context: string
  timestamp: number
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class SystemMonitor {
  private metrics: SystemMetrics
  private errors: ErrorInfo[]
  private maxErrors: number = 100
  private requestTimes: number[] = []
  private maxRequestTimes: number = 1000

  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      activeUsers: 0,
      databaseConnections: 0,
      aiQueueLength: 0,
      cacheHitRate: 0,
      lastUpdated: Date.now()
    }
    this.errors = []
  }

  recordRequest(responseTime: number): void {
    this.metrics.requestCount++
    this.requestTimes.push(responseTime)
    
    // Keep only recent request times
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift()
    }
    
    // Calculate average response time
    this.metrics.averageResponseTime = this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
    this.metrics.lastUpdated = Date.now()
  }

  recordError(error: Error, context: string, userId?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    this.metrics.errorCount++
    
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userId,
      severity
    }
    
    this.errors.push(errorInfo)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }
    
    // Log critical errors
    if (severity === 'critical') {
      console.error(`[CRITICAL ERROR] ${context}:`, error)
    }
  }

  updateMetrics(updates: Partial<SystemMetrics>): void {
    this.metrics = { ...this.metrics, ...updates, lastUpdated: Date.now() }
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics }
  }

  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit)
  }

  getErrorRate(): number {
    if (this.metrics.requestCount === 0) return 0
    return (this.metrics.errorCount / this.metrics.requestCount) * 100
  }

  isSystemHealthy(): boolean {
    const errorRate = this.getErrorRate()
    const avgResponseTime = this.metrics.averageResponseTime
    
    return (
      errorRate < 5 && // Less than 5% error rate
      avgResponseTime < 2000 && // Less than 2 seconds average response time
      this.metrics.aiQueueLength < 50 // Less than 50 items in AI queue
    )
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'critical' {
    const errorRate = this.getErrorRate()
    const avgResponseTime = this.metrics.averageResponseTime
    
    if (errorRate > 10 || avgResponseTime > 5000 || this.metrics.aiQueueLength > 100) {
      return 'critical'
    }
    
    if (errorRate > 5 || avgResponseTime > 2000 || this.metrics.aiQueueLength > 50) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = []
    const errorRate = this.getErrorRate()
    const avgResponseTime = this.metrics.averageResponseTime
    
    if (errorRate > 5) {
      recommendations.push('High error rate detected. Consider implementing better error handling and retry logic.')
    }
    
    if (avgResponseTime > 2000) {
      recommendations.push('Slow response times detected. Consider adding caching or optimizing database queries.')
    }
    
    if (this.metrics.aiQueueLength > 50) {
      recommendations.push('AI queue is backing up. Consider increasing rate limits or adding more processing capacity.')
    }
    
    if (this.metrics.cacheHitRate < 0.7) {
      recommendations.push('Low cache hit rate. Consider optimizing cache keys and TTL values.')
    }
    
    return recommendations
  }
}

// Global system monitor instance
export const systemMonitor = new SystemMonitor()

// Helper function to wrap async operations with monitoring
export function withMonitoring<T>(
  operation: () => Promise<T>,
  context: string,
  userId?: string
): Promise<T> {
  const startTime = Date.now()
  
  return operation()
    .then(result => {
      const responseTime = Date.now() - startTime
      systemMonitor.recordRequest(responseTime)
      return result
    })
    .catch(error => {
      const responseTime = Date.now() - startTime
      systemMonitor.recordRequest(responseTime)
      
      // Determine error severity based on error type
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
      
      if (error.message?.includes('timeout') || error.message?.includes('connection')) {
        severity = 'high'
      } else if (error.message?.includes('database') || error.message?.includes('auth')) {
        severity = 'critical'
      }
      
      systemMonitor.recordError(error, context, userId, severity)
      throw error
    })
}

// Helper function to check if system should enable degraded mode
export function shouldEnableDegradedMode(): boolean {
  return systemMonitor.getHealthStatus() !== 'healthy'
}

// Helper function to get system status for admin dashboard
export function getSystemStatus() {
  return {
    health: systemMonitor.getHealthStatus(),
    metrics: systemMonitor.getMetrics(),
    errorRate: systemMonitor.getErrorRate(),
    recentErrors: systemMonitor.getRecentErrors(5),
    recommendations: systemMonitor.getPerformanceRecommendations()
  }
}
