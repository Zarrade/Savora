import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { saveSettings, useRecipeMap, useRecipes, useSettings, useHaveNames } from '../hooks';
import { Icon } from '../components/Icon';
import { Cover } from '../components/RecipeCard';
import { RecipePicker } from '../components/Sheets';
import { Chip, PageHeader, Sheet, Stepper, Toggle, toast, useConfirm } from '../components/ui';
import { SLOTS, type PlanEntry, type PlanOptions, type Recipe, type Slot } from '../types';
import { addDays, capitalize, DAY_LONG, DAY_SHORT, fmtRange, mondayIndex, parseIso, today, weekDays, weekStartOf } from '../lib/util';
import { addNutrition, EMPTY_NUTRITION, recipeNutrition } from '../lib/ingredients';
import { applyRecipe, eligibleRecipes, generatePlan, regenerateEntry, repairLeftovers, slotMatches, suggestRecipes, type GenerateOptions } from '../lib/planner';
import { aiToast, useAIReady } from '../components/AI';
import { rankSwapCandidates } from '../lib/ai/features';
import { groceriesFromPlan, mergeInto } from '../lib/grocery';
import { fmtMoney, planCost, recipeCost } from '../lib/pricing';
import { SIcon } from '../components/SavoraIcons';

/** Write a generated set of entries for some dates, then fix leftover links across the week. */
async function saveGenerated(weekStart: string, before: PlanEntry[], out: PlanEntry[], dates: string[], slots: Slot[]) {
  const outIds = new Set(out.map(e => e.id));
  const toDelete = before.filter(e => dates.includes(e.date) && slots.includes(e.slot) && !outIds.has(e.id)).map(e => e.id);
  await db.transaction('rw', db.plan, async () => {
    await db.plan.bulkDelete(toDelete);
    await db.plan.bulkPut(out);
    const week = await db.plan.where('date').between(weekStart, addDays(weekStart, 6), true, true).toArray();
    const fixes = repairLeftovers(week);
    if (fixes.length) await db.plan.bulkPut(fixes);
  });
}

