import { db } from '../db';
import type { GroceryItem, StockItem } from '../types';
import { aisleFor, parseIngredientLine } from './ingredients';
import { itemKey } from './grocery';
import { uid } from './util';

/** Add things you have (merging with what's already there). */
export async function addToStock(items: { name: string; qty: number | null; unit: string; aisle?: string }[]) {
  const existing = await db.stock.toArray();
  const byKey = new Map(existing.map(s => [itemKey(s.name), s]));
  const now = Date.now();
  const put: StockItem[] = [];
  for (const it of items) {
    const name = it.name.trim().toLowerCase();
    if (!name) continue;
    const k = itemKey(name);
    const cur = byKey.get(k);
    if (cur) {
      const qty = cur.qty !== null && it.qty !== null && cur.unit === it.unit ? +(cur.qty + it.qty).toFixed(2) : (it.qty ?? cur.qty);
      const next = { ...cur, qty, unit: cur.unit === it.unit || it.qty === null ? cur.unit : it.unit, updatedAt: now };
      byKey.set(k, next); put.push(next);
    } else {
      const next: StockItem = { id: uid(), name, qty: it.qty, unit: it.unit, aisle: it.aisle ?? aisleFor(name), addedAt: now, updatedAt: now };
      byKey.set(k, next); put.push(next);
    }
  }
  if (put.length) await db.stock.bulkPut(put);
  return put.length;
}

export async function addStockText(raw: string) {
  const parts = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  return addToStock(parts.map(p => { const l = parseIngredientLine(p); return { name: l.name, qty: l.qty, unit: l.unit }; }));
}

/** Ticked groceries → At home, removed from the shopping list. */
export async function putAway(items: GroceryItem[]) {
  if (!items.length) return 0;
  await addToStock(items.map(i => ({ name: i.name, qty: i.qty, unit: i.unit, aisle: i.aisle })));
  await db.grocery.bulkDelete(items.map(i => i.id));
  return items.length;
}

/** Ran out of something: remove it from At home and put it back on the shopping list. */
export async function backToList(item: StockItem) {
  const existing = await db.grocery.toArray();
  if (!existing.some(g => itemKey(g.name) === itemKey(item.name) && !g.checked)) {
    await db.grocery.put({ id: uid(), name: item.name, qty: null, unit: '', aisle: item.aisle, checked: false, fromRecipes: [], manual: true, createdAt: Date.now() });
  }
  await db.stock.delete(item.id);
}
