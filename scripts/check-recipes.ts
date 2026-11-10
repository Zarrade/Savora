// Validate starter-recipe batches: npx tsx scripts/check-recipes.ts
import { readFileSync, readdirSync } from 'node:fs';
import { parseSeeds } from '../src/data/parseSeeds';
import { ALL_SEEDS } from '../src/data/seeds';
import { SAVORA_ICON_NAMES } from '../src/components/SavoraIcons';
import { matchFood, parseIngredientLine } from '../src/lib/ingredients';

const icons = new Set(SAVORA_ICON_NAMES);
const meals = new Set(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);
const ids = new Map<string, string>(ALL_SEEDS.map(s => [s.id, 'bundled']));
let total = ALL_SEEDS.length, problems = 0, ing = 0, matched = 0;
const unmatched = new Map<string, number>();
const cuisines = new Map<string, number>();
for (const f of readdirSync('src/data/more').filter(f => f.endsWith('.txt')).sort()) {
  const list = parseSeeds(readFileSync(`src/data/more/${f}`, 'utf8'));
  for (const r of list) {
    const where = `${f}: ${r.title}`;
    if (ids.has(r.id)) { console.log(`DUPLICATE ${where} (also in ${ids.get(r.id)})`); problems++; }
    ids.set(r.id, f);
    if (!r.description) { console.log(`NO DESCRIPTION ${where}`); problems++; }
    if (r.ingredients.length < 3) { console.log(`FEW INGREDIENTS ${where}`); problems++; }
    if (r.steps.length < 2) { console.log(`FEW STEPS ${where}`); problems++; }
    if (!icons.has(r.emoji)) { console.log(`BAD ICON ${r.emoji} ${where}`); problems++; }
    if (!r.cuisine) { console.log(`NO CUISINE ${where}`); problems++; }
    for (const m of r.mealTypes) if (!meals.has(m)) { console.log(`BAD MEAL ${m} ${where}`); problems++; }
    cuisines.set(r.cuisine, (cuisines.get(r.cuisine) ?? 0) + 1);
    for (const l of r.ingredients) {
      if (l.startsWith('##')) continue;
      ing++;
      const p = parseIngredientLine(l);
      if (matchFood(p.name)) matched++; else unmatched.set(p.name, (unmatched.get(p.name) ?? 0) + 1);
    }
  }
  console.log(`${f}: ${list.length} recipes`);
  total += list.length;
}
console.log(`\nTOTAL ${total} recipes · ${problems} problems · nutrition match ${(100 * matched / Math.max(1, ing)).toFixed(1)}% of ${ing} ingredient lines`);
console.log('cuisines:', [...cuisines].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', '));
console.log('top unmatched:', [...unmatched].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([n, c]) => `${n}×${c}`).join(', '));
process.exit(problems ? 1 : 0);
