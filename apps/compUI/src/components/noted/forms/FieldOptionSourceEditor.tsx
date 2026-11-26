import { useState } from 'react';
import { AlertCircle, CheckCircle2, Database, KeyRound, List, Loader2, Play } from 'lucide-react';
import { Button, Checkbox, Input, Textarea } from '@org/ui';
import type { FormFieldDefinition, FormFieldOptionSource, OptionsSourceMode } from '../types';
import { fetchOptionsFromApi, resolveOptionLabel, resolveOptionValue } from './optionSourceUtils';

interface FieldOptionSourceEditorProps {
  field: FormFieldDefinition;
  onUpdate: (patch: Partial<FormFieldDefinition>) => void;
}

const SAMPLE_JSON_ARRAY = `[
  { "kode": "GDG-01", "nama": "Gudang Utama", "kota": "Jakarta" },
  { "kode": "GDG-02", "nama": "Gudang Cabang", "kota": "Surabaya" }
]`;

export function FieldOptionSourceEditor({ field, onUpdate }: FieldOptionSourceEditorProps) {
  const source: FormFieldOptionSource = field.optionSource || { mode: 'STATIC_LIST' };
  const mode: OptionsSourceMode = source.mode || 'STATIC_LIST';

  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiPreview, setApiPreview] = useState<{
    count: number;
    keys: string[];
    sample?: Record<string, any>;
    error?: string;
  } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateSource = (patch: Partial<FormFieldOptionSource>) => {
    onUpdate({
      optionSource: {
        ...source,
        ...patch,
      },
    });
  };

  const handleModeChange = (nextMode: OptionsSourceMode) => {
    if (nextMode === 'STATIC_LIST') {
      updateSource({ mode: 'STATIC_LIST' });
      return;
    }
    if (nextMode === 'API_GET') {
      updateSource({
        mode: 'API_GET',
        saveFullObject: source.saveFullObject ?? true,
      });
      return;
    }
    const raw = source.jsonRaw || (source.jsonItems ? JSON.stringify(source.jsonItems, null, 2) : SAMPLE_JSON_ARRAY);
    let parsedItems = source.jsonItems;
    if (!parsedItems) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsedItems = parsed;
      } catch {
        // ignore
      }
    }
    updateSource({
      mode: 'JSON_ARRAY',
      jsonRaw: raw,
      jsonItems: parsedItems,
      valueKey: source.valueKey || 'kode',
      labelKey: source.labelKey || 'nama',
      saveFullObject: source.saveFullObject ?? true,
    });
  };

  const handleTestApi = async () => {
    if (!source.apiUrl?.trim()) {
      setApiPreview({ count: 0, keys: [], error: 'URL Endpoint API wajib diisi terlebih dahulu.' });
      return;
    }
    try {
      setIsTestingApi(true);
      setApiPreview(null);
      const items = await fetchOptionsFromApi(source);
      const first = items[0];
      const keys = first && typeof first === 'object' ? Object.keys(first) : [];
      setApiPreview({
        count: items.length,
        keys,
        sample: first,
      });
      if (keys.length > 0 && (!source.valueKey || !source.labelKey)) {
        updateSource({
          valueKey: source.valueKey || (keys.includes('id') ? 'id' : keys[0]),
          labelKey: source.labelKey || (keys.find((k) => /nama|name|label|title|tujuan/i.test(k)) || keys[Math.min(1, keys.length - 1)]),
        });
      }
    } catch (err: any) {
      setApiPreview({
        count: 0,
        keys: [],
        error: err.message || 'Gagal mengambil data dari API.',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleJsonChange = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        setJsonError('Format harus berupa JSON Array ([{...}, {...}]).');
        updateSource({ jsonRaw: rawText });
        return;
      }
      const objectsOnly = parsed.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
      if (parsed.length > 0 && objectsOnly.length === 0) {
        setJsonError('Setiap elemen array harus berupa object ({ "key": "..." }).');
        updateSource({ jsonRaw: rawText });
        return;
      }
      setJsonError(null);
      updateSource({ jsonRaw: rawText, jsonItems: objectsOnly });
    } catch {
      setJsonError('JSON belum valid. Periksa tanda kutip dan koma.');
      updateSource({ jsonRaw: rawText });
    }
  };

  const detectedJsonKeys =
    source.jsonItems && source.jsonItems[0] && typeof source.jsonItems[0] === 'object'
      ? Object.keys(source.jsonItems[0])
      : [];

  return (
    <div className="space-y-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Sumber Data Pilihan ({field.type})
        </span>
        <div className="inline-flex rounded-lg border border-border bg-background p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => handleModeChange('STATIC_LIST')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              mode === 'STATIC_LIST' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-3 w-3" /> Manual (a,b,c)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('API_GET')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              mode === 'API_GET' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="h-3 w-3" /> API GET + Key
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('JSON_ARRAY')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              mode === 'JSON_ARRAY' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Database className="h-3 w-3" /> Array Object
          </button>
        </div>
      </div>

      {mode === 'STATIC_LIST' && (
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">
            Pilihan Opsi (Pisahkan dengan koma):
          </label>
          <Input
            value={field.options?.join(', ') || ''}
            onChange={(e) =>
              onUpdate({
                options: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Contoh: A, B, C"
            className="h-7 text-xs bg-background"
          />
        </div>
      )}

      {mode === 'API_GET' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                URL Endpoint GET <span className="text-rose-500">*</span>
              </label>
              <Input
                value={source.apiUrl || ''}
                onChange={(e) => updateSource({ apiUrl: e.target.value })}
                placeholder="http://localhost:3002/api/notes/.../data"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Header X-API-Key (Opsional)
              </label>
              <Input
                value={source.apiKey || ''}
                onChange={(e) => updateSource({ apiKey: e.target.value })}
                placeholder="mfc_live_..."
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Kolom Key (Value)
              </label>
              <Input
                value={source.valueKey || ''}
                onChange={(e) => updateSource({ valueKey: e.target.value })}
                placeholder="Misal: id"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Kolom Label (Tampil)
              </label>
              <Input
                value={source.labelKey || ''}
                onChange={(e) => updateSource({ labelKey: e.target.value })}
                placeholder="Misal: nama_syech"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Path Array JSON (Opsional)
              </label>
              <Input
                value={source.dataPath || ''}
                onChange={(e) => updateSource({ dataPath: e.target.value })}
                placeholder="Auto (rows / data)"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-[11px] cursor-pointer">
              <Checkbox
                checked={source.saveFullObject !== false}
                onCheckedChange={(checked) => updateSource({ saveFullObject: Boolean(checked) })}
              />
              <span>Simpan seluruh object terpilih sebagai value</span>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTestingApi}
              onClick={handleTestApi}
              className="h-7 text-[11px] gap-1"
            >
              {isTestingApi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Uji &amp; Preview API
            </Button>
          </div>

          {apiPreview && (
            <div
              className={`p-2 rounded-md border text-[11px] space-y-1 ${
                apiPreview.error
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {apiPreview.error ? (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{apiPreview.error}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Berhasil! Ditemukan {apiPreview.count} data.</span>
                  </div>
                  {apiPreview.keys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] opacity-80">Kolom tersedia:</span>
                      {apiPreview.keys.map((k) => (
                        <code
                          key={k}
                          className="px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-[10px] font-mono"
                        >
                          {k}
                        </code>
                      ))}
                    </div>
                  )}
                  {apiPreview.sample && (
                    <div className="text-[10px] opacity-90">
                      Contoh tampilan: <strong>{resolveOptionLabel(apiPreview.sample, source.labelKey, source.valueKey)}</strong>{' '}
                      (key: <code>{resolveOptionValue(apiPreview.sample, source.valueKey)}</code>)
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'JSON_ARRAY' && (
        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              Data Array Object (JSON)
            </label>
            <Textarea
              rows={4}
              value={source.jsonRaw ?? JSON.stringify(source.jsonItems || [], null, 2)}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder={SAMPLE_JSON_ARRAY}
              className="font-mono text-[11px] bg-background"
            />
            {jsonError && (
              <p className="text-[10px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" /> {jsonError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Kolom Key (Value)
              </label>
              <Input
                value={source.valueKey || ''}
                onChange={(e) => updateSource({ valueKey: e.target.value })}
                placeholder="Misal: kode"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Kolom Label (Tampil)
              </label>
              <Input
                value={source.labelKey || ''}
                onChange={(e) => updateSource({ labelKey: e.target.value })}
                placeholder="Misal: nama"
                className="h-7 text-xs bg-background font-mono"
              />
            </div>
          </div>

          {detectedJsonKeys.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
              <span>Key terdeteksi:</span>
              {detectedJsonKeys.map((k) => (
                <code key={k} className="px-1.5 py-0.5 rounded bg-background border border-border/60 font-mono text-foreground">
                  {k}
                </code>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-[11px] cursor-pointer">
            <Checkbox
              checked={source.saveFullObject !== false}
              onCheckedChange={(checked) => updateSource({ saveFullObject: Boolean(checked) })}
            />
            <span>Simpan seluruh object terpilih sebagai value</span>
          </label>
        </div>
      )}
    </div>
  );
}
