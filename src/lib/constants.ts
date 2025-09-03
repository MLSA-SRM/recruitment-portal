export const DOMAIN_SUBDOMAINS = {
  Technical: [
    'Web Development: Frontend',
    'Web Development: Backend', 
    'Web Development: Full Stack',
    'AI/ML'
  ],
  Corporate: [
    'Sponsorships & Partnerships',
    'Event Management & Logistics',
    'PR & Outreach',
    'Team Operations',
    'Content Writing'
  ],
  Creatives: [
    'Graphic Design',
    'Video Editing & Motion Graphics',
    'UI/UX Design'
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
