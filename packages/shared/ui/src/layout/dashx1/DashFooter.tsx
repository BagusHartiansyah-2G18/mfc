import * as React from "react"
import { cn } from "../../utils/cn"

/* -------------------------------------------------------------------------
 * DashFooterLeft
 * ------------------------------------------------------------------------- */
export interface DashFooterLeftProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const DashFooterLeft = React.forwardRef<HTMLDivElement, DashFooterLeftProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-wrap items-center gap-4 text-xs text-muted-foreground", className)} {...props}>
        {children}
      </div>
    )
  }
)
DashFooterLeft.displayName = "DashFooterLeft"

/* -------------------------------------------------------------------------
 * DashFooterRight
 * ------------------------------------------------------------------------- */
export interface DashFooterRightProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const DashFooterRight = React.forwardRef<HTMLDivElement, DashFooterRightProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)} {...props}>
        {children}
      </div>
    )
  }
)
DashFooterRight.displayName = "DashFooterRight"

/* -------------------------------------------------------------------------
 * DashFooterItem
 * ------------------------------------------------------------------------- */
export interface DashFooterItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode
  href?: string
}

export const DashFooterItem = React.forwardRef<HTMLAnchorElement, DashFooterItemProps>(
  ({ children, href, className, ...props }, ref) => {
    if (href) {
      return (
        <a
          ref={ref}
          href={href}
          className={cn("transition-colors hover:text-foreground hover:underline", className)}
          {...props}
        >
          {children}
        </a>
      )
    }
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(className)}>
        {children}
      </span>
    )
  }
)
DashFooterItem.displayName = "DashFooterItem"

/* -------------------------------------------------------------------------
 * DashFooter (Root)
 * ------------------------------------------------------------------------- */
export interface DashFooterProps extends React.HTMLAttributes<HTMLElement> {
  brand?: React.ReactNode
  version?: string
  copyright?: React.ReactNode
  children?: React.ReactNode
}

export const DashFooter = React.forwardRef<HTMLElement, DashFooterProps>(
  ({ brand = "BGS MicroFE Platform", version = "v2.0.0", copyright, children, className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          "w-full border-t bg-card/60 px-4 py-3 backdrop-blur-sm transition-colors md:px-6",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row text-xs text-muted-foreground">
            <DashFooterLeft>
              <span>{copyright ?? `© ${new Date().getFullYear()} ${brand}. Hak Cipta Dilindungi.`}</span>
            </DashFooterLeft>

            <DashFooterRight>
              {version && <DashFooterItem>Build {version}</DashFooterItem>}
              <DashFooterItem href="#">Dokumentasi</DashFooterItem>
              <DashFooterItem href="#">Bantuan</DashFooterItem>
            </DashFooterRight>
          </div>
        )}
      </footer>
    )
  }
)
DashFooter.displayName = "DashFooter"
