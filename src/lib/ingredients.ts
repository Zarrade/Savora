import { FOODS, DEFAULT_UNIT_G, type Food, type Aisle } from '../data/nutritionDb';
import type { Ingredient, Nutrition, Recipe, Diet } from '../types';
import { uid } from './util';

/* ------------------------------------------------------------------ units */

// canonical unit -> aliases
const UNIT_ALIASES: Record<string, string[]> = {
  g: ['g', 'gr', 'gram', 'grams', 'gm', 'gms'],
  kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'],
  mg: ['mg', 'milligram', 'milligrams'],
  oz: ['oz', 'ounce', 'ounces'],
  lb: ['lb', 'lbs', 'pound', 'pounds'],
  ml: ['ml', 'mls', 'millilitre', 'millilitres', 'milliliter', 'milliliters', 'cc'],
  l: ['l', 'litre', 'litres', 'liter', 'liters', 'ltr'],
  tsp: ['tsp', 'tsps', 'teaspoon', 'teaspoons', 't'],
  tbsp: ['tbsp', 'tbsps', 'tbs', 'tbl', 'tablespoon', 'tablespoons', 'T'],
  cup: ['cup', 'cups', 'c'],
  floz: ['fl oz', 'floz', 'fluid ounce', 'fluid ounces'],
  clove: ['clove', 'cloves'],
  slice: ['slice', 'slices'],
  can: ['can', 'cans', 'tin', 'tins'],
  bunch: ['bunch', 'bunches'],
  handful: ['handful', 'handfuls'],
  pinch: ['pinch', 'pinches'],
  dash: ['dash', 'dashes'],
  sprig: ['sprig', 'sprigs'],
  stalk: ['stalk', 'stalks', 'stick', 'sticks', 'rib', 'ribs'],
  head: ['head', 'heads'],
  fillet: ['fillet', 'fillets'],
  sachet: ['sachet', 'sachets', 'envelope'],
  scoop: ['scoop', 'scoops'],
  thumb: ['thumb', 'thumbs', 'thumb-sized piece', 'inch'],
  piece: ['piece', 'pieces', 'pc', 'pcs'],
  punnet: ['punnet', 'punnets', 'pint'],
  block: ['block', 'blocks'],
  packet: ['packet', 'packets', 'pack', 'packs', 'bag', 'bags'],
  jar: ['jar', 'jars'],
  knob: ['knob', 'knobs'],
  splash: ['splash'],
  drop: ['drop', 'drops']
};

const UNIT_LOOKUP: Record<string, string> = {};
for (const [canon, list] of Object.entries(UNIT_ALIASES)) {
  for (const a of list) UNIT_LOOKUP[a] = canon;
}

export const UNIT_OPTIONS = ['', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'clove', 'slice', 'can', 'bunch', 'handful', 'pinch', 'sprig', 'stalk', 'head', 'fillet', 'piece', 'packet', 'jar'];

const ML_PER: Record<string, number> = { ml: 1, l: 1000, tsp: 4.93, tbsp: 14.79, cup: 240, floz: 29.57 };
const G_PER: Record<string, number> = { g: 1, kg: 1000, mg: 0.001, oz: 28.35, lb: 453.6 };

export function unitLabel(unit: string, qty: number | null): string {
  if (!unit) return '';
  const plural = qty !== null && qty > 1;
  const map: Record<string, [string, string]> = {
    clove: ['clove', 'cloves'], slice: ['slice', 'slices'], can: ['can', 'cans'], bunch: ['bunch', 'bunches'],
    handful: ['handful', 'handfuls'], pinch: ['pinch', 'pinches'], dash: ['dash', 'dashes'], sprig: ['sprig', 'sprigs'],
    stalk: ['stalk', 'stalks'], head: ['head', 'heads'], fillet: ['fillet', 'fillets'], sachet: ['sachet', 'sachets'],
    scoop: ['scoop', 'scoops'], thumb: ['thumb', 'thumbs'], piece: ['piece', 'pieces'], punnet: ['punnet', 'punnets'],
    block: ['block', 'blocks'], packet: ['packet', 'packets'], jar: ['jar', 'jars'], knob: ['knob', 'knobs'],
    cup: ['cup', 'cups'], floz: ['fl oz', 'fl oz']
  };
  if (map[unit]) return plural ? map[unit][1] : map[unit][0];
  return unit;
}

