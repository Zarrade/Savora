import Dexie, { type Table } from 'dexie';
import type { Recipe, PlanEntry, GroceryItem, Collection, Settings, Ingredient, StockItem } from './types';
import type { SeedRecipe } from './data/seedRecipes';
import { ALL_SEEDS, SEED_VERSION, SEEDS_BY_VERSION } from './data/seeds';
import { MORE_BATCH_IDS, loadBatch } from './data/moreSeeds';
import { toIngredient } from './lib/ingredients';
import { autoTargets } from './lib/planner';
import { DEFAULT_EQUIPMENT } from './lib/kitchen';
import { TABLE_KIND, isUntracked, markUntracked, recordChange, recordRescan } from './lib/outbox';

class SavoraDB extends Dexie {
  recipes!: Table<Recipe, string>;
  plan!: Table<PlanEntry, string>;
  grocery!: Table<GroceryItem, string>;
  collections!: Table<Collection, string>;
  settings!: Table<Settings, string>;
  stock!: Table<StockItem, string>;

  constructor() {
    super('savora');
    this.version(1).stores({
      recipes: 'id, title, cuisine, favorite, updatedAt, *mealTypes, *collections',
      plan: 'id, date, slot, recipeId',
      grocery: 'id, aisle, checked, createdAt',
      collections: 'id, name',
      settings: 'id'
    });
    // v2: "At home" list
    this.version(2).stores({ stock: 'id, aisle, name, updatedAt' });
    // Sync middleware: note every change to a synced table in the outbox (see lib/outbox.ts)
    this.use({
      stack: 'dbcore',
      name: 'savora-sync',
      create: down => ({
        ...down,
        table: name => {
          const t = down.table(name);
          const kind = TABLE_KIND[name];
          if (!kind) return t;
          return {
            ...t,
            mutate: async req => {
              const res = await t.mutate(req);
              if (isUntracked(req.trans as object)) return res;
              const ts = Date.now();
              if (req.type === 'add' || req.type === 'put') {
                const keys: unknown[] = res.results ?? req.keys ?? (req.type === 'put' ? req.updates?.keys : undefined) ?? req.values.map(v => (v as { id?: unknown })?.id);
                if (keys?.length && keys.every(k => k !== undefined)) recordChange(kind, keys, ts);
                else recordRescan(kind);
              } else if (req.type === 'delete') {
                if (req.keys?.length) recordChange(kind, req.keys, ts); else recordRescan(kind);
              } else {
                recordRescan(kind); // deleteRange, e.g. table.clear()
              }
              return res;
            }
          };
        }
      })
    });
  }
}

export const db = new SavoraDB();

export const ALL_TABLES = () => [db.recipes, db.plan, db.grocery, db.collections, db.settings, db.stock];

/** Run writes that must NOT be uploaded (seeding, automatic photos, applying cloud changes). */
export function untracked<T>(fn: () => Promise<T>): Promise<T> {
  return db.transaction('rw', ALL_TABLES(), async tx => {
    markUntracked(tx.idbtrans);
    return fn();
  });
}

/** Empty every table without syncing the deletions (used on sign-out / switching account). */
export async function wipeLocal(): Promise<void> {
  await untracked(async () => { await Promise.all(ALL_TABLES().map(t => t.clear())); });
}

const BASE_PROFILE = { sex: 'male' as const, age: 30, heightCm: 175, weightKg: 75, activity: 1.55, goal: 'maintain' as const };

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  ...autoTargets(BASE_PROFILE),
  name: '',
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 1.55,
  goal: 'maintain',
  targetsMode: 'auto',
  allergies: [],
  avoid: [],
  diets: [],
  pantry: ['salt', 'black pepper', 'water'],
  cookingDays: [0, 1, 2, 3, 4, 5, 6],
  planSlots: ['breakfast', 'lunch', 'dinner'],
  householdServings: 2,
  weekStart: 1,
  theme: 'system',
  onboarded: false,
  equipment: [...DEFAULT_EQUIPMENT],
  weeklyBudget: 0,
  currency: 'AED',
  priceOverrides: {},
  planOptions: { leftoverLunches: false, respectTargets: true, stayInBudget: true, favoritesOnly: false, maxMinutes: null }
};

export function seedToRecipe(s: SeedRecipe, now = Date.now()): Recipe {
  const ingredients: Ingredient[] = [];
  let group: string | undefined;
  for (const line of s.ingredients) {
    if (line.startsWith('## ')) { group = line.slice(3).trim(); continue; }
    ingredients.push(toIngredient(line, group));
  }
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    emoji: s.emoji,
    servings: s.servings,
    prepMin: s.prepMin,
    cookMin: s.cookMin,
    cuisine: s.cuisine,
    mealTypes: s.mealTypes,
    tags: s.tags,
    ingredients,
    steps: s.steps,
    notes: s.notes,
    favorite: false,
    builtIn: true,
    collections: [],
    reviews: [],
    cookedCount: 0,
    createdAt: now,
    updatedAt: now
  };
}

