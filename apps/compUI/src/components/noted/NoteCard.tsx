import { useState } from 'react';
import {
  Layers,
  Edit3,
  Trash2,
  ArrowRightCircle,
  Calendar,
  Wallet,
  User,
  Users,
  SlidersHorizontal,
  Upload,
  Globe,
  Eye,
  Paperclip,
  Receipt,
  ListChecks,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@org/ui';
import { type JudulNote } from './types';

interface NoteCardProps {
  note: JudulNote;
  currentUserId?: string;
  onEdit: (note: JudulNote) => void;
  onDelete: (note: JudulNote) => void;
  onEnterSub: (note: JudulNote) => void;
  onView?: (note: JudulNote) => void;
  onManageMembers?: (note: JudulNote) => void;
  onManageMedia?: (note: JudulNote) => void;
  onOpenSupportingDrawer?: (note: JudulNote) => void;
}

const STATUS_ACCENT: Record<JudulNote['status'], string> = {
  DRAFT: 'from-slate-400/70 via-slate-300/30',
  IN_PROGRESS: 'from-amber-400/80 via-amber-300/30',
  REVIEW: 'from-sky-400/80 via-sky-300/30',
  COMPLETED: 'from-emerald-400/80 via-emerald-300/30',
  BLOCKED: 'from-rose-400/80 via-rose-300/30',
};

export function NoteCard({
  note,
  currentUserId,
  onEdit,
  onDelete,
  onEnterSub,
  onView,
  onManageMembers,
  onManageMedia,
  onOpenSupportingDrawer,
}: NoteCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  const isOverdue =
    note.dueDate && new Date(note.dueDate) < new Date() && note.status !== 'COMPLETED';

  const fileCount = note.files?.length || 0;
  const collaboratorCount = note.collaborators?.length || 0;
  const trxCount = note.transactions?.length || 0;
  const checklistCount = note.checklists?.length || 0;

  const isInProgress = note.status === 'IN_PROGRESS';
  const isPic = Boolean(
    currentUserId && (note.picId === currentUserId || (!note.picId && note.kdMember === currentUserId))
  );
  const anggaranNol = !note.targetBudget || Number(note.targetBudget) === 0;
  const hideProgress = isPic && anggaranNol;

  const stats = [
    { key: 'files', icon: Paperclip, value: fileCount, label: 'berkas', cls: 'text-sky-600 dark:text-sky-400' },
    { key: 'trx', icon: Receipt, value: trxCount, label: 'transaksi', cls: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'checklist', icon: ListChecks, value: checklistCount, label: 'ceklist', cls: 'text-indigo-600 dark:text-indigo-400' },
  ].filter((s) => s.value > 0);

  const hasMeta = Boolean(note.targetBudget || note.dueDate);
  const supportingCount = trxCount + checklistCount;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 hover:z-20 transition-all duration-200">
      {/* Status accent strip */}
      <div className={`h-1 w-full rounded-t-2xl bg-gradient-to-r ${STATUS_ACCENT[note.status]} to-transparent`} />

      <div className="flex flex-1 items-stretch gap-3  p-4">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-3">
            {/* Top Badges: Level + Sharing + AI */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div>
                 <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  L {note.tingkat}
                </span>
                {note.sharingMode === 'PUBLIC' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5" /> Publik
                  </span>
                )}
                {note.sharingMode === 'KHUSUS' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" /> Khusus
                  </span>
                )}
                {note.isAiGenerated && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </span>
                )}

                {(collaboratorCount > 0 || note.picName) && (
                  <span className="mx-0.5 h-3 w-px bg-border/70" />
                )}

                {collaboratorCount > 1 && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
                    title={`${collaboratorCount} anggota tim`}
                  >
                    <Users className="h-3 w-3 shrink-0 text-primary" />
                    <span className="font-bold text-foreground">{collaboratorCount}</span> 
                  </span>
                )} 
              </div>

              <div className="flex items-center gap-1.5 flex-row justify-end ml-auto">
                
                <div
                  className="relative flex shrink-0 flex-col items-center self-start pl-2"
                  onMouseEnter={() => setActionsOpen(true)}
                  onMouseLeave={() => setActionsOpen(false)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActionsOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={actionsOpen}
                    className={`h-8 w-8 cursor-pointer ${actionsOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    title="Aksi lainnya"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  <div
                    role="menu"
                    className={`absolute right-full top-0 z-40 w-56 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-xl transition-all duration-150 ${
                      actionsOpen
                        ? 'visible translate-x-0 opacity-100 pointer-events-auto'
                        : 'invisible translate-x-1 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Aksi Catatan
                    </div>

                    {onOpenSupportingDrawer && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onOpenSupportingDrawer(note);
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span className="flex-1">Form Pendukung</span>
                        {supportingCount > 0 && (
                          <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{supportingCount}</span>
                        )}
                      </button>
                    )}

                    {onManageMedia && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onManageMedia(note);
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="flex-1">Form Upload</span>
                        {fileCount > 0 && (
                          <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">{fileCount}</span>
                        )}
                      </button>
                    )}

                    {onManageMembers && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onManageMembers(note);
                          setActionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="flex-1">Kelola Tim</span>
                        {collaboratorCount > 0 && (
                          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{collaboratorCount}</span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onEdit(note);
                        setActionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="flex-1">Edit Catatan</span>
                    </button>

                    <div className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onDelete(note);
                        setActionsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">Hapus Catatan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Summary */}
            <div
              onClick={() => (onView ? onView(note) : onEnterSub(note))}
              className="cursor-pointer group/title"
              title="Klik untuk membuka Mode Baca Catatan"
            >
              <h3
                className={`font-bold text-base group-hover/title:underline transition-colors line-clamp-2 ${
                  isInProgress
                    ? 'text-amber-600 dark:text-amber-400 group-hover/title:text-amber-700 dark:group-hover/title:text-amber-300'
                    : 'text-foreground group-hover/title:text-primary'
                }`}
              >
                {note.judul}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {note.ringkasan || 'Tidak ada ringkasan keterangan.'}
              </p>
            </div>
            <div className="flex justify-between space-y-1">
              {note.picName && (
                <span
                  className="inline-flex min-w-0 items-center gap-1 text-[10px] font-medium text-muted-foreground"
                  title={`PIC: ${note.picName}`}
                >
                  <User className="h-3 w-3 shrink-0 text-indigo-500" />
                  <span className="truncate max-w-[150px]">{note.picName}</span>
                </span>
              )}
              <div className="flex items-center gap-1.5 flex-row justify-end ml-auto">
                {onView && (
                  <Button
                    variant="outline"
                    onClick={() => onView(note)}
                    className="flex text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                    title="Mode Baca: Buka lembar dokumen & baca rinci"
                  >
                    <span>Read</span>
                    <Eye className="h-3.5 w-3.5" /> 
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => onEnterSub(note)}
                  className="flex text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                  title="Buka Hirarki Sub-Catatan Turunan"
                >
                  <span>Turunan</span>
                  <ArrowRightCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
           
            {/* Progress Bar (conditional) */}
            {!hideProgress && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Progres Aktivitas</span>
                  <span className="font-bold text-foreground font-mono">{note.progress || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      note.progress >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : note.progress >= 50
                        ? 'bg-gradient-to-r from-primary to-indigo-500'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${note.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats Chips */}
            {stats.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {stats.map(({ key, icon: Icon, value, label, cls }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1"
                    title={`${value} ${label}`}
                  >
                    <Icon className={`h-3 w-3 ${cls}`} />
                    <span className="text-[10px] font-bold text-foreground">{value}</span>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Meta: Budget, Due Date */}
            {hasMeta && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 border-t border-border/50 text-[11px]">
                {note.targetBudget !== undefined && note.targetBudget !== null && (
                  <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Pagu: <strong>Rp {Number(note.targetBudget).toLocaleString('id-ID')}</strong>
                    </span>
                  </div>
                )}

                {note.dueDate && (
                  <div
                    className={`flex items-center gap-1.5 min-w-0 ${
                      isOverdue ? 'text-rose-600 font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {isOverdue ? 'Terlambat: ' : 'Deadline: '}
                      {new Date(note.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Primary actions */} 
        </div>

        {/* More actions: single trigger, flyout on hover/click */}
        
      </div>
    </div>
  );
}
