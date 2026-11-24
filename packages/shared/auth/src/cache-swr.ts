/**
 * MFC Enterprise Foundation Framework - Dual-Layer SWR (Stale-While-Revalidate) Cache
 * Menyimpan respon di localStorage (exp 5 menit) untuk meminimalisir loading pada UI,
 * lalu memperbarui data secara seamless begitu respons API diterima dari server.
 */

export interface CachePayload<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface SwrOptions<T> {
  ttlMs?: number; // Default 5 menit = 300,000 ms
  onFreshData?: (data: T) => void;
  forceRefresh?: boolean;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 Menit (300 detik)

/**
 * Mengambil data dengan strategi Stale-While-Revalidate (SWR):
 * 1. Jika ada cache di localStorage dan belum kadaluarsa (< 5 menit), kembalikan cache langsung.
 * 2. Secara asinkron jalankan fetcher untuk mengambil data terkini dari backend/Redis.
 * 3. Simpan data baru ke localStorage dan picu onFreshData jika ada pembaruan.
 */
export async function fetchWithSwr<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: SwrOptions<T> = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const storageKey = `mfc_swr_${cacheKey}`;

  let cachedData: T | null = null;
  let isCacheValid = false;

  if (typeof window !== 'undefined' && window.localStorage && !options.forceRefresh) {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: CachePayload<T> = JSON.parse(raw);
        const age = Date.now() - parsed.timestamp;
        if (age < parsed.ttlMs) {
          cachedData = parsed.data;
          isCacheValid = true;
        } else {
          // Melebihi 5 menit, bersihkan
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.warn('[SWR] Gagal membaca cache localStorage:', e);
    }
  }

  // Jika cache valid ditemukan, jalankan background revalidation dan return cache segera
  if (isCacheValid && cachedData !== null) {
    void (async () => {
      try {
        const freshData = await fetcher();
        if (typeof window !== 'undefined' && window.localStorage) {
          const payload: CachePayload<T> = {
            data: freshData,
            timestamp: Date.now(),
            ttlMs,
          };
          window.localStorage.setItem(storageKey, JSON.stringify(payload));
        }
        if (options.onFreshData) {
          options.onFreshData(freshData);
        }
      } catch (err) {
        console.warn('[SWR] Gagal background revalidation:', err);
      }
    })();

    return cachedData;
  }

  // Jika tidak ada cache, fetch langsung
  const freshData = await fetcher();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const payload: CachePayload<T> = {
        data: freshData,
        timestamp: Date.now(),
        ttlMs,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('[SWR] Gagal menyimpan cache localStorage:', e);
    }
  }

  return freshData;
}

/**
 * Invalidate cache di localStorage berdasarkan key atau prefix
 */
export function invalidateSwrCache(cacheKeyOrPrefix: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const prefix = `mfc_swr_${cacheKeyOrPrefix}`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && (key === `mfc_swr_${cacheKeyOrPrefix}` || key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  for (const k of keysToRemove) {
    window.localStorage.removeItem(k);
  }
}
