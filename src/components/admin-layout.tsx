import { Shield } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Admin</h1>
            </div>
            <div className="text-sm opacity-90">Administrator Area</div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
