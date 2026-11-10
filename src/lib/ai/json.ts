import type { Ingredient, MealType, Recipe } from '../../types';
import { MEAL_TYPES } from '../../types';
import { toIngredient } from '../ingredients';

/** Pull the first JSON object/array out of a model reply (handles ```json fences and chatter). */
export function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], text];
  for (const c of candidates) {
    if (!c) continue;
    const s = c.trim();
    try { return JSON.parse(s); } catch { /* try slicing */ }
    const start = s.search(/[{[]/);
    if (start < 0) continue;
    const open = s[start], close = open === '{' ? '}' : ']';
    const end = s.lastIndexOf(close);
    if (end > start) { try { return JSON.parse(s.slice(start, end + 1)); } catch { /* next */ } }
  }
  throw new Error('The model didn’t return valid JSON.');
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, lo: number, hi: number): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : undefined;
};
const strList = (v: unknown, max = 60) => (Array.isArray(v) ? v.map(x => str(x)).filter(Boolean).slice(0, max) : []);

/** What the model is asked to produce for any "make me a recipe" feature. */
export const RECIPE_SCHEMA_HINT = `{
  "title": string,
  "description": string (one sentence),
  "servings": integer,
  "prepMin": integer, "cookMin": integer,
  "cuisine": string (e.g. "Lebanese"),
  "mealTypes": array of "breakfast"|"lunch"|"dinner"|"snack"|"dessert",
  "tags": array of short lowercase strings,
  "ingredients": array of strings, each like "500 g chicken thighs, diced" (quantity, unit, name, optional note). Use metric units (g, kg, ml, l, tsp, tbsp, cup).,
  "steps": array of strings, one action per step, include times ("simmer for 10 minutes"),
  "notes": string (optional)
}`;

export interface AIRecipeDraft {
  title: string; description: string; servings: number; prepMin: number; cookMin: number;
  cuisine: string; mealTypes: MealType[]; tags: string[]; ingredients: Ingredient[]; steps: string[]; notes?: string;
}

/** Validate + normalise a model's recipe JSON into the app's own shapes. Throws if unusable. */
export function toRecipeDraft(raw: unknown): AIRecipeDraft {
  const o = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | undefined;
  if (!o || typeof o !== 'object') throw new Error('No recipe found in the reply.');
  const title = str(o.title, 120);
  const ingLines = (Array.isArray(o.ingredients) ? o.ingredients : [])
    .map(x => (typeof x === 'string' ? x : x && typeof x === 'object' ? [(x as Record<string, unknown>).quantity ?? (x as Record<string, unknown>).qty, (x as Record<string, unknown>).unit, (x as Record<string, unknown>).name].filter(v => v !== undefined && v !== null && v !== '').join(' ') : ''))
    .map(s => String(s).trim()).filter(Boolean).slice(0, 60);
  const steps = strList(o.steps, 40);
  if (!title || ingLines.length === 0 || steps.length === 0) throw new Error('The recipe was missing a title, ingredients or steps.');
  const mealTypes = strList(o.mealTypes).map(s => s.toLowerCase()).filter((s): s is MealType => (MEAL_TYPES as string[]).includes(s));
  return {
    title,
    description: str(o.description, 300),
    servings: num(o.servings, 1, 40) ?? 2,
    prepMin: num(o.prepMin, 0, 600) ?? 10,
    cookMin: num(o.cookMin, 0, 1440) ?? 20,
    cuisine: str(o.cuisine, 40),
    mealTypes: mealTypes.length ? mealTypes : ['dinner'],
    tags: strList(o.tags, 8).map(t => t.toLowerCase()),
    ingredients: ingLines.map(l => toIngredient(l)),
    steps,
    notes: str(o.notes, 600) || undefined
  };
}

export function draftToRecipe(d: AIRecipeDraft, base: Recipe): Recipe {
  return { ...base, title: d.title, description: d.description, servings: d.servings, prepMin: d.prepMin, cookMin: d.cookMin, cuisine: d.cuisine, mealTypes: d.mealTypes, tags: [...new Set([...d.tags, 'ai'])], ingredients: d.ingredients, steps: d.steps, notes: d.notes ?? '' };
}
