/**
 * MFC Enterprise Foundation Framework - Form & File Security Guard
 * Mencegah SQL Injection pada nilai form dan memvalidasi ukuran serta tipe berkas lampiran.
 */

/**
 * Pola regex pendeteksi potensi SQL Injection pada input form string
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
  /('(\s*OR\s*|\s*AND\s*)'|\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i,
  /(';|\"--|`--)/,
];

/**
 * Memeriksa apakah input mengandung pola SQL Injection
 */
export function hasSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitasi string input agar bebas dari bahaya karakter SQL injeksi
 */
export function sanitizeFormValue(input: string): string {
  if (!input || typeof input !== 'string') return input;
  // Ganti single quotes berbahaya dan comment dashes
  return input
    .replace(/--/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/;/g, '')
    .trim();
}

export interface FileValidationOptions {
  maxSizeMb?: number; // Default 25 MB
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const DEFAULT_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'xlsx',
  'xls',
  'docx',
  'doc',
  'csv',
];

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
];

/**
 * Validasi ketat berkas sebelum diupload / disimpan di server
 */
export function validateFormFile(
  file: { name: string; size: number; type?: string },
  options: FileValidationOptions = {}
): FileValidationResult {
  const maxSizeMb = options.maxSizeMb ?? 25;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const allowedExtensions = options.allowedExtensions ?? DEFAULT_ALLOWED_EXTENSIONS;
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

  if (!file || !file.name) {
    return { valid: false, error: 'Berkas tidak valid atau tidak memiliki nama.' };
  }

  // 1. Validasi Batasan Ukuran Berkas
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum ${maxSizeMb} MB.`,
    };
  }

  // 2. Validasi Ekstensi
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Ekstensi .${ext} tidak diizinkan. Ekstensi yang didukung: ${allowedExtensions.join(', ')}`,
    };
  }

  // 3. Validasi MIME Type jika tersedia
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    // Toleransi untuk file csv/excel jika browser mengirim mime umum
    if (!file.type.includes('excel') && !file.type.includes('sheet') && !file.type.includes('csv')) {
      return {
        valid: false,
        error: `Tipe MIME ${file.type} tidak didukung sistem keamanan server.`,
      };
    }
  }

  return { valid: true };
}
