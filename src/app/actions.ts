'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { getGeminiModel, parseGeminiJsonResponse, PROMPTS } from '@/lib/ai'
import { Octokit } from 'octokit'
import * as cheerio from 'cheerio'
import Papa from 'papaparse'

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
    const token = process.env.GITHUB_TOKEN
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
  context: ReviewContext
}) {
  const { supabase, submissionId, taskId, userId, submissionUrl, context } = opts

  console.log(`[AI][${context}] performAIReview called`, { submissionId, taskId, userId, url: submissionUrl })

  if (!submissionUrl || submissionUrl.trim().length === 0) {
    console.log(`[AI][${context}] No submission URL provided; writing skip message`)
    await supabase.from('submissions').update({
      ai_score: 0,
      ai_review: 'AI review skipped: No submission URL provided. Please add a valid URL and save again.'
    }).eq('id', submissionId)
    return
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, domain, subdomain, target_year, deadline')
    .eq('id', taskId)
    .single()
  const { data: profile } = await supabase.from('profiles').select('year').eq('id', userId).single()

  // Set in-progress message
  await supabase.from('submissions').update({ 
    ai_score: null, 
    ai_review: context === 'edit' ? 'AI review in progress... (submission was updated)' : 'AI review in progress...'
  }).eq('id', submissionId)

  // Build content and prompt
  let content = ''
  let prompt = ''
  let hasValidContent = false

  try {
    if (task?.domain === 'Technical' && /github\.com\//i.test(submissionUrl)) {
      content = await fetchGithubRepoFiles(submissionUrl)
      hasValidContent = !!(content && content.trim().length > 0)
      if (hasValidContent) {
        prompt = (profile?.year ?? 1) <= 1 ? PROMPTS.tech_first_year(content) : PROMPTS.tech_second_year(content)
      }
    } else {
      content = await scrapePageText(submissionUrl)
      hasValidContent = !!(content && content.trim().length > 0)
      if (hasValidContent) {
        prompt = task?.domain === 'Corporate' ? PROMPTS.corporate(content) : ((profile?.year ?? 1) <= 1 ? PROMPTS.tech_first_year(content) : PROMPTS.tech_second_year(content))
      }
    }
  } catch (e) {
    console.error(`[AI][${context}] Content fetch failed:`, e)
  }

  if (!hasValidContent || !prompt.trim()) {
    console.log(`[AI][${context}] No valid content/prompt; writing skip message`)
    await supabase.from('submissions').update({
      ai_score: 0,
      ai_review: 'AI review skipped: No valid content to analyze. Ensure the URL is public and has readable content.'
    }).eq('id', submissionId)
    return
  }

  try {
    console.log(`[AI][${context}] Calling model for submission ${submissionId}`)
    const model = getGeminiModel('gemini-2.0-flash')
    // Encourage concise output and include task context
    const taskContext = `TASK CONTEXT:\n- Title: ${task?.title ?? ''}\n- Domain: ${task?.domain ?? ''}${task?.subdomain ? ` > ${task.subdomain}` : ''}\n- Target Year: ${task?.target_year ?? ''}\n- Deadline: ${task?.deadline ?? ''}\n- Description: ${(task?.description ?? '').slice(0, 500)}`
    const concisePrompt = `${taskContext}

${prompt}

CONSTRAINTS:
- Keep it concise (roughly 300-500 words)
- Use clear headings and bullet points
- Avoid verbose introductions; focus on findings and recommendations`

    // Cap output tokens for efficiency
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: concisePrompt }] }],
      generationConfig: { maxOutputTokens: 800 }
    })
    const text = result.response.text()
    let parsed = await parseGeminiJsonResponse(text)
    if (parsed.score === 0 && parsed.review.includes('AI Review Error')) {
      console.warn(`[AI][${context}] First parse produced error; retrying with strict JSON prompt`)
      const strictPrompt = `${concisePrompt}\n\nIMPORTANT: Respond with ONLY a valid JSON object containing exactly these fields:\n{"score": <integer 0-1000>, "review": "<markdown text>"}\nDo not include code fences or any extra text.`
      const retry = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: strictPrompt }] }],
        generationConfig: { maxOutputTokens: 800 }
      })
      parsed = await parseGeminiJsonResponse(retry.response.text())
    }
    if (typeof parsed.score === 'number' && typeof parsed.review === 'string') {
      // Add AI recommendation banner and trim review to a safe maximum length for storage/display
      const recommendation = getAiRecommendation(parsed.score)
      const banner = recommendation ? `> AI Recommendation: ${recommendation === 'shortlist' ? 'Accept' : 'Reject'}\n\n` : ''
      const withBanner = banner + parsed.review
      const MAX_REVIEW_CHARS = 4000
      const trimmedReview = withBanner.length > MAX_REVIEW_CHARS ? withBanner.slice(0, MAX_REVIEW_CHARS) + '\n\n…(trimmed)' : withBanner
      await supabase.from('submissions').update({ ai_score: parsed.score, ai_review: trimmedReview }).eq('id', submissionId)
      console.log(`[AI][${context}] AI review stored`, { submissionId, score: parsed.score, recommendation })
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
        await supabase.from('submissions').update({ 
          ai_score: 0, 
          ai_review: `AI review failed after retry. Error: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`
        }).eq('id', submissionId)
      }
    }, retryDelay)
    await supabase.from('submissions').update({ 
      ai_score: 0, 
      ai_review: 'AI review temporarily unavailable; retry scheduled in 1 minute.'
    }).eq('id', submissionId)
  }
}

