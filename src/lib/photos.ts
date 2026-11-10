/*
 * Real food photos from Wikipedia / Wikimedia Commons (freely licensed).
 * Looked up on your phone when online, then cached by the service worker so
 * they keep working offline. Every photo carries a credit link to its source page.
 */
import { db, untracked } from '../db';
import type { Recipe } from '../types';
import { legacyIcon } from './foodIcons';

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
    if (i) await new Promise(r => setTimeout(r, 250)); // be gentle with Wikipedia
    const url = `${WIKI_API}?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail|name&pithumbsize=${THUMB}&pilicense=free&redirects=1&titles=${encodeURIComponent(batch.join('|'))}`;
    let res = await fetch(url);
    if (!res.ok) { await new Promise(r => setTimeout(r, 3000)); res = await fetch(url); }
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

/* ----------------------------------------------------- article-name guesses */

/** Spellings our titles use → the spelling Wikipedia uses. */
const SPELL: [RegExp, string][] = [
  [/\bshakshuka\b/i, 'Shakshouka'], [/\bshish tawook\b/i, 'Shish taouk'], [/\bkunafa\b/i, 'Knafeh'], [/\bmaamoul\b/i, "Ma'amoul"],
  [/\bmloukhieh\b|\bmolokhia\b/i, 'Mulukhiyah'], [/\bkoshari\b/i, 'Kushari'], [/\bta'ameya\b/i, 'Falafel'], [/\bwarak enab\b/i, 'Dolma'],
  [/\bmutabbaq\b/i, 'Murtabak'], [/\bthareed\b/i, 'Tharid'], [/\baseeda\b/i, 'Asida'], [/\bzhug\b/i, 'Schug'], [/\bkarak chai\b/i, 'Masala chai'],
  [/\bgahwa\b/i, 'Arabic coffee'], [/\bmutabbal\b|\bmoutabal\b/i, 'Baba ghanoush'], [/\bbastilla\b/i, 'Pastilla'], [/\btagine\b/i, 'Tajine'],
  [/\bfesenjan\b/i, 'Fesenjān'], [/\bkabuli pulao\b/i, 'Kabuli palaw'], [/\bkarniyarik\b|\bkarnıyarık\b/i, 'Karnıyarık'], [/\bmanakish\b/i, 'Manakish'],
  [/\bbanh mi\b/i, 'Bánh mì'], [/\bpho\b/i, 'Phở'], [/\bpad kra pao\b|thai basil chicken/i, 'Phat kaphrao'], [/\bpad see ew\b/i, 'Phat si-io'],
  [/\bpad thai\b/i, 'Pad thai'], [/\btom yum\b/i, 'Tom yum'], [/\btom kha\b/i, 'Tom kha kai'], [/\bmassaman\b/i, 'Massaman curry'],
  [/\bgyoza\b/i, 'Jiaozi'], [/\bkaraage\b/i, 'Karaage'], [/\btamagoyaki\b/i, 'Tamagoyaki'], [/\bonigiri\b/i, 'Onigiri'], [/\bkatsu curry\b/i, 'Japanese curry'],
  [/\bkimchi jjigae\b/i, 'Kimchi-jjigae'], [/\btteokbokki\b/i, 'Tteok-bokki'], [/\bgyeran mari\b/i, 'Gyeran-mari'], [/\bsuqaar\b/i, 'Suqaar'],
  [/\bmisir wot\b/i, 'Misir wat'], [/\bdoro wat\b/i, 'Doro wat'], [/\bsukuma wiki\b/i, 'Sukuma wiki'], [/\bred red\b/i, 'Red red'],
  [/\belote\b/i, 'Elote'], [/\bpão de queijo\b/i, 'Pão de queijo'], [/\bkhachapuri\b/i, 'Khachapuri'], [/\blahmajoun\b|lahm bi ajeen/i, 'Lahmajoun'],
  [/\bmsemen\b/i, 'Msemen'], [/\bsimit\b/i, 'Simit'], [/\bsütlaç\b|turkish rice pudding/i, 'Sütlaç'], [/\bmanti\b/i, 'Manti (food)'],
  [/\bgözleme\b/i, 'Gözleme'], [/\bpide\b/i, 'Pide'], [/\biskender\b/i, 'İskender kebap'], [/\badana\b/i, 'Adana kebabı'],
  [/\bimam bayıldı\b/i, 'İmam bayıldı'], [/\bköfte\b|\bkofta\b|\bkafta\b/i, 'Kofta'], [/\bçılbır\b|turkish eggs/i, 'Çılbır'],
  [/\bpierogi\b/i, 'Pierogi'], [/\bborscht\b/i, 'Borscht'], [/\bgoulash\b/i, 'Goulash'], [/\bschnitzel\b/i, 'Schnitzel'], [/\bplov\b/i, 'Pilaf'],
  [/\bchurros\b/i, 'Churro'], [/\btres leches\b/i, 'Tres leches cake'], [/\bpozole\b/i, 'Pozole'], [/\bchilaquiles\b/i, 'Chilaquiles'],
  [/\bhuevos rancheros\b/i, 'Huevos rancheros'], [/\bquesadilla/i, 'Quesadilla'], [/\benchilada/i, 'Enchilada'], [/\bburrito/i, 'Burrito'],
  [/\btaco/i, 'Taco'], [/\bfajita/i, 'Fajita'], [/\bnachos\b/i, 'Nachos'], [/\bguacamole\b/i, 'Guacamole'], [/\bceviche\b/i, 'Ceviche'],
  [/\bempanada/i, 'Empanada'], [/\barepa/i, 'Arepa'], [/\bjollof\b/i, 'Jollof rice'], [/\bbobotie\b/i, 'Bobotie'], [/\bharira\b/i, 'Harira'],
  [/\blablabi\b/i, 'Lablabi'], [/\bzaalouk\b/i, 'Zaalouk'], [/\bmoussaka\b/i, 'Moussaka'], [/\bpastitsio\b/i, 'Pastitsio'],
  [/\bspanakopita\b/i, 'Spanakopita'], [/\bavgolemono\b/i, 'Avgolemono'], [/\bgemista\b/i, 'Gemista'], [/\bsouvlaki\b/i, 'Souvlaki'],
  [/\bgyros?\b/i, 'Gyros'], [/\btzatziki\b/i, 'Tzatziki'], [/\bbaklava\b/i, 'Baklava'], [/\bloukoumades\b/i, 'Loukoumades'],
  [/\bbiryani\b/i, 'Biryani'], [/\bkorma\b/i, 'Korma'], [/\bpalak paneer\b/i, 'Palak paneer'], [/\bchana masala\b/i, 'Chana masala'],
  [/\bbutter chicken\b/i, 'Butter chicken'], [/\btandoori\b/i, 'Tandoori chicken'], [/\btikka\b/i, 'Chicken tikka'], [/\bdal\b|\bdhal\b/i, 'Dal'],
  [/\bsamosa/i, 'Samosa'], [/\bbhaji\b/i, 'Pakora'], [/\bpakora\b/i, 'Pakora'], [/\bnaan\b/i, 'Naan'], [/\bparatha\b/i, 'Paratha'],
  [/\bdosa\b/i, 'Dosa'], [/\bsambar\b/i, 'Sambar (dish)'], [/\bupma\b/i, 'Upma'], [/\bpoha\b/i, 'Poha (rice)'], [/\bkheer\b/i, 'Kheer'],
  [/\bgulab jamun\b/i, 'Gulab jamun'], [/\blassi\b/i, 'Lassi'], [/\braita\b/i, 'Raita'], [/\bpav bhaji\b/i, 'Pav bhaji'], [/\bnihari\b/i, 'Nihari'],
  [/\bhaleem\b/i, 'Haleem'], [/\bkarahi\b/i, 'Karahi'], [/\bchapli\b/i, 'Chapli kebab'], [/\brendang\b/i, 'Rendang'], [/\badobo\b/i, 'Philippine adobo'],
  [/\bnasi goreng\b/i, 'Nasi goreng'], [/\blaksa\b/i, 'Laksa'], [/\bgado.gado\b/i, 'Gado-gado'], [/\bsatay\b/i, 'Satay'],
  [/\bbibimbap\b/i, 'Bibimbap'], [/\bbulgogi\b/i, 'Bulgogi'], [/\bjapchae\b/i, 'Japchae'], [/\bkimchi fried rice\b/i, 'Kimchi fried rice'],
  [/\bmapo\b/i, 'Mapo tofu'], [/\bkung pao\b/i, 'Kung Pao chicken'], [/\bchow mein\b/i, 'Chow mein'], [/\bdan dan\b/i, 'Dandan noodles'],
  [/\bcongee\b/i, 'Congee'], [/\bramen\b/i, 'Ramen'], [/\budon\b/i, 'Udon'], [/\bmiso soup\b/i, 'Miso soup'], [/\bokonomiyaki\b/i, 'Okonomiyaki'],
  [/\boyakodon\b/i, 'Oyakodon'], [/\bteriyaki\b/i, 'Teriyaki'], [/\bpoke\b/i, 'Poke (dish)'], [/\bsushi\b|chirashi/i, 'Chirashizushi'],
  [/\bkatsu\b/i, 'Tonkatsu'], [/\bspring roll/i, 'Spring roll'], [/\bsummer roll/i, 'Gỏi cuốn'], [/\bscallion pancake/i, 'Scallion pancake'],
  [/\bhot (?:&|and) sour soup\b/i, 'Hot and sour soup'], [/\begg drop\b/i, 'Egg drop soup'], [/\bfried rice\b/i, 'Fried rice'],
  [/\bkabsa\b|\bmachboos\b|\bmajboos\b/i, 'Kabsa'], [/\bmandi\b/i, 'Mandi (food)'], [/\bharees\b/i, 'Harees'], [/\bluqaimat\b/i, 'Luqaimat'],
  [/\bbalaleet\b/i, 'Balaleet'], [/\bjallab\b/i, 'Jallab'], [/\bqamar al.din\b/i, 'Qamar al-Din'], [/\bmansaf\b/i, 'Mansaf'],
  [/\bmusakhan\b/i, 'Musakhan'], [/\bmaq?lub[ae]h?\b/i, 'Maqluba'], [/\bfatteh\b|\bfattet\b/i, 'Fatteh'], [/\bkibbeh\b|\bkubba\b/i, 'Kibbeh'],
  [/\bmujadd?ara\b/i, 'Mujaddara'], [/\bfreekeh\b/i, 'Freekeh'], [/\bsayadieh\b|siyadiyeh/i, 'Sayadieh'], [/\bmoghrabieh\b|maftoul/i, 'Moghrabieh'],
  [/\bsfiha\b/i, 'Sfiha'], [/\bfatayer\b/i, 'Fatayer'], [/\bsambousek\b/i, 'Samosa'], [/\barayes\b/i, 'Arayes'], [/\bshawarma\b/i, 'Shawarma'],
  [/\bfalafel\b/i, 'Falafel'], [/\bhummus\b/i, 'Hummus'], [/\bfattoush\b/i, 'Fattoush'], [/\btabbouleh\b/i, 'Tabbouleh'], [/\blabneh\b/i, 'Labneh'],
  [/\bmuhammara\b/i, 'Muhammara'], [/\bbaba ghanoush\b/i, 'Baba ghanoush'], [/\bfoul\b|\bful\b|fava beans/i, 'Ful medames'],
  [/\bhalloumi\b/i, 'Halloumi'], [/\bmanakish\b|za'atar/i, 'Manakish'], [/\bshish barak\b/i, 'Shishbarak'], [/\bbamia\b|okra/i, 'Bamia'],
  [/\bdolma\b|stuffed vine/i, 'Dolma'], [/\bknafeh\b/i, 'Knafeh'], [/\bbasbousa\b/i, 'Basbousa'], [/\bumm ali\b/i, 'Umm Ali'],
  [/\batayef\b/i, 'Qatayef'], [/\bsfouf\b/i, 'Sfouf'], [/\bmahalabia|muhalabiya|mouhalabieh|milk pudding/i, 'Muhallebi'],
  [/\bhalawet el jibn\b/i, 'Halawet el jibn'], [/\bghormeh sabzi\b/i, 'Ghormeh sabzi'], [/\btahdig\b/i, 'Tahdig'], [/\bash reshteh\b/i, 'Ash reshteh'],
  [/\bjeweled rice\b/i, 'Javaher polow'], [/\bshirazi\b/i, 'Shirazi salad'], [/\bkoobideh\b/i, 'Kabab koobideh'], [/\bcheesecake\b/i, 'Cheesecake'],
  [/\btiramisu\b/i, 'Tiramisu'], [/\bpanna cotta\b/i, 'Panna cotta'], [/\baffogato\b/i, 'Affogato'], [/\brisotto\b/i, 'Risotto'],
  [/\blasagne\b|\blasagna\b/i, 'Lasagna'], [/\bgnocchi\b/i, 'Gnocchi'], [/\bcarbonara\b/i, 'Carbonara'], [/\bbolognese\b/i, 'Bolognese sauce'],
  [/\barrabbiata\b/i, 'Arrabbiata sauce'], [/\baglio e olio\b/i, 'Aglio e olio'], [/\bpesto\b/i, 'Pesto'], [/\bminestrone\b/i, 'Minestrone'],
  [/\bribollita\b/i, 'Ribollita'], [/\bpasta e fagioli\b/i, 'Pasta e fagioli'], [/\bwedding soup\b/i, 'Wedding soup'], [/\bpizza\b/i, 'Pizza'],
  [/\bcalzone\b/i, 'Calzone'], [/\bfocaccia\b/i, 'Focaccia'], [/\bbruschetta\b/i, 'Bruschetta'], [/\bcaprese\b/i, 'Caprese salad'],
  [/\bpanzanella\b/i, 'Panzanella'], [/\barancini\b/i, 'Arancini'], [/\bparmigiana\b/i, 'Parmigiana'], [/\bcacciatore\b/i, 'Cacciatore'],
  [/\bpiccata\b/i, 'Piccata'], [/\bsaltimbocca\b/i, 'Saltimbocca'], [/\bpolenta\b/i, 'Polenta'], [/\bfrittata\b/i, 'Frittata'],
  [/\bcannelloni\b/i, 'Cannelloni'], [/\bziti\b/i, 'Baked ziti'], [/\bscampi\b/i, 'Scampi'], [/\bprimavera\b/i, 'Pasta primavera'],
  [/\balfredo\b/i, 'Fettuccine Alfredo'], [/\bpaella\b/i, 'Paella'], [/\bgazpacho\b/i, 'Gazpacho'], [/\bpatatas bravas\b/i, 'Patatas bravas'],
  [/\bgambas\b/i, 'Gambas al ajillo'], [/\btortilla\b(?! chips)/i, 'Spanish omelette'], [/\bpan con tomate\b/i, 'Pa amb tomàquet'],
  [/\bpiri.piri\b/i, 'Piri piri'], [/\bcustard tart/i, 'Pastel de nata'], [/\bratatouille\b/i, 'Ratatouille'], [/\bquiche\b/i, 'Quiche'],
  [/\bcrêpes?\b|\bcrepes?\b/i, 'Crêpe'], [/\bcroque\b/i, 'Croque monsieur'], [/\bfrench onion\b/i, 'French onion soup'], [/\bniçoise\b|nicoise/i, 'Salade niçoise'],
  [/\bcoq au vin\b/i, 'Coq au vin'], [/\bbourguignon\b/i, 'Beef bourguignon'], [/\bcrème brûlée\b/i, 'Crème brûlée'], [/\blava cake/i, 'Chocolate lava cake'],
  [/\bstroganoff\b/i, 'Beef Stroganoff'], [/\bswedish meatballs\b/i, 'Swedish meatballs'], [/\bstrudel\b/i, 'Apple strudel'], [/\bdutch baby\b/i, 'Dutch baby pancake'],
  [/\bshepherd'?s pie\b|cottage pie/i, "Shepherd's pie"], [/\bfish (?:&|and) chips\b/i, 'Fish and chips'], [/\btoad in the hole\b/i, 'Toad in the hole'],
  [/\bbangers\b/i, 'Bangers and mash'], [/\bfull english\b/i, 'Full breakfast'], [/\bscones?\b/i, 'Scone'], [/\bvictoria sponge\b/i, 'Victoria sponge'],
  [/\bsticky toffee\b/i, 'Sticky toffee pudding'], [/\bcrumble\b/i, 'Crumble'], [/\bshortbread\b/i, 'Shortbread'], [/\bsoda bread\b/i, 'Soda bread'],
  [/\bmac (?:&|and) cheese\b/i, 'Macaroni and cheese'], [/\bmeatloaf\b/i, 'Meatloaf'], [/\bsloppy joe/i, 'Sloppy joe'], [/\bpot pie\b/i, 'Pot pie'],
  [/\bclub sandwich\b/i, 'Club sandwich'], [/\btuna melt\b/i, 'Tuna melt'], [/\bphilly\b/i, 'Cheesesteak'], [/\bcobb salad\b/i, 'Cobb salad'],
  [/\bcaesar\b/i, 'Caesar salad'], [/\bcornbread\b/i, 'Cornbread'], [/\bcoleslaw\b/i, 'Coleslaw'], [/\bpotato salad\b/i, 'Potato salad'],
  [/\bchowder\b/i, 'Chowder'], [/\bbrownies?\b/i, 'Chocolate brownie'], [/\bchocolate chip cookie/i, 'Chocolate chip cookie'], [/\bapple pie\b/i, 'Apple pie'],
  [/\bbanana pudding\b/i, 'Banana pudding'], [/\bcarrot cake\b/i, 'Carrot cake'], [/\bbanana bread\b/i, 'Banana bread'], [/\bpavlova\b/i, 'Pavlova (cake)'],
  [/\bcinnamon rolls?\b/i, 'Cinnamon roll'], [/\bmacaroons?\b/i, 'Coconut macaroon'], [/\bwaffles?\b/i, 'Waffle'], [/\bpancakes?\b/i, 'Pancake'],
  [/\bfrench toast\b/i, 'French toast'], [/\bgranola\b/i, 'Granola'], [/\bporridge\b|oatmeal\b|\boats\b/i, 'Porridge'], [/\bmuffins?\b/i, 'Muffin'],
  [/\bsmoothie\b/i, 'Smoothie'], [/\bomelette\b|omelet/i, 'Omelette'], [/\bscrambled eggs\b|\bscramble\b/i, 'Scrambled eggs'], [/\beggs florentine\b/i, 'Eggs Florentine'],
  [/\bhash\b/i, 'Hash (food)'], [/\bjerk chicken\b/i, 'Jerk (cooking)'], [/\brice (?:&|and) peas\b/i, 'Rice and peas'], [/\bfeijoada\b/i, 'Feijoada'],
  [/\bchimichurri\b/i, 'Chimichurri'], [/\bpicadillo\b/i, 'Picadillo'], [/\bmole\b/i, 'Mole (sauce)'], [/\bhorchata\b/i, 'Horchata'], [/\bagua fresca\b/i, 'Agua fresca'],
  [/\bchili\b(?! flakes)/i, 'Chili con carne'], [/\bburgers?\b/i, 'Hamburger'], [/\bnoodle salad\b/i, 'Cold noodles'], [/\bbuddha bowl\b/i, 'Buddha bowl'],
  [/\bchia pudding\b/i, 'Chia seed'], [/\bparfait\b/i, 'Parfait'], [/\btrail mix\b/i, 'Trail mix'], [/\bpopcorn\b/i, 'Popcorn'], [/\bedamame\b/i, 'Edamame']
];

/** A sensible photo for the dish type when nothing more specific exists. */
const GENERIC: Record<string, string[]> = {
  plate: ['Meal'], pan: ['Shakshouka', 'Fried egg'], bowl: ['Porridge', 'Bowl food'], soup: ['Soup'], pot: ['Stew'], casserole: ['Casserole'],
  curry: ['Curry'], rice: ['Pilaf', 'Rice'], noodles: ['Noodle'], pasta: ['Pasta'], salad: ['Salad'], wrap: ['Wrap (food)'], taco: ['Taco'],
  pita: ['Pita'], burger: ['Hamburger'], sandwich: ['Sandwich'], skewer: ['Kebab'], falafel: ['Falafel'], bento: ['Bento'], pancakes: ['Pancake'],
  flatbread: ['Flatbread'], pie: ['Pie'], cupcake: ['Cake'], pudding: ['Pudding'], cookie: ['Cookie'], chocolate: ['Chocolate'], egg: ['Egg as food'],
  cheese: ['Cheese'], milk: ['Milk'], yogurt: ['Yogurt'], bread: ['Bread'], fish: ['Fish as food'], shrimp: ['Shrimp and prawn as food'],
  drumstick: ['Chicken as food'], steak: ['Steak'], meat: ['Meatball'], tofu: ['Tofu'], beans: ['Bean'], peas: ['Pea'], nut: ['Nut (fruit)'],
  potato: ['Potato'], onion: ['Onion'], garlic: ['Garlic'], tomato: ['Tomato'], carrot: ['Carrot'], chili: ['Salsa (sauce)'], pepper: ['Stuffed peppers'],
  cucumber: ['Cucumber'], greens: ['Leaf vegetable'], broccoli: ['Broccoli'], mushroom: ['Edible mushroom'], corn: ['Maize'], eggplant: ['Eggplant'],
  pumpkin: ['Pumpkin'], avocado: ['Avocado'], olive: ['Olive'], lemon: ['Lemon'], apple: ['Apple'], banana: ['Banana'], berries: ['Berry'],
  strawberry: ['Strawberry'], mango: ['Mango'], grapes: ['Grape'], coconut: ['Coconut'], herb: ['Herb'], sauce: ['Sauce'], spice: ['Spice'],
  coffee: ['Tea', 'Coffee'], drink: ['Juice'], ice: ['Ice cream'], water: ['Drinking water']
};

const PROTEIN = /^(chicken|lamb|beef|fish|prawn|prawns|shrimp|vegetable|veggie|vegetarian|vegan|turkey|tuna|salmon)\s+/i;
const CUISINE = /^(lebanese|syrian|palestinian|jordanian|levantine|gulf|emirati|saudi|kuwaiti|qatari|omani|bahraini|yemeni|iraqi|persian|turkish|greek|cypriot|moroccan|tunisian|algerian|libyan|egyptian|sudanese|indian|pakistani|thai|japanese|korean|vietnamese|chinese|mexican|spanish|italian|french|german|british|american|arabic|middle eastern|mediterranean|asian|african|brazilian|peruvian|cuban|jamaican|hawaiian)\s+/i;
const sentence = (s: string) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

/** Wikipedia article titles to try for a recipe, best first. */
export function photoCandidates(r: Pick<Recipe, 'id' | 'title' | 'emoji'>): string[] {
  const out: string[] = [...(PHOTO_TITLES[r.id] ?? [])];
  const title = r.title;
  for (const [re, t] of SPELL) if (re.test(title)) { out.push(t); break; }
  const paren = (title.match(/\(([^)]+)\)/) || [])[1];
  let base = title.replace(/\([^)]*\)/g, ' ').replace(/\b(\d+-Minute|One-Pot|Air Fryer|Quick|Easy|Classic|Speedy|Simple|Instant|Meal-Prep|Lunchbox|Baked|Kids'?)\b/gi, '').replace(/\s+/g, ' ').trim();
  base = base.split(/ with | in | on | & | and /i)[0].trim();
  const core = base.replace(CUISINE, '').replace(PROTEIN, '').replace(CUISINE, '').trim();
  if (paren && !/easy|halal|kids|lunchbox|quick|meal-prep|alcohol|free/i.test(paren)) out.push(sentence(paren));
  out.push(sentence(base), sentence(core));
  const words = core.split(' ');
  if (words.length > 1) out.push(sentence(words.slice(-2).join(' ')), sentence(words[words.length - 1].replace(/s$/, '')));
  out.push(...(GENERIC[legacyIcon(r.emoji) ?? 'plate'] ?? []));
  return [...new Set(out.filter(t => t && t.length > 2))];
}

/**
 * Find photos for starter recipes that don't have one (or have an auto photo
 * when `force`). Your own photos are never replaced. ~1000 recipes need only a few
 * dozen small requests: 40 titles per request, one round per candidate depth.
 */
export async function resolveStarterPhotos(force = false, onProgress?: (done: number, total: number) => void): Promise<number> {
  const recipes = await db.recipes.toArray();
  const targets = recipes.filter(r => r.builtIn && (!r.image || (force && r.photoAuto)));
  if (!targets.length) return 0;
  const cands = new Map(targets.map(r => [r.id, photoCandidates(r)]));
  const found = new Map<string, PhotoHit>();
  const remaining = new Set(targets.map(r => r.id));
  const counts = new Map<string, number>();
  recipes.forEach(r => r.image && !remaining.has(r.id) && counts.set(r.image, (counts.get(r.image) ?? 0) + 1));
  const maxDepth = Math.max(...[...cands.values()].map(c => c.length));
  for (let depth = 0; depth < maxDepth && remaining.size; depth++) {
    const ask = new Map<string, string>();
    for (const id of remaining) { const t = cands.get(id)?.[depth]; if (t) ask.set(id, t); }
    if (!ask.size) continue;
    let hits: Map<string, PhotoHit>;
    try { hits = await wikiLeadImages(Array.from(ask.values())); }
    catch (e) { if (!found.size) throw e; break; } // keep what we found; the rest is retried later
    for (const [id, t] of ask) {
      const h = hits.get(t);
      if (!h) continue;
      // avoid repeating the same photo too often unless this is a generic fallback for the dish type
      const isGeneric = GENERIC_TITLES.has(t);
      if ((counts.get(h.url) ?? 0) >= 3 && !isGeneric) continue;
      found.set(id, h); counts.set(h.url, (counts.get(h.url) ?? 0) + 1); remaining.delete(id);
    }
    onProgress?.(found.size, targets.length);
  }
  // automatic photos are per-device, not user edits: don't sync them
  await untracked(async () => {
    for (const [id, h] of found) {
      const cur = await db.recipes.get(id);
      if (!cur) continue;
      if (cur.image && !cur.photoAuto) continue; // never replace your own photo
      await db.recipes.update(id, { image: h.url, imageCredit: { label: h.label, page: h.page }, photoAuto: true } as Partial<Recipe>);
    }
  });
  prefetchPhotos(Array.from(found.values()).map(h => h.url));
  return found.size;
}

const GENERIC_TITLES = new Set(Object.values(GENERIC).flat());
let running = false;
let again = false;
let lastRun = 0;
/** Fill in photos for any starter recipe without one, whenever the device is online (at most every 10 minutes). */
export async function autoResolvePhotos(notify?: (msg: string) => void, fresh = false) {
  if (running) { if (fresh) again = true; return; }
  if (!navigator.onLine || (!fresh && Date.now() - lastRun < 10 * 60_000)) return;
  const missing = await db.recipes.filter(r => !!r.builtIn && !r.image).count();
  if (!missing) return;
  running = true; lastRun = Date.now();
  try {
    const n = await resolveStarterPhotos(false);
    if (n) notify?.(`Added ${n} recipe photos`);
  } catch { lastRun = 0; /* try again later */ } finally {
    running = false;
    if (again) { again = false; void autoResolvePhotos(notify, true); }
  }
}
