import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  ttlSeconds: number;
}

/**
 * MFC Enterprise Foundation Framework - Dual Layer Cache Service
 * Sesuai panduan standar: Respon API dicache dengan masa berlaku 5 menit (300 detik),
 * dihapus atau diperbarui setelah dilakukan pengecekan tanggal terakhir melebihi waktu yang ditentukan.
 */
@Injectable()
export class MfcCacheService {
  private readonly logger = new Logger(MfcCacheService.name);
  private readonly memoryStore = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL_SECONDS = 300; // 5 Menit (300 detik)

  /**
   * Mengambil data dari cache. Jika sudah expired (> 5 menit), otomatis dihapus dan mengembalikan null.
   */
  get<T>(key: string): T | null {
    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.logger.debug(`[Cache Expired] Key: ${key} melebihi batas waktu 5 menit, dihapus dari memori.`);
      this.memoryStore.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Menyimpan data ke dalam cache dengan batas waktu (default 5 menit / 300 detik).
   */
  set<T>(key: string, data: T, ttlSeconds: number = this.DEFAULT_TTL_SECONDS): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      ttlSeconds,
    };
    this.memoryStore.set(key, entry as CacheEntry<unknown>);
  }

  /**
   * Menghapus cache berdasarkan key tertentu (saat mutasi data terjadi).
   */
  invalidate(key: string): void {
    this.memoryStore.delete(key);
  }

  /**
   * Menghapus cache berdasarkan pola prefix (misal 'notes:*' saat ada update data catatan).
   */
  invalidatePrefix(prefix: string): void {
    let deletedCount = 0;
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.logger.debug(`[Cache Invalidation] Dihapus ${deletedCount} item dengan prefix: ${prefix}`);
    }
  }

  /**
   * Mengecek apakah key masih aktif dan valid di cache.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
