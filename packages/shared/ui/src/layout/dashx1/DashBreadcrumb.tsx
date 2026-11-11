import * as React from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { cn } from "../../utils/cn"

export interface BreadcrumbItem {
  label: string
  href?: string
}

/* -------------------------------------------------------------------------
 * DashBreadcrumbSeparator
 * ------------------------------------------------------------------------- */
export interface DashBreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export const DashBreadcrumbSeparator = React.forwardRef<HTMLSpanElement, DashBreadcrumbSeparatorProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("text-muted-foreground/60 select-none", className)}
        {...props}
      >
        {children ? children : <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    )
  }
)
DashBreadcrumbSeparator.displayName = "DashBreadcrumbSeparator"

/* -------------------------------------------------------------------------
 * DashBreadcrumbItem
 * ------------------------------------------------------------------------- */
export interface DashBreadcrumbItemProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  href?: string
  active?: boolean
}

export const DashBreadcrumbItem = React.forwardRef<HTMLElement, DashBreadcrumbItemProps>(
  ({ children, href, active, className, ...props }, ref) => {
    if (active || !href) {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          aria-current="page"
          className={cn("font-medium text-foreground", className)}
          {...props}
        >
          {children}
        </span>
      )
    }

    return (
      <Link
        to={href}
        className={cn("text-muted-foreground transition-colors hover:text-foreground hover:underline", className)}
        {...props}
      >
        {children}
      </Link>
    )
  }
)
DashBreadcrumbItem.displayName = "DashBreadcrumbItem"

/* -------------------------------------------------------------------------
 * DashBreadcrumb (Root)
 * ------------------------------------------------------------------------- */
export interface DashBreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  items?: BreadcrumbItem[]
  separator?: React.ReactNode
}

export const DashBreadcrumb = React.forwardRef<HTMLElement, DashBreadcrumbProps>(
  ({ children, items, separator, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}
        {...props}
      >
        {children ? (
          children
        ) : items && items.length > 0 ? (
          items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <React.Fragment key={`${item.label}-${idx}`}>
                {idx > 0 && (
                  <DashBreadcrumbSeparator>
                    {separator}
                  </DashBreadcrumbSeparator>
                )}
                <DashBreadcrumbItem href={item.href} active={isLast}>
                  {item.label}
                </DashBreadcrumbItem>
              </React.Fragment>
            )
          })
        ) : null}
      </nav>
    )
  }
)
DashBreadcrumb.displayName = "DashBreadcrumb"