/* ------------------------------------------------------------- quantities */

const UNICODE_FRAC: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
};

function parseNumberToken(tok: string): number | null {
  tok = tok.trim();
  if (!tok) return null;
  let total = 0;
  // unicode fraction possibly attached: "1½"
  const uf = tok.match(/^(\d*)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if (uf) return (uf[1] ? parseInt(uf[1], 10) : 0) + UNICODE_FRAC[uf[2]];
  const frac = tok.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  const num = tok.replace(',', '.');
  if (/^\d*\.?\d+$/.test(num)) { total = parseFloat(num); return total; }
  return null;
}

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, half: 0.5, dozen: 12, couple: 2, few: 3
};

export interface ParsedLine { qty: number | null; unit: string; name: string; note?: string }

/** Parse a free-text ingredient line like "2 ½ cups (300 g) plain flour, sifted". */
export function parseIngredientLine(raw: string): ParsedLine {
  let s = raw.trim()
    .replace(/^[-•*·▪●◦–—]+\s*/, '')
    .replace(/^\d+[.)]\s+(?=\D)/, '') // numbered list "1. " (only when followed by non-digit)
    .replace(/\s+/g, ' ');
  let note: string | undefined;

  // "Juice of 1 lemon", "zest of 2 limes"
  const juice = s.match(/^(juice|zest)\s+(?:of\s+)?(\d+|½|a|an|one|two|half)\s+(lemons?|limes?|oranges?)\b(.*)$/i);
  if (juice) {
    const n = parseNumberToken(juice[2]) ?? WORD_NUMBERS[juice[2].toLowerCase()] ?? 1;
    const fruit = juice[3].toLowerCase().replace(/s$/, '');
    const rest = juice[4].replace(/^[,\s]+/, '');
    const how = juice[1].toLowerCase() === 'juice' ? 'juiced' : 'zested';
    return { qty: n, unit: '', name: n > 1 ? `${fruit}s` : fruit, note: rest ? `${how}, ${rest}` : how };
  }

  // pull trailing notes after comma or in parentheses
  const paren = s.match(/\(([^)]*)\)/g);
  const parenNotes: string[] = [];
  if (paren) {
    for (const p of paren) {
      const inner = p.slice(1, -1).trim();
      parenNotes.push(inner);
    }
    s = s.replace(/\s*\([^)]*\)/g, '').trim();
  }

  // quantity: numbers, ranges, fractions, mixed numbers
  const tokens = s.split(' ');
  let qty: number | null = null;
  let i = 0;
  const readNum = (t: string | undefined) => (t === undefined ? null : parseNumberToken(t));
  // split leading numbers glued to unit, e.g. "200g", "1½cups"
  const glued = tokens[0]?.match(/^(\d+(?:[.,]\d+)?|\d*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\/\d+)([a-zA-Z]+)$/);
  if (glued) { tokens.splice(0, 1, glued[1], glued[2]); }

  const first = readNum(tokens[0]);
  if (first !== null) {
    qty = first; i = 1;
    const second = readNum(tokens[1]);
    if (second !== null && second < 1 && tokens[1]?.match(/\/|[½⅓⅔¼¾⅛⅜⅝⅞]/)) { qty += second; i = 2; }
    // ranges "2-3" / "2 to 3" -> keep lower, note the range
    const rangeTok = tokens[i];
    if (rangeTok === '-' || rangeTok === 'to' || rangeTok === '–') {
      const hi = readNum(tokens[i + 1]);
      if (hi !== null) { parenNotes.unshift(`${fmtQty(qty)}–${fmtQty(hi)}`); qty = hi; i += 2; }
    }
  } else {
    const range = tokens[0]?.match(/^(\d+(?:\.\d+)?)[-–](\d+(?:\.\d+)?)$/);
    if (range) {
      qty = parseFloat(range[2]); parenNotes.unshift(`${range[1]}–${range[2]}`); i = 1;
    } else if (tokens[0] && WORD_NUMBERS[tokens[0].toLowerCase()] !== undefined) {
      qty = WORD_NUMBERS[tokens[0].toLowerCase()]; i = 1;
      if (tokens[i]?.toLowerCase() === 'half') { qty = 0.5; i++; }
    }
  }

  // unit (allow "fl oz" two-token)
  let unit = '';
  const two = `${tokens[i] ?? ''} ${tokens[i + 1] ?? ''}`.toLowerCase();
  if (UNIT_LOOKUP[two]) { unit = UNIT_LOOKUP[two]; i += 2; }
  else if (tokens[i]) {
    const t = tokens[i].replace(/\.$/, '');
    const canon = UNIT_LOOKUP[t] ?? UNIT_LOOKUP[t.toLowerCase()];
    // single-letter 't'/'c' only count as units when a quantity preceded
    if (canon && (t.length > 1 || qty !== null)) { unit = canon; i++; }
  }
  if (tokens[i]?.toLowerCase() === 'of') i++;

  let name = tokens.slice(i).join(' ').trim();
  // "salt and pepper to taste", "to serve"
  const tasteMatch = name.match(/,?\s*(to taste|as needed|to serve|for serving|optional|for garnish|to garnish)\s*$/i);
  if (tasteMatch) { parenNotes.push(tasteMatch[1].toLowerCase()); name = name.slice(0, tasteMatch.index).trim(); }

  const comma = name.indexOf(',');
  if (comma > 0) {
    const after = name.slice(comma + 1).trim();
    name = name.slice(0, comma).trim();
    if (after) parenNotes.push(after);
  }
  if (parenNotes.length) note = parenNotes.join(', ');
  if (!name) name = raw.trim();
  return { qty, unit, name, note };
}

