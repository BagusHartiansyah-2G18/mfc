import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react"

import { cn } from "../../utils/cn"
import { Input } from "./input"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

/* -------------------------------------------------------------------------- */
/*                                Types & Context                             */
/* -------------------------------------------------------------------------- */

export type TableDensity = "compact" | "default" | "relaxed"
export type TableVariant = "default" | "striped" | "bordered"

export interface TableContextValue {
  density: TableDensity
  variant: TableVariant
  hoverable: boolean
  stickyHeader: boolean
}

const TableContext = React.createContext<TableContextValue>({
  density: "default",
  variant: "default",
  hoverable: true,
  stickyHeader: false,
})

export function useTableContext(): TableContextValue {
  return React.useContext(TableContext)
}

/* -------------------------------------------------------------------------- */
/*                             Compound Primitives                            */
/* -------------------------------------------------------------------------- */

export interface TableProps extends React.ComponentProps<"table"> {
  density?: TableDensity
  variant?: TableVariant
  hoverable?: boolean
  stickyHeader?: boolean
  containerClassName?: string
  responsive?: boolean
}

export function Table({
  className,
  containerClassName,
  density = "default",
  variant = "default",
  hoverable = true,
  stickyHeader = false,
  responsive = true,
  ...props
}: TableProps) {
  const contextValue = React.useMemo(
    () => ({ density, variant, hoverable, stickyHeader }),
    [density, variant, hoverable, stickyHeader]
  )

  const tableElement = (
    <table
      className={cn(
        "w-full caption-bottom text-left transition-colors border-collapse",
        variant === "bordered" && "border border-border",
        className
      )}
      {...props}
    />
  )

  return (
    <TableContext.Provider value={contextValue}>
      {responsive ? (
        <div
          className={cn(
            "relative w-full overflow-auto rounded-md border border-border/60 bg-card shadow-xs",
            variant === "bordered" && "border-border",
            containerClassName
          )}
        >
          {tableElement}
        </div>
      ) : (
        tableElement
      )}
    </TableContext.Provider>
  )
}
Table.displayName = "Table"

export interface TableHeaderProps extends React.ComponentProps<"thead"> {
  sticky?: boolean
}

export function TableHeader({ className, sticky, ...props }: TableHeaderProps) {
  const ctx = useTableContext()
  const isSticky = sticky ?? ctx.stickyHeader

  return (
    <thead
      className={cn(
        "[&_tr]:border-b border-border bg-muted/40",
        isSticky && "sticky top-0 z-10 bg-background/95 backdrop-blur-xs shadow-xs",
        className
      )}
      {...props}
    />
  )
}
TableHeader.displayName = "TableHeader"

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0 divide-y divide-border/60", className)}
      {...props}
    />
  )
}
TableBody.displayName = "TableBody"

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}
TableFooter.displayName = "TableFooter"

export interface TableRowProps extends React.ComponentProps<"tr"> {
  selected?: boolean
  clickable?: boolean
  hoverable?: boolean
}

export function TableRow({
  className,
  selected = false,
  clickable = false,
  hoverable: rowHoverable,
  ...props
}: TableRowProps) {
  const { hoverable: ctxHoverable, variant } = useTableContext()
  const isHoverable = rowHoverable ?? ctxHoverable

  return (
    <tr
      data-state={selected ? "selected" : undefined}
      className={cn(
        "border-b border-border/60 transition-colors",
        isHoverable && "hover:bg-muted/40",
        variant === "striped" && "even:bg-muted/20",
        selected && "bg-primary/5 hover:bg-primary/10 data-[state=selected]:bg-primary/5",
        clickable && "cursor-pointer",
        className
      )}
      {...props}
    />
  )
}
TableRow.displayName = "TableRow"

export interface TableHeadProps extends React.ComponentProps<"th"> {
  align?: "left" | "center" | "right"
}