export default function Planner() {
  const settings = useSettings();
  const recipes = useRecipes() ?? [];
  const map = useRecipeMap();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => {
    const ws = weekStartOf(today(), settings.weekStart);
    // "Plan my week" on the last day of the week → plan next week
    return params.get('generate') === '1' && addDays(ws, 6) === today() ? addDays(ws, 7) : ws;
  });
  useEffect(() => { setWeekStart(w => weekStartOf(w, settings.weekStart)); }, [settings.weekStart]);
  const days = weekDays(weekStart);
  const entries = useLiveQuery(() => db.plan.where('date').between(days[0], days[6], true, true).toArray(), [weekStart]) ?? [];

  const [genOpen, setGenOpen] = useState(params.get('generate') === '1');
  const [sendOpen, setSendOpen] = useState(false);
  const [picker, setPicker] = useState<{ date: string; slot: Slot; replace?: PlanEntry } | null>(null);
  const [active, setActive] = useState<PlanEntry | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // entry id, date, or 'week'
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => { if (params.get('generate')) setParams({}, { replace: true }); }, [params, setParams]);

  const slotsShown = useMemo(() => {
    const s = new Set<Slot>(settings.planSlots);
    entries.forEach(e => s.add(e.slot));
    return SLOTS.filter(x => s.has(x));
  }, [settings.planSlots, entries]);

  const byDay = useMemo(() => {
    const m = new Map<string, PlanEntry[]>();
    for (const e of entries) { const l = m.get(e.date) ?? []; l.push(e); m.set(e.date, l); }
    return m;
  }, [entries]);

  const dayNutrition = (date: string) => (byDay.get(date) ?? []).reduce((acc, e) => {
    const r = e.recipeId ? map.get(e.recipeId) : undefined;
    return r ? addNutrition(acc, recipeNutrition(r).perServing) : acc;
  }, { ...EMPTY_NUTRITION });

  const plannedDays = days.filter(d => (byDay.get(d) ?? []).some(e => e.recipeId));
  const avgKcal = plannedDays.length ? plannedDays.reduce((a, d) => a + dayNutrition(d).kcal, 0) / plannedDays.length : 0;
  const avgProtein = plannedDays.length ? plannedDays.reduce((a, d) => a + dayNutrition(d).protein, 0) / plannedDays.length : 0;
  const weekCost = planCost(entries, map, settings.priceOverrides);
  const budget = settings.weeklyBudget;
  const isThisWeek = weekStart === weekStartOf(today(), settings.weekStart);
  const genDates = isThisWeek ? days.filter(d => d >= today()) : days;

  const baseOpts = (dates: string[], keepFilled: boolean): GenerateOptions => ({
    ...settings.planOptions, dates, slots: settings.planSlots, servings: settings.householdServings, cookingDays: settings.cookingDays, keepFilled
  });

  /* ------------------------------------------------------- actions */

  const regenMeal = async (e: PlanEntry) => {
    setBusy(e.id);
    const changes = regenerateEntry(recipes, settings, entries, e);
    if (!changes) toast(e.locked ? 'Unlock this meal to change it' : 'No other recipes fit — try loosening your settings');
    else await db.plan.bulkPut(changes);
    setTimeout(() => setBusy(null), 250);
  };

  const regenDay = async (date: string) => {
    setBusy(date);
    const { entries: out, warnings } = generatePlan(recipes, settings, entries, baseOpts([date], false));
    await saveGenerated(weekStart, entries, out, [date], settings.planSlots);
    if (warnings.length) toast(warnings[0]);
    setTimeout(() => setBusy(null), 250);
  };

  const regenWeek = async () => {
    setMoreOpen(false);
    if (!genDates.length) { toast('This week is over — go to next week'); return; }
    const unlocked = entries.filter(e => genDates.includes(e.date) && !e.locked && e.recipeId);
    if (unlocked.length && !(await confirm(`Replace ${unlocked.length} unlocked meal${unlocked.length === 1 ? '' : 's'} with new ideas? Locked meals stay.`, 'Regenerate'))) return;
    setBusy('week');
    const { entries: out, warnings, cost } = generatePlan(recipes, settings, entries, baseOpts(genDates, false));
    await saveGenerated(weekStart, entries, out, genDates, settings.planSlots);
    toast(warnings[0] ?? `New week ready${budget ? ` · about ${fmtMoney(cost, settings.currency, 0)}` : ''}`);
    setBusy(null);
  };

  const addEntry = async (date: string, slot: Slot, r: Recipe, replace?: PlanEntry) => {
    if (replace) await db.plan.bulkPut(applyRecipe(entries, replace, r.id));
    else await db.plan.put({ id: `${date}|${slot}|${Date.now().toString(36)}`, date, slot, recipeId: r.id, servings: settings.householdServings, locked: false });
    setPicker(null);
    setActive(null);
  };

  const clearWeek = async () => {
    setMoreOpen(false);
    const unlocked = entries.filter(e => !e.locked);
    if (!unlocked.length) { toast('Nothing to clear'); return; }
    if (!(await confirm(`Remove ${unlocked.length} unlocked meal${unlocked.length === 1 ? '' : 's'} from this week? Locked meals stay.`, 'Clear'))) return;
    await db.plan.bulkDelete(unlocked.map(e => e.id));
  };
  const copyLastWeek = async () => {
    setMoreOpen(false);
    const prevStart = addDays(weekStart, -7);
    const prev = await db.plan.where('date').between(prevStart, addDays(prevStart, 6), true, true).toArray();
    if (!prev.length) { toast('Last week is empty'); return; }
    const idMap = new Map(prev.map(e => [e.id, `${addDays(e.date, 7)}|${e.slot}|${Math.random().toString(36).slice(2, 7)}`]));
    const copies = prev.map(e => ({ ...e, id: idMap.get(e.id)!, date: addDays(e.date, 7), leftoverOf: e.leftoverOf ? idMap.get(e.leftoverOf) : undefined }));
    await db.plan.bulkPut(copies);
    toast(`Copied ${copies.length} meals from last week`);
  };

  return (
    <div className="page">
      <PageHeader title="Meal plan" right={<button className="icon-btn" aria-label="More" onClick={() => setMoreOpen(true)}><Icon name="more" /></button>} />

      <div className="week-nav">
        <button className="icon-btn" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><Icon name="chevronLeft" /></button>
        <div className="week-label">
          <b>{fmtRange(weekStart)}</b>
          {!isThisWeek ? <button className="faint small" style={{ fontWeight: 700 }} onClick={() => setWeekStart(weekStartOf(today(), settings.weekStart))}>Back to this week</button> : <small className="faint" style={{ fontWeight: 700 }}>This week</small>}
        </div>
        <button className="icon-btn" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}><Icon name="chevronRight" /></button>
      </div>

      <div className="summary-row">
        <Link to={budget ? '/groceries' : '/settings#budget'} className="summary-card">
          <span className="label"><SIcon name="wallet" size={14} /> Est. cost</span>
          <span className="big">{fmtMoney(weekCost, settings.currency, 0)}{budget > 0 && <small> / {fmtMoney(budget, settings.currency, 0)}</small>}</span>
          {budget > 0
            ? <div className={`bar ${weekCost > budget ? 'over' : ''}`}><span style={{ width: `${Math.min(100, (weekCost / budget) * 100)}%` }} /></div>
            : <small className="faint" style={{ fontWeight: 650 }}>Set a weekly budget →</small>}
        </Link>
        <div className="summary-card">
          <span className="label"><SIcon name="flame" size={14} /> Daily average</span>
          <span className="big">{Math.round(avgKcal)}<small> / {settings.kcal} kcal</small></span>
          <small className="faint" style={{ fontWeight: 650 }}>{Math.round(avgProtein)} g protein · {plannedDays.length} day{plannedDays.length === 1 ? '' : 's'}</small>
        </div>
      </div>

      <div className="plan-actions">
        <button className="btn btn-primary grow" onClick={() => setGenOpen(true)}><Icon name="sparkles" size={18} /> Plan my week</button>
        <button className={`btn btn-soft ${busy === 'week' ? 'spin' : ''}`} onClick={regenWeek} disabled={busy === 'week'} aria-label="Regenerate week"><Icon name="refresh" size={18} /> Redo</button>
        <button className="btn btn-soft" onClick={() => setSendOpen(true)} disabled={!entries.some(e => e.recipeId)} aria-label="Send to groceries"><Icon name="cart" size={18} /></button>
      </div>

      <div className="days">
        {days.map(date => {
          const list = byDay.get(date) ?? [];
          const n = dayNutrition(date);
          const dow = mondayIndex(date);
          const cookDay = settings.cookingDays.includes(dow);
          const isToday = date === today();
          const past = date < today();
          const pct = settings.kcal ? Math.min(130, (n.kcal / settings.kcal) * 100) : 0;
          return (
            <section key={date} className={`day-section ${isToday ? 'is-today' : ''} ${past ? 'is-past' : ''}`}>
              <div className="day-head">
                <div className="day-name">
                  {isToday ? 'Today' : DAY_LONG[dow]}<span>{parseIso(date).getDate()} {parseIso(date).toLocaleDateString(undefined, { month: 'short' })}</span>
                  {!cookDay && <span className="badge badge-muted" title="Not a cooking day">No-cook</span>}
                </div>
                <div className="row gap-sm">
                  {n.kcal > 0 && <span className="day-kcal">{Math.round(n.kcal)} kcal <span className={`bar sm ${pct > 110 ? 'over' : ''}`}><span style={{ width: `${Math.min(100, pct)}%` }} /></span></span>}
                  {!past && <button className={`icon-btn sm ${busy === date ? 'spin' : ''}`} aria-label={`Regenerate ${DAY_LONG[dow]}`} title="New ideas for this day" onClick={() => regenDay(date)}><Icon name="refresh" size={17} /></button>}
                </div>
              </div>
              {slotsShown.map(slot => {
                const items = list.filter(e => e.slot === slot);
                if (!items.length) {
                  return (
                    <button key={slot} className="add-row" onClick={() => setPicker({ date, slot })}>
                      <span className="add-ico"><Icon name="plus" size={18} /></span>
                      <span>Add {slot}</span>
                    </button>
                  );
                }
                return items.map(e => {
                  const r = e.recipeId ? map.get(e.recipeId) : undefined;
                  const cost = r && !e.leftover ? recipeCost(r, settings.priceOverrides).perServing * e.servings : 0;
                  return (
                    <div key={e.id} className={`meal-row ${e.leftover ? 'is-leftover' : ''}`}>
                      <button className="meal-row-main" onClick={() => setActive(e)}>
                        {r ? <Cover recipe={r} className="cover-sm" /> : <div className="cover cover-sm cover-emoji"><SIcon name="plate" size={26} className="cover-icon" /></div>}
                        <span className="meal-row-body">
                          <span className="meal-row-title">{r?.title ?? e.customText ?? 'Removed recipe'}</span>
                          <span className="meal-row-meta">
                            <span className={`tag tag-${slot}`}>{capitalize(slot)}</span>
                            {e.leftover ? <span>Leftovers</span> : <span>{e.servings} serv</span>}
                            {r && <span>· {Math.round(recipeNutrition(r).perServing.kcal)} kcal</span>}
                            {cost > 0 && <span>· {fmtMoney(cost, settings.currency, 0)}</span>}
                          </span>
                        </span>
                      </button>
                      {e.locked
                        ? <button className="icon-btn sm" aria-label="Unlock meal" title="Locked" onClick={() => db.plan.update(e.id, { locked: false })}><Icon name="lock" size={16} /></button>
                        : !past && <button className={`icon-btn sm ${busy === e.id ? 'spin' : ''}`} aria-label={`New idea for ${slot}`} title="Swap for a new idea" onClick={() => regenMeal(e)}><Icon name="refresh" size={17} /></button>}
                    </div>
                  );
                });
              })}
            </section>
          );
        })}
      </div>

      <RecipePicker open={!!picker} onClose={() => setPicker(null)} recipes={recipes} slot={picker?.slot}
        title={picker ? `${capitalize(picker.slot)} · ${DAY_SHORT[mondayIndex(picker.date)]}` : ''}
        onPick={r => picker && addEntry(picker.date, picker.slot, r, picker.replace)} />

      {active && (
        <EntrySheet entry={active} recipe={active.recipeId ? map.get(active.recipeId) : undefined} week={entries} recipes={recipes} onClose={() => setActive(null)}
          onBrowse={() => setPicker({ date: active.date, slot: active.slot, replace: active })}
          onPick={r => addEntry(active.date, active.slot, r, active)}
          onOpen={r => nav(`/recipe/${r.id}`)} onCook={(r, s) => nav(`/cook/${r.id}?servings=${s}`)} weekDays={days} />
      )}

      {genOpen && <GenerateSheet onClose={() => setGenOpen(false)} days={days} weekStart={weekStart} entries={entries} recipes={recipes} onDone={() => { setGenOpen(false); setSendOpen(true); }} />}
      {sendOpen && <SendSheet onClose={() => setSendOpen(false)} entries={entries} weekStart={weekStart} map={map} />}

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="This week">
        <div className="menu">
          <button onClick={regenWeek}><Icon name="refresh" /> Regenerate all unlocked meals</button>
          <button onClick={copyLastWeek}><Icon name="copy" /> Copy last week’s plan</button>
          <button onClick={() => { setMoreOpen(false); nav('/settings#planner'); }}><Icon name="settings" /> Kitchen, budget & planner settings</button>
          <button className="danger" onClick={clearWeek}><Icon name="trash" /> Clear unlocked meals</button>
        </div>
      </Sheet>
      {confirmNode}
    </div>
  );
}

