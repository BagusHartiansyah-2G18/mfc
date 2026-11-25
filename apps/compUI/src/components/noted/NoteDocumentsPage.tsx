import { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@org/ui';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { authFetch } from '@org/auth';
import type { JudulFile } from './types';
import { WorkspaceNav } from './WorkspaceNav';
import { FilePreviewModal, type PreviewFile } from './forms/components/FilePreviewModal';

interface NoteDocumentsPageProps {
  kdJudul?: string;
  apiBaseUrl?: string;
  authToken?: string;
  onNavigate?: (path: string) => void;
}

interface DocFile extends JudulFile {
  note?: { judul: string; kdJudul: string; tingkat?: number } | null;
}

const CATEGORY_OPTIONS = ['SOP', 'FOTO', 'BAST', 'INVOICE', 'OTHER'];

export function NoteDocumentsPage({
  kdJudul: initialKdJudul,
  apiBaseUrl = 'http://localhost:3002/api',
  onNavigate,
}: NoteDocumentsPageProps) {
  const [kdJudul, setKdJudul] = useState(initialKdJudul || '');
  const [files, setFiles] = useState<DocFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fileType, setFileType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  useEffect(() => {
    if (initialKdJudul) { setKdJudul(initialKdJudul); return; }
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('kdJudul') || params.get('note');
      const fromActive = localStorage.getItem('noted_active_kdJudul') || '';
      const next = fromQuery || fromActive || '';
      if (next) setKdJudul(next);
    } catch { /* ignore */ }
  }, [initialKdJudul]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (kdJudul) params.set('kdJudul', kdJudul);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (category) params.set('category', category);
      if (fileType) params.set('fileType', fileType);

      const res = await authFetch(`${apiBaseUrl}/notes/documents?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat daftar dokumen.');
      }
      setFiles(json.data || []);
      setTotal(json.total ?? json.data?.length ?? 0);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat dokumen bukti dukung.');
      setFiles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, kdJudul, page, limit, debouncedSearch, category, fileType]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <button
            type="button"
            onClick={() => go(kdJudul ? `/forms/${encodeURIComponent(kdJudul)}` : '/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {kdJudul ? 'Kembali ke Form Pendukung' : 'Kembali ke Catatan'}
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {kdJudul && (
              <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                #{kdJudul}
              </span>
            )}
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" /> Dokumen Bukti Dukung
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {kdJudul
              ? 'Seluruh lampiran bukti dukung pada catatan ini.'
              : 'Agregasi seluruh lampiran bukti dukung lintas catatan Anda.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Input value={kdJudul} onChange={(e) => { setKdJudul(e.target.value.trim()); setPage(1); }} placeholder="Filter kdJudul catatan aktif..." className="h-8 text-xs w-48 bg-background font-mono" />
          {kdJudul && (
            <Button type="button" variant="outline" size="sm" onClick={() => { setKdJudul(''); setPage(1); go('/documents'); }} className="h-8 text-xs gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Semua
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan
          </Button>
        </div>
      </div>

      <WorkspaceNav active="dokumen" kdJudul={kdJudul || undefined} onNavigate={onNavigate} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border/70 bg-muted/10 p-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama berkas, keterangan, atau kode catatan..."
            className="h-8 pl-9 text-xs bg-background"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
          >
            <option value="">Semua Tipe</option>
            <option value="image">Gambar</option>
            <option value="pdf">PDF</option>
            <option value="doc">Dokumen</option>
            <option value="link">Tautan</option>
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
            <option value={100}>100 / halaman</option>
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
                <th className="py-2.5 px-3 font-semibold text-foreground">Nama Berkas</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Catatan</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Kategori</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Tipe</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Ukuran</th>
                <th className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && files.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Memuat dokumen...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Belum ada dokumen bukti dukung</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unggah lampiran melalui menu media atau form pendukung bertipe berkas.
                    </p>
                  </td>
                </tr>
              ) : (
                files.map((file, idx) => {
                  const preview: PreviewFile = {
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    mimeType: file.mimeType,
                    fileType: file.fileType,
                    fileSizeBytes: file.fileSizeBytes,
                  };
                  return (
                    <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {file.fileType === 'image' ? (
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{file.fileName}</p>
                            {file.keterangan && (
                              <p className="text-[10px] text-muted-foreground truncate">{file.keterangan}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <p className="text-[11px] text-foreground truncate">
                          {file.note?.judul || '-'}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground truncate">
                          #{file.note?.kdJudul || file.kdJudul}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {file.category || 'OTHER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground uppercase text-[10px] font-bold whitespace-nowrap">
                        {file.fileType}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {formatSize(file.fileSizeBytes)}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                        {file.createdAt ? new Date(file.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(preview)}
                            className="p-1.5 rounded-md hover:bg-primary/10 text-primary"
                            title="Pratinjau dokumen"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={file.fileUrl}
                            download={file.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Unduh berkas"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
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
          Menampilkan <strong className="text-foreground">{files.length}</strong> dari{' '}
          <strong className="text-foreground">{total}</strong> dokumen
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

      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

