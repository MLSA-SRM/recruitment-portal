import { GoogleGenerativeAI, GenerativeModel, Schema, SchemaType } from '@google/generative-ai'

export type ReviewResult = {
  score: number
  review: string
  recommendation: 'shortlist' | 'reject' | 'neutral'
}

/**
 * Defines the structured JSON schema the AI model must follow for its response.
 * This ensures consistent, parseable output.
 */
const REVIEW_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.INTEGER,
      description: 'A score from 0 to 1000, reflecting the overall quality of the submission.',
    },
    review: {
      type: SchemaType.STRING,
      description: 'A detailed, constructive review formatted in Markdown.',
    },
    recommendation: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['shortlist', 'reject', 'neutral'],
      description: 'A clear recommendation: "shortlist" for strong candidates, "reject" for weak ones, or "neutral" if uncertain.',
    },
  },
  required: ['score', 'review', 'recommendation'],
}

/**
 * System-level instructions that define the AI's persona, core rules, and output format.
 * This is prepended to all task-specific prompts for consistency.
 */
const SYSTEM_INSTRUCTION = `
<persona>
You are an expert, unbiased, and constructive reviewer for the Microsoft Student Accelerator (MSA) program. Your goal is to provide fair, insightful, and actionable feedback to student applicants.
</persona>

<rules>
1.  **Content-First Evaluation:** Your primary focus is the substance of the work provided in legitimate URLs. Do not penalize a submission for including some invalid or placeholder URLs if at least one URL contains genuine work.
2.  **Flexible URL Handling:** Evaluate the submission based on the content found in working, legitimate URLs. Ignore gibberish URLs (e.g., 'asdfghjkl.com') or placeholder domains if other valid links are present.
3.  **Zero-Score Condition:** Only assign a score of 0-100 if ALL provided URLs are invalid AND no other content (like a text description) demonstrates any effort.
4.  **CRITICAL TASK COMPLIANCE:** If a submission does not address the specific task requirements (e.g., submitting a portfolio when asked to clone a website), assign 0 points for the task compliance category, regardless of technical quality.
5.  **Tone:** Maintain a professional, encouraging, and constructive tone appropriate for students who are learning.
</rules>

<output_format>
You MUST respond with a single, valid JSON object that adheres to the following schema. Do not include any text, markdown formatting, or explanations outside of the JSON object.

Schema: ${JSON.stringify(REVIEW_RESPONSE_SCHEMA, null, 2)}
</output_format>
`

/**
 * Custom error for failures during AI response generation or parsing.
 * This allows for more specific error handling in calling functions.
 */
export class AIResponseError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message)
    this.name = 'AIResponseError'
  }
}

export type PromptType = 'tech_first_year' | 'tech_second_year' | 'corporate'

interface PromptContext {
  codeBundle?: string
  taskType?: string
  textContent?: string
}

/**
 * Factory class for creating tailored prompts.
 * This centralizes prompt logic and makes it easy to manage different review types.
 */
