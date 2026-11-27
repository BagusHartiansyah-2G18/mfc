import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  RotateCcw,
  FileQuestion,
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button, Input, Textarea, Skeleton, Card } from '@org/ui';
import { type DataForm, type FormFieldDefinition } from '../types';
import { SignatureCanvasPad } from './components/SignatureCanvasPad';
import { FormFileUploadField } from './components/FormFileUploadField';
import { RepeaterTableField } from './components/RepeaterTableField';

interface StandaloneQuestionnairePageProps {
  shareSlug?: string;
  apiBaseUrl?: string;
}

export function StandaloneQuestionnairePage({
  shareSlug: propSlug,
  apiBaseUrl = 'http://localhost:3002/api',
}: StandaloneQuestionnairePageProps) {
  // 1. Ekstraksi slug dari props, pathname (/p/:slug, /survey/:slug, /formPublic/:slug), atau search params
  const getSlugFromLocation = (): string => {
    if (propSlug) return propSlug;
    const path = window.location.pathname;

    const pMatch = path.match(/\/p\/([a-zA-Z0-9_-]+)/);
    if (pMatch && pMatch[1]) return pMatch[1];

    const surveyMatch = path.match(/\/survey\/([a-zA-Z0-9_-]+)/);
    if (surveyMatch && surveyMatch[1]) return surveyMatch[1];

    const formPublicMatch = path.match(/\/formPublic\/([a-zA-Z0-9_-]+)/);
    if (formPublicMatch && formPublicMatch[1]) return formPublicMatch[1];

    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || params.get('shareSlug') || '';
  };

  const activeSlug = getSlugFromLocation();

  // State Form & Schema
  const [form, setForm] = useState<DataForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Respondent Identity State
  const [responderName, setResponderName] = useState('');
  const [responderEmail, setResponderEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [hpTrap, setHpTrap] = useState(''); // Anti-bot honeypot

  // Multi-Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<{
    receiptCode: string;
    submittedAt: string;
  } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Draft Auto-Recovery State
  const draftStorageKey = `mfc_survey_draft_${activeSlug}`;
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

  // Fetch Public Form Definition
  const fetchForm = useCallback(async () => {
    if (!activeSlug) {
      setLoadError('Tautan kuisioner tidak valid atau kode formulir tidak ditemukan.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await fetch(`${apiBaseUrl}/public/forms/${encodeURIComponent(activeSlug)}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(
          json.message || 'Kuisioner tidak ditemukan, sudah dikunci, atau tautan telah kadaluarsa.'
        );
      }

      setForm(json.data);
    } catch (err: any) {
      console.error('[StandaloneQuestionnaire] Fetch error:', err);
      setLoadError(err.message || 'Gagal memuat formulir kuisioner publik.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, apiBaseUrl]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Draft Auto-Restore on Mount
  useEffect(() => {
    if (!activeSlug) return;
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.responderName || (parsed.answers && Object.keys(parsed.answers).length > 0))) {
          if (parsed.responderName) setResponderName(parsed.responderName);
          if (parsed.responderEmail) setResponderEmail(parsed.responderEmail);
          if (parsed.answers) setAnswers(parsed.answers);
          setDraftRestoredNotice(true);
        }
      }
    } catch {
      // Abaikan kesalahan storage
    }
  }, [activeSlug, draftStorageKey]);

  // Draft Auto-Save to LocalStorage
  useEffect(() => {
    if (isSubmitted || !activeSlug) return;
    try {
      const hasContent =
        responderName.trim() !== '' ||
        responderEmail.trim() !== '' ||
        Object.keys(answers).length > 0;

      if (hasContent) {
        const payload = {
          responderName,
          responderEmail,
          answers,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      }
    } catch {
      // Abaikan kuota localstorage
    }
  }, [answers, responderName, responderEmail, activeSlug, draftStorageKey, isSubmitted]);

  // Bersihkan draft saat reset
  const handleClearDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // Abaikan
    }
    setAnswers({});
    setResponderName('');
    setResponderEmail('');
    setDraftRestoredNotice(false);
    setCurrentStep(1);
  };

  // Helper perubahan field
  const handleAnswerChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxToggle = (key: string, optionValue: string) => {
    const current = Array.isArray(answers[key]) ? answers[key] : [];
    if (current.includes(optionValue)) {
      handleAnswerChange(
        key,
        current.filter((v: string) => v !== optionValue)
      );
    } else {
      handleAnswerChange(key, [...current, optionValue]);
    }
  };

  // Conditional Logic Evaluator
  const isFieldVisible = (field: FormFieldDefinition): boolean => {
    if (!field.conditional) return true;
    const { dependOnKey, operator, value, action } = field.conditional;
    const dependVal = answers[dependOnKey];

    const op = String(operator).toUpperCase();
    let isMatch = false;
    switch (op) {
      case 'EQUALS':
        isMatch = String(dependVal) === String(value);
        break;
      case 'NOT_EQUALS':
        isMatch = String(dependVal) !== String(value);
        break;
      case 'CONTAINS':
        isMatch = Array.isArray(dependVal)
          ? dependVal.includes(value)
          : String(dependVal || '').includes(String(value));
        break;
      case 'GREATER_THAN':
        isMatch = Number(dependVal) > Number(value);
        break;
      case 'LESS_THAN':
        isMatch = Number(dependVal) < Number(value);
        break;
      default:
        isMatch = false;
    }

    return String(action).toUpperCase() === 'SHOW' ? isMatch : !isMatch;
  };

  // Multi-Step / Wizard Calculations
  const isWizard =
    form?.formLayoutMode === 'WIZARD' && Array.isArray(form?.steps) && form.steps.length > 0;
  const totalSteps = isWizard ? form.steps!.length : 1;
  const activeStepConfig = isWizard ? form.steps![currentStep - 1] : null;

  // Filter bidang yang aktif pada langkah saat ini (Mendukung step.fieldKeys, field.stepId, atau alokasi proporsional)
  const visibleFields = useMemo(() => {
    if (!form || !Array.isArray(form.fields)) return [];
    const fieldsToConsider = isWizard && activeStepConfig
      ? form.fields.filter((f: any) => {
          if (Array.isArray(activeStepConfig.fieldKeys) && activeStepConfig.fieldKeys.length > 0) {
            const fKey = f.key || f.id;
            return activeStepConfig.fieldKeys.includes(fKey);
          }
          if (f.stepId) {
            return f.stepId === activeStepConfig.id;
          }
          // Alokasi proporsional otomatis jika metadata step tidak eksplisit
          const stepIndex = currentStep - 1;
          const fieldsPerStep = Math.ceil(form.fields.length / totalSteps);
          const startIndex = stepIndex * fieldsPerStep;
          const endIndex = startIndex + fieldsPerStep;
          const fIndex = form.fields.indexOf(f);
          return fIndex >= startIndex && fIndex < endIndex;
        })
      : form.fields;

    return fieldsToConsider.filter(isFieldVisible);
  }, [form, isWizard, activeStepConfig, currentStep, totalSteps, answers]);

  // Validasi langkah saat ini
  const validateCurrentStep = (): boolean => {
    setSubmitError(null);

    // Langkah 1 wajib mengisi identitas responden
    if (currentStep === 1 && !responderName.trim()) {
      setSubmitError('Nama Lengkap Responden wajib diisi.');
      return false;
    }

    // Validasi field wajib
    for (const field of visibleFields) {
      if (field.required) {
        const fieldKey = field.key || (field as any).id;
        const val = answers[fieldKey];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          setSubmitError(`Pertanyaan "${field.label}" wajib diisi sebelum melanjutkan.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form) return;

    if (form.isLocked || form.isExpired || form.isQuotaFull) {
      setSubmitError('Kuisioner ini sudah ditutup dan tidak dapat menerima respon baru.');
      return;
    }

    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const endpoint = `${apiBaseUrl}/public/forms/${activeSlug}/values`;
      const payload = {
        responderName: responderName.trim(),
        responderEmail: responderEmail.trim() || undefined,
        originHost: window.location.host,
        answers: {
          ...answers,
          _hp_check: hpTrap || undefined, // Honeypot field
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengirimkan tanggapan formulir.');
      }

      // Berhasil diserahkan
      setIsSubmitted(true);
      const assignedReceipt =
        json.receiptCode || `#REG-RESP-${Date.now().toString(36).toUpperCase()}`;
      setReceiptInfo({
        receiptCode: assignedReceipt,
        submittedAt: json.submittedAt || new Date().toISOString(),
      });

      // Bersihkan draft lokal secara permanen setelah berhasil kirim
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        // Abaikan
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[StandaloneQuestionnaire] Submit error:', err);
      setSubmitError(err.message || 'Terjadi gangguan koneksi saat mengirimkan respon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReceiptCode = () => {
    if (!receiptInfo?.receiptCode) return;
    navigator.clipboard.writeText(receiptInfo.receiptCode);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // =========================================================================
  // RENDER: Loading Skeleton
  // =========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-foreground flex flex-col justify-center items-center p-4">
        <div className="max-w-xl w-full space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Error / Not Found Screen
  // =========================================================================
  if (loadError || !form) {
    return (
      <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-foreground flex flex-col justify-center items-center p-4 font-sans">
        <Card className="max-w-md w-full border-rose-500/20 bg-card shadow-lg rounded-3xl overflow-hidden text-center p-8 space-y-4">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <FileQuestion className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Kuisioner Tidak Tersedia</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {loadError || 'Formulir survei tidak ditemukan, telah dikunci, atau tautan tidak valid.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchForm}
              className="gap-2 text-xs rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Coba Muat Ulang</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Form Locked / Expired / Quota Full Screen
  // =========================================================================
  if (form.isLocked || form.isExpired || form.isQuotaFull) {
    return (
      <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-foreground flex flex-col justify-center items-center p-4 font-sans">
        <Card className="max-w-md w-full border-amber-500/30 bg-card shadow-lg rounded-3xl overflow-hidden text-center p-8 space-y-4">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">
              {form.isLocked
                ? 'Kuisioner Telah Dikunci'
                : form.isExpired
                ? 'Batas Waktu Pengisian Berakhir'
                : 'Kuota Tanggapan Telah Penuh'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Formulir <strong>&quot;{form.tujuan}&quot;</strong> saat ini tidak lagi menerima tanggapan baru. Terima kasih atas minat dan perhatian Anda.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Submission Success Screen (Thank You Page)
  // =========================================================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-foreground flex flex-col justify-center items-center p-4 font-sans print:p-0 print:bg-white">
        <div className="max-w-xl w-full space-y-6">
          <Card className="border border-emerald-500/30 bg-card shadow-xl rounded-3xl overflow-hidden p-8 sm:p-10 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 animate-in zoom-in-75">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Tanggapan Anda Berhasil Dikirim!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Terima kasih atas partisipasi Anda dalam melengkapi formulir <strong>&quot;{form.tujuan}&quot;</strong>. Tanggapan Anda telah tercatat dengan aman.
              </p>
            </div>

            {/* Official Receipt Box */}
            {receiptInfo && (
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-5 text-left space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Bukti Tanda Terima Resmi
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Terverifikasi
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Nomor Registrasi Respon:</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base sm:text-lg font-mono font-bold text-primary tracking-wide">
                      {receiptInfo.receiptCode}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyReceiptCode}
                      className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer rounded-xl"
                    >
                      {copiedReceipt ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Responden:</span>
                    <div className="font-semibold text-foreground truncate">{responderName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waktu Penyerahan:</span>
                    <div className="font-semibold text-foreground">
                      {new Date(receiptInfo.submittedAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="w-full sm:w-auto text-xs gap-2 rounded-xl cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Simpan PDF</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setAnswers({});
                  setResponderName('');
                  setResponderEmail('');
                  setIsSubmitted(false);
                  setReceiptInfo(null);
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto text-xs gap-2 rounded-xl cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Kirim Tanggapan Lain</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Pure Questionnaire Form Runner (Google Forms / Typeform Style)
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-foreground flex flex-col font-sans transition-colors">
      {/* Top Brand Accent Line */}
      <div className="h-2.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 sticky top-0 z-40" />

      {/* Main Questionnaire Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Form Title & Introduction Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Kuisioner Terdistribusi</span>
            </span>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>Est. 2-3 Menit</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Enkripsi Aman</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 border-b border-border/60 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              {form.tujuan}
            </h1>
            {form.keterangan && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {form.keterangan}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="text-rose-500 font-semibold flex items-center gap-1">
              * Menandakan pertanyaan yang wajib diisi
            </span>

            {draftRestoredNotice && (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Draf dipulihkan otomatis
              </span>
            )}
          </div>
        </div>

        {/* Wizard Progress Tracker (if Wizard Mode) */}
        {isWizard && form.steps && (
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">
                Langkah {currentStep} dari {totalSteps}:{' '}
                <span className="text-primary font-bold">
                  {form.steps[currentStep - 1]?.title || `Tahap ${currentStep}`}
                </span>
              </span>
              <span className="text-muted-foreground font-mono">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Element */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot Spam Trap (Invisible to real users) */}
          <input
            type="text"
            name="_hp_check"
            value={hpTrap}
            onChange={(e) => setHpTrap(e.target.value)}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Respondent Identity Card (Shown on Step 1) */}
          {currentStep === 1 && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Identitas Responden</h3>
                  <span className="text-rose-500 font-bold">*</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Informasi identitas digunakan untuk memverifikasi keabsahan data pengisian kuisioner.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Nama Lengkap Responden</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Masukkan nama lengkap Anda..."
                      value={responderName}
                      onChange={(e) => setResponderName(e.target.value)}
                      required
                      className="rounded-xl pl-9 text-xs"
                    />
                    <User className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Alamat Email (Opsional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="contoh: email@instansi.com"
                      value={responderEmail}
                      onChange={(e) => setResponderEmail(e.target.value)}
                      className="rounded-xl pl-9 text-xs"
                    />
                    <Mail className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Cards */}
          <div className="space-y-5">
            {visibleFields.map((field, idx) => {
              const questionNumber = idx + 1;
              const fieldKey = field.key || (field as any).id;
              const val = answers[fieldKey];

              return (
                <div
                  key={fieldKey}
                  className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                >
                  {/* Question Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <span className="h-6 px-2 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {questionNumber}
                      </span>
                      <div className="flex-1">
                        <label className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                        </label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Controls */}
                  <div className="pt-2">
                    {/* 1. TEXT */}
                    {field.type === 'text' && (
                      <Input
                        type="text"
                        placeholder={field.placeholder || 'Jawaban Anda...'}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                        className="rounded-xl text-xs sm:text-sm"
                      />
                    )}

                    {/* 2. TEXTAREA */}
                    {field.type === 'textarea' && (
                      <Textarea
                        rows={4}
                        placeholder={field.placeholder || 'Tuliskan rincian jawaban Anda di sini...'}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                        className="rounded-xl text-xs sm:text-sm resize-y"
                      />
                    )}

                    {/* 3. NUMBER */}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={field.placeholder || '0'}
                        value={val !== undefined ? val : ''}
                        onChange={(e) =>
                          handleAnswerChange(
                            fieldKey,
                            e.target.value !== '' ? Number(e.target.value) : ''
                          )
                        }
                        className="rounded-xl text-xs sm:text-sm"
                      />
                    )}

                    {/* 4. CURRENCY (RUPIAH) */}
                    {field.type === 'currency' && (
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="text"
                          placeholder="0"
                          value={
                            val !== undefined && val !== null && val !== ''
                              ? Number(val).toLocaleString('id-ID')
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            handleAnswerChange(fieldKey, raw ? Number(raw) : '');
                          }}
                          className="rounded-xl pl-10 text-xs sm:text-sm font-mono font-medium"
                        />
                      </div>
                    )}

                    {/* 5. DATE */}
                    {field.type === 'date' && (
                      <div className="relative max-w-xs">
                        <Input
                          type="date"
                          value={val || ''}
                          onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    {/* 6. TIME */}
                    {field.type === 'time' && (
                      <div className="relative max-w-xs">
                        <Input
                          type="time"
                          value={val || ''}
                          onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                          className="rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    )}

                    {/* 7. SELECT / DROPDOWN */}
                    {field.type === 'select' && (
                      <select
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(fieldKey, e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
                      >
                        <option value="">-- Pilih salah satu opsi --</option>
                        {(field.options || []).map((opt: any, optIdx: number) => {
                          const optValue = typeof opt === 'string' ? opt : opt.value;
                          const optLabel = typeof opt === 'string' ? opt.replace(/_/g, ' ') : opt.label;
                          return (
                            <option key={optValue || optIdx} value={optValue}>
                              {optLabel}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* 8. RADIO / SINGLE CHOICE (SLEEK OPTION PILL CARDS) */}
                    {field.type === 'radio' && (
                      <div className="space-y-2">
                        {(field.options || []).map((opt: any, optIdx: number) => {
                          const optValue = typeof opt === 'string' ? opt : opt.value;
                          const optLabel = typeof opt === 'string' ? opt.replace(/_/g, ' ') : opt.label;
                          const isSelected = val === optValue;
                          return (
                            <label
                              key={optValue || optIdx}
                              onClick={() => handleAnswerChange(fieldKey, optValue)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-2xs'
                                  : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/60'
                                }`}
                              >
                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs sm:text-sm font-medium">{optLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 9. CHECKBOX / MULTIPLE CHOICE */}
                    {field.type === 'checkbox' && (
                      <div className="space-y-2">
                        {(field.options || []).map((opt: any, optIdx: number) => {
                          const optValue = typeof opt === 'string' ? opt : opt.value;
                          const optLabel = typeof opt === 'string' ? opt.replace(/_/g, ' ') : opt.label;
                          const isChecked = Array.isArray(val) && val.includes(optValue);
                          return (
                            <label
                              key={optValue || optIdx}
                              onClick={() => handleCheckboxToggle(fieldKey, optValue)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                isChecked
                                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-2xs'
                                  : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/60'
                                }`}
                              >
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <span className="text-xs sm:text-sm font-medium">{optLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 10. RATING (INTERACTIVE 5-STAR SCALE) */}
                    {field.type === 'rating' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled = typeof val === 'number' && val >= starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => handleAnswerChange(fieldKey, starVal)}
                                className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                              >
                                <Star
                                  className={`h-7 w-7 transition-colors ${
                                    isFilled
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-muted-foreground/30 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        {val && (
                          <div className="text-xs font-semibold text-primary">
                            Nilai: {val} dari 5 (
                            {val === 1
                              ? 'Sangat Buruk / Tidak Puas'
                              : val === 2
                              ? 'Kurang Memuaskan'
                              : val === 3
                              ? 'Cukup / Standar'
                              : val === 4
                              ? 'Baik & Memuaskan'
                              : 'Sangat Baik & Sempurna'}
                            )
                          </div>
                        )}
                      </div>
                    )}

                    {/* 11. SIGNATURE CANVAS PAD */}
                    {field.type === 'signature' && (
                      <SignatureCanvasPad
                        value={val}
                        onChange={(dataUrl) => handleAnswerChange(fieldKey, dataUrl)}
                        required={field.required}
                        label="Bubuhkan Tanda Tangan Anda"
                        helperText="Sentuh layar atau gunakan tetikus pada kotak di bawah untuk menandatangani."
                      />
                    )}

                    {/* 12. REPEATER / TABULAR SUB-FORM */}
                    {field.type === 'repeater' && (
                      <RepeaterTableField
                        columns={field.repeaterColumns || field.columns}
                        value={Array.isArray(val) ? val : []}
                        onChange={(rows) => handleAnswerChange(fieldKey, rows)}
                        label={field.label}
                        helperText={field.description}
                        uploadEndpoint={`${apiBaseUrl}/public/forms/${encodeURIComponent(
                          activeSlug
                        )}/upload`}
                        skipAuth
                      />
                    )}

                    {/* 13. FILE / LAMPIRAN BERKAS */}
                    {field.type === 'file' && (
                      <FormFileUploadField
                        label={field.label}
                        helperText={field.description}
                        required={field.required}
                        value={val}
                        onChange={(value) => handleAnswerChange(fieldKey, value)}
                        uploadEndpoint={`${apiBaseUrl}/public/forms/${encodeURIComponent(
                          activeSlug
                        )}/upload`}
                        skipAuth
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Error Banner */}
          {submitError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Bottom Actions & Stepper */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
            {isWizard ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  className="rounded-2xl text-xs gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Sebelumnya</span>
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={handleNextStep}
                    className="rounded-2xl text-xs gap-1.5 cursor-pointer ml-auto"
                  >
                    <span>Lanjut ke Langkah Berikutnya</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    disabled={isSubmitting}
                    className="rounded-2xl text-xs gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer ml-auto shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        <span>Mengirimkan Respon...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Kirim Tanggapan (Submit)</span>
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDraft}
                  className="text-xs text-muted-foreground hover:text-rose-600 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  <span>Bersihkan Isian</span>
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="default"
                  disabled={isSubmitting}
                  className="rounded-2xl text-xs sm:text-sm px-8 gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      <span>Mengirimkan Respon...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kirim Tanggapan (Submit)</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </form>
      </main>

      {/* Standalone Minimalist Footer */}
      <footer className="w-full border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-muted/10 print:hidden">
        <p className="text-[11px] text-muted-foreground/80">
          Formulir Terdistribusi &bull; Jawaban Anda dikirim secara langsung ke pusat pengumpulan data tanpa perantara.
        </p>
      </footer>
    </div>
  );
}

export default StandaloneQuestionnairePage;
