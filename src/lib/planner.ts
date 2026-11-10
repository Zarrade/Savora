import type { Recipe, PlanEntry, Settings, Slot, Diet, PlanOptions } from '../types';
import { recipeConflicts, recipeDiets, recipeNutrition } from './ingredients';
import { missingEquipment } from './kitchen';
import { planCost, recipeCost } from './pricing';
import { addDays, mondayIndex } from './util';

export interface GenerateOptions extends PlanOptions {
  dates: string[];               // days to plan
  slots: Slot[];
  servings: number;
  cookingDays: number[];         // 0=Mon…6=Sun
  keepFilled: boolean;           // only fill empty slots (don't replace unlocked ones)
}

const SLOT_SHARE: Record<Slot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.35, snack: 0.1 };

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function slotMatches(recipe: Recipe, slot: Slot): boolean {
  if (slot === 'snack') return recipe.mealTypes.includes('snack') || recipe.mealTypes.includes('dessert');
  return recipe.mealTypes.includes(slot);
}

/** Recipes that fit your allergies, foods you avoid, diet and kitchen. */
export function eligibleRecipes(recipes: Recipe[], settings: Settings): Recipe[] {
  const exclusions = [...settings.allergies, ...settings.avoid];
  return recipes.filter(r => {
    if (recipeConflicts(r, exclusions).length) return false;
    if (settings.equipment?.length && missingEquipment(r, settings.equipment).length) return false;
    if (settings.diets.length) {
      const d = new Set<Diet>(recipeDiets(r));
      for (const want of settings.diets) if (!d.has(want)) return false;
    }
    return true;
  });
}

function avgRating(r: Recipe): number {
  if (!r.reviews.length) return 0;
  return r.reviews.reduce((s, x) => s + x.rating, 0) / r.reviews.length;
}

const totalMin = (r: Recipe) => (r.prepMin || 0) + (r.cookMin || 0);
const isQuick = (r: Recipe) => totalMin(r) <= 15 || r.tags.includes('no-cook');

interface PickCtx {
  pool: Recipe[];
  settings: Settings;
  opts: Pick<GenerateOptions, 'respectTargets' | 'maxMinutes' | 'slots'>;
  used: Map<string, number>;
  rand: () => number;
  targetCost: number | null;   // AED per serving we'd like to stay under
}

function candidates(slot: Slot, cookDay: boolean, ctx: PickCtx, exclude: Set<string>): Recipe[] {
  let c = ctx.pool.filter(r => slotMatches(r, slot) && !exclude.has(r.id));
  if (!c.length) return [];
  if (!cookDay) {
    const quick = c.filter(isQuick);
    if (quick.length) c = quick;
  } else if (ctx.opts.maxMinutes && (slot === 'dinner' || slot === 'lunch')) {
    const capped = c.filter(r => totalMin(r) <= ctx.opts.maxMinutes!);
    if (capped.length) c = capped;
  }
  const fresh = c.filter(r => !ctx.used.has(r.id));
  return fresh.length ? fresh : c;
}

function weight(r: Recipe, slot: Slot, cuisinesToday: Set<string>, ctx: PickCtx): number {
  const s = ctx.settings;
  const shareTotal = ctx.opts.slots.reduce((a, sl) => a + SLOT_SHARE[sl], 0) || 1;
  let w = 1;
  if (r.favorite) w *= 3;
  const rating = avgRating(r);
  if (rating >= 4) w *= 2; else if (rating && rating < 3) w *= 0.4;
  if (r.lastCooked && Date.now() - new Date(r.lastCooked).getTime() < 7 * 864e5) w *= 0.5;
  if (cuisinesToday.has(r.cuisine)) w *= 0.6;
  if (ctx.opts.respectTargets && s.kcal > 0) {
    const budget = (s.kcal * SLOT_SHARE[slot]) / shareTotal;
    const kcal = recipeNutrition(r).perServing.kcal;
    if (kcal > 0) w *= Math.exp(-Math.abs(kcal - budget) / budget);
  }
  if (ctx.targetCost) {
    const cost = recipeCost(r, s.priceOverrides).perServing;
    if (cost > ctx.targetCost) w *= Math.exp((-1.5 * (cost - ctx.targetCost)) / ctx.targetCost);
  }
  return Math.max(w, 0.0001);
}

