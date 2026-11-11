import * as React from "react"
import { Link } from "react-router-dom"
import { Code2 } from "lucide-react"

import { cn } from "../../utils/cn"

/* -------------------------------------------------------------------------
 * PublicFooterBrand
 * ------------------------------------------------------------------------- */
export interface PublicFooterBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  name?: string
  description?: string
  address?: string
  contact?: string
}

export const PublicFooterBrand = React.forwardRef<HTMLDivElement, PublicFooterBrandProps>(
  (
    {
      children,
      name = "BGS Digital Labs",
      description = "Mitra strategis rekayasa perangkat lunak (Software House & Technology Partner) untuk korporasi, startup, dan institusi. Kami merancang sistem web, mobile, cloud, dan arsitektur micro front end berkinerja tinggi.",
      address = "📍 Gedung Cyber 2, Lantai 18, Jakarta Selatan",
      contact = "✉️ halo@bgs-software.id • 📞 +62 (21) 8089-2340",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("space-y-4 lg:col-span-2", className)} {...props}>
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-foreground">{name}</span>
            </div>
            {description && (
              <p className="text-xs leading-relaxed max-w-sm text-muted-foreground">{description}</p>
            )}
            {(address || contact) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {address && <p>{address}</p>}
                {contact && <p>{contact}</p>}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
PublicFooterBrand.displayName = "PublicFooterBrand"

/* -------------------------------------------------------------------------
 * PublicFooterSection & PublicFooterLink
 * ------------------------------------------------------------------------- */
export interface PublicFooterSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  title: string
}

export const PublicFooterSection = React.forwardRef<HTMLDivElement, PublicFooterSectionProps>(
  ({ children, title, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">{title}</h4>
        <ul className="space-y-2 text-xs">{children}</ul>
      </div>
    )
  }
)
PublicFooterSection.displayName = "PublicFooterSection"

export interface PublicFooterLinkProps extends React.LiHTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode
  href?: string
  to?: string
}

export const PublicFooterLink = React.forwardRef<HTMLLIElement, PublicFooterLinkProps>(
  ({ children, href, to, className, ...props }, ref) => {
    return (
      <li ref={ref} className={cn(className)} {...props}>
        {to ? (
          <Link to={to} className="transition-colors hover:text-primary">
            {children}
          </Link>
        ) : href ? (
          <a href={href} className="transition-colors hover:text-primary">
            {children}
          </a>
        ) : (
          children
        )}
      </li>
    )
  }
)
PublicFooterLink.displayName = "PublicFooterLink"

/* -------------------------------------------------------------------------
 * PublicFooterBottom
 * ------------------------------------------------------------------------- */
export interface PublicFooterBottomProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  copyright?: React.ReactNode
  links?: Array<{ label: string; href: string }>
}

export const PublicFooterBottom = React.forwardRef<HTMLDivElement, PublicFooterBottomProps>(
  ({ children, copyright, links, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-t pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-muted-foreground",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <div>{copyright}</div>
            {links && links.length > 0 && (
              <div className="flex items-center gap-6">
                {links.map((link) => (
                  <a key={link.label} href={link.href} className="hover:underline">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
PublicFooterBottom.displayName = "PublicFooterBottom"

/* -------------------------------------------------------------------------
 * PublicFooter (Root)
 * ------------------------------------------------------------------------- */
export interface PublicFooterProps extends React.HTMLAttributes<HTMLElement> {
  brand?: string
  children?: React.ReactNode
}

export const PublicFooter = React.forwardRef<HTMLElement, PublicFooterProps>(
  ({ brand = "BGS Digital Labs", children, className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn("border-t bg-muted/40 py-14 text-sm text-muted-foreground", className)}
        {...props}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {children ? (
            children
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {/* Brand Info */}
                <PublicFooterBrand name={brand} />

                {/* Kolom Layanan */}
                <PublicFooterSection title="Layanan Utama">
                  <PublicFooterLink href="#services">Custom Web Application</PublicFooterLink>
                  <PublicFooterLink href="#services">Mobile App (iOS & Android)</PublicFooterLink>
                  <PublicFooterLink href="#services">Micro Front End Architecture</PublicFooterLink>
                  <PublicFooterLink href="#services">Cloud & DevOps Engineering</PublicFooterLink>
                  <PublicFooterLink href="#services">Modernisasi Legacy Monolitik</PublicFooterLink>
                </PublicFooterSection>

                {/* Kolom Solusi & Portfolio */}
                <PublicFooterSection title="Solusi Industri">
                  <PublicFooterLink href="#portfolio">Fintech & Payment Gateway</PublicFooterLink>
                  <PublicFooterLink href="#portfolio">E-Commerce & Supply Chain</PublicFooterLink>
                  <PublicFooterLink href="#portfolio">Healthcare & Telemedisin</PublicFooterLink>
                  <PublicFooterLink href="#portfolio">ERP & Internal Operations</PublicFooterLink>
                  <PublicFooterLink href="#portfolio">AI & Automated Workflows</PublicFooterLink>
                </PublicFooterSection>

                {/* Kolom Akses Cepat */}
                <PublicFooterSection title="Ekosistem">
                  <PublicFooterLink to="/compUI">Live Component UI Demo</PublicFooterLink>
                  <PublicFooterLink to="/compUI/widgets">Dashboard Showcase</PublicFooterLink>
                  <PublicFooterLink href="#pricing">Estimasi Biaya Proyek</PublicFooterLink>
                  <PublicFooterLink href="#contact">Jadwalkan Konsultasi</PublicFooterLink>
                </PublicFooterSection>
              </div>

              <PublicFooterBottom
                copyright={`© ${new Date().getFullYear()} ${brand}. Hak Cipta Dilindungi Undang-Undang.`}
                links={[
                  { label: "Syarat & Ketentuan", href: "#" },
                  { label: "Kebijakan Privasi", href: "#" },
                  { label: "SLA Layanan", href: "#" },
                ]}
              />
            </>
          )}
        </div>
      </footer>
    )
  }
)
PublicFooter.displayName = "PublicFooter"
