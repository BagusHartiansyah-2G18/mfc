import * as React from "react";
import { cn } from "../../utils/cn";
import { Badge } from "./badge";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabNavProps {
  items: TabNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "segmented" | "pills" | "underline";
  size?: "sm" | "md" | "lg" | string;
  fullWidth?: boolean;
  className?: string;
}

export function TabNav({
  items,
  activeId,
  onChange,
  variant = "segmented",
  size = "md",
  fullWidth = false,
  className,
}: TabNavProps) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 border-b border-border text-xs",
          className
        )}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex items-center gap-2 pb-2.5 font-medium transition-colors border-b-2 -mb-px cursor-pointer",
                isActive
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="text-[10px] h-4.5 px-1.5 font-normal"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: 'segmented' (default)
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1 border text-xs shadow-2xs",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer select-none",
              isActive
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              item.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="text-[10px] h-4.5 px-1.5 font-normal"
              >
                {item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