export function toIngredient(raw: string, group?: string): Ingredient {
  const p = parseIngredientLine(raw);
  return { id: uid(), qty: p.qty, unit: p.unit, name: p.name, note: p.note, group };
}

/* --------------------------------------------------------- formatting qty */

export function fmtQty(q: number | null): string {
  if (q === null || isNaN(q)) return '';
  if (q === 0) return '0';
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  const fracs: [number, string][] = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'], [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'], [1, '']];
  if (q >= 20) return String(Math.round(q));
  let best = fracs[0]; let bestDiff = 1;
  for (const f of fracs) { const d = Math.abs(frac - f[0]); if (d < bestDiff) { bestDiff = d; best = f; } }
  if (bestDiff < 0.04) {
    const w = best[0] === 1 ? whole + 1 : whole;
    if (!best[1]) return String(w);
    return w ? `${w}${best[1]}` : best[1];
  }
  return (Math.round(q * 10) / 10).toString();
}

export function fmtIngredient(ing: Ingredient, scale = 1): string {
  const q = ing.qty === null ? null : ing.qty * scale;
  const qs = fmtQty(q);
  const u = unitLabel(ing.unit, q);
  return [qs, u, ing.name].filter(Boolean).join(' ');
}

/* ------------------------------------------------------------ food match */

const STOP = /\b(fresh|freshly|chopped|finely|roughly|thinly|thickly|sliced|diced|minced|grated|crushed|peeled|large|small|medium|big|ripe|organic|boneless|skinless|lean|extra|halved|quartered|cubed|shredded|cooked|raw|frozen|dried|toasted|softened|melted|beaten|whole|of|the|a|an|about|approx|good|quality|handful|cold|warm|room temperature|packed|heaped|level|baby|plus more|unsalted|salted|low-fat|full-fat|light|virgin)\b/gi;

interface IndexEntry { alias: string; food: Food; re: RegExp }
const INDEX: IndexEntry[] = FOODS.flatMap(food =>
  food.k.map(alias => ({
    alias,
    food,
    re: new RegExp(`(^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`, 'i')
  }))
).sort((a, b) => b.alias.length - a.alias.length);

const matchCache = new Map<string, Food | null>();

/* Foods the AI estimated for ingredients missing from the built-in database (kept on this device). */
const CUSTOM_KEY = 'savora-custom-foods';
let customFoods: Record<string, number[]> = {};
try { customFoods = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}'); } catch { /* none */ }
export function addCustomFoods(foods: Record<string, number[]>) {
  customFoods = { ...customFoods, ...foods };
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customFoods)); } catch { /* storage blocked */ }
  matchCache.clear();
  nutritionCache.clear();
  window.dispatchEvent(new Event('savora-foods'));
}
export function customFoodCount() { return Object.keys(customFoods).length; }

