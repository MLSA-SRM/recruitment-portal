'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { getGeminiModel, parseGeminiJsonResponse, generateStructuredReview, PROMPTS, validateSubmissionUrls, detectFakeSubmission } from '@/lib/ai'
import { Octokit } from 'octokit'
import * as cheerio from 'cheerio'
import { z } from 'zod'
import env from '@/env'
import { aiRateLimiter } from '@/lib/rate-limiter'

type Status = 'pending' | 'shortlisted' | 'rejected'
type ReviewContext = 'new' | 'edit'

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

async function logAdminActivity(
  action: string,
  targetType: string,
  targetId: string | number | null,
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = await createSupabaseServer()
    const adminId = await getCurrentUserId()
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId !== null ? String(targetId) : null,
      details,
    })
  } catch (e) {
    console.error('[admin_activity_log] failed to record activity:', e)
  }
}

async function fetchGithubRepoFiles(repoUrl: string): Promise<string> {
  try {
    console.log('Fetching GitHub repo files from:', repoUrl)
    const token = env.GITHUB_TOKEN
    if (!token) {
      console.log('No GitHub token found, skipping GitHub content fetch')
      return ''
    }
    
    const octokit = new Octokit({ auth: token })
    const match = repoUrl.match(/github.com\/(.+?)\/(.+?)(?:$|\?|#|\/)/)
    if (!match) {
      console.log('Invalid GitHub URL format:', repoUrl)
      return ''
    }
    
    const owner = match[1]
    const repo = match[2]
    console.log('Extracted owner:', owner, 'repo:', repo)

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch
    const { data: refData } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    const commitSha = (refData as unknown as { object?: { sha: string }; sha?: string }).object?.sha || (refData as unknown as { sha: string }).sha
    const { data: tree } = await octokit.rest.git.getTree({ owner, repo, tree_sha: commitSha, recursive: 'true' })

    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.md']
    const files = (tree as { tree?: Array<{ type: string; path: string }> }).tree?.filter((n) => n.type === 'blob' && codeExtensions.some(ext => n.path.endsWith(ext))) || []
    
    console.log('Found', files.length, 'code files')
    
    let bundle = ''
    for (const f of files) {
      try {
        const { data: fileContent } = await octokit.rest.repos.getContent({ owner, repo, path: f.path })
        const content = 'content' in fileContent && typeof fileContent.content === 'string' ? Buffer.from(fileContent.content, 'base64').toString('utf-8') : ''
        bundle += `\n\n// FILE: ${f.path}\n${content}`
      } catch (fileError) {
        console.log('Failed to fetch file:', f.path, fileError)
      }
    }
    
    console.log('Total content length:', bundle.length)
    return bundle
  } catch (error) {
    console.error('GitHub fetch failed:', error)
    return ''
  }
}

async function scrapePageText(url: string): Promise<string> {
  try {
    console.log('Scraping page text from:', url)
    const res = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!res.ok) {
      console.log('HTTP error:', res.status, res.statusText)
      return ''
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    $('script,style,noscript,header,footer,nav,aside').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()
    
    console.log('Scraped text length:', text.length)
    return text
  } catch (error) {
    console.error('Page scraping failed:', error)
    return ''
  }
}

function getAiRecommendation(score: number | null | undefined): 'shortlist' | 'reject' | null {
  if (typeof score !== 'number') return null
  if (score >= 400) return 'shortlist'
  return 'reject'
}

async function performAIReview(opts: {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>
  submissionId: number
  taskId: number
  userId: string
  submissionUrl: string
  submissionData?: Record<string, unknown>
  context: ReviewContext
}) {
  const { supabase, submissionId, taskId, userId, submissionUrl, submissionData, context } = opts

  console.log(`[AI][${context}] performAIReview called`, { 
    submissionId, 
    taskId, 
    userId, 
    url: submissionUrl,
    hasSubmissionData: !!submissionData,
    submissionDataKeys: submissionData ? Object.keys(submissionData) : [],
    submissionDataPreview: submissionData ? JSON.stringify(submissionData, null, 2).slice(0, 500) : 'null'
  })

  // Get task info first to determine if URL validation is needed
  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, domain, subdomain, deadline, image_url')
    .eq('id', taskId)
    .single()

  // Basic URL validation - only check for completely empty or malformed URLs
  // IMPORTANT: Skip URL validation entirely for Corporate and Creatives domains
  const urlsToValidate: string[] = []
  let urlValidation: { isValid: boolean; isPlaceholder: boolean; reason?: string; legitimateUrls: string[]; invalidUrls: string[] } = { 
    isValid: true, 
    isPlaceholder: false, 
    reason: '', 
    legitimateUrls: [], 
    invalidUrls: [] 
  }
  
  if (task?.domain !== 'Corporate' && task?.domain !== 'Creatives') {
    if (submissionUrl) urlsToValidate.push(submissionUrl)
    
    if (submissionData) {
      Object.entries(submissionData).forEach(([, fieldInfo]) => {
        if (fieldInfo && typeof fieldInfo === 'object' && 'value' in fieldInfo) {
          const { value, type } = fieldInfo as { value: unknown; type: string }
          if (type === 'url' && typeof value === 'string' && value.trim()) {
            urlsToValidate.push(value.trim())
          }
        }
      })
    }

    urlValidation = validateSubmissionUrls(urlsToValidate)
    
    // Only reject if ALL URLs are invalid (and the domain requires URLs)
    if (!urlValidation.isValid && urlValidation.isPlaceholder && task?.domain !== 'Corporate' && task?.domain !== 'Creatives') {
      console.log(`[AI][${context}] All URLs are invalid:`, urlValidation.reason)
      
      const { error: invalidUrlError } = await supabase.from('submissions').update({
        ai_score: 0, // Score 0 for completely invalid URLs
        ai_review: `**AI Review - Invalid Submission**

## Summary
This submission contains only invalid or malformed URLs (${urlValidation.reason}) and cannot be properly evaluated.

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Task Compliance & Requirements | 0/300 | Invalid submission format |
| Code Quality & Architecture | 0/250 | No valid content to evaluate |
| Functionality & Correctness | 0/200 | No valid content to evaluate |
| Technical Implementation | 0/150 | No valid content to evaluate |
| Documentation & Deployment | 0/100 | No valid content to evaluate |

## Critical Issues
- **Invalid URLs**: All URLs are malformed or empty
- **Cannot Evaluate**: Unable to access or analyze any submission content

## Recommendations
- **Fix URL format**: Ensure all URLs are properly formatted and accessible
- **Resubmit**: Provide valid, working URLs to your project repository and demo
- **Test links**: Verify all URLs work before submitting

**Note**: Please resubmit with properly formatted, working URLs.`,
        ai_recommendation: 'reject'
      }).eq('id', submissionId)
      
      if (invalidUrlError) {
        console.error(`[AI][${context}] Failed to update invalid URL rejection:`, invalidUrlError)
      }
      return
    }
  } else {
    console.log(`[AI][${context}] Skipping URL validation for ${task?.domain} domain task`)
    // Ensure validation cannot trip later logic
    urlValidation = { isValid: true, isPlaceholder: false, reason: undefined, legitimateUrls: [], invalidUrls: [] }
  }

  // Log URL validation results for debugging
  if (urlValidation.invalidUrls.length > 0) {
    console.log(`[AI][${context}] Mixed URL quality detected:`, {
      legitimate: urlValidation.legitimateUrls.length,
      invalid: urlValidation.invalidUrls.length,
      invalidUrls: urlValidation.invalidUrls
    })
  }

  const { data: profile } = await supabase.from('profiles').select('year').eq('id', userId).single()

  // Set in-progress message
  const { error: progressError } = await supabase.from('submissions').update({ 
    ai_score: null, 
    ai_review: context === 'edit' ? 'AI review in progress... (submission was updated)' : 'AI review in progress...'
  }).eq('id', submissionId)
  
  if (progressError) {
    console.error(`[AI][${context}] Failed to set progress message:`, progressError)
  }

  // Build content and prompt from all submission data
  let content = ''
  let prompt = ''
  let hasValidContent = false

  // Start with submission field data
  const submissionContent: string[] = []
  
  if (submissionData && Object.keys(submissionData).length > 0) {
    console.log(`[AI][${context}] Processing submission data:`, {
      keys: Object.keys(submissionData),
      dataStructure: Object.entries(submissionData).map(([key, value]) => {
        const fieldInfo = value as { value?: unknown; type?: string; label?: string }
        return {
          key,
          hasValue: 'value' in fieldInfo,
          hasType: 'type' in fieldInfo,
          hasLabel: 'label' in fieldInfo,
          valueType: typeof fieldInfo?.value,
          valuePreview: String(fieldInfo?.value || '').slice(0, 100)
        }
      })
    })
    
    submissionContent.push('## Submission Information:')
    Object.entries(submissionData).forEach(([fieldName, fieldInfo]) => {
      console.log(`[AI][${context}] Processing field ${fieldName}:`, fieldInfo)
      
      if (fieldInfo && typeof fieldInfo === 'object' && 'value' in fieldInfo) {
        const { value, type, label } = fieldInfo as { value: unknown; type: string; label: string }
        
        console.log(`[AI][${context}] Field ${fieldName} details:`, { value, type, label })
        
        if (type === 'url' && typeof value === 'string') {
          submissionContent.push(`**${label}:** ${value}`)
        } else if (type === 'text' || type === 'textarea' || type === 'email') {
          submissionContent.push(`**${label}:** ${value}`)
        } else if (type === 'number') {
          submissionContent.push(`**${label}:** ${value}`)
        } else if (type === 'select') {
          submissionContent.push(`**${label}:** ${value}`)
        } else if (type === 'checkbox') {
          const checkboxValue = Array.isArray(value) ? value.join(', ') : value
          submissionContent.push(`**${label}:** ${checkboxValue}`)
        } else if (type === 'file' && typeof value === 'object' && value !== null) {
          const fileInfo = value as { name?: string; type?: string; size?: number }
          submissionContent.push(`**${label}:** File uploaded - ${fileInfo.name || 'Unknown'} (${fileInfo.type || 'Unknown'}, ${fileInfo.size ? Math.round(fileInfo.size / 1024) : 0}KB)`)
        } else {
          console.log(`[AI][${context}] Unhandled field type ${type} for field ${fieldName}`)
        }
      } else {
        console.log(`[AI][${context}] Invalid field structure for ${fieldName}:`, fieldInfo)
      }
    })
  } else {
    console.log(`[AI][${context}] No submission data or empty submission data:`, submissionData)
  }

  try {
    // Derive external sources from submission_data only
    const urlsFromFields: string[] = []
    const possibleGithubTexts: string[] = []
    if (submissionData) {
      for (const [, info] of Object.entries(submissionData)) {
        type FieldInfo = { value?: unknown }
        const fieldInfo = info as FieldInfo
        const raw = String(fieldInfo?.value ?? '')
        if (!raw) continue
        // Extract URLs present in the value
        const urlRegex = /https?:\/\/[\w.-]+(?:\.[\w\.-]+)+(?:[\w\-\._~:\/?#\[\]@!$&'()*+,;=%]*)/gi
        const matches = raw.match(urlRegex)
        if (matches) urlsFromFields.push(...matches)
        // Collect text that might include keywords like github
        if (typeof fieldInfo?.value === 'string') {
          possibleGithubTexts.push((fieldInfo.value as string).toLowerCase())
        }
      }
    }

    // Prefer GitHub URLs if present; else any URL
    const primaryGithubUrl = urlsFromFields.find(u => /github\.com\//i.test(u))
    const primaryUrl = urlsFromFields.find(u => !/github\.com\//i.test(u))

    // Heuristic keyword-only cue to fetch GitHub if no URL but text mentions it
    const mentionsGithub = possibleGithubTexts.some(t => t.includes('github'))

    if (task?.domain === 'Technical' && (primaryGithubUrl || mentionsGithub)) {
      const githubContent = await fetchGithubRepoFiles(primaryGithubUrl || '')
      if (githubContent && githubContent.trim().length > 0) {
        submissionContent.push('\n## Repository Content:')
        submissionContent.push(githubContent)
        hasValidContent = true
      }
    } else if (primaryUrl) {
      const scrapedContent = await scrapePageText(primaryUrl)
      if (scrapedContent && scrapedContent.trim().length > 0) {
        submissionContent.push('\n## Website Content:')
        submissionContent.push(scrapedContent)
        hasValidContent = true
      }
    }
    
    // Check if we have any content from submission fields
    // submissionContent starts with a header, so we need at least 2 items (header + 1 field)
    // For corporate tasks, we only need text content, not URLs
    if (submissionContent.length > 1) { // More than just the header
      hasValidContent = true
      console.log(`[AI][${context}] Valid content found from submission fields: ${submissionContent.length - 1} fields`)
    } else {
      console.log(`[AI][${context}] No valid content from submission fields: ${submissionContent.length} items`)
    }
    
    // For corporate tasks, if we have text content in submission fields, that's sufficient
    if (task?.domain === 'Corporate' && submissionContent.length > 1) {
      hasValidContent = true
      console.log(`[AI][${context}] Corporate task with text content - marking as valid`)
    }
    
    content = submissionContent.join('\n\n')
    
    // Enhanced fake submission detection combining URL and content analysis
    // Skip fake detection for corporate tasks as they don't require URLs
    let fakeDetection: { isFake: boolean; confidence: number; reasons: string[]; shouldAwardZero: boolean } = { 
      isFake: false, 
      confidence: 0, 
      reasons: [], 
      shouldAwardZero: false 
    }
    // Initialize default AI detection state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const defaultAiDetection: { isAIGenerated: boolean; confidence: number; reasons: string[]; shouldReducePoints: boolean } = { 
      isAIGenerated: false, 
      confidence: 0, 
      reasons: [], 
      shouldReducePoints: false 
    }
    
    if (task?.domain !== 'Corporate') {
      fakeDetection = detectFakeSubmission(urlsToValidate, content)
    } else {
      // For corporate tasks, check for AI-generated content instead
      const { detectAIGeneratedContent } = await import('@/lib/ai')
      const aiDetection = detectAIGeneratedContent(content)
      
      // Use aiDetection for logging or future processing if needed
      if (aiDetection.isAIGenerated) {
        console.log(`[AI][${context}] AI-generated content detected:`, {
          confidence: aiDetection.confidence,
          reasons: aiDetection.reasons,
        })
      }
    }
    
    if (fakeDetection.isFake && fakeDetection.shouldAwardZero) {
      console.log(`[AI][${context}] Fake submission detected:`, {
        confidence: fakeDetection.confidence,
        reasons: fakeDetection.reasons,
        shouldAwardZero: fakeDetection.shouldAwardZero
      })
      
      // Award zero points for fake submissions
      const { error: fakeSubmissionError } = await supabase.from('submissions').update({
        ai_score: 0,
        ai_review: `**FAKE SUBMISSION DETECTED**

**Confidence:** ${Math.round(fakeDetection.confidence * 100)}%

**Reasons:**
${fakeDetection.reasons.map(reason => `- ${reason}`).join('\n')}

**Score:** 0/1000

This submission appears to be fake, placeholder, or contains no actual work. Please submit a genuine project that addresses the task requirements.`,
        ai_recommendation: 'reject'
      }).eq('id', submissionId)
      
      if (fakeSubmissionError) {
        console.error(`[AI][${context}] Failed to write fake submission detection:`, fakeSubmissionError)
      }
      return
    }
    
    console.log(`[AI][${context}] Content built:`, {
      contentLength: content.length,
      hasValidContent,
      submissionContentLength: submissionContent.length,
      contentPreview: content.slice(0, 500),
      taskDomain: task?.domain,
      fakeSubmissionAnalysis: {
        isFake: fakeDetection.isFake,
        confidence: fakeDetection.confidence,
        reasons: fakeDetection.reasons,
        shouldAwardZero: fakeDetection.shouldAwardZero
      }
    })
    
    if (hasValidContent) {
      if (task?.domain === 'Corporate') {
        prompt = PROMPTS.corporate(content)
      } else if (task?.domain === 'Creatives') {
        // Skip AI for Creatives; manual review only
        const { error: skipCreativesError } = await supabase.from('submissions').update({
          ai_score: 0,
          ai_review: 'AI review skipped: Creatives submissions are manually reviewed. No AI score assigned.',
          ai_recommendation: 'reject'
        }).eq('id', submissionId)
        if (skipCreativesError) {
          console.error(`[AI][${context}] Failed to write creatives skip message:`, skipCreativesError)
        }
        return
      } else {
        const isFirstYear = (profile?.year ?? 1) <= 1
        const taskType = task?.subdomain || 'General'
        prompt = isFirstYear ? PROMPTS.tech_first_year(content, taskType) : PROMPTS.tech_second_year(content, taskType)
      }
      console.log(`[AI][${context}] Prompt generated, length: ${prompt.length}`)
    } else {
      console.log(`[AI][${context}] No valid content found, skipping prompt generation`)
    }
  } catch (e) {
    console.error(`[AI][${context}] Content fetch failed:`, e)
  }

  if (!hasValidContent || !prompt.trim()) {
    console.log(`[AI][${context}] No valid content/prompt; writing skip message`)
    const { error: skipError } = await supabase.from('submissions').update({
      ai_score: 0,
      ai_review: 'AI review skipped: No valid content to analyze. Please provide sufficient details in the form fields.'
    }).eq('id', submissionId)
    
    if (skipError) {
      console.error(`[AI][${context}] Failed to write skip message:`, skipError)
    }
    return
  }

  try {
    console.log(`[AI][${context}] Calling model for submission ${submissionId}`)
    const model = getGeminiModel('gemini-2.0-flash')
    
    // Add enhanced URL analysis for mixed quality submissions (only for non-corporate tasks)
    let urlAnalysisContext = ''
    
    // Get advanced AI usage evaluation for all tasks
    let aiUsageEvaluation: { 
      usageQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'undetected'
      confidence: number
      reasons: string[]
      recommendations: string[]
      score: number
    } = { 
      usageQuality: 'undetected', 
      confidence: 0, 
      reasons: [], 
      recommendations: [],
      score: 100
    }
    
    // Determine submission type for AI evaluation
    let submissionType: 'tech_first_year' | 'tech_second_year' | 'corporate'
    if (task?.domain === 'Corporate') {
      submissionType = 'corporate'
    } else if (task?.domain === 'Technical') {
      const isFirstYear = (profile?.year ?? 1) <= 1
      submissionType = isFirstYear ? 'tech_first_year' : 'tech_second_year'
    } else {
      submissionType = 'tech_first_year' // Default fallback
    }
    
    const { evaluateAIUsage } = await import('@/lib/ai')
    aiUsageEvaluation = evaluateAIUsage(content, submissionType)
    if (task?.domain !== 'Corporate') {
      const { analyzeMixedUrlSubmission } = await import('@/lib/ai')
      const mixedUrlAnalysis = analyzeMixedUrlSubmission(urlsToValidate, content)
      
      // Add URL analysis and AI evaluation context to the prompt
      let aiTechEvaluationContext = ''
      if (aiUsageEvaluation.usageQuality !== 'undetected') {
        const qualityMap = {
          excellent: 'EXCELLENT AI Integration',
          good: 'GOOD AI Usage',
          acceptable: 'ACCEPTABLE AI Usage',
          poor: 'POOR AI Usage'
        }
        
        aiTechEvaluationContext = `\n\nADVANCED AI USAGE ASSESSMENT:
Quality: ${qualityMap[aiUsageEvaluation.usageQuality as keyof typeof qualityMap]} (${Math.round(aiUsageEvaluation.confidence * 100)}% confidence)
Analysis: ${aiUsageEvaluation.reasons.join('; ')}
Scoring Impact: ${aiUsageEvaluation.usageQuality === 'poor' ? 'Significantly reduce AI Integration & Originality score' : aiUsageEvaluation.usageQuality === 'excellent' ? 'Award high points for strategic AI integration' : 'Score based on quality of integration and understanding'}
Recommendations: ${aiUsageEvaluation.recommendations.join('; ')}`
      }
      
      urlAnalysisContext = mixedUrlAnalysis.shouldEvaluate 
        ? `\n\nURL ANALYSIS:\n${mixedUrlAnalysis.contentAnalysis}\n\nEVALUATION GUIDANCE:\n${mixedUrlAnalysis.evaluationGuidance}${aiTechEvaluationContext}`
        : `\n\nURL ANALYSIS:\n${mixedUrlAnalysis.contentAnalysis}\n\nEVALUATION GUIDANCE:\n${mixedUrlAnalysis.evaluationGuidance}${aiTechEvaluationContext}`
    } else {
      // For corporate tasks, add context about text-based evaluation and advanced AI assessment
      let aiEvaluationContext = ''
      if (aiUsageEvaluation.usageQuality !== 'undetected') {
        const qualityMap = {
          excellent: 'EXCELLENT AI Integration',
          good: 'GOOD AI Usage',
          acceptable: 'ACCEPTABLE AI Usage',
          poor: 'POOR AI Usage'
        }
        
        aiEvaluationContext = `\n\nADVANCED AI USAGE ASSESSMENT:
Quality: ${qualityMap[aiUsageEvaluation.usageQuality as keyof typeof qualityMap]} (${Math.round(aiUsageEvaluation.confidence * 100)}% confidence)
Analysis: ${aiUsageEvaluation.reasons.join('; ')}
Scoring Impact: ${aiUsageEvaluation.usageQuality === 'poor' ? 'Significantly reduce Authenticity & AI Ethics score' : aiUsageEvaluation.usageQuality === 'excellent' ? 'Award high points for strategic AI integration' : 'Score based on quality of integration'}
Recommendations: ${aiUsageEvaluation.recommendations.join('; ')}`
      }
      
      urlAnalysisContext = `\n\nEVALUATION GUIDANCE:\nThis is a corporate task that should be evaluated based on the text content provided in the submission fields. Focus on business acumen, strategic thinking, professionalism, and practical applicability rather than technical implementation.${aiEvaluationContext}`
    }
    
    // Encourage concise output and include task context
    const taskContext = `TASK CONTEXT:\n- Title: ${task?.title ?? ''}\n- Domain: ${task?.domain ?? ''}${task?.subdomain ? ` > ${task.subdomain}` : ''}\n- Deadline: ${task?.deadline ?? ''}\n- Description: ${(task?.description ?? '').slice(0, 500)}${task?.image_url ? `\n- Task Image URL: ${task.image_url}` : ''}`
    
    const concisePrompt = `${taskContext}${urlAnalysisContext}

${prompt}

PRODUCTION QUALITY CONSTRAINTS:
- Provide comprehensive yet concise evaluation (400-600 words)
- Use professional assessment language appropriate for industry standards
- Focus on actionable insights and specific technical/business feedback
- CRITICAL: NEVER exceed category maximums - all scores must be within bounds
- Evaluate AI usage quality rather than penalizing appropriate AI tool usage
- Apply fair, unbiased evaluation focused on merit and learning potential
- Provide constructive feedback that helps students improve professionally`

    // Use structured output to prevent parsing issues
    let parsed: { score: number; review: string; recommendation?: 'shortlist' | 'reject' | null }
    try {
      parsed = await generateStructuredReview(model, concisePrompt)
    } catch (structuredError) {
      console.warn(`[AI][${context}] Structured output failed, falling back to legacy parsing:`, structuredError)
      // Fallback to legacy parsing method
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: concisePrompt }] }],
        generationConfig: { 
          temperature: 0, // Ensure deterministic responses
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1000
        }
      })
      const text = result.response.text()
      parsed = await parseGeminiJsonResponse(text)
    }
    
    if (typeof parsed.score === 'number' && typeof parsed.review === 'string') {
      // Add AI recommendation banner and trim review to a safe maximum length for storage/display
      const recommendation = parsed.recommendation ?? getAiRecommendation(parsed.score) ?? 'reject'
      const banner = recommendation ? `> AI Recommendation: ${recommendation === 'shortlist' ? 'Accept' : 'Reject'}\n\n` : ''
      const withBanner = banner + parsed.review
      const MAX_REVIEW_CHARS = 4000
      const trimmedReview = withBanner.length > MAX_REVIEW_CHARS ? withBanner.slice(0, MAX_REVIEW_CHARS) + '\n\n…(trimmed)' : withBanner
      const { error: updateError } = await supabase.from('submissions').update({ 
        ai_score: parsed.score, 
        ai_review: trimmedReview,
        ai_recommendation: recommendation
      }).eq('id', submissionId)
      
      if (updateError) {
        console.error(`[AI][${context}] Database update failed:`, updateError)
        throw updateError
      }
      
      console.log(`[AI][${context}] AI review stored successfully`, { 
        submissionId, 
        score: parsed.score, 
        recommendation,
        reviewLength: trimmedReview.length
      })
      return
    }
    throw new Error('Invalid AI response structure')
  } catch (error) {
    console.error(`[AI][${context}] AI review failed; scheduling retry:`, error)
    const retryDelay = 60000
    setTimeout(async () => {
      try {
        await retryAIReview(submissionId, prompt, supabase)
      } catch (retryError) {
        console.error(`[AI][${context}] Retry failed:`, retryError)
        const { error: retryUpdateError } = await supabase.from('submissions').update({ 
          ai_score: 0, 
          ai_review: `AI review failed after retry. Error: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        }).eq('id', submissionId)
        
        if (retryUpdateError) {
          console.error(`[AI][${context}] Failed to update retry error:`, retryUpdateError)
        }
      }
    }, retryDelay)
    const { error: tempError } = await supabase.from('submissions').update({ 
      ai_score: 0, 
      ai_review: 'AI review temporarily unavailable; retry scheduled in 1 minute.'
    }).eq('id', submissionId)
    
    if (tempError) {
      console.error(`[AI][${context}] Failed to set temporary message:`, tempError)
    }
  }
}

const handleSubmissionSchema = z.object({
  taskId: z.coerce.number().int().positive(),
})

export async function handleSubmission(formData: FormData) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const parsed = handleSubmissionSchema.safeParse({ taskId: formData.get('taskId') })
  if (!parsed.success) throw new Error('Invalid submission payload')
  const taskId = parsed.data.taskId
  console.log('Processing submission for task ID:', taskId)
  
  // Debug: Log all form data keys
  console.log('Form data keys:', Array.from(formData.keys()))
  
  // Check if this task has custom submission fields
  const { data: submissionFields } = await supabase
    .from('submission_fields')
    .select('*')
    .eq('task_id', taskId)
    .order('display_order')

  console.log('Found submission fields:', submissionFields?.length || 0)

  let submissionUrl = ''
  const submissionData: Record<string, unknown> = {}
  
  if (submissionFields && submissionFields.length > 0) {
    // Process all custom submission fields
    submissionFields.forEach(field => {
      const fieldName = `field_${field.field_name}`
      console.log('Processing field:', field.field_name, 'type:', field.field_type, 'fieldName:', fieldName)
      
      let fieldValue: unknown = null
      
      switch (field.field_type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'url':
        case 'number':
          fieldValue = formData.get(fieldName)
          if (field.field_type === 'number' && fieldValue) {
            fieldValue = Number(fieldValue)
          }
          break
          
        case 'select':
          fieldValue = formData.get(fieldName)
          break
          
        case 'checkbox':
          // Handle multiple checkbox values
          const checkboxValues = formData.getAll(`${fieldName}[]`)
          console.log('Checkbox field processing:', fieldName, 'values:', checkboxValues)
          fieldValue = checkboxValues.length > 0 ? checkboxValues : formData.get(fieldName)
          break
          
        case 'file':
          const file = formData.get(fieldName) as File
          if (file && file.size > 0) {
            // Store file metadata (in a real app, you'd upload to storage)
            fieldValue = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            }
          }
          break
      }
      
      if (fieldValue !== null && fieldValue !== '') {
        submissionData[field.field_name] = {
          value: fieldValue,
          type: field.field_type,
          label: field.field_label
        }
        
        // Keep the first URL as the primary submission URL for backward compatibility
        if (field.field_type === 'url' && !submissionUrl) {
          submissionUrl = String(fieldValue)
        }
      }
    })
  } else {
    // Fallback to simple submission URL
    submissionUrl = String(formData.get('submissionUrl') || '')
    if (submissionUrl) {
      submissionData['submission_url'] = {
        value: submissionUrl,
        type: 'url',
        label: 'Submission URL'
      }
    }
    console.log('Using fallback submission URL:', submissionUrl)
  }

  console.log('Final submission URL:', submissionUrl)
  console.log('Submission data:', submissionData)

  // Insert submission with all field data
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({ 
      applicant_id: userId, 
      task_id: taskId, 
      submission_url: submissionUrl, 
      submission_data: submissionData,
      status: 'pending' 
    })
    .select('id')
    .single()

  if (error) throw error

  console.log('Submission created with ID:', submission.id)

  // Aggressive cache invalidation for immediate UI updates
  const { cache } = await import('@/lib/cache')
  const { revalidatePath } = await import('next/cache')
  
  // Invalidate user submissions cache
  cache.invalidatePattern(`user_submissions:${userId}`)
  cache.invalidatePattern('admin_submissions:')
  cache.invalidatePattern('analytics:')
  
  // Revalidate relevant pages
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/apply/task/${taskId}`)

  ;(async () => {
    await aiRateLimiter.execute(async () => {
      // Create a fresh supabase instance for the background process
      const backgroundSupabase = await createSupabaseServer()
      await performAIReview({ supabase: backgroundSupabase, submissionId: submission!.id, taskId, userId, submissionUrl: '', submissionData, context: 'new' })
    })
  })()

  return { ok: true, submissionId: submission.id }
}

async function retryAIReview(submissionId: number, prompt: string, supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  try {
    console.log(`[AI][retry] Retrying AI review for submission ${submissionId}`)
    
    const model = getGeminiModel('gemini-2.0-flash')
    
    // Use structured output to prevent parsing issues
    let parsed: { score: number; review: string; recommendation?: 'shortlist' | 'reject' | null }
    try {
      parsed = await generateStructuredReview(model, prompt)
    } catch (structuredError) {
      console.warn('[AI][retry] Structured output failed, falling back to legacy parsing:', structuredError)
      // Fallback to legacy parsing method
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0, // Ensure deterministic responses
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1000
        }
      })
      const responseText = result.response.text()
      console.log(`[AI][retry] Response received, length: ${responseText.length}`)
      const legacyParsed = await parseGeminiJsonResponse(responseText)
      // Add recommendation based on score for legacy parsing
      parsed = {
        ...legacyParsed,
        recommendation: getAiRecommendation(legacyParsed.score)
      }
    }
    
    if (parsed.score !== undefined && parsed.review) {
          const fallback = getAiRecommendation(parsed.score)
    const recommendation: 'shortlist' | 'reject' = (parsed.recommendation ?? (fallback ?? 'reject')) as 'shortlist' | 'reject'

    // Ensure recommendation is one of the valid values
    const validRecommendation: 'shortlist' | 'reject' = recommendation === 'shortlist' || recommendation === 'reject' ? recommendation : 'reject'
      const banner = `> AI Recommendation: ${validRecommendation === 'shortlist' ? 'Accept' : 'Reject'}\n\n`
      const withBanner = banner + parsed.review
      const MAX_REVIEW_CHARS = 4000
      const trimmedReview = withBanner.length > MAX_REVIEW_CHARS ? withBanner.slice(0, MAX_REVIEW_CHARS) + '\n\n…(trimmed)' : withBanner
      await supabase.from('submissions').update({
        ai_score: parsed.score,
        ai_review: trimmedReview,
        ai_recommendation: validRecommendation
      }).eq('id', submissionId)
      console.log(`[AI][retry] Completed successfully, score: ${parsed.score}, recommendation: ${validRecommendation}`)
    } else {
      throw new Error('Invalid response structure from AI model during retry')
    }
    
  } catch (error) {
    console.error(`[AI][retry] Failed for submission ${submissionId}:`, error)
    throw error // Re-throw to be handled by the caller
  }
}

export async function updateSubmissionStatus(submissionId: number, status: Status) {
  const supabase = await createSupabaseServer()
  await supabase.from('submissions').update({ status }).eq('id', submissionId)
  await logAdminActivity('status_change', 'submission', submissionId, { status })
  const { cache } = await import('@/lib/cache')
  cache.invalidatePattern('admin_submissions:')
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/dashboard')
  return { ok: true }
}

export async function bulkUpdateSubmissionStatus(submissionIds: number[], status: Status) {
  if (submissionIds.length === 0) return { ok: true, count: 0 }
  const supabase = await createSupabaseServer()
  const { error } = await supabase.from('submissions').update({ status }).in('id', submissionIds)
  if (error) throw error
  await logAdminActivity('bulk_status_change', 'submission', null, { status, submissionIds })
  const { cache } = await import('@/lib/cache')
  cache.invalidatePattern('admin_submissions:')
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/dashboard')
  return { ok: true, count: submissionIds.length }
}

export type ExportFilters = {
  domain?: string
  subdomain?: string
  year?: string
  status?: string
  /** 'applicant' = one row per person. Anything else = one row per submission. */
  group?: string
}

/**
 * Exports submissions as CSV.
 *
 * Previously this ignored every dashboard filter (it took no arguments at all),
 * and reported profiles.domain / profiles.subdomain — the applicant's legacy
 * single-value preference fields, which are frequently stale or null — rather
 * than the domain of the task actually submitted to. It also emitted one row
 * per submission, so anyone shortlisted in three subdomains appeared three
 * times with no way to tell it was one person.
 */
export async function exportShortlistedCSV(filters: ExportFilters = {}): Promise<string> {
  const supabase = await createSupabaseServer()

  const { data } = await supabase
    .from('submissions')
    .select(`
      id,
      applicant_id,
      ai_score,
      status,
      profiles!submissions_applicant_id_fkey(name, ra_number, phone_number, department, branch, year),
      tasks!submissions_task_id_fkey(domain, subdomain, title)
    `)
    .eq('status', filters.status || 'shortlisted')

  type Row = {
    id: number
    applicant_id: string
    ai_score: number | null
    status: string
    profiles: { name: string | null; ra_number: string | null; phone_number: number | null; department: string | null; branch: string | null; year: number | null } | null
    tasks: { domain: string; subdomain: string | null; title: string | null } | null
  }

  let rows = (data || []) as unknown as Row[]

  // Domain and subdomain come from the TASK, which is the thing that was
  // actually submitted to.
  if (filters.domain) rows = rows.filter((r) => (r.tasks?.domain ?? '') === filters.domain)
  if (filters.subdomain) rows = rows.filter((r) => (r.tasks?.subdomain ?? '') === filters.subdomain)
  if (filters.year) rows = rows.filter((r) => String(r.profiles?.year ?? '') === String(filters.year))

  // Email lives in auth.users, reachable through the admin-gated RPC.
  const emailById = new Map<string, string>()
  try {
    const { data: users } = await supabase.rpc('admin_list_users')
    for (const u of (users || []) as { id: string; email: string | null }[]) {
      if (u.email) emailById.set(u.id, u.email)
    }
  } catch (e) {
    console.warn('[export] could not resolve emails:', e)
  }

  const Papa = (await import('papaparse')).default

  if (filters.group === 'applicant') {
    // One row per person. Subdomains, tasks and scores are collapsed so a
    // three-submission applicant is a single line you can mail merge from.
    const byApplicant = new Map<string, Row[]>()
    for (const r of rows) {
      const key = r.applicant_id ?? `submission-${r.id}`
      if (!byApplicant.has(key)) byApplicant.set(key, [])
      byApplicant.get(key)!.push(r)
    }

    const grouped = [...byApplicant.entries()].map(([applicantId, subs]) => {
      const p = subs[0].profiles
      const uniq = (xs: (string | null | undefined)[]) =>
        [...new Set(xs.filter((x): x is string => !!x))].sort().join(', ')
      const scores = subs.map((s) => s.ai_score).filter((s): s is number => typeof s === 'number')
      return {
        name: p?.name ?? '',
        ranumber: p?.ra_number ?? '',
        email: emailById.get(applicantId) ?? '',
        phone: p?.phone_number ?? '',
        department: p?.department ?? '',
        branch: p?.branch ?? '',
        year: p?.year ?? '',
        domains: uniq(subs.map((s) => s.tasks?.domain)),
        subdomains: uniq(subs.map((s) => s.tasks?.subdomain)),
        tasks: uniq(subs.map((s) => s.tasks?.title)),
        submissions: subs.length,
        best_ai_score: scores.length ? Math.max(...scores) : '',
        status: subs[0].status,
      }
    })

    grouped.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    return Papa.unparse(grouped)
  }

  const flat = rows.map((r) => ({
    name: r.profiles?.name ?? '',
    ranumber: r.profiles?.ra_number ?? '',
    email: emailById.get(r.applicant_id) ?? '',
    phone: r.profiles?.phone_number ?? '',
    department: r.profiles?.department ?? '',
    branch: r.profiles?.branch ?? '',
    year: r.profiles?.year ?? '',
    domain: r.tasks?.domain ?? '',
    subdomain: r.tasks?.subdomain ?? '',
    task: r.tasks?.title ?? '',
    ai_score: r.ai_score ?? '',
    status: r.status ?? '',
  }))

  flat.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return Papa.unparse(flat)
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  domain: z.string().min(1),
  subdomain: z.string().min(1),
  deadline: z.string().min(1).transform((val) => {
    // Always ensure time is set to 23:59 (end of day) for consistency
    if (val && !val.includes('T')) {
      // Date-only input: set to end of day
      return `${val}T23:59:59.999Z`
    } else if (val && val.includes('T') && !val.includes('Z')) {
      // DateTime input without timezone: add UTC timezone
      return `${val}Z`
    }
    return val
  }),
  estimated_duration: z.string().optional().default(''),
  requirements: z.string().optional().default(''),
  deliverables: z.string().optional().default(''),
  image_url: z.string().url().optional().or(z.literal('')).transform(v => v || null),
  submissionFields: z.string().optional(),
})

