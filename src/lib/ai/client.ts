import { supabase, SUPABASE_KEY, SUPABASE_URL } from '../supabase';


export type AIErrorKind = 'no-key' | 'auth' | 'credits' | 'rate' | 'offline' | 'aborted' | 'bad-response' | 'http';
export class AIError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) { super(message); this.kind = kind; }
}

export type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string | ContentPart[] }

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;          // ask for JSON; callers must still validate (not every model honours it)
  signal?: AbortSignal;
}

/** Savora's AI server already returns friendly messages. */
async function fail(res: Response): Promise<never> {
  let detail = '';
  try { const j = await res.json(); detail = j?.error?.message || ''; } catch { /* not json */ }
  const kind: AIErrorKind = res.status === 401 ? 'auth' : res.status === 429 ? 'rate' : res.status === 402 ? 'credits' : 'http';
  throw new AIError(kind, detail || `Savora AI error ${res.status}. Please try again.`);
}

function wrapNetwork(e: unknown): never {
  if (e instanceof AIError) throw e;
  if ((e as Error)?.name === 'AbortError') throw new AIError('aborted', 'Cancelled');
  throw new AIError('offline', 'Couldn’t reach Savora AI. Check your connection.');
}

interface Target { url: string; init: RequestInit }

/** All AI goes through Savora's server (the app owner's OpenRouter key, free models only). */
async function target(o: ChatOptions, stream: boolean): Promise<Target> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIError('no-key', 'Sign in to use Savora AI.');
  return {
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
  if (!res.ok) await fail(res);
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
  if (!res.ok) await fail(res);
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