export function matchFood(name: string): Food | null {
  const key = name.toLowerCase().trim();
  if (matchCache.has(key)) return matchCache.get(key)!;
  // try raw first (keeps "frozen peas", "dried chickpeas", "cooked rice"), then cleaned
  const cleaned = key.replace(STOP, ' ').replace(/\s+/g, ' ').trim();
  let found: Food | null = null;
  for (const cand of [key, cleaned]) {
    for (const e of INDEX) { if (e.re.test(cand)) { found = e.food; break; } }
    if (found) break;
  }
  // naive singular fallback
  if (!found && cleaned.endsWith('s')) {
    const singular = cleaned.replace(/(es|s)$/, '');
    for (const e of INDEX) { if (e.re.test(singular)) { found = e.food; break; } }
  }
  if (!found) {
    const hit = customFoods[key] ?? customFoods[cleaned];
    if (hit) found = { k: [key], a: 'Other', n: hit };
  }
  matchCache.set(key, found);
  return found;
}

export function aisleFor(name: string): Aisle {
  return matchFood(name)?.a ?? 'Other';
}

/** Convert an ingredient quantity to grams. Returns null if not convertible. */
export function toGrams(qty: number | null, unit: string, food: Food | null): number | null {
  if (qty === null) return null;
  if (G_PER[unit] !== undefined) return qty * G_PER[unit];
  if (ML_PER[unit] !== undefined) return qty * ML_PER[unit] * (food?.d ?? 1);
  const u = unit || 'each';
  const per = food?.u?.[u] ?? (u === 'clove' ? food?.u?.each : undefined) ?? (u === 'piece' ? food?.u?.each : undefined) ?? DEFAULT_UNIT_G[u];
  if (per === undefined) return null;
  return qty * per;
}

/* -------------------------------------------------------------- nutrition */

export const EMPTY_NUTRITION: Nutrition = {
  kcal: 0, protein: 0, carbs: 0, fat: 0, satFat: 0, sugar: 0, fibre: 0, salt: 0,
  calcium: 0, iron: 0, potassium: 0, vitC: 0, vitA: 0, magnesium: 0
};
const NKEYS: (keyof Nutrition)[] = ['kcal', 'protein', 'carbs', 'fat', 'satFat', 'sugar', 'fibre', 'salt', 'calcium', 'iron', 'potassium', 'vitC', 'vitA', 'magnesium'];

export interface NutritionResult {
  total: Nutrition;
  perServing: Nutrition;
  totalGrams: number;
  per100g: Nutrition;
  matched: number;
  unmatched: string[];
  coverage: number; // 0–1 share of ingredients we could estimate
}

export function addNutrition(a: Nutrition, b: Nutrition, f = 1): Nutrition {
  const out = { ...a };
  for (const k of NKEYS) out[k] = a[k] + b[k] * f;
  return out;
}
export function scaleNutrition(a: Nutrition, f: number): Nutrition {
  const out = { ...a };
  for (const k of NKEYS) out[k] = a[k] * f;
  return out;
}

const nutritionCache = new Map<string, NutritionResult>();

export function recipeNutrition(recipe: Pick<Recipe, 'id' | 'ingredients' | 'servings' | 'updatedAt'>): NutritionResult {
  const cacheKey = `${recipe.id}:${recipe.updatedAt}:${recipe.servings}`;
  const cached = nutritionCache.get(cacheKey);
  if (cached) return cached;

  let total = { ...EMPTY_NUTRITION };
  let grams = 0;
  let matched = 0;
  const unmatched: string[] = [];
  let counted = 0;
  for (const ing of recipe.ingredients) {
    const food = matchFood(ing.name);
    if (ing.qty === null) { if (!food) unmatched.push(ing.name); continue; } // "to taste" — negligible
    counted++;
    if (!food) { unmatched.push(ing.name); continue; }
    const g = toGrams(ing.qty, ing.unit, food);
    if (g === null) { unmatched.push(ing.name); continue; }
    matched++;
    grams += g;
    const f = g / 100;
    NKEYS.forEach((k, idx) => { total[k] += food.n[idx] * f; });
  }
  const servings = Math.max(1, recipe.servings || 1);
  const res: NutritionResult = {
    total,
    perServing: scaleNutrition(total, 1 / servings),
    totalGrams: grams,
    per100g: grams > 0 ? scaleNutrition(total, 100 / grams) : { ...EMPTY_NUTRITION },
    matched,
    unmatched,
    coverage: counted ? matched / counted : 1
  };
  if (nutritionCache.size > 800) nutritionCache.clear();
  nutritionCache.set(cacheKey, res);
  return res;
}