export async function createTask(formData: FormData) {
  
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const parsed = createTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || '',
    domain: formData.get('domain'),
    subdomain: formData.get('subdomain') || '',
    deadline: formData.get('deadline') || '',
    estimated_duration: formData.get('estimated_duration') || '',
    requirements: formData.get('requirements') || '',
    deliverables: formData.get('deliverables') || '',
    image_url: formData.get('image_url') || '',
    submissionFields: formData.get('submissionFields') || undefined,
  })
  if (!parsed.success) throw new Error('Invalid task payload')
  const { title, description, domain, subdomain, deadline, estimated_duration: estimatedDuration, requirements, deliverables, image_url: imageUrl, submissionFields: submissionFieldsData } = parsed.data
  
  
  // Get submission fields from form data
  let submissionFields: Record<string, unknown>[] = []
  if (submissionFieldsData) {
    try {
      submissionFields = JSON.parse(String(submissionFieldsData))
    } catch (e) {
      console.error('Failed to parse submission fields:', e)
    }
  }

  // required fields covered by Zod

  // Check if a task with the same title and domain already exists
  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('title', title)
    .eq('domain', domain)
    .eq('subdomain', subdomain)
    .single()

  if (existingTask) {
    console.log('Task with same title and domain already exists:', existingTask.id)
    throw new Error('A task with this title and domain already exists')
  }

  // Create the task first
  // For now, only insert the columns that exist in the current schema

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      domain,
      subdomain,
      deadline,
      estimated_duration: estimatedDuration,
      requirements,
      deliverables,
      image_url: imageUrl || null
    })
    .select('id')
    .single()

  if (taskError) {
    console.error('Task creation error:', taskError)
    throw taskError
  }


  // Create submission fields if any
  if (submissionFields.length > 0) {
    const fieldsToInsert = submissionFields.map(field => ({
      task_id: task.id,
      field_name: field.field_name,
      field_type: field.field_type,
      field_label: field.field_label,
      field_description: field.field_description,
      is_required: field.is_required,
      field_options: field.field_options,
      validation_rules: field.validation_rules,
      display_order: field.display_order
    }))

    const { error: fieldsError } = await supabase
      .from('submission_fields')
      .insert(fieldsToInsert)

    if (fieldsError) {
      console.error('Failed to create submission fields:', fieldsError)
      // Don't fail the entire operation if fields fail
    } else {
    }
  }

  await logAdminActivity('create', 'task', task.id, { title, domain, subdomain })

  return { ok: true, taskId: task.id }
}

