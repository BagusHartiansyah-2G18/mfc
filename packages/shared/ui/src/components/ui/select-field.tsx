import * as React from "react";
import { cn } from "../../utils/cn";
import { FormField } from "./form-field";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<React.ComponentProps<"select">, "size" | "onChange"> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      placeholder,
      helperText,
      error,
      required,
      size = "default",
      icon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    const sizeClasses = {
      sm: "h-8 text-xs px-2.5",
      default: "h-9 text-xs px-3",
      lg: "h-10 text-sm px-3.5",
    };

    return (
      <FormField
        label={label}
        htmlFor={selectId}
        required={required}
        helperText={helperText}
        error={error}
      >
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full appearance-none rounded-xl border border-input bg-card font-sans text-foreground transition-colors [&>option]:bg-card [&>option]:text-foreground",
              "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50 pr-8 cursor-pointer shadow-xs",
              icon && "pl-8",
              sizeClasses[size],
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-card text-muted-foreground">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-card text-foreground py-2"
                style={{ backgroundColor: 'var(--card, #111827)', color: 'var(--foreground, #f9fafb)' }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </FormField>
    );
  }
);

SelectField.displayName = "SelectField";
