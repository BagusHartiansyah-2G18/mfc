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
} from 'lucide-react';
import { Button } from '@org/ui';
import { type JudulNote } from './types';
import { NoteStatusBadge, NoteStageBadge, NotePriorityBadge } from './NoteStatusBadge';

interface NoteCardProps {
  note: JudulNote;
  onEdit: (note: JudulNote) => void;
  onDelete: (note: JudulNote) => void;
  onEnterSub: (note: JudulNote) => void;
  onView?: (note: JudulNote) => void;
  onManageMembers?: (note: JudulNote) => void;
  onManageMedia?: (note: JudulNote) => void;
  onOpenSupportingDrawer?: (note: JudulNote) => void;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onEnterSub,
  onView,
  onManageMembers,
  onManageMedia,
  onOpenSupportingDrawer,
}: NoteCardProps) {
  const isOverdue =
    note.dueDate && new Date(note.dueDate) < new Date() && note.status !== 'COMPLETED';

  const fileCount = note.files?.length || 0;
  const collaboratorCount = note.collaborators?.length || 0;
  const trxCount = note.transactions?.length || 0;
  const checklistCount = note.checklists?.length || 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              #{note.kdJudul}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Level {note.tingkat}
            </span>
            <NoteStageBadge stage={note.stage} />
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
          </div>

          <div className="flex items-center gap-1.5">
            <NotePriorityBadge priority={note.priority} />
            <NoteStatusBadge status={note.status} />
          </div>
        </div>

        {/* Title & Summary */}
        <div
          onClick={() => (onView ? onView(note) : onEnterSub(note))}
          className="cursor-pointer group/title"
          title="Klik untuk membuka Mode Baca Catatan"
        >
          <h3 className="font-bold text-base text-foreground group-hover/title:text-primary group-hover/title:underline transition-colors line-clamp-2">
            {note.judul}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {note.ringkasan || 'Tidak ada ringkasan keterangan.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Progres Aktivitas</span>
            <span className="font-bold text-foreground font-mono">{note.progress || 0}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                note.progress >= 100
                  ? 'bg-emerald-500'
                  : note.progress >= 50
                  ? 'bg-primary'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${note.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Enterprise Metrics: Budget, Due Date, PIC */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
          {note.targetBudget !== undefined && note.targetBudget !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Wallet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                Pagu: <strong>Rp {Number(note.targetBudget).toLocaleString('id-ID')}</strong>
              </span>
            </div>
          )}

          {note.dueDate && (
            <div
              className={`flex items-center gap-1.5 truncate ${
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

          {note.picName && (
            <div className="flex items-center gap-1.5 text-muted-foreground truncate col-span-2">
              <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">PIC: <strong>{note.picName}</strong></span>
            </div>
          )}
        </div>

        {/* Collaborator Avatars & Quick Tools */}
        <div className="pt-2.5 border-t border-border/40">
          <div className="flex items-center justify-between gap-2">
            {/* Team Stack */}
            <button
              type="button"
              onClick={() => onManageMembers?.(note)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/team cursor-pointer shrink-0"
              title="Kelola Tim & Follower"
            >
              <div className="flex -space-x-1.5 overflow-hidden">
                {note.collaborators && note.collaborators.length > 0 ? (
                  note.collaborators.slice(0, 3).map((c, i) => (
                    <div
                      key={c.id || i}
                      className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center shrink-0"
                      title={`${c.userName} (${c.role})`}
                    >
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                  ))
                ) : (
                  <div className="h-5 w-5 rounded-full ring-2 ring-card bg-muted text-muted-foreground text-[10px] flex items-center justify-center shrink-0">
                    <Users className="h-3 w-3" />
                  </div>
                )}
              </div>
              <span className="text-[11px] group-hover/team:text-primary font-medium">
                {collaboratorCount > 0 ? `${collaboratorCount} Anggota` : 'Atur Tim'}
              </span>
            </button>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Form Pendukung Badge */}
              <button
                type="button"
                onClick={() => onOpenSupportingDrawer?.(note)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors px-2 py-0.5 rounded-md border border-primary/25 cursor-pointer"
                title={`Buka Form Pendukung: ${trxCount} Transaksi, ${checklistCount} Ceklist`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>Pendukung</span>
                {(trxCount > 0 || checklistCount > 0) && (
                  <span className="bg-primary text-primary-foreground text-[9px] px-1 rounded-full font-bold">
                    {trxCount + checklistCount}
                  </span>
                )}
              </button>

              {/* Form Upload Badge */}
              <button
                type="button"
                onClick={() => onManageMedia?.(note)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors px-2 py-0.5 rounded-md border border-emerald-500/25 cursor-pointer"
                title={`Form Upload & Berkas (${fileCount} Berkas Terlampir)`}
              >
                <Upload className="h-3 w-3" />
                <span>Upload</span>
                {fileCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[9px] px-1 rounded-full font-bold">
                    {fileCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(note)}
              className="h-8 px-2 text-xs text-primary font-bold hover:bg-primary/10 cursor-pointer"
              title="Buka Lembar Dokumen & Mode Baca"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
              Baca
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(note)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
            title="Perbarui Catatan"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(note)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
            title="Hapus Catatan Beserta Turunannya"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Hapus
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => onEnterSub(note)}
          className="h-8 text-xs font-semibold gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          title="Buka Hirarki Sub-Catatan"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Sub-Catatan</span>
          <ArrowRightCircle className="h-3.5 w-3.5 ml-0.5 opacity-80" />
        </Button>
      </div>
    </div>
  );
}
