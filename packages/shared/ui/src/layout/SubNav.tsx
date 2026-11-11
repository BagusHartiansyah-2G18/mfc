import * as React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../utils/cn";

export interface SubNavItem {
  path: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  end?: boolean;
  badge?: string | number;
  role?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export interface SubNavProps {
  title?: string;
  items: SubNavItem[];
  footerNotice?: React.ReactNode;
  className?: string;
}

export function SubNav({
  title,
  items,
  footerNotice,
  className,
}: SubNavProps) {
  return (
    <aside
      className={cn(
        "w-full md:w-64 shrink-0 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xs p-3 shadow-xs",
        className
      )}
    >
      {title && (
        <div className="mb-2.5 px-2.5 pt-1 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {title}
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
        </div>
      )}

      <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {items.map((item) => {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              role={item.role}
              onClick={item.onClick}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs sm:text-sm transition-all duration-150 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 shadow-xs dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon && (
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary ring-1 ring-primary/30 shadow-xs"
                          : "bg-muted/50 text-muted-foreground/80 group-hover:bg-muted group-hover:text-foreground"
                      )}
                    >
                      {React.isValidElement(item.icon)
                        ? item.icon
                        : item.icon
                        ? React.createElement(item.icon as any, {
                            className: "h-4 w-4 shrink-0",
                          })
                        : null}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="truncate leading-tight">{item.label}</div>
                    {item.description && (
                      <div
                        className={cn(
                          "text-[10px] font-normal truncate mt-0.5",
                          isActive
                            ? "text-primary/75"
                            : "text-muted-foreground/70 group-hover:text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {footerNotice && (
        <div className="mt-3.5 hidden md:flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
          {footerNotice}
        </div>
      )}
    </aside>
  );
}
