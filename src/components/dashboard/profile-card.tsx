'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Mail, 
  Phone, 
  GraduationCap, 
  Hash,
  Edit,
  Target
} from 'lucide-react'

interface ProfileCardProps {
  profile: Record<string, unknown>
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="neon-text-pink">Profile</CardTitle>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>Your recruitment profile information</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url as string} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg">
                {((profile.full_name as string)?.charAt(0)) || ((profile.email as string)?.charAt(0))}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{profile.full_name as string}</h3>
              <p className="text-sm text-muted-foreground">{profile.department as string}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{profile.email as string}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{profile.phone as string}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span>{profile.registration_number as string}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span>{profile.department as string}</span>
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Domains</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(profile.domains as string[])?.map((domain: string) => (
                <Badge key={domain} variant="outline" className="border-primary/30 text-primary">
                  {domain}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sub-domains */}
          {(profile.sub_domains as string[]) && (profile.sub_domains as string[]).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Specializations</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(profile.sub_domains as string[]).map((subDomain: string) => (
                  <Badge key={subDomain} variant="secondary" className="text-xs">
                    {subDomain}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="pt-3 divider-line">
            <p className="text-xs text-muted-foreground text-center">
              Member since {new Date(profile.created_at as string).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
