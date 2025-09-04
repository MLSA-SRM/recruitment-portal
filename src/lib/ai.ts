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
  tech_first_year: (codeBundle: string) => `You are an expert, unbiased code reviewer for a university tech club evaluating a FIRST-YEAR student's technical task.

Provide a score from 0-1000 and a detailed review in markdown format.

In your review, FOLLOW THIS COMPACT STRUCTURE for admin readability (keep it concise):

# Code Review - <Short Title>

## Summary
- One-paragraph overview (2-4 sentences) of overall quality

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Code Quality & Structure | xx/300 | 1-2 short reasons |
| Functionality & Correctness | xx/300 | 1-2 short reasons |
| Modern Practices | xx/200 | 1-2 short reasons |
| Documentation | xx/100 | 1-2 short reasons |
| AI Plagiarism | xx/100 | 1-2 short reasons |

## Highlights
- 3-5 bullet points of positives

## Issues / Risks
- 3-5 bullet points of most important problems (short, actionable)

## Recommendations
- 4-6 specific improvement actions (concise, prioritized)

CONSTRAINTS:
- Keep review concise (≈300-500 words)
- Use clear headings, bullets, and the small table above

STUDENT CODE:
${codeBundle}`,
  
  tech_second_year: (codeBundle: string) => `You are an expert, unbiased code reviewer for a university tech club evaluating a SECOND-YEAR student's technical task.

Provide a score from 0-1000 and a detailed review in markdown format.

In your review, FOLLOW THIS COMPACT STRUCTURE for admin readability (keep it concise):

# Code Review - <Short Title>

## Summary
- One-paragraph overview (2-4 sentences) of overall quality

## Score Breakdown
| Area | Points | Why points were deducted |
| --- | --- | --- |
| Code Quality & Structure | xx/300 | 1-2 short reasons |
| Functionality & Correctness | xx/300 | 1-2 short reasons |
| Modern Practices | xx/200 | 1-2 short reasons |
| Documentation | xx/100 | 1-2 short reasons |
| AI Plagiarism | xx/100 | 1-2 short reasons |

## Highlights
- 3-5 bullet points of positives

## Issues / Risks
- 3-5 bullet points of most important problems (short, actionable)

## Recommendations
- 4-6 specific improvement actions (concise, prioritized)

CONSTRAINTS:
- Keep review concise (≈300-500 words)
- Use clear headings, bullets, and the small table above

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


