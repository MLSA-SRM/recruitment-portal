'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import { DOMAIN_SUBDOMAINS, type Domain } from '@/lib/constants'
import { immediateRedirect } from '@/lib/redirect-utils'
import { useAuthRedirect } from '@/lib/use-refresh-handler'
import { User, GraduationCap, Phone, Hash, Building, BookOpen, Calendar, Target, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'

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
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createSupabaseClient()
  const { redirectAfterProfileSetup, redirectToLogin } = useAuthRedirect()

  const totalSteps = 3
  const progressPercentage = (currentStep / totalSteps) * 100

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    // Check if user is authenticated and if they already have a profile
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirectToLogin()
        return
      }

      // Check if user has already completed onboarding
      const { data: authCheck } = await supabase
        .from('auth_check')
        .select('is_onboarding_complete')
        .eq('user_id', user.id)
        .single()

      if (authCheck?.is_onboarding_complete) {
        // User has already completed onboarding, redirect to dashboard with refresh
        immediateRedirect('/dashboard')
      }
    }
    checkUser()
  }, [router, supabase, redirectToLogin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate form data
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.ra_number.trim()) {
      newErrors.ra_number = 'RA Number is required'
    } else if (formData.ra_number.length !== 15) {
      newErrors.ra_number = 'RA Number must be exactly 15 characters'
    } else if (!/^RA(24|25)\d{11}$/.test(formData.ra_number)) {
      newErrors.ra_number = 'RA Number must start with "RA24" or "RA25" followed by 11 digits'
    }
    if (!formData.department.trim()) newErrors.department = 'Department is required'
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required'
    if (!formData.year) newErrors.year = 'Year is required'
    if (formData.domains.length === 0) newErrors.domains = 'Please select at least one domain'
    if (formData.subdomains.length === 0) newErrors.subdomains = 'Please select at least one subdomain'

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      setMessage('Please fill in all required fields')
      setMessageType('error')
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
          setMessageType('error')
        } else {
          setMessage(error.message)
          setMessageType('error')
        }
      } else {
        // Mark onboarding as complete
        const { error: authCheckError } = await supabase
          .from('auth_check')
          .update({ is_onboarding_complete: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)

        if (authCheckError) {
          console.error('Failed to mark onboarding as complete:', authCheckError)
          // Don't fail the entire process, just log the error
        }

        setMessage('Profile created successfully! Redirecting...')
        setMessageType('success')
        redirectAfterProfileSetup()
      }
    } catch {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (!formData.ra_number.trim()) {
        newErrors.ra_number = 'RA Number is required'
      } else if (formData.ra_number.length !== 15) {
        newErrors.ra_number = 'RA Number must be exactly 15 characters'
      } else if (!/^RA(24|25)\d{11}$/.test(formData.ra_number)) {
        newErrors.ra_number = 'RA Number must start with "RA24" or "RA25" followed by 11 digits'
      }
      if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required'
    } else if (step === 2) {
      if (!formData.department.trim()) newErrors.department = 'Department is required'
      if (!formData.branch.trim()) newErrors.branch = 'Branch is required'
      if (!formData.year) newErrors.year = 'Year is required'
    } else if (step === 3) {
      if (formData.domains.length === 0) newErrors.domains = 'Please select at least one domain'
      if (formData.subdomains.length === 0) newErrors.subdomains = 'Please select at least one subdomain'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.name.trim() && formData.ra_number.trim() && formData.phone_number.trim()
    } else if (currentStep === 2) {
      return formData.department.trim() && formData.branch.trim() && formData.year
    } else if (currentStep === 3) {
      return formData.domains.length > 0 && formData.subdomains.length > 0
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                {getInitials(formData.name || 'User')}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let&apos;s set up your profile to get started with MSA SRM tasks and opportunities.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Steps Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Setup Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: 'Personal Info', icon: User, description: 'Basic details' },
                  { step: 2, title: 'Academic Info', icon: GraduationCap, description: 'Department & year' },
                  { step: 3, title: 'Interests', icon: Target, description: 'Domains & skills' }
                ].map(({ step, title, description }) => (
                  <div
                    key={step}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      currentStep === step
                        ? 'bg-blue-50 border border-blue-200'
                        : currentStep > step
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentStep === step
                          ? 'bg-blue-600 text-white'
                          : currentStep > step
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        currentStep >= step ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {title}
                      </p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStep === 1 && <User className="h-5 w-5" />}
                  {currentStep === 2 && <GraduationCap className="h-5 w-5" />}
                  {currentStep === 3 && <Target className="h-5 w-5" />}
                  {currentStep === 1 && 'Personal Information'}
                  {currentStep === 2 && 'Academic Information'}
                  {currentStep === 3 && 'Areas of Interest'}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && 'Tell us about yourself'}
                  {currentStep === 2 && 'Your academic background'}
                  {currentStep === 3 && 'Select your areas of expertise'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </Label>
            <Input
                          id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                          className="h-12 text-base"
              required
            />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

                      <div className="space-y-2">
                        <Label htmlFor="ra_number" className="text-sm font-medium flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          RA Number *
                        </Label>
            <Input
                          id="ra_number"
              value={formData.ra_number}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase()
                            // Allow any input up to 15 characters, validation happens on submit
                            if (value.length <= 15) {
                              setFormData(prev => {
                                const newData = { ...prev, ra_number: value }
                                
                                // Auto-detect year based on RA number prefix
                                if (value.length >= 4) {
                                  const yearPrefix = value.substring(2, 4)
                                  if (yearPrefix === '24') {
                                    newData.year = '2' // Second year
                                  } else if (yearPrefix === '25') {
                                    newData.year = '1' // First year
                                  }
                                  // Only RA24 and RA25 are supported
                                }
                                
                                return newData
                              })
                              // Clear error when user starts typing
                              if (errors.ra_number) {
                                setErrors(prev => ({ ...prev, ra_number: '' }))
                              }
                            }
                          }}
                          placeholder="RA24XXXXXXXXXXX or RA25XXXXXXXXXXX"
                          className="h-12 text-base font-mono"
                          maxLength={15}
              required
                        />
                        <div className="flex justify-between">
                          <p className="text-xs text-gray-500">
                            Only RA24 (2nd year) and RA25 (1st year) numbers are accepted
                          </p>
                          <p className="text-xs text-gray-400">
                            {formData.ra_number.length}/15
                          </p>
                        </div>
                        {errors.ra_number && <p className="text-sm text-red-600">{errors.ra_number}</p>}
          </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number" className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number *
                        </Label>
            <Input
                          id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          placeholder="9876543210"
                          className="h-12 text-base"
                          required
            />
                        {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number}</p>}
                      </div>
          </div>
                  )}

                  {/* Step 2: Academic Information */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Department *
                        </Label>
            <Input
                          id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., C-Tech, Cintel, NWC, DSBS, Etc."
              className="h-12 text-base"
              required
            />
                        {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
          </div>

          <div className="space-y-2">
                        <Label htmlFor="branch" className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Branch *
                        </Label>
            <Input
                          id="branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          placeholder="e.g., Computer Science Engineering, Electronics and Communication Engineering, etc."
              className="h-12 text-base"
              required
            />
                        {errors.branch && <p className="text-sm text-red-600">{errors.branch}</p>}
          </div>

          <div className="space-y-2">
                        <Label htmlFor="year" className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Academic Year *
                          {formData.year && formData.ra_number.length >= 4 && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Auto-detected
                            </span>
                          )}
                        </Label>
                        <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select your year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.year && formData.ra_number.length >= 4 && (
                          <p className="text-xs text-green-600">
                            Year automatically detected from RA number: {formData.ra_number.substring(2, 4)}
                          </p>
                        )}
                        {errors.year && <p className="text-sm text-red-600">{errors.year}</p>}
                      </div>
          </div>
                  )}

                  {/* Step 3: Areas of Interest */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Domains of Interest *
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          {Object.keys(DOMAIN_SUBDOMAINS).map((domain) => (
                            <div key={domain} className="flex items-center space-x-2">
                              <Checkbox
                                id={`domain-${domain}`}
                                checked={formData.domains.includes(domain)}
                                onCheckedChange={(checked) => {
                                  let newDomains = [...formData.domains]
                                  if (checked) {
                                    if (newDomains.length < 3) {
                                      newDomains.push(domain)
                                    }
                                  } else {
                                    newDomains = newDomains.filter(d => d !== domain)
                                  }
                                  
                // Filter subdomains to only include those from selected domains
                                  const availableSubdomains = newDomains.flatMap(d => 
                                    DOMAIN_SUBDOMAINS[d as Domain] || []
                )
                const filteredSubdomains = formData.subdomains.filter(subdomain =>
                  availableSubdomains.includes(subdomain)
                )
                
                setFormData({ 
                  ...formData, 
                                    domains: newDomains,
                  subdomains: filteredSubdomains
                })
              }}
                                disabled={!formData.domains.includes(domain) && formData.domains.length >= 3}
                              />
                              <Label 
                                htmlFor={`domain-${domain}`} 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {domain}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          You can select up to 3 domains ({formData.domains.length}/3 selected)
                        </p>
                        {errors.domains && <p className="text-sm text-red-600">{errors.domains}</p>}
          </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Subdomains of Interest *
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                          {formData.domains.length === 0 ? (
                            <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                              Please select domains first to see available subdomains
                            </p>
                          ) : (
                            formData.domains.flatMap(domain => 
                              DOMAIN_SUBDOMAINS[domain as Domain]?.map(subdomain => (
                                <div key={subdomain} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`subdomain-${subdomain}`}
                                    checked={formData.subdomains.includes(subdomain)}
                                    onCheckedChange={(checked) => {
                                      let newSubdomains = [...formData.subdomains]
                                      const totalAvailableSubdomains = formData.domains.flatMap(domain => 
                                        DOMAIN_SUBDOMAINS[domain as Domain] || []
                                      ).length
                                      
                                      if (checked) {
                                        if (newSubdomains.length < totalAvailableSubdomains) {
                                          newSubdomains.push(subdomain)
                                        }
                                      } else {
                                        newSubdomains = newSubdomains.filter(s => s !== subdomain)
                                      }
                                      
                                      setFormData({ 
                                        ...formData, 
                                        subdomains: newSubdomains
                                      })
                                    }}
                                    disabled={(() => {
                                      const totalAvailableSubdomains = formData.domains.flatMap(domain => 
                                        DOMAIN_SUBDOMAINS[domain as Domain] || []
                                      ).length
                                      return !formData.subdomains.includes(subdomain) && formData.subdomains.length >= totalAvailableSubdomains
                                    })()}
                                  />
                                  <Label 
                                    htmlFor={`subdomain-${subdomain}`} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {subdomain}
                                  </Label>
                                </div>
                              )) || []
                            )
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formData.domains.length === 0 
                            ? "Please select domains first" 
                            : (() => {
                                const totalAvailableSubdomains = formData.domains.flatMap(domain => 
                                  DOMAIN_SUBDOMAINS[domain as Domain] || []
                                ).length
                                return `You can select up to ${totalAvailableSubdomains} subdomains (${formData.subdomains.length}/${totalAvailableSubdomains} selected)`
                              })()
                          }
                        </p>
                        {errors.subdomains && <p className="text-sm text-red-600">{errors.subdomains}</p>}
          </div>
            </div>
          )}

                  {/* Error/Success Message */}
                  {message && (
                    <Alert variant={messageType === 'error' ? 'destructive' : 'default'} className="border-l-4">
                      {messageType === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription className={messageType === 'success' ? 'text-green-800' : ''}>
                        {message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                      >
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
          <Button
            type="submit"
                        disabled={loading || !canProceed()}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating Profile...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Complete Profile
                          </>
                        )}
          </Button>
                    )}
                  </div>
        </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
