'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS, SUB_DOMAINS, DEPARTMENTS } from '@/lib/constants/domains'
import { Database } from '@/lib/types/database'
import { toast } from 'sonner'
import { 
  User, 
  Phone, 
  Hash, 
  GraduationCap, 
  Target, 
  Save, 
  RefreshCw,
  Mail,
  Calendar,
  Settings
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserSettingsFormProps {
  initialProfile: Profile
}

export default function UserSettingsForm({ initialProfile }: UserSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState(initialProfile)
  const [selectedDomains, setSelectedDomains] = useState<string[]>(initialProfile.domains)
  const [selectedSubDomains, setSelectedSubDomains] = useState<string[]>(initialProfile.sub_domains)
  
  const supabase = createClient()

  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

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
    const available: string[] = []
    selectedDomains.forEach(domain => {
      const domainKey = Object.keys(SUB_DOMAINS).find(key => DOMAINS[key as keyof typeof DOMAINS] === domain)
      if (domainKey) {
        const subDomains = Object.values(SUB_DOMAINS[domainKey as keyof typeof SUB_DOMAINS])
        available.push(...subDomains.map(subdomain => subdomain.name))
      }
    })
    return available
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          registration_number: profile.registration_number,
          department: profile.department,
          phone: profile.phone,
          domains: selectedDomains,
          sub_domains: selectedSubDomains,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setProfile(initialProfile)
    setSelectedDomains(initialProfile.domains)
    setSelectedSubDomains(initialProfile.sub_domains)
    toast.info('Changes reset to original values')
  }

  const hasChanges = () => {
    return (
      profile.full_name !== initialProfile.full_name ||
      profile.registration_number !== initialProfile.registration_number ||
      profile.department !== initialProfile.department ||
      profile.phone !== initialProfile.phone ||
      JSON.stringify(selectedDomains.sort()) !== JSON.stringify(initialProfile.domains.sort()) ||
      JSON.stringify(selectedSubDomains.sort()) !== JSON.stringify(initialProfile.sub_domains.sort())
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                className="form-input-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Registration Number
              </Label>
              <Input
                id="registration_number"
                value={profile.registration_number}
                onChange={(e) => handleInputChange('registration_number', e.target.value)}
                placeholder="Enter your registration number"
                className="form-input-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="form-input-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Department
              </Label>
              <Select
                value={profile.department}
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger className="form-input-enhanced">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domains of Interest */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Areas of Interest
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Domains</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(DOMAINS).map((domain) => (
                  <motion.div
                    key={domain}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedDomains.includes(domain)
                          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                          : 'hover:shadow-md border-gray-200'
                      }`}
                      onClick={() => handleDomainChange(domain, !selectedDomains.includes(domain))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedDomains.includes(domain)}
                            onChange={() => {}}
                            className="pointer-events-none"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{domain}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {selectedDomains.length > 0 && (
              <div>
                <Separator className="my-4" />
                <Label className="text-sm font-medium mb-3 block">Select Specializations</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getAvailableSubDomains().map((subDomain, index) => (
                    <motion.div
                      key={`${subDomain}-${index}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedSubDomains.includes(subDomain)
                            ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200'
                            : 'hover:shadow-md border-gray-200'
                        }`}
                        onClick={() => handleSubDomainChange(subDomain, !selectedSubDomains.includes(subDomain))}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedSubDomains.includes(subDomain)}
                              onChange={() => {}}
                              className="pointer-events-none"
                            />
                            <span className="text-sm font-medium text-gray-900">{subDomain}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Items Summary */}
          {(selectedDomains.length > 0 || selectedSubDomains.length > 0) && (
            <div className="space-y-3">
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-2 block">Selected Domains</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDomains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="bg-blue-100 text-blue-800">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedSubDomains.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Selected Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubDomains.map((subDomain) => (
                      <Badge key={subDomain} variant="secondary" className="bg-purple-100 text-purple-800">
                        {subDomain}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges() || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Changes
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!hasChanges() || isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
