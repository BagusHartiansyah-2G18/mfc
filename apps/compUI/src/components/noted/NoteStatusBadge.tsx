import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Flame,
  Search,
  Palette,
  Code2,
  TestTube2,
  Rocket,
} from 'lucide-react';

interface NoteStatusBadgeProps {
  status: string;
}

interface NoteStageBadgeProps {
  stage?: string | null;
}

interface NotePriorityBadgeProps {
  priority?: string | null;
}

export function NoteStatusBadge({ status }: NoteStatusBadgeProps) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          <span>Selesai</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          <span>Sedang Proses</span>
        </span>
      );
    case 'REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
          <AlertCircle className="h-3 w-3" />
          <span>Review</span>
        </span>
      );
    case 'BLOCKED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="h-3 w-3" />
          <span>Terhambat</span>
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/80">
          <FileEdit className="h-3 w-3" />
          <span>Draft</span>
        </span>
      );
  }
}

export function NoteStageBadge({ stage }: NoteStageBadgeProps) {
  if (!stage) return null;

  switch (stage) {
    case 'ANALISIS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
          <Search className="h-3 w-3" />
          <span>Analisis</span>
        </span>
      );
    case 'UI_DESIGN':
    case 'UI':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
          <Palette className="h-3 w-3" />
          <span>UI/UX</span>
        </span>
      );
    case 'DEVELOP':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
          <Code2 className="h-3 w-3" />
          <span>Develop</span>
        </span>
      );
    case 'TESTING':
    case 'TESTER':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <TestTube2 className="h-3 w-3" />
          <span>Testing</span>
        </span>
      );
    case 'DEPLOY':
    case 'DEPLOYMENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <Rocket className="h-3 w-3" />
          <span>Deploy</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground">
          {stage}
        </span>
      );
  }
}

export function NotePriorityBadge({ priority }: NotePriorityBadgeProps) {
  if (!priority) return null;

  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30 animate-pulse">
          <Flame className="h-3 w-3" />
          <span>URGENT</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <span>High</span>
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
          <span>Low</span>
        </span>
      );
    case 'MEDIUM':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
          <span>Med</span>
        </span>
      );
  }
}
