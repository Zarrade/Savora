import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo } from 'react';
import { db, DEFAULT_SETTINGS } from './db';
import type { Recipe, Settings, Collection } from './types';

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get('settings'), []);
  return useMemo(() => ({ ...DEFAULT_SETTINGS, ...(s ?? {}) }), [s]);
}

export function useSettingsLoaded(): Settings | undefined {
  const s = useLiveQuery(() => db.settings.get('settings'), []);
  return useMemo(() => (s ? { ...DEFAULT_SETTINGS, ...s } : undefined), [s]);
}

export async function saveSettings(patch: Partial<Settings>) {
  const cur = (await db.settings.get('settings')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...cur, ...patch, id: 'settings' });
}

export function useRecipes(): Recipe[] | undefined {
  return useLiveQuery(() => db.recipes.orderBy('updatedAt').reverse().toArray(), []);
}

export function useRecipeMap(): Map<string, Recipe> {
  const list = useRecipes();
  return useMemo(() => new Map((list ?? []).map(r => [r.id, r])), [list]);
}

export function useCollections(): Collection[] {
  return useLiveQuery(() => db.collections.orderBy('name').toArray(), []) ?? [];
}

export async function updateRecipe(id: string, patch: Partial<Recipe>) {
  await db.recipes.update(id, { ...patch, updatedAt: Date.now() });
}

/** Apply light/dark theme from settings. */
export function useTheme(theme: Settings['theme']) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}
