import { CuisinePicker } from '../components/CuisinePicker';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { saveSettings, useRecipeMap, useRecipes, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { Cover, RecipeCard, totalTime } from '../components/RecipeCard';
import { Chip, Sheet } from '../components/ui';
import { Logo } from '../components/Logo';
import { SyncBadge } from '../components/Account';
import { MEAL_TYPES, SLOTS, type MealType, type PlanEntry, type Recipe } from '../types';
import { today, capitalize, addDays, weekStartOf, DAY_SHORT, mondayIndex, parseIso } from '../lib/util';
import { recipeNutrition } from '../lib/ingredients';
import { eligibleRecipes } from '../lib/planner';
import { fmtMoney, planCost, recipeCost } from '../lib/pricing';
import { SIcon } from '../components/SavoraIcons';

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
  // Today's next meal (or the next planned one) gets the big card
  const featured = useMemo(() => {
    const h = new Date().getHours();
    const order: string[] = h < 11 ? ['breakfast', 'lunch', 'dinner', 'snack'] : h < 16 ? ['lunch', 'dinner', 'snack'] : ['dinner', 'snack'];
    const todays = upcoming.filter(e => e.date === start && e.recipeId && !e.leftover && order.includes(e.slot)).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
    const e = todays[0] ?? upcoming.filter(x => x.date > start && x.recipeId).sort((a, b) => a.date.localeCompare(b.date))[0];
    const r = e?.recipeId ? map.get(e.recipeId) : undefined;
    if (!e || !r) return null;
    const label = e.date === start ? `${capitalize(e.slot)} today` : `${DAY_SHORT[mondayIndex(e.date)]} · ${capitalize(e.slot)}`;
    return { r, label };
  }, [upcoming, start, map]);

  const weekCost = planCost(weekEntries, map, settings.priceOverrides);
  const favourites = recipes.filter(r => r.favorite).slice(0, 12);
  const doable = eligibleRecipes(recipes, settings);
  const quick = doable.filter(r => totalTime(r) > 0 && totalTime(r) <= 20).slice(0, 12);
  const budgetFriendly = [...doable].sort((a, b) => recipeCost(a, settings.priceOverrides).perServing - recipeCost(b, settings.priceOverrides).perServing).filter(r => r.mealTypes.includes('dinner')).slice(0, 12);
  const recent = [...recipes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
  const initial = (settings.name || 'Me').trim()[0]?.toUpperCase();

  return (
    <div className="page home">
      <header className="home-top">
        <Logo size={30} />
        <div className="row gap-sm">
          <SyncBadge />
          <Link to="/settings" className="avatar" aria-label="Me and settings">{initial}</Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="hello">{greeting()}{settings.name ? `, ${settings.name}` : ''}</div>
        <h1 className="display">What’s cooking <em>{new Date().getHours() < 11 ? 'this morning' : new Date().getHours() < 16 ? 'for lunch' : 'tonight'}</em>?</h1>
        <Link to="/recipes" className="search-box search-link">
          <Icon name="search" size={18} />
          <span className="truncate">Search {recipes.length} recipes…</span>
        </Link>
      </section>

      {!settings.featureTipSeen && (
        <div className="feature-tip">
          <span className="feature-ico"><Icon name="settings" size={20} /></span>
          <div className="grow">
            <b>Set up your kitchen & budget</b>
            <small className="muted">Savora only suggests what you can actually cook.</small>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { saveSettings({ featureTipSeen: true }); nav('/settings#kitchen'); }}>Set up</button>
          <button className="icon-btn sm" aria-label="Dismiss" onClick={() => saveSettings({ featureTipSeen: true })}><Icon name="close" size={16} /></button>
        </div>
      )}

      {featured ? (
        <button className="tonight" onClick={() => nav(`/recipe/${featured.r.id}`)}>
          <Cover recipe={featured.r} large className="tonight-cover" />
          <div className="tonight-shade" />
          <div className="tonight-body">
            <span className="tonight-kicker">{featured.label}</span>
            <h2>{featured.r.title}</h2>
            <span className="tonight-meta">
              <span><Icon name="clock" size={14} /> {totalTime(featured.r)} min</span>
              <span><Icon name="flame" size={14} /> {Math.round(recipeNutrition(featured.r).perServing.kcal)} kcal</span>
              {featured.r.cuisine && <span>{featured.r.cuisine}</span>}
            </span>
          </div>
          <span className="tonight-cta" onClick={e => { e.stopPropagation(); nav(`/cook/${featured.r.id}`); }}><Icon name="play" size={16} /> Cook</span>
        </button>
      ) : (
        <button className="plan-cta" onClick={() => nav('/plan?generate=1')}>
          <span className="plan-cta-ico"><Icon name="sparkles" size={24} /></span>
          <span className="grow">
            <b>Plan your week in one tap</b>
            <small>Breakfast to dinner{settings.weeklyBudget ? `, within ${fmtMoney(settings.weeklyBudget, settings.currency, 0)}` : ''} — built around your kitchen and diet.</small>
          </span>
          <Icon name="arrowRight" size={20} />
        </button>
      )}

      <div className="ai-grid">
        <button className="ai-tile ai-tile-a" onClick={() => nav('/fridge')}>
          <span className="ai-tile-ico"><Icon name="leaf" size={20} /></span>
          <b>What can I make?</b><small>From what you have</small>
        </button>
        <button className="ai-tile ai-tile-b" onClick={() => nav('/photo')}>
          <span className="ai-tile-ico"><Icon name="camera" size={20} /></span>
          <b>From a photo</b><small>Page, card or dish</small>
        </button>
        <button className="ai-tile ai-tile-c" onClick={() => setDecide(true)}>
          <span className="ai-tile-ico"><Icon name="dice" size={20} /></span>
          <b>Decide for me</b><small>Can’t choose? Roll</small>
        </button>
        <button className="ai-tile ai-tile-d" onClick={() => nav('/import')}>
          <span className="ai-tile-ico"><Icon name="link" size={20} /></span>
          <b>Import a recipe</b><small>Paste text or a link</small>
        </button>
      </div>

      <section>
        <div className="section-head">
          <h2>Your week</h2>
          <Link to="/plan">Open planner</Link>
        </div>
        <div className="week-strip">
          {days.map(({ date, main, more }) => {
            const r = main?.recipeId ? map.get(main.recipeId) : undefined;
            const isToday = date === start;
            return (
              <button key={date} className={`day-card ${isToday ? 'today' : ''} ${r ? '' : 'empty'}`} onClick={() => (r ? nav(`/recipe/${r.id}`) : nav('/plan'))}>
                <span className="day-card-head"><b>{isToday ? 'Today' : DAY_SHORT[mondayIndex(date)]}</b><small>{parseIso(date).getDate()}</small></span>
                {r ? <Cover recipe={r} className="day-card-cover" /> : <span className="day-card-add"><Icon name="plus" size={20} /></span>}
                <span className="day-card-title">{r ? r.title : 'Nothing planned'}</span>
                {main && more > 0 && <small className="faint">+{more} more</small>}
              </button>
            );
          })}
        </div>
      </section>

      {(settings.weeklyBudget > 0 || groceryLeft > 0) && (
        <div className="summary-row">
          <Link to="/plan" className="summary-card">
            <span className="label">Meals this week</span>
            <span className="big">{fmtMoney(weekCost, settings.currency, 0)}{settings.weeklyBudget > 0 && <small> / {fmtMoney(settings.weeklyBudget, settings.currency, 0)}</small>}</span>
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
        <div className="section-head"><h2>Explore cuisines</h2></div>
        <CuisinePicker tiles recipes={recipes} onPick={c => nav(`/recipes?cuisine=${encodeURIComponent(c)}`)} />
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
      <CuisinePicker any recipes={recipes} selected={cuisine === 'any' ? [] : [cuisine]} onPick={c => setCuisine(!c || c === cuisine ? 'any' : c)} />
      <div className="chip-row wrap" style={{ marginTop: 12 }}>
        <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}><SIcon name="heart" size={16} /> Favourites</Chip>
        <Chip active={cheap} onClick={() => setCheap(!cheap)}><SIcon name="wallet" size={16} /> Under {fmtMoney(6, settings.currency, 0)}/serving</Chip>
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
            <SIcon name="sparkle" size={18} /> {pool.length ? `Pick from ${pool.length} recipe${pool.length === 1 ? '' : 's'}` : 'No matches — loosen filters'}
          </button>
        )}
      </div>
    </Sheet>
  );
}
