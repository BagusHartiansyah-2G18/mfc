import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { Label } from "./label";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  action,
  children,
  className,
}: FormFieldProps) {
  const renderedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        'aria-invalid': (children.props as any)['aria-invalid'] ?? (error ? true : undefined),
        className: cn(
          (children.props as any).className,
          error && 'border-destructive focus-visible:ring-destructive ring-destructive/20'
        ),
      })
    : children;

  return (
    <div className={cn("w-full space-y-1.5 my-2 px-2", className)}>
      {(label || action) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <Label htmlFor={htmlFor} className="flex items-center gap-1 font-medium text-foreground">
              {label}
              {required && <span className="text-destructive font-bold">*</span>}
            </Label>
          )}
          {action && <div className="text-[11px] text-muted-foreground">{action}</div>}
        </div>
      )}

      {renderedChildren}

      {error ? (
        <p className="text-[11px] font-medium text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 leading-tight">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{helperText}</p>
      ) : null}
    </div>
  );
}