export function TableHead({ className, align = "left", ...props }: TableHeadProps) {
  const { density, variant } = useTableContext()

  const densityStyles = {
    compact: "h-9 px-3 text-[11px]",
    default: "h-11 px-4 text-xs",
    relaxed: "h-14 px-6 text-sm",
  }

  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  return (
    <th
      className={cn(
        "align-middle font-semibold text-muted-foreground uppercase tracking-wider select-none",
        densityStyles[density],
        alignStyles[align],
        variant === "bordered" && "border-r border-border last:border-r-0",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}
TableHead.displayName = "TableHead"

export interface TableHeadSortableProps extends Omit<TableHeadProps, "onClick"> {
  sortDirection?: "asc" | "desc" | false
  onSort?: (nextDirection: "asc" | "desc" | false) => void
  children: React.ReactNode
}

export function TableHeadSortable({
  className,
  sortDirection = false,
  onSort,
  align = "left",
  children,
  ...props
}: TableHeadSortableProps) {
  const handleClick = () => {
    if (!onSort) return
    if (!sortDirection) onSort("asc")
    else if (sortDirection === "asc") onSort("desc")
    else onSort(false)
  }

  return (
    <TableHead
      align={align}
      className={cn(
        "cursor-pointer hover:bg-muted/70 transition-colors group",
        sortDirection && "text-foreground font-bold",
        className
      )}
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
          ? "descending"
          : "none"
      }
      onClick={handleClick}
      {...props}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          align === "center" && "justify-center w-full",
          align === "right" && "justify-end w-full"
        )}
      >
        <span>{children}</span>
        <span
          className={cn(
            "rounded p-0.5 transition-colors",
            sortDirection
              ? "text-primary bg-primary/10"
              : "text-muted-foreground/60 group-hover:text-foreground"
          )}
        >
          {sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : sortDirection === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </TableHead>
  )
}
TableHeadSortable.displayName = "TableHeadSortable"

export interface TableCellProps extends React.ComponentProps<"td"> {
  align?: "left" | "center" | "right"
  mono?: boolean
  truncate?: boolean
}

export function TableCell({
  className,
  align = "left",
  mono = false,
  truncate = false,
  ...props
}: TableCellProps) {
  const { density, variant } = useTableContext()

  const densityStyles = {
    compact: "py-2 px-3 text-xs",
    default: "py-3 px-4 text-sm",
    relaxed: "py-4.5 px-6 text-base",
  }

  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  return (
    <td
      className={cn(
        "align-middle text-foreground",
        densityStyles[density],
        alignStyles[align],
        mono && "font-mono text-xs",
        truncate && "truncate max-w-[200px]",
        variant === "bordered" && "border-r border-border last:border-r-0",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}
TableCell.displayName = "TableCell"

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
TableCaption.displayName = "TableCaption"

/* -------------------------------------------------------------------------- */
/*                         Empty & Skeleton Components                        */
/* -------------------------------------------------------------------------- */

export interface TableEmptyProps {
  colSpan: number
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function TableEmpty({
  colSpan,
  icon,
  title = "Tidak ada data ditemukan",
  description = "Belum ada rekaman data atau hasil pencarian tidak sesuai kriteria.",
  action,
  className,
}: TableEmptyProps) {
  return (
    <TableRow hoverable={false} className="hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className={cn("py-12 text-center text-muted-foreground", className)}
      >
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            {icon ?? <Inbox className="h-6 w-6" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="pt-2">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  )
}
TableEmpty.displayName = "TableEmpty"

export interface TableSkeletonProps {
  columns: number
  rows?: number
  className?: string
}

export function TableSkeleton({ columns, rows = 5, className }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <TableRow key={`sk-row-${rIdx}`} hoverable={false} className="animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <TableCell key={`sk-cell-${rIdx}-${cIdx}`} className={className}>
              <div
                className="h-4 rounded bg-muted/80"
                style={{
                  width: `${55 + ((rIdx * 17 + cIdx * 23) % 40)}%`,
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
TableSkeleton.displayName = "TableSkeleton"

/* -------------------------------------------------------------------------- */
/*                         Toolbar & Pagination Components                    */
/* -------------------------------------------------------------------------- */

export interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchSlot?: React.ReactNode
  filterSlot?: React.ReactNode
  actionSlot?: React.ReactNode
  selectedCount?: number
  bulkActions?: React.ReactNode
  onClearSelection?: () => void
}

export function TableToolbar({
  searchSlot,
  filterSlot,
  actionSlot,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  className,
  children,
  ...props
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 bg-card rounded-t-lg border-b border-border/80 transition-colors",
        selectedCount > 0 && "bg-primary/5 border-primary/20",
        className
      )}
      {...props}
    >
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {selectedCount}
            </span>
            <span>baris terpilih</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Batalkan pilihan
              </button>
            )}
          </div>
          {bulkActions && <div className="flex items-center gap-2">{bulkActions}</div>}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {searchSlot}
            {filterSlot}
          </div>
          {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
TableToolbar.displayName = "TableToolbar"

export interface TablePaginationProps {
  page: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newPageSize: number) => void
  showTotal?: boolean
  className?: string
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  showTotal = true,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const pages: (number | "ellipsis")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis")
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/80 bg-card text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showTotal && (
          <span>
            Menampilkan <strong className="font-semibold text-foreground">{from}</strong> -{" "}
            <strong className="font-semibold text-foreground">{to}</strong> dari{" "}
            <strong className="font-semibold text-foreground">{totalItems}</strong> data
          </span>
        )}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`ell-${idx}`} className="px-1 text-muted-foreground select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "inline-flex h-8 min-w-8 px-2 items-center justify-center rounded font-medium transition-colors cursor-pointer text-xs",
                p === page
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
TablePagination.displayName = "TablePagination"

/* -------------------------------------------------------------------------- */
/*             TanStack Powered Enterprise DataTable Component                */
/* -------------------------------------------------------------------------- */

export type FetchParams = {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  globalFilter: string
}

export type FetchResult<T> = {
  data: T[]
  totalCount: number
}

export type Fetcher<T> = (
  params: FetchParams
) => Promise<FetchResult<T> | { data: T[]; total: number }>

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data?: TData[]
  fetcher?: Fetcher<TData>
  loading?: boolean
  error?: string | null
  showSearch?: boolean
  showPagination?: boolean
  enableSorting?: boolean
  enableRowSelection?: boolean
  enableGlobalFilter?: boolean
  searchPlaceholder?: string
  emptyText?: string
  pageSize?: number
  pageSizeOptions?: number[]
  toolbar?: React.ReactNode
  bulkActions?: (
    selectedRows: TData[],
    selectedRowIds: Record<string, boolean>
  ) => React.ReactNode
  className?: string
  containerClassName?: string
  tableContainerClassName?: string
  density?: TableDensity
  variant?: TableVariant
  stickyHeader?: boolean
  hoverable?: boolean
  getRowId?: (row: TData, index: number) => string
  onRowClick?: (row: TData) => void
  onRowSelectionChange?: (
    selectedRows: TData[],
    selectedRowIds: Record<string, boolean>
  ) => void
  emptyState?: {
    icon?: React.ReactNode
    title?: string
    description?: string
    action?: React.ReactNode
  }
}

export function DataTable<TData>({
  columns,
  data,
  fetcher,
  loading: controlledLoading,
  error,
  showSearch = true,
  showPagination = true,
  enableSorting = true,
  enableRowSelection = false,
  enableGlobalFilter = true,
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  toolbar,
  bulkActions,
  className,
  containerClassName,
  tableContainerClassName,
  density = "default",
  variant = "default",
  stickyHeader = false,
  hoverable = true,
  getRowId,
  onRowClick,
  onRowSelectionChange,
  emptyState,
}: DataTableProps<TData>) {
  const isServer = !!fetcher

  const [internalData, setInternalData] = React.useState<TData[]>(() => data ?? [])
  const [totalCount, setTotalCount] = React.useState<number>(() => data?.length ?? 0)
  const [isFetching, setIsFetching] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [debouncedFilter, setDebouncedFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize })
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setPagination((prev) => (prev.pageSize === pageSize ? prev : { ...prev, pageSize }))
  }, [pageSize])

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(globalFilter), 300)
    return () => clearTimeout(t)
  }, [globalFilter])

  React.useEffect(() => {
    if (!isServer) {
      setInternalData(data ?? [])
      setTotalCount(data?.length ?? 0)
    }
  }, [data, isServer])

  React.useEffect(() => {
    if (!isServer || !fetcher) return
    let cancelled = false
    const run = async () => {
      setIsFetching(true)
      setFetchError(null)
      try {
        const res = await fetcher({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting,
          globalFilter: debouncedFilter,
        })
        if (cancelled) return
        const total =
          (res as FetchResult<TData>).totalCount ??
          (res as { total: number }).total ??
          res.data.length
        setInternalData(res.data)
        setTotalCount(total)
      } catch (e) {
        if (cancelled) return
        setFetchError(e instanceof Error ? e.message : "Failed to fetch data")
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [isServer, fetcher, pagination.pageIndex, pagination.pageSize, sorting, debouncedFilter])

  const displayData = React.useMemo(
    () => (isServer ? internalData : (data ?? [])),
    [isServer, internalData, data]
  )

  const displayColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    if (!enableRowSelection) return columns
    const selectCol: ColumnDef<TData, any> = {
      id: "_select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    }
    return [selectCol, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data: displayData,
    columns: displayColumns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      pagination: showPagination ? pagination : undefined,
      rowSelection,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    onPaginationChange: showPagination ? setPagination : undefined,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: !isServer && enableGlobalFilter ? getFilteredRowModel() : undefined,
    getSortedRowModel: !isServer && enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: !isServer && showPagination ? getPaginationRowModel() : undefined,
    manualPagination: isServer && showPagination,
    manualSorting: isServer && enableSorting,
    manualFiltering: isServer && enableGlobalFilter,
    rowCount: isServer && showPagination ? totalCount : undefined,
    getRowId: getRowId as never,
    enableRowSelection,
  })

  React.useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return
    const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
    onRowSelectionChange(selected, rowSelection)
  }, [rowSelection, enableRowSelection, onRowSelectionChange, table])

  const isLoading = controlledLoading ?? isFetching
  const activeError = error ?? fetchError
  const colSpan = displayColumns.length || 1
  const rows = table.getRowModel().rows
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length

  return (
    <div className={cn("flex flex-col gap-3 w-full", containerClassName)}>
      {/* Top Controls: Search, Toolbar & Bulk Actions */}
      {(showSearch && enableGlobalFilter) || toolbar || selectedCount > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {showSearch && enableGlobalFilter ? (
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => {
                    const v = e.target.value
                    setGlobalFilter(v)
                    if (isServer && showPagination) setPagination((p) => ({ ...p, pageIndex: 0 }))
                  }}
                  className={cn("pl-8 h-9 text-xs", globalFilter && "pr-8")}
                />
                {globalFilter && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setGlobalFilter("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : null}

            {selectedCount > 0 && bulkActions ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">
                  {selectedCount} baris terpilih
                </span>
                {bulkActions(selectedRows, rowSelection)}
              </div>
            ) : null}
          </div>

          {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {/* Main Table Container */}
      <Table
        density={density}
        variant={variant}
        stickyHeader={stickyHeader}
        hoverable={hoverable}
        className={className}
        containerClassName={tableContainerClassName}
      >
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    className={cn(canSort && "select-none")}
                    style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown
                          className={cn(
                            "h-3.5 w-3.5 opacity-40 transition-opacity",
                            header.column.getIsSorted() && "opacity-100 text-primary"
                          )}
                        />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {activeError ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-sm font-medium text-destructive">
                {activeError}
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-28 text-center">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading...
                </span>
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={enableRowSelection && row.getIsSelected() ? "selected" : undefined}
                clickable={!!onRowClick}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={cell.column.getSize() !== 150 ? { width: cell.column.getSize() } : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : emptyState ? (
            <TableEmpty
              colSpan={colSpan}
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
              action={emptyState.action}
            />
          ) : (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Bar */}
      {showPagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="text-xs font-medium text-muted-foreground">
            {enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0
              ? `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected • `
              : null}
            {isServer ? `${totalCount} total` : `${table.getFilteredRowModel().rows.length} row(s)`}
            {isServer && isFetching ? " • updating..." : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs font-medium text-muted-foreground">Rows per page</span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) => {
                  const next = Number(v)
                  setPagination(() => ({ pageIndex: 0, pageSize: next }))
                }}
              >
                <SelectTrigger className="h-8 w-[74px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
              aria-label="Previous page"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
              aria-label="Next page"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
DataTable.displayName = "DataTable"

/* Re-export TanStack utilities for direct usage by consumers */
export { flexRender, type ColumnDef, type SortingState }
