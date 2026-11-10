/*
 * Real food photos from Wikipedia / Wikimedia Commons (freely licensed).
 * Looked up on your phone when online, then cached by the service worker so
 * they keep working offline. Every photo carries a credit link to its source page.
 */
import { db } from '../db';
import type { Recipe } from '../types';

export const PHOTO_VERSION = 1;
const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const THUMB = 960;

/** Wikipedia article titles to try for each starter recipe, best first. */
export const PHOTO_TITLES: Record<string, string[]> = {
  'seed-shakshuka': ['Shakshouka'],
  'seed-overnight-oats': ['Overnight oats', 'Muesli'],
  'seed-banana-pancakes': ['Banana pancake', 'Pancake'],
  'seed-veggie-omelette': ['Omelette'],
  'seed-labneh-plate': ['Labneh', 'Strained yogurt'],
  'seed-avocado-toast': ['Avocado toast'],
  'seed-foul': ['Ful medames'],
  'seed-fattoush': ['Fattoush'],
  'seed-tabbouleh': ['Tabbouleh'],
  'seed-greek-salad': ['Greek salad'],
  'seed-halloumi-quinoa': ['Buddha bowl', 'Halloumi'],
  'seed-lentil-soup': ['Lentil soup'],
  'seed-tuna-wrap': ['Wrap (food)'],
  'seed-shish-tawook': ['Shish taouk', 'Shish kebab'],
  'seed-mujaddara': ['Mujaddara'],
  'seed-kafta-bake': ['Kofta', 'Kibbeh'],
  'seed-chicken-rice': ['Hashweh', 'Pilaf'],
  'seed-salmon-traybake': ['Salmon as food'],
  'seed-stir-fry': ['Stir frying'],
  'seed-chickpea-curry': ['Chana masala'],
  'seed-pasta-pomodoro': ['Spaghetti al pomodoro', 'Spaghetti'],
  'seed-turkey-meatballs': ['Meatball'],
  'seed-beef-chili': ['Chili con carne'],
  'seed-black-bean-tacos': ['Taco'],
  'seed-burrito-bowl': ['Burrito bowl', 'Burrito'],
  'seed-teriyaki-salmon': ['Teriyaki'],
  'seed-dal': ['Dal'],
  'seed-stuffed-zucchini': ['Kousa mahshi', 'Mahshi', 'Dolma'],
  'seed-hummus': ['Hummus'],
  'seed-energy-balls': ['Energy ball', 'Bliss ball'],
  'seed-yogurt-parfait': ['Parfait'],
  'seed-banana-bread': ['Banana bread'],
  'seed-manakish': ['Manakish'],
  'seed-cilbir': ['Çılbır'],
  'seed-menemen': ['Menemen (food)', 'Menemen'],
  'seed-balaleet': ['Balaleet'],
  'seed-chia-mango': ['Chia pudding', 'Chia seed'],
  'seed-protein-oats': ['Porridge'],
  'seed-egg-muffins': ['Frittata'],
  'seed-halloumi-wrap': ['Halloumi'],
  'seed-smoothie-bowl': ['Smoothie bowl', 'Açaí na tigela'],
  'seed-breakfast-burrito': ['Breakfast burrito'],
  'seed-cottage-pancakes': ['Syrniki'],
  'seed-fatteh': ['Fatteh'],
  'seed-french-toast': ['French toast'],
  'seed-green-shakshuka': ['Eggs Florentine', 'Shakshouka'],
  'seed-bircher': ['Muesli'],
  'seed-caesar': ['Caesar salad'],
  'seed-lentil-feta-salad': ['Lentil salad', 'Lentil'],
  'seed-shawarma-wrap': ['Shawarma'],
  'seed-falafel-bowl': ['Falafel'],
  'seed-tuna-salad': ['Tuna salad', 'Salade niçoise'],
  'seed-harira': ['Harira'],
  'seed-tomato-soup': ['Tomato soup'],
  'seed-chicken-noodle': ['Chicken soup'],
  'seed-batata-harra': ['Batata harra', 'Patatas bravas'],
  'seed-caprese-pasta': ['Pasta salad'],
  'seed-peanut-noodles': ['Sesame noodles', 'Cold noodles'],
  'seed-chicken-avocado-bowl': ['Poke (dish)', 'Donburi'],
  'seed-egg-fried-rice': ['Fried rice'],
  'seed-loubieh': ['Lubiya', 'Green bean'],
  'seed-pumpkin-soup': ['Pumpkin soup'],
  'seed-machboos': ['Machboos', 'Kabsa'],
  'seed-kibbeh-sanieh': ['Kibbeh'],
  'seed-kofta-tahini': ['Kofta'],
  'seed-maqluba': ['Maqluba'],
  'seed-freekeh-chicken': ['Freekeh'],
  'seed-sayadieh': ['Sayadieh', 'Sayadieh (food)'],
  'seed-bamia': ['Bamia (food)', 'Bamia', 'Okra'],
  'seed-tikka-masala': ['Chicken tikka masala'],
  'seed-green-curry': ['Green curry'],
  'seed-bulgogi': ['Bulgogi'],
  'seed-shrimp-pasta': ['Shrimp scampi', 'Scampi'],
  'seed-pesto-chicken-pasta': ['Pesto'],
  'seed-lasagne': ['Lasagna'],
  'seed-fajitas': ['Fajita'],
  'seed-beef-tacos': ['Taco', 'Tacos al pastor'],
  'seed-baked-fish': ['Fish as food'],
  'seed-harissa-salmon': ['Couscous'],
  'seed-turkey-burgers': ['Turkey burger', 'Hamburger'],
  'seed-souvlaki': ['Souvlaki'],
  'seed-mushroom-risotto': ['Risotto'],
  'seed-tagine': ['Tajine'],
  'seed-stroganoff': ['Beef Stroganoff'],
  'seed-prawn-noodles': ['Chow mein', 'Lo mein'],
  'seed-stuffed-peppers': ['Stuffed peppers'],
  'seed-lamb-chops': ['Lamb chop', 'Lamb and mutton'],
  'seed-roast-chicken': ['Roast chicken'],
  'seed-lentil-bolognese': ['Bolognese sauce'],
  'seed-crispy-tofu': ['Fried tofu', 'Tofu'],
  'seed-biryani': ['Biryani'],
  'seed-baba-ghanoush': ['Baba ghanoush'],
  'seed-muhammara': ['Muhammara'],
  'seed-roasted-chickpeas': ['Leblebi', 'Chickpea'],
  'seed-tzatziki': ['Tzatziki'],
  'seed-guacamole': ['Guacamole'],
  'seed-mouhalabieh': ['Muhallebi', 'Malabi'],
  'seed-choc-mousse': ['Chocolate mousse', 'Mousse'],
  'seed-baked-apples': ['Baked apple'],
  'seed-lemon-yogurt-cake': ['Yogurt cake', 'Lemon cake']
};

