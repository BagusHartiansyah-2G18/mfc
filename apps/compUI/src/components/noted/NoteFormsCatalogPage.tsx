import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, BookOpen, ClipboardList, FilePenLine, Globe, Loader2, Lock, RefreshCw, Search, Users } from 'lucide-react';
import { Button, Input } from '@org/ui';
import { authFetch } from '@org/auth';
import type { FormCatalogItem } from './types';

interface NoteFormsCatalogPageProps {
  apiBaseUrl?: string;
  onNavigate?: (path: string) => void;
}

export function NoteFormsCatalogPage({ apiBaseUrl = 'http://localhost:3002/api' }: NoteFormsCatalogPageProps) {
  const [forms, setForms] = useState<FormCatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sharingMode, setSharingMode] = useState('');
  const [isLocked, setIsLocked] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/noted');
  const formsBase = isPortal ? '/noted/forms' : '/forms';
  const openInNewTab = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  };
  const notedUrl = (kdNote?: string) => isPortal ? `/noted?kdJudul=${encodeURIComponent(kdNote ?? '')}` : `/?kdJudul=${encodeURIComponent(kdNote ?? '')}`;
  const responsesUrl = (kdNote: string | undefined, formId: string, tab: 'rekap' | 'isi') =>
    `${formsBase}/${encodeURIComponent(kdNote ?? '')}/${encodeURIComponent(formId)}/responses?tab=${tab}`;
  useEffect(() => { const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: 'newest' });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (sharingMode) params.set('sharingMode', sharingMode);
      if (isLocked) params.set('isLocked', isLocked);
      const res = await authFetch(`${apiBaseUrl}/notes/forms/catalog?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal memuat katalog form.');
      setForms(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total ?? json.data?.length ?? 0));
    } catch (err: any) { setError(err.message || 'Gagal memuat katalog form.'); setForms([]); setTotal(0); }
    finally { setIsLoading(false); }
  }, [apiBaseUrl, page, limit, debouncedSearch, sharingMode, isLocked]);

  useEffect(() => { fetchForms(); }, [fetchForms]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const sharingBadge = (mode: string) => mode === 'PUBLIC' ? { label: 'Publik', Icon: Globe, cls: 'bg-emerald-500/10 text-emerald-600' } : mode === 'KHUSUS' ? { label: 'Khusus', Icon: Users, cls: 'bg-indigo-500/10 text-indigo-600' } : { label: 'Pribadi', Icon: Lock, cls: 'bg-muted text-muted-foreground' };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Form Pendukung</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Semua form pendukung yang dapat Anda akses lintas catatan.</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" /> Noted — buka catatan</span>
            <span className="inline-flex items-center gap-1"><BarChart3 className="h-3 w-3 text-indigo-500" /> Rekap — lihat rekap respon</span>
            <span className="inline-flex items-center gap-1"><FilePenLine className="h-3 w-3 text-emerald-500" /> Isi — isi formulir</span>
            <span className="text-muted-foreground/70">• semua aksi membuka tab baru</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchForms} className="h-8 text-xs gap-1.5"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 rounded-xl border border-border/70 bg-muted/10 p-2.5">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari form, catatan, atau ID..." className="h-8 pl-9 text-xs bg-background" /></div>
        <select value={sharingMode} onChange={(e) => { setSharingMode(e.target.value); setPage(1); }} className="h-8 px-2 text-xs rounded-lg border border-border bg-background"><option value="">Semua Sharing</option><option value="PUBLIC">Publik</option><option value="KHUSUS">Khusus</option><option value="PRIVATE">Pribadi</option></select>
        <select value={isLocked} onChange={(e) => { setIsLocked(e.target.value); setPage(1); }} className="h-8 px-2 text-xs rounded-lg border border-border bg-background"><option value="">Semua Status</option><option value="false">Terbuka</option><option value="true">Terkunci</option></select>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="h-8 px-2 text-xs rounded-lg border border-border bg-background"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select>
      </div>

      {error && <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-muted/40 border-b border-border/80"><th className="py-2.5 px-3 font-semibold text-muted-foreground w-12 text-center">No</th><th className="py-2.5 px-3 font-semibold">Form</th><th className="py-2.5 px-3 font-semibold">Catatan</th><th className="py-2.5 px-3 font-semibold">Sharing</th><th className="py-2.5 px-3 font-semibold">Respon</th><th className="py-2.5 px-3 font-semibold">Update</th><th className="py-2.5 px-3 font-semibold text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && forms.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Memuat...</td></tr>
              : forms.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Belum ada form yang dapat diakses.</td></tr>
              : forms.map((f, idx) => { const b = sharingBadge(f.sharingMode); const Icon = b.Icon; return (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">{(page - 1) * limit + idx + 1}</td>
                  <td className="py-2.5 px-3"><div className="font-semibold text-foreground">{f.tujuan}</div><div className="text-[10px] text-muted-foreground font-mono">{f.id}</div></td>
                  <td className="py-2.5 px-3"><div className="text-foreground truncate max-w-[220px]">{f.note?.judul || '-'}</div><div className="text-[10px] text-muted-foreground font-mono">#{f.kdNote}</div></td>
                  <td className="py-2.5 px-3"><span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}><Icon className="h-3 w-3" />{b.label}{f.isLocked ? ' • Terkunci' : ''}</span></td>
                  <td className="py-2.5 px-3 font-mono">{f.responseCount ?? 0}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-2.5 px-3 text-right"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Noted: buka catatan (tab baru)" aria-label="Buka catatan di tab baru" onClick={() => openInNewTab(notedUrl(f.kdNote))}><BookOpen className="h-3.5 w-3.5 text-primary" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Rekap: lihat rekap respon (tab baru)" aria-label="Buka rekap respon di tab baru" onClick={() => openInNewTab(responsesUrl(f.kdNote, f.id, 'rekap'))}><BarChart3 className="h-3.5 w-3.5 text-indigo-500" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Isi: isi formulir (tab baru)" aria-label="Buka isi formulir di tab baru" onClick={() => openInNewTab(responsesUrl(f.kdNote, f.id, 'isi'))}><FilePenLine className="h-3.5 w-3.5 text-emerald-500" /></Button>
                  </div></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Menampilkan <strong className="text-foreground">{forms.length}</strong> dari <strong className="text-foreground">{total}</strong> form</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 px-2 text-xs">Sebelumnya</Button>
          <span className="font-semibold text-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-7 px-2 text-xs">Berikutnya</Button>
        </div>
      </div>
    </div>
  );
}
