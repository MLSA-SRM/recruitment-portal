'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MultiSelect from '@/components/ui/multi-select'
import { useRouter } from 'next/navigation'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'

export default function ProfileSetupPage() {
  const [formData, setFormData] = useState({
    name: '',
    ra_number: '',
    phone_number: '',
    department: '',
    branch: '',
    year: '',
    domain: '', // Legacy field
    subdomain: '', // Legacy field
    domains: [] as string[], // New field for multiple domains
    subdomains: [] as string[] // New field for multiple subdomains
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
      const supabase = createSupabaseClient()

  useEffect(() => {
    // Check if user is authenticated and if they already have a profile
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        // User already has a profile, redirect to dashboard
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate that at least one domain and subdomain is selected
    if (formData.domains.length === 0) {
      setMessage('Please select at least one domain')
      setLoading(false)
      return
    }

    if (formData.subdomains.length === 0) {
      setMessage('Please select at least one subdomain')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: formData.name,
          ra_number: formData.ra_number,
          phone_number: formData.phone_number ? parseInt(formData.phone_number) : null,
          department: formData.department,
          branch: formData.branch,
          year: formData.year ? parseInt(formData.year) : null,
          domain: formData.domains[0] || formData.domain, // Legacy field - use first domain
          subdomain: formData.subdomains[0] || formData.subdomain, // Legacy field - use first subdomain
          domains: formData.domains.length > 0 ? formData.domains : null,
          subdomains: formData.subdomains.length > 0 ? formData.subdomains : null
        })

      if (error) {
        // Handle specific error cases with user-friendly messages
        if (error.code === '23505' && error.message.includes('profiles_ra_number_key')) {
          setMessage('RA Number already exists. Please use a different RA Number.')
        } else {
          setMessage(error.message)
        }
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            Please provide your details to complete your profile setup and start applying for positions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Full Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">RA Number *</label>
            <Input
              name="ra_number"
              value={formData.ra_number}
              onChange={(e) => setFormData({ ...formData, ra_number: e.target.value })}
              placeholder="e.g., RA2211003010001"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <Input
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="e.g., 9876543210"
              className="text-base"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Department *</label>
            <Input
              name="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Computer Science, Information Technology, Electronics"
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Branch *</label>
            <Input
              name="branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="e.g., Computer Science, Information Technology, Electronics"
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Year *</label>
            <select
              name="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Domains *</label>
            <MultiSelect
              options={Object.keys(DOMAIN_SUBDOMAINS).map(domain => ({
                value: domain,
                label: domain
              }))}
              value={formData.domains}
              onChange={(domains) => {
                // Filter subdomains to only include those from selected domains
                const availableSubdomains = domains.flatMap(domain => 
                  DOMAIN_SUBDOMAINS[domain as Domain] || []
                )
                const filteredSubdomains = formData.subdomains.filter(subdomain =>
                  availableSubdomains.includes(subdomain)
                )
                
                setFormData({ 
                  ...formData, 
                  domains,
                  subdomains: filteredSubdomains
                })
              }}
              placeholder="Select one or more domains..."
              maxSelections={3}
            />
            <p className="text-xs text-gray-500">You can select up to 3 domains</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subdomains *</label>
            <MultiSelect
              options={formData.domains.flatMap(domain => 
                DOMAIN_SUBDOMAINS[domain as Domain]?.map(subdomain => ({
                  value: subdomain,
                  label: subdomain
                })) || []
              )}
              value={formData.subdomains}
              onChange={(subdomains) => setFormData({ ...formData, subdomains })}
              placeholder="Select subdomains from your chosen domains..."
              disabled={formData.domains.length === 0}
              maxSelections={10}
            />
            <p className="text-xs text-gray-500">
              {formData.domains.length === 0 
                ? "Please select domains first" 
                : "You can select up to 10 subdomains from your chosen domains"
              }
            </p>
          </div>



          {message && (
            <div className="text-sm text-center">
              <span className="text-red-600">{message}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  )
}
