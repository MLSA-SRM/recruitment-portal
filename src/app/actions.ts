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
  if (score >= 800) return 'shortlist'
  if (score <= 400) return 'reject'
  return null
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

  // Basic URL validation - only check for completely empty or malformed URLs
  const urlsToValidate: string[] = []
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

  const urlValidation = validateSubmissionUrls(urlsToValidate)
  if (!urlValidation.isValid && urlValidation.isPlaceholder) {
    console.log(`[AI][${context}] Invalid URLs detected:`, urlValidation.reason)
    
    const { error: invalidUrlError } = await supabase.from('submissions').update({
      ai_score: 0, // Score 0 for completely invalid URLs
      ai_review: `**AI Review - Invalid Submission**

## Summary
This submission contains invalid or malformed URLs (${urlValidation.reason}) and cannot be properly evaluated.

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Task Compliance & Requirements | 0/300 | Invalid submission format |
| Code Quality & Architecture | 0/250 | No valid content to evaluate |
| Functionality & Correctness | 0/200 | No valid content to evaluate |
| Technical Implementation | 0/150 | No valid content to evaluate |
| Documentation & Deployment | 0/100 | No valid content to evaluate |

## Critical Issues
- **Invalid URLs**: Submission contains malformed or empty URLs
- **Cannot Evaluate**: Unable to access or analyze the submission content

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

  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, domain, subdomain, target_year, deadline, image_url')
    .eq('id', taskId)
    .single()
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
    if (submissionContent.length > 1) { // More than just the header
      hasValidContent = true
      console.log(`[AI][${context}] Valid content found from submission fields: ${submissionContent.length - 1} fields`)
    } else {
      console.log(`[AI][${context}] No valid content from submission fields: ${submissionContent.length} items`)
    }
    
    content = submissionContent.join('\n\n')
    
    // Enhanced fake submission detection combining URL and content analysis
    const fakeDetection = detectFakeSubmission(urlsToValidate, content)
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
          ai_recommendation: 'neutral'
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
    // Encourage concise output and include task context
    const taskContext = `TASK CONTEXT:\n- Title: ${task?.title ?? ''}\n- Domain: ${task?.domain ?? ''}${task?.subdomain ? ` > ${task.subdomain}` : ''}\n- Target Year: ${task?.target_year ?? ''}\n- Deadline: ${task?.deadline ?? ''}\n- Description: ${(task?.description ?? '').slice(0, 500)}${task?.image_url ? `\n- Task Image URL: ${task.image_url}` : ''}`
    const concisePrompt = `${taskContext}

${prompt}

CONSTRAINTS:
- Keep it concise (roughly 300-500 words)
- Use clear headings and bullet points
- Avoid verbose introductions; focus on findings and recommendations`

    // Use structured output to prevent parsing issues
    let parsed: { score: number; review: string; recommendation?: 'shortlist' | 'reject' | 'neutral' | null }
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
      const recommendation = parsed.recommendation ?? getAiRecommendation(parsed.score) ?? 'neutral'
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

  ;(async () => {
    await aiRateLimiter.execute(async () => {
      // Create a fresh supabase instance for the background process
      const backgroundSupabase = await createSupabaseServer()
      await performAIReview({ supabase: backgroundSupabase, submissionId: submission!.id, taskId, userId, submissionUrl: '', submissionData, context: 'new' })
    })
  })()

  return { ok: true }
}

async function retryAIReview(submissionId: number, prompt: string, supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  try {
    console.log(`[AI][retry] Retrying AI review for submission ${submissionId}`)
    
    const model = getGeminiModel('gemini-2.0-flash')
    
    // Use structured output to prevent parsing issues
    let parsed: { score: number; review: string; recommendation?: 'shortlist' | 'reject' | 'neutral' | null }
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
    const recommendation: 'shortlist' | 'reject' | 'neutral' = (parsed.recommendation ?? (fallback ?? 'neutral')) as 'shortlist' | 'reject' | 'neutral'

    // Ensure recommendation is one of the valid values
    const validRecommendation: 'shortlist' | 'reject' | 'neutral' = recommendation === 'shortlist' || recommendation === 'reject' ? recommendation : 'neutral'
      const banner = validRecommendation !== 'neutral' ? `> AI Recommendation: ${validRecommendation === 'shortlist' ? 'Accept' : 'Reject'}\n\n` : ''
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
  return { ok: true }
}

export async function exportShortlistedCSV(): Promise<string> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('submissions')
    .select('ai_score, status, profiles(name, ra_number, phone_number, department, branch, year, domain, subdomain), tasks(domain, subdomain)')
    .eq('status', 'shortlisted')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data || []).map((row: any) => ({
    name: row.profiles?.name ?? '',
    ranumber: row.profiles?.ra_number ?? '',
    phone: row.profiles?.phone_number ?? '',
    department: row.profiles?.department ?? '',
    branch: row.profiles?.branch ?? '',
    year: row.profiles?.year ?? '',
    domain: row.profiles?.domain ?? '',
    subdomain: row.profiles?.subdomain ?? '',
    ai_score: row.ai_score ?? '',
    status: row.status ?? ''
  }))
  
  // Use dynamic import to avoid server-side execution issues
  const Papa = (await import('papaparse')).default
  const csv = Papa.unparse(rows)
  return csv
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  domain: z.string().min(1),
  subdomain: z.string().min(1),
  target_year: z.coerce.number().int().positive(),
  deadline: z.string().min(1).transform((val) => {
    // If it's a date-only input, set time to 23:59 (end of day)
    if (val && !val.includes('T')) {
      return `${val}T23:59`
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
  const submissionId = formData.get('submissionId')
  const timestamp = formData.get('timestamp')
  console.log('createTask action called with submission ID:', submissionId, 'at timestamp:', timestamp)
  
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const parsed = createTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || '',
    domain: formData.get('domain'),
    subdomain: formData.get('subdomain') || '',
    target_year: formData.get('target_year'),
    deadline: formData.get('deadline') || '',
    estimated_duration: formData.get('estimated_duration') || '',
    requirements: formData.get('requirements') || '',
    deliverables: formData.get('deliverables') || '',
    image_url: formData.get('image_url') || '',
    submissionFields: formData.get('submissionFields') || undefined,
  })
  if (!parsed.success) throw new Error('Invalid task payload')
  const { title, description, domain, subdomain, target_year: targetYear, deadline, estimated_duration: estimatedDuration, requirements, deliverables, image_url: imageUrl, submissionFields: submissionFieldsData } = parsed.data
  
  console.log('Task data to create:', { title, domain, subdomain, targetYear, deadline })
  
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
  console.log('Inserting task into database...')
  // For now, only insert the columns that exist in the current schema
  // TODO: Run migration to add requirements, deliverables, and created_by columns
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      domain,
      subdomain,
      target_year: targetYear,
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

  console.log('Task created with ID:', task.id)

  // Create submission fields if any
  if (submissionFields.length > 0) {
    console.log('Creating submission fields...')
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
      console.log('Submission fields created successfully')
    }
  }

  console.log('createTask action completed successfully')
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

  // Update the submission
  const { error } = await supabase
    .from('submissions')
    .update({ 
      submission_url: submissionUrl,
      submission_data: submissionData,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  if (error) throw error

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
    .select('deadline, domain, subdomain, target_year')
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
                     subdomainsArray.includes(task.subdomain) &&
                     task.target_year === profile.year

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  try {
    // First, delete all related data in the correct order to avoid foreign key constraints
    
    // 1. Delete submission field values (if any exist)
    // First get all submission IDs for this task
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

    // 4. Finally, delete the task itself
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (taskError) {
      console.error('Error deleting task:', taskError)
      throw taskError
    }

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


