import { cn } from "../../utils/cn";

export interface StatusBadgeProps {
  status: "active" | "inactive" | "suspended" | "pending" | string;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  pulse = true,
  className,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const configs: Record<
    string,
    { text: string; bg: string; dot: string; textColor: string }
  > = {
    active: {
      text: "Aktif",
      bg: "bg-emerald-500/10",
      dot: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    inactive: {
      text: "Nonaktif",
      bg: "bg-slate-500/10",
      dot: "bg-slate-400",
      textColor: "text-slate-600 dark:text-slate-400",
    },
    suspended: {
      text: "Ditangguhkan",
      bg: "bg-red-500/10",
      dot: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
    },
    pending: {
      text: "Menunggu",
      bg: "bg-amber-500/10",
      dot: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  };

  const conf = configs[normalized] || {
    text: status,
    bg: "bg-muted",
    dot: "bg-muted-foreground",
    textColor: "text-muted-foreground",
  };

  const displayText = label || conf.text;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide select-none",
        conf.bg,
        conf.textColor,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          conf.dot,
          pulse && normalized === "active" && "animate-pulse"
        )}
      />
      {displayText}
    </span>
  );
}
