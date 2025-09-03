import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // For now, return default settings. In production, you'd store this in database
    const defaultSettings: GitHubSettings = {
      token: process.env.GITHUB_ACCESS_TOKEN || '',
      enabled: !!process.env.GITHUB_ACCESS_TOKEN,
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
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Error fetching GitHub settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const settings: GitHubSettings = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
    }

    // In production, you'd save these settings to the database
    // For now, we'll just validate and return success
    // You could store in a settings table or user preferences

    // If token is provided, you might want to validate it
    if (settings.token && settings.enabled) {
      // Optional: Validate token format
      if (!settings.token.startsWith('ghp_') && !settings.token.startsWith('github_pat_')) {
        return NextResponse.json({
          error: 'Invalid GitHub token format. Token should start with ghp_ or github_pat_'
        }, { status: 400 })
      }
    }

    // Log the settings change for audit purposes
    console.log(`GitHub settings updated by admin ${user.email}:`, {
      enabled: settings.enabled,
      features: Object.keys(settings.features).filter(key => settings.features[key as keyof typeof settings.features]),
      webhooks: settings.webhooks.enabled,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'GitHub settings saved successfully'
    })
  } catch (error) {
    console.error('Error saving GitHub settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
