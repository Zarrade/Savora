import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCollections, useRecipes, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { RecipeCard, avgRating, totalTime } from '../components/RecipeCard';
import { Chip, ChipInput, Empty, Sheet, PageHeader } from '../components/ui';
import { DIETS, MEAL_TYPES, type Diet, type MealType, type Recipe } from '../types';
import { recipeConflicts, recipeDiets, recipeNutrition } from '../lib/ingredients';
import { missingEquipment } from '../lib/kitchen';
import { fmtMoney, recipeCost } from '../lib/pricing';
import { capitalize } from '../lib/util';
import { SIcon } from '../components/SavoraIcons';
import { legacyIcon } from '../lib/foodIcons';
import { CuisinePicker } from '../components/CuisinePicker';

type Sort = 'recent' | 'az' | 'quick' | 'cheap' | 'kcal' | 'protein' | 'rating' | 'cooked';
const PAGE_SIZE = 24; // fills 2, 3, 4 or 6 columns evenly
const PAGE_KEY = 'savora-recipes-page';
const SORTS: [Sort, string][] = [['recent', 'Recently updated'], ['az', 'A–Z'], ['quick', 'Quickest'], ['cheap', 'Cheapest'], ['kcal', 'Fewest calories'], ['protein', 'Most protein'], ['rating', 'Top rated'], ['cooked', 'Most cooked']];