export class PromptFactory {
  private static getTaskSpecificGuidelines(taskType?: string, yearLevel?: string): string {
    if (!taskType) return ''

    const guidelines: Record<string, Record<string, string>> = {
      'AI/ML': {
        first_year: `
  **AI/ML Task Evaluation (1st Year):**
  - **Model Implementation:** Look for basic understanding of ML concepts (train/test split, basic algorithms)
  - **Data Handling:** Check for proper data loading and basic preprocessing
  - **Documentation:** Expect clear explanation of problem statement and approach
  - **Results:** Look for basic evaluation metrics and interpretation
  - **Learning Evidence:** Reward attempts at understanding model performance, even if basic
  - **Bonus Points:** Any attempt at visualization, cross-validation, or model comparison`,

        second_year: `
  **AI/ML Task Evaluation (2nd Year):**
  - **Model Sophistication:** Expect more advanced algorithms, hyperparameter tuning, ensemble methods
  - **Data Engineering:** Look for proper data preprocessing, feature engineering, handling missing data
  - **Evaluation:** Expect comprehensive evaluation with multiple metrics, confusion matrices
  - **Code Quality:** Look for modular code, proper error handling, configuration management
  - **Documentation:** Expect detailed methodology, results analysis, and conclusions
  - **Advanced Features:** Bonus for model deployment, API integration, or real-world application`
      },

      'Web Development': {
        first_year: `
  **Web Development Task Evaluation (1st Year):**
  - **Basic Structure:** Check for proper HTML structure, CSS styling, and basic JavaScript functionality
  - **Responsive Design:** Look for attempts at mobile-friendly design (even if basic)
  - **Code Organization:** Check for logical file structure and basic separation of concerns
  - **Functionality:** Verify all required sections (About, Projects, Contact) work properly
  - **Documentation:** Expect clear README with setup instructions
  - **Learning Evidence:** Reward attempts at modern practices, even if imperfect`,

        second_year: `
  **Web Development Task Evaluation (2nd Year):**
  - **Framework Usage:** Expect modern framework usage (React, Vue, Next.js) with proper patterns
  - **Architecture:** Look for component-based architecture, state management, routing
  - **Performance:** Check for optimization techniques, lazy loading, code splitting
  - **Deployment:** Expect proper deployment setup with CI/CD considerations
  - **Code Quality:** Look for TypeScript usage, testing, linting, proper error handling
  - **Advanced Features:** Bonus for authentication, API integration, or advanced UI patterns`
      },

      'Computer Vision': {
        first_year: `
  **Computer Vision Task Evaluation (1st Year):**
  - **Basic Implementation:** Look for simple image classification or basic CV operations
  - **Data Understanding:** Check for understanding of image data and basic preprocessing
  - **Model Choice:** Expect appropriate model selection for the task complexity
  - **Documentation:** Look for clear explanation of approach and results
  - **Learning Evidence:** Reward attempts at understanding model performance and limitations`,

        second_year: `
  **Computer Vision Task Evaluation (2nd Year):**
  - **Advanced Models:** Expect sophisticated architectures (CNNs, transfer learning, custom models)
  - **Data Pipeline:** Look for proper data augmentation, preprocessing, and validation
  - **Evaluation:** Expect comprehensive evaluation with proper metrics and visualization
  - **Code Quality:** Look for modular code, proper configuration, and error handling
  - **Documentation:** Expect detailed methodology, results analysis, and technical insights
  - **Advanced Features:** Bonus for model optimization, deployment, or real-time inference`
      },

      'Backend Development': {
        first_year: `
  **Backend Development Task Evaluation (1st Year):**
  - **Basic CRUD:** Check for proper implementation of Create, Read, Update, Delete operations
  - **Database Design:** Look for basic database schema and relationships
  - **API Design:** Check for RESTful API structure and proper HTTP methods
  - **Documentation:** Expect clear API documentation and setup instructions
  - **Learning Evidence:** Reward attempts at error handling and basic security practices`,

        second_year: `
  **Backend Development Task Evaluation (2nd Year):**
  - **Advanced CRUD:** Expect sophisticated data operations, filtering, pagination, search
  - **Database Optimization:** Look for proper indexing, query optimization, and data modeling
  - **Authentication:** Expect proper authentication and authorization implementation
  - **API Design:** Look for advanced features like rate limiting, validation, versioning
  - **Deployment:** Expect proper deployment setup with environment management
  - **Advanced Features:** Bonus for microservices, caching, monitoring, or external API integration`
      }
    }

    const taskGuidelines = guidelines[taskType]
    if (!taskGuidelines) return ''

    return taskGuidelines[yearLevel || 'first_year'] || taskGuidelines.first_year
  }

