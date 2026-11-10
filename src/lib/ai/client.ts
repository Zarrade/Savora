import { loadAIConfig } from './config';
import { supabase, SUPABASE_KEY, SUPABASE_URL } from '../supabase';

export const OPENROUTER = 'https://openrouter.ai/api/v1';

export type AIErrorKind = 'no-key' | 'auth' | 'credits' | 'rate' | 'offline' | 'aborted' | 'bad-response' | 'http';
export class AIError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) { super(message); this.kind = kind; }
}

export type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string | ContentPart[] }

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;          // ask for JSON; callers must still validate (not every model honours it)
  signal?: AbortSignal;
  key?: string;
}

function headers(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': location.origin + location.pathname,
    'X-Title': 'Savora'
  };
}

async function fail(res: Response, viaSavora = false): Promise<never> {
  let detail = '';
  try { const j = await res.json(); detail = j?.error?.message || ''; } catch { /* not json */ }
  if (viaSavora) {
    // Savora's AI proxy already returns friendly messages
    const kind: AIErrorKind = res.status === 401 ? 'auth' : res.status === 429 ? 'rate' : res.status === 402 ? 'credits' : 'http';
    throw new AIError(kind, detail || `Savora AI error ${res.status}`);
  }
  if (res.status === 401 || res.status === 403) throw new AIError('auth', 'OpenRouter rejected your key. Reconnect in Settings → AI.');
  if (res.status === 402) throw new AIError('credits', 'Your OpenRouter account is out of credits. Add credits at openrouter.ai/credits.');
  if (res.status === 429) throw new AIError('rate', 'Too many requests — wait a moment and try again.');
  throw new AIError('http', detail || `OpenRouter error ${res.status}`);
}

function wrapNetwork(e: unknown): never {
  if (e instanceof AIError) throw e;
  if ((e as Error)?.name === 'AbortError') throw new AIError('aborted', 'Cancelled');
  throw new AIError('offline', 'Couldn’t reach OpenRouter. Check your connection.');
}

interface Target { url: string; init: RequestInit; viaSavora: boolean }

/**
 * Your own OpenRouter key → straight to OpenRouter with the model you chose.
 * Otherwise, signed in → Savora's AI proxy (free models picked by OpenRouter, key kept on the server).
 */
async function target(o: ChatOptions, stream: boolean): Promise<Target> {
  const cfg = loadAIConfig();
  const key = o.key ?? cfg.key;
  if (key) {
    return {
      viaSavora: false,
      url: `${OPENROUTER}/chat/completions`,
      init: {
        method: 'POST', headers: headers(key), signal: o.signal,
        body: JSON.stringify({
          model: o.model || cfg.model, messages: o.messages, stream,
          temperature: o.temperature ?? 0.4,
          ...(o.maxTokens ? { max_tokens: o.maxTokens } : {}),
          ...(o.json ? { response_format: { type: 'json_object' } } : {})
        })
      }
    };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIError('no-key', 'Sign in for free Savora AI, or add your own OpenRouter key in Me → AI.');
  return {
    viaSavora: true,
    url: `${SUPABASE_URL}/functions/v1/ai`,
    init: {
      method: 'POST', signal: o.signal,
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: o.messages, stream, temperature: o.temperature ?? 0.4, ...(o.maxTokens ? { max_tokens: o.maxTokens } : {}) })
    }
  };
}

/** One-shot completion → text. */
export async function chat(o: ChatOptions): Promise<string> {
  const t = await target(o, false);
  let res: Response;
  try { res = await fetch(t.url, t.init); } catch (e) { wrapNetwork(e); }
  if (!res.ok) await fail(res, t.viaSavora);
  const j = await res.json().catch(() => null);
  const text = j?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new AIError('bad-response', j?.error?.message || 'The model returned an empty reply. Please try again.');
  return text;
}

/** Streaming completion (SSE). Calls onDelta with each chunk; resolves with the full text. */
export async function chatStream(o: ChatOptions, onDelta: (chunk: string, full: string) => void): Promise<string> {
  const t = await target(o, true);
  let res: Response;
  try { res = await fetch(t.url, t.init); } catch (e) { wrapNetwork(e); }
  if (!res.ok) await fail(res, t.viaSavora);
  if (!res.body) throw new AIError('bad-response', 'Streaming is not supported here.');
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;          // also skips ": OPENROUTER PROCESSING" keep-alives
        const data = line.slice(5).trim();
        if (data === '[DONE]') return full.trim();
        try {
          const j = JSON.parse(data);
          if (j?.error) throw new AIError('http', j.error.message || 'The model stopped with an error.');
          const d = j?.choices?.[0]?.delta?.content;
          if (typeof d === 'string' && d) { full += d; onDelta(d, full.trimStart()); }
        } catch (e) { if (e instanceof AIError) throw e; /* partial JSON line */ }
      }
    }
  } catch (e) { wrapNetwork(e); }
  return full.trim();
}

export interface ModelInfo { id: string; name: string; vision: boolean; promptPrice: number; context: number }

/** Public endpoint — works without a key. */
export async function listModels(signal?: AbortSignal): Promise<ModelInfo[]> {
  let res: Response;
  try { res = await fetch(`${OPENROUTER}/models`, { signal }); } catch (e) { wrapNetwork(e); }
  if (!res.ok) await fail(res);
  const j = await res.json().catch(() => null);
  const arr: unknown[] = Array.isArray(j?.data) ? j.data : [];
  return arr.flatMap((m): ModelInfo[] => {
    const x = m as { id?: string; name?: string; context_length?: number; pricing?: { prompt?: string }; architecture?: { input_modalities?: string[]; output_modalities?: string[] } };
    if (!x.id) return [];
    const out = x.architecture?.output_modalities;
    if (out && !out.includes('text')) return [];
    return [{
      id: x.id, name: x.name || x.id,
      vision: !!x.architecture?.input_modalities?.includes('image'),
      promptPrice: Number(x.pricing?.prompt) * 1e6 || 0,   // USD per 1M tokens
      context: x.context_length || 0
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** Cheap check that a key works (also shows remaining credit when available). */
export async function checkKey(key: string): Promise<{ label?: string; remaining?: number | null }> {
  let res: Response;
  try { res = await fetch(`${OPENROUTER}/key`, { headers: headers(key) }); } catch (e) { wrapNetwork(e); }
  if (!res.ok) await fail(res);
  const j = await res.json().catch(() => null);
  const d = j?.data ?? {};
  return { label: d.label, remaining: typeof d.limit_remaining === 'number' ? d.limit_remaining : null };
}