/** First-run setup: settings + starter recipes + default collections. */
export async function ensureSeeded(): Promise<void> {
  await untracked(async () => {
    const s = await db.settings.get('settings');
    const now = Date.now();
    if (!s) {
      try { localStorage.removeItem(MORE_KEY); } catch { /* storage blocked */ }   // fresh database: install every batch again
      await db.settings.put({ ...DEFAULT_SETTINGS, seedVersion: SEED_VERSION });
      if ((await db.recipes.count()) === 0) {
        await db.recipes.bulkPut(ALL_SEEDS.map((r, i) => seedToRecipe(r, now - i)));
        await db.collections.bulkPut([
          { id: 'col-weeknight', name: 'Weeknight', emoji: 'bolt', createdAt: now },
          { id: 'col-mealprep', name: 'Meal prep', emoji: 'box', createdAt: now + 1 },
          { id: 'col-guests', name: 'For guests', emoji: 'party', createdAt: now + 2 }
        ]);
      }
      return;
    }
    // Existing install: add starter recipes from newer batches (never re-adds older ones you deleted)
    const have = s.seedVersion ?? 1;
    if (have < SEED_VERSION) {
      const existing = new Set(await db.recipes.toCollection().primaryKeys());
      const fresh = [];
      for (let v = have + 1; v <= SEED_VERSION; v++) {
        for (const r of SEEDS_BY_VERSION[v] ?? []) if (!existing.has(r.id)) fresh.push(seedToRecipe(r, now));
      }
      await db.recipes.bulkPut(fresh);
      await db.settings.put({ ...s, seedVersion: SEED_VERSION });
    }
  });
}

/* ------------------------------------------------------- more starter recipes */

const MORE_KEY = 'savora-seed-batches'; // per device: which extra batches were installed here
function installedBatches(): string[] { try { return JSON.parse(localStorage.getItem(MORE_KEY) || '[]'); } catch { return []; } }

/**
 * Install extra starter-recipe batches in the background (never blocks startup).
 * A batch is installed once per device, so recipes you delete stay deleted;
 * deletions made on other devices arrive through sync.
 */
export async function seedMore(onProgress?: (added: number) => void): Promise<number> {
  const done = new Set(installedBatches());
  let added = 0;
  for (const id of MORE_BATCH_IDS) {
    if (done.has(id)) continue;
    const seeds = await loadBatch(id);
    const now = Date.now();
    await untracked(async () => {
      const existing = new Set(await db.recipes.where('id').anyOf(seeds.map(s => s.id)).primaryKeys());
      const fresh = seeds.filter(s => !existing.has(s.id)).map((s, i) => seedToRecipe(s, now - i));
      await db.recipes.bulkAdd(fresh);
      added += fresh.length;
    });
    done.add(id);
    try { localStorage.setItem(MORE_KEY, JSON.stringify([...done])); } catch { /* storage blocked */ }
    onProgress?.(added);
  }
  return added;
}

/** Re-add any starter recipes the user deleted (does not overwrite edits). */
export async function restoreStarterRecipes(): Promise<number> {
  const existing = new Set(await db.recipes.toCollection().primaryKeys());
  const all = [...ALL_SEEDS];
  for (const id of MORE_BATCH_IDS) all.push(...(await loadBatch(id)));
  const missing = all.filter(r => !existing.has(r.id)).map(r => seedToRecipe(r));
  await untracked(async () => { await db.recipes.bulkPut(missing); });
  return missing.length;
}

/* ------------------------------------------------------------- backup */

export interface Backup {
  app: 'savora' | 'mise';
  version: 1;
  exportedAt: string;
  recipes: Recipe[];
  plan: PlanEntry[];
  grocery: GroceryItem[];
  collections: Collection[];
  settings: Settings[];
  stock?: StockItem[];
}

export async function exportAll(): Promise<Backup> {
  return {
    app: 'savora',
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await db.recipes.toArray(),
    plan: await db.plan.toArray(),
    grocery: await db.grocery.toArray(),
    collections: await db.collections.toArray(),
    settings: await db.settings.toArray(),
    stock: await db.stock.toArray()
  };
}

export async function importAll(data: Backup, mode: 'replace' | 'merge'): Promise<void> {
  if ((data?.app !== 'savora' && data?.app !== 'mise') || !Array.isArray(data.recipes)) throw new Error('This file is not a Savora (or Mise) backup.');
  await db.transaction('rw', ALL_TABLES(), async () => {
    if (mode === 'replace') {
      // keyed deletes (not clear()) so a signed-in account gets proper deletions synced
      await Promise.all(ALL_TABLES().map(async t => t.bulkDelete(await t.toCollection().primaryKeys())));
    }
    await db.recipes.bulkPut(data.recipes);
    await db.plan.bulkPut(data.plan ?? []);
    await db.grocery.bulkPut(data.grocery ?? []);
    await db.collections.bulkPut(data.collections ?? []);
    if (data.settings?.length) await db.settings.bulkPut(data.settings);
    if (data.stock?.length) await db.stock.bulkPut(data.stock);
    if (!(await db.settings.get('settings'))) await db.settings.put(DEFAULT_SETTINGS);
  });
}

export async function wipeAll(): Promise<void> {
  await db.delete();
  location.reload();
}
