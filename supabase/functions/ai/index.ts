// Savora AI proxy: lets signed-in users use the app owner's OpenRouter key without exposing it.
// - Only signed-in users (Supabase JWT verified here).
// - Always uses OpenRouter's free-models router; clients cannot choose models/providers.
// - Per-user daily cap so one person can't use up the shared free quota.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = 'openrouter/free';
const DAILY_LIMIT = Number(Deno.env.get('SAVORA_AI_DAILY_LIMIT') ?? 20);
const MAX_BODY = 1_500_000;     // bytes; enough for one downscaled photo
const MAX_TOKENS = 4000;
const REASONING_HEADROOM = 2500;
const ALLOWED_ORIGINS = ['https://zarrade.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173', 'http://localhost:4173'];

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}
const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });
const fail = (req: Request, status: number, code: string, message: string) => json(req, status, { error: { code, message } });

// The secret's exact name isn't fixed: take the first env var that looks like an OpenRouter key.
function openRouterKey(): string | null {
  for (const name of ['OPENROUTER_API_KEY', 'OPENROUTER_KEY', 'OPEN_ROUTER_API_KEY']) {
    const v = Deno.env.get(name);
    if (v) return v;
  }
  for (const [name, value] of Object.entries(Deno.env.toObject())) {
    if (/open.?router/i.test(name) && value) return value;
  }
  return null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return fail(req, 405, 'method', 'Use POST');

  // ---- who is calling?
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(req, 401, 'auth', 'Sign in to use Savora AI.');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return fail(req, 401, 'auth', 'Your session has expired. Please sign in again.');

  // ---- read + whitelist the request
  const raw = await req.text();
  if (raw.length > MAX_BODY) return fail(req, 413, 'too_large', 'That request is too large.');
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return fail(req, 400, 'bad_json', 'Invalid request.'); }
  if (!Array.isArray(input.messages) || input.messages.length === 0 || input.messages.length > 40) return fail(req, 400, 'bad_messages', 'Invalid messages.');
  const stream = input.stream === true;
  const body = {
    model: MODEL,
    messages: input.messages,
    stream,
    temperature: typeof input.temperature === 'number' ? Math.min(1.5, Math.max(0, input.temperature)) : 0.4,
    // Free models are often "reasoning" models: they think before answering, and that thinking counts
    // against max_tokens. Keep it short, don't send it to the app, and leave headroom for the answer.
    reasoning: { effort: 'low', exclude: true },
    max_tokens: Math.min(MAX_TOKENS, typeof input.max_tokens === 'number' ? input.max_tokens : MAX_TOKENS) + REASONING_HEADROOM
    // deliberately NOT forwarded: model, models, provider, plugins, response_format, tools …
  };

  const key = openRouterKey();
  if (!key) return fail(req, 500, 'no_key', 'Savora AI is not configured yet (missing OpenRouter secret).');

  // ---- fair use
  const { data: used, error: usageErr } = await admin.rpc('bump_ai_usage', { uid: user.id });
  if (usageErr) return fail(req, 500, 'usage', 'Could not check AI usage.');
  if ((used as number) > DAILY_LIMIT) return fail(req, 429, 'daily_limit', `You've used today's ${DAILY_LIMIT} free AI requests. They reset at midnight UTC.`);

  // ---- forward to OpenRouter
  let upstream: Response;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zarrade.github.io/Savora/',
        'X-Title': 'Savora'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return fail(req, 502, 'upstream', 'Couldn’t reach the AI service. Try again in a moment.');
  }

  if (!upstream.ok) {
    let msg = '';
    try { msg = (await upstream.json())?.error?.message ?? ''; } catch { /* not json */ }
    console.error('openrouter', upstream.status, msg.slice(0, 300));
    if (upstream.status === 429) return fail(req, 429, 'busy', 'The free AI models are busy or today’s shared free limit is used up. Please try again later.');
    if (upstream.status === 402) return fail(req, 402, 'credits', 'Savora’s free AI is unavailable right now. Please try again later.');
    if (upstream.status === 404 && /data policy|no endpoints/i.test(msg)) return fail(req, 503, 'policy', 'No free model is available for this request right now.');
    return fail(req, 502, 'upstream', msg || `AI service error (${upstream.status}).`);
  }

  // Streaming: pass the SSE straight through. Otherwise return the JSON as-is.
  return new Response(upstream.body, {
    status: 200,
    headers: { ...cors(req), 'Content-Type': stream ? 'text/event-stream' : 'application/json', 'Cache-Control': 'no-cache' }
  });
});
