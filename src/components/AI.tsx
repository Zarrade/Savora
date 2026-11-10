import { useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { aiStoreKey, loadAIConfig, notifyAIConfig, subscribeAIConfig, type AIConfig } from '../lib/ai/config';
import { AIError } from '../lib/ai/client';
import type { AIRecipeDraft } from '../lib/ai/json';
import { IMPORT_KEY } from '../pages/RecipeEditor';
import { toast } from './ui';
import { useAuth } from './Account';
import { showSignIn } from '../lib/account';
import { Icon } from './Icon';

let snap = loadAIConfig();
subscribeAIConfig(() => { snap = loadAIConfig(); });
// A key saved by another tab (e.g. the OAuth callback) should reach this one without a reload
window.addEventListener('storage', e => { if (e.key === aiStoreKey()) { snap = loadAIConfig(); notifyAIConfig(); } });
export function useAIConfig(): AIConfig {
  return useSyncExternalStore(
    cb => subscribeAIConfig(cb),
    () => snap
  );
}

/** AI works with the user's own OpenRouter key, or — when signed in — Savora's free AI. */
export function useAIReady(): boolean {
  const cfg = useAIConfig();
  const auth = useAuth();
  return !!cfg.key || auth.status === 'signedIn';
}

export function aiErrorMessage(e: unknown): string {
  if (e instanceof AIError) return e.message;
  return (e as Error)?.message || 'Something went wrong.';
}
export function aiToast(e: unknown) {
  if (e instanceof AIError && e.kind === 'aborted') return;
  toast(aiErrorMessage(e));
}

/** Shown in place of an AI feature for guests without their own key. */
export function NeedKey({ what }: { what: string }) {
  return (
    <div className="card-flat need-key">
      <div className="row gap">
        <span className="need-key-ico"><Icon name="sparkles" size={22} /></span>
        <div className="grow">
          <b>{what} uses Savora AI</b>
          <small className="muted" style={{ display: 'block' }}>Free for everyone with a Savora account. Everything else keeps working without one.</small>
        </div>
      </div>
      <button className="btn btn-primary block" style={{ marginTop: 10 }} onClick={showSignIn}>Sign in for free AI</button>
      <Link to="/settings#ai" className="btn btn-ghost block" style={{ marginTop: 8 }}>Or use your own OpenRouter key</Link>
    </div>
  );
}

/** Hand an AI-made recipe to the normal editor so the user can review before saving. */
export function useOpenDraft() {
  const nav = useNavigate();
  return (d: AIRecipeDraft, extra: { sourceUrl?: string; videoUrl?: string } = {}) => {
    sessionStorage.setItem(IMPORT_KEY, JSON.stringify({ ...d, ...extra }));
    nav('/new');
  };
}
