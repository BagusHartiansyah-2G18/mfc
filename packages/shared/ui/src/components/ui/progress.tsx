import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../utils/cn"

const progressVariants = {
  size: {
    sm: "h-1.5",
    default: "h-2.5",
    lg: "h-3.5",
  } as const,
  variant: {
    default: "bg-primary",
    success: "bg-emerald-500",
    danger: "bg-red-500",
    indeterminate: "bg-primary/50",
  } as const,
}

function Progress({
  className,
  value,
  max = 100,
  indeterminate = false,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  value?: number
  max?: number
  indeterminate?: boolean
  variant?: "default" | "success" | "danger" | "indeterminate"
  size?: "sm" | "default" | "lg"
}) {
  const pct = indeterminate ? 0 : Math.min(100, Math.max(0, ((value ?? 0) / (max || 100)) * 100))
  const barClass =
    indeterminate ? "animate-progress-indeterminate bg-primary/50" : undefined
  const indicatorClass =
    indeterminate ? "bg-primary/50" : variant === "success" ? "bg-emerald-500" : variant === "danger" ? "bg-red-500" : "bg-primary"
  const barStyle = indeterminate ? undefined : { transform: `translateX(-${100 - pct}%)` }

  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        progressVariants.size[size],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full flex-1 rounded-full transition-all",
          barClass,
          indicatorClass,
        )}
        style={barStyle as React.CSSProperties}
      />
    </ProgressPrimitive.Root>
  )
}
Progress.displayName = "Progress"

export { Progress }
