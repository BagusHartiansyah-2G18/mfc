import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Textarea } from '@org/ui';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  RotateCcw,
  Globe,
  ArrowRight,
  ArrowLeft,
  Star,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { type DataForm, type FormFieldDefinition } from '../types';
import { authFetch } from '@org/auth';
import { SignatureCanvasPad } from './components/SignatureCanvasPad';
import { RepeaterTableField } from './components/RepeaterTableField';
import { FormFileUploadField } from './components/FormFileUploadField';

interface NoteDynamicFormRendererProps {
  form: DataForm;
  kdJudul?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
  apiBaseUrl?: string;
  authToken?: string;
  originHost?: string;
  isPublicMode?: boolean;
}

export function NoteDynamicFormRenderer({
  form,
  kdJudul = '1',
  onSubmitted,
  onCancel,
  apiBaseUrl = 'http://localhost:3002/api',
  authToken = 'dev-bypass-token-2026',
  originHost = 'noted:4203',
  isPublicMode = false,
}: NoteDynamicFormRendererProps) {
  // Guest fields jika mode publik
  const [responderName, setResponderName] = useState('');
  const [responderEmail, setResponderEmail] = useState('');

  // Values map { [fieldKey]: any }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Multi-Step Wizard State
  const isWizard =
    form.formLayoutMode === 'WIZARD' && Array.isArray(form.steps) && form.steps.length > 0;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = isWizard ? form.steps!.length : 1;

  // Local Storage Draft Key
  const draftKey = `noted_form_draft_${form.id}`;
  const [hasDraftNotice, setHasDraftNotice] = useState(false);



  // Check if Form is Expired or Quota Exceeded
  const isExpired = form.closeAt ? new Date(form.closeAt) < new Date() : false;
  const isQuotaFull =
    form.maxResponses && form.responseCount ? form.responseCount >= form.maxResponses : false;

  const isPublic = form.sharingMode === 'PUBLIC' || isPublicMode;

  // 1. Auto-Restore Draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setHasDraftNotice(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [draftKey]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.responderName) setResponderName(parsed.responderName);
        if (parsed.responderEmail) setResponderEmail(parsed.responderEmail);
      }
    } catch (e) {
      console.warn('Gagal memulihkan draft:', e);
    }
    setHasDraftNotice(false);
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }
    setHasDraftNotice(false);
  };

  // 2. Auto-Save Draft to LocalStorage on changes
  useEffect(() => {
    if (success) return;
    try {
      const draftPayload = {
        answers,
        responderName,
        responderEmail,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch {
      // Ignore storage quota
    }
  }, [answers, responderName, responderEmail, draftKey, success]);

  const handleFieldChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxToggle = (key: string, optionValue: string) => {
    const current = Array.isArray(answers[key]) ? answers[key] : [];
    if (current.includes(optionValue)) {
      handleFieldChange(
        key,
        current.filter((v: string) => v !== optionValue)
      );
    } else {
      handleFieldChange(key, [...current, optionValue]);
    }
  };

  // 3. Conditional Logic Evaluator
  const isFieldVisible = (field: FormFieldDefinition): boolean => {
    if (!field.conditional) return true;
    const { dependOnKey, operator, value, action } = field.conditional;
    const dependVal = answers[dependOnKey];

    let isMatch = false;
    switch (operator) {
      case 'equals':
        isMatch = dependVal === value;
        break;
      case 'not_equals':
        isMatch = dependVal !== value;
        break;
      case 'greater_than':
        isMatch = Number(dependVal) > Number(value);
        break;
      case 'contains':
        if (Array.isArray(dependVal)) {
          isMatch = dependVal.includes(value);
        } else {
          isMatch = String(dependVal || '').includes(String(value));
        }
        break;
      case 'is_filled':
        isMatch = dependVal !== undefined && dependVal !== null && dependVal !== '';
        break;
      default:
        isMatch = true;
    }

    return action === 'show' ? isMatch : !isMatch;
  };

  // 4. Per-Step Fields Filtering
  const activeStepFields = useMemo(() => {
    if (!isWizard) return form.fields;
    return form.fields.filter((f) => (f.wizardStep || 1) === currentStep);
  }, [isWizard, form.fields, currentStep]);

  // Validasi Step Berjalan sebelum lanjut
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1 && isPublic && !responderName.trim()) {
      setError('Nama Lengkap responden wajib diisi.');
      return false;
    }

    for (const field of activeStepFields) {
      if (!isFieldVisible(field) || field.type === 'section') continue;
      if (field.required) {
        const val = answers[field.key];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          setError(`Bidang "${field.label}" wajib diisi sebelum melanjutkan.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (form.isLocked || isExpired || isQuotaFull) {
      setError('Formulir saat ini ditutup dan tidak dapat menerima respon baru.');
      return;
    }

    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const isDirectPublicSlug = isPublicMode && form.shareSlug;
      const endpoint = isDirectPublicSlug
        ? `${apiBaseUrl}/public/forms/${form.shareSlug}/values`
        : `${apiBaseUrl}/notes/${kdJudul}/forms/${form.id}/values`;

      const payload = {
        responderName: responderName.trim() || undefined,
        responderEmail: responderEmail.trim() || undefined,
        originHost,
        answers,
      };

      const res = await authFetch(endpoint, {
        method: 'POST',
        skipAuth: Boolean(isDirectPublicSlug),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengirimkan respon formulir.');
      }

      setSuccess(true);
      handleClearDraft();
      if (onSubmitted) {
        setTimeout(onSubmitted, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat mengirim data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isExpired || isQuotaFull || form.isLocked) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
        <Clock className="h-10 w-10 text-amber-500 mx-auto" />
        <h4 className="text-base font-bold text-foreground">
          {form.isLocked
            ? 'Formulir Telah Dikunci'
            : isExpired
            ? 'Batas Waktu Pengisian Telah Berakhir'
            : 'Kuota Pengisian Telah Penuh'}
        </h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Formulir ini tidak lagi menerima respon baru. Silakan hubungi pemilik catatan untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4 animate-in fade-in">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-foreground">Respon Berhasil Terkirim!</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Terima kasih telah mengisi formulir <strong>&quot;{form.tujuan}&quot;</strong>. Data Anda telah
            terekam dalam penyimpanan terpusat Noted.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAnswers({});
              setSuccess(false);
              setCurrentStep(1);
            }}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kirim Respon Lain</span>
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onCancel}
              className="text-xs cursor-pointer"
            >
              Kembali ke Menu
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (currentStep === totalSteps) handleSubmit(); else handleNextStep(); }} className="space-y-6">
      {/* Draft Restore Alert */}
      {hasDraftNotice && (
        <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-indigo-900 dark:text-indigo-100 font-medium">
              Ditemukan draf isian sebelumnya yang belum terkirim.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleRestoreDraft}
              className="h-6 px-2.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Pulihkan Draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Abaikan
            </Button>
          </div>
        </div>
      )}

      {/* Multi-Step Wizard Stepper Header */}
      {isWizard && (
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <span>
                {form.steps![currentStep - 1]?.title || `Tahap ${currentStep}`}
              </span>
            </span>
            <span className="font-mono text-muted-foreground text-[11px]">
              Langkah {currentStep} dari {totalSteps} (
              {Math.round((currentStep / totalSteps) * 100)}%)
            </span>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {form.steps!.map((st) => (
              <span
                key={st.id}
                className={`truncate max-w-[120px] ${
                  st.id === currentStep ? 'font-bold text-primary' : ''
                }`}
              >
                {st.id}. {st.title.replace(/^Tahap \d+:? ?/, '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guest Identitas Section (Hanya di Step 1 jika Publik) */}
      {isPublic && currentStep === 1 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Globe className="h-4 w-4" />
            <h5 className="font-bold text-xs">Identitas Responden Publik (Bebas Login)</h5>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Anda dapat mengisi formulir ini tanpa akun. Harap masukkan nama dan email Anda untuk keperluan verifikasi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <User className="h-3 w-3 text-emerald-600" />
                <span>Nama Lengkap Anda</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <Input
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Mail className="h-3 w-3 text-emerald-600" />
                <span>Alamat Email</span>
              </label>
              <Input
                type="email"
                value={responderEmail}
                onChange={(e) => setResponderEmail(e.target.value)}
                placeholder="budi@instansi.go.id"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {activeStepFields.map((field) => {
          if (!isFieldVisible(field)) return null;

          const colSpan =
            field.layoutWidth === 'half'
              ? 'md:col-span-6'
              : field.layoutWidth === 'third'
              ? 'md:col-span-4'
              : 'md:col-span-12';

          return (
            <div key={field.key} className={colSpan}>
              {/* 1. Tipe Section Heading */}
              {field.type === 'section' ? (
                <div className="pt-3 pb-1 border-b border-border/80">
                  <h4 className="font-bold text-sm text-foreground">{field.label}</h4>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'signature' ? (
                /* 2. Tipe Digital Signature Pad */
                <SignatureCanvasPad
                  label={field.label}
                  helperText={field.helperText}
                  required={field.required}
                  value={answers[field.key]}
                  onChange={(val) => handleFieldChange(field.key, val)}
                />
              ) : field.type === 'repeater' ? (
                /* 3. Tipe Sub-Tabel Berulang (Repeater) */
                <RepeaterTableField
                  label={field.label}
                  helperText={field.helperText}
                  required={field.required}
                  columns={field.repeaterColumns}
                  value={answers[field.key]}
                  onChange={(rows) => handleFieldChange(field.key, rows)}
                />
              ) : field.type === 'rating' ? (
                /* 4. Tipe Star Rating (1-5 Bintang) */
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </span>
                    {answers[field.key] && (
                      <span className="text-[11px] font-bold text-amber-500">
                        {answers[field.key]} dari 5 Bintang
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (answers[field.key] || 0) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleFieldChange(field.key, star)}
                          className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              isActive
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-muted-foreground hover:text-amber-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'currency' ? (
                /* 5. Tipe Currency Rupiah Input Mask */
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={
                        answers[field.key] !== undefined && answers[field.key] !== null
                          ? Number(
                              String(answers[field.key]).replace(/\D/g, '')
                            ).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => {
                        const cleanNum = Number(e.target.value.replace(/\D/g, ''));
                        handleFieldChange(field.key, cleanNum || 0);
                      }}
                      placeholder="0"
                      className="h-9 w-full pl-9 pr-3 text-xs rounded-lg border border-border bg-background font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                /* 6. Textarea Paragraf */
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <Textarea
                    value={answers[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="min-h-[80px] text-xs bg-background"
                  />
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'select' ? (
                /* 7. Dropdown Select */
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={answers[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="h-9 w-full px-3 text-xs rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">-- Pilih salah satu --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'radio' ? (
                /* 8. Radio Button Group */
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="space-y-1.5 pt-0.5">
                    {field.options?.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={field.key}
                          value={opt}
                          checked={answers[field.key] === opt}
                          onChange={() => handleFieldChange(field.key, opt)}
                          className="accent-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'checkbox' ? (
                /* 9. Checkbox Multi-Selection */
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="space-y-1.5 pt-0.5">
                    {field.options?.map((opt) => {
                      const checked = (answers[field.key] || []).includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxToggle(field.key, opt)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              ) : field.type === 'file' ? (
                /* 10. Lampiran Berkas (unggah terpisah, simpan URL) */
                <FormFileUploadField
                  label={field.label}
                  helperText={field.helperText}
                  required={field.required}
                  value={answers[field.key]}
                  onChange={(val) => handleFieldChange(field.key, val)}
                  uploadEndpoint={
                    isPublicMode && form.shareSlug
                      ? `${apiBaseUrl}/public/forms/${form.shareSlug}/upload`
                      : `${apiBaseUrl}/notes/${kdJudul}/forms/${form.id}/upload`
                  }
                  skipAuth={Boolean(isPublicMode && form.shareSlug)}
                />
              ) : (
                /* 11. Default Text / Number / Date / Range / Color */
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <Input
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                        ? 'date'
                        : field.type === 'range'
                        ? 'range'
                        : field.type === 'color'
                        ? 'color'
                        : 'text'
                    }
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={answers[field.key] || ''}
                    onChange={(e) =>
                      handleFieldChange(
                        field.key,
                        field.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                    placeholder={field.placeholder || ''}
                    className="h-9 text-xs bg-background"
                  />
                  {field.helperText && (
                    <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons: Stepper Previous/Next or Final Submit */}
      <div className="pt-4 border-t border-border/80 flex items-center justify-between flex-wrap gap-2">
        <div>
          {isWizard && currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevStep}
              className="text-xs gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sebelumnya</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs cursor-pointer"
            >
              Batal
            </Button>
          )}

          {isWizard && currentStep < totalSteps ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleNextStep}
              className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <span>Lanjutkan ke Tahap {currentStep + 1}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Mengirim Data...' : 'Kirim Formulir Sekarang'}</span>
            </Button>
          )}
        </div>
      </div>

    </form>
  );
}