export interface PhotoHit { url: string; label: string; page: string }

interface WikiPage { title: string; missing?: string; pageimage?: string; thumbnail?: { source: string } }
interface WikiResp { query?: { pages?: Record<string, WikiPage>; normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] } }

/** Lead photos for Wikipedia articles (only freely licensed images). */
export async function wikiLeadImages(titles: string[]): Promise<Map<string, PhotoHit>> {
  const out = new Map<string, PhotoHit>();
  const unique = Array.from(new Set(titles));
  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    const url = `${WIKI_API}?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail|name&pithumbsize=${THUMB}&pilicense=free&redirects=1&titles=${encodeURIComponent(batch.join('|'))}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
    const data = (await res.json()) as WikiResp;
    const q = data.query ?? {};
    const byTitle = new Map<string, WikiPage>();
    Object.values(q.pages ?? {}).forEach(p => byTitle.set(p.title, p));
    const follow = (t: string) => {
      let cur = t;
      for (const m of [...(q.normalized ?? []), ...(q.redirects ?? [])]) if (m.from === cur) cur = m.to;
      // redirects can chain after normalisation
      for (const m of q.redirects ?? []) if (m.from === cur) cur = m.to;
      return cur;
    };
    for (const t of batch) {
      const p = byTitle.get(follow(t));
      if (p && !p.missing && p.thumbnail?.source && p.pageimage) {
        out.set(t, { url: p.thumbnail.source, label: 'Wikimedia Commons', page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.pageimage)}` });
      }
    }
  }
  return out;
}

interface CommonsPage { title: string; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }

