import type { Ingredient } from '../types';
import { toIngredient } from './ingredients';

export interface ImportedRecipe {
  title: string;
  servings?: number;
  prepMin?: number;
  cookMin?: number;
  ingredients: Ingredient[];
  steps: string[];
  notes?: string;
  sourceUrl?: string;
  videoUrl?: string;
  // set by AI import
  description?: string;
  cuisine?: string;
  mealTypes?: import('../types').MealType[];
  tags?: string[];
}

const ING_HEAD = /^(ingredients?|you('| wi)ll need|what you need|shopping list)\b[:\s]*$/i;
const STEP_HEAD = /^(method|instructions?|directions?|steps?|preparation|how to (make|cook)( it)?|procedure)\b[:\s]*$/i;
const NOTE_HEAD = /^(notes?|tips?|chef'?s notes?)\b[:\s]*$/i;
const QTY_START = /^([-•*·▪●◦–—]\s*)?(\d|[½⅓⅔¼¾⅛]|a |an |one |two |three |four |five |six |half |pinch |handful |dash |few )/i;

function minutesFrom(text: string, label: RegExp): number | undefined {
  const m = text.match(new RegExp(`${label.source}[^\\n\\d]{0,20}(\\d+)\\s*(hours|hour|hrs|hr|h)?\\b(?:\\s*(\\d+)\\s*(minutes|mins|min|m))?`, 'i'));
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (m[2]) return n * 60 + (m[3] ? parseInt(m[3], 10) : 0);
  return n;
}

/**
 * Offline recipe import from pasted text (e.g. copied from a website,
 * a caption, a note or a message). Uses section headings when present,
 * otherwise falls back to line heuristics.
 */
export function parseRecipeText(text: string): ImportedRecipe {
  const urlMatch = text.match(/https?:\/\/\S+/);
  const raw = text.replace(/\r/g, '').split('\n').map(l => l.trim());
  const lines = raw.filter(l => l && !/^https?:\/\//.test(l));

  const servingsMatch = text.match(/\b(?:serves|servings|yield|makes|portions?)\s*:?\s*(\d+)/i) || text.match(/\b(\d+)\s*(?:servings|portions|people)\b/i);
  const prepMin = minutesFrom(text, /prep(?:aration)?(?:\s*time)?/);
  const cookMin = minutesFrom(text, /cook(?:ing)?(?:\s*time)?/);

  let title = '';
  const ingLines: { text: string; group?: string }[] = [];
  const steps: string[] = [];
  const notes: string[] = [];

  let section: 'none' | 'ing' | 'step' | 'note' = 'none';
  let group: string | undefined;
  const hasHeadings = lines.some(l => ING_HEAD.test(l)) || lines.some(l => STEP_HEAD.test(l));
  const metaLine = /^(serves|servings|yield|makes|prep|cook|total|time|calories|difficulty)\b/i;

  for (const l of lines) {
    if (ING_HEAD.test(l)) { section = 'ing'; group = undefined; continue; }
    if (STEP_HEAD.test(l)) { section = 'step'; continue; }
    if (NOTE_HEAD.test(l)) { section = 'note'; continue; }
    if (!title && section === 'none' && !metaLine.test(l) && !QTY_START.test(l) && l.length < 90) { title = l.replace(/^#+\s*/, ''); continue; }
    if (metaLine.test(l) && l.length < 60) continue;

    if (hasHeadings) {
      if (section === 'ing') {
        // "For the sauce:" style sub-headings
        if (/^(for (the )?.+|.+:)$/i.test(l) && !QTY_START.test(l) && l.length < 40) { group = l.replace(/:$/, ''); continue; }
        ingLines.push({ text: l, group });
      } else if (section === 'step') {
        steps.push(cleanStep(l));
      } else if (section === 'note') {
        notes.push(l);
      }
    } else {
      // heuristics: short lines starting with a quantity = ingredient, long sentences = steps
      const looksIngredient = (QTY_START.test(l) && l.length < 80 && !/\.\s+\w/.test(l)) || (l.length < 40 && !/[.!]$/.test(l) && steps.length === 0);
      if (looksIngredient && steps.length === 0) ingLines.push({ text: l });
      else steps.push(cleanStep(l));
    }
  }

  return {
    title: title || 'Imported recipe',
    servings: servingsMatch ? parseInt(servingsMatch[1], 10) : undefined,
    prepMin,
    cookMin,
    ingredients: ingLines.map(x => toIngredient(x.text, x.group)),
    steps: mergeStepFragments(steps),
    notes: notes.length ? notes.join('\n') : undefined,
    sourceUrl: urlMatch?.[0]
  };
}

function cleanStep(l: string): string {
  return l.replace(/^(step\s*\d+[:.)]?|\d+[.)]|[-•*·▪●◦–—])\s*/i, '').trim();
}

function mergeStepFragments(steps: string[]): string[] {
  const out: string[] = [];
  for (const s of steps) {
    if (!s) continue;
    // join very short fragments onto previous step
    if (out.length && s.length < 25 && !/[.!?]$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + s;
    else out.push(s);
  }
  return out;
}

/** Find durations in a step, e.g. "simmer for 10–12 minutes" → 600 s (uses the upper bound). */
export function findTimers(step: string): { label: string; seconds: number }[] {
  const out: { label: string; seconds: number }[] = [];
  const re = /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h|minutes?|mins?|seconds?|secs?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(step))) {
    const n = parseFloat(m[2] ?? m[1]);
    const u = m[3].toLowerCase();
    const secs = u.startsWith('h') ? n * 3600 : u.startsWith('s') ? n : n * 60;
    if (secs >= 10 && secs <= 24 * 3600) out.push({ label: m[0], seconds: Math.round(secs) });
  }
  return out;
}
