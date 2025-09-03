import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground",
        "flex min-h-24 w-full rounded-xl border bg-background px-4 py-3 text-base",
        "shadow-sm transition-all duration-200 outline-none resize-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        // Focus states
        "focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-lg",
        "hover:border-primary/50 hover:shadow-md",
        // Invalid states
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:focus:bg-input/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
