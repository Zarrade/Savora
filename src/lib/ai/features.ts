import type { Nutrition, Recipe, Settings } from '../../types';
import { chat, chatStream, type ChatMessage, type ContentPart } from './client';
import { extractJSON, RECIPE_SCHEMA_HINT, toRecipeDraft, type AIRecipeDraft } from './json';
import { EQUIP_MAP } from '../kitchen';
import { recipeConflicts } from '../ingredients';

/* ------------------------------------------------------------ shared context */

/** A compact description of the user's constraints that goes into every prompt. */
export function profileContext(s: Settings): string {
  const have = s.equipment.map(e => EQUIP_MAP[e as keyof typeof EQUIP_MAP]?.label ?? e).join(', ') || 'basic hob only';
  return [
    `Kitchen equipment available: ${have}. Only use equipment from this list.`,
    s.allergies.length ? `ALLERGIES (never include, strict): ${s.allergies.join(', ')}.` : '',
    s.avoid.length ? `Foods the user dislikes (avoid): ${s.avoid.join(', ')}.` : '',
    s.diets.length ? `Diet: ${s.diets.join(', ')}.` : '',
    `Usually cooks for ${s.householdServings}. Metric units. Currency ${s.currency}.`
  ].filter(Boolean).join('\n');
}

const JSON_ONLY = 'Reply with ONLY a single JSON object — no markdown fences, no commentary.';

