import { BookOpen, Users, Globe, ClipboardList, FolderOpen } from 'lucide-react';

export type WorkspaceSection = 'noted' | 'friend' | 'publikasi' | 'form' | 'dokumen';

interface WorkspaceNavProps {
  active: WorkspaceSection;
  kdJudul?: string;
  onNavigate?: (path: string) => void;
}

const ITEMS: Array<{
  key: WorkspaceSection;
  label: string;
  icon: typeof BookOpen;
}> = [
  { key: 'noted', label: 'Catatan', icon: BookOpen },
  { key: 'friend', label: 'Teman', icon: Users },
  { key: 'publikasi', label: 'Publikasi', icon: Globe },
  { key: 'form', label: 'Form Pendukung', icon: ClipboardList },
  { key: 'dokumen', label: 'Dokumen', icon: FolderOpen },
];

export function workspaceHref(section: WorkspaceSection, kdJudul?: string) {
  const kd = kdJudul ? encodeURIComponent(kdJudul) : '';
  switch (section) {
    case 'friend':
      return '/?panel=friend';
    case 'publikasi':
      return '/?tab=publikasi';
    case 'form':
      return kd ? `/forms/${kd}` : '/';
    case 'dokumen':
      return kd ? `/documents?kdJudul=${kd}` : '/documents';
    default:
      return '/';
  }
}

export function WorkspaceNav({ active, kdJudul, onNavigate }: WorkspaceNavProps) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/20 p-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        const href = workspaceHref(item.key, kdJudul);
        return (
          <a
            key={item.key}
            href={href}
            onClick={(event) => {
              if (!onNavigate) return;
              event.preventDefault();
              onNavigate(href);
            }}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-card text-foreground shadow-2xs border border-border/70'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