  private static PROMPT_TEMPLATES: Record<PromptType, (context: PromptContext) => string> = {
    tech_first_year: ({ codeBundle, taskType }) => `
<task>
You are reviewing a technical task from a FIRST-YEAR student. Be mindful that they are beginners.
- **Priority:** Focus on fundamental understanding, effort, and learning potential.
- **Frameworks:** Do not penalize for the absence of frameworks (like React, etc.). Reward well-structured vanilla solutions.
- **CRITICAL TASK COMPLIANCE RULE:** If the submission does not address the specific task requirements (e.g., submitting a portfolio when asked to clone a website, or submitting a calculator when asked to build a game), assign 0 points for Fundamentals & Logic. Only give points if the submission actually attempts to solve the specified problem.
- **Originality:** Start originality at 100 and only deduct if there is clear evidence of plagiarism without understanding.
</task>

<evaluation_criteria>
Provide a score from 0-1000 and a concise markdown review using this exact table structure:
# Code Review - <Short Title>
## Summary
- 2-3 sentences on overall quality and effort.
## Score Breakdown
| Area | Points | Justification |
| --- | --- | --- |
| Fundamentals & Logic | xx/300 | Correctness of approach, problem understanding. 0 points if completely irrelevant (e.g., portfolio instead of website clone). |
| Functionality | xx/250 | Whether the submission meets core requirements. |
| Code Quality | xx/150 | Readability, structure, and organization. |
| Learning & Reflection | xx/200 | Evidence of learning in README, comments, etc. |
| Originality | xx/100 | Signs of authentic work vs. copy-paste. |
## Highlights
- 3-5 positive points.
## Areas for Growth
- 3-5 constructive improvement areas.

**IMPORTANT SCORING RULES:**
- Each category score MUST NOT exceed its maximum (e.g., Fundamentals & Logic cannot exceed 300 points)
- The total score should be the sum of all category scores
- If a category exceeds its maximum, the review will be rejected
- **TASK COMPLIANCE EXAMPLES:**
  - 0 points: Portfolio submitted when asked to clone a website
  - 0 points: Calculator submitted when asked to build a game
  - 0 points: Any submission that doesn't address the specific task requirements
  - 1-300 points: Only if the submission actually attempts to solve the specified problem
${this.getTaskSpecificGuidelines(taskType, 'first_year')}
</evaluation_criteria>

<submission_content>
${codeBundle}
</submission_content>
`,

    tech_second_year: ({ codeBundle, taskType }) => `
<task>
You are reviewing a technical task from a SECOND-YEAR student. Expect a higher level of proficiency.
- **Priority:** Focus on task compliance, code architecture, and technical best practices.
- **Requirements:** The submission must correctly solve the assigned problem. 
- **CRITICAL TASK COMPLIANCE RULE:** If the submission does not address the specific task requirements (e.g., submitting a portfolio when asked to clone a website, or submitting a calculator when asked to build a game), assign 0 points for Task Compliance. Only give points for Task Compliance if the submission actually attempts to solve the specified problem.
- **Tooling:** Expect appropriate use of tools, frameworks, and patterns for the task.
</task>

<evaluation_criteria>
Provide a score from 0-1000 and a concise markdown review using this exact table structure:
# Code Review - <Short Title>
## Summary
- 2-3 sentences on technical proficiency and task completion.
## Score Breakdown
| Area | Points | Justification |
| --- | --- | --- |
| Task Compliance | xx/300 | Does it solve the specified problem? 0 points if completely irrelevant (e.g., portfolio instead of website clone). |
| Code & Architecture | xx/250 | Structure, maintainability, design patterns. |
| Functionality & Correctness | xx/200 | Works as expected, handles basic edge cases. |
| Technical Implementation | xx/150 | Appropriate use of tools and best practices. |
| Documentation | xx/100 | Clarity of README and setup instructions. |
## Highlights
- 3-5 technical strengths.
## Critical Issues
- 3-5 major problems needing attention.
## Recommendations
- 4-6 concrete next steps to improve.

**IMPORTANT SCORING RULES:**
- Each category score MUST NOT exceed its maximum (e.g., Technical Implementation cannot exceed 150 points)
- The total score should be the sum of all category scores
- If a category exceeds its maximum, the review will be rejected
- **TASK COMPLIANCE EXAMPLES:**
  - 0 points: Portfolio submitted when asked to clone a website
  - 0 points: Calculator submitted when asked to build a game
  - 0 points: Any submission that doesn't address the specific task requirements
  - 1-300 points: Only if the submission actually attempts to solve the specified problem
${this.getTaskSpecificGuidelines(taskType, 'second_year')}
</evaluation_criteria>

<submission_content>
${codeBundle}
</submission_content>
`,

    corporate: ({ textContent }) => `
<task>
You are reviewing a CORPORATE recruitment task (e.g., proposal, email, plan).
- **Priority:** Evaluate based on real-world business suitability, strategic thinking, and professionalism.
- **AI-Generated Content:** Be critical of generic, AI-generated content that lacks personalization or strategic insight. Deduct points for content that is clearly unedited AI output, but do not assign zero unless it's completely irrelevant.
- **Originality:** Start originality at 50 and deduct for plagiarism or unadapted AI content.
</task>

<evaluation_criteria>
Provide a score from 0-1000 and a concise markdown review using this exact table structure:
# Proposal Review - <Short Title>
## Summary
- 2-3 sentences on feasibility, clarity, and potential impact.
## Score Breakdown
| Area | Points | Justification |
| --- | --- | --- |
| Feasibility & Strategy | xx/400 | Is the proposal realistic, actionable, and well-aligned? |
| Clarity & Structure | xx/200 | Logical flow, clear objectives, and professionalism. |
| Persuasion & Tone | xx/200 | Is the tone appropriate and the argument compelling? |
| Creativity & Insight | xx/150 | Does it offer unique value or fresh perspectives? |
| Originality | xx/50 | Evidence of authentic thought vs. templates/AI. |
## Strengths
- 3-5 key positive aspects.
## Areas for Improvement
- 3-5 actionable recommendations.

**IMPORTANT SCORING RULES:**
- Each category score MUST NOT exceed its maximum (e.g., Feasibility & Strategy cannot exceed 400 points)
- The total score should be the sum of all category scores
- If a category exceeds its maximum, the review will be rejected
</evaluation_criteria>

<submission_content>
${textContent}
</submission_content>
`,
  }

