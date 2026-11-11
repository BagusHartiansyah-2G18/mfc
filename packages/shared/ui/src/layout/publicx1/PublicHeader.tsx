import * as React from "react"
import { Link } from "react-router-dom"
import { Menu, X, Sun, Moon, ArrowRight, Code2, PhoneCall } from "lucide-react"

import { cn } from "../../utils/cn"
import { Button } from "../../components/ui/button"
import { useTheme } from "../../hooks/use-theme"

export interface NavLinkItem {
  label: string
  href: string
}

export const DEFAULT_PUBLIC_NAV_LINKS: NavLinkItem[] = [
  { label: "Layanan", href: "#services" },
  { label: "Promo Khusus", href: "#promo" },
  { label: "Portofolio", href: "#portfolio" },
  { label: "Alur Kerja", href: "#process" },
  { label: "Paket Solusi", href: "#pricing" },
  { label: "Hubungi Kami", href: "#contact" },
]

/* -------------------------------------------------------------------------
 * PublicHeaderBrand
 * ------------------------------------------------------------------------- */
export interface PublicHeaderBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  name?: string
  tagline?: string
  icon?: React.ReactNode
  href?: string
}

export const PublicHeaderBrand = React.forwardRef<HTMLDivElement, PublicHeaderBrandProps>(
  ({ children, name = "BGS Digital Labs", tagline = "Software House & Tech Partner", icon, href = "/", className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        {children ? (
          children
        ) : (
          <Link to={href} className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black tracking-tight shadow-md transition-transform group-hover:scale-105">
              {icon ? icon : <Code2 className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-foreground leading-none">{name}</div>
              {tagline && (
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                  {tagline}
                </div>
              )}
            </div>
          </Link>
        )}
      </div>
    )
  }
)
PublicHeaderBrand.displayName = "PublicHeaderBrand"

/* -------------------------------------------------------------------------
 * PublicHeaderNav & PublicHeaderNavItem
 * ------------------------------------------------------------------------- */
export interface PublicHeaderNavProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const PublicHeaderNav = React.forwardRef<HTMLElement, PublicHeaderNavProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn("hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground", className)} {...props}>
        {children}
      </nav>
    )
  }
)
PublicHeaderNav.displayName = "PublicHeaderNav"

export interface PublicHeaderNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode
  href: string
  active?: boolean
}

export const PublicHeaderNavItem = React.forwardRef<HTMLAnchorElement, PublicHeaderNavItemProps>(
  ({ children, href, active, className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "transition-colors hover:text-primary hover:font-semibold",
          active && "text-primary font-semibold",
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)
PublicHeaderNavItem.displayName = "PublicHeaderNavItem"

/* -------------------------------------------------------------------------
 * PublicHeaderActions
 * ------------------------------------------------------------------------- */
export interface PublicHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const PublicHeaderActions = React.forwardRef<HTMLDivElement, PublicHeaderActionsProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("hidden sm:flex items-center gap-3", className)} {...props}>
        {children}
      </div>
    )
  }
)
PublicHeaderActions.displayName = "PublicHeaderActions"

/* -------------------------------------------------------------------------
 * PublicHeaderMobileDrawer
 * ------------------------------------------------------------------------- */
export interface PublicHeaderMobileDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  isOpen: boolean
  onClose?: () => void
}

export const PublicHeaderMobileDrawer = React.forwardRef<HTMLDivElement, PublicHeaderMobileDrawerProps>(
  ({ children, isOpen, onClose, className, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn(
          "border-b bg-card px-4 py-5 lg:hidden space-y-4 shadow-lg animate-in slide-in-from-top-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PublicHeaderMobileDrawer.displayName = "PublicHeaderMobileDrawer"

/* -------------------------------------------------------------------------
 * PublicHeader (Root)
 * ------------------------------------------------------------------------- */
export interface PublicHeaderProps extends React.HTMLAttributes<HTMLElement> {
  brand?: string
  tagline?: string
  links?: NavLinkItem[]
  dashboardPath?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export const PublicHeader = React.forwardRef<HTMLElement, PublicHeaderProps>(
  (
    {
      brand = "BGS Digital Labs",
      tagline = "Software House & Tech Partner",
      links = DEFAULT_PUBLIC_NAV_LINKS,
      dashboardPath = "/compUI",
      actions,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const { resolvedTheme, toggle } = useTheme()

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md shadow-xs transition-colors",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Brand Section */}
              <PublicHeaderBrand name={brand} tagline={tagline} />

              {/* Navigation Items */}
              <PublicHeaderNav>
                {links.map((link) => (
                  <PublicHeaderNavItem key={link.label} href={link.href}>
                    {link.label}
                  </PublicHeaderNavItem>
                ))}
              </PublicHeaderNav>

              {/* Action Buttons */}
              <PublicHeaderActions>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {actions ? (
                  actions
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="hidden xl:inline-flex">
                      <a href="#contact" className="gap-1.5">
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Konsultasi Proyek</span>
                      </a>
                    </Button>

                    <Button asChild variant="ghost" size="sm" className="text-xs font-semibold">
                      <Link to="/login">
                        <span>Masuk</span>
                      </Link>
                    </Button>

                    <Button asChild size="sm" className="gap-1.5 shadow-sm font-semibold">
                      <Link to={dashboardPath}>
                        <span>Client Portal</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </PublicHeaderActions>

              {/* Mobile Trigger */}
              <div className="flex items-center gap-1 sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="h-9 w-9"
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-label="Toggle mobile menu"
                  className="rounded-lg p-2 text-foreground hover:bg-muted"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Drawer */}
            <PublicHeaderMobileDrawer
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            >
              <nav className="flex flex-col space-y-1.5">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="pt-3 border-t flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Masuk ke Sistem (Login)
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)}>
                    Buka Client Portal / Dashboard
                  </Link>
                </Button>
              </div>
            </PublicHeaderMobileDrawer>
          </>
        )}
      </header>
    )
  }
)
PublicHeader.displayName = "PublicHeader"
