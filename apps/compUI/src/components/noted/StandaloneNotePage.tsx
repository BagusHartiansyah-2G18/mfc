import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Printer,
  Copy,
  Check,
  Edit3,
  Calendar,
  Clock,
  User,
  Wallet,
  CheckCircle2,
  Circle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  Plus,
  RefreshCw,
  FolderTree,
  Globe,
  Users,
  ShieldCheck,
  LogIn,
  AlertCircle,
  ArrowLeft,
  FileDown,
  Paperclip,
  Download,
  Eye,
} from 'lucide-react';
import { Button, Card } from '@org/ui';
import { authFetch, useAuth } from '@org/auth';
import {
  type JudulNote,
  type JudulChecklist,
  type JudulFile,
  type NoteBreadcrumb,
  type NoteFormData,
} from './types';
import { NoteStatusBadge, NoteStageBadge, NotePriorityBadge } from './NoteStatusBadge';
import { NoteFormModal } from './NoteFormModal';
import { NoteMembersModal } from './NoteMembersModal';
import { NoteMediaModal } from './NoteMediaModal';

interface StandaloneNotePageProps {
  kdJudul?: string;
  apiBaseUrl?: string;
}

interface NotePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAddChild: boolean;
  role: string;
  isPublic: boolean;
  assignedAtKdJudul?: string;
  isLoggedIn: boolean;
  currentUser?: { id: string; email: string; role: string } | null;
}

