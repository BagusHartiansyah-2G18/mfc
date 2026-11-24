/**
 * MFC Enterprise Foundation Framework - Defensive Programming & Safe Variable Helpers
 * Melindungi pemrosesan data hardcode, multi-source data, dan variabel di luar kondisi aman.
 */

export function safeVar<T>(
  val: unknown,
  fallback: T,
  validator?: (v: unknown) => boolean
): T {
  if (val === null || val === undefined) {
    return fallback;
  }

  if (typeof fallback === 'string' && typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length === 0) return fallback;
    return (validator ? (validator(trimmed) ? trimmed : fallback) : trimmed) as unknown as T;
  }

  if (typeof fallback === 'number') {
    const num = Number(val);
    if (Number.isNaN(num)) return fallback;
    return (validator ? (validator(num) ? num : fallback) : num) as unknown as T;
  }

  if (typeof fallback === 'boolean') {
    if (typeof val === 'boolean') return val as unknown as T;
    if (val === 'true' || val === '1' || val === 1) return true as unknown as T;
    if (val === 'false' || val === '0' || val === 0) return false as unknown as T;
    return fallback;
  }

  if (validator && !validator(val)) {
    return fallback;
  }

  return val as T;
}

export function tryCatchSafe<T>(
  fn: () => T,
  fallback: T,
  onError?: (err: unknown) => void
): T {
  try {
    return fn();
  } catch (err) {
    if (onError) onError(err);
    else console.warn('[tryCatchSafe] Handled exception:', (err as Error)?.message || err);
    return fallback;
  }
}

export async function tryCatchSafeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (err: unknown) => void
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (onError) onError(err);
    else console.warn('[tryCatchSafeAsync] Handled exception:', (err as Error)?.message || err);
    return fallback;
  }
}
