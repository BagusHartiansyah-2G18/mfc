import * as React from "react"
import { X, Loader2 } from "lucide-react"

import { cn } from "../../utils/cn"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string
  clearable?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  loading?: boolean
  invalid?: boolean
  onClear?: () => void
}

function Input({
  className,
  type,
  error,
  clearable,
  iconLeft,
  iconRight,
  loading,
  invalid,
  onClear,
  ...props
}: InputProps) {
  const id = React.useId()
  const errorId = `${id}-error`
  const showError = Boolean(error)
  const showClear = Boolean(clearable && !loading && Boolean(props.value || props.defaultValue))

  const handleClear = () => {
    if (onClear) {
      onClear()
      return
    }
    if (props.onChange) {
      props.onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)
    }
    if (props.value) (props.value as string) = ""
  }

  return (
    <div className="w-full">
      {error && (
        <p id={errorId} className="mb-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="relative">
        {iconLeft && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {iconLeft}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-9 pl-9 text-sm shadow-sm transition-colors",
            showError ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            iconLeft && "pl-9",
            loading && "opacity-60",
            className
          )}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
          disabled={loading}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Clear"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
          {iconRight && <div className="text-muted-foreground">{iconRight}</div>}
        </div>
      </div>
    </div>
  )
}

Input.displayName = "Input"

export { Input }
