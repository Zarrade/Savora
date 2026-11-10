/**
 * AI configuration lives in localStorage on this device — deliberately NOT in the
 * IndexedDB settings, so your OpenRouter key is never included in backup files.
 */
const listeners = new Set<() => void>();

export interface AIConfig {
  key: string;
  model: string;        // text model
  visionModel: string;  // used for photo → recipe (must accept images)
}

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';
export const DEFAULT_VISION_MODEL = 'openai/gpt-4o-mini';
// Per user: someone else signing in on this phone never gets your key.
const GUEST_STORE = 'savora-ai-config';
let STORE = GUEST_STORE;

/** Switch to a user's AI settings (null = guest). Optionally carry a guest key into a new account. */
export function setAIScope(uid: string | null, inheritGuest = false) {
  STORE = uid ? `savora-ai-config:${uid}` : GUEST_STORE;
  if (uid && inheritGuest && !localStorage.getItem(STORE)) {
    const g = localStorage.getItem(GUEST_STORE);
    if (g) { localStorage.setItem(STORE, g); localStorage.removeItem(GUEST_STORE); }
  }
  listeners.forEach(l => l());
}
export const aiStoreKey = () => STORE;

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

export function saveAIConfig(patch: Partial<AIConfig>) {
  const next = { ...loadAIConfig(), ...patch };
  try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* storage blocked */ }
  listeners.forEach(l => l());
}
export function notifyAIConfig() { listeners.forEach(l => l()); }
export function subscribeAIConfig(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export const hasAIKey = () => !!loadAIConfig().key;
