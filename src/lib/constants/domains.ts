// Enhanced domain structure supporting nested subdomains
export const DOMAINS = {
  TECHNICAL: 'Technical',
  CORPORATE: 'Corporate',
  CREATIVE: 'Creative'
} as const

// Support for nested subdomains (e.g., WEB_DEV has FRONTEND/BACKEND)
export const SUB_DOMAINS = {
  TECHNICAL: {
    AI_ML: {
      name: 'AI/ML',
      subdomains: null // No further nesting
    },
    WEB_DEV: {
      name: 'Web Development',
      subdomains: {
        FRONTEND: 'Frontend',
        BACKEND: 'Backend'
      }
    }
  },
  CORPORATE: {
    SPONSORSHIPS_PARTNERSHIPS: {
      name: 'Sponsorships & Partnerships',
      subdomains: null
    },
    EVENT_MANAGEMENT_LOGISTICS: {
      name: 'Event Management & Logistics',
      subdomains: null
    },
    PR_OUTREACH: {
      name: 'PR & Outreach',
      subdomains: null
    },
    TEAM_OPERATIONS: {
      name: 'Team Operations',
      subdomains: null
    },
    CONTENT_WRITING: {
      name: 'Content Writing',
      subdomains: null
    }
  },
  CREATIVE: {
    GRAPHIC_DESIGN: {
      name: 'Graphic Design',
      subdomains: null
    },
    VIDEO_EDITING_MOTION_GRAPHICS: {
      name: 'Video Editing & Motion Graphics',
      subdomains: null
    },
    UI_UX_DESIGN: {
      name: 'UI/UX Design',
      subdomains: null
    }
  }
} as const

// College year options
export const COLLEGE_YEARS = [
  '1st Year',
  '2nd Year',
] as const

// Task difficulty levels
export const TASK_DIFFICULTY = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
] as const

// Task status options
export const TASK_STATUS = [
  'Draft',
  'Published',
  'Closed',
  'Archived'
] as const

// Submission status options
export const SUBMISSION_STATUS = [
  'Submitted',
  'Under Review',
  'Reviewed',
  'Shortlisted',
  'Rejected',
  'Accepted'
] as const

// Leaderboard filters
export const LEADERBOARD_FILTERS = {
  domain: Object.keys(DOMAINS),
  subdomain: Object.keys(SUB_DOMAINS),
  year: COLLEGE_YEARS,
  status: ['All', 'Shortlisted', 'Under Review', 'Accepted']
} as const

export const DEPARTMENTS = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Data Science and Analytics',
  'Artificial Intelligence and Machine Learning',
  'Cybersecurity',
  'Business Administration',
  'Commerce',
  'Economics',
  'Psychology',
  'English',
  'Other'
] as const

// Type definitions for the enhanced domain structure
export type Domain = typeof DOMAINS[keyof typeof DOMAINS]
export type DomainKey = keyof typeof DOMAINS
export type SubDomainKey = keyof typeof SUB_DOMAINS
export type CollegeYear = typeof COLLEGE_YEARS[number]
export type TaskDifficulty = typeof TASK_DIFFICULTY[number]
export type TaskStatus = typeof TASK_STATUS[number]
export type SubmissionStatus = typeof SUBMISSION_STATUS[number]
export type Department = typeof DEPARTMENTS[number]

// Type for subdomain objects
type SubDomainObject = {
  name: string
  subdomains: Record<string, string> | null
}

// Helper function to get subdomain info
export function getSubDomainInfo(domain: DomainKey, subdomain: string) {
  const domainSubdomains = SUB_DOMAINS[domain]
  if (!domainSubdomains) return null

  const subdomainKey = Object.keys(domainSubdomains).find(
    key => {
      const subDomainObj = domainSubdomains[key as keyof typeof domainSubdomains] as SubDomainObject
      return key === subdomain || (subDomainObj && subDomainObj.name === subdomain)
    }
  )

  if (subdomainKey) {
    return domainSubdomains[subdomainKey as keyof typeof domainSubdomains] as SubDomainObject
  }

  return null
}

// Helper function to get all available subdomains for a domain
export function getDomainSubdomains(domain: DomainKey) {
  const domainSubdomains = SUB_DOMAINS[domain]
  if (!domainSubdomains) return []

  return Object.keys(domainSubdomains).map(key => {
    const subdomainObj = domainSubdomains[key as keyof typeof domainSubdomains] as SubDomainObject
    return {
      key,
      ...subdomainObj
    }
  })
}

// Helper function to get subdomain options with nested support
export function getSubdomainOptions(domain: DomainKey) {
  const subdomains = getDomainSubdomains(domain)
  const options: Array<{ value: string; label: string; nested?: Array<{ value: string; label: string }> }> = []

  subdomains.forEach(subdomain => {
    const option: { value: string; label: string; nested?: Array<{ value: string; label: string }> } = {
      value: subdomain.key,
      label: subdomain.name
    }

    if (subdomain.subdomains) {
      option.nested = Object.entries(subdomain.subdomains).map(([key, label]) => ({
        value: key,
        label
      }))
    }

    options.push(option)
  })

  return options
}
