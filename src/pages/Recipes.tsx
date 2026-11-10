import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCollections, useRecipes, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { RecipeCard, avgRating, totalTime } from '../components/RecipeCard';
import { Chip, ChipInput, Empty, Sheet, PageHeader } from '../components/ui';
import { DIETS, MEAL_TYPES, type Diet, type MealType, type Recipe } from '../types';
import { recipeConflicts, recipeDiets, recipeNutrition } from '../lib/ingredients';
import { missingEquipment } from '../lib/kitchen';
import { recipeCost } from '../lib/pricing';
import { capitalize } from '../lib/util';

type Sort = 'recent' | 'az' | 'quick' | 'cheap' | 'kcal' | 'protein' | 'rating' | 'cooked';
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

  const allCuisines = useMemo(() => Array.from(new Set((recipes ?? []).map(r => r.cuisine))).sort(), [recipes]);
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

  return (
    <div className="page">
      <PageHeader title={colName ? `${colName.emoji} ${colName.name}` : 'Recipes'} back={col ? '/recipes' : undefined}
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
          <Chip active={fav} onClick={() => setFav(!fav)}>♥ Favourites</Chip>
          <Chip active={myKitchen} onClick={() => setMyKitchen(!myKitchen)}>🍳 My kitchen</Chip>
          <Chip active={maxCost === 6} onClick={() => setMaxCost(maxCost === 6 ? null : 6)}>💰 Budget</Chip>
          {collections.map(c => <Chip key={c.id} onClick={() => setParams({ col: c.id })}>{c.emoji} {c.name}</Chip>)}
          {MEAL_TYPES.map(m => <Chip key={m} active={meal.includes(m)} onClick={() => toggle(meal, m, setMeal)}>{capitalize(m)}</Chip>)}
        </div>
      )}

      <div className="row between list-meta">
        <span className="muted">{list.length} recipe{list.length === 1 ? '' : 's'}{activeCount ? <> · <button className="link" onClick={clearAll}>clear filters</button></> : null}</span>
        <select className="select-inline" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort">
          {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {recipes && list.length === 0 ? (
        <Empty icon="search" title="No recipes found">Try fewer filters, or <button className="link" onClick={() => nav('/new')}>add a recipe</button>.</Empty>
      ) : (
        <div className="grid">
          {list.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}

      <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filters" tall
        footer={<div className="row gap"><button className="btn btn-ghost grow" onClick={clearAll}>Clear</button><button className="btn btn-primary grow" onClick={() => setShowFilters(false)}>Show {list.length}</button></div>}>
        <div className="section-label">Meal</div>
        <div className="chip-row wrap">{MEAL_TYPES.map(m => <Chip key={m} active={meal.includes(m)} onClick={() => toggle(meal, m, setMeal)}>{capitalize(m)}</Chip>)}</div>
        <div className="section-label">Total time</div>
        <div className="chip-row wrap">{[null, 15, 20, 30, 45, 60].map(t => <Chip key={String(t)} active={maxTime === t} onClick={() => setMaxTime(t)}>{t ? `≤ ${t} min` : 'Any'}</Chip>)}</div>
        <div className="section-label">Cost per serving</div>
        <div className="chip-row wrap">{[null, 4, 6, 10].map(c => <Chip key={String(c)} active={maxCost === c} onClick={() => setMaxCost(c)}>{c ? `≤ ${settings.currency} ${c}` : 'Any'}</Chip>)}</div>
        <div className="chip-row" style={{ marginTop: 12 }}><Chip active={myKitchen} onClick={() => setMyKitchen(!myKitchen)}>🍳 Only what my kitchen can make</Chip></div>
        <div className="section-label">Cuisine</div>
        <div className="chip-row wrap">{allCuisines.map(c => <Chip key={c} active={cuisines.includes(c)} onClick={() => toggle(cuisines, c, setCuisines)}>{c}</Chip>)}</div>
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
