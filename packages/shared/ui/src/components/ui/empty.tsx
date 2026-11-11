import * as React from "react"
import { LayoutDashboard } from "lucide-react"
import { cn } from "../../utils/cn"

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ title = "No data", description, icon, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {icon ? (
              <span className="grid place-items-center">{icon}</span>
            ) : (
              <LayoutDashboard className="h-10 w-10" aria-hidden />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </>
        )}
      </div>
    )
  }
)
Empty.displayName = "Empty"
