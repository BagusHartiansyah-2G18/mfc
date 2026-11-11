import * as React from "react"
import { Sparkles, X, ArrowRight } from "lucide-react"
import { cn } from "../../utils/cn"

/* -------------------------------------------------------------------------
 * PublicTopBannerBadge
 * ------------------------------------------------------------------------- */
export interface PublicTopBannerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode
}

export const PublicTopBannerBadge = React.forwardRef<HTMLSpanElement, PublicTopBannerBadgeProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xs",
          className
        )}
        {...props}
      >
        {children ? children : (
          <>
            <Sparkles className="h-3 w-3" />
            <span>Promo</span>
          </>
        )}
      </span>
    )
  }
)
PublicTopBannerBadge.displayName = "PublicTopBannerBadge"

/* -------------------------------------------------------------------------
 * PublicTopBannerText
 * ------------------------------------------------------------------------- */
export interface PublicTopBannerTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

export const PublicTopBannerText = React.forwardRef<HTMLParagraphElement, PublicTopBannerTextProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("text-xs font-medium sm:text-sm", className)} {...props}>
        {children}
      </p>
    )
  }
)
PublicTopBannerText.displayName = "PublicTopBannerText"

/* -------------------------------------------------------------------------
 * PublicTopBannerAction
 * ------------------------------------------------------------------------- */
export interface PublicTopBannerActionProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode
  href?: string
}

export const PublicTopBannerAction = React.forwardRef<HTMLAnchorElement, PublicTopBannerActionProps>(
  ({ children, href = "#contact", className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-90 transition-opacity",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <span>Klaim Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </a>
    )
  }
)
PublicTopBannerAction.displayName = "PublicTopBannerAction"

/* -------------------------------------------------------------------------
 * PublicTopBanner (Root)
 * ------------------------------------------------------------------------- */
export interface PublicTopBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  badge?: React.ReactNode
  action?: React.ReactNode
  onClose?: () => void
}

export const PublicTopBanner = React.forwardRef<HTMLDivElement, PublicTopBannerProps>(
  ({ children, badge, action, onClose, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Announcement"
        className={cn(
          "relative isolate flex items-center justify-between gap-x-4 bg-linear-to-r from-primary via-indigo-600 to-violet-700 px-4 py-2.5 text-white shadow-xs",
          className
        )}
        {...props}
      >
        <div className="flex flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          {children ? (
            children
          ) : (
            <>
              {badge ? badge : <PublicTopBannerBadge />}
              <PublicTopBannerText>
                Program Akselerasi Startup & Q2 Tech Revamp: Diskon hingga 25% + Free 2 Bulan DevOps Maintenance.
              </PublicTopBannerText>
              {action ? action : <PublicTopBannerAction />}
            </>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup banner"
            className="rounded-md p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
PublicTopBanner.displayName = "PublicTopBanner"