/** UK FSA front-of-pack traffic light thresholds (per 100 g, food). */
export function trafficLight(nutrient: 'fat' | 'satFat' | 'sugar' | 'salt', per100: number): 'low' | 'medium' | 'high' {
  const t = { fat: [3, 17.5], satFat: [1.5, 5], sugar: [5, 22.5], salt: [0.3, 1.5] }[nutrient];
  if (per100 <= t[0]) return 'low';
  if (per100 > t[1]) return 'high';
  return 'medium';
}

/* ------------------------------------------------------ allergens & diets */

export const ALLERGEN_TAGS = ['gluten', 'dairy', 'egg', 'nuts', 'peanuts', 'shellfish', 'fish', 'soy', 'sesame'] as const;

const KEYWORD_TAGS: [RegExp, string][] = [
  [/\b(peanut|peanuts)\b/i, 'peanuts'],
  [/\b(prawn|shrimp|crab|lobster|mussel|clam|oyster|scallop|squid|calamari)s?\b/i, 'shellfish'],
  [/\b(wheat|barley|rye|semolina|spelt)\b/i, 'gluten']
];

export function ingredientTags(name: string): Set<string> {
  const tags = new Set<string>(matchFood(name)?.tags ?? []);
  for (const [re, t] of KEYWORD_TAGS) if (re.test(name)) tags.add(t);
  if (tags.has('peanuts')) tags.add('nuts');
  return tags;
}

export function recipeTags(recipe: Pick<Recipe, 'ingredients'>): Set<string> {
  const all = new Set<string>();
  for (const i of recipe.ingredients) ingredientTags(i.name).forEach(t => all.add(t));
  return all;
}

/** Does the recipe contain something the user listed (allergen tag or free-text food)? */
export function recipeConflicts(recipe: Pick<Recipe, 'ingredients'>, exclusions: string[]): string[] {
  if (!exclusions.length) return [];
  const tags = recipeTags(recipe);
  const hits: string[] = [];
  for (const ex of exclusions) {
    const e = ex.toLowerCase().trim();
    if (!e) continue;
    const tagName = e === 'nut' || e === 'tree nuts' ? 'nuts' : e === 'milk' || e === 'lactose' ? 'dairy' : e === 'eggs' ? 'egg' : e === 'wheat' ? 'gluten' : e;
    if (tags.has(tagName)) { hits.push(ex); continue; }
    const re = new RegExp(`\\b${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (recipe.ingredients.some(i => re.test(i.name))) hits.push(ex);
  }
  return hits;
}

export function recipeDiets(recipe: Pick<Recipe, 'ingredients' | 'servings' | 'id' | 'updatedAt'>): Diet[] {
  const tags = recipeTags(recipe);
  const hasMeat = tags.has('meat') || tags.has('pork');
  const hasFish = tags.has('fish') || tags.has('shellfish');
  const honey = recipe.ingredients.some(i => /\bhoney\b/i.test(i.name));
  const out: Diet[] = [];
  if (!hasMeat && !hasFish) out.push('vegetarian');
  if (!hasMeat && !hasFish && !tags.has('dairy') && !tags.has('egg') && !honey) out.push('vegan');
  if (!hasMeat) out.push('pescatarian');
  if (!tags.has('gluten')) out.push('gluten-free');
  if (!tags.has('dairy')) out.push('dairy-free');
  const n = recipeNutrition(recipe).perServing;
  if (n.kcal > 0 && (n.protein * 4) / n.kcal >= 0.3 && n.protein >= 25) out.push('high-protein');
  if (n.kcal > 0 && n.carbs <= 20) out.push('low-carb');
  return out;
}
