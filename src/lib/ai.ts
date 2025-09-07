import { GoogleGenerativeAI, GenerativeModel, Schema, SchemaType } from '@google/generative-ai'

export type ReviewResult = {
  score: number
  review: string
  recommendation: 'shortlist' | 'reject'
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
      enum: ['shortlist', 'reject'],
      description: 'A clear recommendation: "shortlist" for strong candidates (score >= 400), "reject" for weak ones (score < 400).',
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
You are an expert, unbiased, and constructive reviewer for the Microsoft Student Ambassadors (MSA) program. Your goal is to provide fair, insightful, and actionable feedback to student applicants.
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
 * Advanced scoring configuration for production-quality evaluation
 * Based on industry standards from GitHub, Stack Overflow, and academic review systems
 */
interface ScoringConfig {
  categories: {
    name: string
    maxPoints: number
    weight: number
    description: string
    aiUsagePolicy: 'penalize' | 'evaluate' | 'neutral'
  }[]
  totalPoints: number
  passingThreshold: number
  aiUsageThresholds: {
    excellent: number    // AI used effectively to enhance work
    acceptable: number   // AI used appropriately with understanding
    poor: number        // AI used without understanding/editing
  }
}

/**
 * Production-quality scoring configurations
 * @deprecated This configuration is not currently used but kept for future reference
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SCORING_CONFIGS: Record<string, ScoringConfig> = {
  tech_first_year: {
    categories: [
      {
        name: "Problem Solving & Logic",
        maxPoints: 300,
        weight: 0.3,
        description: "Understanding of the problem and logical approach to solution",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Implementation Quality",
        maxPoints: 250,
        weight: 0.25,
        description: "Code functionality, correctness, and basic best practices",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Code Organization",
        maxPoints: 150,
        weight: 0.15,
        description: "Structure, readability, and maintainability",
        aiUsagePolicy: 'neutral'
      },
      {
        name: "Learning & Growth",
        maxPoints: 200,
        weight: 0.2,
        description: "Evidence of learning, documentation, and reflection",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "AI Integration & Originality",
        maxPoints: 100,
        weight: 0.1,
        description: "Appropriate use of AI tools, original thinking, and understanding",
        aiUsagePolicy: 'evaluate'
      }
    ],
    totalPoints: 1000,
    passingThreshold: 400,
    aiUsageThresholds: {
      excellent: 80,   // AI enhanced their learning and output
      acceptable: 50,  // AI used appropriately with understanding
      poor: 20        // Obvious copy-paste without understanding
    }
  },
  
  tech_second_year: {
    categories: [
      {
        name: "Technical Excellence",
        maxPoints: 300,
        weight: 0.3,
        description: "Advanced implementation, architecture, and technical depth",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Problem Solving",
        maxPoints: 200,
        weight: 0.2,
        description: "Complex problem decomposition and solution design",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Code Quality & Practices",
        maxPoints: 200,
        weight: 0.2,
        description: "Professional coding standards, testing, documentation",
        aiUsagePolicy: 'neutral'
      },
      {
        name: "Innovation & Creativity",
        maxPoints: 150,
        weight: 0.15,
        description: "Novel approaches, creative solutions, technical innovation",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Professional AI Usage",
        maxPoints: 150,
        weight: 0.15,
        description: "Strategic use of AI tools, understanding limitations, adding value",
        aiUsagePolicy: 'evaluate'
      }
    ],
    totalPoints: 1000,
    passingThreshold: 500,
    aiUsageThresholds: {
      excellent: 120,  // Professional-level AI integration
      acceptable: 80,  // Good understanding and usage
      poor: 40        // Poor integration or over-reliance
    }
  },
  
  corporate: {
    categories: [
      {
        name: "Strategic Thinking",
        maxPoints: 300,
        weight: 0.3,
        description: "Business acumen, strategic alignment, feasibility",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Communication & Clarity",
        maxPoints: 200,
        weight: 0.2,
        description: "Clear articulation, professional tone, persuasive argument",
        aiUsagePolicy: 'neutral'
      },
      {
        name: "Real-world Applicability",
        maxPoints: 200,
        weight: 0.2,
        description: "Practical implementation, market understanding, impact potential",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Innovation & Insight",
        maxPoints: 150,
        weight: 0.15,
        description: "Unique perspectives, creative solutions, added value",
        aiUsagePolicy: 'evaluate'
      },
      {
        name: "Authenticity & AI Ethics",
        maxPoints: 150,
        weight: 0.15,
        description: "Personal voice, ethical AI use, transparent enhancement",
        aiUsagePolicy: 'evaluate'
      }
    ],
    totalPoints: 1000,
    passingThreshold: 450,
    aiUsageThresholds: {
      excellent: 120,  // AI used to enhance authentic thinking
      acceptable: 80,  // AI used appropriately with personal input
      poor: 30        // Generic AI output without personalization
    }
  }
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
<evaluation_philosophy>
You are conducting a production-quality technical evaluation for a FIRST-YEAR student in the Microsoft Student Ambassadors program. Your assessment should:
- **Growth-Oriented:** Focus on learning potential and effort over perfection
- **Industry-Aligned:** Evaluate skills relevant to real-world software development
- **AI-Aware:** Recognize that AI tools are part of modern development; assess HOW WELL they're used
- **Fair & Unbiased:** Avoid unconscious bias; focus solely on technical merit and learning evidence
- **Constructive:** Provide actionable feedback that helps students improve
</evaluation_philosophy>

<scoring_framework>
Use this advanced scoring rubric based on industry standards:

**Problem Solving & Logic (300 pts)**
- Excellent (240-300): Clear problem understanding, logical approach, handles edge cases
- Good (180-239): Solid understanding, mostly logical with minor gaps
- Acceptable (120-179): Basic understanding, some logical issues
- Poor (0-119): Misunderstands problem or illogical approach

**Implementation Quality (250 pts)**
- Excellent (200-250): Functional, well-tested, handles errors gracefully
- Good (150-199): Mostly functional with minor issues
- Acceptable (100-149): Basic functionality, some bugs
- Poor (0-99): Major functionality issues or doesn't work

**Code Organization (150 pts)**
- Excellent (120-150): Clean, readable, well-structured, follows conventions
- Good (90-119): Generally well-organized with minor issues
- Acceptable (60-89): Basic organization, some messy areas
- Poor (0-59): Poor structure, hard to read/understand

**Learning & Growth (200 pts)**
- Excellent (160-200): Exceptional documentation, reflection, learning evidence
- Good (120-159): Good documentation and learning evidence
- Acceptable (80-119): Basic documentation, some learning shown
- Poor (0-79): Minimal documentation or learning evidence

**AI Integration & Originality (100 pts)**
- Excellent (80-100): AI used to enhance learning, clear understanding, original insights
- Good (60-79): Appropriate AI use with evidence of understanding
- Acceptable (40-59): Some AI use but shows basic understanding
- Poor (0-39): Over-reliance on AI without understanding, or blatant copy-paste
</scoring_framework>

<ai_usage_evaluation>
**Modern AI Assessment Approach:**
- **Excellent AI Use:** Student uses AI as a learning tool, shows understanding, adds personal insights
- **Acceptable AI Use:** Some AI assistance but demonstrates comprehension and effort
- **Poor AI Use:** Copy-paste without understanding, no personal contribution
- **No Penalty for Appropriate Use:** AI is a legitimate development tool when used thoughtfully
</ai_usage_evaluation>

<bias_mitigation>
**Evaluation Standards:**
- Judge work quality, not writing style or English proficiency
- Focus on technical merit and problem-solving approach
- Consider cultural differences in communication styles
- Evaluate effort and learning, not just final results
- Be consistent across all submissions regardless of background
</bias_mitigation>

<task_compliance>
**CRITICAL:** If submission doesn't address the specific task (e.g., portfolio when asked for website clone), assign 0 points for Problem Solving & Logic regardless of quality.
</task_compliance>

<output_format>
Provide a score from 0-1000 and a comprehensive review using this EXACT structure:

# Technical Review - [Brief Title]

## Executive Summary
[2-3 sentences on overall assessment and key findings]

## Score Breakdown
| Category | Points | Rationale |
|----------|---------|-----------|
| Problem Solving & Logic | xx/300 | [Specific reasoning for score] |
| Implementation Quality | xx/250 | [Specific reasoning for score] |
| Code Organization | xx/150 | [Specific reasoning for score] |
| Learning & Growth | xx/200 | [Specific reasoning for score] |
| AI Integration & Originality | xx/100 | [Assessment of AI usage quality] |

## Strengths
- [3-5 specific positive aspects with examples]

## Areas for Improvement
- [3-5 specific, actionable recommendations]

## AI Usage Assessment
[If AI usage detected: Quality evaluation and recommendations]

**SCORING VALIDATION:**
- Total must equal sum of categories
- No category can exceed maximum
- Scores must reflect actual performance level
</output_format>

${this.getTaskSpecificGuidelines(taskType, 'first_year')}

<submission_content>
${codeBundle}
</submission_content>
`,

    tech_second_year: ({ codeBundle, taskType }) => `
<evaluation_philosophy>
You are conducting a professional-level technical evaluation for a SECOND-YEAR student in the Microsoft Student Ambassadors program. Your assessment should:
- **Professional Standards:** Apply industry-level expectations while recognizing student context
- **Technical Depth:** Evaluate advanced concepts, architecture, and best practices
- **AI Proficiency:** Assess sophisticated AI tool integration and professional usage patterns
- **Career Readiness:** Focus on skills needed for internships and junior developer roles
- **Innovation Focus:** Reward creative problem-solving and technical innovation
</evaluation_philosophy>

<scoring_framework>
Advanced rubric for experienced students:

**Technical Excellence (300 pts)**
- Outstanding (240-300): Professional-grade code, advanced patterns, excellent architecture
- Strong (180-239): Solid technical implementation with good practices
- Competent (120-179): Adequate technical skills with room for improvement
- Developing (0-119): Basic implementation, significant technical gaps

**Problem Solving (200 pts)**
- Outstanding (160-200): Complex problem decomposition, elegant solutions, edge case handling
- Strong (120-159): Good problem analysis and solution approach
- Competent (80-119): Basic problem solving with some gaps
- Developing (0-79): Limited problem-solving capability

**Code Quality & Practices (200 pts)**
- Outstanding (160-200): Exceptional code quality, testing, documentation, professional standards
- Strong (120-159): Good practices, mostly clean code
- Competent (80-119): Adequate practices with improvements needed
- Developing (0-79): Poor practices, unprofessional code quality

**Innovation & Creativity (150 pts)**
- Outstanding (120-150): Innovative solutions, creative approaches, technical leadership
- Strong (90-119): Some creative elements, good technical choices
- Competent (60-89): Standard approaches, limited innovation
- Developing (0-59): Conventional solutions, no creative elements

**Professional AI Usage (150 pts)**
- Outstanding (120-150): Strategic AI integration, enhances capabilities, shows deep understanding
- Strong (90-119): Professional AI usage with clear value addition
- Competent (60-89): Appropriate AI use with basic understanding
- Developing (0-59): Poor AI integration or over-dependence without understanding
</scoring_framework>

<professional_ai_assessment>
**Advanced AI Evaluation:**
- **Excellent:** AI used strategically to solve complex problems, clear understanding of limitations
- **Good:** AI assists development while maintaining code quality and understanding
- **Acceptable:** Some AI usage with evidence of comprehension
- **Poor:** Over-reliance on AI without understanding, or inappropriate usage
</professional_ai_assessment>

<industry_alignment>
**Real-World Readiness:**
- Evaluate code as if reviewing for a tech company
- Consider maintainability, scalability, and production readiness
- Assess problem-solving approach used in professional environments
- Look for evidence of software engineering principles
</industry_alignment>

<output_format>
Provide a comprehensive professional assessment:

# Professional Technical Review - [Project Title]

## Executive Assessment
[Professional summary of technical competency and readiness]

## Score Breakdown
| Category | Points | Professional Rationale |
|----------|---------|------------------------|
| Technical Excellence | xx/300 | [Industry-standard assessment] |
| Problem Solving | xx/200 | [Complex problem analysis] |
| Code Quality & Practices | xx/200 | [Professional standards evaluation] |
| Innovation & Creativity | xx/150 | [Creative and innovative elements] |
| Professional AI Usage | xx/150 | [Strategic AI integration assessment] |

## Technical Strengths
- [4-6 specific professional-level strengths]

## Professional Development Areas
- [4-6 specific recommendations for industry readiness]

## AI Integration Analysis
[Detailed assessment of AI usage quality and professional appropriateness]

## Industry Readiness Assessment
[Evaluation of readiness for internships/junior roles]
</output_format>

${this.getTaskSpecificGuidelines(taskType, 'second_year')}

<submission_content>
${codeBundle}
</submission_content>
`,

    corporate: ({ textContent }) => `
<evaluation_philosophy>
You are conducting a professional business evaluation for a Microsoft Student Ambassadors corporate submission. Your assessment should:
- **Business Impact:** Evaluate real-world applicability and potential market impact
- **Strategic Thinking:** Assess business acumen and strategic alignment
- **Professional Communication:** Judge clarity, persuasiveness, and executive readiness
- **AI Enhancement:** Recognize AI as a business tool; evaluate quality of integration
- **Authenticity:** Value personal insights and unique perspectives over generic content
</evaluation_philosophy>

<scoring_framework>
Professional business evaluation rubric:

**Strategic Thinking (300 pts)**
- Outstanding (240-300): Exceptional business insight, market understanding, strategic alignment
- Strong (180-239): Solid business thinking with good strategic elements
- Competent (120-179): Basic business understanding with some strategic gaps
- Developing (0-119): Limited business insight or strategic thinking

**Communication & Clarity (200 pts)**
- Outstanding (160-200): Executive-level communication, compelling narrative, professional polish
- Strong (120-159): Clear, professional communication with good structure
- Competent (80-119): Adequate communication with room for improvement
- Developing (0-79): Poor communication, unclear messaging

**Real-world Applicability (200 pts)**
- Outstanding (160-200): Highly practical, implementable, market-ready insights
- Strong (120-159): Good practical application with minor feasibility concerns
- Competent (80-119): Somewhat practical with implementation challenges
- Developing (0-79): Limited practical value or unrealistic approach

**Innovation & Insight (150 pts)**
- Outstanding (120-150): Unique perspectives, innovative solutions, exceptional creativity
- Strong (90-119): Good insights with some creative elements
- Competent (60-89): Standard insights with limited innovation
- Developing (0-59): Generic thinking, no unique value proposition

**Authenticity & AI Ethics (150 pts)**
- Outstanding (120-150): Authentic voice, ethical AI use, transparent enhancement of personal thinking
- Strong (90-119): Mostly authentic with appropriate AI assistance
- Competent (60-89): Some authenticity with noticeable AI influence
- Developing (0-59): Heavily AI-generated with minimal personal input
</scoring_framework>

<business_ai_assessment>
**Professional AI Usage in Business Context:**
- **Excellent:** AI enhances strategic thinking, maintains authentic voice, adds genuine value
- **Good:** AI assists with structure/clarity while preserving personal insights
- **Acceptable:** Some AI usage with evidence of personal business thinking
- **Poor:** Generic AI output without personalization or business insight
</business_ai_assessment>

<bias_mitigation>
**Fair Business Evaluation:**
- Focus on business merit and strategic thinking quality
- Consider diverse business perspectives and approaches
- Evaluate substance over presentation style
- Assess potential impact regardless of industry background
- Judge strategic thinking, not cultural communication patterns
</bias_mitigation>

<output_format>
Provide a comprehensive business assessment:

# Business Strategy Review - [Proposal Title]

## Executive Summary
[Professional assessment of business potential and strategic merit]

## Score Breakdown
| Category | Points | Business Rationale |
|----------|---------|-------------------|
| Strategic Thinking | xx/300 | [Business insight and strategic analysis] |
| Communication & Clarity | xx/200 | [Professional communication assessment] |
| Real-world Applicability | xx/200 | [Market feasibility and implementation potential] |
| Innovation & Insight | xx/150 | [Unique value and creative business thinking] |
| Authenticity & AI Ethics | xx/150 | [Personal voice and responsible AI usage] |

## Business Strengths
- [4-6 specific business and strategic strengths]

## Strategic Recommendations
- [4-6 actionable business development suggestions]

## AI Integration Assessment
[Evaluation of AI usage quality in business context]

## Market Readiness Evaluation
[Assessment of business viability and professional readiness]
</output_format>

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
 * Advanced AI usage evaluator for production-quality assessment
 * Evaluates HOW WELL AI was used rather than just detecting usage
 */
export function evaluateAIUsage(content: string, submissionType: 'tech_first_year' | 'tech_second_year' | 'corporate'): {
  usageQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'undetected'
  confidence: number
  reasons: string[]
  recommendations: string[]
  score: number // 0-100 based on quality of AI integration
} {
  const reasons: string[] = []
  const recommendations: string[] = []
  let qualityScore = 100 // Start optimistic

  // Detect AI patterns first
  const aiDetection = detectAIGeneratedContent(content)
  
  if (!aiDetection.isAIGenerated && !aiDetection.shouldReducePoints) {
    return {
      usageQuality: 'undetected',
      confidence: 0.1,
      reasons: ['No clear AI usage patterns detected'],
      recommendations: ['Continue developing authentic voice and original thinking'],
      score: 100
    }
  }

  // Evaluate quality of AI integration
  const personalElements = analyzePersonalElements(content)
  const technicalDepth = analyzeTechnicalDepth(content, submissionType)
  const originalInsights = analyzeOriginalInsights(content)
  
  // Quality assessment based on submission type
  // const config = SCORING_CONFIGS[submissionType] // retained for future weighting
  
  if (personalElements.hasPersonalExamples && personalElements.hasPersonalVoice) {
    reasons.push('AI enhanced personal insights and examples')
    qualityScore += 10
  } else if (personalElements.hasPersonalVoice) {
    reasons.push('Some personal voice maintained despite AI usage')
  } else {
    reasons.push('Lacks personal voice - appears heavily AI-generated')
    qualityScore -= 30
    recommendations.push('Add personal examples and experiences to make content authentic')
  }

  if (technicalDepth.hasDeepUnderstanding) {
    reasons.push('Demonstrates deep understanding beyond AI output')
    qualityScore += 15
  } else if (technicalDepth.hasBasicUnderstanding) {
    reasons.push('Shows basic understanding of AI-generated concepts')
  } else {
    reasons.push('Lacks evidence of understanding AI-generated content')
    qualityScore -= 25
    recommendations.push('Demonstrate understanding by explaining concepts in your own words')
  }

  if (originalInsights.hasUniqueIdeas) {
    reasons.push('Contains original ideas and unique perspectives')
    qualityScore += 20
  } else if (originalInsights.hasPersonalApplication) {
    reasons.push('Shows personal application of AI-generated concepts')
    qualityScore += 10
  } else {
    reasons.push('Lacks original thinking or personal application')
    qualityScore -= 20
    recommendations.push('Add your own insights and unique perspectives to the content')
  }

  // Adjust for submission type expectations
  if (submissionType === 'tech_second_year' && qualityScore < 60) {
    qualityScore -= 10 // Higher expectations for second years
    recommendations.push('As a second-year student, demonstrate more sophisticated AI integration')
  } else if (submissionType === 'tech_first_year' && qualityScore > 40) {
    qualityScore += 10 // More lenient for first years showing effort
  }

  // Determine usage quality
  let usageQuality: 'excellent' | 'good' | 'acceptable' | 'poor'
  if (qualityScore >= 85) usageQuality = 'excellent'
  else if (qualityScore >= 70) usageQuality = 'good'
  else if (qualityScore >= 50) usageQuality = 'acceptable'
  else usageQuality = 'poor'

  return {
    usageQuality,
    confidence: Math.min(aiDetection.confidence + 0.2, 1),
    reasons,
    recommendations,
    score: Math.max(0, Math.min(100, qualityScore))
  }
}

/**
 * Analyze personal elements in content
 */
function analyzePersonalElements(content: string): {
  hasPersonalExamples: boolean
  hasPersonalVoice: boolean
  hasSpecificDetails: boolean
} {
  // Look for personal indicators
  const personalPronouns = /\b(I|my|me|we|our|us)\b/gi
  const personalExamples = /\b(when I|in my experience|I learned|I discovered|I found|I realized)\b/gi
  const specificDetails = /\b(at university|in class|during|last year|recently|specifically)\b/gi
  
  return {
    hasPersonalExamples: personalExamples.test(content) && (content.match(personalPronouns) || []).length >= 3,
    hasPersonalVoice: (content.match(personalPronouns) || []).length >= 5,
    hasSpecificDetails: specificDetails.test(content) && content.length > 200
  }
}

/**
 * Analyze technical depth and understanding
 */
function analyzeTechnicalDepth(content: string, type: string): {
  hasDeepUnderstanding: boolean
  hasBasicUnderstanding: boolean
  hasExamples: boolean
} {
  const technicalTerms = type.includes('tech') 
    ? /\b(algorithm|function|variable|class|method|API|database|framework|library|component)\b/gi
    : /\b(strategy|market|business|customer|revenue|growth|analysis|implementation)\b/gi
    
  const explanationWords = /\b(because|since|therefore|however|although|specifically|for example|such as)\b/gi
  const codeExamples = /```|`[^`]+`|\b(const|let|var|function|class|if|for|while)\b/gi
  
  const termCount = (content.match(technicalTerms) || []).length
  const explanationCount = (content.match(explanationWords) || []).length
  const hasCode = codeExamples.test(content)
  
  return {
    hasDeepUnderstanding: termCount >= 5 && explanationCount >= 3,
    hasBasicUnderstanding: termCount >= 2 && explanationCount >= 1,
    hasExamples: hasCode || content.includes('example') || content.includes('instance')
  }
}

/**
 * Analyze original insights and creativity
 */
function analyzeOriginalInsights(content: string): {
  hasUniqueIdeas: boolean
  hasPersonalApplication: boolean
  hasCreativeSolutions: boolean
} {
  const originalityMarkers = /\b(I think|I believe|my approach|my solution|I would|I propose|alternatively|instead)\b/gi
  const creativeWords = /\b(innovative|creative|unique|novel|different|improve|enhance|optimize)\b/gi
  const applicationWords = /\b(apply|use|implement|adapt|modify|customize|integrate)\b/gi
  
  return {
    hasUniqueIdeas: (content.match(originalityMarkers) || []).length >= 2,
    hasPersonalApplication: applicationWords.test(content) && content.includes('I'),
    hasCreativeSolutions: creativeWords.test(content) && (content.match(originalityMarkers) || []).length >= 1
  }
}

/**
 * Legacy function - kept for backward compatibility
 * Detects AI-generated content in corporate submissions
 * Focuses on identifying blatant AI-generated responses
 */
export function detectAIGeneratedContent(content: string): {
  isAIGenerated: boolean
  confidence: number
  reasons: string[]
  shouldReducePoints: boolean
} {
  const reasons: string[] = []
  let confidence = 0
  let shouldReducePoints = false

  // Check for common AI response patterns
  const aiResponsePatterns = [
    /I understand that/gi,
    /It is important to note/gi,
    /Furthermore/gi,
    /In conclusion/gi,
    /As an AI/gi,
    /I cannot/gi,
    /I don't have access/gi,
    /I would recommend/gi,
    /It is crucial to/gi,
    /In order to/gi,
    /It is essential/gi,
    /I would suggest/gi,
    /It is worth noting/gi,
    /I believe that/gi,
    /It is my understanding/gi,
    /I would like to/gi,
    /It is my opinion/gi,
    /I would argue that/gi,
    /It is clear that/gi,
    /I would emphasize/gi,
  ]

  let aiPatternCount = 0
  for (const pattern of aiResponsePatterns) {
    if (pattern.test(content)) {
      aiPatternCount++
    }
  }

  if (aiPatternCount >= 2) {
    reasons.push(`Multiple AI response patterns detected (${aiPatternCount} patterns)`)
    confidence += 0.3
  }

  // Check for overly formal/robotic language
  const formalPatterns = [
    /utilize/gi,
    /facilitate/gi,
    /implement/gi,
    /leverage/gi,
    /optimize/gi,
    /streamline/gi,
    /enhance/gi,
    /foster/gi,
    /cultivate/gi,
    /endeavor/gi,
  ]

  let formalCount = 0
  for (const pattern of formalPatterns) {
    if (pattern.test(content)) {
      formalCount++
    }
  }

  if (formalCount >= 4) {
    reasons.push('Excessive use of formal/corporate buzzwords')
    confidence += 0.2
  }

  // Check for generic responses without personal context
  const genericPatterns = [
    /team members/gi,
    /stakeholders/gi,
    /best practices/gi,
    /industry standards/gi,
    /proven methodologies/gi,
    /comprehensive approach/gi,
    /strategic planning/gi,
    /effective communication/gi,
  ]

  let genericCount = 0
  for (const pattern of genericPatterns) {
    if (pattern.test(content)) {
      genericCount++
    }
  }

  if (genericCount >= 3) {
    reasons.push('Generic corporate language without personal context')
    confidence += 0.2
  }

  // Check for lack of personal pronouns or specific examples
  const personalPronouns = /I |my |me |we |our |us /gi
  const personalCount = (content.match(personalPronouns) || []).length

  if (personalCount < 3 && content.length > 200) {
    reasons.push('Lack of personal pronouns or specific examples')
    confidence += 0.2
  }

  // Check for repetitive sentence structures
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length >= 3) {
    const firstWords = sentences.map(s => s.trim().split(' ')[0].toLowerCase())
    const uniqueFirstWords = new Set(firstWords)
    
    if (uniqueFirstWords.size < sentences.length * 0.6) {
      reasons.push('Repetitive sentence structures detected')
      confidence += 0.2
    }
  }

  // Determine if points should be reduced
  shouldReducePoints = confidence >= 0.4

  return {
    isAIGenerated: confidence >= 0.5,
    confidence: Math.min(confidence, 1),
    reasons: [...new Set(reasons)],
    shouldReducePoints
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
    let parsed = JSON.parse(responseText) as ReviewResult

    // Post-validation to ensure the model's output is sound
    if (parsed.score < 0 || parsed.score > 1000) {
      throw new Error(`Score validation failed: Score of ${parsed.score} is outside the valid range (0-1000).`)
    }
    if (!parsed.review || parsed.review.trim().length < 50) {
      throw new Error('Review validation failed: Review content is missing or too short.')
    }
    if (!['shortlist', 'reject'].includes(parsed.recommendation)) {
        throw new Error(`Recommendation validation failed: Value "${parsed.recommendation}" is invalid.`)
    }
    
    // Validate individual category scores in the review text (with auto-normalization)
    const normalizedReview = clampCategoryScores(parsed.review)
    const categoryScoreValidation = validateCategoryScores(normalizedReview)
    if (!categoryScoreValidation.isValid) {
      throw new Error(`Invalid category scores: ${categoryScoreValidation.errors.join(', ')}`)
    }
    parsed = { ...parsed, review: normalizedReview }
    
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

/**
 * Clamps any category score that exceeds its declared maximum inside the review text.
 * Example: converts "160/150" to "150/150". This preserves model output while enforcing constraints.
 */
function clampCategoryScores(reviewText: string): string {
  return reviewText.replace(/(\b)(\d+)\/(\d+)(\b)/g, (_full, pre, actualStr, maxStr, post) => {
    const actual = parseInt(actualStr)
    const max = parseInt(maxStr)
    if (Number.isFinite(actual) && Number.isFinite(max) && actual > max) {
      return `${pre}${max}/${max}${post}`
    }
    return `${pre}${actual}/${max}${post}`
  })
}

export async function parseGeminiJsonResponse(raw: string): Promise<ReviewResult> {
  try {
    // Clean the response text
    let cleanedText = raw.trim()
    
    // Remove any markdown formatting that might interfere
    cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '')
    
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
    // Remove trailing commas before } or ]
    jsonText = jsonText.replace(/,\s*(\}|\])/g, '$1')
    
    let parsed: ReviewResult
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      // Fallback: attempt to strip any remaining leading code fences or artifacts
      let loose = jsonText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      // Ensure we only keep from first { to last }
      const sIdx = loose.indexOf('{')
      const eIdx = loose.lastIndexOf('}')
      if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
        loose = loose.slice(sIdx, eIdx + 1)
      }
      loose = loose.replace(/,\s*(\}|\])/g, '$1')
      parsed = JSON.parse(loose)
    }
    
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
    
    // Normalize and validate category scores
    const normalized = clampCategoryScores(parsed.review)
    const categoryScoreValidation = validateCategoryScores(normalized)
    if (!categoryScoreValidation.isValid) {
      throw new Error(`Invalid category scores: ${categoryScoreValidation.errors.join(', ')}`)
    }
    
    return { ...parsed, review: normalized }
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
      recommendation: 'reject' as const
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


