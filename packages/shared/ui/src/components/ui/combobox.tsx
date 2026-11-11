import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "../../utils/cn"
import { Button } from "./button"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface ComboboxItem {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface ComboboxProps {
  options: ComboboxItem[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  popoverClassName?: string
  disabled?: boolean
  id?: string
  /**
   * Mode tampilan:
   * - 'auto': Jika options <= autoSwitchThreshold (default: 2), otomatis pakai switch radio segmented. Jika lebih, pakai dropdown combobox dengan search.
   * - 'combobox': Selalu tampilkan dropdown combobox.
   * - 'radio': Selalu tampilkan radio/switch segmented button group.
   */
  mode?: "auto" | "combobox" | "radio"
  autoSwitchThreshold?: number
}

function SegmentedRadioSwitch({
  options,
  value,
  onValueChange,
  className,
  disabled,
  id,
}: ComboboxProps) {
  const handleRadioKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !options.length) return
    const currentIndex = options.findIndex((o) => o.value === value)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % options.length
      onValueChange(options[nextIndex].value)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + options.length) % options.length
      onValueChange(options[prevIndex].value)
    }
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleRadioKeyDown}
      className={cn(
        "grid p-1 rounded-xl border border-border/60 bg-muted/40 dark:bg-slate-900/60 gap-1.5 shadow-2xs w-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "relative flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-xs cursor-pointer transition-all duration-200 select-none",
              isSelected
                ? "bg-background text-foreground dark:bg-slate-800 dark:text-slate-100 shadow-xs ring-1 ring-border/60 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40 font-normal"
            )}
          >
            {opt.icon ? (
              <span className="shrink-0">{opt.icon}</span>
            ) : opt.value === "active" ? (
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all shrink-0",
                  isSelected ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-emerald-500/40"
                )}
              />
            ) : opt.value === "inactive" ? (
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all shrink-0",
                  isSelected ? "bg-slate-400" : "bg-slate-400/40"
                )}
              />
            ) : (
              <span
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-primary/40 transition-all",
                  isSelected && "bg-primary border-primary text-primary-foreground"
                )}
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
              </span>
            )}
            <span className="truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function DropdownCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  popoverClassName,
  disabled,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlighted, setHighlighted] = React.useState(0)

  const selected = options.find((o) => o.value === value)
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [options, query])

  React.useEffect(() => {
    setHighlighted(0)
  }, [query, open])

  const handleSelect = (item: ComboboxItem) => {
    onValueChange(item.value)
    setOpen(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = filtered[highlighted]
      if (item) handleSelect(item)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 rounded-xl border-border/60 bg-background/80 text-xs font-normal hover:bg-background/95 transition-colors",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1.5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-xl border border-border/80 dark:border-slate-800 bg-popover dark:bg-slate-900 text-popover-foreground dark:text-slate-100 shadow-2xl p-0 z-[100]",
          popoverClassName
        )}
      >
        <div className="p-2 border-b border-border/40 dark:border-slate-800">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            iconLeft={<Search className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />}
            className="h-8 text-xs rounded-lg bg-background/80 dark:bg-slate-950/70 dark:border-slate-800"
          />
        </div>
        <div className="max-h-60 overflow-auto p-1 text-xs scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Tidak ada hasil cocok</p>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.value}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  handleSelect(item)
                }}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(idx)}
                className={cn(
                  "relative flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs outline-none cursor-pointer transition-colors",
                  idx === highlighted
                    ? "bg-primary/15 text-primary font-medium dark:bg-primary/20"
                    : "text-foreground dark:text-slate-200 hover:bg-muted/50 dark:hover:bg-slate-800/60"
                )}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center mr-1.5 shrink-0">
                  <Check className={cn("h-3.5 w-3.5 text-primary", item.value === value ? "opacity-100" : "opacity-0")} />
                </span>
                {item.icon && <span className="mr-2 shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Combobox(props: ComboboxProps) {
  const { mode = "auto", autoSwitchThreshold = 2, options } = props

  // Otomatis pakai radio switch jika opsi <= autoSwitchThreshold (default 2 opsi)
  const isRadioMode =
    mode === "radio" || (mode === "auto" && options.length <= autoSwitchThreshold && options.length > 0)

  if (isRadioMode) {
    return <SegmentedRadioSwitch {...props} />
  }

  return <DropdownCombobox {...props} />
}

export const SelectSwitch = Combobox
export const AdaptiveSelect = Combobox
