import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Checkbox, Combobox, RadioGroup, RadioGroupItem } from '@org/ui';
import type { FormFieldDefinition } from '../types';
import { fetchOptionsFromApi, resolveOptionLabel, resolveOptionValue } from './optionSourceUtils';

interface DynamicOptionFieldProps {
  field: FormFieldDefinition;
  value: any;
  onChange: (val: any) => void;
}

interface NormalizedOption {
  key: string;
  label: string;
  raw: any;
}

export function DynamicOptionField({ field, value, onChange }: DynamicOptionFieldProps) {
  const source = field.optionSource;
  const mode = source?.mode || 'STATIC_LIST';
  const saveFullObject = mode !== 'STATIC_LIST' && source?.saveFullObject !== false;

  const [apiItems, setApiItems] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadApiOptions = useCallback(
    async (signal?: AbortSignal) => {
      if (mode !== 'API_GET' || !source?.apiUrl?.trim()) return;
      try {
        setIsLoading(true);
        setLoadError(null);
        const items = await fetchOptionsFromApi(source, signal);
        setApiItems(items);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setLoadError(err.message || 'Gagal memuat pilihan dari API.');
        setApiItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, source]
  );

  useEffect(() => {
    if (mode !== 'API_GET') return;
    const controller = new AbortController();
    loadApiOptions(controller.signal);
    return () => controller.abort();
  }, [mode, loadApiOptions]);

  const normalizedOptions = useMemo<NormalizedOption[]>(() => {
    if (mode === 'STATIC_LIST') {
      return (field.options || []).map((opt) => ({
        key: opt,
        label: opt,
        raw: opt,
      }));
    }

    let rawItems: Record<string, any>[] = [];
    if (mode === 'API_GET') {
      rawItems = apiItems;
    } else if (mode === 'JSON_ARRAY') {
      if (Array.isArray(source?.jsonItems)) {
        rawItems = source.jsonItems;
      } else if (source?.jsonRaw) {
        try {
          const parsed = JSON.parse(source.jsonRaw);
          if (Array.isArray(parsed)) rawItems = parsed;
        } catch {
          rawItems = [];
        }
      }
    }

    return rawItems.map((item, idx) => ({
      key: resolveOptionValue(item, source?.valueKey, idx),
      label: resolveOptionLabel(item, source?.labelKey, source?.valueKey),
      raw: item,
    }));
  }, [mode, field.options, apiItems, source?.jsonItems, source?.jsonRaw, source?.valueKey, source?.labelKey]);

  const getSelectedKey = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'object' && !Array.isArray(val)) {
      return resolveOptionValue(val, source?.valueKey);
    }
    return String(val);
  };

  const selectedKey = getSelectedKey(value);

  const handleSingleSelect = (key: string) => {
    if (!key) {
      onChange('');
      return;
    }
    const found = normalizedOptions.find((o) => o.key === key);
    if (!found) {
      onChange(key);
      return;
    }
    onChange(saveFullObject ? found.raw : found.key);
  };

  const handleCheckboxToggle = (opt: NormalizedOption) => {
    const currentList: any[] = Array.isArray(value) ? value : [];
    const exists = currentList.some((entry) => getSelectedKey(entry) === opt.key);
    if (exists) {
      onChange(currentList.filter((entry) => getSelectedKey(entry) !== opt.key));
    } else {
      onChange([...currentList, saveFullObject ? opt.raw : opt.key]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground">
          {field.label} {field.required && <span className="text-rose-500">*</span>}
        </label>
        {mode === 'API_GET' && (
          <button
            type="button"
            onClick={() => loadApiOptions()}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            title="Muat ulang data opsi dari API"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span>{isLoading ? 'Memuat...' : 'Refresh Opsi'}</span>
          </button>
        )}
      </div>

      {loadError && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {field.type === 'select' && (
        <Combobox
          value={selectedKey}
          onValueChange={handleSingleSelect}
          disabled={isLoading && normalizedOptions.length === 0}
          placeholder={isLoading ? 'Memuat pilihan...' : '-- Pilih salah satu --'}
          searchPlaceholder="Cari pilihan..."
          options={normalizedOptions.map((opt) => ({
            value: opt.key,
            label: opt.label,
          }))}
          mode="auto"
          autoSwitchThreshold={2}
        />
      )}

      {field.type === 'radio' && (
        <RadioGroup
          value={selectedKey}
          onValueChange={handleSingleSelect}
          className="space-y-1.5 pt-0.5"
        >
          {normalizedOptions.map((opt) => (
            <label
              key={opt.key}
              className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
            >
              <RadioGroupItem value={opt.key} />
              <span>{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-1.5 pt-0.5">
          {normalizedOptions.map((opt) => {
            const currentList: any[] = Array.isArray(value) ? value : [];
            const checked = currentList.some((entry) => getSelectedKey(entry) === opt.key);
            return (
              <label
                key={opt.key}
                className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleCheckboxToggle(opt)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {field.helperText && (
        <p className="text-[11px] text-muted-foreground">{field.helperText}</p>
      )}
    </div>
  );
}
