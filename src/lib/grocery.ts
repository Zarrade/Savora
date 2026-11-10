import type { GroceryItem, Ingredient, PlanEntry, Recipe } from '../types';
import { aisleFor, fmtQty, unitLabel } from './ingredients';
import { uid } from './util';

const MASS: Record<string, number> = { g: 1, kg: 1000, mg: 0.001, oz: 28.35, lb: 453.6 };
const VOL: Record<string, number> = { ml: 1, l: 1000, tsp: 4.93, tbsp: 14.79, cup: 240, floz: 29.57, pinch: 0.31, dash: 0.62 };

const PREP = /\b(fresh|freshly|chopped|finely|roughly|thinly|sliced|diced|minced|grated|crushed|peeled|large|small|medium|ripe|halved|quartered|cubed|shredded|toasted|softened|melted|beaten|very|cut into [a-z ]+|to serve|drained|rinsed|pitted)\b/gi;

export function cleanName(name: string): string {
  return name.toLowerCase().replace(PREP, ' ').replace(/\s+/g, ' ').trim();
}

export function itemKey(name: string): string {
  let k = cleanName(name);
  if (k.endsWith('oes')) k = k.slice(0, -2);
  else if (k.endsWith('s') && !k.endsWith('ss')) k = k.slice(0, -1);
  return k;
}

const SKIP = /^(water|boiling water|cold water|warm water|hot water|ice|ice cubes)$/i;

interface Acc { key: string; name: string; base: 'g' | 'ml' | string; amount: number | null; aisle: string; recipes: Set<string> }

function addTo(map: Map<string, Acc>, ing: Pick<Ingredient, 'name' | 'qty' | 'unit'>, scale: number, recipeTitle: string) {
  const name = cleanName(ing.name) || ing.name.toLowerCase();
  if (SKIP.test(name)) return;
  let base: string = ing.unit || 'each';
  let amount: number | null = ing.qty === null ? null : ing.qty * scale;
  if (MASS[ing.unit] !== undefined) { base = 'g'; amount = amount === null ? null : amount * MASS[ing.unit]; }
  else if (VOL[ing.unit] !== undefined) { base = 'ml'; amount = amount === null ? null : amount * VOL[ing.unit]; }
  const key = `${itemKey(ing.name)}|${base}`;
  const cur = map.get(key);
  if (cur) {
    if (amount !== null) cur.amount = (cur.amount ?? 0) + amount;
    cur.recipes.add(recipeTitle);
  } else {
    map.set(key, { key, name, base, amount, aisle: aisleFor(ing.name), recipes: new Set([recipeTitle]) });
  }
}

/** Convert accumulated base units back into friendly units. */
function finalise(a: Acc): { qty: number | null; unit: string } {
  if (a.amount === null) return { qty: null, unit: a.base === 'each' ? '' : a.base === 'g' || a.base === 'ml' ? '' : a.base };
  if (a.base === 'g') return a.amount >= 1000 ? { qty: round(a.amount / 1000, 2), unit: 'kg' } : { qty: niceRound(a.amount), unit: 'g' };
  if (a.base === 'ml') {
    const quarter = (x: number) => Math.max(0.25, Math.round(x * 4) / 4);
    if (a.amount < 15) return { qty: quarter(a.amount / 4.93), unit: 'tsp' };
    if (a.amount < 60) return { qty: quarter(a.amount / 14.79), unit: 'tbsp' };
    return a.amount >= 1000 ? { qty: round(a.amount / 1000, 2), unit: 'l' } : { qty: niceRound(a.amount), unit: 'ml' };
  }
  // whole items (onions, cans, cloves…) — you can't buy ⅔ of a carrot
  const roundUp = ['each', 'clove', 'can', 'head', 'fillet', 'bunch', 'packet', 'jar', 'block', 'punnet', 'slice', 'stalk', 'sachet', 'piece', 'thumb', 'handful', 'sprig', 'scoop', 'knob'];
  const q = roundUp.includes(a.base) ? Math.max(1, Math.ceil(a.amount - 0.05)) : round(a.amount, 2);
  return { qty: q, unit: a.base === 'each' ? '' : a.base };
}