  /**
   * Creates a complete, formatted prompt for the AI model.
   * @param type The type of prompt to generate.
   * @param context An object containing the data needed for the prompt (e.g., codeBundle, taskType).
   * @returns A string containing the full user prompt.
   */
  public static create(type: PromptType, context: PromptContext): string {
    if (!this.PROMPT_TEMPLATES[type]) {
      throw new Error(`Prompt template for type "${type}" not found.`)
    }
    return this.PROMPT_TEMPLATES[type](context)
  }
}

export function getGeminiModel(modelName: string = 'gemini-1.5-flash'): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.1, // Slightly increased for nuanced reviews, but still low for consistency.
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: REVIEW_RESPONSE_SCHEMA,
    },
    systemInstruction: SYSTEM_INSTRUCTION,
  })
}

/**
 * Enhanced URL validation with flexible fake submission detection
 * Allows evaluation if at least one URL is legitimate, even if others are gibberish
 */
export function validateSubmissionUrls(urls: string[]): {
  isValid: boolean
  isPlaceholder: boolean
  reason?: string
  legitimateUrls: string[]
  invalidUrls: string[]
} {
  if (urls.length === 0) {
    return { 
      isValid: false, 
      isPlaceholder: true, 
      reason: 'No URLs provided',
      legitimateUrls: [],
      invalidUrls: []
    }
  }

  const legitimateUrls: string[] = []
  const invalidUrls: string[] = []
  let hasEmptyUrl = false

  for (const url of urls) {
    if (!url || url.trim() === '') {
      hasEmptyUrl = true
      invalidUrls.push(url || '')
      continue
    }

    const trimmedUrl = url.trim().toLowerCase()

    // Check for obviously malformed URLs first
    try {
      new URL(url.trim())
    } catch {
      invalidUrls.push(url)
      continue
    }

    // Only reject URLs that are just the protocol
    if (url.trim() === 'https://' || url.trim() === 'http://') {
      invalidUrls.push(url)
      continue
    }

    // Check for random string URLs (like fbjksdbfjks.com)
    if (isRandomStringUrl(trimmedUrl)) {
      invalidUrls.push(url)
      continue
    }

    // Check for placeholder domains
    if (isPlaceholderDomain(trimmedUrl)) {
      invalidUrls.push(url)
      continue
    }

    // Check for bare domain URLs without specific repos/pages
    if (isBareDomainUrl(trimmedUrl)) {
      invalidUrls.push(url)
      continue
    }

    // If we get here, the URL appears legitimate
    legitimateUrls.push(url)
  }

  // If we have at least one legitimate URL, allow evaluation
  if (legitimateUrls.length > 0) {
    return { 
      isValid: true, 
      isPlaceholder: false,
      legitimateUrls,
      invalidUrls
    }
  }

  // Only reject if ALL URLs are invalid
  const reason = hasEmptyUrl 
    ? 'All URLs are empty or invalid' 
    : `All URLs appear to be invalid: ${invalidUrls.join(', ')}`

  return { 
    isValid: false, 
    isPlaceholder: true, 
    reason,
    legitimateUrls,
    invalidUrls
  }
}

