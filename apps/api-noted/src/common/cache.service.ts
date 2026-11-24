import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  ttlSeconds: number;
}

@Injectable()
export class MfcCacheService {
  private readonly logger = new Logger(MfcCacheService.name);
  private readonly memoryStore = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL_SECONDS = 300; // 5 Menit (300 detik)

  get<T>(key: string): T | null {
    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.logger.debug(`[Cache Expired] Key: ${key} melebihi 5 menit, dihapus dari memori.`);
      this.memoryStore.delete(key);
      return null;
    }

    return entry.data;
  }

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

  invalidate(key: string): void {
    this.memoryStore.delete(key);
  }

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

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
