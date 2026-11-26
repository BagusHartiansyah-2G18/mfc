import type { FormFieldOptionSource } from '../types';

export function extractArrayFromPayload(
  payload: any,
  dataPath?: string
): Record<string, any>[] {
  let target = payload;

  if (dataPath && dataPath.trim()) {
    for (const seg of dataPath.trim().split('.')) {
      if (target && typeof target === 'object') {
        target = target[seg];
      } else {
        target = undefined;
        break;
      }
    }
  } else if (!Array.isArray(target) && target && typeof target === 'object') {
    if (Array.isArray(target.rows)) target = target.rows;
    else if (Array.isArray(target.data)) target = target.data;
    else if (target.data && typeof target.data === 'object' && Array.isArray(target.data.rows)) {
      target = target.data.rows;
    } else if (Array.isArray(target.items)) target = target.items;
    else if (Array.isArray(target.results)) target = target.results;
  }

  if (!Array.isArray(target)) return [];

  return target.map((item, idx) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return item as Record<string, any>;
    }
    return { value: String(item ?? idx), label: String(item ?? '') };
  });
}

export async function fetchOptionsFromApi(
  source: FormFieldOptionSource,
  signal?: AbortSignal
): Promise<Record<string, any>[]> {
  const url = (source.apiUrl || '').trim();
  if (!url) return [];

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (source.apiKey && source.apiKey.trim()) {
    headers['X-API-Key'] = source.apiKey.trim();
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    signal,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Gagal memuat opsi dari API (${res.status})`);
  }

  return extractArrayFromPayload(json, source.dataPath);
}

export function resolveOptionValue(
  item: Record<string, any>,
  valueKey?: string,
  fallbackIndex = 0
): string {
  if (!item || typeof item !== 'object') return String(item ?? fallbackIndex);
  const key = valueKey?.trim();
  if (key && item[key] !== undefined && item[key] !== null) {
    return String(item[key]);
  }
  const fallback = item.id ?? item.value ?? item.kode ?? item.key;
  if (fallback !== undefined && fallback !== null) {
    return String(fallback);
  }
  return String(fallbackIndex);
}

export function resolveOptionLabel(
  item: Record<string, any>,
  labelKey?: string,
  valueKey?: string
): string {
  if (!item || typeof item !== 'object') return String(item ?? '');
  const key = labelKey?.trim();
  if (key && item[key] !== undefined && item[key] !== null) {
    return String(item[key]);
  }
  const fallback =
    item.label ?? item.name ?? item.nama ?? item.title ?? item.tujuan;
  if (fallback !== undefined && fallback !== null) {
    return String(fallback);
  }
  return resolveOptionValue(item, valueKey);
}