function round(n: number, dp: number) { const f = 10 ** dp; return Math.round(n * f) / f; }
function niceRound(n: number) { return n < 10 ? round(n, 1) : n < 100 ? Math.round(n) : Math.round(n / 5) * 5; }

/** True if the ingredient is one of the user's pantry staples (always in stock). */
export function isPantry(name: string, pantry: string[]): boolean {
  const k = itemKey(name);
  return pantry.some(p => { const pk = itemKey(p); return pk && (k === pk || k.endsWith(` ${pk}`) || k.startsWith(`${pk} `)); });
}

/** Aggregate ingredients for plan entries (leftover entries are skipped — their portion is in the cook entry). */
export function groceriesFromPlan(entries: PlanEntry[], recipes: Map<string, Recipe>, pantry: string[] = []): Omit<GroceryItem, 'id' | 'createdAt'>[] {
  const map = new Map<string, Acc>();
  for (const e of entries) {
    if (e.leftover || !e.recipeId) continue;
    const r = recipes.get(e.recipeId);
    if (!r) continue;
    const scale = e.servings / Math.max(1, r.servings);
    for (const ing of r.ingredients) if (!isPantry(ing.name, pantry)) addTo(map, ing, scale, r.title);
  }
  return toItems(map);
}

export function groceriesFromIngredients(items: { ing: Pick<Ingredient, 'name' | 'qty' | 'unit'>; scale: number; recipe: string }[]) {
  const map = new Map<string, Acc>();
  for (const it of items) addTo(map, it.ing, it.scale, it.recipe);
  return toItems(map);
}

function toItems(map: Map<string, Acc>): Omit<GroceryItem, 'id' | 'createdAt'>[] {
  return Array.from(map.values()).map(a => {
    const { qty, unit } = finalise(a);
    return { name: a.name, qty, unit, aisle: a.aisle, checked: false, fromRecipes: Array.from(a.recipes), manual: false };
  });
}

/** Merge new items into an existing list (same name + compatible unit are summed). */
export function mergeInto(existing: GroceryItem[], incoming: Omit<GroceryItem, 'id' | 'createdAt'>[]): { put: GroceryItem[] } {
  const put: GroceryItem[] = [];
  const now = Date.now();
  const byKey = new Map<string, GroceryItem>();
  for (const e of existing) if (!e.checked) byKey.set(`${itemKey(e.name)}|${unitFamily(e.unit)}`, e);
  incoming.forEach((n, i) => {
    const k = `${itemKey(n.name)}|${unitFamily(n.unit)}`;
    const cur = byKey.get(k);
    if (cur) {
      const merged: GroceryItem = { ...cur, fromPlan: cur.fromPlan ?? n.fromPlan, fromRecipes: Array.from(new Set([...cur.fromRecipes, ...n.fromRecipes])) };
      if (n.qty !== null) {
        const a = toBase(cur.qty, cur.unit), b = toBase(n.qty, n.unit);
        if (a !== null && b !== null && unitFamily(cur.unit) !== 'count') {
          const sum = a + b;
          const fam = unitFamily(cur.unit);
          const f = finalise({ key: k, name: cur.name, base: fam === 'mass' ? 'g' : 'ml', amount: sum, aisle: cur.aisle, recipes: new Set() });
          merged.qty = f.qty; merged.unit = f.unit;
        } else {
          merged.qty = (cur.qty ?? 0) + n.qty;
        }
      }
      byKey.set(k, merged);
      put.push(merged);
    } else {
      const item: GroceryItem = { ...n, id: uid(), createdAt: now + i };
      byKey.set(k, item);
      put.push(item);
    }
  });
  return { put };
}

function unitFamily(u: string): string {
  if (MASS[u] !== undefined) return 'mass';
  if (VOL[u] !== undefined) return 'vol';
  return u ? `count:${u}` : 'count';
}
function toBase(q: number | null, u: string): number | null {
  if (q === null) return null;
  if (MASS[u] !== undefined) return q * MASS[u];
  if (VOL[u] !== undefined) return q * VOL[u];
  return q;
}

export function fmtGrocery(item: Pick<GroceryItem, 'qty' | 'unit'>): string {
  if (item.qty === null) return '';
  return [fmtQty(item.qty), unitLabel(item.unit, item.qty)].filter(Boolean).join(' ');
}
