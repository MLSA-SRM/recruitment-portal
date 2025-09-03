'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createProfile } from '@/lib/auth-actions'
import { DOMAINS, SUB_DOMAINS, DEPARTMENTS } from '@/lib/constants/domains'
import { User, Phone, Hash, GraduationCap, Target, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

export default function ProfileSetupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [selectedSubDomains, setSelectedSubDomains] = useState<string[]>([])

  const [formData, setFormData] = useState({
    full_name: '',
    registration_number: '',
    department: '',
    phone: ''
  })

  const steps = [
    { id: 'personal', title: 'Personal Info', description: 'Basic information about you' },
    { id: 'domains', title: 'Areas of Interest', description: 'What domains excite you?' },
    { id: 'subdomains', title: 'Specializations', description: 'Your specific interests' },
    { id: 'review', title: 'Review & Complete', description: 'Confirm your details' }
  ]

  const handleDomainChange = (domain: string, checked: boolean) => {
    if (checked) {
      setSelectedDomains([...selectedDomains, domain])
    } else {
      setSelectedDomains(selectedDomains.filter(d => d !== domain))
      // Remove sub-domains of this domain
      const domainKey = Object.keys(SUB_DOMAINS).find(key => DOMAINS[key as keyof typeof DOMAINS] === domain)
      if (domainKey) {
        const subDomainsToRemove = Object.values(SUB_DOMAINS[domainKey as keyof typeof SUB_DOMAINS]).map(subdomain => subdomain.name)
        setSelectedSubDomains(selectedSubDomains.filter(sd => !subDomainsToRemove.includes(sd)))
      }
    }
  }

  const handleSubDomainChange = (subDomain: string, checked: boolean) => {
    if (checked) {
      setSelectedSubDomains([...selectedSubDomains, subDomain])
    } else {
      setSelectedSubDomains(selectedSubDomains.filter(sd => sd !== subDomain))
    }
  }

  const getAvailableSubDomains = () => {
    const available: { [key: string]: string[] } = {}

    selectedDomains.forEach(domain => {
      const domainKey = Object.keys(DOMAINS).find(key => DOMAINS[key as keyof typeof DOMAINS] === domain)
      if (domainKey && SUB_DOMAINS[domainKey as keyof typeof SUB_DOMAINS]) {
        available[domain] = Object.values(SUB_DOMAINS[domainKey as keyof typeof SUB_DOMAINS]).map(subdomain => subdomain.name)
      }
    })

    return available
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: // Personal Info
        return formData.full_name && formData.registration_number && formData.department && formData.phone
      case 1: // Domains
        return selectedDomains.length > 0
      case 2: // Sub-domains
        return selectedSubDomains.length > 0
      case 3: // Review
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    const submitFormData = new FormData()
    submitFormData.append('full_name', formData.full_name)
    submitFormData.append('registration_number', formData.registration_number)
    submitFormData.append('department', formData.department)
    submitFormData.append('phone', formData.phone)
    submitFormData.append('domains', JSON.stringify(selectedDomains))
    submitFormData.append('sub_domains', JSON.stringify(selectedSubDomains))
    
    try {
      await createProfile(submitFormData)
    } catch (error) {
      console.error('Profile creation error:', error)
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
  return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Let&apos;s start with some basic details about you</p>
                </div>
                
            <div className="space-y-8 max-w-lg mx-auto">
              <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                  <Label htmlFor="full_name" className="text-foreground font-semibold text-sm">
                    Full Name *
                    </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="form-input-enhanced h-14 pl-12 text-base"
                      placeholder="John Doe"
                    />
                  </div>
                  </div>
                  
                  <div className="space-y-3">
                  <Label htmlFor="registration_number" className="text-foreground font-semibold text-sm">
                    Registration Number *
                    </Label>
                    <div className="relative">
                    <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="registration_number"
                        type="text"
                        required
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange('registration_number', e.target.value)}
                      className="form-input-enhanced h-14 pl-12 text-base"
                        placeholder="RA22110030XXXXX"
                      />
                  </div>
                </div>
                
                  <div className="space-y-3">
                  <Label htmlFor="department" className="text-foreground font-semibold text-sm">
                    Department *
                    </Label>
                      <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange('department', value)}
                    required
                  >
                    <SelectTrigger className="form-input-enhanced h-14">
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-3 text-muted-foreground" />
                        <SelectValue placeholder="Computer Science Engineering" />
                      </div>
                        </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg">
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept} className="hover:bg-muted">
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  
                  <div className="space-y-3">
                  <Label htmlFor="phone" className="text-foreground font-semibold text-sm">
                    Phone Number *
                    </Label>
                    <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="phone"
                        type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="form-input-enhanced h-14 pl-12 text-base"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                  </div>
                  </div>
                </div>
        )
                
      case 1:
        return (
                <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Areas of Interest</h2>
              <p className="text-muted-foreground">Which domains excite you the most?</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(DOMAINS).map(([key, domain]) => (
                        <motion.div 
                          key={key} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                  >
                                                            <div 
                      className={`p-8 rounded-xl border-2 cursor-pointer transition-all h-[120px] flex items-center justify-center ${
                              selectedDomains.includes(domain)
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border/40 bg-muted/30 hover:bg-muted/50'
                      }`}
                          onClick={() => handleDomainChange(domain, !selectedDomains.includes(domain))}
                        >
                      <div className="flex items-center space-x-4">
                            <Checkbox
                              checked={selectedDomains.includes(domain)}
                          onChange={() => {}} // Handled by parent click
                          className="w-6 h-6"
                        />
                        <h3 className="font-bold text-foreground text-xl">{domain}</h3>
                      </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your Specializations</h2>
              <p className="text-muted-foreground">Choose your specific areas of expertise</p>
            </div>
            
            {selectedDomains.length > 0 ? (
              <div className="max-w-5xl mx-auto space-y-8">
                          {Object.entries(getAvailableSubDomains()).map(([domain, subDomains]) => (
                  <div key={domain} className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-primary mb-2">{domain}</h3>
                      <div className="w-24 h-1 bg-primary/30 rounded-full mx-auto"></div>
                              </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subDomains.map((subDomain) => (
                                  <motion.div 
                                    key={subDomain}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                        >
                                                    <div 
                            className={`p-6 rounded-xl border-2 cursor-pointer transition-all h-[80px] flex items-center ${
                                        selectedSubDomains.includes(subDomain)
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-border/30 bg-muted/20 hover:bg-muted/40'
                            }`}
                                    onClick={() => handleSubDomainChange(subDomain, !selectedSubDomains.includes(subDomain))}
                                  >
                            <div className="flex items-center space-x-4 w-full">
                                      <Checkbox
                                        checked={selectedSubDomains.includes(subDomain)}
                                onChange={() => {}} // Handled by parent click
                                className="w-5 h-5"
                                      />
                              <span className="text-sm font-semibold text-foreground flex-1 text-center">
                                        {subDomain}
                              </span>
                            </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                  </div>
                          ))}
                        </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">Please select domains first to see specializations</p>
              </div>
            )}
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Profile</h2>
              <p className="text-muted-foreground">Everything looks good? Let&apos;s complete your setup!</p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6 flex flex-col">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-2">Personal Information</h3>
                    <div className="w-24 h-1 bg-primary/30 rounded-full mx-auto"></div>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-6 space-y-4 flex-1">
                    <div className="flex justify-between items-center py-4 border-b border-border/30">
                      <span className="text-muted-foreground font-medium">Name:</span>
                      <span className="text-foreground font-semibold text-right">{formData.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-border/30">
                      <span className="text-muted-foreground font-medium">Registration:</span>
                      <span className="text-foreground font-semibold text-right">{formData.registration_number}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-border/30">
                      <span className="text-muted-foreground font-medium">Department:</span>
                      <span className="text-foreground font-semibold text-right">{formData.department}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-muted-foreground font-medium">Phone:</span>
                      <span className="text-foreground font-semibold text-right">{formData.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 flex flex-col">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-2">Areas of Interest</h3>
                    <div className="w-24 h-1 bg-secondary/30 rounded-full mx-auto"></div>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-6 space-y-6 flex-1">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide text-center">Domains</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedDomains.map(domain => (
                          <span key={domain} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-border/30 pt-6">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide text-center">Specializations</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedSubDomains.map(subDomain => (
                          <span key={subDomain} className="px-3 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-medium border border-secondary/20">
                            {subDomain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="glass-card-prominent shadow-xl border-border">
          {/* Progress Header */}
          <CardHeader className="pb-6 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Complete Your Profile
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div 
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="hidden md:block">
                      <p className={`text-sm font-medium ${
                        index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex space-x-3">
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !isStepValid(currentStep)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete Setup</span>
                      </>
                    )}
                  </Button>
                )}
                  </div>
                </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