export async function handleSubmission(formData: FormData) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const taskId = Number(formData.get('taskId'))
  console.log('Processing submission for task ID:', taskId)
  
  // Check if this task has custom submission fields
  const { data: submissionFields } = await supabase
    .from('submission_fields')
    .select('*')
    .eq('task_id', taskId)
    .order('display_order')

  console.log('Found submission fields:', submissionFields?.length || 0)
  
  let submissionUrl = ''
  
  if (submissionFields && submissionFields.length > 0) {
    // Process custom submission fields - for now, just collect URLs
    submissionFields.forEach(field => {
      const fieldName = `field_${field.field_name}`
      console.log('Processing field:', field.field_name, 'type:', field.field_type)
      
      if (field.field_type === 'url') {
        const value = formData.get(fieldName)
        console.log('URL field value:', value)
        if (value && typeof value === 'string') {
          submissionUrl = value
        }
      }
    })
  } else {
    // Fallback to simple submission URL
    submissionUrl = String(formData.get('submissionUrl') || '')
    console.log('Using fallback submission URL:', submissionUrl)
  }

  console.log('Final submission URL:', submissionUrl)

  // For now, use the current schema with submission_url
  // TODO: Run migration to add submission_data column
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({ 
      applicant_id: userId, 
      task_id: taskId, 
      submission_url: submissionUrl, 
      status: 'pending' 
    })
    .select('id')
    .single()

  if (error) throw error

  console.log('Submission created with ID:', submission.id)

  ;(async () => {
    await performAIReview({ supabase, submissionId: submission!.id, taskId, userId, submissionUrl, context: 'new' })
  })()

  return { ok: true }
}

async function retryAIReview(submissionId: number, prompt: string, supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  try {
    console.log(`[AI][retry] Retrying AI review for submission ${submissionId}`)
    
    const model = getGeminiModel('gemini-2.0-flash')
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 800 }
    })
    const responseText = result.response.text()
    
    console.log(`[AI][retry] Response received, length: ${responseText.length}`)
    
    // Parse the response
    let parsed = await parseGeminiJsonResponse(responseText)
    if (parsed.score === 0 && parsed.review.includes('AI Review Error')) {
      console.warn('[AI][retry] First parse produced error; retrying with strict JSON prompt')
      const strictPrompt = `${prompt}\n\nIMPORTANT: Respond with ONLY a valid JSON object containing exactly these fields:\n{"score": <integer 0-1000>, "review": "<markdown text>"}\nDo not include code fences or any extra text.`
      const retryStrict = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: strictPrompt }] }],
        generationConfig: { maxOutputTokens: 800 }
      })
      parsed = await parseGeminiJsonResponse(retryStrict.response.text())
    }
    
    if (parsed.score !== undefined && parsed.review) {
      const recommendation = getAiRecommendation(parsed.score)
      const banner = recommendation ? `> AI Recommendation: ${recommendation === 'shortlist' ? 'Accept' : 'Reject'}\n\n` : ''
      const withBanner = banner + parsed.review
      const MAX_REVIEW_CHARS = 4000
      const trimmedReview = withBanner.length > MAX_REVIEW_CHARS ? withBanner.slice(0, MAX_REVIEW_CHARS) + '\n\n…(trimmed)' : withBanner
      await supabase.from('submissions').update({ 
        ai_score: parsed.score, 
        ai_review: trimmedReview 
      }).eq('id', submissionId)
      console.log(`[AI][retry] Completed successfully, score: ${parsed.score}, recommendation: ${recommendation}`)
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
  const csv = Papa.unparse(rows)
  return csv
}