function weightedPick(list: Recipe[], weights: number[], rand: () => number): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let x = rand() * sum;
  for (let i = 0; i < list.length; i++) { x -= weights[i]; if (x <= 0) return i; }
  return list.length - 1;
}

function pick(slot: Slot, cookDay: boolean, cuisinesToday: Set<string>, ctx: PickCtx, exclude = new Set<string>()): Recipe | null {
  const c = candidates(slot, cookDay, ctx, exclude);
  if (!c.length) return null;
  return c[weightedPick(c, c.map(r => weight(r, slot, cuisinesToday, ctx)), ctx.rand)];
}

function targetCostPerServing(settings: Settings, opts: Pick<GenerateOptions, 'stayInBudget' | 'slots' | 'servings'>, alreadySpent: number, mealsToPlan: number): number | null {
  if (!opts.stayInBudget || !settings.weeklyBudget || mealsToPlan <= 0) return null;
  const left = Math.max(settings.weeklyBudget * 0.15, settings.weeklyBudget - alreadySpent);
  return left / (mealsToPlan * Math.max(1, opts.servings));
}

/* ------------------------------------------------------------ generate */

/**
 * Build a plan for the given dates. Locked entries (and, with keepFilled,
 * any existing entries) are preserved. `existing` should hold the whole week
 * so the budget can account for days you aren't regenerating.
 */
