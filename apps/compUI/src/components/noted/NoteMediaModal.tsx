import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'PDF' | 'IMAGE' | 'INFO'>('PDF');
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
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFileType, setUploadFileType] = useState<'pdf' | 'image'>('pdf');
  const [uploadCategory, setUploadCategory] = useState<'SOP' | 'FOTO' | 'BAST' | 'INVOICE'>('SOP');
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

      const payload = {
        fileName: uploadFileName.trim(),
        fileUrl: uploadFileUrl.trim() || fallbackUrl,
        fileType: uploadFileType,
        category: uploadCategory,
        keterangan: uploadKeterangan.trim() || undefined,
        fileSizeBytes: uploadFileType === 'pdf' ? 245000 : 412000,
        mimeType: uploadFileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
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
        <div className="p-4 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Media & Bukti Dukung #{note.kdJudul}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                  {isLoading ? 'Memuat berkas...' : `${files.length} Berkas`}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {note.judul}
              </DialogDescription>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('PDF')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'PDF'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Mode PDF ({pdfFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IMAGE')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'IMAGE'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Slider Foto ({imageFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'INFO'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>Nilai & Info</span>
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

              {/* Form Tambah Berkas / Upload */}
              <form onSubmit={handleUploadFile} className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-primary" />
                  Lampirkan Berkas Bukti Dukung Baru
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Jenis Dokumen</label>
                    <select
                      value={uploadFileType}
                      onChange={(e: any) => setUploadFileType(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                    >
                      <option value="pdf">Dokumen PDF (SOP/KAK/Laporan)</option>
                      <option value="image">Foto Bukti Lapangan (PNG/JPG)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Kategori Berkas</label>
                    <select
                      value={uploadCategory}
                      onChange={(e: any) => setUploadCategory(e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-border bg-card px-2 text-foreground"
                    >
                      <option value="SOP">SOP / Kerangka Acuan Kerja</option>
                      <option value="FOTO">Foto Kegiatan / Dokumentasi</option>
                      <option value="BAST">Berita Acara (BAST / Uji Terima)</option>
                      <option value="INVOICE">Faktur / Kuitansi Biaya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Nama Berkas</label>
                    <Input
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      placeholder="Contoh: KAK-Migrasi-DB.pdf"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">URL Berkas / Tautan Cloud</label>
                    <Input
                      value={uploadFileUrl}
                      onChange={(e) => setUploadFileUrl(e.target.value)}
                      placeholder="https://... (Kosongkan untuk simulasi otomatis)"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Keterangan Catatan Tambahan</label>
                    <Input
                      value={uploadKeterangan}
                      onChange={(e) => setUploadKeterangan(e.target.value)}
                      placeholder="Dokumen resmi disetujui Pejabat Pembuat Komitmen"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={isUploading || !uploadFileName.trim()}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? 'Menyimpan...' : 'Lampirkan Berkas'}
                  </Button>
                </div>
              </form>

              {/* Daftar Seluruh Lampiran */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  Semua Berkas Terlampir ({files.length})
                </h4>
                {files.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Belum ada berkas lampiran.</p>
                ) : (
                  <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            f.fileType === 'pdf' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {f.fileType === 'pdf' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">{f.fileName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-semibold text-primary">{f.category || 'BERKAS'}</span>
                              <span>•</span>
                              <span>{f.keterangan || 'Tidak ada keterangan'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(f.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                            title="Hapus Berkas"
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
