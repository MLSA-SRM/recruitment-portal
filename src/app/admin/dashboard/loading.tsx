import { DashboardSkeleton } from '@/components/skeleton-loaders'
import { AdminLayout } from '@/components/admin-layout'

export default function Loading() {
  return (
    <AdminLayout>
      <DashboardSkeleton />
    </AdminLayout>
  )
}
