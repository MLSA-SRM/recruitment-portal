'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Server } from 'lucide-react'

export function SystemSettings() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure database, performance, and system maintenance settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
          <p className="text-muted-foreground">
            Database and performance settings coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
