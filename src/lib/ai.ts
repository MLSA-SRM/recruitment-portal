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
  tech_first_year: (codeBundle: string, taskType?: string) => `You are an expert, unbiased code reviewer for MSA (Microsoft Student Ambassadors evaluating a FIRST-YEAR student's technical task.

**TASK CONTEXT:** This is a 1st year student submission for MSA recruitment. Be encouraging but thorough in your evaluation.

**EVALUATION CRITERIA FOR 1ST YEARS:**
- Focus on learning effort and basic understanding
- Reward attempts at best practices, even if imperfect
- Consider this is likely their first major technical project
- Look for evidence of genuine learning and problem-solving

Provide a score from 0-1000 and a detailed review in markdown format.

In your review, FOLLOW THIS COMPACT STRUCTURE for admin readability (keep it concise):

# Code Review - <Short Title>

## Summary
- One-paragraph overview (2-4 sentences) of overall quality and learning effort

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Code Quality & Structure | xx/250 | 1-2 short reasons |
| Functionality & Correctness | xx/250 | 1-2 short reasons |
| Learning Effort & Understanding | xx/200 | 1-2 short reasons |
| Documentation & Presentation | xx/150 | 1-2 short reasons |
| AI Plagiarism Detection | xx/150 | 1-2 short reasons |

## Highlights
- 3-5 bullet points of positives and learning achievements

## Areas for Growth
- 3-5 bullet points of improvement opportunities (constructive, not harsh)

## Recommendations
- 4-6 specific, encouraging improvement actions (prioritized for learning)

**TASK-SPECIFIC GUIDELINES:**
${getTaskSpecificGuidelines(taskType, 'first_year')}

**AI PLAGIARISM DETECTION GUIDELINES:**
- Look for signs of AI-generated code (overly perfect structure, generic variable names, lack of personal style)
- Check for copied tutorials without understanding (identical code patterns, no modifications)
- Verify if the student shows understanding of their own code through comments or explanations
- Consider that some similarity to tutorials is acceptable for 1st years, but should show learning effort
- Deduct points for obvious copy-paste without any personalization or understanding

CONSTRAINTS:
- Keep review concise (≈300-500 words)
- Use encouraging tone appropriate for 1st year students
- Focus on learning potential and effort
- Use clear headings, bullets, and the small table above

STUDENT CODE:
${codeBundle}`,
  
  tech_second_year: (codeBundle: string, taskType?: string) => `You are an expert, unbiased code reviewer for MSA (Microsoft Student Ambassadors) evaluating a SECOND-YEAR student's technical task.

**TASK CONTEXT:** This is a 2nd year student submission for MSA recruitment. Expect better standards and more better approaches.

**EVALUATION CRITERIA FOR 2ND YEARS:**
- Expect understanding of programming fundamentals
- Look for evidence of advanced concepts and best practices
- Consider framework usage, architecture decisions, and scalability
- Evaluate problem-solving approach and technical depth

Provide a score from 0-1000 and a detailed review in markdown format.

In your review, FOLLOW THIS COMPACT STRUCTURE for admin readability (keep it concise):

# Code Review - <Short Title>

## Summary
- One-paragraph overview (2-4 sentences) of overall quality and technical sophistication

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Code Quality & Architecture | xx/300 | 1-2 short reasons |
| Functionality & Correctness | xx/300 | 1-2 short reasons |
| Advanced Practices & Patterns | xx/200 | 1-2 short reasons |
| Documentation & Deployment | xx/100 | 1-2 short reasons |
| AI Plagiarism Detection | xx/100 | 1-2 short reasons |

## Highlights
- 3-5 bullet points of technical strengths and innovations

## Issues / Risks
- 3-5 bullet points of most important problems (technical focus)

## Recommendations
- 4-6 specific improvement actions (concise, prioritized for growth)

**TASK-SPECIFIC GUIDELINES:**
${getTaskSpecificGuidelines(taskType, 'second_year')}

**AI PLAGIARISM DETECTION GUIDELINES:**
- Look for signs of AI-generated code (overly perfect structure, generic patterns, lack of personal coding style)
- Check for copied code without proper attribution or understanding (identical implementations, no modifications)
- Verify if the student demonstrates deep understanding through custom implementations or modifications
- Expect higher standards for 2nd years - they should show more original thinking and problem-solving
- Deduct significant points for obvious copy-paste without understanding or personalization
- Look for evidence of learning and adaptation rather than direct copying

CONSTRAINTS:
- Keep review concise (≈300-500 words)
- Use clear headings, bullets, and the small table above
- Focus on technical excellence and professional standards

STUDENT CODE:
${codeBundle}`,
  
  corporate: (textContent: string) => `You are reviewing a CORPORATE recruitment task submission (proposal/email/plan).

Provide a score from 0-1000 and a detailed review in markdown format.

In your review, FOLLOW THIS COMPACT STRUCTURE for admin readability (keep it concise):

# Review - <Short Title>

## Summary
- One-paragraph overview (2-4 sentences) of overall quality and suitability

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Clarity & Structure | xx/400 | 1-2 short reasons |
| Professional Tone | xx/300 | 1-2 short reasons |
| Creativity | xx/200 | 1-2 short reasons |
| Formatting/Docs | xx/100 | 1-2 short reasons |

## Strengths
- 3-5 bullets

## Gaps / Concerns
- 3-5 bullets

## Recommendations
- 4-6 concise, prioritized actions

CONSTRAINTS:
- Keep review concise (≈300-500 words)
- Use clear headings, bullets, and the small table above

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


