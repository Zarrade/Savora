import type { User } from '@supabase/supabase-js';
import { db, ensureSeeded, wipeLocal } from '../db';
import { supabase, appUrl } from './supabase';
import { clearOutbox, setOutboxUser } from './outbox';
import { cloudHasData, queueAllLocal, startSync, stopSync, syncNow } from './sync';
import { setAIScope } from './ai/config';
import { setCustomFoodsScope } from './ingredients';

/**
 * Account lifecycle. The app stays offline-first: the local database is the working copy,
 * and it belongs to exactly one owner at a time — a signed-in user, or "guest".
 */
export interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  recovery: boolean;          // arrived from a password-reset email: ask for a new password
  merge: null | 'ask';        // guest data on this device + existing account data: ask what to do
  guest: boolean;             // chose "continue without an account"
}

const OWNER = 'savora-owner';
const GUEST = 'savora-guest-mode';
let state: AuthState = { status: 'loading', user: null, recovery: false, merge: null, guest: localStorage.getItem(GUEST) === '1' };
const subs = new Set<() => void>();
const set = (p: Partial<AuthState>) => { state = { ...state, ...p }; subs.forEach(s => s()); };
export const getAuth = () => state;
export function subscribeAuth(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; }

const resetSyncState = (uid: string) => {
  ['savora-cursor:', 'savora-known:'].forEach(k => localStorage.removeItem(k + uid));
  clearOutbox(uid);
};

async function hasGuestData(): Promise<boolean> {
  const s = await db.settings.get('settings');
  if (s?.onboarded) return true;
  const [plan, grocery, own, touched] = await Promise.all([
    db.plan.count(), db.grocery.count(),
    db.recipes.filter(r => !r.builtIn).count(),
    db.recipes.filter(r => !!r.builtIn && r.updatedAt !== r.createdAt).count()
  ]);
  return plan + grocery + own + touched > 0;
}

function begin(user: User) {
  localStorage.setItem(OWNER, user.id);
  localStorage.removeItem(GUEST);
  setOutboxUser(user.id);
  setAIScope(user.id, true);
  setCustomFoodsScope(user.id);
  set({ status: 'signedIn', user, merge: null, guest: false });
  startSync(user.id);
}

let activating: string | null = null;
let leaving = false;
async function activate(user: User) {
  if (activating === user.id || (state.status === 'signedIn' && state.user?.id === user.id)) { set({ user }); return; }
  activating = user.id;
  try {
    const owner = localStorage.getItem(OWNER);
    if (owner === user.id) { begin(user); return; }

    if (owner && owner !== 'guest') {
      // Another account's data is on this device (it should have been wiped at sign-out): replace it
      await wipeLocal(); await ensureSeeded(); resetSyncState(user.id); begin(user); return;
    }

    // Local data belongs to a guest (or this is a fresh install)
    resetSyncState(user.id);
    const local = await hasGuestData();
    if (!local) { begin(user); return; }
    let cloud = false;
    try { cloud = await cloudHasData(); } catch { cloud = false; /* offline: keep local, it becomes the account's */ }
    if (!cloud) { setOutboxUser(user.id); await queueAllLocal(); begin(user); return; }
    set({ status: 'signedIn', user, merge: 'ask' }); // UI asks; resolveMerge() continues
  } finally { activating = null; }
}

/** Guest data + an account that already has data: bring it in, or start from the account's data. */
export async function resolveMerge(choice: 'merge' | 'discard') {
  const user = state.user;
  if (!user) return;
  if (choice === 'merge') { setOutboxUser(user.id); await queueAllLocal(); }
  else { await wipeLocal(); await ensureSeeded(); }
  begin(user);
}

async function cleanupLocal() {
  stopSync();
  setOutboxUser(null);
  await wipeLocal();
  await ensureSeeded();
  localStorage.setItem(OWNER, 'guest');
  setAIScope(null);
  setCustomFoodsScope(null);
}

/** Call once at startup. Never blocks on the network: getSession() reads local storage. */
export async function initAuth() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  // Supabase email links come back with ?code=… (PKCE). OpenRouter's callback is marked ?or=1.
  if (code && !params.has('or')) {
    const recovery = params.get('type') === 'recovery';
    history.replaceState(null, '', location.pathname + location.hash);
    const { error } = await supabase.auth.exchangeCodeForSession(code).catch(e => ({ error: e as Error }));
    if (!error && recovery) set({ recovery: true });
    if (error) authNotice = 'That link has expired or was already used. Please sign in.';
  }

  supabase.auth.onAuthStateChange((event, session) => {
    // Supabase advises not awaiting other Supabase calls inside this callback
    setTimeout(() => {
      if (event === 'PASSWORD_RECOVERY') set({ recovery: true });
      if (session?.user) activate(session.user);
      else if (event === 'SIGNED_OUT' && state.status === 'signedIn' && !leaving) {
        // Session ended on its own (e.g. revoked elsewhere): stop syncing but KEEP local data and the
        // outbox — signing back in as the same person picks up exactly where they left off.
        stopSync(); setOutboxUser(null);
        set({ status: 'signedOut', user: null, merge: null });
      }
    }, 0);
  });

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await activate(data.session.user);
    else set({ status: 'signedOut' });
  } catch (e) {
    console.error(e);
    if (state.status === 'loading') set({ status: 'signedOut' }); // never leave the app stuck on the splash
  }
}

export let authNotice: string | null = null;
export function takeAuthNotice() { const n = authNotice; authNotice = null; return n; }

export function continueAsGuest() {
  localStorage.setItem(GUEST, '1');
  if (!localStorage.getItem(OWNER)) localStorage.setItem(OWNER, 'guest');
  set({ guest: true });
}
export function showSignIn() { localStorage.removeItem(GUEST); set({ guest: false }); }

/* ------------------------------------------------------------ actions */

export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { emailRedirectTo: appUrl(), data: { name } }
  });
  if (error) throw error;
  // With "Confirm email" on, there's no session until they click the link
  return { needsConfirm: !data.session };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl(), shouldCreateUser: false } });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl()}?type=recovery` });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  set({ recovery: false });
}

export async function updateName(name: string) {
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) throw error;
}

export async function signOut() {
  // Upload anything pending first (best effort, don't hang when offline)
  leaving = true;
  try {
    await Promise.race([syncNow(), new Promise(r => setTimeout(r, 6000))]);
    await cleanupLocal();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    set({ status: 'signedOut', user: null, merge: null, recovery: false });
  } finally { leaving = false; }
}

export async function deleteAccount() {
  const uid = state.user?.id;
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  leaving = true;
  try {
    stopSync();
    if (uid) resetSyncState(uid);
    await cleanupLocal();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    set({ status: 'signedOut', user: null, merge: null, recovery: false });
  } finally { leaving = false; }
}

export const displayName = (u: User | null) =>
  (u?.user_metadata?.name as string | undefined)?.trim() || u?.email?.split('@')[0] || '';