async function jsonCall<T>(messages: ChatMessage[], parse: (raw: unknown) => T, opts: { signal?: AbortSignal; maxTokens?: number } = {}): Promise<T> {
  let lastErr: unknown;
  // Not every model honours response_format, so validate and retry once with the error fed back.
  for (let attempt = 0; attempt < 2; attempt++) {
    const msgs = attempt === 0 ? messages : [...messages, { role: 'user' as const, content: `That was not usable (${(lastErr as Error)?.message}). ${JSON_ONLY}` }];
    const text = await chat({ messages: msgs, json: attempt === 0, signal: opts.signal, maxTokens: opts.maxTokens ?? 3500, temperature: 0.3 });
    try { return parse(extractJSON(text)); } catch (e) { lastErr = e; }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Unusable reply');
}

/* ----------------------------------------------------------- 1. smart import */

export async function importRecipeAI(input: string, _s: Settings, signal?: AbortSignal): Promise<AIRecipeDraft> {
  return jsonCall([
    { role: 'system', content: `You extract recipes into structured JSON. Keep the author's real ingredients, quantities and method; do not invent a different dish. If quantities are missing, estimate sensible ones. Convert to metric. Fill cuisine, mealTypes and tags sensibly. Schema:\n${RECIPE_SCHEMA_HINT}\n${JSON_ONLY}` },
    { role: 'user', content: `Convert this to a recipe:\n\n${input.slice(0, 24000)}` }
  ], toRecipeDraft, { signal });
}

/** Fetch a page through the browser and strip it to readable text. Most sites block cross-origin reads; callers fall back to pasting. */
export async function fetchPageText(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Prefer structured data: schema.org/Recipe JSON-LD is the most reliable source
  for (const el of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    if (/"Recipe"/.test(el.textContent || '')) return `JSON-LD recipe data:\n${(el.textContent || '').slice(0, 20000)}`;
  }
  doc.querySelectorAll('script,style,nav,footer,header,aside,form,noscript').forEach(n => n.remove());
  return (doc.body?.innerText || doc.body?.textContent || '').replace(/\n{3,}/g, '\n\n').slice(0, 20000);
}

/* --------------------------------------------------- 2. what can I make? */

export interface PantrySuggestion {
  draft: AIRecipeDraft;
  uses: string[];       // pantry items it uses
  missing: string[];    // small extras you'd still need
  why: string;
}

export async function whatCanIMake(items: string[], extra: string, s: Settings, signal?: AbortSignal): Promise<PantrySuggestion[]> {
  const sys = `You are a practical home-cook assistant. Suggest 3 different dinner/lunch ideas the user can make mostly from what they have. Respect every constraint strictly.
${profileContext(s)}
For each idea return the full recipe (schema below) plus "uses" (array of the user's items it uses), "missing" (array of at most 3 small extra items they'd need to buy; empty if none) and "why" (one short sentence).
Schema for each idea: { "recipe": ${RECIPE_SCHEMA_HINT}, "uses": string[], "missing": string[], "why": string }
${JSON_ONLY} Shape: { "ideas": [ ... ] }`;
  const out = await jsonCall([
    { role: 'system', content: sys },
    { role: 'user', content: `What I have: ${items.join(', ')}.${extra ? `\nWhat I'm in the mood for: ${extra}` : ''}` }
  ], raw => {
    const ideas = (raw as { ideas?: unknown[] })?.ideas;
    if (!Array.isArray(ideas)) throw new Error('No ideas array.');
    const parsed: PantrySuggestion[] = [];
    for (const it of ideas) {
      const o = it as { recipe?: unknown; uses?: unknown; missing?: unknown; why?: unknown };
      try {
        const draft = toRecipeDraft(o.recipe);
        // Hard safety net: never show something that trips the user's allergy / avoid list, whatever the model says
        if (recipeConflicts({ ingredients: draft.ingredients }, [...s.allergies, ...s.avoid]).length) continue;
        const list = (v: unknown) => (Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean).slice(0, 12) : []);
        parsed.push({ draft, uses: list(o.uses), missing: list(o.missing).slice(0, 3), why: typeof o.why === 'string' ? o.why.slice(0, 200) : '' });
      } catch { /* skip malformed idea */ }
    }
    if (!parsed.length) throw new Error('No usable ideas (they may have conflicted with your allergies).');
    return parsed;
  }, { signal, maxTokens: 6000 });
  return out;
}

/* ------------------------------------------------------ 3. cook-mode helper */

export interface CookTurn { role: 'user' | 'assistant'; content: string }

export function cookAssistant(recipe: Recipe, stepIdx: number, history: CookTurn[], s: Settings, onDelta: (full: string) => void, signal?: AbortSignal) {
  const ings = recipe.ingredients.map(i => `- ${[i.qty ?? '', i.unit, i.name].filter(x => x !== '').join(' ')}`).join('\n');
  const steps = recipe.steps.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const system = `You are a calm, expert cooking assistant inside a recipe app; the user is cooking right now with messy hands, so be brief (max ~80 words), concrete and safe. Give exact substitutions with quantities. If asked about doneness, give temperature and visual cues.
${profileContext(s)}
Recipe: ${recipe.title} (serves ${recipe.servings})
Ingredients:\n${ings}
Steps:\n${steps}
The user is currently on step ${stepIdx >= 0 ? stepIdx + 1 : 'the ingredient check'}.`;
  return chatStream({ messages: [{ role: 'system', content: system }, ...history], temperature: 0.5, maxTokens: 500, signal }, (_d, full) => onDelta(full));
}

/* ----------------------------------------------------- 4. photo → recipe */

/** Downscale to keep uploads small and cheap. */
export async function imageToDataUrl(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

export async function photoToRecipe(dataUrl: string, hint: string, s: Settings, signal?: AbortSignal): Promise<AIRecipeDraft> {
  const parts: ContentPart[] = [
    { type: 'text', text: `${hint ? `Note from the user: ${hint}\n` : ''}Look at this image. If it shows a written or printed recipe (cookbook page, screenshot, handwritten card), transcribe it faithfully. If it shows a finished dish, write a realistic home recipe for it. Respect: ${profileContext(s)}` },
    { type: 'image_url', image_url: { url: dataUrl } }
  ];
  return jsonCall([
    { role: 'system', content: `You turn photos into structured recipes. Schema:\n${RECIPE_SCHEMA_HINT}\n${JSON_ONLY}` },
    { role: 'user', content: parts }
  ], toRecipeDraft, { signal, maxTokens: 4000 });
}

/* --------------------------------------------- 5. smarter planner swaps */

/** The AI may only choose among candidates the deterministic planner already allows,
 *  so allergies, avoided foods, diet and kitchen equipment can never be bypassed. */
export async function rankSwapCandidates(request: string, candidates: Recipe[], s: Settings, signal?: AbortSignal): Promise<{ id: string; reason: string }[]> {
  const list = candidates.slice(0, 60).map(r => `${r.id} | ${r.title} | ${r.cuisine} | ${r.prepMin + r.cookMin} min | ${r.tags.slice(0, 4).join(',')}`).join('\n');
  const ids = new Set(candidates.map(r => r.id));
  return jsonCall([
    { role: 'system', content: `Pick the best 4 recipes for the user's request from the numbered list, in order. Only use ids from the list. ${JSON_ONLY} Shape: { "picks": [ { "id": string, "reason": string (max 12 words) } ] }` },
    { role: 'user', content: `Request: ${request}\nHousehold: ${profileContext(s)}\n\nCandidates (id | title | cuisine | time | tags):\n${list}` }
  ], raw => {
    const picks = ((raw as { picks?: { id?: unknown; reason?: unknown }[] })?.picks ?? [])
      .filter(p => typeof p?.id === 'string' && ids.has(p.id as string))
      .map(p => ({ id: p.id as string, reason: typeof p.reason === 'string' ? p.reason.slice(0, 100) : '' }));
    if (!picks.length) throw new Error('No valid picks.');
    return picks.slice(0, 4);
  }, { signal, maxTokens: 700 });
}

/* ----------------------------------- 6. nutrition for unknown ingredients */

const NKEYS: (keyof Nutrition)[] = ['kcal', 'protein', 'carbs', 'fat', 'satFat', 'sugar', 'fibre', 'salt', 'calcium', 'iron', 'potassium', 'vitC', 'vitA', 'magnesium'];

/** Returns per-100 g values (same order as the built-in DB) for each unknown ingredient name. */
export async function estimateNutrition(names: string[], signal?: AbortSignal): Promise<Record<string, number[]>> {
  const clean = [...new Set(names.map(n => n.trim()).filter(Boolean))].slice(0, 25);
  if (!clean.length) return {};
  return jsonCall([
    { role: 'system', content: `You are a nutrition database. For each food give typical values per 100 g edible portion (USDA-style). Order of the "n" array: ${NKEYS.join(', ')} (salt in g, calcium/iron/potassium/vitC/magnesium in mg, vitA in µg RAE). ${JSON_ONLY} Shape: { "foods": [ { "name": string (exactly as given), "n": number[14] } ] }` },
    { role: 'user', content: clean.join('\n') }
  ], raw => {
    const out: Record<string, number[]> = {};
    for (const f of (raw as { foods?: { name?: unknown; n?: unknown }[] })?.foods ?? []) {
      if (typeof f?.name !== 'string' || !Array.isArray(f.n) || f.n.length !== 14) continue;
      const n = f.n.map(Number);
      // Sanity: finite, non-negative, and a plausible calorie density for 100 g of food
      if (n.some(v => !isFinite(v) || v < 0) || n[0] > 950) continue;
      out[f.name.toLowerCase().trim()] = n;
    }
    if (!Object.keys(out).length) throw new Error('No usable nutrition values.');
    return out;
  }, { signal, maxTokens: 2500 });
}
