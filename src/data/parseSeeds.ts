import type { MealType } from '../types';
import type { SeedRecipe } from './seedRecipes';

/**
 * Compact starter-recipe format (one block per recipe):
 *   @ Title | Cuisine | breakfast,lunch | serves | prepMin | cookMin | icon | tag,tag
 *   = One-line description
 *   - ingredient line            ("- ## Heading" starts an ingredient group)
 *   * step
 *   ! optional note
 */
export function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function parseSeeds(text: string): SeedRecipe[] {
  const out: SeedRecipe[] = [];
  let cur: SeedRecipe | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const tag = line[0], rest = line.slice(1).trim();
    if (tag === '@') {
      const [title, cuisine, meals, serves, prep, cook, icon, tags] = rest.split('|').map(s => s.trim());
      cur = {
        id: `seed-${slugify(title)}`, title, cuisine, emoji: icon || 'plate', description: '',
        mealTypes: (meals || 'dinner').split(',').map(s => s.trim()).filter(Boolean) as MealType[],
        servings: Number(serves) || 2, prepMin: Number(prep) || 0, cookMin: Number(cook) || 0,
        tags: (tags || '').split(',').map(s => s.trim()).filter(Boolean), ingredients: [], steps: []
      };
      out.push(cur);
    } else if (cur) {
      if (tag === '=') cur.description = rest;
      else if (tag === '-') cur.ingredients.push(rest);
      else if (tag === '*') cur.steps.push(rest);
      else if (tag === '!') cur.notes = rest;
    }
  }
  return out;
}