export function generatePlan(
  allRecipes: Recipe[],
  settings: Settings,
  existing: PlanEntry[],
  opts: GenerateOptions,
  seed = Date.now()
): { entries: PlanEntry[]; warnings: string[]; cost: number } {
  const rand = mulberry32(seed);
  const warnings: string[] = [];
  const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
  let pool = eligibleRecipes(allRecipes, settings);
  if (opts.favoritesOnly) {
    const favs = pool.filter(r => r.favorite);
    if (favs.length >= 3) pool = favs;
    else warnings.push('Not enough favourites yet — mixed in other recipes.');
  }
  const inRange = existing.filter(e => opts.dates.includes(e.date));
  const outside = existing.filter(e => !opts.dates.includes(e.date));
  if (!pool.length) {
    return { entries: inRange, warnings: ['No recipes match your allergies, foods to avoid, diet and kitchen settings.'], cost: planCost(existing, recipeMap, settings.priceOverrides) };
  }

  const keep = inRange
    .filter(e => opts.slots.includes(e.slot) && (e.locked || opts.keepFilled))
    .map(e => ({ ...e }));
  const untouched = inRange.filter(e => !opts.slots.includes(e.slot));
  const keepKey = new Set(keep.map(e => `${e.date}|${e.slot}`));
  const used = new Map<string, number>();
  [...outside, ...keep, ...untouched].forEach(e => e.recipeId && used.set(e.recipeId, (used.get(e.recipeId) ?? 0) + 1));

  const toFill = opts.dates.length * opts.slots.length - keep.length;
  const spent = planCost([...outside, ...keep, ...untouched], recipeMap, settings.priceOverrides);
  const ctx: PickCtx = {
    pool, settings, opts, used, rand,
    targetCost: targetCostPerServing(settings, opts, spent, opts.leftoverLunches ? toFill * 0.75 : toFill)
  };

  const out: PlanEntry[] = [...untouched, ...keep];
  const generated = new Set<string>();
  let lastDinner: PlanEntry | null = null;
  const sortedDates = [...opts.dates].sort();

  for (const date of sortedDates) {
    const dow = mondayIndex(date);
    const cookDay = opts.cookingDays.includes(dow);
    const cuisinesToday = new Set<string>();
    for (const slot of opts.slots) {
      if (keepKey.has(`${date}|${slot}`)) {
        const kept = keep.find(e => e.date === date && e.slot === slot);
        const r = kept?.recipeId ? recipeMap.get(kept.recipeId) : undefined;
        if (r) cuisinesToday.add(r.cuisine);
        if (slot === 'dinner' && kept && !kept.leftover) lastDinner = kept;
        continue;
      }
      const useLeftover =
        lastDinner?.recipeId &&
        ((slot === 'lunch' && opts.leftoverLunches && lastDinner.date === addDays(date, -1)) ||
          (!cookDay && (slot === 'dinner' || slot === 'lunch')));
      if (useLeftover && lastDinner) {
        lastDinner.servings += opts.servings;
        const e: PlanEntry = { id: `${date}|${slot}`, date, slot, recipeId: lastDinner.recipeId, servings: opts.servings, locked: false, leftover: true, leftoverOf: lastDinner.id };
        out.push(e);
        continue;
      }
      const r = pick(slot, cookDay, cuisinesToday, ctx);
      if (!r) { warnings.push(`No ${slot} recipes fit your settings — add some or loosen filters.`); continue; }
      used.set(r.id, (used.get(r.id) ?? 0) + 1);
      cuisinesToday.add(r.cuisine);
      const entry: PlanEntry = { id: `${date}|${slot}`, date, slot, recipeId: r.id, servings: opts.servings, locked: false };
      out.push(entry);
      generated.add(entry.id);
      if (slot === 'dinner') lastDinner = entry;
    }
  }

  // Budget: swap the priciest generated meals for cheaper ones until we fit
  let total = planCost([...outside, ...out], recipeMap, settings.priceOverrides);
  if (opts.stayInBudget && settings.weeklyBudget > 0 && total > settings.weeklyBudget) {
    const costOf = (e: PlanEntry) => (e.recipeId ? recipeCost(recipeMap.get(e.recipeId)!, settings.priceOverrides).perServing * e.servings : 0);
    for (let guard = 0; guard < 40 && total > settings.weeklyBudget; guard++) {
      const swappable = out.filter(e => generated.has(e.id) && !e.leftover).sort((a, b) => costOf(b) - costOf(a));
      let improved = false;
      for (const e of swappable) {
        const cur = recipeMap.get(e.recipeId!)!;
        const curPer = recipeCost(cur, settings.priceOverrides).perServing;
        const cheaper = pool
          .filter(r => slotMatches(r, e.slot) && r.id !== cur.id && !used.has(r.id) && recipeCost(r, settings.priceOverrides).perServing < curPer * 0.85)
          .sort((a, b) => recipeCost(a, settings.priceOverrides).perServing - recipeCost(b, settings.priceOverrides).perServing);
        const next = cheaper[Math.floor(rand() * Math.min(3, cheaper.length))];
        if (!next) continue;
        used.delete(cur.id);
        used.set(next.id, 1);
        e.recipeId = next.id;
        out.forEach(x => { if (x.leftoverOf === e.id) x.recipeId = next.id; });
        improved = true;
        break;
      }
      if (!improved) break;
      total = planCost([...outside, ...out], recipeMap, settings.priceOverrides);
    }
    if (total > settings.weeklyBudget) warnings.push(`This plan is about ${Math.round(total - settings.weeklyBudget)} ${settings.currency} over your weekly budget — try fewer meals or more cheap favourites.`);
  }
  return { entries: out, warnings: Array.from(new Set(warnings)), cost: total };
}

/* ---------------------------------------------------------- regenerate */