export async function updateSubmission(formData: FormData) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const submissionId = Number(formData.get('submissionId'))
  const taskId = Number(formData.get('taskId'))
  
  // Verify the submission belongs to the user
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('id', submissionId)
    .eq('applicant_id', userId)
    .eq('task_id', taskId)
    .single()

  if (!submission) {
    throw new Error('Submission not found or access denied')
  }

  // Check if deadline has passed
  const { data: task } = await supabase
    .from('tasks')
    .select('deadline')
    .eq('id', taskId)
    .single()

  if (task?.deadline && new Date(task.deadline) < new Date()) {
    throw new Error('Submission deadline has passed. You can no longer edit your submission.')
  }

  // Check if submission can be edited (not shortlisted or rejected)
  if (submission.status !== 'pending') {
    throw new Error('This submission cannot be edited as it has already been reviewed.')
  }

  // Get submission fields for this task
  const { data: submissionFields } = await supabase
    .from('submission_fields')
    .select('*')
    .eq('task_id', taskId)
    .order('display_order')

  let submissionUrl = ''
  const submissionData: Record<string, unknown> = {}

  if (submissionFields && submissionFields.length > 0) {
    // Process all custom submission fields
    submissionFields.forEach(field => {
      const fieldName = `field_${field.field_name}`
      console.log('Processing field:', field.field_name, 'type:', field.field_type)
      
      let fieldValue: unknown = null
      
      switch (field.field_type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'url':
        case 'number':
          fieldValue = formData.get(fieldName)
          if (field.field_type === 'number' && fieldValue) {
            fieldValue = Number(fieldValue)
          }
          break
          
        case 'select':
          fieldValue = formData.get(fieldName)
          break
          
        case 'checkbox':
          // Handle multiple checkbox values
          const checkboxValues = formData.getAll(`${fieldName}[]`)
          fieldValue = checkboxValues.length > 0 ? checkboxValues : formData.get(fieldName)
          break
          
        case 'file':
          const file2 = formData.get(fieldName) as File
          if (file2 && file2.size > 0) {
            // Store file metadata (in a real app, you'd upload to storage)
            fieldValue = {
              name: file2.name,
              size: file2.size,
              type: file2.type,
              lastModified: file2.lastModified
            }
          }
          break
      }
      
      if (fieldValue !== null && fieldValue !== '') {
        submissionData[field.field_name] = {
          value: fieldValue,
          type: field.field_type,
          label: field.field_label
        }
        
        // Keep the first URL as the primary submission URL for backward compatibility
        if (field.field_type === 'url' && !submissionUrl) {
          submissionUrl = String(fieldValue)
        }
      }
    })
  } else {
    // Fallback to simple submission URL
    submissionUrl = String(formData.get('submissionUrl') || '')
    if (submissionUrl) {
      submissionData['submission_url'] = {
        value: submissionUrl,
        type: 'url',
        label: 'Submission URL'
      }
    }
  }

  // Update the submission (let database triggers handle updated_at automatically)
  const { error } = await supabase
    .from('submissions')
    .update({ 
      submission_url: submissionUrl,
      submission_data: submissionData
    })
    .eq('id', submissionId)

  if (error) throw error

  // Aggressive cache invalidation for immediate UI updates
  const { cache, CacheKeys } = await import('@/lib/cache')
  const { revalidatePath } = await import('next/cache')
  
  // Invalidate specific submission cache
  cache.delete(CacheKeys.submission(submissionId))
  cache.invalidatePattern(`user_submissions:${userId}`)
  cache.invalidatePattern('admin_submissions:')
  cache.invalidatePattern('analytics:')
  
  // Revalidate relevant pages
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/dashboard/edit/${submissionId}`)

  // Trigger AI review for the updated submission
  console.log('Submission updated, triggering AI review for submission ID:', submissionId)
  
  ;(async () => {
    await aiRateLimiter.execute(async () => {
      // Create a fresh supabase instance for the background process
      const backgroundSupabase = await createSupabaseServer()
      await performAIReview({ supabase: backgroundSupabase, submissionId, taskId, userId, submissionUrl: '', submissionData, context: 'edit' })
    })
  })()

  return { ok: true }
}

export async function canSubmitToTask(taskId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) {
    return {
      canSubmit: false,
      canEdit: false,
      deadlinePassed: false,
      hasSubmitted: false,
      existingSubmissionId: undefined,
      deadline: undefined,
    }
  }

  // Get user profile to check if they can access this task
  const { data: profile } = await supabase
    .from('profiles')
    .select('domain, subdomain, year, is_admin, domains, subdomains')
    .eq('id', userId)
    .single()

  if (!profile) {
    return {
      canSubmit: false,
      canEdit: false,
      deadlinePassed: false,
      hasSubmitted: false,
      existingSubmissionId: undefined,
      deadline: undefined,
    }
  }

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('deadline, domain, subdomain')
    .eq('id', taskId)
    .single()

  if (!task) {
    return {
      canSubmit: false,
      canEdit: false,
      deadlinePassed: false,
      hasSubmitted: false,
      existingSubmissionId: undefined,
      deadline: undefined,
    }
  }

  // Check if user can access this task (admin can see all, others only see matching tasks)
  if (!profile.is_admin) {
    const domainsArray: string[] = Array.isArray((profile as unknown as { domains?: string[] }).domains) && (profile as unknown as { domains?: string[] }).domains!.length > 0
      ? (profile as unknown as { domains: string[] }).domains
      : [profile.domain].filter(Boolean) as string[]
    const subdomainsArray: string[] = Array.isArray((profile as unknown as { subdomains?: string[] }).subdomains) && (profile as unknown as { subdomains?: string[] }).subdomains!.length > 0
      ? (profile as unknown as { subdomains: string[] }).subdomains
      : [profile.subdomain].filter(Boolean) as string[]

    const canAccess = domainsArray.includes(task.domain) &&
                     subdomainsArray.includes(task.subdomain)

    if (!canAccess) {
      return {
        canSubmit: false,
        canEdit: false,
        deadlinePassed: false,
        hasSubmitted: false,
        existingSubmissionId: undefined,
        deadline: task.deadline
      }
    }
  }

  // Check if deadline has passed
  const deadlinePassed = task.deadline && new Date(task.deadline) < new Date()
  
  // Check if user has already submitted
  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('task_id', taskId)
    .eq('applicant_id', userId)
    .single()

  const hasSubmitted = !!existingSubmission
  const canEdit = hasSubmitted && existingSubmission?.status === 'pending' && !deadlinePassed

  return {
    canSubmit: !hasSubmitted && !deadlinePassed,
    canEdit,
    deadlinePassed,
    hasSubmitted,
    existingSubmissionId: existingSubmission?.id,
    deadline: task.deadline
  }
}

export async function deleteTask(taskId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw new Error('Failed to verify admin status')
  }

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const { data: taskToDelete } = await supabase
    .from('tasks')
    .select('title')
    .eq('id', taskId)
    .single()

  try {
    // First, delete all related data in the correct order to avoid foreign key constraints

    // 1. Delete submission field values (if any exist)
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id')
      .eq('task_id', taskId)

    if (submissions && submissions.length > 0) {
      const submissionIds = submissions.map(s => s.id)
      const { error: submissionFieldValuesError } = await supabase
        .from('submission_field_values')
        .delete()
        .in('submission_id', submissionIds)

      if (submissionFieldValuesError) {
        console.warn('Warning deleting submission field values:', submissionFieldValuesError)
      }
    }

    // 2. Delete submission fields for this task
    const { error: submissionFieldsError } = await supabase
      .from('submission_fields')
      .delete()
      .eq('task_id', taskId)

    if (submissionFieldsError) {
      console.warn('Warning deleting submission fields:', submissionFieldsError)
    }

    // 3. Delete submissions for this task
    const { error: submissionsError } = await supabase
      .from('submissions')
      .delete()
      .eq('task_id', taskId)

    if (submissionsError) {
      console.warn('Warning deleting submissions:', submissionsError)
    }

    // 4. Finally, delete the task itself using admin RPC function (bypasses RLS)
    const { error: rpcDeleteError } = await supabase
      .rpc('delete_task_admin', { task_id: taskId })
    
    // If RPC doesn't exist, try regular delete
    if (rpcDeleteError && rpcDeleteError.message.includes('function') && rpcDeleteError.message.includes('does not exist')) {
      const { error: regularDeleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (regularDeleteError) {
        throw regularDeleteError
      }
    } else if (rpcDeleteError) {
      throw rpcDeleteError
    }

    await logAdminActivity('delete', 'task', taskId, { title: taskToDelete?.title ?? null })

    return { ok: true }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    throw error
  }
}

async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return profile?.is_admin === true
}

export async function triggerAIReviewForSubmission(submissionId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data: row, error } = await supabase
    .from('submissions')
    .select('id, task_id, applicant_id, submission_data, submission_url')
    .eq('id', submissionId)
    .single()

  if (error || !row) throw new Error('Submission not found')
  
  console.log(`[AI][trigger] Retrieved submission data for ID ${submissionId}:`, {
    submissionData: row.submission_data,
    submissionUrl: row.submission_url,
    hasSubmissionData: !!row.submission_data,
    submissionDataKeys: row.submission_data ? Object.keys(row.submission_data) : []
  })
  
  // Allow submission owner or admin to trigger review
  const isAdmin = await isCurrentUserAdmin()
  if (row.applicant_id !== userId && !isAdmin) {
    throw new Error('Access denied')
  }

  // Fire-and-forget: schedule AI review with rate limiting
  setTimeout(async () => {
    try {
      await aiRateLimiter.execute(async () => {
        // Create a fresh supabase instance for the background process
        const backgroundSupabase = await createSupabaseServer()
        await performAIReview({
          supabase: backgroundSupabase,
          submissionId: row.id,
          taskId: row.task_id as number,
          userId: row.applicant_id as string,
          submissionUrl: row.submission_url || '',
          submissionData: row.submission_data as Record<string, unknown>,
          context: 'edit'
        })
      })
    } catch (e) {
      console.error('[AI][trigger] Background review failed:', e)
    }
  }, 0)

  return { ok: true }
}

export async function deleteSubmission(submissionId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  // Check if user is admin
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Get submission details for logging
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select(`
      id, 
      applicant_id, 
      task_id,
      profiles!submissions_applicant_id_fkey(name, ra_number),
      tasks!submissions_task_id_fkey(title)
    `)
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) {
    throw new Error('Submission not found')
  }

  // Handle the joined data types properly
  const profile = Array.isArray(submission.profiles) ? submission.profiles[0] : submission.profiles
  const task = Array.isArray(submission.tasks) ? submission.tasks[0] : submission.tasks

  console.log('Admin deleting submission:', {
    submissionId,
    applicantName: profile?.name,
    applicantRA: profile?.ra_number,
    taskTitle: task?.title
  })

  await logAdminActivity('delete', 'submission', submissionId, {
    applicantName: profile?.name ?? null,
    applicantRA: profile?.ra_number ?? null,
    taskTitle: task?.title ?? null,
  })

  // Delete the submission using admin function
  const { data: deleteResult, error: deleteError } = await supabase
    .rpc('delete_submission_admin', { submission_id: submissionId })

  if (deleteError) {
    console.error('Error deleting submission:', deleteError)
    throw new Error('Failed to delete submission')
  }

  if (!deleteResult?.success) {
    console.error('Delete function returned failure:', deleteResult)
    throw new Error('Failed to delete submission')
  }

  // Aggressive cache invalidation
  const { cache, CacheKeys } = await import('@/lib/cache')
  
  // Invalidate all possible cache entries
  cache.delete(CacheKeys.submission(submissionId))
  cache.invalidatePattern('admin_submissions:')
  cache.invalidatePattern(`user_submissions:${submission.applicant_id}`)
  cache.invalidatePattern('submission_fields:')
  cache.invalidatePattern('analytics:')
  
  // Also clear the entire cache to be safe
  cache.clear()

  console.log('Submission deleted successfully:', submissionId)
  return { ok: true }
}

// Clears a stuck or mistaken registration so the person lands back on
// /profile/setup and can redo it. Deletes only their profiles row and
// resets the onboarding flag — their login (auth.users: email, password)
// is never touched, so they don't need to sign up again, only re-fill the
// profile form. Enforced admin-only both here and inside the underlying
// Postgres function (admin_reset_registration), which raises if the
// caller isn't an admin.
export async function adminResetUserRegistration(targetUserId: string) {
  const supabase = await createSupabaseServer()
  const adminId = await getCurrentUserId()
  if (!adminId) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminId)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const { error } = await supabase.rpc('admin_reset_registration', {
    target_user_id: targetUserId,
  })

  if (error) {
    throw new Error(error.message)
  }

  await logAdminActivity('reset_registration', 'profile', targetUserId, {})

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/users')

  return { ok: true }
}