/**
 * Detects URLs that appear to be random strings
 */
function isRandomStringUrl(url: string): boolean {
  // Remove protocol and www
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
  
  // Check for random character patterns
  const randomPatterns = [
    /^[a-z]{8,}\.com$/, // 8+ random lowercase letters
    /^[a-z]{5,}[0-9]{3,}\.com$/, // mixed random letters and numbers
    /^[a-z]{3,}[0-9]{3,}[a-z]{3,}\.com$/, // alternating pattern
    /^[a-z0-9]{10,}\.com$/, // 10+ random alphanumeric
  ]
  
  return randomPatterns.some(pattern => pattern.test(domain))
}

/**
 * Detects placeholder domains
 */
function isPlaceholderDomain(url: string): boolean {
  const placeholderDomains = [
    'example.com',
    'test.com',
    'placeholder.com',
    'demo.com',
    'sample.com',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'your-domain.com',
    'mywebsite.com',
    'mysite.com',
    'placeholder-site.com',
    'temp-site.com',
    'fake-site.com'
  ]
  
  const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
  return placeholderDomains.some(placeholder => domain.includes(placeholder))
}

/**
 * Detects bare domain URLs without specific content
 */
function isBareDomainUrl(url: string): boolean {
  // Check if it's just a domain without specific path
  const urlObj = new URL(url)
  const path = urlObj.pathname
  
  // If path is just '/' or empty, it's a bare domain
  if (path === '/' || path === '') {
    // For GitHub, check if it's just the user profile without repos
    if (urlObj.hostname === 'github.com') {
      const pathParts = path.split('/').filter(Boolean)
      // If it's just /username without /reponame, it's bare
      return pathParts.length <= 1
    }
    
    // For other domains, bare domain is suspicious
    return true
  }
  
  return false
}

/**
 * Enhanced fake submission detection that combines URL and content analysis
 * Now flexible - only flags as fake if ALL URLs are invalid AND content is fake
 */
