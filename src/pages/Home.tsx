import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { saveSettings, useRecipeMap, useRecipes, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { Cover, RecipeCard, totalTime } from '../components/RecipeCard';
import { Chip, Sheet } from '../components/ui';
import { MEAL_TYPES, SLOTS, type MealType, type PlanEntry, type Recipe } from '../types';
import { today, capitalize, addDays, weekStartOf, DAY_SHORT, mondayIndex, parseIso } from '../lib/util';
import { recipeNutrition } from '../lib/ingredients';
import { eligibleRecipes } from '../lib/planner';
import { fmtMoney, planCost, recipeCost } from '../lib/pricing';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const settings = useSettings();
  const recipes = useRecipes() ?? [];
  const map = useRecipeMap();
  const nav = useNavigate();
  const [decide, setDecide] = useState(false);
  const start = today();
  const end = addDays(start, 6);
  const upcoming = useLiveQuery(() => db.plan.where('date').between(start, end, true, true).toArray(), [start]) ?? [];
  const ws = weekStartOf(start, settings.weekStart);
  const weekEntries = useLiveQuery(() => db.plan.where('date').between(ws, addDays(ws, 6), true, true).toArray(), [ws]) ?? [];
  const groceryLeft = useLiveQuery(() => db.grocery.filter(g => !g.checked).count(), []) ?? 0;

  // One featured meal per upcoming day (dinner first, like Albo's "This week")
  const days = useMemo(() => {
    const byDay = new Map<string, PlanEntry[]>();
    upcoming.forEach(e => { const l = byDay.get(e.date) ?? []; l.push(e); byDay.set(e.date, l); });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i)).map(d => {
      const list = (byDay.get(d) ?? []).filter(e => e.recipeId).sort((a, b) => (a.slot === 'dinner' ? -1 : b.slot === 'dinner' ? 1 : SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot)));
      return { date: d, main: list[0], more: Math.max(0, list.length - 1) };
    });
  }, [upcoming, start]);
  const plannedDays = days.filter(d => d.main);

  const weekCost = planCost(weekEntries, map, settings.priceOverrides);
  const favourites = recipes.filter(r => r.favorite).slice(0, 12);
  const doable = eligibleRecipes(recipes, settings);
  const quick = doable.filter(r => totalTime(r) > 0 && totalTime(r) <= 20).slice(0, 12);
  const budgetFriendly = [...doable].sort((a, b) => recipeCost(a, settings.priceOverrides).perServing - recipeCost(b, settings.priceOverrides).perServing).filter(r => r.mealTypes.includes('dinner')).slice(0, 12);
  const recent = [...recipes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
  const cuisines = useMemo(() => Array.from(new Set(recipes.map(r => r.cuisine))).sort(), [recipes]);
  const initial = (settings.name || 'Me').trim()[0]?.toUpperCase();

  return (
    <div className="page">
      <header className="home-head">
        <div>
          <div className="hello">{greeting()}{settings.name ? `, ${settings.name}` : ''} 👋</div>
          <h1>What’s cooking?</h1>
        </div>
        <Link to="/settings" className="avatar" aria-label="Me and settings">{initial}</Link>
      </header>

      <Link to="/recipes" className="search-box search-link">
        <Icon name="search" size={18} />
        <span>Search {recipes.length} recipes</span>
      </Link>

      {!settings.featureTipSeen && (
        <div className="feature-tip">
          <span className="emoji">🍳</span>
          <div className="grow">
            <b>New: your kitchen & budget</b>
            <small className="muted">Tell Savora which appliances you have and your weekly grocery budget.</small>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { saveSettings({ featureTipSeen: true }); nav('/settings#kitchen'); }}>Set up</button>
          <button className="icon-btn sm" aria-label="Dismiss" onClick={() => saveSettings({ featureTipSeen: true })}><Icon name="close" size={16} /></button>
        </div>
      )}

      <div className="hero-actions">
        <button className="hero-tile hero-dark" onClick={() => setDecide(true)}>
          <span className="hero-emoji">🎲</span>
          <span><b>Decide for me</b><br /><small>Can’t choose? Roll the dice</small></span>
        </button>
        <button className="hero-tile hero-light" onClick={() => nav('/plan?generate=1')}>
          <span className="hero-emoji">✨</span>
          <span><b>Plan my week</b><br /><small>{settings.weeklyBudget ? `Within ${fmtMoney(settings.weeklyBudget, settings.currency)}` : 'Breakfast to dinner'}</small></span>
        </button>
      </div>

      <div className="hero-actions">
        <button className="hero-tile hero-light" onClick={() => nav('/fridge')}>
          <span className="hero-emoji">🧊</span>
          <span><b>What can I make?</b><br /><small>From what you have</small></span>
        </button>
        <button className="hero-tile hero-light" onClick={() => nav('/photo')}>
          <span className="hero-emoji">📸</span>
          <span><b>From a photo</b><br /><small>Page, card or dish</small></span>
        </button>
      </div>

      <section>
        <div className="section-head">
          <h2>This week</h2>
          <Link to="/plan">See plan</Link>
        </div>
        {plannedDays.length === 0 ? (
          <button className="add-row" onClick={() => nav('/plan?generate=1')}>
            <span className="add-ico"><Icon name="sparkles" size={20} /></span>
            <span className="grow" style={{ textAlign: 'left' }}>Nothing planned yet — let Savora plan your week</span>
          </button>
        ) : (
          <div className="week-list">
            {days.map(({ date, main, more }) => {
              const r = main?.recipeId ? map.get(main.recipeId) : undefined;
              const isToday = date === start;
              return (
                <button key={date} className="week-row" onClick={() => (r ? nav(`/recipe/${r.id}`) : nav('/plan'))}>
                  <div className={`week-day ${isToday ? 'today' : ''}`}>
                    <b>{isToday ? 'Today' : DAY_SHORT[mondayIndex(date)]}</b>
                    <small>{parseIso(date).getDate()}</small>
                  </div>
                  {r ? <Cover recipe={r} className="cover-xs" /> : <div className="cover cover-xs cover-emoji" style={{ ['--hue' as string]: 0, opacity: 0.5 }}><span>＋</span></div>}
                  <div className="week-row-body">
                    <span className="week-row-title">{r ? r.title : <span className="faint">Nothing planned</span>}</span>
                    {main && <span className="row gap-sm"><span className={`tag tag-${main.slot}`}>{capitalize(main.slot)}</span>{more > 0 && <small className="faint">+{more} more</small>}</span>}
                  </div>
                  {r && main && !main.leftover && <Icon name="chevronRight" size={18} className="faint" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {(settings.weeklyBudget > 0 || groceryLeft > 0) && (
        <div className="summary-row">
          <Link to="/plan" className="summary-card">
            <span className="label">Meals this week</span>
            <span className="big">{fmtMoney(weekCost, settings.currency, 0)}{settings.weeklyBudget > 0 && <small> / {settings.weeklyBudget}</small>}</span>
            {settings.weeklyBudget > 0 && <div className={`bar ${weekCost > settings.weeklyBudget ? 'over' : ''}`}><span style={{ width: `${Math.min(100, (weekCost / settings.weeklyBudget) * 100)}%` }} /></div>}
          </Link>
          <Link to="/groceries" className="summary-card">
            <span className="label">Groceries</span>
            <span className="big">{groceryLeft}<small> to buy</small></span>
            <small className="faint">Tap to open your list</small>
          </Link>
        </div>
      )}

      {favourites.length > 0 && <Shelf title="Your favourites" to="/recipes?fav=1" recipes={favourites} />}
      <Shelf title="Quick & easy" to="/recipes?time=20" recipes={quick} />
      <Shelf title="Budget-friendly dinners" recipes={budgetFriendly} />
      <Shelf title="Recently added" to="/recipes" recipes={recent} />

      <section>
        <div className="section-head"><h2>Cuisines</h2></div>
        <div className="chip-row wrap">
          {cuisines.map(c => <Chip key={c} onClick={() => nav(`/recipes?cuisine=${encodeURIComponent(c)}`)}>{c}</Chip>)}
        </div>
      </section>

      <DecideSheet open={decide} onClose={() => setDecide(false)} recipes={recipes} />
    </div>
  );
}

function Shelf({ title, to, recipes }: { title: string; to?: string; recipes: Recipe[] }) {
  if (!recipes.length) return null;
  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        {to && <Link to={to}>See all</Link>}
      </div>
      <div className="shelf">
        {recipes.map(r => <RecipeCard key={r.id} recipe={r} compact />)}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Decide */

export function DecideSheet({ open, onClose, recipes }: { open: boolean; onClose: () => void; recipes: Recipe[] }) {
  const settings = useSettings();
  const nav = useNavigate();
  const [meal, setMeal] = useState<MealType | 'any'>(() => {
    const h = new Date().getHours();
    return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner';
  });
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [cuisine, setCuisine] = useState<string>('any');
  const [favOnly, setFavOnly] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [pick, setPick] = useState<Recipe | null>(null);
  const cuisines = Array.from(new Set(recipes.map(r => r.cuisine))).sort();

  const pool = useMemo(() => eligibleRecipes(recipes, settings).filter(r =>
    (meal === 'any' || r.mealTypes.includes(meal)) &&
    (!maxTime || totalTime(r) <= maxTime) &&
    (cuisine === 'any' || r.cuisine === cuisine) &&
    (!favOnly || r.favorite) &&
    (!cheap || recipeCost(r, settings.priceOverrides).perServing <= 6)
  ), [recipes, settings, meal, maxTime, cuisine, favOnly, cheap]);

  const roll = () => {
    if (!pool.length) { setPick(null); return; }
    const options = pool.length > 1 && pick ? pool.filter(r => r.id !== pick.id) : pool;
    setPick(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <Sheet open={open} onClose={() => { setPick(null); onClose(); }} title="Decide for me" tall>
      <div className="section-label">Meal</div>
      <div className="chip-row wrap">
        <Chip active={meal === 'any'} onClick={() => setMeal('any')}>Any</Chip>
        {MEAL_TYPES.map(m => <Chip key={m} active={meal === m} onClick={() => setMeal(m)}>{capitalize(m)}</Chip>)}
      </div>
      <div className="section-label">Time</div>
      <div className="chip-row wrap">
        {[null, 15, 30, 45].map(t => <Chip key={String(t)} active={maxTime === t} onClick={() => setMaxTime(t)}>{t ? `≤ ${t} min` : 'Any'}</Chip>)}
      </div>
      <div className="section-label">Cuisine</div>
      <div className="chip-row wrap">
        <Chip active={cuisine === 'any'} onClick={() => setCuisine('any')}>Any</Chip>
        {cuisines.map(c => <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)}>{c}</Chip>)}
      </div>
      <div className="chip-row wrap" style={{ marginTop: 12 }}>
        <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}>♥ Favourites</Chip>
        <Chip active={cheap} onClick={() => setCheap(!cheap)}>💰 Under {fmtMoney(6, settings.currency, 0)}/serving</Chip>
      </div>
      <p className="fineprint">Only recipes you can make with your kitchen and preferences.</p>

      <div className="decide-result">
        {pick ? (
          <div className="decide-card">
            <Cover recipe={pick} large />
            <h3>{pick.title}</h3>
            <p className="muted">{pick.cuisine} · {totalTime(pick)} min · {Math.round(recipeNutrition(pick).perServing.kcal)} kcal · {fmtMoney(recipeCost(pick, settings.priceOverrides).perServing, settings.currency)}</p>
            <div className="row gap">
              <button className="btn btn-soft grow" onClick={roll}><Icon name="refresh" size={18} /> Another</button>
              <button className="btn btn-primary grow" onClick={() => nav(`/recipe/${pick.id}`)}>Let’s cook it</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary block btn-lg" onClick={roll} disabled={!pool.length}>
            🎲 {pool.length ? `Pick from ${pool.length} recipe${pool.length === 1 ? '' : 's'}` : 'No matches — loosen filters'}
          </button>
        )}
      </div>
    </Sheet>
  );
}
