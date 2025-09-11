import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-3 w-48 mx-auto mt-1" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="text-center space-y-3">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