export async function createTask(formData: FormData) {
  const submissionId = formData.get('submissionId')
  const timestamp = formData.get('timestamp')
  console.log('createTask action called with submission ID:', submissionId, 'at timestamp:', timestamp)
  
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const title = String(formData.get('title'))
  const description = String(formData.get('description') || '')
  const domain = String(formData.get('domain'))
  const subdomain = String(formData.get('subdomain') || '')
  const targetYear = Number(formData.get('target_year'))
  const deadline = String(formData.get('deadline') || '')
  
  console.log('Task data to create:', { title, domain, subdomain, targetYear, deadline })
  
  // Get submission fields from form data
  const submissionFieldsData = formData.get('submissionFields')
  let submissionFields: Record<string, unknown>[] = []
  if (submissionFieldsData) {
    try {
      submissionFields = JSON.parse(String(submissionFieldsData))
    } catch (e) {
      console.error('Failed to parse submission fields:', e)
    }
  }

  if (!title || !domain || !subdomain || !targetYear || !deadline) {
    throw new Error('Missing required fields')
  }

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
      deadline
      // requirements, deliverables, created_by - these columns don't exist yet
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
  
  if (submissionFields && submissionFields.length > 0) {
    // Process custom submission fields - for now, just collect URLs
    submissionFields.forEach(field => {
      if (field.field_type === 'url') {
        const fieldName = `field_${field.field_name}`
        const value = formData.get(fieldName)
        if (value && typeof value === 'string') {
          submissionUrl = value
        }
      }
    })
  } else {
    // Fallback to simple submission URL
    submissionUrl = String(formData.get('submissionUrl') || '')
  }

  // Update the submission
  const { error } = await supabase
    .from('submissions')
    .update({ 
      submission_url: submissionUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  if (error) throw error

  // Trigger AI review for the updated submission
  console.log('Submission updated, triggering AI review for submission ID:', submissionId)
  
  ;(async () => {
    await performAIReview({ supabase, submissionId, taskId, userId, submissionUrl, context: 'edit' })
  })()

  return { ok: true }
}

export async function canSubmitToTask(taskId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('deadline')
    .eq('id', taskId)
    .single()

  if (!task) {
    throw new Error('Task not found')
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

  // Delete the task
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
  return { ok: true }
}

export async function triggerAIReviewForSubmission(submissionId: number) {
  const supabase = await createSupabaseServer()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')

  const { data: row, error } = await supabase
    .from('submissions')
    .select('id, task_id, applicant_id, submission_url')
    .eq('id', submissionId)
    .single()

  if (error || !row) throw new Error('Submission not found')
  if (row.applicant_id !== userId) {
    // Allow self-trigger only; admins could be supported later
    throw new Error('Access denied')
  }

  // Fire-and-forget: schedule AI review without blocking the caller
  setTimeout(async () => {
    try {
      await performAIReview({
        supabase,
        submissionId: row.id,
        taskId: row.task_id as number,
        userId: row.applicant_id as string,
        submissionUrl: row.submission_url || '',
        context: 'edit'
      })
    } catch (e) {
      console.error('[AI][trigger] Background review failed:', e)
    }
  }, 0)

  return { ok: true }
}


