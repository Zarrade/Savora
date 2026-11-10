import { loadAIConfig } from './config';

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

async function fail(res: Response): Promise<never> {
  let detail = '';
  try { const j = await res.json(); detail = j?.error?.message || ''; } catch { /* not json */ }
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

function body(o: ChatOptions, stream: boolean) {
  return JSON.stringify({
    model: o.model || loadAIConfig().model,
    messages: o.messages,
    stream,
    temperature: o.temperature ?? 0.4,
    ...(o.maxTokens ? { max_tokens: o.maxTokens } : {}),
    ...(o.json ? { response_format: { type: 'json_object' } } : {})
  });
}

function keyOf(o: ChatOptions) {
  const key = o.key ?? loadAIConfig().key;
  if (!key) throw new AIError('no-key', 'Add your OpenRouter key in Settings → AI first.');
  return key;
}

/** One-shot completion → text. */
export async function chat(o: ChatOptions): Promise<string> {
  const key = keyOf(o);
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER}/chat/completions`, { method: 'POST', headers: headers(key), body: body(o, false), signal: o.signal });
  } catch (e) { wrapNetwork(e); }
  if (!res.ok) await fail(res);
  const j = await res.json().catch(() => null);
  const text = j?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new AIError('bad-response', j?.error?.message || 'The model returned an empty reply.');
  return text;
}

/** Streaming completion (SSE). Calls onDelta with each chunk; resolves with the full text. */
export async function chatStream(o: ChatOptions, onDelta: (chunk: string, full: string) => void): Promise<string> {
  const key = keyOf(o);
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER}/chat/completions`, { method: 'POST', headers: headers(key), body: body(o, true), signal: o.signal });
  } catch (e) { wrapNetwork(e); }
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
        if (data === '[DONE]') return full;
        try {
          const j = JSON.parse(data);
          if (j?.error) throw new AIError('http', j.error.message || 'The model stopped with an error.');
          const d = j?.choices?.[0]?.delta?.content;
          if (typeof d === 'string' && d) { full += d; onDelta(d, full); }
        } catch (e) { if (e instanceof AIError) throw e; /* partial JSON line */ }
      }
    }
  } catch (e) { wrapNetwork(e); }
  return full;
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
