import { Download, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@org/ui';

export interface PreviewFile {
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  fileType?: string | null;
  fileSizeBytes?: number | null;
}

interface FilePreviewModalProps {
  file: PreviewFile | null;
  isOpen: boolean;
  onClose: () => void;
}

function resolveKind(file: PreviewFile): 'image' | 'pdf' | 'other' {
  const mime = (file.mimeType || '').toLowerCase();
  const url = (file.fileUrl || '').split('?')[0].toLowerCase();
  if (file.fileType === 'image' || mime.startsWith('image/')) return 'image';
  if (
    file.fileType === 'pdf' ||
    mime === 'application/pdf' ||
    url.endsWith('.pdf')
  ) {
    return 'pdf';
  }
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(url)) return 'image';
  return 'other';
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const opened = Boolean(isOpen && file?.fileUrl);
  const kind = file ? resolveKind(file) : 'other';
  const name = file?.fileName || 'Lampiran';
  const url = file?.fileUrl || '';

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[96vw] max-h-[94vh] flex flex-col p-0 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            {kind === 'image' ? (
              <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold truncate">{name}</DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground truncate">
                Pratinjau lampiran bukti dukung
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={url} target="_blank" rel="noreferrer">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tab Baru</span>
              </Button>
            </a>
            <a href={url} download={name}>
              <Button type="button" size="sm" className="h-8 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </Button>
            </a>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-neutral-900/5 p-2 sm:p-4">
          {kind === 'image' && (
            <div className="w-full h-[70vh] flex items-center justify-center">
              <img
                src={url}
                alt={name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm bg-white"
              />
            </div>
          )}

          {kind === 'pdf' && (
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              title={name}
              className="w-full h-[70vh] rounded-lg border border-border/70 bg-white"
            />
          )}

          {kind === 'other' && (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                Pratinjau tidak tersedia untuk tipe berkas ini
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Unduh atau buka berkas pada tab baru untuk melihat isinya.
              </p>
              <a href={url} target="_blank" rel="noreferrer">
                <Button type="button" size="sm" className="text-xs gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Buka Berkas
                </Button>
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-2.5 border-t border-border/80 bg-muted/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
