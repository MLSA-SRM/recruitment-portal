'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    domain: '',
    subdomain: ''
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
          domain: formData.domain,
          subdomain: formData.subdomain
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
            <label className="text-sm font-medium">Domain *</label>
            <select
              name="domain"
              value={formData.domain}
              onChange={(e) => {
                const domain = e.target.value as Domain
                setFormData({ 
                  ...formData, 
                  domain, 
                  subdomain: '' // Reset subdomain when domain changes
                })
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Domain</option>
              {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subdomain *</label>
            <select
              name="subdomain"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.domain}
            >
              <option value="">Select Subdomain</option>
              {formData.domain && DOMAIN_SUBDOMAINS[formData.domain as Domain]?.map((subdomain) => (
                <option key={subdomain} value={subdomain}>{subdomain}</option>
              ))}
            </select>
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