/** A few good alternatives for a slot, best-weighted first. */
export function suggestRecipes(allRecipes: Recipe[], settings: Settings, week: PlanEntry[], slot: Slot, date: string, exclude: string[] = [], n = 4): Recipe[] {
  const pool = eligibleRecipes(allRecipes, settings);
  const used = new Map<string, number>();
  week.forEach(e => e.recipeId && used.set(e.recipeId, 1));
  const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
  const spent = planCost(week.filter(e => !(e.date === date && e.slot === slot)), recipeMap, settings.priceOverrides);
  const po = settings.planOptions;
  const ctx: PickCtx = {
    pool, settings, used, rand: Math.random,
    opts: { respectTargets: po.respectTargets, maxMinutes: po.maxMinutes, slots: settings.planSlots },
    targetCost: targetCostPerServing(settings, { stayInBudget: po.stayInBudget, slots: settings.planSlots, servings: settings.householdServings }, spent, Math.max(1, 7 * settings.planSlots.length - week.length + 1))
  };
  const cookDay = settings.cookingDays.includes(mondayIndex(date));
  const cuisinesToday = new Set(week.filter(e => e.date === date && e.recipeId).map(e => recipeMap.get(e.recipeId!)?.cuisine ?? ''));
  const ex = new Set(exclude);
  const out: Recipe[] = [];
  for (let i = 0; i < n; i++) {
    const r = pick(slot, cookDay, cuisinesToday, ctx, ex);
    if (!r) break;
    out.push(r);
    ex.add(r.id);
  }
  return out;
}

/**
 * Give a single planned meal a new recipe. Returns the entries to save
 * (the meal itself plus any linked leftovers), or null if nothing fits.
 */
export function regenerateEntry(allRecipes: Recipe[], settings: Settings, week: PlanEntry[], entry: PlanEntry): PlanEntry[] | null {
  if (entry.locked) return null;
  const [next] = suggestRecipes(allRecipes, settings, week, entry.slot, entry.date, entry.recipeId ? [entry.recipeId] : [], 1);
  if (!next) return null;
  return applyRecipe(week, entry, next.id);
}

/** Put a recipe on an entry, keeping leftovers consistent. */
export function applyRecipe(week: PlanEntry[], entry: PlanEntry, recipeId: string): PlanEntry[] {
  const changes: PlanEntry[] = [];
  const updated: PlanEntry = { ...entry, recipeId, customText: undefined, leftover: false, leftoverOf: undefined };
  changes.push(updated);
  // This was a leftover portion: the original cook no longer needs to make extra
  if (entry.leftover && entry.leftoverOf) {
    const src = week.find(e => e.id === entry.leftoverOf);
    if (src) changes.push({ ...src, servings: Math.max(1, src.servings - entry.servings) });
  }
  // Leftovers made from this meal follow the new recipe
  for (const e of week) if (e.leftoverOf === entry.id) changes.push({ ...e, recipeId });
  return changes;
}

/** After bulk changes, point leftovers at their source's recipe (or make them normal meals if the source is gone). */
export function repairLeftovers(week: PlanEntry[]): PlanEntry[] {
  const byId = new Map(week.map(e => [e.id, e]));
  const fixes: PlanEntry[] = [];
  for (const e of week) {
    if (!e.leftoverOf) continue;
    const src = byId.get(e.leftoverOf);
    if (!src || !src.recipeId) fixes.push({ ...e, leftover: false, leftoverOf: undefined });
    else if (src.recipeId !== e.recipeId) fixes.push({ ...e, recipeId: src.recipeId });
  }
  return fixes;
}

/* ------------------------------------------------------- targets (BMR) */

export function autoTargets(s: Pick<Settings, 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activity' | 'goal'>) {
  // Mifflin–St Jeor
  const bmr = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age + (s.sex === 'male' ? 5 : -161);
  let kcal = bmr * s.activity;
  if (s.goal === 'lose') kcal -= 450;
  if (s.goal === 'gain') kcal += 300;
  kcal = Math.round(kcal / 10) * 10;
  const protein = Math.round(s.weightKg * (s.goal === 'maintain' ? 1.6 : 1.8));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}
