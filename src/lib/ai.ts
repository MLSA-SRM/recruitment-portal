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
  return genAI.getGenerativeModel({ model: modelName })
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
        maxOutputTokens: 800,
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

**CONTEXT:** First years are beginners. Assume only ~30% can use a framework. Do NOT penalize for not using a framework. Reward working vanilla solutions and genuine learning.

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
  
  tech_second_year: (codeBundle: string, taskType?: string) => `You are an expert, unbiased code reviewer for MSA evaluating a SECOND-YEAR student's technical task.

**CONTEXT:** Second years are early-stage developers. Expect some exposure to frameworks/tools, but assume many are still learning (roughly 30% comfortable with frameworks). Judge fairly given this reality.

Provide a score from 0-1000 and a concise markdown review.

# Code Review - <Short Title>

## Summary
- 2-4 sentences on overall quality and technical depth

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Code Quality & Architecture | xx/250 | structure, decomposition, naming |
| Functionality & Correctness | xx/250 | required features work (tests optional; bonus if present) |
| Appropriate Tools/Framework Use (optional) | xx/150 | used when it adds value; no penalty if not needed |
| Best Practices (types, errors, security) | xx/150 | validation, error handling, accessibility |
| Documentation & Deployment | xx/100 | README, scripts, deploy notes |
| Originality (AI/Copying checks) | xx/100 | signs of copying |

## Highlights
- 3-5 technical strengths and good decisions

## Issues / Risks
- 3-5 key problems to address next

## Recommendations
- 4-6 concrete, prioritized improvements

**EXPECTATIONS FOR 2ND YEARS:**
- Frameworks are welcome but not required; prioritize correctness and clarity
- Reward sensible architecture and pragmatic tool choice
- Tests are optional; no penalty for absence. Reward thoughtful tests if included

**TASK-SPECIFIC GUIDELINES:**
${getTaskSpecificGuidelines(taskType, 'second_year')}

**ORIGINALITY / PLAGIARISM SCORING RULES:**
- Start originality at 100 and DEDUCT ONLY for evidence of copying/AI without understanding
- If no signs of copying and the work appears original, award 90-100 in the Originality row
- If uncertain but likely original, award 70-90 with a brief note
- If likely copied or AI-generated without understanding, deduct (possibly to 0 for severe cases) and explain

CONSTRAINTS:
- Keep review concise (≈300-500 words) with the table above
- Professional tone focused on practical growth

STUDENT CODE:
${codeBundle}`,
  
  corporate: (textContent: string) => `You are reviewing a CORPORATE recruitment task submission (proposal/email/plan).

Judge primarily on real‑world suitability and practicality, with creativity as a positive. Detect and flag plagiarism; reduce points accordingly.

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


