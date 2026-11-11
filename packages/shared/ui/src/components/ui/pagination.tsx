import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "../../utils/cn"
import { buttonVariants } from "./button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages: (number | "ellipsis")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis")
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-1", className)} role="navigation" aria-label="Pagination">
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2")}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <MoreHorizontal key={`e-${idx}`} className="h-4 w-4 px-1 text-muted-foreground" aria-hidden />
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: p === currentPage ? "default" : "outline", size: "sm" }),
              "min-w-8"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2")}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
Pagination.displayName = "Pagination"

export { Pagination }
