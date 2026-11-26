import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '@org/ui';
import {
  Search,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Trash2,
  Eye,
  ExternalLink,
  BarChart2,
  Printer,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Filter,
  Paperclip,
  Pencil,
  X,
} from 'lucide-react';
import {
  type DataForm,
  type FlatFormProjection,
} from '../types';
import { authFetch, authStore, isAdminRole } from '@org/auth';
import { FormAnalyticsModal } from './components/FormAnalyticsModal';
import { FormReceiptPrintModal } from './components/FormReceiptPrintModal';
import { FilePreviewModal, type PreviewFile } from './components/FilePreviewModal';
import { NoteDynamicFormRenderer } from './NoteDynamicFormRenderer';

interface NoteDynamicFormTableProps {
  form: DataForm;
  kdJudul: string;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteDynamicFormTable({
  form,
  kdJudul,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteDynamicFormTableProps) {
  const [flatData, setFlatData] = useState<FlatFormProjection | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const currentUser = authStore.getUser();
  const canEditResponse = Boolean(
    currentUser &&
      (isAdminRole(currentUser.role) ||
        (currentUser.kdMember && form.kdMember && currentUser.kdMember === form.kdMember))
  );

  const extractRowAnswers = useCallback(
    (row: Record<string, any>) => {
      const initial: Record<string, any> = {};
      for (const field of form.fields || []) {
        if (field.key && row[field.key] !== undefined) {
          initial[field.key] = row[field.key];
        }
      }
      return initial;
    },
    [form.fields]
  );

  // Next-Level Modals: Visual Analytics & PDF Receipt Print
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFlatData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        format: 'flat',
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await authFetch(
        `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(form.id)}/data?${params.toString()}`
      );
      const json = await res.json();
      if (json.success) {
        setFlatData(json);
      } else {
        throw new Error(json.message || 'Gagal mengambil data respon.');
      }
    } catch (err: any) {
      console.error('[NoteDynamicFormTable] fetchFlatData error:', err);
      setError(err.message || 'Gagal memuat rekap data formulir.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, kdJudul, form.id, debouncedSearch, statusFilter, fromDate, toDate, page, limit]);

  useEffect(() => {
    fetchFlatData();
  }, [fetchFlatData]);

  const handleDeleteResponse = async (valId: string) => {
    if (!window.confirm('Hapus respon ini secara permanen dari basis data?')) return;
    try {
      setIsLoading(true);
      const res = await authFetch(`${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(form.id)}/values/${encodeURIComponent(valId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus respon.');
      }
      await fetchFlatData();
      if (selectedRow && selectedRow.id === valId) {
        setSelectedRow(null);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus respon.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const url = `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(form.id)}/export?format=${format}`;
    window.open(url, '_blank');
  };

  const columns = flatData?.columns || [];
  const rows = flatData?.rows || [];
  const totalResponses = flatData?.total ?? flatData?.totalResponses ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalResponses / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari respon (nama, email, isi)..."
            className="h-8 pl-9 text-xs bg-background"
          />
        </div>

        {/* Action Buttons: Analytics, CSV, JSON, Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visual Analytics Trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAnalyticsOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 border-indigo-500/30 font-semibold shadow-2xs"
            title="Buka Dasbor Visual Analytics & Grafik Respon Otomatis"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>📊 Analitik & Grafik</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="h-8 text-xs gap-1.5 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
            title="Unduh Data dalam format CSV (Excel)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Unduh CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="h-8 text-xs gap-1.5 cursor-pointer text-primary hover:bg-primary/10 border-primary/30"
            title="Unduh Data dalam format JSON"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Unduh JSON</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchFlatData}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Segarkan Data"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter & Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-2 rounded-xl border border-border/70 bg-muted/10 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Terkirim</option>
            <option value="VERIFIED">Terverifikasi</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
            title="Dari tanggal"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
            title="Sampai tanggal"
          />
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
            <option value={100}>100 / halaman</option>
          </select>
        </div>
        {(statusFilter || fromDate || toDate || search) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setFromDate('');
              setToDate('');
              setPage(1);
            }}
            className="h-8 text-xs text-muted-foreground"
          >
            Reset
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Flat Data Grid Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                <th className="py-2.5 px-3 font-semibold text-muted-foreground w-12 text-center">No</th>
                {columns.map((c) => (
                  <th key={c.key} className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-8 text-center text-xs text-muted-foreground">
                    {isLoading ? 'Memuat data respon...' : 'Belum ada data respon yang terkumpul.'}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                      {(page - 1) * limit + idx + 1}
                    </td>

                    {columns.map((c) => {
                      const val = row[c.key];

                      if (c.key === 'status') {
                        return (
                          <td key={c.key} className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                val === 'VERIFIED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : val === 'REJECTED'
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {val || 'SUBMITTED'}
                            </span>
                          </td>
                        );
                      }

                      if (c.key === 'createdAt') {
                        return (
                          <td key={c.key} className="py-2.5 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                            {val ? new Date(val).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        );
                      }

                      // Lampiran berkas (objek { fileName, fileUrl, mimeType }) atau URL lama
                      const fileVal =
                        val && typeof val === 'object' && (val.fileUrl || val.url)
                          ? {
                              fileName: val.fileName || 'Lampiran',
                              fileUrl: val.fileUrl || val.url,
                              mimeType: val.mimeType,
                              fileType: val.fileType,
                              fileSizeBytes: val.fileSizeBytes,
                            }
                          : null;

                      if (fileVal) {
                        return (
                          <td key={c.key} className="py-2.5 px-3 max-w-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate text-[11px] font-medium">{fileVal.fileName}</span>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(fileVal)}
                                className="p-1 rounded-md hover:bg-primary/10 text-primary shrink-0 cursor-pointer"
                                title="Pratinjau berkas"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                      }

                      // Signature preview in table
                      if (typeof val === 'string' && val.startsWith('data:image/png;base64,')) {
                        return (
                          <td key={c.key} className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              <PenTool className="h-3 w-3" /> Tertanda
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={c.key} className="py-2.5 px-3 text-foreground max-w-xs">
                          <div className="truncate" title={typeof val === 'string' || typeof val === 'number' ? String(val) : undefined}>
                            {Array.isArray(val)
                              ? `${val.length} item`
                              : typeof val === 'object' && val !== null
                              ? val.url ? (
                                  <a
                                    href={val.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Link
                                  </a>
                                ) : JSON.stringify(val)
                              : String(val ?? '-')}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(row)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Lihat Rincian Jawaban"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canEditResponse && (
                          <button
                            type="button"
                            onClick={() => setEditingRow(row)}
                            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary cursor-pointer"
                            title="Edit Respon (Pemilik / Admin)"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteResponse(row.id)}
                          className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 cursor-pointer"
                          title="Hapus Respon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          Menampilkan <strong className="text-foreground">{rows.length}</strong> dari{' '}
          <strong className="text-foreground">{totalResponses}</strong> respon
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-7 px-2 text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <span className="px-2 font-semibold text-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 px-2 text-xs gap-1"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
      />

      {/* Response Detail Inspector Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="space-y-0.5">
                <h4 className="text-base font-bold text-foreground">Detail Respon #{selectedRow.id?.slice(0, 8)}</h4>
                <p className="text-xs text-muted-foreground">
                  Responden: <strong>{selectedRow.responderName}</strong> ({selectedRow.responderEmail || 'Tanpa email'})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintOpen(true)}
                  className="h-8 text-xs gap-1.5 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Dokumen / PDF</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRow(null)}
                  className="h-8 w-8 p-0 text-muted-foreground cursor-pointer"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 rounded-xl text-[11px]">
                <div>
                  <span className="text-muted-foreground">Host Asal:</span>
                  <p className="font-mono font-bold text-foreground">{selectedRow.originHost || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Waktu Kirim:</span>
                  <p className="font-mono font-bold text-foreground">
                    {selectedRow.createdAt ? new Date(selectedRow.createdAt).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {columns
                  .filter((c) => !['responderName', 'responderEmail', 'originHost', 'status', 'createdAt'].includes(c.key))
                  .map((c) => {
                    const cellVal = selectedRow[c.key];

                    const detailFile =
                      cellVal && typeof cellVal === 'object' && (cellVal.fileUrl || cellVal.url)
                        ? {
                            fileName: cellVal.fileName || 'Lampiran',
                            fileUrl: cellVal.fileUrl || cellVal.url,
                            mimeType: cellVal.mimeType,
                            fileType: cellVal.fileType,
                            fileSizeBytes: cellVal.fileSizeBytes,
                          }
                        : null;

                    if (detailFile) {
                      return (
                        <div key={c.key} className="p-3 rounded-xl border border-border/60 bg-muted/10 space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                            <Paperclip className="h-3 w-3 text-primary" />
                            <span>{c.label}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground truncate flex-1">
                              {detailFile.fileName}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewFile(detailFile)}
                              className="h-7 text-xs gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> Lihat
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    // Check if signature
                    if (typeof cellVal === 'string' && cellVal.startsWith('data:image/png;base64,')) {
                      return (
                        <div key={c.key} className="p-3 rounded-xl border border-border/60 bg-muted/10 space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                            <PenTool className="h-3 w-3 text-primary" />
                            <span>{c.label}</span>
                          </span>
                          <div className="p-2 rounded-lg bg-white border border-border/80 w-fit">
                            <img src={cellVal} alt="Signature" className="h-20 object-contain" />
                          </div>
                        </div>
                      );
                    }

                    // Check if repeater sub-table
                    if (Array.isArray(cellVal) && cellVal.length > 0 && typeof cellVal[0] === 'object') {
                      return (
                        <div key={c.key} className="p-3 rounded-xl border border-border/60 bg-muted/10 space-y-2">
                          <span className="text-[11px] font-bold text-muted-foreground">{c.label}</span>
                          <div className="overflow-x-auto rounded-lg border border-border/70 bg-card">
                            <table className="w-full text-[11px] text-left">
                              <tbody className="divide-y divide-border/40">
                                {cellVal.map((rowItem, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-muted/20">
                                    <td className="p-1.5 font-mono text-muted-foreground w-6 text-center">{rIdx + 1}</td>
                                    {Object.entries(rowItem).map(([k, v]) => (
                                      <td key={k} className="p-1.5">
                                        <span className="text-[9px] text-muted-foreground block">{k}</span>
                                        <span className="font-semibold text-foreground">{String(v)}</span>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={c.key} className="p-3 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground">{c.label}</span>
                        <p className="text-xs text-foreground font-medium whitespace-pre-wrap">
                          {Array.isArray(cellVal)
                            ? cellVal.join(', ')
                            : String(cellVal ?? '-')}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/80">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintOpen(true)}
                  className="text-xs gap-1.5 text-indigo-600 border-indigo-500/30 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Lembar PDF</span>
                </Button>
                {canEditResponse && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = selectedRow;
                      setSelectedRow(null);
                      setEditingRow(target);
                    }}
                    className="text-xs gap-1.5 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Respon</span>
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setSelectedRow(null)}
                className="text-xs cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Response Modal (Hanya Pemilik Form / Admin) */}
      {editingRow && canEditResponse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Edit Respon Formulir</h3>
                <p className="text-[11px] text-muted-foreground">
                  ID: <span className="font-mono">{editingRow.id}</span> · Oleh:{' '}
                  {editingRow.responderName || 'Anonim'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <NoteDynamicFormRenderer
              form={form}
              kdJudul={kdJudul}
              apiBaseUrl={apiBaseUrl}
              editingValueId={editingRow.id}
              initialAnswers={extractRowAnswers(editingRow)}
              initialResponderName={editingRow.responderName || ''}
              initialResponderEmail={editingRow.responderEmail || ''}
              onSubmitted={() => {
                setEditingRow(null);
                fetchFlatData();
              }}
              onCancel={() => setEditingRow(null)}
            />
          </div>
        </div>
      )}

      {/* Visual Analytics Modal */}
      <FormAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        form={form}
        rows={rows}
      />

      {/* PDF Receipt Print Modal */}
      <FormReceiptPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        form={form}
        response={selectedRow}
      />
    </div>
  );
}
