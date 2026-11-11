import * as React from "react";
import { cn } from "../../utils/cn";
import { X, Loader2 } from "lucide-react";

export interface InputWithIconProps extends Omit<React.ComponentProps<"input">, "size"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconClickable?: boolean;
  onIconClick?: () => void;
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
  error?: string;
  size?: "sm" | "default" | "lg";
}

export const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  (
    {
      className,
      type = "text",
      icon,
      iconPosition = "left",
      iconClickable = false,
      onIconClick,
      clearable = false,
      onClear,
      loading = false,
      error,
      size = "default",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const isLeft = iconPosition === "left";
    const hasValue = Boolean(value || props.defaultValue);
    const showClear = clearable && !loading && hasValue;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const sizeClasses = {
      sm: "h-8 text-xs px-2.5",
      default: "h-9 text-xs px-3",
      lg: "h-10 text-sm px-3.5",
    };

    const paddingLeftClass = isLeft && icon ? (size === "sm" ? "pl-8" : "pl-9") : "";
    const paddingRightClass =
      (!isLeft && icon) || showClear || loading ? (size === "sm" ? "pr-8" : "pr-9") : "";

    return (
      <div className="relative w-full">
        {/* Left Icon */}
        {isLeft && icon && (
          <div
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
              iconClickable
                ? "cursor-pointer hover:text-foreground transition-colors"
                : "pointer-events-none"
            )}
            onClick={iconClickable ? onIconClick : undefined}
          >
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            "flex w-full rounded-md border border-input bg-background font-sans text-foreground transition-colors",
            "placeholder:text-muted-foreground/70",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizeClasses[size],
            paddingLeftClass,
            paddingRightClass,
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />

        {/* Right Icon / Clear / Loader */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {showClear && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Hapus teks"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!isLeft && icon && !loading && !showClear && (
            <div
              className={cn(
                iconClickable
                  ? "cursor-pointer hover:text-foreground transition-colors"
                  : "pointer-events-none"
              )}
              onClick={iconClickable ? onIconClick : undefined}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";