export function detectFakeSubmission(urls: string[], content: string): {
  isFake: boolean
  confidence: number
  reasons: string[]
  shouldAwardZero: boolean
} {
  const reasons: string[] = []
  let confidence = 0
  let shouldAwardZero = false

  // Check URL validation first
  const urlValidation = validateSubmissionUrls(urls)
  
  // Only penalize heavily if ALL URLs are invalid
  if (!urlValidation.isValid && urlValidation.isPlaceholder) {
    reasons.push(`All URLs are invalid: ${urlValidation.reason}`)
    confidence += 0.6
    shouldAwardZero = true
  } else if (urlValidation.invalidUrls.length > 0) {
    // If some URLs are invalid but we have legitimate ones, note it but don't penalize heavily
    reasons.push(`Some URLs appear invalid but legitimate URLs found: ${urlValidation.legitimateUrls.length} legitimate, ${urlValidation.invalidUrls.length} invalid`)
    confidence += 0.1 // Small penalty for having some invalid URLs
  }

  // Check content analysis
  const contentAnalysis = analyzeContentForFakeSubmission(content)
  if (contentAnalysis.isFake) {
    reasons.push(...contentAnalysis.reasons)
    confidence += contentAnalysis.confidence * 0.4
    if (contentAnalysis.confidence >= 0.7) {
      shouldAwardZero = true
    }
  }

  // Additional checks for common fake submission patterns
  const allText = urls.join(' ') + ' ' + content
  
  // Check for keyboard mashing patterns
  const keyboardMashPatterns = [
    /asdfghjkl/gi,
    /qwertyuiop/gi,
    /zxcvbnm/gi,
    /fghjkl/gi,
    /hjkl/gi,
  ]
  
  for (const pattern of keyboardMashPatterns) {
    if (pattern.test(allText)) {
      reasons.push('Keyboard mashing patterns detected')
      confidence += 0.2 // Reduced penalty since we're being more flexible
    }
  }

  // Check for random character sequences
  const randomCharPatterns = [
    /[a-z]{10,}/gi, // 10+ consecutive lowercase letters
    /[0-9]{8,}/gi,  // 8+ consecutive numbers
    /[a-z]{5,}[0-9]{5,}/gi, // Mixed long sequences
  ]
  
  for (const pattern of randomCharPatterns) {
    if (pattern.test(allText)) {
      reasons.push('Random character sequences detected')
      confidence += 0.1 // Reduced penalty
    }
  }

  // Only consider it fake if we have high confidence AND no legitimate URLs
  const isFake = confidence >= 0.5 && (!urlValidation.isValid || urlValidation.legitimateUrls.length === 0)

  return {
    isFake,
    confidence: Math.min(confidence, 1),
    reasons: [...new Set(reasons)], // Remove duplicates
    shouldAwardZero: shouldAwardZero && (!urlValidation.isValid || urlValidation.legitimateUrls.length === 0)
  }
}

/**
 * Analyzes content for fake submission patterns
 * Enhanced to work better with mixed URL quality submissions
 */
export function analyzeContentForFakeSubmission(content: string): {
  isFake: boolean
  confidence: number
  reasons: string[]
} {
  const reasons: string[] = []
  let confidence = 0

  // Check for random string patterns in content
  const randomStringPatterns = [
    /[a-z]{8,}\.com/gi, // Random string domains
    /asdfghjkl|qwertyuiop|zxcvbnm/gi, // Keyboard mashing
    /[a-z]{5,}[0-9]{3,}/gi, // Mixed random letters and numbers
  ]

  for (const pattern of randomStringPatterns) {
    if (pattern.test(content)) {
      reasons.push('Random string patterns detected in content')
      confidence += 0.3
    }
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /lorem ipsum/gi,
    /placeholder text/gi,
    /your text here/gi,
    /enter your content/gi,
    /sample text/gi,
    /demo content/gi,
    /test data/gi,
    /example\.com/gi,
    /localhost/gi,
    /127\.0\.0\.1/gi,
  ]

  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) {
      reasons.push('Placeholder text detected')
      confidence += 0.2
    }
  }

  // Check for empty or minimal content
  const cleanContent = content.trim()
  if (cleanContent.length < 50) {
    reasons.push('Content too short (less than 50 characters)')
    confidence += 0.4
  }

  // Check for template indicators
  const templatePatterns = [
    /\[your name\]/gi,
    /\[company name\]/gi,
    /\[project name\]/gi,
    /\[description\]/gi,
    /\[insert text\]/gi,
    /\[replace this\]/gi,
  ]

  for (const pattern of templatePatterns) {
    if (pattern.test(content)) {
      reasons.push('Template placeholders detected')
      confidence += 0.3
    }
  }

  // Check for generic AI patterns
  const aiPatterns = [
    /I understand that/gi,
    /It is important to note/gi,
    /Furthermore/gi,
    /In conclusion/gi,
    /As an AI/gi,
    /I cannot/gi,
    /I don't have access/gi,
  ]

  let aiPatternCount = 0
  for (const pattern of aiPatterns) {
    if (pattern.test(content)) {
      aiPatternCount++
    }
  }

  if (aiPatternCount >= 3) {
    reasons.push('Multiple AI-generated content patterns detected')
    confidence += 0.3
  }

  return {
    isFake: confidence >= 0.5,
    confidence: Math.min(confidence, 1),
    reasons
  }
}

