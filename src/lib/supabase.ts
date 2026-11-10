import { createClient } from '@supabase/supabase-js';

// Publishable values: safe to ship in the app. Row Level Security keeps every user's data private.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://egwfaymxvrlphznceyfj.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_XPbhJHAMXXt4EZ91XBm8iA_NkKJbaae';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: 'pkce',          // returns ?code=… (the implicit #access_token=… would clash with hash routing)
    detectSessionInUrl: false, // handled in lib/account.ts so it can coexist with the OpenRouter callback
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'savora-auth'
  }
});

/** Where email links (confirm / magic link / password reset) send people back to. */
export const appUrl = () => location.origin + location.pathname;
