'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Github, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  TestTube,
  Shield,
  Activity,

  User,
  Key,
  Zap,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

export function GitHubStatus() {
  const [status, setStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking')
  const [tokenInfo, setTokenInfo] = useState<{
    login: string;
    rate?: { remaining: number; limit: number };
    scopes?: string[];
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    checkGitHubStatus()
  }, [])

  const checkGitHubStatus = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/github-status')
      const data = await response.json()
      
      if (response.ok) {
        setStatus(data.active ? 'active' : 'inactive')
        setTokenInfo(data.tokenInfo)
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('Error checking GitHub status:', err)
      setStatus('error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const testGitHubAccess = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/github-status', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('GitHub API test successful!')
        setStatus('active')
        setTokenInfo(data.tokenInfo)
      } else {
        toast.error(`GitHub API test failed: ${data.error}`)
        setStatus('error')
      }
    } catch {
      toast.error('Failed to test GitHub API')
      setStatus('error')
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          textColor: 'text-green-400',
          label: 'Active',
          description: 'GitHub integration is fully operational'
        }
      case 'inactive':
        return {
          icon: XCircle,
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          textColor: 'text-gray-400',
          label: 'Inactive',
          description: 'GitHub token not configured'
        }
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          textColor: 'text-red-400',
          label: 'Error',
          description: 'Connection failed - check token configuration'
        }
      default:
        return {
          icon: Github,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          textColor: 'text-blue-400',
          label: 'Checking...',
          description: 'Verifying GitHub connection'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const getRateLimitColor = () => {
    if (!tokenInfo?.rate?.remaining) return 'text-muted-foreground'
    const percentage = (tokenInfo.rate.remaining / tokenInfo.rate.limit) * 100
    if (percentage > 50) return 'text-green-400'
    if (percentage > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatScopes = (scopes: string[]) => {
    if (!scopes || scopes.length === 0) return 'No scopes'
    return scopes.slice(0, 5).join(', ') + (scopes.length > 5 ? ` +${scopes.length - 5} more` : '')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card-prominent hover:border-primary/30 transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.bgColor} ${statusConfig.borderColor} border`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
              </motion.div>
              <div>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Github className="w-5 h-5 text-muted-foreground" />
                  GitHub Integration
                </CardTitle>
                <CardDescription className="mt-1">
                  Enhanced code analysis for AI feedback system
                </CardDescription>
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge 
                className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border font-medium px-3 py-1`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border`}
          >
            <p className={`text-sm font-medium ${statusConfig.textColor}`}>
              {statusConfig.description}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {status === 'active' && tokenInfo && (
              <motion.div
                key="active-info"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Token Owner */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Token Owner</p>
                    <p className="text-sm text-muted-foreground">{tokenInfo.login}</p>
                  </div>
                </div>

                {/* Rate Limit */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">API Rate Limit</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-mono ${getRateLimitColor()}`}>
                        {tokenInfo.rate?.remaining || 'Unknown'} / {tokenInfo.rate?.limit || 'Unknown'}
                      </p>
                      <span className="text-xs text-muted-foreground">requests remaining</span>
                    </div>
                    {tokenInfo.rate?.remaining && tokenInfo.rate?.limit && (
                      <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                        <motion.div
                          className={`h-1.5 rounded-full ${
                            (tokenInfo.rate.remaining / tokenInfo.rate.limit) > 0.5 
                              ? 'bg-green-400' 
                              : (tokenInfo.rate.remaining / tokenInfo.rate.limit) > 0.2 
                                ? 'bg-yellow-400' 
                                : 'bg-red-400'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(tokenInfo.rate.remaining / tokenInfo.rate.limit) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Scopes */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mt-0.5">
                    <Key className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Token Scopes</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {formatScopes(tokenInfo.scopes || [])}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'inactive' && (
              <motion.div
                key="inactive-info"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Configuration Required</p>
                    <p className="text-sm text-muted-foreground">
                      Add your GitHub access token to the environment variables to enable advanced code analysis features.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error-info"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-2">Connection Error</p>
                    <p className="text-sm text-red-300/80">
                      Unable to connect to GitHub API. Please verify your token configuration and network connectivity.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={checkGitHubStatus} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing || status === 'checking'}
              className="flex items-center gap-2 hover:border-primary/50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Button 
              onClick={testGitHubAccess} 
              variant="outline" 
              size="sm"
              disabled={isTesting || status === 'checking'}
              className="flex items-center gap-2 hover:border-secondary/50"
            >
              <TestTube className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`} />
              Test API Access
            </Button>
          </div>

          {/* Feature Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-lg bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Enhanced AI Analysis</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When active, this integration enables detailed code analysis, file structure examination, 
                  and enhanced plagiarism detection based on actual repository contents.
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}