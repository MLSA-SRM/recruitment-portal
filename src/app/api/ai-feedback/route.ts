import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { GitHubAnalyzer } from '@/lib/github'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Create service role client for bypassing RLS when inserting feedback
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get submission details first
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        problem_statements (
          title,
          description,
          domain,
          sub_domain,
          requirements
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Get user profile separately with better error handling
    let profile = null
    let profileError = null

    try {
      const profileResult = await adminSupabase
        .from('profiles')
        .select(`
          full_name,
          registration_number,
          department,
          domains,
          sub_domains
        `)
        .eq('id', submission.user_id)
        .maybeSingle()

      profile = profileResult.data
      profileError = profileResult.error

      // Log for debugging
      if (profileError) {
        console.warn('Profile lookup error:', {
          submissionId: submissionId,
          userId: submission.user_id,
          error: profileError
        })

        // Note: Profile creation should happen during user registration/onboarding
        // For now, we'll use fallback values and log the issue for admin attention
        console.error('CRITICAL: Profile missing for user:', submission.user_id, '- This should be investigated by admin')
      }
    } catch (error) {
      console.error('Profile fetch exception:', error)
    }

    // Create fallback profile if still not found
    if (!profile) {
      console.warn('Using fallback profile for submission:', submissionId)
      profile = {
        full_name: 'Unknown User',
        registration_number: 'N/A',
        department: 'Not Specified',
        domains: [],
        sub_domains: []
      }
    }

    // Attach profile to submission for consistency with existing code
    const submissionWithProfile = {
      ...submission,
      profiles: profile
    }

    // Analyze GitHub repository if GitHub link is provided
    let codeAnalysis = null
    if (submissionWithProfile.github_link && process.env.GITHUB_ACCESS_TOKEN && process.env.GITHUB_ACCESS_TOKEN !== 'your_github_token_here') {
      try {
        const githubAnalyzer = new GitHubAnalyzer(process.env.GITHUB_ACCESS_TOKEN)
        codeAnalysis = await githubAnalyzer.analyzeCodebase(submissionWithProfile.github_link)
        console.log('GitHub analysis completed for:', submissionWithProfile.github_link)
      } catch (error) {
        console.warn('GitHub analysis failed:', error)
        // Continue without GitHub analysis
      }
    }

    // Check if feedback already exists for this submission (using admin client)
    const { data: existingFeedback } = await adminSupabase
      .from('feedback')
      .select('id')
      .eq('submission_id', submissionId)
      .single()

    // Generate structured feedback with separate admin and user sections
    const prompt = `
      You are an expert evaluator for Microsoft Student Ambassador recruitment. Please provide a comprehensive analysis of this submission.

      SUBMISSION DETAILS:
      Problem Statement: ${submissionWithProfile.problem_statements?.title}
      Description: ${submissionWithProfile.problem_statements?.description}
      Requirements: ${submissionWithProfile.problem_statements?.requirements?.join(', ') || 'None specified'}
      Domain: ${submissionWithProfile.problem_statements?.domain} - ${submissionWithProfile.problem_statements?.sub_domain}

      CANDIDATE INFORMATION:
      - Name: ${submissionWithProfile.profiles?.full_name}
      - Department: ${submissionWithProfile.profiles?.department}
      - Registration Number: ${submissionWithProfile.profiles?.registration_number}
      - Domains of Interest: ${submissionWithProfile.profiles?.domains?.join(', ') || 'None'}
      - Sub-domains: ${submissionWithProfile.profiles?.sub_domains?.join(', ') || 'None'}

      SUBMISSION CONTENT:
      - GitHub Link: ${submissionWithProfile.github_link || 'Not provided'}
      - Deployed Link: ${submissionWithProfile.deployed_link || 'Not provided'}
      - Description: ${submissionWithProfile.description || 'No description provided'}
      - Submitted: ${new Date(submissionWithProfile.created_at).toLocaleDateString()}

      ${codeAnalysis ? `
      GITHUB REPOSITORY ANALYSIS:
      Repository: ${codeAnalysis.repository.full_name}
      Description: ${codeAnalysis.repository.description || 'No description'}
      Primary Language: ${codeAnalysis.repository.language}
      Languages Used: ${Object.keys(codeAnalysis.repository.languages).join(', ')}
      Repository Size: ${codeAnalysis.repository.size} KB
      Created: ${new Date(codeAnalysis.repository.created_at).toLocaleDateString()}
      Last Updated: ${new Date(codeAnalysis.repository.updated_at).toLocaleDateString()}

      CODE STRUCTURE ANALYSIS:
      - Total Files: ${codeAnalysis.analysis.totalFiles}
      - Code Files: ${codeAnalysis.analysis.codeFiles}
      - Documentation Files: ${codeAnalysis.analysis.documentationFiles}
      - Config Files: ${codeAnalysis.analysis.configFiles}
      - Has README: ${codeAnalysis.analysis.hasReadme ? 'Yes' : 'No'}
      - Has Tests: ${codeAnalysis.analysis.hasTests ? 'Yes' : 'No'}
      - Has Documentation: ${codeAnalysis.analysis.hasDocumentation ? 'Yes' : 'No'}

      RECENT COMMITS:
      ${codeAnalysis.commits.slice(0, 3).map(commit => 
        `- ${commit.commit.message} (${new Date(commit.commit.author.date).toLocaleDateString()}) by ${commit.commit.author.name}`
      ).join('\n')}

      KEY FILES ANALYZED:
      ${codeAnalysis.keyFiles.slice(0, 5).map(file => 
        `\n--- ${file.path} (${file.type}) ---\n${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}`
      ).join('\n')}
      ` : 'GitHub repository analysis not available (no GitHub link provided or GitHub token not configured).'}

      IMPORTANT: Please provide your response in this EXACT format with clear separators:

      ===ADMIN_FEEDBACK_START===
      ## ADMIN EVALUATION

      **Overall Score: X/10**
      **Originality Score: X/10**

      **Technical Assessment:**
      1. Implementation Quality: [Detailed assessment]
      2. Code Organization: [Assessment]
      3. Technology Choices: [Assessment]
      4. Problem-solving Approach: [Assessment]
      5. Code Quality & Best Practices: [Assessment]
      6. Documentation & Presentation: [Assessment]
      7. Innovation & Creativity: [Assessment]
      8. Domain-specific Skills: [Assessment]

      **Plagiarism Risk Assessment:**
      - Risk Level: [LOW/MEDIUM/HIGH]
      - Code Originality: [Analysis]
      - Template Usage: [Assessment]
      - Attribution: [Assessment]
      - Red Flags: [Any concerns]

      **Final Decision: [SHORTLIST/REVIEW REQUIRED/REJECT]**

      **Reasoning:**
      [Detailed explanation of the recommendation]

      **Admin Notes:**
      [Private notes for admin consideration]
      ===ADMIN_FEEDBACK_END===

      ===USER_FEEDBACK_START===
      ## Technical Feedback

      **Strengths:**
      - [List positive aspects without scores]
      - [Focus on what they did well]
      - [Highlight good practices]

      **Areas for Improvement:**
      - [Specific, actionable suggestions]
      - [Focus on learning opportunities]
      - [Constructive guidance for growth]

      **Technical Observations:**
      - Implementation Approach: [Constructive feedback on their approach]
      - Code Structure: [Feedback on organization and clarity]
      - Technology Usage: [Comments on tool and framework choices]
      - Documentation: [Feedback on README and code comments]
      - Best Practices: [Suggestions for improvement]

      **Next Steps:**
      - [Specific recommendations for improvement]
      - [Learning resources or areas to focus on]
      - [Encouragement and positive reinforcement]

      **Note:** This feedback is designed to help you grow as a developer. Keep building, keep learning, and keep improving!
      ===USER_FEEDBACK_END===

      Keep all feedback constructive, professional, and focused on growth. The user feedback should be encouraging while providing actionable insights.
    `

    // Generate AI feedback
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const aiResponse = result.response.text()

    // Parse the structured response
    const adminStart = aiResponse.indexOf('===ADMIN_FEEDBACK_START===')
    const adminEnd = aiResponse.indexOf('===ADMIN_FEEDBACK_END===')
    const userStart = aiResponse.indexOf('===USER_FEEDBACK_START===')
    const userEnd = aiResponse.indexOf('===USER_FEEDBACK_END===')

    let adminFeedback = ''
    let userFeedback = ''

    if (adminStart !== -1 && adminEnd !== -1) {
      adminFeedback = aiResponse.substring(adminStart + 27, adminEnd).trim()
    }

    if (userStart !== -1 && userEnd !== -1) {
      userFeedback = aiResponse.substring(userStart + 25, userEnd).trim()
    }

    // Fallback if parsing fails - use the entire response as admin feedback
    if (!adminFeedback && !userFeedback) {
      adminFeedback = aiResponse
      userFeedback = "Technical feedback is being processed. Please check back later."
    }

    // Create structured feedback object
    const structuredFeedback = {
      admin_feedback: adminFeedback,
      user_feedback: userFeedback,
      full_response: aiResponse,
      parsed_successfully: !!(adminFeedback && userFeedback)
    }

    // Save or update feedback in database (using admin client to bypass RLS)
    let feedbackData
    if (existingFeedback) {
      const { data, error } = await adminSupabase
        .from('feedback')
        .update({
          feedback_text: JSON.stringify(structuredFeedback),
          feedback_type: 'comprehensive',
          is_shared: false,
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)
        .select()
        .single()

      if (error) throw error
      feedbackData = data
    } else {
      const { data, error } = await adminSupabase
        .from('feedback')
        .insert({
          submission_id: submissionId,
          feedback_text: JSON.stringify(structuredFeedback),
          feedback_type: 'comprehensive',
          is_shared: false
        })
        .select()
        .single()

      if (error) throw error
      feedbackData = data
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackData,
      message: 'Comprehensive AI feedback generated successfully'
    })

  } catch (error) {
    console.error('Error generating AI feedback:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI feedback' },
      { status: 500 }
    )
  }
}
