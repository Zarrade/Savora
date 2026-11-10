import { OPENROUTER, AIError } from './client';
import { saveAIConfig } from './config';

/**
 * "Connect OpenRouter" using OpenRouter's OAuth PKCE flow: the user signs in on openrouter.ai,
 * is sent back here with ?code=…, and we exchange it for a personal API key stored on this device.
 * No client secret or backend is involved.
 */
// localStorage (not sessionStorage): the sign-in may open in a Custom Tab and the callback may land in
// a different tab/context than the installed app. localStorage is shared per origin, so either one can finish.
const VERIFIER = 'savora-oauth-verifier';
const MAX_AGE_MS = 10 * 60 * 1000;

function b64url(bytes: Uint8Array) {
  let s = '';
  bytes.forEach(b => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function startOpenRouterLogin() {
  const raw = crypto.getRandomValues(new Uint8Array(48));
  const verifier = b64url(raw);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  localStorage.setItem(VERIFIER, JSON.stringify({ v: verifier, t: Date.now() }));
  // Hash routing: the callback is the page itself (no #fragment); the code comes back in ?code=
  const callback = location.origin + location.pathname + '?or=1'; // marker: not a Supabase sign-in code
  const url = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callback)}&code_challenge=${challenge}&code_challenge_method=S256`;
  location.href = url;
}

/** Call once on startup. Returns true if a code was handled. */
export async function finishOpenRouterLogin(): Promise<'connected' | 'failed' | null> {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code || !params.has('or')) return null;
  let verifier: string | null = null;
  try {
    const saved = JSON.parse(localStorage.getItem(VERIFIER) || 'null');
    if (saved?.v && Date.now() - saved.t < MAX_AGE_MS) verifier = saved.v;
  } catch { /* unreadable */ }
  // Clean the URL right away so a refresh doesn't replay the code
  history.replaceState(null, '', location.pathname + location.hash);
  localStorage.removeItem(VERIFIER);
  if (!verifier) return 'failed';
  try {
    const res = await fetch(`${OPENROUTER}/auth/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' })
    });
    if (!res.ok) throw new AIError('auth', 'Exchange failed');
    const j = await res.json();
    if (!j?.key) throw new AIError('bad-response', 'No key returned');
    saveAIConfig({ key: j.key });
    return 'connected';
  } catch {
    return 'failed';
  }
}
