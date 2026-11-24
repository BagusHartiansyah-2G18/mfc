import { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@org/ui';
import {
  AlertCircle,
  ClipboardList,
  Copy,
  Eye,
  FilePenLine,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Globe,
  Users,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  User,
  Sparkles,
  Layers,
} from 'lucide-react';
import { authFetch } from '@org/auth';
import type { DataForm, JudulNote } from '../types';
import { WorkspaceNav } from '../WorkspaceNav';
import { NoteDynamicFormBuilder } from './NoteDynamicFormBuilder';
import { NoteStatusBadge, NoteStageBadge, NotePriorityBadge } from '../NoteStatusBadge';
import { NoteReaderModal } from '../NoteReaderModal';

interface NoteFormsPageProps {
  kdJudul: string;
  apiBaseUrl?: string;
  authToken?: string;
  onNavigate?: (path: string) => void;
}

interface FormsResponse {
  success: boolean;
  note?: JudulNote | null;
  data: DataForm[];
  total?: number;
  page?: number;
  limit?: number;
}

export function NoteFormsPage({
  kdJudul,
  apiBaseUrl = 'http://localhost:3002/api',
  onNavigate,
}: NoteFormsPageProps) {
  const [forms, setForms] = useState<DataForm[]>([]);
  const [note, setNote] = useState<JudulNote | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sharingMode, setSharingMode] = useState('');
  const [isLocked, setIsLocked] = useState('');
  const [sort, setSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (sharingMode) params.set('sharingMode', sharingMode);
      if (isLocked) params.set('isLocked', isLocked);

      const res = await authFetch(
        `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms?${params.toString()}`
      );
      const json: FormsResponse = await res.json();
      if (!res.ok || !json.success) {
        throw new Error((json as any).message || 'Gagal memuat daftar form.');
      }
      setForms(json.data || []);
      if (json.note) {
        setNote(json.note as any);
      } else {
        // Fallback: fetch note info directly from /notes/sub?kdJudul=...
        try {
          const subRes = await authFetch(`${apiBaseUrl}/notes/sub?kdJudul=${encodeURIComponent(kdJudul)}&tingkat=1`);
          if (subRes.ok) {
            const subJson = await subRes.json();
            const payload = subJson.data || subJson;
            if (payload.current) setNote(payload.current);
          }
        } catch {
          // ignore fallback error
        }
      }
      setTotal(json.total ?? json.data?.length ?? 0);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar form pendukung.');
      setForms([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, kdJudul, page, limit, sort, debouncedSearch, sharingMode, isLocked]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const copyPublicLink = async (form: DataForm) => {
    if (!form.shareSlug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${form.shareSlug}`);
      setCopiedId(form.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError('Gagal menyalin tautan publik.');
    }
  };

  const sharingBadge = (mode: DataForm['sharingMode']) => {
    if (mode === 'PUBLIC') {
      return { label: 'Publik', cls: 'bg-emerald-500/10 text-emerald-600', Icon: Globe };
    }
    if (mode === 'KHUSUS') {
      return { label: 'Khusus', cls: 'bg-indigo-500/10 text-indigo-600', Icon: Users };
    }
    return { label: 'Pribadi', cls: 'bg-muted text-muted-foreground', Icon: Lock };
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP BAR: BREADCRUMB & UTILITY BUTTONS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors bg-muted/60 hover:bg-muted px-2.5 py-1.5 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Catatan
          </button>
          <span className="text-muted-foreground/60 text-xs">/</span>
          <span className="font-mono text-xs font-bold text-primary">#{kdJudul}</span>
          <span className="text-xs text-muted-foreground font-medium">Form Pendukung</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={() => setIsBuilderOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Buat Form Baru
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchForms}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => go(kdJudul ? `/documents?kdJudul=${encodeURIComponent(kdJudul)}` : '/documents')}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Dokumen Bukti
          </Button>
        </div>
      </div>

      {/* 2. KARTU INFORMASI CATATAN TERKAIT (NOTE CONTEXT BANNER) */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                #{note?.kdJudul || kdJudul}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {note?.tingkat !== undefined
                  ? note.tingkat === 0
                    ? 'Catatan Induk (Tingkat 0)'
                    : `Sub-Tahap Tingkat ${note.tingkat}`
                  : 'Memuat Tingkat...'}
              </span>
              {note?.stage && <NoteStageBadge stage={note.stage} />}
              {note?.priority && <NotePriorityBadge priority={note.priority} />}
              {note?.status && <NoteStatusBadge status={note.status} />}
              {note?.sharingMode === 'PUBLIC' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Publik
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight line-clamp-2">
              {note?.judul || (isLoading ? 'Memuat informasi catatan...' : `Catatan #${kdJudul}`)}
            </h2>

            {(note?.ringkasan || note?.catatanDetail) && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {note.ringkasan || note.catatanDetail}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>PIC:</span>
                <span className="font-bold text-foreground">{note?.picName || 'Principal Administrator'}</span>
              </span>
              {note?.dueDate && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Tenggat: {new Date(note.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              )}
              {note?.progress !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Progres:</span>
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${note.progress}%` }}
                    />
                  </div>
                  <span className="font-bold text-[11px] text-foreground">{note.progress}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {note && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReaderOpen(true)}
                className="h-8 text-xs gap-1.5 cursor-pointer text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/15"
                title="Buka Dokumen Lengkap di Mode Baca"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Mode Baca</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <WorkspaceNav active="form" kdJudul={kdJudul} onNavigate={onNavigate} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/10 p-2.5">
        <div className="relative flex-1 max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tujuan atau keterangan form..."
            className="h-8 text-xs bg-background"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={sharingMode}
            onChange={(e) => {
              setSharingMode(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Semua Akses</option>
            <option value="PUBLIC">Publik</option>
            <option value="KHUSUS">Khusus</option>
            <option value="PRIVATE">Pribadi</option>
          </select>
          <select
            value={isLocked}
            onChange={(e) => {
              setIsLocked(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Semua Status</option>
            <option value="false">Terbuka</option>
            <option value="true">Terkunci</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="title">Judul A-Z</option>
          </select>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value={5}>5 / halaman</option>
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                <th className="py-2.5 px-3 font-semibold text-muted-foreground w-12 text-center">No</th>
                <th className="py-2.5 px-3 font-semibold text-foreground">Tujuan Form</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Akses</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Field</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Respon</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Diperbarui</th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-56">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Memuat form pendukung...
                  </td>
                </tr>
              ) : forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Belum ada form pendukung</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Buat form dinamis untuk mengumpulkan data tambahan pada catatan ini.
                    </p>
                  </td>
                </tr>
              ) : (
                forms.map((form, idx) => {
                  const badge = sharingBadge(form.sharingMode);
                  const BadgeIcon = badge.Icon;
                  return (
                    <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 max-w-sm">
                        <p className="font-semibold text-foreground line-clamp-1">{form.tujuan}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {form.keterangan || 'Tanpa keterangan'}
                        </p>
                        {form.isLocked && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-600">
                            <Lock className="h-3 w-3" /> Terkunci
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          <BadgeIcon className="h-3 w-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {form.fields?.length || 0}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground whitespace-nowrap">
                        {form.responseCount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                        {form.updatedAt || form.createdAt
                          ? new Date(form.updatedAt || form.createdAt).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              go(
                                `/forms/${encodeURIComponent(kdJudul)}/${encodeURIComponent(
                                  form.id
                                )}/responses`
                              )
                            }
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Rekap
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              go(
                                `/forms/${encodeURIComponent(kdJudul)}/${encodeURIComponent(
                                  form.id
                                )}/responses?tab=isi`
                              )
                            }
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <FilePenLine className="h-3.5 w-3.5" /> Isi
                          </Button>
                          {form.sharingMode === 'PUBLIC' && form.shareSlug && (
                            <button
                              type="button"
                              onClick={() => copyPublicLink(form)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title={copiedId === form.id ? 'Tersalin!' : 'Salin tautan publik'}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          Menampilkan <strong className="text-foreground">{forms.length}</strong> dari{' '}
          <strong className="text-foreground">{total}</strong> form
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2 text-xs"
          >
            Sebelumnya
          </Button>
          <span className="font-semibold text-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2 text-xs"
          >
            Berikutnya
          </Button>
        </div>
      </div>

      <NoteDynamicFormBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        kdJudul={kdJudul}
        apiBaseUrl={apiBaseUrl}
        onSaved={fetchForms}
      />

      {note && (
        <NoteReaderModal
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          note={note}
          apiBaseUrl={apiBaseUrl}
        />
      )}
    </div>
  );
}
