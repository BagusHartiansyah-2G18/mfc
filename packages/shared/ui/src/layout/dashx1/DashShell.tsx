import * as React from "react"
import { Menu } from "lucide-react"

import { cn } from "../../utils/cn"
import { DashHeader } from "./DashHeader"
import { DashSidebar } from "./DashSidebar"
import { DashFooter } from "./DashFooter"
import { ThemeProvider } from "../../hooks/use-theme"
import { TooltipProvider } from "../../components/ui/tooltip"
import type { FeatureMenu } from "../feature-types"

/* -------------------------------------------------------------------------
 * DashShellMobileHeader
 * ------------------------------------------------------------------------- */
export interface DashShellMobileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  brand?: React.ReactNode
  onOpenMobileMenu?: () => void
}

export const DashShellMobileHeader = React.forwardRef<HTMLDivElement, DashShellMobileHeaderProps>(
  ({ children, brand, onOpenMobileMenu, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between border-b bg-card px-4 py-2.5 md:hidden",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-foreground hover:bg-muted focus:outline-hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-sm tracking-tight">{brand ?? "Dashboard"}</span>
          </div>
        )}
      </div>
    )
  }
)
DashShellMobileHeader.displayName = "DashShellMobileHeader"

/* -------------------------------------------------------------------------
 * DashShellMain
 * ------------------------------------------------------------------------- */
export interface DashShellMainProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const DashShellMain = React.forwardRef<HTMLElement, DashShellMainProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn("flex-1 overflow-y-auto px-2", className)}
        {...props}
      >
        {children}
      </main>
    )
  }
)
DashShellMain.displayName = "DashShellMain"

/* -------------------------------------------------------------------------
 * DashShell (Root)
 * ------------------------------------------------------------------------- */
export interface DashShellProps extends React.HTMLAttributes<HTMLDivElement> {
  menu?: FeatureMenu
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  breadcrumb?: React.ReactNode
  defaultCollapsed?: boolean
  mainClassName?: string
  children?: React.ReactNode
  hoverOpen?: boolean
}

export const DashShell = React.forwardRef<HTMLDivElement, DashShellProps>(
  (
    {
      menu,
      sidebar,
      header,
      footer,
      breadcrumb,
      defaultCollapsed,
      className,
      mainClassName,
      children,
      hoverOpen=false,
      ...props
    },
    ref
  ) => {
    const [collapsed, setCollapsed] = React.useState(
      defaultCollapsed ?? (menu?.shell?.sidebar?.defaultOpen === false)
    )
    const [mobileOpen, setMobileOpen] = React.useState(false)

    return (
      <ThemeProvider>
        <TooltipProvider>
          <div
            ref={ref}
            className={cn(
              "flex h-screen flex-col overflow-hidden bg-background text-foreground md:flex-row",
              className
            )}
            {...props}
          >
            {/* Mobile Top Navigation */}
            <DashShellMobileHeader
              brand={menu?.brand}
              onOpenMobileMenu={() => setMobileOpen(true)}
            />

            {/* Desktop Sidebar Slot */}
            <div className="hidden shrink-0 md:block">
              {sidebar ? (
                sidebar
              ) : menu ? (
                <DashSidebar
                  menu={menu}
                  collapsed={collapsed}
                  onToggle={() => setCollapsed((v) => !v)}
                  hoverOpen={hoverOpen}
                />
              ) : null}
            </div>

            {/* Mobile Sidebar Overlay Drawer */}
            {mobileOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div
                  className="absolute inset-0 bg-black/50 transition-opacity"
                  onClick={() => setMobileOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute inset-y-0 left-0 max-w-xs w-full shadow-2xl">
                  {sidebar ? (
                    sidebar
                  ) : menu ? (
                    <DashSidebar menu={menu} onToggle={() => setMobileOpen(false)} hoverOpen={hoverOpen} />
                  ) : null}
                </div>
              </div>
            )}

            {/* Main Area: Optional Header + Breadcrumb + Content + Optional Footer */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {header}
              {breadcrumb && <div className="px-4 pt-3 md:px-6">{breadcrumb}</div>}
              <DashShellMain className={mainClassName}>
                {children}
              </DashShellMain>
              {footer}
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    )
  }
)
DashShell.displayName = "DashShell"

/* -------------------------------------------------------------------------
 * Legacy DashboardLayout (Backward Compatibility)
 * ------------------------------------------------------------------------- */
export interface DashboardLayoutProps {
  children?: React.ReactNode
  sidebar?: React.ReactNode
  menu?: FeatureMenu
}

export function DashboardLayout({ children, sidebar, menu }: DashboardLayoutProps) {
  if (menu) {
    return <DashShell menu={menu}>{children}</DashShell>
  }
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex h-screen flex-col bg-background text-foreground">
          <DashHeader />
          <div className="flex min-h-0 flex-1">
            <div className="hidden w-64 shrink-0 border-r p-4 md:block">
              {sidebar ?? "Sidebar"}
            </div>
            <DashShellMain>{children}</DashShellMain>
          </div>
          <DashFooter />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  )
}
DashboardLayout.displayName = "DashboardLayout"
