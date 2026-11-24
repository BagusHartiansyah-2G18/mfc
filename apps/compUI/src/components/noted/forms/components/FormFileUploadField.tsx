import { useState } from 'react';
import { Button } from '@org/ui';
import { Eye, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { authFetch } from '@org/auth';
import { FilePreviewModal, type PreviewFile } from './FilePreviewModal';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function toPreviewFile(value: any): PreviewFile | null {
  if (!value) return null;
  if (typeof value === 'string') {
    return { fileName: 'Lampiran', fileUrl: value };
  }
  if (typeof value === 'object' && value.fileUrl) {
    return value as PreviewFile;
  }
  return null;
}

interface FormFileUploadFieldProps {
  label: string;
  helperText?: string;
  required?: boolean;
  value: any;
  onChange: (value: any) => void;
  uploadEndpoint: string;
  skipAuth?: boolean;
}

export function FormFileUploadField({
  label,
  helperText,
  required,
  value,
  onChange,
  uploadEndpoint,
  skipAuth = false,
}: FormFileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const fileValue = toPreviewFile(value);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file: File) => {
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Ukuran berkas melebihi 10 MB.');
      return;
    }
    try {
      setIsUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const res = await authFetch(uploadEndpoint, {
        method: 'POST',
        skipAuth,
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64: dataUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengunggah berkas.');
      }
      onChange(json.data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {fileValue ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
          <Paperclip className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {fileValue.fileName || 'Lampiran'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {fileValue.mimeType || 'Berkas terunggah'}
              {fileValue.fileSizeBytes
                ? ` · ${(Number(fileValue.fileSizeBytes) / 1024).toFixed(0)} KB`
                : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewFile(fileValue)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lihat</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <label
          className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs cursor-pointer transition-colors ${
            isUploading
              ? 'border-primary/40 bg-primary/5 text-muted-foreground cursor-wait'
              : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 text-foreground'
          }`}
        >
          <input
            type="file"
            className="hidden"
            disabled={isUploading}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Upload className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium">
            {isUploading ? 'Mengunggah berkas...' : 'Pilih Berkas (PDF / Gambar, maks 10 MB)'}
          </span>
        </label>
      )}

      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}

      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
