import React from 'react';
import { ChevronRight, Home, CornerDownRight, FileText } from 'lucide-react';
import { type NoteBreadcrumb } from './types';

interface NoteHierarchyBreadcrumbProps {
  chain: NoteBreadcrumb[];
  onSelectLevel: (item: NoteBreadcrumb, index: number) => void;
  onGoRoot: () => void;
}

export function NoteHierarchyBreadcrumb({
  chain,
  onSelectLevel,
  onGoRoot,
}: NoteHierarchyBreadcrumbProps) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 font-medium">
        <CornerDownRight className="h-3.5 w-3.5 text-primary" />
        <span>Silsilah Hirarki Catatan Turunan:</span>
      </div>

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onGoRoot}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/80 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer shadow-2xs"
        >
          <Home className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Induk Catatan (Root)</span>
        </button>

        {chain.map((item, idx) => {
          const isLast = idx === chain.length - 1;
          return (
            <React.Fragment key={`${item.kdJudul}-${item.tingkat}-${idx}`}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <button
                type="button"
                onClick={() => onSelectLevel(item, idx)}
                disabled={isLast}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  isLast
                    ? 'bg-primary/10 text-primary border border-primary/30 font-bold cursor-default shadow-xs'
                    : 'bg-card border border-border/80 hover:bg-accent hover:text-accent-foreground font-medium cursor-pointer shadow-2xs'
                }`}
              >
                <FileText className="h-3 w-3 text-primary/70 shrink-0" />
                <span className="font-mono text-[11px] text-muted-foreground">[{item.kdJudul}]</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{item.judul}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                  T{item.tingkat}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
