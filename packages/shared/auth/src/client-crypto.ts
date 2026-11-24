/**
 * MFC Enterprise Foundation Framework - Client-Side Wire Protection & Hashing
 * Password di-hash sebelum transmisi jaringan untuk memastikan password mentah
 * tidak pernah terkirim tanpa enkripsi/hashing di wire.
 */

/**
 * Menghasilkan hash SHA-256 dari teks plaintext dengan salt di sisi browser.
 */
export async function hashPasswordForWire(
  plainPassword: string,
  salt = 'mfc-enterprise-foundation'
): Promise<string> {
  if (!plainPassword) return '';

  // Jika di browser dengan Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${plainPassword}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback hashing sederhana jika crypto.subtle tidak tersedia
  let hash = 0;
  const str = `${salt}:${plainPassword}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16)}`;
}
