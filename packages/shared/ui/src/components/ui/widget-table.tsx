import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "../../utils/cn"
import { Input } from "./input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { Pagination } from "./pagination"
import { Skeleton } from "./skeleton"
import { Empty } from "./empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import type { Column, TableConfig } from "./widget-types"

interface WidgetTableProps<T> {
  columns: Column<T>[]
  config: TableConfig<T>
  skeletonRows?: number
  className?: string
}

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

function rowMatches<T>(row: T, query: string, searchKeys: Array<keyof T & string> | undefined): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  const keys = searchKeys ?? Object.keys(row as Record<string, unknown>)
  return keys.some((k) => {
    const v = getValue(row, String(k))
    if (v == null) return false
    return String(v).toLowerCase().includes(normalized)
  })
}

export function WidgetTable<T = Record<string, unknown>>({
  columns,
  config,
  skeletonRows,
  className,
}: WidgetTableProps<T>) {
  const isRemote = "url" in config && typeof (config as { url?: string }).url === "string"
  const [pageSizeState, setPageSizeState] = React.useState<number>(config.pageSize ?? 8)
  const pageSize = pageSizeState
  const skRows = skeletonRows ?? pageSize
  const searchKeys = config.searchKeys

  const [query, setQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [remoteRows, setRemoteRows] = React.useState<T[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)

  // debounce search (remote)
  React.useEffect(() => {
    if (!isRemote) return
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query, isRemote])

  // reset page on query change
  React.useEffect(() => {
    setPage(1)
  }, [query])

  // remote fetch
  React.useEffect(() => {
    if (!isRemote) return
    const url = (config as { url: string }).url
    let cancelled = false
    const controller = new AbortController()

    async function fetchPage() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        })
        if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim())
        const res = await fetch(`${url}?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = (await res.json()) as { data?: T[]; total?: number }
        const rows = Array.isArray(json.data) ? json.data : []
        if (!cancelled) {
          setRemoteRows(rows)
          setTotal(typeof json.total === "number" ? json.total : rows.length)
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to load data")
        setRemoteRows([])
        setTotal(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchPage()
    return () => {
      cancelled = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemote, page, pageSize, debouncedQuery, reloadKey])

  // local-fallback memo
  const localRows = React.useMemo<T[]>(() => {
    if (isRemote) return []
    const data = (config as { data: T[] }).data ?? []
    return data.filter((r) => rowMatches(r, query, searchKeys))
  }, [isRemote, config, query, searchKeys])

  const rows = isRemote ? remoteRows : localRows
  const totalRows = isRemote ? total : localRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, totalPages)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            aria-label="Search table"
            className="pl-8"
          />
        </div>
        {isRemote && loading && (
          <span className="text-xs text-muted-foreground" role="status">Loading…</span>
        )}
      </div>

      {isRemote && loading ? (
        <div className="rounded-md border" aria-busy="true" aria-label="Loading table">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: skRows }).map((_, ri) => (
                <TableRow key={`sk-${ri}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <div className="rounded-md border p-6 text-center">
          <p className="text-sm font-medium">Failed to load data</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 text-sm font-medium underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <Empty title="No results" description="Try a different search." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isRemote
              ? rows
              : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
            ).map((row, idx) => (
              <TableRow key={`${idx}-${String(getValue(row, columns[0]?.key ?? "") ?? idx)}`}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.key === columns[0]?.key ? "font-medium" : undefined}>
                    {c.render ? c.render(row) : String(getValue(row, c.key) ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Showing {totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(totalRows, currentPage * pageSize)} of {totalRows}
        </p>
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSizeState(Number(v)); setPage(1) }}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
WidgetTable.displayName = "WidgetTable"
