import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "border-input flex h-11 w-full min-w-0 rounded-xl border bg-background px-4 py-3 text-base",
        "shadow-sm transition-all duration-200 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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

export { Input }