export default function Recipes() {
  const recipes = useRecipes();
  const collections = useCollections();
  const settings = useSettings();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [meal, setMeal] = useState<MealType[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [cuisines, setCuisines] = useState<string[]>(() => (params.get('cuisine') ? [params.get('cuisine')!] : []));
  const [maxTime, setMaxTime] = useState<number | null>(() => (params.get('time') ? Number(params.get('time')) : null));
  const [withIng, setWithIng] = useState<string[]>([]);
  const [withoutIng, setWithoutIng] = useState<string[]>([]);
  const [fav, setFav] = useState(params.get('fav') === '1');
  const [hideConflicts, setHideConflicts] = useState(false);
  const [myKitchen, setMyKitchen] = useState(false);
  const [maxCost, setMaxCost] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('recent');
  const col = params.get('col');

  const exclusions = useMemo(() => [...settings.allergies, ...settings.avoid], [settings.allergies, settings.avoid]);

  const list = useMemo(() => {
    if (!recipes) return [];
    const s = q.trim().toLowerCase();
    const hasAll = (r: Recipe, words: string[]) => words.every(w => r.ingredients.some(i => i.name.toLowerCase().includes(w.toLowerCase())));
    const hasNone = (r: Recipe, words: string[]) => words.every(w => !r.ingredients.some(i => i.name.toLowerCase().includes(w.toLowerCase())));
    const out = recipes.filter(r =>
      (!s || r.title.toLowerCase().includes(s) || r.cuisine.toLowerCase().includes(s) || r.tags.some(t => t.includes(s)) || r.ingredients.some(i => i.name.toLowerCase().includes(s))) &&
      (!meal.length || meal.some(m => r.mealTypes.includes(m))) &&
      (!cuisines.length || cuisines.includes(r.cuisine)) &&
      (!maxTime || totalTime(r) <= maxTime) &&
      (!fav || r.favorite) &&
      (!col || r.collections.includes(col)) &&
      (!withIng.length || hasAll(r, withIng)) &&
      (!withoutIng.length || hasNone(r, withoutIng)) &&
      (!diets.length || diets.every(d => recipeDiets(r).includes(d))) &&
      (!hideConflicts || !recipeConflicts(r, exclusions).length) &&
      (!myKitchen || !missingEquipment(r, settings.equipment).length) &&
      (!maxCost || recipeCost(r, settings.priceOverrides).perServing <= maxCost)
    );
    const kcal = (r: Recipe) => recipeNutrition(r).perServing.kcal || 9999;
    const prot = (r: Recipe) => recipeNutrition(r).perServing.protein;
    const sorters: Record<Sort, (a: Recipe, b: Recipe) => number> = {
      recent: (a, b) => b.updatedAt - a.updatedAt,
      az: (a, b) => a.title.localeCompare(b.title),
      quick: (a, b) => (totalTime(a) || 999) - (totalTime(b) || 999),
      cheap: (a, b) => recipeCost(a, settings.priceOverrides).perServing - recipeCost(b, settings.priceOverrides).perServing,
      kcal: (a, b) => kcal(a) - kcal(b),
      protein: (a, b) => prot(b) - prot(a),
      rating: (a, b) => avgRating(b) - avgRating(a),
      cooked: (a, b) => b.cookedCount - a.cookedCount
    };
    return out.sort(sorters[sort]);
  }, [recipes, q, meal, cuisines, maxTime, fav, col, withIng, withoutIng, diets, hideConflicts, myKitchen, maxCost, sort, exclusions, settings.equipment, settings.priceOverrides]);

  const activeCount = meal.length + diets.length + cuisines.length + (maxTime ? 1 : 0) + withIng.length + withoutIng.length + (hideConflicts ? 1 : 0) + (myKitchen ? 1 : 0) + (maxCost ? 1 : 0);
  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const clearAll = () => { setMeal([]); setDiets([]); setCuisines([]); setMaxTime(null); setWithIng([]); setWithoutIng([]); setHideConflicts(false); setMyKitchen(false); setMaxCost(null); setFav(false); setParams({}); };
  const colName = col ? collections.find(c => c.id === col) : undefined;

  // Pagination: remembered for this tab while the filters stay the same (so Back from a recipe returns to the same page)
  const filterKey = JSON.stringify([col, q, meal, diets, cuisines, maxTime, withIng, withoutIng, fav, hideConflicts, myKitchen, maxCost, sort]);
  const [pageState, setPageState] = useState<{ key: string; page: number }>(() => {
    try { const s = JSON.parse(sessionStorage.getItem(PAGE_KEY) ?? 'null'); if (s?.key === filterKey) return s; } catch { /* ignore */ }
    return { key: filterKey, page: 1 };
  });
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = pageState.key === filterKey ? Math.min(pageState.page, pageCount) : 1;
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goPage = (n: number) => {
    const next = { key: filterKey, page: Math.max(1, Math.min(pageCount, n)) };
    setPageState(next);
    try { sessionStorage.setItem(PAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page">
      <PageHeader title={colName ? colName.name : 'Recipes'} back={col ? '/recipes' : undefined}
        right={<button className="icon-btn" aria-label="New recipe" onClick={() => nav('/new')}><Icon name="plus" /></button>} />

      <div className="row gap">
        <div className="search-box grow">
          <Icon name="search" size={18} />
          <input placeholder="Search title, cuisine or ingredient" value={q} onChange={e => setQ(e.target.value)} />
          {q && <button className="icon-btn sm" aria-label="Clear search" onClick={() => setQ('')}><Icon name="close" size={16} /></button>}
        </div>
        <button className={`icon-btn boxed ${activeCount ? 'has-badge' : ''}`} aria-label="Filters" onClick={() => setShowFilters(true)}>
          <Icon name="filter" size={20} />
          {activeCount > 0 && <span className="badge-dot">{activeCount}</span>}
        </button>
      </div>

      {!col && (
        <div className="chip-row scroll">
          <Chip active={fav} onClick={() => setFav(!fav)}><SIcon name="heart" size={16} /> Favourites</Chip>
          <Chip active={myKitchen} onClick={() => setMyKitchen(!myKitchen)}><SIcon name="hob" size={16} /> My kitchen</Chip>
          <Chip active={maxCost === 6} onClick={() => setMaxCost(maxCost === 6 ? null : 6)}><SIcon name="wallet" size={16} /> Budget</Chip>
          {collections.map(c => <Chip key={c.id} onClick={() => setParams({ col: c.id })}><SIcon name={legacyIcon(c.emoji) ?? 'folder'} size={16} /> {c.name}</Chip>)}
          {MEAL_TYPES.map(m => <Chip key={m} active={meal.includes(m)} onClick={() => toggle(meal, m, setMeal)}>{capitalize(m)}</Chip>)}
        </div>
      )}

      <div className="row between list-meta">
        <span className="muted">{list.length > PAGE_SIZE ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, list.length)} of ` : ''}{list.length} recipe{list.length === 1 ? '' : 's'}{activeCount ? <> · <button className="link" onClick={clearAll}>clear filters</button></> : null}</span>
        <select className="select-inline" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort">
          {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {recipes && list.length === 0 ? (
        <Empty icon="search" title="No recipes found">Try fewer filters, or <button className="link" onClick={() => nav('/new')}>add a recipe</button>.</Empty>
      ) : (
        <>
          <div className="grid">
            {shown.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
          <Pager page={page} count={pageCount} onPage={goPage} />
        </>
      )}

      <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filters" tall
        footer={<div className="row gap"><button className="btn btn-ghost grow" onClick={clearAll}>Clear</button><button className="btn btn-primary grow" onClick={() => setShowFilters(false)}>Show {list.length}</button></div>}>
        <div className="section-label">Meal</div>
        <div className="chip-row wrap">{MEAL_TYPES.map(m => <Chip key={m} active={meal.includes(m)} onClick={() => toggle(meal, m, setMeal)}>{capitalize(m)}</Chip>)}</div>
        <div className="section-label">Total time</div>
        <div className="chip-row wrap">{[null, 15, 20, 30, 45, 60].map(t => <Chip key={String(t)} active={maxTime === t} onClick={() => setMaxTime(t)}>{t ? `≤ ${t} min` : 'Any'}</Chip>)}</div>
        <div className="section-label">Cost per serving</div>
        <div className="chip-row wrap">{[null, 4, 6, 10].map(c => <Chip key={String(c)} active={maxCost === c} onClick={() => setMaxCost(c)}>{c ? `≤ ${fmtMoney(c, settings.currency, 0)}` : 'Any'}</Chip>)}</div>
        <div className="chip-row" style={{ marginTop: 12 }}><Chip active={myKitchen} onClick={() => setMyKitchen(!myKitchen)}><SIcon name="hob" size={16} /> Only what my kitchen can make</Chip></div>
        <div className="section-label">Cuisine</div>
        <CuisinePicker recipes={recipes ?? []} selected={cuisines} onPick={c => toggle(cuisines, c, setCuisines)} />
        <div className="section-label">Diet</div>
        <div className="chip-row wrap">{DIETS.map(d => <Chip key={d} active={diets.includes(d)} onClick={() => toggle(diets, d, setDiets)}>{capitalize(d)}</Chip>)}</div>
        <div className="section-label">Must include ingredients</div>
        <ChipInput values={withIng} onChange={setWithIng} placeholder="e.g. chicken, spinach" />
        <div className="section-label">Without ingredients</div>
        <ChipInput values={withoutIng} onChange={setWithoutIng} placeholder="e.g. mushrooms" />
        {exclusions.length > 0 && (
          <div className="chip-row" style={{ marginTop: 12 }}>
            <Chip active={hideConflicts} onClick={() => setHideConflicts(!hideConflicts)}>Hide recipes with my allergies/avoid foods</Chip>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** Page numbers with ellipses: 1 … 4 5 6 … 42 */
function Pager({ page, count, onPage }: { page: number; count: number; onPage: (n: number) => void }) {
  if (count <= 1) return null;
  const nums = new Set([1, count, page - 1, page, page + 1].filter(n => n >= 1 && n <= count));
  const sorted = Array.from(nums).sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) items.push('gap'); items.push(n); });
  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><Icon name="chevronLeft" size={18} /></button>
      {items.map((n, i) => n === 'gap'
        ? <span key={`g${i}`} className="gap">…</span>
        : <button key={n} type="button" className={`pg-num ${n === 1 || n === count ? 'edge' : ''}`} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>{n}</button>)}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === count} aria-label="Next page"><Icon name="chevronRight" size={18} /></button>
    </nav>
  );
}
