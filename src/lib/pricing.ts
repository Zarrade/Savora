import { PRICES, AISLE_PRICE } from '../data/prices';
import { matchFood, toGrams } from './ingredients';
import { itemKey } from './grocery';
import type { GroceryItem, PlanEntry, Recipe } from '../types';

export type Overrides = Record<string, number>;

/** AED per gram for an ingredient name (your saved price wins). */
export function pricePerGram(name: string, overrides: Overrides = {}): number | null {
  const own = overrides[itemKey(name)];
  if (own !== undefined) return own / 1000;
  const food = matchFood(name);
  if (!food) return null;
  const p = PRICES[food.k[0]] ?? AISLE_PRICE[food.a];
  return p / 1000;
}

/** Estimated cost of an amount of an ingredient. null = can't estimate. */
export function ingredientCost(name: string, qty: number | null, unit: string, overrides: Overrides = {}): number | null {
  if (qty === null) return 0; // "to taste" — negligible
  const food = matchFood(name);
  const own = overrides[itemKey(name)];
  const g = toGrams(qty, unit, food);
  if (g === null) {
    // per-item override for things we can't weigh
    if (own !== undefined && !food) return own * qty;
    return null;
  }
  const ppg = pricePerGram(name, overrides);
  return ppg === null ? null : g * ppg;
}

export interface CostResult { total: number; perServing: number; unknown: string[] }
const cache = new Map<string, CostResult>();

export function recipeCost(r: Pick<Recipe, 'id' | 'updatedAt' | 'servings' | 'ingredients'>, overrides: Overrides = {}): CostResult {
  const key = `${r.id}:${r.updatedAt}:${r.servings}:${JSON.stringify(overrides)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let total = 0;
  const unknown: string[] = [];
  for (const i of r.ingredients) {
    const c = ingredientCost(i.name, i.qty, i.unit, overrides);
    if (c === null) unknown.push(i.name); else total += c;
  }
  const res = { total, perServing: total / Math.max(1, r.servings), unknown };
  if (cache.size > 1000) cache.clear();
  cache.set(key, res);
  return res;
}

/** Cost of what you'll cook for a set of plan entries (leftovers are already counted in the cook). */
export function planCost(entries: PlanEntry[], recipes: Map<string, Recipe>, overrides: Overrides = {}): number {
  let sum = 0;
  for (const e of entries) {
    if (e.leftover || !e.recipeId) continue;
    const r = recipes.get(e.recipeId);
    if (!r) continue;
    sum += recipeCost(r, overrides).perServing * e.servings;
  }
  return sum;
}

export function groceryItemCost(item: Pick<GroceryItem, 'name' | 'qty' | 'unit' | 'price'>, overrides: Overrides = {}): number | null {
  if (item.price !== undefined && item.price !== null) return item.price;
  return ingredientCost(item.name, item.qty, item.unit, overrides);
}

export function fmtMoney(n: number, currency = 'AED', decimals?: number): string {
  const d = decimals ?? (n < 10 ? 1 : 0);
  const v = n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${currency} ${v}`;
}
