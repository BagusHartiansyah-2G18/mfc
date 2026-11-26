import { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@org/ui';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Copy,
  FilePenLine,
  Globe,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { authFetch } from '@org/auth';
import type { DataForm, JudulNote } from '../types';
import { WorkspaceNav } from '../WorkspaceNav';
import { NoteDynamicFormTable } from './NoteDynamicFormTable';
import { NoteDynamicFormRenderer } from './NoteDynamicFormRenderer';
import { NoteFormAccessModal } from './NoteFormAccessModal';
import { FormApiIntegrationPanel } from './FormApiIntegrationPanel';
import { NoteDynamicFormBuilder } from './NoteDynamicFormBuilder';

interface NoteFormResponsesPageProps {
  kdJudul: string;
  formId: string;
  apiBaseUrl?: string;
  authToken?: string;
  initialTab?: 'rekap' | 'isi' | 'info' | 'api';
  onNavigate?: (path: string) => void;
}

type TabKey = 'rekap' | 'isi' | 'info' | 'api';

function readInitialTab(fallback: TabKey): TabKey {
  try {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'rekap' || tab === 'isi' || tab === 'info' || tab === 'api') return tab;
  } catch {
    // ignore
  }
  return fallback;
}

export function NoteFormResponsesPage({
  kdJudul,
  formId,
  apiBaseUrl = 'http://localhost:3002/api',
  initialTab = 'rekap',
  onNavigate,
}: NoteFormResponsesPageProps) {
  const [form, setForm] = useState<DataForm | null>(null);
  const [note, setNote] = useState<JudulNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>(() => readInitialTab(initialTab));
  const [copied, setCopied] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const handleTabChange = useCallback((nextTab: TabKey) => {
    setTab(nextTab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', nextTab);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setTab(readInitialTab(initialTab));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialTab]);

  const go = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const fetchForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(
        `${apiBaseUrl}/notes/${encodeURIComponent(kdJudul)}/forms/${encodeURIComponent(formId)}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat detail formulir.');
      }
      setForm(json.data);
      if (json.note) {
        setNote(json.note);
      } else {
        try {
          const subRes = await authFetch(`${apiBaseUrl}/notes/sub?kdJudul=${encodeURIComponent(kdJudul)}&tingkat=1`);
          if (subRes.ok) {
            const subJson = await subRes.json();
            const payload = subJson.data || subJson;
            if (payload.current) setNote(payload.current);
          }
        } catch {}
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail formulir.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, kdJudul, formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const copyPublicLink = async () => {
    if (!form?.shareSlug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${form.shareSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Gagal menyalin tautan publik.');
    }
  };

  const sharingLabel = form?.sharingMode === 'PUBLIC' ? 'Publik' : form?.sharingMode === 'KHUSUS' ? 'Khusus' : 'Pribadi';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <button
            type="button"
            onClick={() => go(`/forms/${encodeURIComponent(kdJudul)}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Daftar Form Pendukung
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              #{kdJudul}
            </span>
            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]" title={note?.judul}>
              {note?.judul || 'Catatan'}
            </span>
            <span className="text-muted-foreground/60">&bull;</span>
            <h1 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
              {form?.tujuan || 'Rekap Respon Form'}
            </h1>
            {form?.isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Lock className="h-3 w-3" /> Terkunci
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {form?.keterangan || 'Kelola isian dan rekap respon formulir pendukung'}
          </p>
        </div>

        {form && (
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-full ${
                form.sharingMode === 'PUBLIC'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : form.sharingMode === 'KHUSUS'
                  ? 'bg-indigo-500/10 text-indigo-600'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {form.sharingMode === 'PUBLIC' ? (
                <Globe className="h-3 w-3" />
              ) : form.sharingMode === 'KHUSUS' ? (
                <Users className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {sharingLabel}
            </span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
              {form.responseCount || 0} respon
            </span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">
              v{form.schemaVersion} · {form.fields?.length || 0} field
            </span>
            {form.sharingMode === 'PUBLIC' && form.shareSlug && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPublicLink}
                className="h-7 text-xs gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? 'Tersalin!' : 'Salin Tautan'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBuilderOpen(true)}
              className="h-7 text-xs gap-1.5"
              title="Edit & sesuaikan struktur form"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Form
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAccessModalOpen(true)}
              className="h-7 text-xs gap-1.5"
              title="Atur status form (Public / Khusus / Private) secara terpisah dari catatan"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Akses Form
            </Button>
          </div>
        )}
      </div>

      <WorkspaceNav active="form" kdJudul={kdJudul} onNavigate={onNavigate} />

      <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/20 p-1 w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('rekap')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'rekap'
              ? 'bg-card text-foreground shadow-2xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Rekap Respon
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('isi')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'isi'
              ? 'bg-card text-foreground shadow-2xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FilePenLine className="h-3.5 w-3.5" /> Isi Form
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('info')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'info'
              ? 'bg-card text-foreground shadow-2xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="h-3.5 w-3.5" /> Info Form
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('api')}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'api'
              ? 'bg-card text-foreground shadow-2xs border border-border/70'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" /> Integrasi API
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Memuat formulir...
        </div>
      ) : !form ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Formulir tidak ditemukan atau Anda tidak memiliki akses.
        </div>
      ) : tab === 'rekap' ? (
        <NoteDynamicFormTable form={form} kdJudul={kdJudul} apiBaseUrl={apiBaseUrl} />
      ) : tab === 'isi' ? (
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6">
          <NoteDynamicFormRenderer
            form={form}
            kdJudul={kdJudul}
            apiBaseUrl={apiBaseUrl}
            onSubmitted={() => {
              fetchForm();
              handleTabChange('rekap');
            }}
            onCancel={() => go(`/forms/${encodeURIComponent(kdJudul)}`)}
          />
        </div>
      ) : tab === 'api' ? (
        <FormApiIntegrationPanel kdJudul={kdJudul} formId={form.id} apiBaseUrl={apiBaseUrl} />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-border/80 bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Struktur Field</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80">
                    <th className="py-2 px-3 font-semibold text-muted-foreground w-10">No</th>
                    <th className="py-2 px-3 font-semibold text-foreground">Label</th>
                    <th className="py-2 px-3 font-semibold text-foreground">Key</th>
                    <th className="py-2 px-3 font-semibold text-foreground">Tipe</th>
                    <th className="py-2 px-3 font-semibold text-foreground">Wajib</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(form.fields || []).map((field, idx) => (
                    <tr key={field.key || idx} className="hover:bg-muted/20">
                      <td className="py-2 px-3 text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-foreground">{field.label}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{field.key}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {field.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{field.required ? 'Ya' : 'Tidak'}</td>
                    </tr>
                  ))}
                  {(form.fields || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Belum ada field pada formulir ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {form.shareSlug && form.sharingMode === 'PUBLIC' && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-2">
              <p className="font-bold text-emerald-700">Tautan Pengisian Publik</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/p/${form.shareSlug}`}
                  className="flex-1 h-8 bg-background font-mono text-[11px]"
                />
                <Button type="button" size="sm" onClick={copyPublicLink} className="h-8 text-xs gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> {copied ? 'Tersalin!' : 'Salin'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <NoteFormAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        form={form}
        kdJudul={kdJudul}
        apiBaseUrl={apiBaseUrl}
        onSaved={() => fetchForm()}
      />

      <NoteDynamicFormBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        kdJudul={kdJudul}
        editingForm={form}
        apiBaseUrl={apiBaseUrl}
        onSaved={() => fetchForm()}
      />
    </div>
  );
}
