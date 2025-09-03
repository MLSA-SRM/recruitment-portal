'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings,
  Save,
  Eye,
  EyeOff,
  Code,
  FileText,
  Database,
  Webhook
} from 'lucide-react'
import { toast } from 'sonner'

interface TokenInfo {
  login: string
  rate?: { remaining: number; limit: number }
  scopes?: string[]
}

interface GitHubSettings {
  token: string
  enabled: boolean
  features: {
    codeAnalysis: boolean
    fileStructure: boolean
    plagiarismDetection: boolean
    automatedReview: boolean
    repositoryInsights: boolean
  }
  webhooks: {
    enabled: boolean
    secret: string
    events: string[]
  }
  rateLimit: {
    warningThreshold: number
    autoRefresh: boolean
  }
}

export function GitHubIntegrationSettings() {
  const [status, setStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [activeTab, setActiveTab] = useState('status')

  const [settings, setSettings] = useState<GitHubSettings>({
    token: '',
    enabled: false,
    features: {
      codeAnalysis: true,
      fileStructure: true,
      plagiarismDetection: true,
      automatedReview: false,
      repositoryInsights: true
    },
    webhooks: {
      enabled: false,
      secret: '',
      events: ['push', 'pull_request']
    },
    rateLimit: {
      warningThreshold: 100,
      autoRefresh: true
    }
  })

  useEffect(() => {
    checkGitHubStatus()
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/github-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/github-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('GitHub settings saved successfully!')
        await checkGitHubStatus() // Re-check status after saving
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

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

  const availableWebhookEvents = [
    'push', 'pull_request', 'issues', 'issue_comment',
    'commit_comment', 'create', 'delete', 'release'
  ]

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="glass-card-prominent">
        <CardHeader>
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
                  GitHub Integration Status
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
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                    </div>
                  </div>
                </div>

                {/* Scopes */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mt-0.5">
                    <Key className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Token Scopes</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatScopes(tokenInfo.scopes || [])}
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
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-card border-border/60 p-1 h-auto">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Integration Status
              </CardTitle>
              <CardDescription>
                Current status and health of the GitHub integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {tokenInfo?.rate?.remaining || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">API Requests Left</div>
                </div>

                <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-2xl font-bold text-secondary">
                    {settings.features.codeAnalysis ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">Code Analysis</div>
                </div>

                <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {settings.features.plagiarismDetection ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">Plagiarism Check</div>
                </div>

                <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Webhook className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {settings.webhooks.enabled ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">Webhooks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                GitHub Token Configuration
              </CardTitle>
              <CardDescription>
                Configure your GitHub access token for API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="github-token">GitHub Access Token</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="github-token"
                      type={showToken ? 'text' : 'password'}
                      value={settings.token}
                      onChange={(e) => setSettings(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
                    Save
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a personal access token from{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings
                  </a>
                  {' '}with repo, read:user, and read:org scopes.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="github-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="github-enabled">Enable GitHub Integration</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Feature Configuration
              </CardTitle>
              <CardDescription>
                Enable or disable specific GitHub integration features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <h4 className="font-medium">Code Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Analyze code quality, structure, and best practices
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.codeAnalysis}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, codeAnalysis: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <h4 className="font-medium">File Structure Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Examine repository structure and organization
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.fileStructure}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, fileStructure: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <h4 className="font-medium">Plagiarism Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Detect potential code plagiarism and similarities
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.plagiarismDetection}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, plagiarismDetection: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <h4 className="font-medium">Automated Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate automated feedback using AI analysis
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.automatedReview}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, automatedReview: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <h4 className="font-medium">Repository Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide detailed repository analysis and metrics
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.repositoryInsights}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        features: { ...prev.features, repositoryInsights: checked }
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure webhooks for real-time repository updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3">
                <Switch
                  id="webhooks-enabled"
                  checked={settings.webhooks.enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({
                      ...prev,
                      webhooks: { ...prev.webhooks, enabled: checked }
                    }))
                  }
                />
                <Label htmlFor="webhooks-enabled">Enable Webhooks</Label>
              </div>

              <AnimatePresence>
                {settings.webhooks.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <Label htmlFor="webhook-secret">Webhook Secret</Label>
                      <div className="flex gap-3">
                        <Input
                          id="webhook-secret"
                          type="password"
                          value={settings.webhooks.secret}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            webhooks: { ...prev.webhooks, secret: e.target.value }
                          }))}
                          placeholder="Enter webhook secret"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                            setSettings(prev => ({
                              ...prev,
                              webhooks: { ...prev.webhooks, secret }
                            }))
                          }}
                        >
                          Generate
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Used to verify webhook payloads from GitHub
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Webhook Events</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableWebhookEvents.map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`event-${event}`}
                              checked={settings.webhooks.events.includes(event)}
                              onChange={(e) => {
                                const events = e.target.checked
                                  ? [...settings.webhooks.events, event]
                                  : settings.webhooks.events.filter(ev => ev !== event)
                                setSettings(prev => ({
                                  ...prev,
                                  webhooks: { ...prev.webhooks, events }
                                }))
                              }}
                              className="rounded border-border"
                            />
                            <Label htmlFor={`event-${event}`} className="text-sm">
                              {event.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Webhooks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
