import { TasksPageSkeleton } from '@/components/skeleton-loaders'
import { AdminLayout } from '@/components/admin-layout'

export default function Loading() {
  return (
    <AdminLayout>
      <TasksPageSkeleton />
    </AdminLayout>
  )
}
