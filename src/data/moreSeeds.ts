import { parseSeeds } from './parseSeeds';
import type { SeedRecipe } from './seedRecipes';

/**
 * Extra starter recipes, loaded in the background after the app opens (separate chunks,
 * cached for offline use by the service worker). Add a batch file and list it here.
 */
const BATCHES = import.meta.glob('./more/*.txt', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export const MORE_BATCH_IDS = Object.keys(BATCHES).map(p => p.replace(/^.*\/|\.txt$/g, '')).sort();

export async function loadBatch(id: string): Promise<SeedRecipe[]> {
  const loader = BATCHES[`./more/${id}.txt`];
  return loader ? parseSeeds(await loader()) : [];
}
