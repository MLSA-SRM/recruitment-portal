import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const githubToken = process.env.GITHUB_ACCESS_TOKEN
    
    if (!githubToken || githubToken === 'your_github_token_here') {
      return NextResponse.json({
        active: false,
        message: 'GitHub token not configured'
      })
    }

    // Test the GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MSA-SRM-Recruitment-Portal'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        active: false,
        error: `GitHub API error: ${response.status} ${response.statusText}`
      })
    }

    const userData = await response.json()
    
    // Get rate limit info
    const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MSA-SRM-Recruitment-Portal'
      }
    })

    let rateLimit = null
    if (rateLimitResponse.ok) {
      const rateLimitData = await rateLimitResponse.json()
      rateLimit = rateLimitData.rate
    }

    return NextResponse.json({
      active: true,
      tokenInfo: {
        login: userData.login,
        name: userData.name,
        rate: rateLimit,
        scopes: response.headers.get('x-oauth-scopes')?.split(', ') || []
      }
    })

  } catch (error) {
    console.error('Error checking GitHub status:', error)
    return NextResponse.json({
      active: false,
      error: 'Failed to check GitHub API status'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()
    
    if (!test) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const githubToken = process.env.GITHUB_ACCESS_TOKEN
    
    if (!githubToken || githubToken === 'your_github_token_here') {
      return NextResponse.json({
        active: false,
        error: 'GitHub token not configured'
      }, { status: 400 })
    }

    // Test with a specific repository (using GitHub's own repository as test)
    const testRepo = 'github/docs'
    const response = await fetch(`https://api.github.com/repos/${testRepo}`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MSA-SRM-Recruitment-Portal'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        active: false,
        error: `GitHub API test failed: ${response.status} ${response.statusText}`
      }, { status: 400 })
    }

    const repoData = await response.json()
    
    // Get user info again for the response
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MSA-SRM-Recruitment-Portal'
      }
    })

    let userData = null
    if (userResponse.ok) {
      userData = await userResponse.json()
    }

    return NextResponse.json({
      active: true,
      testResult: {
        repository: repoData.full_name,
        language: repoData.language,
        stars: repoData.stargazers_count
      },
      tokenInfo: userData ? {
        login: userData.login,
        name: userData.name,
        scopes: response.headers.get('x-oauth-scopes')?.split(', ') || []
      } : null
    })

  } catch (error) {
    console.error('Error testing GitHub API:', error)
    return NextResponse.json({
      active: false,
      error: 'Failed to test GitHub API'
    }, { status: 500 })
  }
}
