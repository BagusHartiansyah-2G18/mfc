import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Database, Download, Eye, FileText, Filter, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { Button, Input, SelectField, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@org/ui';
import { authFetch } from '@org/auth';
import type { DatasetMetadataRow } from './types';

interface NoteDatasetPageProps { apiBaseUrl?: string; onNavigate?: (path: string) => void; }
type DatasetRow = DatasetMetadataRow & { answers?: Record<string, any> };
type DatasetColumn = { key: string; label: string; type: string; options?: string[] };
type AvailableFormOption = { id: string; tujuan: string; kdNote: string };

function isSafeHref(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try { const u = new URL(url, window.location.origin); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

function ValueCell({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">-</span>;
  if (typeof value === 'boolean') return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{value ? 'Ya' : 'Tidak'}</span>;
  if (typeof value === 'number') return <span className="font-mono">{value.toLocaleString('id-ID')}</span>;
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) { const d = new Date(value); if (!isNaN(d.getTime())) return <span>{d.toLocaleString('id-ID')}</span>; }
    return <span className="break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex flex-col gap-1">
        {value.slice(0, 20).map((v, i) => (
          <div key={i} className="rounded-md border border-border/60 bg-muted/20 px-2 py-1">
            {v && typeof v === 'object' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {Object.entries(v).map(([k, sv]) => (
                  <div key={k} className="text-[11px] leading-tight"><span className="text-muted-foreground font-mono">{k}: </span><ValueCell value={sv} /></div>
                ))}
              </div>
            ) : <ValueCell value={v} />}
          </div>
        ))}
        {value.length > 20 && <span className="text-[10px] text-muted-foreground">+{value.length - 20} lainnya</span>}
      </div>
    );
  }
  if (typeof value === 'object') {
    if (value.__type === 'file' && isSafeHref(value.fileUrl)) return <a href={value.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><FileText className="h-3.5 w-3.5" />{value.fileName || 'Lampiran'}</a>;
    if (value.__type === 'signature') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Tertanda</span>;
    if (isSafeHref(value.fileUrl || value.url)) return <a href={value.fileUrl || value.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><FileText className="h-3.5 w-3.5" />{value.fileName || 'Lampiran'}</a>;
    const entries = Object.entries(value).filter(([k]) => k !== '__type');
    if (entries.length === 0) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {entries.map(([k, sv]) => (
          <div key={k} className="text-[11px] leading-tight"><span className="text-muted-foreground font-mono">{k}: </span><ValueCell value={sv} /></div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

function PreviewValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground/70">-</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Ya' : 'Tidak'}</span>;
  if (typeof value === 'number') return <span className="font-mono">{value.toLocaleString('id-ID')}</span>;
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) { const d = new Date(value); if (!isNaN(d.getTime())) return <span>{d.toLocaleDateString('id-ID')}</span>; }
    return <span title={value}>{value.length > 50 ? `${value.slice(0, 50)}…` : value}</span>;
  }
  if (Array.isArray(value)) return <span className="text-muted-foreground">{value.length} item</span>;
  if (typeof value === 'object') {
    if (value.__type === 'signature') return <span className="text-emerald-600">Tertanda</span>;
    if (isSafeHref(value.fileUrl || value.url)) return <a href={value.fileUrl || value.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><FileText className="h-3 w-3" />{value.fileName || 'Lampiran'}</a>;
    if (value.__type === 'file') return <span className="inline-flex items-center gap-1 text-primary"><FileText className="h-3 w-3" />{value.fileName || 'Lampiran'}</span>;
    const n = Object.keys(value).length;
    return <span className="text-muted-foreground">{n} field</span>;
  }
  return <span>{String(value)}</span>;
}

function AnswerPreview({ row, columns }: { row: DatasetRow; columns: DatasetColumn[] }) {
  const answers = row.answers || {};
  const entries = columns.length > 0
    ? columns.map((c) => ({ key: c.key, label: c.label || c.key, value: answers[c.key] }))
    : Object.entries(answers).map(([k, v]) => ({ key: k, label: k, value: v }));
  const shown = entries.slice(0, 8);
  const rest = entries.length - shown.length;
  if (entries.length === 0) return <span className="text-[11px] text-muted-foreground">Tidak ada nilai jawaban.</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map(({ key, label, value }) => (
        <span key={key} className="inline-flex items-baseline gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 max-w-[240px]">
          <span className="text-[10px] text-muted-foreground shrink-0">{label}</span>
          <span className="text-[11px] font-medium text-foreground truncate"><PreviewValue value={value} /></span>
        </span>
      ))}
      {rest > 0 && <span className="text-[10px] text-muted-foreground">+{rest} field</span>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const value = String(status || '-').toUpperCase();
  const tone = value === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600'
    : value === 'REJECTED' ? 'bg-rose-500/10 text-rose-600'
    : value === 'SUBMITTED' ? 'bg-primary/10 text-primary'
    : 'bg-muted text-muted-foreground';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone}`}>{value}</span>;
}

export function NoteDatasetPage({ apiBaseUrl = 'http://localhost:3002/api' }: NoteDatasetPageProps) {
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [columns, setColumns] = useState<DatasetColumn[]>([]);
  const [availableForms, setAvailableForms] = useState<AvailableFormOption[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kdJudul, setKdJudul] = useState('');
  const [formId, setFormId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<DatasetRow | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
      setPage(1);
    }, 450);
    return () => clearTimeout(t);
  }, [columnFilters]);
  useEffect(() => { try { const p = new URLSearchParams(window.location.search); const k = p.get('kdJudul'); const f = p.get('formId'); if (k) setKdJudul(k); if (f) setFormId(f); } catch {} }, []);

  const activeColumnFilterEntries = useMemo(
    () => Object.entries(debouncedColumnFilters).filter(([, v]) => v.trim() !== ''),
    [debouncedColumnFilters]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: 'newest' });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (status) params.set('status', status);
      if (kdJudul.trim()) params.set('kdJudul', kdJudul.trim());
      if (formId.trim()) params.set('formId', formId.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (activeColumnFilterEntries.length > 0) {
        params.set('columnFilters', JSON.stringify(Object.fromEntries(activeColumnFilterEntries)));
      }
      const res = await authFetch(`${apiBaseUrl}/notes/forms/dataset?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal memuat dataset.');
      setRows(Array.isArray(json.data) ? json.data : []);
      setColumns(Array.isArray(json.columns) ? json.columns : []);
      if (Array.isArray(json.availableForms)) setAvailableForms(json.availableForms);
      setSelectedForm(json.selectedForm || null);
      setTotal(Number(json.total ?? 0));
    } catch (err: any) { setError(err.message || 'Gagal memuat dataset.'); setRows([]); setColumns([]); setTotal(0); }
    finally { setIsLoading(false); }
  }, [apiBaseUrl, page, limit, debouncedSearch, status, kdJudul, formId, from, to, activeColumnFilterEntries]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const hasAnyFilter = Boolean(
    search.trim() || status || kdJudul.trim() || formId.trim() || from || to || Object.values(columnFilters).some((v) => v.trim() !== '')
  );

  const resetAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setKdJudul('');
    setFormId('');
    setFrom('');
    setTo('');
    setColumnFilters({});
    setDebouncedColumnFilters({});
    setPage(1);
  };

  const answerEntries = useMemo(() => {
    if (!detailRow) return [] as Array<{ key: string; label: string; type?: string; value: any }>;
    const answers = detailRow.answers || {};
    if (columns.length > 0) {
      const fromSchema = columns.map((c) => ({ key: c.key, label: c.label || c.key, type: c.type, value: answers[c.key] }));
      const schemaKeys = new Set(columns.map((c) => c.key));
      const extra = Object.entries(answers).filter(([k]) => !schemaKeys.has(k)).map(([k, v]) => ({ key: k, label: k, type: undefined, value: v }));
      return [...fromSchema, ...extra];
    }
    return Object.entries(answers).map(([k, v]) => ({ key: k, label: k, type: undefined, value: v }));
  }, [detailRow, columns]);

  const exportCsv = () => {
    const meta = ['id','formId','formTitle','kdJudul','noteTitle','responderName','responderEmail','originHost','status','createdAt'];
    const dyn = columns.map((c) => c.key);
    const headers = [...meta, ...dyn];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(meta.includes(h) ? (r as any)[h] : r.answers?.[h])).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dataset-respon.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Dataset Respon Form</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedForm ? <>Menampilkan respon form <strong>{selectedForm.tujuan}</strong> ({selectedForm.id}).</> : <>Ringkasan respon. Buka detail untuk melihat seluruh nilai jawaban sesuai schema form.</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs gap-1.5"><Download className="h-3.5 w-3.5" /> Export CSV</Button>
          <Button variant="outline" size="sm" onClick={fetchData} className="h-8 text-xs gap-1.5"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan</Button>
        </div>
      </div>

      <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/10 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari responden, form, catatan, atau isi jawaban..." className="h-8 pl-9 text-xs bg-background" />
          </div>
          <div className="lg:col-span-2">
            <SelectField
              size="sm"
              value={formId}
              onChange={(val) => {
                setFormId(val);
                setColumnFilters({});
                setDebouncedColumnFilters({});
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Form (Pilih Form untuk Filter Kolom)' },
                ...availableForms.map((f) => ({
                  value: f.id,
                  label: `${f.tujuan} (${f.kdNote})`,
                })),
              ]}
              className="rounded-lg bg-background"
              title="Pilih Form untuk menampilkan filter per kolom jawaban"
            />
          </div>
          <SelectField
            size="sm"
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
            className="rounded-lg bg-background"
          />
          <SelectField
            size="sm"
            value={String(limit)}
            onChange={(val) => { setLimit(Number(val)); setPage(1); }}
            options={[
              { value: '10', label: '10 / hal' },
              { value: '25', label: '25 / hal' },
              { value: '50', label: '50 / hal' },
              { value: '100', label: '100 / hal' },
            ]}
            className="rounded-lg bg-background"
          />
          <Input value={kdJudul} onChange={(e) => { setKdJudul(e.target.value); setPage(1); }} placeholder="Filter kdJudul" className="h-8 text-xs bg-background font-mono" />
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-8 text-xs bg-background" title="Dari tanggal" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-8 text-xs bg-background" title="Sampai tanggal" />
          {hasAnyFilter && (
            <Button type="button" variant="ghost" size="sm" onClick={resetAllFilters} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
            </Button>
          )}
        </div>

        {columns.length > 0 && (
          <div className="pt-2.5 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Filter Jawaban per Kolom Form ({columns.length} kolom)
              </span>
              {Object.values(columnFilters).some((v) => v.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => { setColumnFilters({}); setDebouncedColumnFilters({}); setPage(1); }}
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Bersihkan Filter Kolom
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {columns.map((col) => {
                const val = columnFilters[col.key] || '';
                return (
                  <div key={col.key} className="space-y-1">
                    <label className="block text-[10px] font-medium text-muted-foreground truncate" title={`${col.label} (${col.key})`}>
                      {col.label}
                    </label>
                    {col.options && col.options.length > 0 ? (
                      <SelectField
                        size="sm"
                        value={val}
                        onChange={(nextVal) => setColumnFilters((prev) => ({ ...prev, [col.key]: nextVal }))}
                        options={[
                          { value: '', label: `Semua ${col.label}` },
                          ...col.options.map((opt) => ({ value: opt, label: opt })),
                        ]}
                        className="rounded-lg bg-background"
                      />
                    ) : (
                      <Input
                        value={val}
                        onChange={(e) => setColumnFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
                        placeholder={`Filter ${col.label}...`}
                        className="h-8 text-xs bg-background"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-muted/40 border-b border-border/80">
              <th className="py-2.5 px-3 whitespace-nowrap w-14">No</th>
              {columns.length > 0 ? (
                <>
                  <th className="py-2.5 px-3 whitespace-nowrap">Responden</th>
                  {columns.map((col) => (
                    <th key={col.key} className="py-2.5 px-3 whitespace-nowrap max-w-[200px] truncate" title={col.key}>
                      {col.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                </>
              ) : (
                <th className="py-2.5 px-3">Informasi</th>
              )}
              <th className="py-2.5 px-3 text-right w-28">View</th>
            </tr></thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && rows.length === 0 ? <tr><td colSpan={columns.length > 0 ? columns.length + 4 : 3} className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Memuat...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={columns.length > 0 ? columns.length + 4 : 3} className="py-12 text-center text-muted-foreground">Belum ada data respon yang sesuai dengan filter.</td></tr>
              : rows.map((r, idx) => (
                <tr key={r.id} className="hover:bg-muted/30 align-top">
                  <td className="py-3 px-3 text-muted-foreground font-mono">{(page - 1) * limit + idx + 1}</td>
                  {columns.length > 0 ? (
                    <>
                      <td className="py-3 px-3 min-w-[150px]">
                        <div className="font-medium text-foreground">{r.responderName || '-'}</div>
                        {r.responderEmail && <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{r.responderEmail}</div>}
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="py-3 px-3 max-w-[240px]">
                          <PreviewValue value={r.answers?.[col.key]} />
                        </td>
                      ))}
                      <td className="py-3 px-3 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                    </>
                  ) : (
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <div className="font-semibold text-foreground break-words max-w-[420px]" title={r.formTitle}>{r.formTitle || '-'}</div>
                          {r.noteTitle && r.noteTitle !== r.formTitle && (
                            <div className="text-[11px] text-muted-foreground break-words max-w-[300px]">{r.noteTitle}</div>
                          )}
                        </div>
                        <AnswerPreview row={r} columns={columns} />
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setDetailRow(r)} className="h-7 px-2 text-xs gap-1.5"><Eye className="h-3.5 w-3.5" /> Lihat</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Menampilkan <strong className="text-foreground">{rows.length}</strong> dari <strong className="text-foreground">{total}</strong> respon</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 px-2 text-xs">Sebelumnya</Button>
          <span className="font-semibold text-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-7 px-2 text-xs">Berikutnya</Button>
        </div>
      </div>

      <Sheet open={!!detailRow} onOpenChange={(open) => { if (!open) setDetailRow(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
          {detailRow && (
            <>
              <SheetHeader className="p-4 pr-10 border-b border-border/70">
                <SheetTitle className="text-sm flex items-center gap-2 flex-wrap">
                  <span className="break-words">{detailRow.formTitle || 'Detail Respon'}</span>
                  <StatusBadge status={detailRow.status} />
                </SheetTitle>
                <SheetDescription className="text-[11px] font-mono break-all">{detailRow.id}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['Form', detailRow.formTitle],
                    ['Catatan', detailRow.noteTitle || '-'],
                    ['kdJudul', detailRow.kdJudul],
                    ['formId', detailRow.formId],
                    ['Responden', detailRow.responderName || '-'],
                    ['Email', detailRow.responderEmail || '-'],
                    ['Status', detailRow.status],
                    ['Waktu', detailRow.createdAt ? new Date(detailRow.createdAt).toLocaleString('id-ID') : '-'],
                    ['Diverifikasi', detailRow.verifiedAt ? new Date(detailRow.verifiedAt).toLocaleString('id-ID') : '-'],
                    ['Verifikator', detailRow.verifiedBy || '-'],
                    ['Origin', detailRow.originHost || '-'],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="rounded-lg border border-border/60 bg-muted/10 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                      <div className="font-medium break-words mt-0.5">{String(v || '-')}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 font-semibold flex items-center justify-between">
                    <span>Nilai Jawaban</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{answerEntries.length} field</span>
                  </div>
                  {answerEntries.length === 0 ? <div className="p-3 text-muted-foreground">Tidak ada nilai jawaban.</div> : (
                    <div className="divide-y divide-border/50">
                      {answerEntries.map(({ key, label, value }) => (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 p-3">
                          <div className="text-[11px] text-muted-foreground break-words"><span className="font-mono">{key}</span>{label !== key && <span className="block text-[10px] text-muted-foreground/80">{label}</span>}</div>
                          <div className="break-words"><ValueCell value={value} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
