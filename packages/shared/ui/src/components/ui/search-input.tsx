import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "../../utils/cn"
import { Input, type InputProps } from "./input"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
  placeholder?: string
  className?: string
  id?: string
}

export function SearchInput({
  value,
  onChange,
  debounceMs = 300,
  placeholder = "Search...",
  className,
  id,
  ...rest
}: SearchInputProps) {
  const [internal, setInternal] = React.useState(value)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  React.useEffect(() => {
    if (!isControlled) setInternal(value)
  }, [value, isControlled])

  React.useEffect(() => {
    if (debounceMs <= 0) return
    const t = setTimeout(() => onChange(value), debounceMs)
    return () => clearTimeout(t)
  }, [value, debounceMs, onChange])

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        {...(rest as InputProps)}
        id={id}
        value={current}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
        iconLeft={<Search className="h-4 w-4 text-muted-foreground" aria-hidden />}
      />
    </div>
  )
}

export { SearchInput as DefaultSearchInput }
