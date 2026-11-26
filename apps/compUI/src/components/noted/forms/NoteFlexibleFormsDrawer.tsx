import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Settings2,
  BarChart2,
  Send,
  ShieldCheck,
  Lock,
  Globe,
  Users,
  RotateCcw,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@org/ui';
import {
  type JudulNote,
  type DataForm,
} from '../types';
import { authFetch } from '@org/auth';
import { NoteDynamicFormBuilder } from './NoteDynamicFormBuilder';
import { NoteDynamicFormRenderer } from './NoteDynamicFormRenderer';
import { NoteDynamicFormTable } from './NoteDynamicFormTable';
import { NoteFormAccessModal } from './NoteFormAccessModal';

interface NoteFlexibleFormsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  note: JudulNote | null;
  onUpdated?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
}

export function NoteFlexibleFormsDrawer({
  isOpen,
  onClose,
  note,
  onUpdated,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
}: NoteFlexibleFormsDrawerProps) {
  const [forms, setForms] = useState<DataForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Selected Form for Sub-Views
  const [selectedForm, setSelectedForm] = useState<DataForm | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'ENTRY' | 'RESPONSES'>('LIST');

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<DataForm | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState<DataForm | null>(null);

  const fetchForms = useCallback(async () => {
    if (!note?.kdJudul) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch(`${apiBaseUrl}/notes/${encodeURIComponent(note.kdJudul)}/forms`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setForms(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat formulir.');
    } finally {
      setIsLoading(false);
    }
  }, [note?.kdJudul, apiBaseUrl]);

  useEffect(() => {
    if (isOpen && note?.kdJudul) {
      fetchForms();
      setViewMode('LIST');
      setSelectedForm(null);
    }
  }, [isOpen, note?.kdJudul, fetchForms]);

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Yakin ingin menghapus formulir ini beserta seluruh data responnya?')) return;
    if (!note?.kdJudul) return;

    try {
      await authFetch(`${apiBaseUrl}/notes/${encodeURIComponent(note.kdJudul)}/forms/${encodeURIComponent(formId)}`, {
        method: 'DELETE',
      });
      fetchForms();
      onUpdated?.();
      if (selectedForm?.id === formId) {
        setViewMode('LIST');
        setSelectedForm(null);
      }
    } catch (err) {
      console.warn('Gagal menghapus form:', err);
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-over Panel */}
        <div className="w-screen max-w-3xl bg-card border-l border-border/80 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/80 bg-muted/20 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  #{note.kdJudul}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Tingkat {note.tingkat}
                </span>
                {isLoading && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 animate-pulse">
                    Memuat...
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-foreground truncate">
                {viewMode === 'LIST'
                  ? 'Form Pendukung Fleksibel'
                  : selectedForm?.tujuan}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {note.judul}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {viewMode !== 'LIST' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMode('LIST');
                    setSelectedForm(null);
                  }}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Daftar Form</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setEditingForm(null);
                    setIsBuilderOpen(true);
                  }}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Form Baru</span>
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              {error}
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* VIEW MODE: LIST */}
            {viewMode === 'LIST' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Daftar Formulir Kustom Pengguna ({forms.length} Form)</span>
                  <button
                    type="button"
                    onClick={fetchForms}
                    className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                  >
                    <RotateCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>
                </div>

                {forms.length === 0 && !isLoading ? (
                  <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border/80 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Belum Ada Formulir Kustom</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Buat formulir fleksibel pertama Anda untuk mengumpulkan masukan data, evaluasi, atau kriteria spesifik catatan ini.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setEditingForm(null);
                        setIsBuilderOpen(true);
                      }}
                      className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" /> Rancang Form Sekarang
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {forms.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-primary">
                                #{f.kd}
                              </span>
                              <h4 className="font-bold text-sm text-foreground truncate">
                                {f.tujuan}
                              </h4>

                              {/* Sharing Badge */}
                              {f.sharingMode === 'PUBLIC' && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                                  <Globe className="h-3 w-3" /> Public (Bebas Login)
                                </span>
                              )}
                              {f.sharingMode === 'KHUSUS' && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-500/20">
                                  <Users className="h-3 w-3" /> Khusus (Friends)
                                </span>
                              )}
                              {f.sharingMode === 'PRIVATE' && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                                  <Lock className="h-3 w-3" /> Private
                                </span>
                              )}

                              {f.isLocked && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                                  Terkunci
                                </span>
                              )}
                            </div>

                            {f.keterangan && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {f.keterangan}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                              <span><strong>{f.fields.length}</strong> Pertanyaan</span>
                              <span>•</span>
                              <span className="font-semibold text-primary">
                                <strong>{f.responseCount || 0}</strong> Respon Terkumpul
                              </span>
                              <span>•</span>
                              <span>Versi v{f.schemaVersion}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteForm(f.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer shrink-0"
                            title="Hapus Formulir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Action Buttons Bar */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(f);
                                setViewMode('ENTRY');
                              }}
                              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Isi Form</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(f);
                                setViewMode('RESPONSES');
                              }}
                              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                            >
                              <BarChart2 className="h-3.5 w-3.5 text-primary" />
                              <span>Rekap Respon ({f.responseCount || 0})</span>
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAccessForm(f);
                                setIsAccessModalOpen(true);
                              }}
                              className="h-8 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
                              title="Kelola Hak Akses & Publikasi Form"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Akses</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingForm(f);
                                setIsBuilderOpen(true);
                              }}
                              className="h-8 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
                              title="Ubah Rancangan Kolom Pertanyaan"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              <span>Desain</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE: ENTRY */}
            {viewMode === 'ENTRY' && selectedForm && (
              <NoteDynamicFormRenderer
                form={selectedForm}
                kdJudul={note.kdJudul}
                onSubmitted={() => {
                  fetchForms();
                  onUpdated?.();
                }}
                onCancel={() => {
                  setViewMode('LIST');
                  setSelectedForm(null);
                }}
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
              />
            )}

            {/* VIEW MODE: RESPONSES */}
            {viewMode === 'RESPONSES' && selectedForm && (
              <NoteDynamicFormTable
                form={selectedForm}
                kdJudul={note.kdJudul}
                apiBaseUrl={apiBaseUrl}
                authToken={authToken}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form Builder Modal */}
      <NoteDynamicFormBuilder
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingForm(null);
        }}
        kdJudul={note.kdJudul}
        editingForm={editingForm}
        onSaved={() => {
          fetchForms();
          onUpdated?.();
        }}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />

      {/* Form Access Modal */}
      <NoteFormAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => {
          setIsAccessModalOpen(false);
          setAccessForm(null);
        }}
        form={accessForm}
        kdJudul={note.kdJudul}
        onSaved={() => {
          fetchForms();
          onUpdated?.();
        }}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />
    </div>
  );
}
