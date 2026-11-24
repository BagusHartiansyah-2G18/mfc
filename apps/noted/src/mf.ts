import { lazy, type ComponentType } from 'react';
import { registerRemotes, loadRemote, init } from '@module-federation/runtime';

const COMP_UI_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMP_UI_URL) ||
  (typeof window !== 'undefined' &&
    (window as unknown as { __ENV__?: { VITE_COMP_UI_URL?: string } }).__ENV__?.VITE_COMP_UI_URL) ||
  'http://localhost:4201/remoteEntry.js';

export const REMOTES = [
  {
    alias: 'compUI',
    name: 'comp_ui',
    entry: COMP_UI_URL,
    type: 'module' as const,
  },
];

try {
  registerRemotes(REMOTES);
} catch {
  try {
    init({
      name: 'noted',
      remotes: REMOTES,
    });
  } catch {
    // No-op for test environments
  }
}

const LOCAL_FALLBACKS: Record<string, () => Promise<any>> = {
  NotedView: () => import('../../compUI/src/components/noted/NotedView'),
  StandaloneQuestionnaire: () =>
    import('../../compUI/src/components/noted/forms/StandaloneQuestionnairePage'),
  NotedFormsPage: () => import('../../compUI/src/components/noted/forms/NoteFormsPage'),
  NotedFormResponsesPage: () =>
    import('../../compUI/src/components/noted/forms/NoteFormResponsesPage'),
  NotedDocumentsPage: () => import('../../compUI/src/components/noted/NoteDocumentsPage'),
};

export function lazyProvider<Props extends object = Record<string, unknown>>(
  alias: string,
  exposeName: string
): ComponentType<Props> {
  return lazy(async () => {
    // 1. Coba Module Federation Remote terlebih dahulu (Arsitektur Micro Frontend)
    try {
      const mod = await loadRemote<{ default?: ComponentType<Props>; NotedView?: ComponentType<Props> }>(
        `${alias}/${exposeName}`
      );
      const Component = mod?.default || (mod as any)?.[exposeName];
      if (Component) {
        return { default: Component };
      }
    } catch (remoteErr) {
      console.warn(
        `[Noted Host MFE] loadRemote("${alias}/${exposeName}") belum tersedia via remoteEntry, mengaktifkan workspace fallback:`,
        remoteErr
      );
    }

    // 2. Fallback aman ke modul workspace compUI lokal jika remoteEntry belum selesai reload
    const localLoader = alias === 'compUI' ? LOCAL_FALLBACKS[exposeName] : undefined;
    if (localLoader) {
      try {
        const localMod = await localLoader();
        const LocalComponent = localMod?.default || localMod?.[exposeName];
        if (LocalComponent) {
          return { default: LocalComponent as unknown as ComponentType<Props> };
        }
      } catch (localErr) {
        console.error(`[Noted Host MFE] Workspace fallback juga gagal:`, localErr);
      }
    }

    throw new Error(
      `Remote module "${alias}/${exposeName}" tidak dapat dimuat dari ${COMP_UI_URL} dan fallback tidak tersedia.`
    );
  });
}
