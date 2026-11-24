import { useState, useMemo } from 'react';
import {
  Search,
  Edit3,
  Trash2,
  ArrowRightCircle,
  FileQuestion,
  CornerDownRight,
  Calendar,
  User,
  Users,
  Paperclip,
  FileText,
  Upload,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { Button, Input } from '@org/ui';
import { type JudulNote } from './types';
import { NoteStatusBadge, NoteStageBadge, NotePriorityBadge } from './NoteStatusBadge';

interface NoteTreeTableProps {
  subNotes: JudulNote[];
  onEdit: (note: JudulNote) => void;
  onDelete: (note: JudulNote) => void;
  onEnterSub: (note: JudulNote) => void;
  onView?: (note: JudulNote) => void;
  onQuickStatusChange?: (note: JudulNote, nextStatus: string) => void;
  onManageMembers?: (note: JudulNote) => void;
  onManageMedia?: (note: JudulNote) => void;
  onOpenSupportingDrawer?: (note: JudulNote) => void;
}

export function NoteTreeTable({
  subNotes,
  onEdit,
  onDelete,
  onEnterSub,
  onView,
  onQuickStatusChange,
  onManageMembers,
  onManageMedia,
  onOpenSupportingDrawer,
}: NoteTreeTableProps) {
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return subNotes.filter((n) => {
      const matchSearch =
        !search.trim() ||
        n.judul.toLowerCase().includes(search.toLowerCase()) ||
        n.ringkasan.toLowerCase().includes(search.toLowerCase()) ||
        n.kdJudul.toLowerCase().includes(search.toLowerCase());

      const matchStage = filterStage === 'ALL' || n.stage === filterStage;

      return matchSearch && matchStage;
    });
  }, [subNotes, search, filterStage]);

  const now = new Date();

  return (
    <div className="space-y-3">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Daftar Sub-Catatan Turunan ({filtered.length} item)
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="h-8 text-xs rounded-lg border border-border/80 bg-card px-2.5 text-foreground cursor-pointer"
          >
            <option value="ALL">Semua Tahapan</option>
            <option value="ANALISIS">Analisis</option>
            <option value="UI_DESIGN">UI/UX Design</option>
            <option value="DEVELOP">Development</option>
            <option value="TESTING">Testing / QA</option>
            <option value="DEPLOY">Deployment</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari sub-catatan..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileQuestion className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {search ? 'Tidak ada sub-catatan yang cocok dengan pencarian.' : 'Belum ada sub-catatan di tingkat ini.'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search
                ? 'Coba gunakan kata kunci pencarian atau filter yang lain.'
                : 'Klik tombol "Tambah Sub-Catatan" di atas untuk membuat turunan baru.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-28">Kode Judul</th>
                  <th className="py-2.5 px-3">Judul & Tahapan</th>
                  <th className="py-2.5 px-3 w-36">Tim & Bukti</th>
                  <th className="py-2.5 px-3 w-28">Progres</th>
                  <th className="py-2.5 px-3 w-32">Status Kerja</th>
                  <th className="py-2.5 px-3 w-28">Tenggat Waktu</th>
                  <th className="py-2.5 px-3 w-44 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((item) => {
                  const isOverdue =
                    item.dueDate &&
                    new Date(item.dueDate) < now &&
                    item.status !== 'COMPLETED';

                  const fileCount = item.files?.length || 0;
                  const memberCount = item.collaborators?.length || 0;

                  return (
                    <tr
                      key={`${item.kdJudul}-${item.tingkat}`}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Kode */}
                      <td className="py-3 px-3 font-mono font-bold text-primary whitespace-nowrap">
                        <span className="bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                          #{item.kdJudul}
                        </span>
                      </td>

                      {/* Judul & Detail */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <NoteStageBadge stage={item.stage} />
                          <NotePriorityBadge priority={item.priority} />
                        </div>
                        <div
                          onClick={() => onView?.(item)}
                          className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors mt-0.5 cursor-pointer hover:underline"
                          title="Klik untuk membuka Mode Baca Catatan"
                        >
                          {item.judul}
                        </div>
                        <div className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5">
                          {item.ringkasan || '-'}
                        </div>
                        {item.picName && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                            <User className="h-3 w-3 text-indigo-500" />
                            <span>PIC: <strong>{item.picName}</strong></span>
                          </div>
                        )}
                      </td>

                      {/* Tim & Bukti Media */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-1.5">
                          {/* Avatar stack / team trigger */}
                          <button
                            type="button"
                            onClick={() => onManageMembers?.(item)}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            title="Kelola Tim & Follower"
                          >
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {item.collaborators && item.collaborators.length > 0 ? (
                                item.collaborators.slice(0, 2).map((c, i) => (
                                  <div
                                    key={c.id || i}
                                    className="h-4.5 w-4.5 rounded-full ring-1 ring-card bg-primary/20 text-primary font-bold text-[8px] flex items-center justify-center shrink-0"
                                  >
                                    {c.userName.charAt(0).toUpperCase()}
                                  </div>
                                ))
                              ) : (
                                <div className="h-4.5 w-4.5 rounded-full ring-1 ring-card bg-muted text-muted-foreground text-[8px] flex items-center justify-center shrink-0">
                                  <Users className="h-2.5 w-2.5" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">
                              {memberCount > 0 ? `${memberCount} Anggota` : 'Atur Tim'}
                            </span>
                          </button>

                          {/* Media Button */}
                          <button
                            type="button"
                            onClick={() => onManageMedia?.(item)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                            title="Form Upload & Lampiran Berkas"
                          >
                            <Upload className="h-3 w-3" />
                            <span>{fileCount > 0 ? `${fileCount} Berkas` : 'Form Upload'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Progres */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                            <span>{item.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.progress >= 100
                                  ? 'bg-emerald-500'
                                  : item.progress >= 50
                                  ? 'bg-primary'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown Cepat */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {onQuickStatusChange ? (
                          <select
                            value={item.status}
                            onChange={(e) => onQuickStatusChange(item, e.target.value)}
                            className="text-[11px] font-bold rounded-lg border border-border/80 bg-card px-2 py-1 cursor-pointer"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Under Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        ) : (
                          <NoteStatusBadge status={item.status} />
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                        {item.dueDate ? (
                          <div
                            className={`flex items-center gap-1 ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-muted-foreground'
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(item.dueDate).toLocaleDateString('id-ID')}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(item)}
                              className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer"
                              title="Buka Lembar Dokumen & Mode Baca"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageMembers?.(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title="Kelola Tim Anggota & Follower"
                          >
                            <Users className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onManageMedia?.(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                            title="Form Upload & Berkas Media (PDF/Foto)"
                          >
                            <Upload className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenSupportingDrawer?.(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 cursor-pointer"
                            title="Buka Form Pendukung (Buku Kas, Ceklist, Berkas, Tim, Approval)"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                            title="Edit Sub-Catatan"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            title="Hapus Sub-Catatan Beserta Anak-anaknya"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEnterSub(item)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 ml-1 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                            title="Masuk ke Hirarki Tingkat Berikutnya"
                          >
                            <span>Turunan</span>
                            <ArrowRightCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
