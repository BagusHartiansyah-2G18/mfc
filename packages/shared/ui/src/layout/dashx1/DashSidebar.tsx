import * as React from "react"
import { NavLink } from "react-router-dom"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { cn } from "../../utils/cn"
import { getIcon } from "../icon-map"
import type { FeatureMenu, FeatureMenuItem } from "../feature-types"

/* -------------------------------------------------------------------------
 * DashSidebarToggle
 * ------------------------------------------------------------------------- */
export interface DashSidebarToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  collapsed?: boolean
  onToggle?: () => void
}

export const DashSidebarToggle = React.forwardRef<HTMLButtonElement, DashSidebarToggleProps>(
  ({ children, collapsed, onToggle, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "rounded-lg p-1.5 text-muted-foreground outline-hidden transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>
    )
  }
)
DashSidebarToggle.displayName = "DashSidebarToggle"

/* -------------------------------------------------------------------------
 * DashSidebarHeader
 * ------------------------------------------------------------------------- */
export interface DashSidebarHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode
  title?: React.ReactNode
  collapsed?: boolean
  onToggle?: () => void
}

export const DashSidebarHeader = React.forwardRef<HTMLDivElement, DashSidebarHeaderProps>(
  ({ children, title, collapsed, onToggle, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between px-3 py-4",
          collapsed && "justify-center px-2",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {!collapsed && (
              <h5 className="font-semibold text-lg tracking-tight text-foreground">
                {title ?? "Dashboard"}
              </h5>
            )}
            {onToggle && <DashSidebarToggle collapsed={collapsed} onToggle={onToggle} />}
          </>
        )}
      </div>
    )
  }
)
DashSidebarHeader.displayName = "DashSidebarHeader"

/* -------------------------------------------------------------------------
 * DashSidebarBadge
 * ------------------------------------------------------------------------- */
export interface DashSidebarBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export const DashSidebarBadge = React.forwardRef<HTMLSpanElement, DashSidebarBadgeProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
DashSidebarBadge.displayName = "DashSidebarBadge"

/* -------------------------------------------------------------------------
 * DashSidebarItem
 * ------------------------------------------------------------------------- */
export interface DashSidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode
  to: string
  icon?: React.ReactNode
  label?: React.ReactNode
  badge?: React.ReactNode
  collapsed?: boolean
  end?: boolean
}

export const DashSidebarItem = React.forwardRef<HTMLAnchorElement, DashSidebarItemProps>(
  ({ children, to, icon, label, badge, collapsed, end, className, ...props }, ref) => {
    return (
      <NavLink
        ref={ref}
        to={to}
        end={end ?? to === "/"}
        title={collapsed && typeof label === "string" ? label : undefined}
        className={({ isActive }) =>
          cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-hidden",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring",
            isActive && "bg-secondary font-semibold text-foreground dark:bg-slate-800",
            collapsed && "justify-center px-2 py-2.5",
            className
          )
        }
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {icon && <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">{icon}</span>}
            {!collapsed && label && <span className="truncate">{label}</span>}
            {!collapsed && badge && (typeof badge === "string" ? <DashSidebarBadge>{badge}</DashSidebarBadge> : badge)}
          </>
        )}
      </NavLink>
    )
  }
)
DashSidebarItem.displayName = "DashSidebarItem"

/* -------------------------------------------------------------------------
 * DashSidebarSection
 * ------------------------------------------------------------------------- */
export interface DashSidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  title?: string
  collapsed?: boolean
}

export const DashSidebarSection = React.forwardRef<HTMLDivElement, DashSidebarSectionProps>(
  ({ children, title, collapsed, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1 py-1", className)} {...props}>
        {!collapsed && title && (
          <h6 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            {title}
          </h6>
        )}
        <div className="space-y-0.5">{children}</div>
      </div>
    )
  }
)
DashSidebarSection.displayName = "DashSidebarSection"

/* -------------------------------------------------------------------------
 * DashSidebarNav
 * ------------------------------------------------------------------------- */
export interface DashSidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
  collapsed?: boolean
}

export const DashSidebarNav = React.forwardRef<HTMLElement, DashSidebarNavProps>(
  ({ children, collapsed, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Sidebar navigation"
        className={cn("flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-1", className)}
        {...props}
      >
        {children}
      </nav>
    )
  }
)
DashSidebarNav.displayName = "DashSidebarNav"

/* -------------------------------------------------------------------------
 * DashSidebarFooter
 * ------------------------------------------------------------------------- */
export interface DashSidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  collapsed?: boolean
}

export const DashSidebarFooter = React.forwardRef<HTMLDivElement, DashSidebarFooterProps>(
  ({ children, collapsed, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-auto border-t p-3 text-xs text-muted-foreground",
          collapsed && "flex justify-center p-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DashSidebarFooter.displayName = "DashSidebarFooter"

/* -------------------------------------------------------------------------
 * DashSidebar (Root)
 * ------------------------------------------------------------------------- */
export interface DashSidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  menu?: FeatureMenu
  collapsed?: boolean
  hoverOpen?: boolean
  onToggle?: () => void
  title?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
}

export const DashSidebar = React.forwardRef<HTMLElement, DashSidebarProps>(
  (
    {
      menu,
      collapsed = false,
      hoverOpen = false,
      onToggle,
      title,
      footer,
      children,
      className,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)

    // Ketika hoverOpen aktif: saat dihover sidebar membuka (isCollapsed = false),
    // saat mouse keluar sidebar kembali collapsed (isCollapsed = true).
    const isCollapsed = hoverOpen ? (isHovered ? false : true) : collapsed

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      if (hoverOpen) {
        setIsHovered(true)
      }
      onMouseEnter?.(e)
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      if (hoverOpen) {
        setIsHovered(false)
      }
      onMouseLeave?.(e)
    }

    return (
      <aside
        ref={ref}
        data-collapsed={isCollapsed}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative flex h-full w-64 flex-col border-r bg-card text-card-foreground shadow-xs transition-all duration-300",
          isCollapsed && "w-[72px] min-w-[72px]",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <DashSidebarHeader
              title={title ?? menu?.brand ?? "Sidebar"}
              collapsed={isCollapsed}
              onToggle={onToggle}
            />

            <DashSidebarNav collapsed={isCollapsed}>
              {menu?.menus ? (
                menu.menus.map((section, sIdx) => {
                  const items: FeatureMenuItem[] = section.items
                    .filter((i) => i.enabled !== false)
                    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

                  return (
                    <DashSidebarSection
                      key={`${section.section}-${sIdx}`}
                      title={section.section}
                      collapsed={isCollapsed}
                    >
                      {items.map((item) => {
                        const Icon = getIcon(item.icon)
                        return (
                          <DashSidebarItem
                            key={item.id}
                            to={item.path}
                            label={item.label}
                            badge={item.badge}
                            role={item.role}
                            icon={<Icon className="h-5 w-5" />}
                            collapsed={isCollapsed}
                          />
                        )
                      })}
                    </DashSidebarSection>
                  )
                })
              ) : null}
            </DashSidebarNav>

            {footer && (
              <DashSidebarFooter collapsed={isCollapsed}>
                {footer}
              </DashSidebarFooter>
            )}
          </>
        )}
      </aside>
    )
  }
)
DashSidebar.displayName = "DashSidebar"