const stripHtml = (s?: string) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Search Wikimedia Commons for photos. */
export async function searchPhotos(query: string, limit = 18): Promise<PhotoHit[]> {
  const q = `${query} filetype:bitmap`;
  const url = `${COMMONS_API}?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=${limit}&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=${THUMB}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage & { index?: number }> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages
    .filter(p => p.imageinfo?.[0]?.thumburl && /\.(jpe?g|png|webp)$/i.test(p.title))
    .map(p => {
      const ii = p.imageinfo![0];
      const artist = stripHtml(ii.extmetadata?.Artist?.value).slice(0, 60);
      const lic = stripHtml(ii.extmetadata?.LicenseShortName?.value);
      return { url: ii.thumburl!, label: [artist, lic].filter(Boolean).join(' · ') || 'Wikimedia Commons', page: ii.descriptionurl };
    });
}

/** Warm the offline cache for a list of photo URLs. */
export async function prefetchPhotos(urls: string[]) {
  const queue = urls.filter(u => /^https?:/.test(u));
  const worker = async () => {
    while (queue.length) {
      const u = queue.shift()!;
      try { await fetch(u, { mode: 'no-cors' }); } catch { /* ignore */ }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

/**
 * Find photos for starter recipes that don't have one (or have an auto photo
 * when `force`). Your own photos are never replaced.
 */
export async function resolveStarterPhotos(force = false, onProgress?: (done: number, total: number) => void): Promise<number> {
  const recipes = await db.recipes.toArray();
  const targets = recipes.filter(r => (r.builtIn || PHOTO_TITLES[r.id]) && (!r.image || (force && r.photoAuto)));
  if (!targets.length) return 0;
  const found = new Map<string, PhotoHit>();
  const remaining = new Set(targets.map(r => r.id));
  const used = new Set(recipes.filter(r => r.image && !remaining.has(r.id)).map(r => r.image!));
  const maxDepth = Math.max(...targets.map(r => (PHOTO_TITLES[r.id] ?? []).length), 0);
  for (let depth = 0; depth < maxDepth && remaining.size; depth++) {
    const ask = new Map<string, string>(); // recipeId -> title
    for (const id of remaining) { const t = PHOTO_TITLES[id]?.[depth]; if (t) ask.set(id, t); }
    if (!ask.size) break;
    const hits = await wikiLeadImages(Array.from(ask.values()));
    for (const [id, t] of ask) {
      const h = hits.get(t);
      // prefer a photo not already used by another recipe, unless this is the last option
      if (h && (!used.has(h.url) || depth === (PHOTO_TITLES[id]?.length ?? 1) - 1)) {
        found.set(id, h); used.add(h.url); remaining.delete(id);
      }
    }
    onProgress?.(found.size, targets.length);
  }
  // Last resort: search Commons by recipe title
  for (const id of Array.from(remaining)) {
    const r = targets.find(x => x.id === id)!;
    try {
      const hits = await searchPhotos(`${r.title} food`, 6);
      const pick = hits.find(h => !used.has(h.url)) ?? hits[0];
      if (pick) { found.set(id, pick); used.add(pick.url); remaining.delete(id); }
    } catch { /* offline or rate-limited — try next time */ }
    onProgress?.(found.size, targets.length);
  }
  await db.transaction('rw', db.recipes, async () => {
    for (const [id, h] of found) {
      const cur = await db.recipes.get(id);
      if (!cur || (cur.image && !cur.photoAuto && !force)) continue;
      if (cur.image && !cur.photoAuto) continue; // never replace your own photo
      await db.recipes.update(id, { image: h.url, imageCredit: { label: h.label, page: h.page }, photoAuto: true } as Partial<Recipe>);
    }
  });
  prefetchPhotos(Array.from(found.values()).map(h => h.url));
  return found.size;
}

let running = false;
/** Run once per photo-set version, whenever the phone is online. */
export async function autoResolvePhotos(getVersion: () => Promise<number | undefined>, setVersion: (v: number) => Promise<void>, notify?: (msg: string) => void) {
  if (running || !navigator.onLine) return;
  if (((await getVersion()) ?? 0) >= PHOTO_VERSION) return;
  running = true;
  try {
    const n = await resolveStarterPhotos(false);
    await setVersion(PHOTO_VERSION);
    if (n) notify?.(`Added ${n} recipe photos 📸`);
  } catch { /* try again next launch */ } finally { running = false; }
}
