'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import MultiSelect from '@/components/ui/multi-select'
import { useRouter } from 'next/navigation'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

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
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
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

  // Form validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long'
    }
    
    // RA Number validation
    if (!formData.ra_number.trim()) {
      errors.ra_number = 'RA Number is required'
    } else if (!/^RA\d{13}$/.test(formData.ra_number.trim())) {
      errors.ra_number = 'RA Number must be in format RA followed by 13 digits (e.g., RA2211003010001)'
    }
    
    // Phone number validation (optional but if provided, should be valid)
    if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      errors.phone_number = 'Phone number must be exactly 10 digits'
    }
    
    // Department validation
    if (!formData.department.trim()) {
      errors.department = 'Department is required'
    }
    
    // Branch validation
    if (!formData.branch.trim()) {
      errors.branch = 'Branch is required'
    }
    
    // Year validation
    if (!formData.year) {
      errors.year = 'Please select your year'
    }
    
    // Domain validation
    if (formData.domains.length === 0) {
      errors.domains = 'Please select at least one domain'
    }
    
    // Subdomain validation
    if (formData.subdomains.length === 0) {
      errors.subdomains = 'Please select at least one subdomain'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setFieldErrors({})
    setIsValidating(true)

    // Validate form
    if (!validateForm()) {
      setMessage('Please fix the errors below before submitting')
      setMessageType('error')
      setLoading(false)
      setIsValidating(false)
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
          setMessage('This RA Number is already registered. Please use a different RA Number or contact support if this is an error.')
          setMessageType('error')
          setFieldErrors({ ra_number: 'RA Number already exists' })
        } else {
          setMessage('Failed to save your profile. Please try again or contact support if the problem persists.')
          setMessageType('error')
        }
      } else {
        setMessage('Profile completed successfully! Redirecting to dashboard...')
        setMessageType('success')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again or contact support.')
      setMessageType('error')
    } finally {
      setLoading(false)
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto mb-6">
            Please provide your details to complete your profile setup and start applying for positions.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Quick Tips:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• All fields marked with * are required</li>
                  <li>• You can select multiple domains and subdomains</li>
                  <li>• Your RA Number must be in the format: RA + 13 digits</li>
                  <li>• Phone number is optional but recommended</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Full Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (fieldErrors.name) {
                  setFieldErrors({ ...fieldErrors, name: '' })
                }
              }}
              required
              className={`text-base ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {fieldErrors.name && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">RA Number *</label>
            <Input
              name="ra_number"
              value={formData.ra_number}
              onChange={(e) => {
                setFormData({ ...formData, ra_number: e.target.value })
                if (fieldErrors.ra_number) {
                  setFieldErrors({ ...fieldErrors, ra_number: '' })
                }
              }}
              placeholder="e.g., RA2211003010001"
              required
              className={`text-base ${fieldErrors.ra_number ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldErrors.ra_number && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.ra_number}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <Input
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => {
                setFormData({ ...formData, phone_number: e.target.value })
                if (fieldErrors.phone_number) {
                  setFieldErrors({ ...fieldErrors, phone_number: '' })
                }
              }}
              placeholder="e.g., 9876543210"
              className={`text-base ${fieldErrors.phone_number ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldErrors.phone_number && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.phone_number}
              </div>
            )}
            <p className="text-xs text-gray-500">Optional - 10 digits only</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Department *</label>
            <Input
              name="department"
              value={formData.department}
              onChange={(e) => {
                setFormData({ ...formData, department: e.target.value })
                if (fieldErrors.department) {
                  setFieldErrors({ ...fieldErrors, department: '' })
                }
              }}
              placeholder="e.g., Computer Science, Information Technology, Electronics"
              className={`h-12 text-base ${fieldErrors.department ? 'border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {fieldErrors.department && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.department}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Branch *</label>
            <Input
              name="branch"
              value={formData.branch}
              onChange={(e) => {
                setFormData({ ...formData, branch: e.target.value })
                if (fieldErrors.branch) {
                  setFieldErrors({ ...fieldErrors, branch: '' })
                }
              }}
              placeholder="e.g., Computer Science, Information Technology, Electronics"
              className={`h-12 text-base ${fieldErrors.branch ? 'border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {fieldErrors.branch && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.branch}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Year *</label>
            <select
              name="year"
              value={formData.year}
              onChange={(e) => {
                setFormData({ ...formData, year: e.target.value })
                if (fieldErrors.year) {
                  setFieldErrors({ ...fieldErrors, year: '' })
                }
              }}
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                fieldErrors.year 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
            </select>
            {fieldErrors.year && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.year}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Domains *</label>
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
                
                if (fieldErrors.domains) {
                  setFieldErrors({ ...fieldErrors, domains: '' })
                }
              }}
              placeholder="Select one or more domains..."
              maxSelections={3}
            />
            {fieldErrors.domains && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.domains}
              </div>
            )}
            <p className="text-xs text-gray-500">You can select up to 3 domains</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Subdomains *</label>
            <MultiSelect
              options={formData.domains.flatMap(domain => 
                DOMAIN_SUBDOMAINS[domain as Domain]?.map(subdomain => ({
                  value: subdomain,
                  label: subdomain
                })) || []
              )}
              value={formData.subdomains}
              onChange={(subdomains) => {
                setFormData({ ...formData, subdomains })
                if (fieldErrors.subdomains) {
                  setFieldErrors({ ...fieldErrors, subdomains: '' })
                }
              }}
              placeholder="Select subdomains from your chosen domains..."
              disabled={formData.domains.length === 0}
              maxSelections={11}
            />
            {fieldErrors.subdomains && (
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fieldErrors.subdomains}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {formData.domains.length === 0 
                ? "Please select domains first" 
                : "You can select up to 11 subdomains from your chosen domains"
              }
            </p>
          </div>



          {message && (
            <div className={`p-4 rounded-lg border text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : messageType === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {messageType === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                {messageType === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
                {messageType === 'info' && <Info className="h-5 w-5 mr-2" />}
                <span>{message}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={loading || isValidating}
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Profile...
              </div>
            ) : isValidating ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Validating...
              </div>
            ) : (
              'Complete Profile'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
