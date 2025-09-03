import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-gradient-to-r from-muted/60 via-muted to-muted/60 bg-[length:200%_100%] animate-shimmer", className)}
      {...props}
    />
  )
}

// Enhanced skeleton components for different use cases
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-card p-6 space-y-4", className)} {...props}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full" // Last line shorter
          )}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-12 w-12 rounded-full", className)}
      {...props}
    />
  )
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-10 w-24 rounded-xl", className)}
      {...props}
    />
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton
}
