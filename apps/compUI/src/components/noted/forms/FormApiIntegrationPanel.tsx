import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { Button, Input, SelectField } from '@org/ui';
import { authFetch } from '@org/auth';
import type { UserFriend } from '../types';

interface FormApiKeyRecord {
  id: string;
  formId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  label: string;
  keyPrefix: string;
  scopes: string;
  isActive: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

interface FormApiIntegrationPanelProps {
  kdJudul: string;
  formId: string;
  apiBaseUrl: string;
}

export function FormApiIntegrationPanel({
  kdJudul,
  formId,
  apiBaseUrl,
}: FormApiIntegrationPanelProps) {
  const [keys, setKeys] = useState<FormApiKeyRecord[]>([]);
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<{ apiKey: string; label: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [scopes, setScopes] = useState('responses:read,responses:export');
  const [expiresInDays, setExpiresInDays] = useState<string>('90');

  const fetchKeysAndFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [keysRes, friendsRes] = await Promise.all([
        authFetch(`${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}/api-keys`),
        authFetch(`${apiBaseUrl}/friends`),
      ]);
      const [keysJson, friendsJson] = await Promise.all([
        keysRes.json().catch(() => ({})),
        friendsRes.json().catch(() => ({})),
      ]);
      if (keysRes.ok && keysJson.success && Array.isArray(keysJson.data)) {
        setKeys(keysJson.data);
      } else if (!keysRes.ok) {
        setError(keysJson.message || 'Gagal memuat daftar API Key.');
      }
      if (friendsRes.ok && friendsJson.success && Array.isArray(friendsJson.data)) {
        setFriends(friendsJson.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data integrasi API.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, kdJudul, formId]);

  useEffect(() => {
    fetchKeysAndFriends();
  }, [fetchKeysAndFriends]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError('Gagal menyalin ke clipboard.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Nama aplikasi / label API Key wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setGeneratedKey(null);
      const res = await authFetch(
        `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}/api-keys`,
        {
          method: 'POST',
          body: JSON.stringify({
            label: label.trim(),
            targetUserId: targetUserId || undefined,
            scopes,
            expiresInDays: expiresInDays ? Number(expiresInDays) : null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal membuat API Key.');
      }
      if (json.data?.apiKey) {
        setGeneratedKey({ apiKey: json.data.apiKey, label: json.data.label });
      }
      setLabel('');
      setTargetUserId('');
      await fetchKeysAndFriends();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat API Key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!window.confirm('Cabut API Key ini? Aplikasi yang memakainya akan langsung kehilangan akses.')) return;
    try {
      const res = await authFetch(
        `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}/api-keys/${encodeURIComponent(keyId)}`,
        { method: 'DELETE' }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Gagal mencabut API Key.');
      }
      await fetchKeysAndFriends();
    } catch (err: any) {
      setError(err.message || 'Gagal mencabut API Key.');
    }
  };

  const dataEndpoint = `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}/data`;
  const exportEndpoint = `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}/export?format=csv`;
  const sampleKey = generatedKey?.apiKey || 'mfc_live_YOUR_API_KEY_HERE';
  const curlSnippet = `curl -H "X-API-Key: ${sampleKey}" "${dataEndpoint}"`;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {generatedKey && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>API Key untuk &quot;{generatedKey.label}&quot; Berhasil Dibuat (Tampil 1 Kali)</span>
          </div>
          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300">
            Segera salin dan simpan key ini. Demi keamanan, key lengkap tidak dapat dilihat lagi setelah Anda meninggalkan halaman ini.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedKey.apiKey}
              className="flex-1 h-8 border-emerald-500/30 bg-background font-mono text-[11px]"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => copyText(generatedKey.apiKey, 'new-key')}
              className="h-8 text-xs gap-1.5"
            >
              {copiedId === 'new-key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedId === 'new-key' ? 'Tersalin' : 'Salin Key'}
            </Button>
          </div>
        </div>
      )}

      {/* Generate API Key Form */}
      <form onSubmit={handleCreate} className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-primary" />
            Generate API Key untuk Aplikasi Eksternal
          </h3>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            Kredensial sesuai daftar Friend
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Nama Aplikasi / Integrasi <span className="text-rose-500">*</span>
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Misal: ERP Gudang / BI"
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Kredensial User (Sesuai Friend)
            </label>
            <SelectField
              size="sm"
              value={targetUserId}
              onChange={setTargetUserId}
              options={[
                { value: '', label: 'Akun Saya Sendiri (Pemilik)' },
                ...friends.map((f) => ({
                  value: f.friendUserId,
                  label: `${f.friendName} (${f.friendEmail})`,
                })),
              ]}
              className="rounded-md bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Hak Akses (Scope)</label>
            <SelectField
              size="sm"
              value={scopes}
              onChange={setScopes}
              options={[
                { value: 'responses:read,responses:export', label: 'Baca & Export Rekap' },
                { value: 'responses:read', label: 'Hanya Baca Rekap' },
                { value: 'responses:read,responses:export,responses:submit', label: 'Baca, Export & Submit' },
              ]}
              className="rounded-md bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Masa Berlaku</label>
            <SelectField
              size="sm"
              value={expiresInDays}
              onChange={setExpiresInDays}
              options={[
                { value: '30', label: '30 Hari' },
                { value: '90', label: '90 Hari' },
                { value: '365', label: '1 Tahun' },
                { value: '', label: 'Tanpa Batas' },
              ]}
              className="rounded-md bg-background"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs font-semibold gap-1.5">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {isSubmitting ? 'Membuat Key...' : 'Generate API Key'}
          </Button>
        </div>
      </form>

      {/* Endpoint & Snippet */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5 text-xs">
        <h4 className="font-bold text-foreground">Endpoint &amp; Contoh Penggunaan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground">GET Rekap JSON (Flat)</span>
            <div className="flex gap-1.5">
              <Input readOnly value={dataEndpoint} className="flex-1 h-7 bg-muted/20 font-mono text-[10px]" />
              <Button type="button" variant="outline" size="sm" onClick={() => copyText(dataEndpoint, 'ep-json')} className="h-7 px-2 text-[10px]">
                {copiedId === 'ep-json' ? 'Tersalin' : 'Salin'}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground">GET Export CSV</span>
            <div className="flex gap-1.5">
              <Input readOnly value={exportEndpoint} className="flex-1 h-7 bg-muted/20 font-mono text-[10px]" />
              <Button type="button" variant="outline" size="sm" onClick={() => copyText(exportEndpoint, 'ep-csv')} className="h-7 px-2 text-[10px]">
                {copiedId === 'ep-csv' ? 'Tersalin' : 'Salin'}
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground">Contoh Request Header (cURL)</span>
            <button
              type="button"
              onClick={() => copyText(curlSnippet, 'curl')}
              className="text-[10px] text-primary hover:underline cursor-pointer"
            >
              {copiedId === 'curl' ? 'Tersalin!' : 'Salin cURL'}
            </button>
          </div>
          <pre className="p-2.5 rounded-lg bg-muted/40 border border-border/60 font-mono text-[10px] overflow-x-auto">{curlSnippet}</pre>
        </div>
      </div>

      {/* Active Keys Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground">Daftar API Key Aktif ({keys.length})</h4>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Memuat daftar API Key...</div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Belum ada API Key untuk formulir ini.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {keys.map((k) => (
              <div key={k.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{k.label}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {k.keyPrefix}...
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {k.scopes}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Kredensial: <strong className="text-foreground">{k.targetUserName}</strong> ({k.targetUserEmail})
                    {k.expiresAt ? ` • Berlaku s/d ${new Date(k.expiresAt).toLocaleDateString('id-ID')}` : ' • Tanpa batas'}
                    {k.lastUsedAt ? ` • Terakhir dipakai ${new Date(k.lastUsedAt).toLocaleString('id-ID')}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(k.id)}
                  className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-500/10 gap-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Cabut
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
