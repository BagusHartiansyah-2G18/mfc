import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@org/ui';
import {
  FileText,
  Image as ImageIcon,
  Info,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Paperclip,
  Eye,
  FileUp,
} from 'lucide-react';
import { type JudulNote, type JudulFile } from './types';
import { authFetch } from '@org/auth';

interface NoteMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  onFilesUpdated?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteMediaModal({
  isOpen,
  onClose,
  note,
  onFilesUpdated,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PDF' | 'IMAGE' | 'INFO'>('UPLOAD');
  const [files, setFiles] = useState<JudulFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Viewer State
  const [pdfZoom, setPdfZoom] = useState(100);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);

  // Image Slider State (Modernized Gslider)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Form Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileType, setUploadFileType] = useState<'pdf' | 'image'>('pdf');
  const [uploadCategory, setUploadCategory] = useState<'SOP' | 'FOTO' | 'BAST' | 'INVOICE' | 'KAK' | 'LAPORAN'>('SOP');
  const [uploadKeterangan, setUploadKeterangan] = useState('');

  const fetchFiles = async () => {
    if (!note?.kdJudul) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFiles(json.data);
      }
    } catch (err) {
      console.warn('Gagal mengambil daftar berkas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && note?.kdJudul) {
      fetchFiles();
      // Reset selections
      setSelectedPdfIndex(0);
      setSelectedImageIndex(0);
      setPdfZoom(100);
    }
  }, [isOpen, note?.kdJudul]);

  const pdfFiles = files.filter((f) => f.fileType === 'pdf');
  const imageFiles = files.filter((f) => f.fileType === 'image');

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedLocalFile(file);
    if (!uploadFileName) {
      setUploadFileName(file.name);
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setUploadFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.kdJudul) return;
    if (!uploadFileName.trim()) {
      setError('Nama berkas wajib diisi.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Gunakan URL default jika pengguna tidak memasukkan URL eksternal
      const fallbackUrl =
        uploadFileType === 'pdf'
          ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          : `https://picsum.photos/seed/${encodeURIComponent(uploadFileName)}/800/600`;

      const finalFileUrl = fileDataUrl || uploadFileUrl.trim() || fallbackUrl;
      const finalFileSize = selectedLocalFile?.size || (uploadFileType === 'pdf' ? 245000 : 412000);
      const finalMime = selectedLocalFile?.type || (uploadFileType === 'pdf' ? 'application/pdf' : 'image/jpeg');

      const payload = {
        fileName: uploadFileName.trim(),
        fileUrl: finalFileUrl,
        fileType: uploadFileType,
        category: uploadCategory,
        keterangan: uploadKeterangan.trim() || undefined,
        fileSizeBytes: finalFileSize,
        mimeType: finalMime,
      };

      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal melampirkan berkas.');
      }

      setUploadFileName('');
      setUploadFileUrl('');
      setUploadKeterangan('');
      setSelectedLocalFile(null);
      setFileDataUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchFiles();
      onFilesUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!note?.kdJudul) return;
    if (!window.confirm('Hapus berkas lampiran ini?')) return;

    try {
      const res = await authFetch(`${apiBaseUrl}/notes/${note.kdJudul}/files/${fileId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        onFilesUpdated?.();
      }
    } catch (err) {
      console.warn('Gagal menghapus berkas:', err);
    }
  };

  if (!note) return null;

  const currentPdf = pdfFiles[selectedPdfIndex];
  const currentImage = imageFiles[selectedImageIndex];

  // Kalkulasi Finansial Sederhana (Values)
  const targetBudget = note.targetBudget ? Number(note.targetBudget) : 0;
  const realizedBudget = note.realizedBudget ? Number(note.realizedBudget) : 0;
  const budgetBalance = targetBudget - realizedBudget;
  const isOverbudget = budgetBalance < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span className="truncate">Media & Bukti Dukung #{note.kdJudul}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono shrink-0">
                  {isLoading ? 'Memuat...' : `${files.length} Berkas`}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {note.judul}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="px-4 py-2 border-b border-border/70 bg-muted/30 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('UPLOAD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'UPLOAD'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Form Upload ({files.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PDF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PDF'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Dokumen PDF ({pdfFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IMAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'IMAGE'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Galeri Foto ({imageFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'INFO'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Pagu & Anggaran</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 text-xs rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 0: FORM UPLOAD & BERKAS BUKTI DUKUNG */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4">
              {/* Form Upload Container */}
              <form onSubmit={handleUploadFile} className="p-4 rounded-2xl border border-border/80 bg-card/60 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    <span>Form Upload Berkas & Bukti Dukung Baru</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Format: PDF, PNG, JPG, JPEG (Maks. 25MB)
                  </span>
                </div>

                {/* Local File Dropzone / Picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all space-y-2 ${
                    selectedLocalFile
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-border/80 hover:border-emerald-500/50 bg-muted/20 hover:bg-emerald-500/5'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLocalFileSelect}
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                  />
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto ${
                    selectedLocalFile ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {selectedLocalFile ? <CheckCircle2 className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {selectedLocalFile ? selectedLocalFile.name : 'Klik atau Tarik Berkas ke Sini untuk Mengunggah'}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedLocalFile
                        ? `${(selectedLocalFile.size / 1024).toFixed(1)} KB • Berkas lokal siap diunggah`
                        : 'Pilih dokumen PDF, gambar JPG, PNG dari perangkat lokal Anda'}
                    </p>
                    {selectedLocalFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocalFile(null);
                          setFileDataUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline mt-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Batalkan Pilihan Berkas</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Jenis Dokumen</label>
                    <select
                      value={uploadFileType}
                      onChange={(e: any) => setUploadFileType(e.target.value)}
                      className="w-full h-8 text-xs rounded-lg border border-border bg-card px-2.5 text-foreground font-medium"
                    >
                      <option value="pdf">📄 Dokumen PDF (SOP/KAK/Laporan)</option>
                      <option value="image">🖼️ Foto Bukti Fisik Lapangan (PNG/JPG)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Kategori Berkas</label>
                    <select
                      value={uploadCategory}
                      onChange={(e: any) => setUploadCategory(e.target.value)}
                      className="w-full h-8 text-xs rounded-lg border border-border bg-card px-2.5 text-foreground font-medium"
                    >
                      <option value="SOP">SOP / Tata Kelola Standar</option>
                      <option value="KAK">Kerangka Acuan Kerja (KAK)</option>
                      <option value="FOTO">Foto Kegiatan & Lapangan</option>
                      <option value="BAST">Berita Acara (BAST / Serah Terima)</option>
                      <option value="INVOICE">Faktur / Kuitansi Belanja</option>
                      <option value="LAPORAN">Laporan Akhir & Hasil Uji</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Nama Berkas</label>
                    <Input
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      placeholder="Contoh: KAK-Migrasi-DB.pdf"
                      className="h-8 text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">URL Eksternal / Cloud Storage (Opsional)</label>
                    <Input
                      value={uploadFileUrl}
                      onChange={(e) => setUploadFileUrl(e.target.value)}
                      placeholder="https://... (Kosongkan jika upload berkas lokal di atas)"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Keterangan / Catatan Tambahan</label>
                    <Input
                      value={uploadKeterangan}
                      onChange={(e) => setUploadKeterangan(e.target.value)}
                      placeholder="Contoh: Disahkan oleh Pejabat Pembuat Komitmen"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={isUploading || !uploadFileName.trim()}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading ? 'Mengunggah & Menyimpan...' : 'Unggah & Lampirkan Berkas'}</span>
                  </Button>
                </div>
              </form>

              {/* Tabel / Daftar Berkas Terlampir */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 text-primary" />
                    <span>Seluruh Berkas Bukti Terlampir ({files.length})</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {pdfFiles.length} PDF • {imageFiles.length} Gambar
                  </span>
                </div>

                {files.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-border/70 bg-card space-y-1">
                    <p className="text-xs font-semibold text-foreground">Belum Ada Berkas Terlampir</p>
                    <p className="text-[11px] text-muted-foreground">
                      Gunakan formulir upload di atas untuk menambahkan berkas bukti dukung pertama.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                    {files.map((f, idx) => (
                      <div key={f.id || idx} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            f.fileType === 'pdf' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {f.fileType === 'pdf' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">{f.fileName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">{f.category || 'BERKAS'}</span>
                              <span>•</span>
                              <span>{f.fileSizeBytes ? `${(f.fileSizeBytes / 1024).toFixed(1)} KB` : 'Dokumen'}</span>
                              <span>•</span>
                              <span className="truncate">{f.keterangan || 'Tidak ada keterangan'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {f.fileType === 'pdf' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const pIdx = pdfFiles.findIndex((p) => p.id === f.id);
                                if (pIdx !== -1) setSelectedPdfIndex(pIdx);
                                setActiveTab('PDF');
                              }}
                              className="h-7 text-xs px-2 gap-1 text-rose-600 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
                              title="Buka Mode Baca PDF"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Baca</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const iIdx = imageFiles.findIndex((im) => im.id === f.id);
                                if (iIdx !== -1) setSelectedImageIndex(iIdx);
                                setActiveTab('IMAGE');
                              }}
                              className="h-7 text-xs px-2 gap-1 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 cursor-pointer"
                              title="Buka Galeri Foto"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Lihat</span>
                            </Button>
                          )}

                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-7 px-2 text-xs rounded-md border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Unduh / Buka Berkas Asli"
                          >
                            <Download className="h-3 w-3" />
                          </a>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(f.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            title="Hapus Berkas Ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: MODE READ PDF */}
          {activeTab === 'PDF' && (
            <div className="space-y-3">
              {pdfFiles.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Belum ada dokumen PDF yang dilampirkan.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Gunakan tab "Nilai & Info" atau tombol di bawah untuk melampirkan berkas KAK, SOP, atau Berita Acara.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('INFO')}
                    className="gap-1.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" /> Unggah Dokumen PDF
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* PDF Toolbar */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPdfIndex}
                        onChange={(e) => setSelectedPdfIndex(Number(e.target.value))}
                        className="h-8 text-xs font-medium rounded-lg border border-border bg-card px-2.5 text-foreground"
                      >
                        {pdfFiles.map((f, i) => (
                          <option key={f.id} value={i}>
                            {i + 1}. {f.fileName} ({f.category || 'DOKUMEN'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        Kategori: <strong className="text-foreground">{currentPdf?.category || 'SOP/KAK'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
                        className="h-7 w-7"
                        title="Perkecil Zoom"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs font-mono px-1 font-semibold">{pdfZoom}%</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                        className="h-7 w-7"
                        title="Perbesar Zoom"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>

                      {currentPdf?.fileUrl && (
                        <a
                          href={currentPdf.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Download className="h-3 w-3" /> Unduh
                        </a>
                      )}
                    </div>
                  </div>

                  {/* PDF Viewer Container */}
                  <div className="relative w-full h-[450px] rounded-xl border border-border/80 bg-neutral-900/10 overflow-hidden flex items-center justify-center">
                    {currentPdf ? (
                      <iframe
                        src={`${currentPdf.fileUrl}#toolbar=0&navpanes=0`}
                        title={currentPdf.fileName}
                        className="w-full h-full border-0 transition-transform origin-top"
                        style={{ transform: `scale(${pdfZoom / 100})` }}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Pilih dokumen untuk membaca</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMAGE SLIDER (GSLIDER MODERNIZATION) */}
          {activeTab === 'IMAGE' && (
            <div className="space-y-4">
              {imageFiles.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Belum ada foto dokumentasi bukti.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Lampirkan foto kegiatan, screenshot prototype Figma, atau foto bukti fisik serah terima BAST.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('INFO')}
                    className="gap-1.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" /> Unggah Foto Dokumentasi
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Main Slider Display */}
                  <div className="relative w-full h-[380px] rounded-2xl bg-black/90 overflow-hidden flex items-center justify-center group">
                    {currentImage && (
                      <img
                        src={currentImage.fileUrl}
                        alt={currentImage.fileName}
                        className="max-h-full max-w-full object-contain transition-opacity duration-300"
                      />
                    )}

                    {/* Navigation Buttons */}
                    {imageFiles.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex((i) => (i === 0 ? imageFiles.length - 1 : i - 1))
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex((i) => (i === imageFiles.length - 1 ? 0 : i + 1))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-80 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Bottom Floating Caption */}
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-xs font-bold line-clamp-1">{currentImage?.fileName}</span>
                        <p className="text-[11px] text-zinc-300 line-clamp-1">
                          {currentImage?.keterangan || 'Foto bukti fisik kegiatan / progres pekerjaan'}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                        {selectedImageIndex + 1} / {imageFiles.length}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {imageFiles.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-16 w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all relative ${
                          selectedImageIndex === idx
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.fileUrl} alt={img.fileName} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NILAI & INFORMASI PENDUKUNG */}
          {activeTab === 'INFO' && (
            <div className="space-y-4">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-primary" /> Target Pagu Anggaran
                  </span>
                  <div className="text-base font-bold text-foreground">
                    Rp {targetBudget.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Batas alokasi biaya resmi</span>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-blue-600" /> Realisasi Penyerapan
                  </span>
                  <div className="text-base font-bold text-blue-600">
                    Rp {realizedBudget.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {targetBudget > 0 ? `${Math.round((realizedBudget / targetBudget) * 100)}% terserap` : 'Belum dianggarkan'}
                  </span>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-1 ${
                  isOverbudget
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                }`}>
                  <span className="text-[11px] font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sisa Saldo Efisiensi
                  </span>
                  <div className="text-base font-bold">
                    Rp {budgetBalance.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px]">
                    {isOverbudget ? '⚠️ Peringatan: Overbudget!' : 'Anggaran aman terkendali'}
                  </span>
                </div>
              </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('UPLOAD')}
                    className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Buka Form Upload Lampiran</span>
                  </Button>
                </div>
              </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-border/80 bg-muted/20">
          <Button variant="outline" onClick={onClose} className="h-8 text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