/**
 * Enhanced content analysis that can handle mixed URL quality
 * Focuses on legitimate URLs and provides better context for AI evaluation
 */
export function analyzeMixedUrlSubmission(urls: string[], content: string): {
  shouldEvaluate: boolean
  legitimateUrls: string[]
  invalidUrls: string[]
  contentAnalysis: string
  evaluationGuidance: string
} {
  const urlValidation = validateSubmissionUrls(urls)
  
  let contentAnalysis = ''
  let evaluationGuidance = ''
  
  if (urlValidation.legitimateUrls.length > 0) {
    contentAnalysis = `Found ${urlValidation.legitimateUrls.length} legitimate URL(s) and ${urlValidation.invalidUrls.length} invalid URL(s).`
    evaluationGuidance = `Focus evaluation on the legitimate URLs: ${urlValidation.legitimateUrls.join(', ')}. Ignore the invalid URLs: ${urlValidation.invalidUrls.join(', ')}.`
    
    if (urlValidation.invalidUrls.length > 0) {
      contentAnalysis += ` Some URLs appear to be gibberish or placeholder domains, but legitimate URLs contain actual project work.`
      evaluationGuidance += ` Do not penalize the submission for having some invalid URLs - evaluate based on the legitimate content only.`
    }

    // Add content analysis if provided
    if (content && content.trim()) {
      const contentLength = content.trim().length
      contentAnalysis += ` Content provided: ${contentLength} characters.`
      if (contentLength > 100) {
        evaluationGuidance += ` Review the provided content alongside the legitimate URLs for complete evaluation.`
      }
    }
  } else {
    contentAnalysis = `All URLs appear to be invalid: ${urlValidation.invalidUrls.join(', ')}.`
    evaluationGuidance = `This submission contains only invalid URLs and should be scored very low (0-200 points).`

    // If no legitimate URLs but content is provided, suggest evaluating content
    if (content && content.trim()) {
      contentAnalysis += ` However, text content is provided (${content.trim().length} characters).`
      evaluationGuidance += ` Consider evaluating the provided text content for any evidence of effort.`
    }
  }
  
  return {
    shouldEvaluate: urlValidation.legitimateUrls.length > 0,
    legitimateUrls: urlValidation.legitimateUrls,
    invalidUrls: urlValidation.invalidUrls,
    contentAnalysis,
    evaluationGuidance
  }
}

/**
 * Get task-specific evaluation guidelines based on MSA recruitment tasks
 */

/**
 * Generate AI review using structured output to prevent parsing issues
 */
/**
 * Generates a structured review from the AI model.
 * @param model A configured GenerativeModel instance.
 * @param userPrompt The task-specific prompt for the user.
 * @returns A promise that resolves to a ReviewResult object.
 * @throws {AIResponseError} If the API call fails or the response is invalid.
 */
export async function generateStructuredReview(
  model: GenerativeModel, 
  userPrompt: string
): Promise<ReviewResult> {
  try {
    const result = await model.generateContent(userPrompt)
    const responseText = result.response.text()
    const parsed = JSON.parse(responseText) as ReviewResult

    // Post-validation to ensure the model's output is sound
    if (parsed.score < 0 || parsed.score > 1000) {
      throw new Error(`Score validation failed: Score of ${parsed.score} is outside the valid range (0-1000).`)
    }
    if (!parsed.review || parsed.review.trim().length < 50) {
      throw new Error('Review validation failed: Review content is missing or too short.')
    }
    if (!['shortlist', 'reject', 'neutral'].includes(parsed.recommendation)) {
        throw new Error(`Recommendation validation failed: Value "${parsed.recommendation}" is invalid.`)
    }
    
    return parsed
  } catch (error) {
    console.error('Structured review generation failed:', error)
    // Wrap the original error in our custom error type for better upstream handling.
    throw new AIResponseError('Failed to generate or parse the AI review.', error)
  }
}

