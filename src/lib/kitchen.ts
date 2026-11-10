import type { Recipe } from '../types';

export type Equip =
  | 'hob' | 'oven' | 'airfryer' | 'microwave' | 'kettle' | 'blender'
  | 'processor' | 'grill' | 'toaster' | 'slowcooker' | 'ricecooker';

export const EQUIPMENT: { id: Equip; label: string; icon: string }[] = [
  { id: 'hob', label: 'Hob / stove', icon: 'hob' },
  { id: 'oven', label: 'Oven', icon: 'oven' },
  { id: 'airfryer', label: 'Air fryer', icon: 'airfryer' },
  { id: 'microwave', label: 'Microwave', icon: 'microwave' },
  { id: 'kettle', label: 'Kettle', icon: 'kettle' },
  { id: 'blender', label: 'Blender', icon: 'blender' },
  { id: 'processor', label: 'Food processor', icon: 'processor' },
  { id: 'grill', label: 'Grill / BBQ', icon: 'grill' },
  { id: 'toaster', label: 'Toaster', icon: 'toaster' },
  { id: 'slowcooker', label: 'Slow cooker', icon: 'slowcooker' },
  { id: 'ricecooker', label: 'Rice cooker', icon: 'ricecooker' }
];
export const EQUIP_MAP = Object.fromEntries(EQUIPMENT.map(e => [e.id, e])) as Record<Equip, (typeof EQUIPMENT)[number]>;

export const DEFAULT_EQUIPMENT: Equip[] = ['hob', 'oven', 'microwave', 'kettle', 'blender', 'toaster', 'grill', 'processor'];

/** What else can do the job if you don't have an appliance. */
const SUBSTITUTES: Record<Equip, Equip[]> = {
  hob: [],
  oven: [],                         // air fryer handled separately (only for suitable recipes)
  airfryer: ['oven'],
  microwave: ['hob'],
  kettle: ['hob', 'microwave'],
  blender: ['processor'],
  processor: ['blender'],
  grill: ['oven', 'hob', 'airfryer'], // oven grill or griddle pan
  toaster: ['grill', 'oven', 'hob', 'airfryer'],
  slowcooker: ['hob', 'oven'],
  ricecooker: ['hob', 'microwave']
};

const cache = new Map<string, Equip[]>();

/** Detect the equipment a recipe needs from its method. */
export function inferEquipment(r: Pick<Recipe, 'id' | 'steps' | 'updatedAt'>): Equip[] {
  const key = `${r.id}:${r.updatedAt}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let t = r.steps.join(' \n ').toLowerCase();
  const out = new Set<Equip>();
  if (/air ?fryer/.test(t)) out.add('airfryer');
  if (/microwave/.test(t)) out.add('microwave');
  if (/slow cooker/.test(t)) out.add('slowcooker');
  if (/rice cooker/.test(t)) out.add('ricecooker');
  t = t.replace(/air ?fryer/g, '').replace(/baking (powder|soda)/g, '');
  if (/\boven\b|\bbake[sd]?\b|\bbaking\b|\broast(ed|ing)?\b(?! the (nuts|pine|almond|seeds))|\d{3}\s*°c/.test(t)) out.add('oven');
  if (/food processor|\bpulse\b/.test(t)) out.add('processor');
  else if (/\bblend|\bblitz|smoothie/.test(t)) out.add('blender');
  if (/\bgrill(ed|ing)?\b|griddle|\bchar\b|over a gas flame/.test(t)) out.add('grill');
  if (/toast (the )?(sourdough|bread|slices)(?!\s*cubes)|toasted sourdough|with toast\b/.test(t)) out.add('toaster');
  const kettleText = /boiling water|kettle/.test(t);
  const hobText = t.replace(/boiling water/g, '');
  if (/\b(pan|pot|wok|saucepan|skillet)\b|simmer|\bboil|\bfry\b|\bfried\b|frying|pan-fry|stir-fry|sauté|saute|poach|scramble|\bsteam|\bmelt|\bsear|brown the|bring to|heat the oil|\bwilt|\bcook (the|in|for|until|small|as)\b|\btoast the (vermicelli|pine|nuts|almond|bread cubes)/.test(hobText)) out.add('hob');
  if (kettleText && !out.has('hob')) out.add('kettle');
  const res = Array.from(out);
  if (cache.size > 500) cache.clear();
  cache.set(key, res);
  return res;
}

export function recipeEquipment(r: Pick<Recipe, 'id' | 'steps' | 'updatedAt' | 'equipment'>): Equip[] {
  return (r.equipment as Equip[] | undefined) ?? inferEquipment(r);
}

/** Oven recipes that work fine in a (typical home) air fryer: roasting/baking pieces, not tins, layers or doughs. */
export function airFryerOk(r: Pick<Recipe, 'steps' | 'servings'>): boolean {
  const t = r.steps.join(' ').toLowerCase();
  if (!/\broast|\bbake/.test(t)) return false;
  if (/\btin\b|lasagne|\blayer|dough|flatbread|in a dish|baking dish|heavy pot|whole chicken|tray with|muffin|loaf|pour into/.test(t)) return false;
  return r.servings <= 6;
}

/** Equipment the recipe needs that you don't have (taking substitutes into account). */
export function missingEquipment(r: Recipe, have: string[]): Equip[] {
  const h = new Set(have);
  return recipeEquipment(r).filter(req => {
    if (h.has(req)) return false;
    if (SUBSTITUTES[req].some(s => h.has(s))) return false;
    if (req === 'oven' && h.has('airfryer') && airFryerOk(r)) return false;
    return true;
  });
}

/** Which appliance you'd actually use, e.g. "Air fryer instead of oven". */
export function usingInstead(r: Recipe, have: string[]): { need: Equip; use: Equip }[] {
  const h = new Set(have);
  const out: { need: Equip; use: Equip }[] = [];
  for (const req of recipeEquipment(r)) {
    if (h.has(req)) continue;
    const sub = req === 'oven' && h.has('airfryer') && airFryerOk(r) ? 'airfryer' : SUBSTITUTES[req].find(s => h.has(s));
    if (sub) out.push({ need: req, use: sub });
  }
  return out;
}

/** Conversion hint for an oven step when cooking in an air fryer. */
export function airFryerTip(step: string): string | null {
  const s = step.toLowerCase();
  if (!/\boven\b|\broast|\bbake|\d{3}\s*°c/.test(s)) return null;
  const temp = s.match(/(\d{3})\s*°c/);
  const mins = s.match(/(\d+)\s*(?:to\s*\d+\s*)?minutes/);
  const parts: string[] = [];
  if (temp) parts.push(`${Math.min(200, Number(temp[1]) - 20)}°C`);
  if (mins) parts.push(`about ${Math.max(3, Math.round(Number(mins[1]) * 0.8))} min`);
  return `Air fryer: ${parts.length ? parts.join(', ') : 'about 20°C lower and 20% less time'}. Cook in a single layer and shake or turn halfway.`;
}