/* --------------------------------------------------------- Entry sheet */

function EntrySheet({ entry, recipe, week, recipes, onClose, onBrowse, onPick, onOpen, onCook, weekDays: wd }: {
  entry: PlanEntry; recipe?: Recipe; week: PlanEntry[]; recipes: Recipe[]; onClose: () => void; onBrowse: () => void; onPick: (r: Recipe) => void;
  onOpen: (r: Recipe) => void; onCook: (r: Recipe, servings: number) => void; weekDays: string[];
}) {
  const settings = useSettings();
  const live = useLiveQuery(() => db.plan.get(entry.id), [entry.id]) ?? entry;
  const [seed, setSeed] = useState(0);
  const aiReady = useAIReady();
  const [aiAsk, setAiAsk] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPicks, setAiPicks] = useState<{ r: Recipe; reason: string }[] | null>(null);
  const askAI = async () => {
    if (!aiAsk.trim()) return;
    setAiBusy(true);
    try {
      // Candidates come from the normal planner rules (allergies, avoided foods, diet, equipment) — the AI only re-ranks them
      const pool = eligibleRecipes(recipes, settings).filter(r => slotMatches(r, live.slot) && r.id !== live.recipeId);
      const picks = await rankSwapCandidates(aiAsk, pool, settings);
      const byId = new Map(pool.map(r => [r.id, r]));
      setAiPicks(picks.flatMap(p => (byId.has(p.id) ? [{ r: byId.get(p.id)!, reason: p.reason }] : [])));
    } catch (e) { aiToast(e); } finally { setAiBusy(false); }
  };
  const ideas = useMemo(
    () => suggestRecipes(recipes, settings, week, live.slot, live.date, live.recipeId ? [live.recipeId] : [], 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, live.slot, live.date, live.recipeId]
  );
  const update = (patch: Partial<PlanEntry>) => db.plan.update(entry.id, patch);
  const move = async (date: string) => {
    await db.plan.delete(entry.id);
    await db.plan.put({ ...live, id: `${date}|${live.slot}|${Date.now().toString(36)}`, date, leftoverOf: undefined });
    toast(`Moved to ${DAY_SHORT[mondayIndex(date)]}`);
    onClose();
  };
  const cost = recipe ? recipeCost(recipe, settings.priceOverrides).perServing * live.servings : 0;
  return (
    <Sheet open onClose={onClose} title={recipe?.title ?? live.customText ?? 'Meal'} tall>
      {recipe && (
        <>
          <div className="row gap" style={{ marginBottom: 6 }}>
            <Cover recipe={recipe} className="cover-sm" />
            <div className="grow">
              <span className={`tag tag-${live.slot}`}>{capitalize(live.slot)}</span>
              <div className="faint small" style={{ fontWeight: 650, marginTop: 4 }}>
                {Math.round(recipeNutrition(recipe).perServing.kcal)} kcal · {live.leftover ? 'leftovers' : fmtMoney(cost, settings.currency, 0)}
              </div>
            </div>
          </div>
          <div className="row gap" style={{ margin: '10px 0 4px' }}>
            <button className="btn btn-primary grow" onClick={() => onCook(recipe, live.servings)}><Icon name="play" size={16} /> Cook</button>
            <button className="btn btn-soft grow" onClick={() => onOpen(recipe)}>Open recipe</button>
          </div>
        </>
      )}

      <div className="row between">
        <div className="section-label">Try something else</div>
        <button className="faint small" style={{ fontWeight: 700 }} onClick={() => setSeed(s => s + 1)}>↻ More ideas</button>
      </div>
      {ideas.length ? (
        <div className="sugg-row">
          {ideas.map(r => (
            <button key={r.id} className="sugg" onClick={() => onPick(r)}>
              <Cover recipe={r} />
              <b>{r.title}</b>
              <small>{Math.round(recipeNutrition(r).perServing.kcal)} kcal · {fmtMoney(recipeCost(r, settings.priceOverrides).perServing * live.servings, settings.currency, 0)}</small>
            </button>
          ))}
        </div>
      ) : <p className="muted small">No other recipes fit your kitchen and preferences for this meal.</p>}
      {aiReady && (
        <>
          <form className="row gap" style={{ marginTop: 8 }} onSubmit={e => { e.preventDefault(); askAI(); }}>
            <input className="grow" value={aiAsk} onChange={e => setAiAsk(e.target.value)} placeholder="Ask AI: something light and spicy…" />
            <button className="btn btn-soft" disabled={aiBusy || !aiAsk.trim()}>{aiBusy ? '…' : 'Ask'}</button>
          </form>
          {aiPicks && (
            <div className="sugg-row">
              {aiPicks.map(({ r, reason }) => (
                <button key={r.id} className="sugg" onClick={() => onPick(r)}>
                  <Cover recipe={r} />
                  <b>{r.title}</b>
                  <small>{reason || `${Math.round(recipeNutrition(r).perServing.kcal)} kcal`}</small>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <button className="btn btn-soft block" style={{ marginTop: 6 }} onClick={onBrowse}><Icon name="search" size={16} /> Browse all recipes</button>

      <div className="row between field-row" style={{ marginTop: 8 }}>
        <span style={{ fontWeight: 650 }}>Servings to cook</span>
        <Stepper value={live.servings} onChange={v => update({ servings: v })} min={1} max={30} />
      </div>
      <Toggle checked={live.locked} onChange={v => update({ locked: v })} label="Lock this meal" hint="Regenerate won’t replace it" />
      <Toggle checked={!!live.leftover} onChange={v => update({ leftover: v, leftoverOf: v ? live.leftoverOf : undefined })} label="Leftovers" hint="Already cooked — not added to groceries" />
      <div className="section-label">Move to</div>
      <div className="day-pills">
        {wd.map(d => (
          <button key={d} className={`day-pill ${d === live.date ? 'active' : ''}`} onClick={() => d !== live.date && move(d)}>
            <small>{DAY_SHORT[mondayIndex(d)]}</small><b>{Number(d.slice(8))}</b>
          </button>
        ))}
      </div>
      <div className="menu" style={{ marginTop: 14 }}>
        <button className="danger" onClick={async () => { await db.plan.delete(entry.id); onClose(); }}><Icon name="trash" /> Remove from plan</button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------ Generate sheet */

function GenerateSheet({ onClose, days, weekStart, entries, recipes, onDone }: { onClose: () => void; days: string[]; weekStart: string; entries: PlanEntry[]; recipes: Recipe[]; onDone: () => void }) {
  const settings = useSettings();
  const nav = useNavigate();
  const futureDays = days.filter(d => d >= today());
  const [onlyFuture, setOnlyFuture] = useState(futureDays.length >= 2 && futureDays.length < 7);
  const [slots, setSlots] = useState<Slot[]>(settings.planSlots);
  const [cookingDays, setCookingDays] = useState<number[]>(settings.cookingDays);
  const [servings, setServings] = useState(settings.householdServings);
  const [opts, setOpts] = useState<PlanOptions>(settings.planOptions);
  const [keepFilled, setKeepFilled] = useState(true);
  const [result, setResult] = useState<{ warnings: string[]; cost: number } | null>(null);
  const setOpt = (p: Partial<PlanOptions>) => setOpts(o => ({ ...o, ...p }));

  const target = onlyFuture ? futureDays : days;
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const run = async () => {
    const full: GenerateOptions = { ...opts, dates: target, slots, servings, cookingDays, keepFilled };
    const { entries: out, warnings, cost } = generatePlan(recipes, { ...settings, cookingDays, planSlots: slots }, entries, full);
    await saveGenerated(weekStart, entries, out, target, slots);
    await saveSettings({ cookingDays, planSlots: slots, planOptions: opts, householdServings: servings });
    if (warnings.length) setResult({ warnings, cost });
    else { toast(`Your week is planned${settings.weeklyBudget ? ` · about ${fmtMoney(cost, settings.currency, 0)}` : ''}`); onDone(); }
  };

  return (
    <Sheet open onClose={onClose} title="Plan my week" tall
      footer={result
        ? <button className="btn btn-primary block" onClick={onDone}>Continue</button>
        : <button className="btn btn-primary block btn-lg" onClick={run} disabled={!slots.length || !target.length}><Icon name="sparkles" size={18} /> Generate plan</button>}>
      {result ? (
        <div>
          <p>Plan created{settings.weeklyBudget ? ` (about ${fmtMoney(result.cost, settings.currency, 0)})` : ''}, with a few notes:</p>
          <ul>{result.warnings.map(w => <li key={w} className="muted">{w}</li>)}</ul>
        </div>
      ) : (
        <>
          {futureDays.length > 0 && futureDays.length < 7 && (
            <div className="chip-row">
              <Chip active={onlyFuture} onClick={() => setOnlyFuture(true)}>{futureDays.length === 1 ? 'Just today' : `Rest of week (${futureDays.length} days)`}</Chip>
              <Chip active={!onlyFuture} onClick={() => setOnlyFuture(false)}>Whole week</Chip>
            </div>
          )}
          <div className="section-label">Meals to plan</div>
          <div className="chip-row wrap">{SLOTS.map(s => <Chip key={s} active={slots.includes(s)} onClick={() => setSlots(toggle(slots, s))}>{capitalize(s)}</Chip>)}</div>

          <div className="section-label">Cooking days</div>
          <p className="fineprint" style={{ marginTop: 0 }}>On other days you’ll get leftovers or no-cook meals.</p>
          <div className="dow-row">
            {DAY_SHORT.map((d, i) => <button key={d} className={`dow ${cookingDays.includes(i) ? 'on' : ''}`} onClick={() => setCookingDays(toggle(cookingDays, i))} aria-pressed={cookingDays.includes(i)}>{d}</button>)}
          </div>

          <div className="row between field-row">
            <span style={{ fontWeight: 650 }}>Servings per meal</span>
            <Stepper value={servings} onChange={setServings} min={1} max={12} />
          </div>

          <div className="section-label">Weeknight time limit</div>
          <div className="chip-row wrap">{[null, 20, 30, 45].map(t => <Chip key={String(t)} active={opts.maxMinutes === t} onClick={() => setOpt({ maxMinutes: t })}>{t ? `≤ ${t} min` : 'No limit'}</Chip>)}</div>

          <div style={{ marginTop: 8 }}>
            <Toggle checked={opts.stayInBudget} onChange={v => setOpt({ stayInBudget: v })} label="Stay within my budget"
              hint={settings.weeklyBudget ? `${fmtMoney(settings.weeklyBudget, settings.currency, 0)} a week` : <>No budget set — <button className="link" onClick={() => nav('/settings#budget')}>set one</button></>} />
            <Toggle checked={opts.leftoverLunches} onChange={v => setOpt({ leftoverLunches: v })} label="Cook once, eat twice" hint="Next-day lunch uses last night’s dinner" />
            <Toggle checked={opts.respectTargets} onChange={v => setOpt({ respectTargets: v })} label="Fit my calorie target" hint={`About ${settings.kcal} kcal a day`} />
            <Toggle checked={keepFilled} onChange={setKeepFilled} label="Keep meals I already planned" hint="Off = replace everything that isn’t locked" />
            <Toggle checked={opts.favoritesOnly} onChange={v => setOpt({ favoritesOnly: v })} label="Favourites only" />
          </div>

          <p className="fineprint">
            Uses only recipes you can make with your kitchen ({settings.equipment.length} appliances)
            {[...settings.allergies, ...settings.avoid].length ? `, skipping ${[...settings.allergies, ...settings.avoid].join(', ')}` : ''}
            {settings.diets.length ? ` · Diet: ${settings.diets.join(', ')}` : ''}. <Link className="link" to="/settings#kitchen">Change</Link>
          </p>
        </>
      )}
    </Sheet>
  );
}

/* -------------------------------------------------- Send to groceries */

function SendSheet({ onClose, entries, weekStart, map }: { onClose: () => void; entries: PlanEntry[]; weekStart: string; map: Map<string, Recipe> }) {
  const nav = useNavigate();
  const settings = useSettings();
  const [range, setRange] = useState<'week' | 'future'>(entries.some(e => e.date >= today()) && entries.some(e => e.date < today()) ? 'future' : 'week');
  const chosen = entries.filter(e => e.recipeId && (range === 'week' || e.date >= today()));
  const have = useHaveNames();
  const preview = useMemo(() => groceriesFromPlan(chosen, map, have), [chosen, map, have]);
  const skipped = useMemo(() => groceriesFromPlan(chosen, map, settings.pantry).length - preview.length, [chosen, map, settings.pantry, preview.length]);
  const cost = planCost(chosen, map, settings.priceOverrides);

  const send = async () => {
    await db.transaction('rw', db.grocery, async () => {
      const old = await db.grocery.filter(g => g.fromPlan === weekStart && !g.checked).toArray();
      await db.grocery.bulkDelete(old.map(o => o.id));
      const existing = await db.grocery.toArray();
      const { put } = mergeInto(existing, preview.map(p => ({ ...p, fromPlan: weekStart })));
      await db.grocery.bulkPut(put);
    });
    toast(`${preview.length} items on your grocery list`);
    onClose();
    nav('/groceries');
  };

  return (
    <Sheet open onClose={onClose} title="Send to groceries"
      footer={<button className="btn btn-primary block btn-lg" onClick={send} disabled={!preview.length}><Icon name="cart" size={18} /> Add {preview.length} items</button>}>
      <div className="chip-row">
        <Chip active={range === 'week'} onClick={() => setRange('week')}>Whole week</Chip>
        <Chip active={range === 'future'} onClick={() => setRange('future')}>From today</Chip>
      </div>
      <div className="cost-card">
        <div>
          <div className="faint small" style={{ fontWeight: 700 }}>Estimated for these meals</div>
          <b>{fmtMoney(cost, settings.currency, 0)}</b>
          {settings.weeklyBudget > 0 && <span className="faint small"> of {fmtMoney(settings.weeklyBudget, settings.currency, 0)} budget</span>}
        </div>
        <span className="cost-ico"><SIcon name="cart" size={26} /></span>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        {chosen.filter(e => !e.leftover).length} meals → {preview.length} ingredients, combined and scaled to your servings.{skipped > 0 ? ` ${skipped} you already have at home are left off.` : ''} Leftover meals and pantry staples ({settings.pantry.join(', ') || 'none'}) are skipped. Sending again replaces this week’s unticked items.
      </p>
    </Sheet>
  );
}