// Legacy PROMPTS object - use PromptFactory.create() instead
export const PROMPTS = {
  tech_first_year: (codeBundle: string, taskType?: string) => PromptFactory.create('tech_first_year', { codeBundle, taskType }),
  tech_second_year: (codeBundle: string, taskType?: string) => PromptFactory.create('tech_second_year', { codeBundle, taskType }),
  corporate: (textContent: string) => PromptFactory.create('corporate', { textContent })
}

/**
 * Validates that individual category scores don't exceed their maximum values
 */
function validateCategoryScores(reviewText: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Extract score patterns from the review text
  // Look for patterns like "230/150" or "xx/150"
  const scorePattern = /(\d+)\/(\d+)/g
  let match
  
  while ((match = scorePattern.exec(reviewText)) !== null) {
    const actualScore = parseInt(match[1])
    const maxScore = parseInt(match[2])
    
    if (actualScore > maxScore) {
      errors.push(`Score ${actualScore} exceeds maximum ${maxScore}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function parseGeminiJsonResponse(raw: string): Promise<ReviewResult> {
  try {
    // Clean the response text
    let cleanedText = raw.trim()
    
    // Remove any markdown formatting that might interfere
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    
    // Find JSON content
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}') + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON content found in response')
    }
    
    let jsonText = cleanedText.slice(jsonStart, jsonEnd)
    console.log('Extracted JSON text:', jsonText)
    
    // Sanitize control characters that can break JSON parsing
    jsonText = sanitizeJsonString(jsonText)
    
    const parsed = JSON.parse(jsonText)
    
    // Validate the response structure
    if (typeof parsed.score !== 'number' || typeof parsed.review !== 'string' || !['shortlist', 'reject', 'neutral'].includes(parsed.recommendation)) {
      throw new Error('Invalid response structure: missing score, review, or invalid recommendation')
    }
    
    if (parsed.score < 0 || parsed.score > 1000) {
      throw new Error('Invalid score range: must be 0-1000')
    }
    
    if (parsed.review.trim().length === 0) {
      throw new Error('Review text is empty')
    }
    
    // Validate individual category scores in the review text
    const categoryScoreValidation = validateCategoryScores(parsed.review)
    if (!categoryScoreValidation.isValid) {
      throw new Error(`Invalid category scores: ${categoryScoreValidation.errors.join(', ')}`)
    }
    
    return parsed
  } catch (error) {
    console.error('JSON parsing failed:', error)
    console.log('Raw response:', raw)
    
    // Return a helpful error message
    return { 
      score: 0, 
      review: `**AI Review Error**

The AI system provided a response that could not be properly parsed. This usually means the AI didn't follow the expected format.

**Technical Details:** ${error instanceof Error ? error.message : 'Unknown parsing error'}

**What this means:** Your submission has been received and will be reviewed manually by our team.

**Raw AI Response:**
\`\`\`
${raw.substring(0, 500)}${raw.length > 500 ? '...' : ''}
\`\`\`

Please contact support if you believe this is an error.`,
      recommendation: 'neutral' as const
    }
  }
}

/**
 * Sanitizes JSON string by removing or escaping problematic control characters
 */
function sanitizeJsonString(jsonString: string): string {
  // Replace problematic control characters with safe alternatives
  return jsonString
    // Replace unescaped newlines in string values with \\n
    .replace(/(?<!\\)"(?:[^"\\]|\\.)*"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    })
    // Remove any remaining control characters that might break JSON
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      const code = char.charCodeAt(0)
      switch (code) {
        case 8: return '\\b'  // backspace
        case 9: return '\\t'  // tab
        case 10: return '\\n' // newline
        case 12: return '\\f' // form feed
        case 13: return '\\r' // carriage return
        default: return '' // remove other control characters
      }
    })
}


