import { GoogleGenerativeAI, GenerativeModel, SchemaType } from '@google/generative-ai'

export type ReviewResult = {
  score: number
  review: string
  recommendation: 'shortlist' | 'reject' | 'neutral'
}

export function getGeminiModel(modelName: string = 'gemini-2.0-flash'): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0, // Set temperature to 0 for consistent, deterministic responses
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1000,
    }
  })
}

/**
 * Enhanced URL validation with fake submission detection
 * Detects obviously fake, placeholder, or invalid submissions
 */
export function validateSubmissionUrls(urls: string[]): {
  isValid: boolean
  isPlaceholder: boolean
  reason?: string
} {
  for (const url of urls) {
    if (!url || url.trim() === '') {
      return { isValid: false, isPlaceholder: true, reason: 'Empty URL provided' }
    }

    const trimmedUrl = url.trim().toLowerCase()

    // Detect random string URLs (like fbjksdbfjks.com)
    if (isRandomStringUrl(trimmedUrl)) {
      return { 
        isValid: false, 
        isPlaceholder: true, 
        reason: `Suspicious random string URL detected: ${url}` 
      }
    }

    // Detect placeholder domains
    if (isPlaceholderDomain(trimmedUrl)) {
      return { 
        isValid: false, 
        isPlaceholder: true, 
        reason: `Placeholder domain detected: ${url}` 
      }
    }

    // Only reject obviously malformed URLs
    try {
      new URL(url.trim())
    } catch {
      return { 
        isValid: false, 
        isPlaceholder: true, 
        reason: `Invalid URL format: ${url}` 
      }
    }

    // Only reject URLs that are just the protocol
    if (url.trim() === 'https://' || url.trim() === 'http://') {
      return { 
        isValid: false, 
        isPlaceholder: true,
        reason: `Incomplete URL: ${url}` 
      }
    }

    // Detect bare domain URLs without specific repos/pages
    if (isBareDomainUrl(trimmedUrl)) {
      return { 
        isValid: false, 
        isPlaceholder: true, 
        reason: `Bare domain URL without specific content: ${url}` 
      }
    }
  }

  return { isValid: true, isPlaceholder: false }
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
  if (!urlValidation.isValid && urlValidation.isPlaceholder) {
    reasons.push(`URL validation failed: ${urlValidation.reason}`)
    confidence += 0.6
    shouldAwardZero = true
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
      confidence += 0.3
      shouldAwardZero = true
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
      confidence += 0.2
    }
  }

  return {
    isFake: confidence >= 0.5,
    confidence: Math.min(confidence, 1),
    reasons: [...new Set(reasons)], // Remove duplicates
    shouldAwardZero
  }
}

/**
 * Analyzes content for fake submission patterns
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
 * Get task-specific evaluation guidelines based on MSA recruitment tasks
 */
function getTaskSpecificGuidelines(taskType?: string, yearLevel?: string): string {
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

/**
 * Generate AI review using structured output to prevent parsing issues
 */
export async function generateStructuredReview(
  model: GenerativeModel, 
  prompt: string
): Promise<ReviewResult> {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0, // Ensure deterministic responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: {
              type: SchemaType.INTEGER,
              description: 'Score from 0 to 1000'
            },
            review: {
              type: SchemaType.STRING,
              description: 'Detailed review in markdown format'
            },
            recommendation: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['shortlist', 'reject'],
              description: 'Recommendation: shortlist for strong candidates, reject for weak candidates'
            }
          },
          required: ['score', 'review', 'recommendation']
        }
      }
    })
    
    const responseText = result.response.text()
    const parsed = JSON.parse(responseText)
    
    // Validate the response structure
    if (typeof parsed.score !== 'number' || typeof parsed.review !== 'string' || !['shortlist', 'reject'].includes(parsed.recommendation)) {
      throw new Error('Invalid response structure: missing score, review, or invalid recommendation')
    }
    
    if (parsed.score < 0 || parsed.score > 1000) {
      throw new Error('Invalid score range: must be 0-1000')
    }
    
    if (parsed.review.trim().length === 0) {
      throw new Error('Review text is empty')
    }
    
    return parsed
  } catch (error) {
    console.error('Structured review generation failed:', error)
    throw error
  }
}

