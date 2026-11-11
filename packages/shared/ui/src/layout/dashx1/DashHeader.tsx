import * as React from "react"
import { Link } from "react-router-dom"
import { Sun, Moon, UserRound, Settings, LogOut, Menu } from "lucide-react"

import { cn } from "../../utils/cn"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { useTheme } from "../../hooks/use-theme"
import { getIcon } from "../icon-map"
import type { FeatureMenu } from "../feature-types"

/* -------------------------------------------------------------------------
 * DashHeaderBrand
 * ------------------------------------------------------------------------- */
export interface DashHeaderBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  title?: string
  logo?: React.ReactNode
  href?: string
}

export const DashHeaderBrand = React.forwardRef<HTMLDivElement, DashHeaderBrandProps>(
  ({ children, title, logo, href = "#", className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        {children ? (
          children
        ) : (
          <Link
            to={href}
            className="flex items-center gap-2 text-base font-semibold text-slate-800 transition-opacity hover:opacity-90 dark:text-white"
          >
            {logo && <span className="grid place-items-center">{logo}</span>}
            {title && <span>{title}</span>}
          </Link>
        )}
      </div>
    )
  }
)
DashHeaderBrand.displayName = "DashHeaderBrand"

/* -------------------------------------------------------------------------
 * DashHeaderNav & DashHeaderNavItem
 * ------------------------------------------------------------------------- */
export interface DashHeaderNavProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const DashHeaderNav = React.forwardRef<HTMLElement, DashHeaderNavProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn("hidden lg:block", className)} {...props}>
        <ul className="flex items-center gap-4">{children}</ul>
      </nav>
    )
  }
)
DashHeaderNav.displayName = "DashHeaderNav"

export interface DashHeaderNavItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode
  to?: string
  icon?: React.ReactNode
  label?: string
  active?: boolean
}

export const DashHeaderNavItem = React.forwardRef<HTMLLIElement, DashHeaderNavItemProps>(
  ({ children, to = "#", icon, label, active, className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn(
          "flex items-center gap-x-2 rounded-md p-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
          active && "text-primary font-semibold dark:text-primary",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <Link to={to} className="flex items-center gap-2">
            {icon && <span className="h-4 w-4">{icon}</span>}
            {label && <span>{label}</span>}
          </Link>
        )}
      </li>
    )
  }
)
DashHeaderNavItem.displayName = "DashHeaderNavItem"

/* -------------------------------------------------------------------------
 * DashHeaderActions
 * ------------------------------------------------------------------------- */
export interface DashHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const DashHeaderActions = React.forwardRef<HTMLDivElement, DashHeaderActionsProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("ml-auto flex items-center gap-2", className)} {...props}>
        {children}
      </div>
    )
  }
)
DashHeaderActions.displayName = "DashHeaderActions"

/* -------------------------------------------------------------------------
 * DashHeaderUserMenu
 * ------------------------------------------------------------------------- */
export interface DashHeaderUserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  user?: {
    name?: string
    role?: string
    avatarFallback?: string
  }
  onLogout?: () => void
}

export const DashHeaderUserMenu = React.forwardRef<HTMLDivElement, DashHeaderUserMenuProps>(
  ({ children, user = { name: "Operator", role: "Admin", avatarFallback: "OP" }, onLogout, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        {children ? (
          children
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="User menu" className="h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.avatarFallback ?? "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  {user.role && <span className="text-xs text-muted-foreground">{user.role}</span>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserRound className="mr-2 h-4 w-4" /> Profil Akun
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }
)
DashHeaderUserMenu.displayName = "DashHeaderUserMenu"

/* -------------------------------------------------------------------------
 * DashHeaderMobileToggle
 * ------------------------------------------------------------------------- */
export interface DashHeaderMobileToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
}

export const DashHeaderMobileToggle = React.forwardRef<HTMLButtonElement, DashHeaderMobileToggleProps>(
  ({ children, isOpen, onToggle, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn(
          "rounded-md p-1.5 text-foreground hover:bg-muted focus:outline-hidden lg:hidden",
          className
        )}
        {...props}
      >
        {children ? children : <Menu className="h-5 w-5" />}
      </button>
    )
  }
)
DashHeaderMobileToggle.displayName = "DashHeaderMobileToggle"

/* -------------------------------------------------------------------------
 * DashHeader (Root)
 * ------------------------------------------------------------------------- */
export interface DashHeaderProps extends React.HTMLAttributes<HTMLElement> {
  brand?: string
  menu?: FeatureMenu
  onMenuClick?: () => void
  onToggleSidebar?: () => void
  collapsed?: boolean
  user?: { name?: string; role?: string; avatarFallback?: string }
  children?: React.ReactNode
}

export const DashHeader = React.forwardRef<HTMLElement, DashHeaderProps>(
  ({ brand = "Dashboard", menu, onMenuClick, onToggleSidebar, collapsed, user, className, children, ...props }, ref) => {
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const { resolvedTheme, toggle } = useTheme()

    const navItems = menu
      ? menu.menus.flatMap((s) =>
          s.items
            .filter((i) => i.enabled !== false)
            .map((i) => ({ label: i.label, path: i.path, icon: i.icon ?? "file" }))
        )
      : []

    return (
      <header
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors dark:border-border",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <div className="flex items-center justify-between gap-4">
            <DashHeaderBrand title={brand} />

            {navItems.length > 0 && (
              <DashHeaderNav>
                {navItems.map((item, idx) => {
                  const Icon = getIcon(item.icon)
                  return (
                    <DashHeaderNavItem
                      key={`${item.label}-${idx}`}
                      to={item.path}
                      icon={<Icon className="h-4 w-4" />}
                      label={item.label}
                    />
                  )
                })}
              </DashHeaderNav>
            )}

            <DashHeaderActions>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Toggle theme"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <DashHeaderUserMenu user={user} />

              <DashHeaderMobileToggle
                isOpen={mobileOpen}
                onToggle={() => {
                  setMobileOpen((v) => !v)
                  if (onMenuClick) onMenuClick()
                }}
              />
            </DashHeaderActions>
          </div>
        )}

        {/* Mobile dropdown if default children */}
        {!children && mobileOpen && navItems.length > 0 && (
          <div className="mt-3 border-t pt-3 lg:hidden">
            <ul className="flex flex-col gap-1">
              {navItems.map((item, idx) => {
                const Icon = getIcon(item.icon)
                return (
                  <DashHeaderNavItem
                    key={`${item.label}-mob-${idx}`}
                    to={item.path}
                    icon={<Icon className="h-4 w-4" />}
                    label={item.label}
                    onClick={() => setMobileOpen(false)}
                  />
                )
              })}
            </ul>
          </div>
        )}
      </header>
    )
  }
)
DashHeader.displayName = "DashHeader"
