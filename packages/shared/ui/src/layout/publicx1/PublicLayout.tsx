import * as React from "react"
import { cn } from "../../utils/cn"
import { PublicHeader, type NavLinkItem } from "./PublicHeader"
import { PublicFooter } from "./PublicFooter"
import { ThemeProvider } from "../../hooks/use-theme"
import { TooltipProvider } from "../../components/ui/tooltip"

/* -------------------------------------------------------------------------
 * PublicLayoutMain
 * ------------------------------------------------------------------------- */
export interface PublicLayoutMainProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const PublicLayoutMain = React.forwardRef<HTMLElement, PublicLayoutMainProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <main ref={ref} className={cn("flex-1", className)} {...props}>
        {children}
      </main>
    )
  }
)
PublicLayoutMain.displayName = "PublicLayoutMain"

/* -------------------------------------------------------------------------
 * PublicLayout (Root)
 * ------------------------------------------------------------------------- */
export interface PublicLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  brand?: string
  dashboardPath?: string
  links?: NavLinkItem[]
  banner?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  mainClassName?: string
  children?: React.ReactNode
}

export const PublicLayout = React.forwardRef<HTMLDivElement, PublicLayoutProps>(
  (
    {
      brand = "BGS Digital Labs",
      dashboardPath = "/compUI",
      links,
      banner,
      header,
      footer,
      mainClassName,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <ThemeProvider>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn(
              "min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground scroll-smooth transition-colors",
              className
            )}
            {...props}
          >
            {/* Optional Promo/Announcement Banner */}
            {banner}

            {/* Header */}
            {header !== undefined ? (
              header
            ) : (
              <PublicHeader brand={brand} dashboardPath={dashboardPath} links={links} />
            )}

            {/* Main Content Area */}
            <PublicLayoutMain className={mainClassName}>
              {children}
            </PublicLayoutMain>

            {/* Footer */}
            {footer !== undefined ? (
              footer
            ) : (
              <PublicFooter brand={brand} />
            )}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    )
  }
)
PublicLayout.displayName = "PublicLayout"
