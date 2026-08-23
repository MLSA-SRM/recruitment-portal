export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/BfZprjZU1R50RCtCEueR8N?s=qt&p=a&mlu=4'

// Admin accounts that log in from outside the @srmist.edu.in domain
const ADMIN_EMAIL_ALLOWLIST = ['mlsasrm14@gmail.com']

export function isAllowedSignInEmail(email: string): boolean {
  return email.endsWith('@srmist.edu.in') || ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase())
}

export const DOMAIN_SUBDOMAINS = {
  Technical: [
    'Web Development: Frontend',
    'Web Development: Backend', 
    'AI/ML'
  ],
  Corporate: [
    'Sponsorship',
    'Event Management & Logistics',
    'Operations',
    'PR & Outreach',
    'Content Writing'
  ],
  Creatives: [
    'Graphic Design',
    'Photography',
    'UI/UX Design',
    'Videography'
  ]
}

export type Domain = keyof typeof DOMAIN_SUBDOMAINS
export type Subdomain = string

export const ALL_DOMAINS = Object.keys(DOMAIN_SUBDOMAINS) as Domain[]
export const ALL_SUBDOMAINS = Object.values(DOMAIN_SUBDOMAINS).flat()

// Helper function to get subdomains for a specific domain
export function getSubdomainsForDomain(domain: Domain): string[] {
  return DOMAIN_SUBDOMAINS[domain] || []
}

// Helper function to get domain for a subdomain
export function getDomainForSubdomain(subdomain: string): Domain | null {
  for (const [domain, subdomains] of Object.entries(DOMAIN_SUBDOMAINS)) {
    if (subdomains.includes(subdomain)) {
      return domain as Domain
    }
  }
  return null
}

// One color per domain (not per subdomain) so tasks are visually distinguishable at a glance
export const DOMAIN_COLORS: Record<string, { badge: string; border: string; text: string; dot: string; soft: string }> = {
  Technical: { badge: 'bg-blue-100 text-blue-700 hover:bg-blue-200', border: 'border-l-blue-500', text: 'text-blue-700', dot: 'bg-blue-500', soft: 'bg-blue-50 border-blue-200' },
  Corporate: { badge: 'bg-amber-100 text-amber-700 hover:bg-amber-200', border: 'border-l-amber-500', text: 'text-amber-700', dot: 'bg-amber-500', soft: 'bg-amber-50 border-amber-200' },
  Creatives: { badge: 'bg-pink-100 text-pink-700 hover:bg-pink-200', border: 'border-l-pink-500', text: 'text-pink-700', dot: 'bg-pink-500', soft: 'bg-pink-50 border-pink-200' },
}

const DEFAULT_DOMAIN_COLOR = { badge: 'bg-gray-100 text-gray-700 hover:bg-gray-200', border: 'border-l-gray-400', text: 'text-gray-700', dot: 'bg-gray-400', soft: 'bg-gray-50 border-gray-200' }

export function getDomainColor(domain: string) {
  return DOMAIN_COLORS[domain] ?? DEFAULT_DOMAIN_COLOR
}