export const PROMPTS = {
  tech_first_year: (codeBundle: string, taskType?: string) => `You are an expert, unbiased code reviewer for MSA evaluating a FIRST-YEAR student's technical task.

**CRITICAL FAKE SUBMISSION DETECTION RULES:**
1. **IMMEDIATE ZERO SCORE (0-50 points) for:**
   - Random string URLs (e.g., fbjksdbfjks.com, asdfghjkl.com, qwerty123.com)
   - Placeholder domains (example.com, test.com, placeholder.com, localhost, etc.)
   - Bare GitHub URLs without specific repositories (just github.com/username)
   - Empty or template submissions with no actual work
   - URLs that don't contain any project-related content
   - Submissions that are clearly copy-pasted templates without customization

2. **CONTENT ANALYSIS REQUIREMENTS:**
   - Must contain actual project code, not just placeholder text
   - Must address the specific task requirements
   - Must show evidence of student work and understanding
   - Must have meaningful documentation or README

**CONTEXT:** First years are beginners. Assume only ~30% can use a framework. Do NOT penalize for not using a framework. Reward working vanilla solutions and genuine learning. However, be extremely strict about fake submissions - award ZERO points for any submission that appears to be fake, placeholder, or shows no actual work.

**SCORING FOR FAKE SUBMISSIONS:**
- Random string URLs: 0 points
- Placeholder domains: 0 points  
- Empty repos with no code: 0-50 points
- Template submissions without customization: 0-100 points
- URLs without actual project content: 0-200 points

Provide a score from 0-1000 and a concise markdown review.

# Code Review - <Short Title>

## Summary
- 2-4 sentences about overall quality and learning effort

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Fundamentals & Problem Understanding | xx/300 | e.g., correct approach, clarity of logic |
| Functionality (Meets Requirements) | xx/250 | e.g., required features work |
| Code Quality (readability, structure) | xx/150 | e.g., naming, organization |
| Learning Effort & Reflection | xx/200 | e.g., comments, README, what they learned |
| Originality (AI/Copying checks) | xx/100 | e.g., signs of copy-paste |

## Highlights
- 3-5 positives and learning achievements

## Areas for Growth
- 3-5 focused improvements (be constructive)

## Recommendations
- 4-6 concrete next steps to improve

**EXPECTATIONS FOR 1ST YEARS:**
- Framework usage is not required; working vanilla code is acceptable
- Reward attempts at best practices, even if imperfect
- Emphasize basic HTML/CSS/JS or core language fundamentals over tooling
- Tests are optional; do not penalize if absent. Reward if present with clear intent

**TASK-SPECIFIC GUIDELINES:**
${getTaskSpecificGuidelines(taskType, 'first_year')}

**ORIGINALITY / PLAGIARISM SCORING RULES:**
- Start originality at 100 and DEDUCT ONLY if there is evidence of copying/AI without understanding
- If there are no signs of copying and the work appears original, award 90-100 in the Originality row
- If originality is uncertain but plausible, award 70-90 and explain briefly
- If likely copied or AI-generated without understanding, deduct appropriately (down to 0 in severe cases) and mention why

CONSTRAINTS:
- Keep review concise (≈300-500 words) with the table above
- Encouraging tone suitable for beginners

STUDENT CODE:
${codeBundle}`,
  
  tech_second_year: (codeBundle: string, taskType?: string) => `You are a STRICT, expert code reviewer for MSA evaluating a SECOND-YEAR student's technical task submission.

**CRITICAL FAKE SUBMISSION DETECTION RULES:**
1. **IMMEDIATE ZERO SCORE (0-50 points) for:**
   - Random string URLs (e.g., fbjksdbfjks.com, asdfghjkl.com, qwerty123.com)
   - Placeholder domains (example.com, test.com, placeholder.com, localhost, etc.)
   - Bare GitHub URLs without specific repositories (just github.com/username)
   - Empty or template submissions with no actual work
   - URLs that don't contain any project-related content
   - Submissions that are clearly copy-pasted templates without customization

2. **CONTENT ANALYSIS REQUIREMENTS:**
   - Must contain actual project code, not just placeholder text
   - Must address the specific task requirements
   - Must show evidence of student work and understanding
   - Must have meaningful documentation or README

3. **TASK COMPLIANCE VERIFICATION:**
   - Verify the submission actually solves the assigned problem
   - Check that all required features are implemented
   - Ensure the solution demonstrates understanding of the task

**CONTEXT:** Second years should demonstrate intermediate skills. Be extremely strict about fake submissions - award ZERO points for any submission that appears to be fake, placeholder, or shows no actual work.

**SCORING FOR FAKE SUBMISSIONS:**
- Random string URLs: 0 points
- Placeholder domains: 0 points  
- Empty repos with no code: 0-50 points
- Template submissions without customization: 0-100 points
- URLs without actual project content: 0-200 points

Provide a score from 0-1000 and a concise markdown review.

# Code Review - <Short Title>

## Summary
- 2-4 sentences on overall quality and task compliance

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Task Compliance & Requirements | xx/300 | Does it actually solve the task? Are requirements met? |
| Code Quality & Architecture | xx/250 | structure, decomposition, naming, maintainability |
| Functionality & Correctness | xx/200 | required features work, edge cases handled |
| Technical Implementation | xx/150 | appropriate tools, best practices, error handling |
| Documentation & Deployment | xx/100 | README, setup instructions, deployment notes |

## Highlights
- 3-5 technical strengths and good decisions

## Critical Issues
- 3-5 major problems that must be addressed

## Recommendations
- 4-6 concrete, prioritized improvements

**STRICT EVALUATION CRITERIA FOR 2ND YEARS:**
- Must demonstrate understanding of the specific task requirements
- Code should be functional and address the core problem
- Architecture should show some thought and organization
- Documentation should be clear and helpful
- Evaluate based on actual content, not URL patterns

**TASK-SPECIFIC GUIDELINES:**
${getTaskSpecificGuidelines(taskType, 'second_year')}

**CONTENT-BASED EVALUATION:**
- If no actual project content is provided (empty repos, no code, no documentation): Score 0-200
- If submission doesn't address the task requirements: Score 0-300
- If submission appears to be a template without customization: Score 0-400
- If URLs are provided but content analysis shows no actual work: Score 0-300

**SCORING GUIDELINES:**
- 900-1000: Exceptional work that exceeds expectations
- 800-899: Strong work that meets all requirements well
- 700-799: Good work with minor issues
- 600-699: Adequate work with some problems
- 500-599: Below average with significant issues
- 400-499: Poor work with major problems
- 300-399: Very poor work, barely functional
- 200-299: Non-functional or severely incomplete
- 100-199: Minimal effort or template submission
- 0-99: No actual work or completely invalid submission

CONSTRAINTS:
- Be strict but constructive
- Focus on task compliance and actual functionality
- Analyze content, not just URLs
- Keep review concise (≈400-600 words)

STUDENT SUBMISSION:
${codeBundle}`,
  
  corporate: (textContent: string) => `You are reviewing a CORPORATE recruitment task submission (proposal/email/plan).

**CRITICAL FAKE SUBMISSION DETECTION RULES:**
1. **IMMEDIATE ZERO SCORE (0-50 points) for:**
   - Random string URLs (e.g., fbjksdbfjks.com, asdfghjkl.com, qwerty123.com)
   - Placeholder domains (example.com, test.com, placeholder.com, localhost, etc.)
   - Bare GitHub URLs without specific repositories (just github.com/username)
   - Empty or template submissions with no actual work
   - URLs that don't contain any project-related content
   - Submissions that are clearly copy-pasted templates without customization
   - Generic AI-generated content with no personalization or company-specific details

2. **CONTENT ANALYSIS REQUIREMENTS:**
   - Must contain actual project work, not just placeholder text
   - Must address the specific task requirements
   - Must show evidence of student work and understanding
   - Must have meaningful documentation or README

Judge primarily on real‑world suitability and practicality, with creativity as a positive. Detect and flag plagiarism; reduce points accordingly. Be extremely strict about fake submissions - award ZERO points for any submission that appears to be fake, placeholder, or shows no actual work.

**SCORING FOR FAKE SUBMISSIONS:**
- Random string URLs: 0 points
- Placeholder domains: 0 points  
- Empty repos with no code: 0-50 points
- Template submissions without customization: 0-100 points
- URLs without actual project content: 0-200 points
- Generic AI content without personalization: 0-150 points

Provide a score from 0-1000 and a concise markdown review.

# Review - <Short Title>

## Summary
- 2-4 sentences on suitability, practicality, and overall impact

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Real-World Fit & Feasibility | xx/400 | e.g., actionable, realistic, stakeholder alignment |
| Clarity & Structure | xx/200 | e.g., logical flow, objectives, next steps |
| Professional Tone & Persuasion | xx/200 | e.g., tone, persuasion, audience match |
| Creativity & Differentiation | xx/150 | e.g., unique value, fresh angles |
| Originality (Plagiarism checks) | xx/50 | deductions for likely copying |

## Strengths
- 3-5 bullets

## Gaps / Concerns
- 3-5 bullets

## Recommendations
- 4-6 prioritized, actionable next steps

**PLAGIARISM / ORIGINALITY / AI DETECTION SCORING RULES:**
- Start originality at 50 and DEDUCT ONLY if there is evidence of copying/AI without adaptation
- If there are no signs of copying and content appears original, award 45-50 in the Originality row
- If originality is uncertain but plausible, award 35-45 with a short justification
- **AI-GENERATED CONTENT DETECTION:**
  - Look for generic AI patterns: overly formal tone, perfect structure, buzzword-heavy language, lack of personal touch
  - Check for AI hallmarks: "I understand that...", "It is important to note...", "Furthermore...", "In conclusion..."
  - **Blatant AI use (0-15 points)**: Obvious AI generation with no personalization, generic responses, perfect but soulless content
  - **AI-assisted but adapted (20-35 points)**: Uses AI but adds personal insights, company-specific details, or original examples
  - **Thoughtful AI use (40-50 points)**: AI as a tool but content shows genuine understanding and personal perspective
- Deduct more heavily when content appears copied/AI‑generated without adaptation; explain why

CONSTRAINTS:
- Keep review concise (≈300-500 words) with the table above

SUBMISSION CONTENT:
${textContent}`
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
    if (typeof parsed.score !== 'number' || typeof parsed.review !== 'string' || !['shortlist', 'reject'].includes(parsed.recommendation)) {
      throw new Error('Invalid response structure: missing score, review, or invalid recommendation')
    }
    
    if (parsed.score < 0 || parsed.score > 1000) {
      throw new Error('Invalid score range: must be 0-1000')
    }
    
    if (parsed.review.trim().length === 0) {
      throw new Error('Review text is empty')
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


