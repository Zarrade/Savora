/**
 * AI configuration lives in localStorage on this device — deliberately NOT in the
 * IndexedDB settings, so your OpenRouter key is never included in backup files.
 */
export interface AIConfig {
  key: string;
  model: string;        // text model
  visionModel: string;  // used for photo → recipe (must accept images)
}

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';
export const DEFAULT_VISION_MODEL = 'openai/gpt-4o-mini';
const STORE = 'savora-ai-config';

export function loadAIConfig(): AIConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
    return {
      key: typeof raw.key === 'string' ? raw.key : '',
      model: raw.model || DEFAULT_MODEL,
      visionModel: raw.visionModel || DEFAULT_VISION_MODEL
    };
  } catch {
    return { key: '', model: DEFAULT_MODEL, visionModel: DEFAULT_VISION_MODEL };
  }
}

const listeners = new Set<() => void>();
export function saveAIConfig(patch: Partial<AIConfig>) {
  const next = { ...loadAIConfig(), ...patch };
  try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* storage blocked */ }
  listeners.forEach(l => l());
}
export function notifyAIConfig() { listeners.forEach(l => l()); }
export function subscribeAIConfig(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const hasAIKey = () => !!loadAIConfig().key;