export function StandaloneNotePage({
  kdJudul: propKdJudul,
  apiBaseUrl = 'http://localhost:3002/api',
}: StandaloneNotePageProps) {
  const { session, isDevBypass } = useAuth();

  // 1. Ekstraksi kdJudul dari props, pathname (/n/:kdJudul, /noted/view/:kdJudul), atau query params (?viewNote=...)
  const getKdJudulFromLocation = (): string => {
    if (propKdJudul) return propKdJudul;
    if (typeof window === 'undefined') return '';

    const path = window.location.pathname;

    const nMatch = path.match(/\/n\/([^/?#]+)/);
    if (nMatch && nMatch[1]) return decodeURIComponent(nMatch[1]);

    const viewMatch = path.match(/\/noted\/view\/([^/?#]+)/);
    if (viewMatch && viewMatch[1]) return decodeURIComponent(viewMatch[1]);

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('viewNote') || params.get('note') || params.get('kdJudul');
    if (viewParam) return decodeURIComponent(viewParam);

    return '1'; // fallback default ke #1
  };

  const [activeKdJudul, setActiveKdJudul] = useState<string>(getKdJudulFromLocation());
  const [note, setNote] = useState<JudulNote | null>(null);
  const [ancestorChain, setAncestorChain] = useState<NoteBreadcrumb[]>([]);
  const [childNotes, setChildNotes] = useState<JudulNote[]>([]);
  const [permissions, setPermissions] = useState<NotePermissions>({
    canEdit: false,
    canDelete: false,
    canAddChild: false,
    role: 'PUBLIC',
    isPublic: true,
    isLoggedIn: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [togglingChecklistId, setTogglingChecklistId] = useState<string | null>(null);

  // Modal State untuk Mode Khusus (CRUD bagi Anggota)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // 2. Fetch Detail Catatan Mandiri
  const fetchNoteDetail = useCallback(
    async (code: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await authFetch(`${apiBaseUrl}/sharing/note-detail/${encodeURIComponent(code)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.message || `Catatan #${code} tidak dapat dimuat (HTTP ${res.status}).`
          );
        }

        const data = json.data;
        setNote(data.current);
        setAncestorChain(Array.isArray(data.induk) ? data.induk : []);
        setChildNotes(Array.isArray(data.sub) ? data.sub : []);
        if (data.permissions) {
          setPermissions(data.permissions);
        }
      } catch (err: any) {
        console.error('[StandaloneNotePage] Error:', err);
        setError(err.message || 'Gagal memuat catatan.');
      } finally {
        setIsLoading(false);
      }
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    if (activeKdJudul) {
      fetchNoteDetail(activeKdJudul);
    }
  }, [activeKdJudul, fetchNoteDetail]);

  // Update browser URL tanpa reload
  const navigateToNote = (targetKdJudul: string) => {
    setActiveKdJudul(targetKdJudul);
    try {
      const newUrl = `/n/${encodeURIComponent(targetKdJudul)}`;
      window.history.pushState({}, '', newUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Salin Link Publik
  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/n/${encodeURIComponent(activeKdJudul)}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Cetak Dokumen
  const handlePrint = () => {
    window.print();
  };

  // Toggle Checklist (Khusus Anggota dengan canEdit)
  const handleToggleChecklist = async (ch: JudulChecklist) => {
    if (!permissions.canEdit || !note) return;
    const nextCompleted = !ch.isCompleted;
    setTogglingChecklistId(ch.id);

    try {
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/checklists/${ch.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isCompleted: nextCompleted,
          syncProgress: true,
        }),
      });

      if (res.ok) {
        fetchNoteDetail(note.kdJudul);
      }
    } catch (err) {
      console.warn('Gagal mengubah checklist:', err);
    } finally {
      setTogglingChecklistId(null);
    }
  };

  // Simpan Edit Catatan (Khusus Anggota)
  const handleSaveEdit = async (data: NoteFormData) => {
    if (!note) return;
    const res = await authFetch(`${apiBaseUrl}/notes/upd`, {
      method: 'PUT',
      body: JSON.stringify({
        kdJudul: note.kdJudul,
        judul: data.judul,
        ringkasan: data.ringkasan,
        catatanDetail: data.catatanDetail,
        status: data.status,
        priority: data.priority,
        stage: data.stage,
        progress: data.progress,
        weight: data.weight,
        targetBudget: data.targetBudget,
        dueDate: data.dueDate,
        picName: data.picName,
        picId: data.picId,
        tags: data.tags,
        sharingMode: data.sharingMode,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || 'Gagal menyimpan perubahan.');
    }

    await fetchNoteDetail(note.kdJudul);
  };

  // Simpan Tambah Sub-Catatan (Khusus Anggota - Level Bawahnya)
  const handleSaveSubNote = async (data: NoteFormData) => {
    if (!note) return;
    const res = await authFetch(`${apiBaseUrl}/notes/add`, {
      method: 'POST',
      body: JSON.stringify({
        kdJudul: note.kdJudul, // parent
        tingkat: note.tingkat + 1,
        judul: data.judul,
        ringkasan: data.ringkasan,
        catatanDetail: data.catatanDetail,
        status: data.status,
        priority: data.priority,
        stage: data.stage,
        weight: data.weight,
        targetBudget: data.targetBudget,
        dueDate: data.dueDate,
        picName: data.picName,
        picId: data.picId,
        tags: data.tags,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || 'Gagal menambahkan sub-catatan.');
    }

    await fetchNoteDetail(note.kdJudul);
  };

  // Format Angka Rupiah
  const formatRupiah = (val?: number | string | null) => {
    if (val === null || val === undefined || val === '') return 'Rp 0';
    const num = Number(val);
    return isNaN(num) ? 'Rp 0' : `Rp ${num.toLocaleString('id-ID')}`;
  };

  const completedChecklistCount = (note?.checklists || []).filter((c) => c.isCompleted).length;
  const totalChecklistCount = (note?.checklists || []).length;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col">
      {/* ========================================================= */}
      {/* 1. PUBLIC TOP HEADER BAR                                   */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-8 py-3 shrink-0 print:hidden shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Brand & Note Identifier */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  Noted Hub
                </span>
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                  #{activeKdJudul}
                </span>
                {note && (
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Tingkat {note.tingkat}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Dokumen Dekomposisi Proyek & Tata Kelola MFC
              </p>
            </div>
          </div>

          {/* Mode Badge & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Indikator Mode Publik vs Khusus */}
            {permissions.canEdit ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 shadow-2xs">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                <span>Mode Khusus: Anggota Tim (Bisa CRUD)</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mode Publik (Read-Only)</span>
              </span>
            )}

            {/* Tombol Salin Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs gap-1.5 cursor-pointer shadow-2xs"
              title="Salin tautan mandiri catatan ini"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </Button>

            {/* Tombol Cetak Dokumen */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 cursor-pointer shadow-2xs hidden sm:flex"
              title="Cetak lembar dokumen resmi"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak</span>
            </Button>

            {/* Tombol Aksi Anggota (Jika Punya Izin CRUD) */}
            {permissions.canEdit && note && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-8 text-xs font-semibold gap-1.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer shadow-2xs"
                  title="Edit rincian catatan ini"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsAddChildModalOpen(true)}
                  className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                  title="Tambah sub-catatan turunan di bawah level ini"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Sub-Catatan</span>
                </Button>
              </>
            )}

            {/* Tombol Login (Jika Belum Login & Ingin Kolaborasi) */}
            {!permissions.isLoggedIn && (
              <Button
                asChild
                variant="default"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 cursor-pointer shadow-xs"
              >
                <a href={`/login?redirect=/n/${encodeURIComponent(activeKdJudul)}`}>
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Masuk untuk Kolaborasi</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN DOCUMENT CONTAINER                                */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Gagal Memuat Catatan</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNoteDetail(activeKdJudul)}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
              </Button>
              {!permissions.isLoggedIn && (
                <Button asChild variant="default" size="sm" className="text-xs gap-1.5">
                  <a href={`/login?redirect=/n/${encodeURIComponent(activeKdJudul)}`}>
                    <LogIn className="h-3.5 w-3.5" /> Masuk dengan Akun Anggota
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !error && (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-64 bg-muted rounded-xl" />
            <div className="h-40 bg-muted/60 rounded-2xl" />
            <div className="h-64 bg-muted/40 rounded-2xl" />
          </div>
        )}

        {/* Loaded Document */}
        {!isLoading && !error && note && (
          <>
            {/* Breadcrumb Silsilah Induk */}
            {ancestorChain.length > 0 && (
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap py-1">
                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                  <FolderTree className="h-3.5 w-3.5 text-primary" />
                  <span>Jalur Silsilah:</span>
                </span>
                {ancestorChain.map((anc, idx) => (
                  <React.Fragment key={anc.kdJudul}>
                    <button
                      type="button"
                      onClick={() => navigateToNote(anc.kdJudul)}
                      className={`hover:text-primary transition-colors cursor-pointer font-medium ${
                        anc.kdJudul === note.kdJudul ? 'text-primary font-bold' : ''
                      }`}
                    >
                      #{anc.kdJudul} {anc.judul}
                    </button>
                    {idx < ancestorChain.length - 1 && <span className="opacity-40">/</span>}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Clean Enterprise Document Sheet */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg space-y-8 print:border-none print:shadow-none print:p-0">
              {/* Document Header & Metadata */}
              <div className="space-y-4 border-b border-border/80 pb-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black bg-primary text-primary-foreground px-3 py-1 rounded-lg shadow-2xs">
                      #{note.kdJudul}
                    </span>
                    <NoteStageBadge stage={note.stage} />
                    <NotePriorityBadge priority={note.priority} />
                    <NoteStatusBadge status={note.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Dibuat:{' '}
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
                    {note.judul}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {note.ringkasan}
                  </p>
                </div>

                {/* Info Bar (PIC, Target Pagu, Batas Waktu) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2.5">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <div className="text-xs">
                      <p className="text-muted-foreground text-[10px]">Penanggung Jawab (PIC)</p>
                      <p className="font-semibold text-foreground truncate">
                        {note.picName || 'Belum Ditugaskan'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2.5">
                    <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="text-muted-foreground text-[10px]">Pagu Target Anggaran</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(note.targetBudget)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="text-xs">
                      <p className="text-muted-foreground text-[10px]">Batas Waktu (Due Date)</p>
                      <p className="font-semibold text-foreground">
                        {note.dueDate
                          ? new Date(note.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Tidak Ada Batas Waktu'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Rollup Bar */}
              <div className="space-y-2 rounded-2xl bg-muted/30 border border-border/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Capaian Progres Dokumen</span>
                  </span>
                  <span className="font-mono text-primary font-bold text-sm">
                    {note.progress || 0}% Selesai
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${note.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Catatan Teknis Detail (Markdown Body) */}
              {note.catatanDetail ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Uraian & Spesifikasi Teknis Dokumen</span>
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap rounded-2xl bg-muted/20 border border-border/50 p-5">
                    {note.catatanDetail}
                  </div>
                </div>
              ) : null}

              {/* Butir Capaian / Deliverables Checklist */}
              {totalChecklistCount > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Butir Capaian & Deliverables</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {completedChecklistCount} dari {totalChecklistCount} Tuntas
                    </span>
                  </div>

                  <div className="space-y-2">
                    {note.checklists?.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => permissions.canEdit && handleToggleChecklist(ch)}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          ch.isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground'
                            : 'bg-card border-border/70 text-foreground'
                        } ${permissions.canEdit ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'}`}
                      >
                        <button
                          type="button"
                          disabled={!permissions.canEdit || togglingChecklistId === ch.id}
                          className="mt-0.5 text-primary shrink-0 cursor-pointer disabled:cursor-default"
                        >
                          {ch.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 text-xs">
                          <p className={ch.isCompleted ? 'line-through text-muted-foreground' : 'font-medium'}>
                            {ch.itemText}
                          </p>
                          {ch.completedAt && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Selesai pada:{' '}
                              {new Date(ch.completedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Berkas & Bukti Dukung (PDF / Foto) */}
              {(note.files || []).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-primary" />
                      <span>Berkas Bukti Dukung ({note.files?.length} File)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {note.files?.map((file) => (
                      <div
                        key={file.id}
                        className="rounded-xl border border-border/70 bg-card p-3 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{file.fileName}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              Format: {file.fileType}
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2.5 rounded-lg border border-border/80 bg-muted/60 hover:bg-muted text-foreground flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. SUB-CATATAN & TAHAPAN TURUNAN (LEVEL BAWAHNYA)         */}
              {/* ========================================================= */}
              <div className="space-y-4 pt-4 border-t border-border/80">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>Sub-Catatan & Tahapan Turunan (Tingkat {note.tingkat + 1})</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {childNotes.length > 0
                        ? `Terdapat ${childNotes.length} sub-tahap di bawah catatan #${note.kdJudul}. Klik untuk menelusuri rincian ke bawah.`
                        : `Belum ada sub-catatan turunan di bawah catatan #${note.kdJudul}.`}
                    </p>
                  </div>

                  {permissions.canEdit && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsAddChildModalOpen(true)}
                      className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Sub-Tahap</span>
                    </Button>
                  )}
                </div>

                {childNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {childNotes.map((child) => (
                      <div
                        key={child.kdJudul}
                        onClick={() => navigateToNote(child.kdJudul)}
                        className="group rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                            #{child.kdJudul}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-primary">
                            {child.progress || 0}%
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {child.judul}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {child.ringkasan}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <NoteStatusBadge status={child.status} />
                          <span className="group-hover:translate-x-0.5 transition-transform font-semibold text-primary flex items-center gap-0.5">
                            Buka <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-border/70 p-8 text-center space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Tidak Ada Sub-Catatan Turunan
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Catatan ini adalah tingkat paling detail pada cabangnya.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* 4. MODAL DIALOGS KHUSUS ANGGOTA (CRUD CABANG KE BAWAH)     */}
      {/* ========================================================= */}
      {permissions.canEdit && note && (
        <>
          {/* Modal Edit Catatan Saat Ini */}
          <NoteFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleSaveEdit}
            editingNote={note}
            currentTingkat={note.tingkat}
            apiBaseUrl={apiBaseUrl}
          />

          {/* Modal Tambah Sub-Catatan Turunan di Bawahnya */}
          <NoteFormModal
            isOpen={isAddChildModalOpen}
            onClose={() => setIsAddChildModalOpen(false)}
            onSubmit={handleSaveSubNote}
            parentNote={note}
            currentTingkat={note.tingkat + 1}
            apiBaseUrl={apiBaseUrl}
          />
        </>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-background/80 py-4 px-6 text-center text-xs text-muted-foreground print:hidden">
        <p>© 2026 PT Berkat Gemilang Sentosa. Pusat Kolaborasi Catatan & Hierarki Proyek MFC.</p>
      </footer>
    </div>
  );
}

export default StandaloneNotePage;
