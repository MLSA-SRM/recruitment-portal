'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Mail } from 'lucide-react'

export function NotificationSettings() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure email alerts, system notifications, and communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Notification Preferences</h3>
          <p className="text-muted-foreground">
            Email and alert configuration coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
