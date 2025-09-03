"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-base leading-none font-semibold select-none",
        "text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "peer-focus:text-primary transition-colors duration-200",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Label }
