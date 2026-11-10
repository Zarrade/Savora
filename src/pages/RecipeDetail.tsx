import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedToRecipe } from '../db';
import { updateRecipe, useCollections, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { Cover, avgRating, totalTime } from '../components/RecipeCard';
import { NutritionPanel } from '../components/NutritionPanel';
import { AddToGrocerySheet, AddToPlanSheet } from '../components/Sheets';
import { Chip, Empty, Sheet, Stars, Stepper, toast, useConfirm } from '../components/ui';
import { fmtIngredient, fmtQty, recipeConflicts, recipeDiets, recipeNutrition, unitLabel } from '../lib/ingredients';
import { capitalize, fmtMinutes, uid } from '../lib/util';
import { foodEmoji } from '../lib/emoji';
import { EQUIP_MAP, missingEquipment, recipeEquipment, usingInstead, airFryerTip } from '../lib/kitchen';
import { fmtMoney, recipeCost } from '../lib/pricing';
import { ALL_SEEDS } from '../data/seeds';
import type { Recipe } from '../types';

type Tab = 'ingredients' | 'instructions' | 'nutrition' | 'reviews';

export default function RecipeDetail() {
  const { id } = useParams();
  const recipe = useLiveQuery(() => db.recipes.get(id!), [id]);
  if (recipe === undefined) return <div className="page" />;
  if (!recipe) return <div className="page"><Empty title="Recipe not found"><Link className="link" to="/recipes">Back to recipes</Link></Empty></div>;
  return <Detail recipe={recipe} />;
}

function Detail({ recipe }: { recipe: Recipe }) {
  const nav = useNavigate();
  const settings = useSettings();
  const [servings, setServings] = useState(recipe.servings);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [planOpen, setPlanOpen] = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const scale = servings / Math.max(1, recipe.servings);
  const nutrition = recipeNutrition(recipe);
  const cost = recipeCost(recipe, settings.priceOverrides);
  const diets = recipeDiets(recipe);
  const conflicts = recipeConflicts(recipe, [...settings.allergies, ...settings.avoid]);
  const rating = avgRating(recipe);
  const equipment = recipeEquipment(recipe);
  const missing = missingEquipment(recipe, settings.equipment);
  const swaps = usingInstead(recipe, settings.equipment);
  const useAirFryer = swaps.some(s => s.use === 'airfryer') || (settings.equipment.includes('airfryer') && !settings.equipment.includes('oven'));

  const groups = useMemo(() => {
    const out: { name?: string; items: Recipe['ingredients'] }[] = [];
    for (const ing of recipe.ingredients) {
      const last = out[out.length - 1];
      if (!last || last.name !== ing.group) out.push({ name: ing.group, items: [ing] });
      else last.items.push(ing);
    }
    return out;
  }, [recipe.ingredients]);

  const toggleCheck = (iid: string) => setChecked(s => { const n = new Set(s); n.has(iid) ? n.delete(iid) : n.add(iid); return n; });

  const duplicate = async () => {
    const copy: Recipe = { ...recipe, id: uid(), title: `${recipe.title} (copy)`, builtIn: false, remixOf: undefined, favorite: false, reviews: [], cookedCount: 0, lastCooked: undefined, createdAt: Date.now(), updatedAt: Date.now() };
    await db.recipes.put(copy);
    toast('Recipe duplicated');
    nav(`/recipe/${copy.id}`, { replace: true });
  };
  const remove = async () => {
    setMoreOpen(false);
    if (!(await confirm(`Delete “${recipe.title}”? It will also be removed from your meal plan.`, 'Delete'))) return;
    await db.transaction('rw', db.recipes, db.plan, async () => {
      await db.recipes.delete(recipe.id);
      await db.plan.where('recipeId').equals(recipe.id).delete();
    });
    toast('Recipe deleted');
    nav('/recipes', { replace: true });
  };
  const resetOriginal = async () => {
    const seed = ALL_SEEDS.find(s => s.id === recipe.id);
    if (!seed) return;
    setMoreOpen(false);
    if (!(await confirm('Undo your edits and restore the original recipe? Your favourite, reviews, photo and collections are kept.', 'Restore'))) return;
    const orig = seedToRecipe(seed);
    await db.recipes.put({ ...orig, image: recipe.image, imageCredit: recipe.imageCredit, photoAuto: recipe.photoAuto, favorite: recipe.favorite, reviews: recipe.reviews, collections: recipe.collections, cookedCount: recipe.cookedCount, lastCooked: recipe.lastCooked, createdAt: recipe.createdAt });
    toast('Original restored');
  };
  const share = async () => {
    setMoreOpen(false);
    const text = recipeAsText(recipe, servings);
    try {
      if (navigator.share) await navigator.share({ title: recipe.title, text });
      else { await navigator.clipboard.writeText(text); toast('Recipe copied to clipboard'); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="page page-flush">
      <div className="hero">
        <Cover recipe={recipe} large className="hero-cover" />
        <div className="hero-bar">
          <button className="icon-btn glass" aria-label="Back" onClick={() => nav(-1)}><Icon name="back" /></button>
          <div className="row gap-sm">
            <button className={`icon-btn glass ${recipe.favorite ? 'fav-on' : ''}`} aria-label="Favourite" onClick={() => updateRecipe(recipe.id, { favorite: !recipe.favorite })}>
              <Icon name="heart" filled={recipe.favorite} />
            </button>
            <button className="icon-btn glass" aria-label="More actions" onClick={() => setMoreOpen(true)}><Icon name="more" /></button>
          </div>
        </div>
        {recipe.image && recipe.imageCredit && (
          <a className="photo-credit" href={recipe.imageCredit.page} target="_blank" rel="noreferrer">📷 {recipe.imageCredit.label}</a>
        )}
      </div>

      <div className="detail">
        <div>
          <div className="faint small" style={{ fontWeight: 700 }}>{recipe.cuisine}{recipe.mealTypes.length ? ` · ${recipe.mealTypes.map(capitalize).join(', ')}` : ''}</div>
          <h1 className="detail-title">{recipe.title}</h1>
          {recipe.description && <p className="muted">{recipe.description}</p>}
          {(rating > 0 || recipe.cookedCount > 0) && (
            <div className="detail-meta">
              {rating > 0 && <span className="row gap-xs"><Stars value={rating} size={14} /> <small>({recipe.reviews.length})</small></span>}
              {recipe.cookedCount > 0 && <span className="muted">Cooked {recipe.cookedCount}×</span>}
            </div>
          )}
        </div>

        <div className="meta-pills">
          <span className="meta-pill">⏱ {fmtMinutes(totalTime(recipe))}</span>
          <span className="meta-pill">🔥 {Math.round(nutrition.perServing.kcal)} <small>kcal</small></span>
          <span className="meta-pill">💪 {Math.round(nutrition.perServing.protein)}g <small>protein</small></span>
          {cost.perServing > 0 && <span className="meta-pill">💰 {fmtMoney(cost.perServing * 1, settings.currency)} <small>/ serving</small></span>}
        </div>

        {equipment.length > 0 && (
          <div className="equip-row">
            <span className="faint small" style={{ fontWeight: 700 }}>You’ll need</span>
            {equipment.map(e => {
              const sw = swaps.find(s => s.need === e);
              const miss = missing.includes(e);
              return (
                <span key={e} className={`equip-chip ${miss ? 'missing' : sw ? 'swap' : ''}`}>
                  {sw ? `${EQUIP_MAP[sw.use].emoji} ${EQUIP_MAP[sw.use].label} instead of ${EQUIP_MAP[e].label.toLowerCase()}` : `${EQUIP_MAP[e].emoji} ${EQUIP_MAP[e].label}`}
                </span>
              );
            })}
          </div>
        )}
        {missing.length > 0 && (
          <div className="alert alert-warn"><Icon name="alert" size={18} /> Needs {missing.map(m => EQUIP_MAP[m].label.toLowerCase()).join(' and ')}, which isn’t in your kitchen.</div>
        )}
        {conflicts.length > 0 && (
          <div className="alert alert-warn"><Icon name="alert" size={18} /> Contains {conflicts.join(', ')} — on your allergy / avoid list.</div>
        )}

        <div className="detail-actions">
          <button className="btn btn-primary grow btn-lg" onClick={() => nav(`/cook/${recipe.id}?servings=${servings}`)}><Icon name="play" size={18} /> Start cooking</button>
        </div>
        <div className="row gap">
          <button className="btn btn-soft grow" onClick={() => setPlanOpen(true)}><Icon name="calendar" size={18} /> Add to plan</button>
          <button className="btn btn-soft grow" onClick={() => setGroceryOpen(true)}><Icon name="cart" size={18} /> Groceries</button>
        </div>

        <div className="tabs" role="tablist">
          {(['ingredients', 'instructions', 'nutrition', 'reviews'] as Tab[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'instructions' ? 'Steps' : capitalize(t)}</button>
          ))}
        </div>

        {tab === 'ingredients' && (
          <section>
            <div className="row between servings-row">
              <h2>Ingredients</h2>
              <div className="row gap-sm"><Stepper value={servings} onChange={setServings} min={1} max={50} /><span className="faint small">servings</span></div>
            </div>
            {groups.map((g, gi) => (
              <div key={gi}>
                {g.name && <div className="section-label">{g.name}</div>}
                <ul className="ing-list">
                  {g.items.map(i => {
                    const q = i.qty === null ? null : i.qty * scale;
                    const amount = [fmtQty(q), unitLabel(i.unit, q)].filter(Boolean).join(' ');
                    return (
                      <li key={i.id} className={checked.has(i.id) ? 'done' : ''} onClick={() => toggleCheck(i.id)}>
                        <span className="ing-emoji">{foodEmoji(i.name)}</span>
                        <span className="ing-text">
                          {amount && <b>{amount} </b>}{i.name}
                          {i.note && <small className="faint">, {i.note}</small>}
                        </span>
                        <span className={`tick ${checked.has(i.id) ? 'on' : ''}`}><Icon name="check" size={14} /></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {!recipe.ingredients.length && <p className="muted">No ingredients yet.</p>}
            {cost.total > 0 && (
              <div className="cost-card">
                <div>
                  <div className="faint small" style={{ fontWeight: 700 }}>Estimated cost · {servings} serving{servings === 1 ? '' : 's'}</div>
                  <b>{fmtMoney(cost.perServing * servings, settings.currency)}</b>
                  <span className="faint small"> · {fmtMoney(cost.perServing, settings.currency)} each</span>
                </div>
                <span style={{ fontSize: 28 }}>💰</span>
              </div>
            )}
            {cost.unknown.length > 0 && <p className="fineprint">No price for: {cost.unknown.join(', ')}.</p>}
          </section>
        )}

        {tab === 'instructions' && (
          <section>
            <h2 style={{ marginBottom: 10 }}>Instructions</h2>
            <ol className="steps">
              {recipe.steps.map((s, i) => {
                const tip = useAirFryer ? airFryerTip(s) : null;
                return (
                  <li key={i}>
                    <div className="step-kicker">Step {i + 1}</div>
                    <p>{s}</p>
                    {tip && <div className="af-tip">🌀 {tip}</div>}
                  </li>
                );
              })}
            </ol>
            {!recipe.steps.length && <p className="muted">No steps yet.</p>}
            {recipe.notes && <div className="note-box"><b>Notes</b><p>{recipe.notes}</p></div>}
            <div className="row gap wrap" style={{ marginTop: 12 }}>
              {recipe.videoUrl && <a className="btn btn-soft" href={recipe.videoUrl} target="_blank" rel="noreferrer"><Icon name="video" size={18} /> Watch video</a>}
              {recipe.sourceUrl && <a className="btn btn-soft" href={recipe.sourceUrl} target="_blank" rel="noreferrer"><Icon name="link" size={18} /> Original source</a>}
            </div>
          </section>
        )}

        {tab === 'nutrition' && (
          <>
            <div className="chip-row wrap">
              {diets.filter(d => d !== 'pescatarian' || !diets.includes('vegetarian')).map(d => <span key={d} className="tag tag-green">{capitalize(d)}</span>)}
            </div>
            <NutritionPanel result={nutrition} settings={settings} servingsLabel={`recipe makes ${recipe.servings}`} />
          </>
        )}

        {tab === 'reviews' && <Reviews recipe={recipe} />}

        {recipe.tags.length > 0 && (
          <div className="chip-row wrap">{recipe.tags.filter(t => !diets.includes(t as never)).map(t => <span key={t} className="tag tag-outline">#{t}</span>)}</div>
        )}
      </div>

      <AddToPlanSheet open={planOpen} onClose={() => setPlanOpen(false)} recipe={recipe} />
      {groceryOpen && <AddToGrocerySheet open onClose={() => setGroceryOpen(false)} recipe={recipe} scale={scale} />}

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={recipe.title}>
        <div className="menu">
          <button onClick={() => nav(`/recipe/${recipe.id}/edit`)}><Icon name="edit" /> Edit{recipe.builtIn ? ' (make it yours)' : ''}</button>
          <button onClick={() => { setMoreOpen(false); setColOpen(true); }}><Icon name="folder" /> Collections</button>
          <button onClick={duplicate}><Icon name="copy" /> Duplicate</button>
          <button onClick={share}><Icon name="share" /> Share as text</button>
          {recipe.builtIn && recipe.remixOf && <button onClick={resetOriginal}><Icon name="refresh" /> Restore original</button>}
          <button className="danger" onClick={remove}><Icon name="trash" /> Delete</button>
        </div>
      </Sheet>
      <CollectionsSheet open={colOpen} onClose={() => setColOpen(false)} recipe={recipe} />
      {confirmNode}
    </div>
  );
}

function Reviews({ recipe }: { recipe: Recipe }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const save = async () => {
    if (!rating) return;
    await updateRecipe(recipe.id, { reviews: [{ date: new Date().toISOString(), rating, text: text.trim() || undefined }, ...recipe.reviews] });
    setRating(0); setText('');
    toast('Review saved');
  };
  const remove = (i: number) => updateRecipe(recipe.id, { reviews: recipe.reviews.filter((_, x) => x !== i) });
  return (
    <section>
      <div className="card-flat">
        <h3>Rate this recipe</h3>
        <div style={{ marginTop: 8 }}><Stars value={rating} onChange={setRating} size={30} /></div>
        <textarea rows={3} placeholder="Notes for next time (optional)" value={text} onChange={e => setText(e.target.value)} style={{ margin: '10px 0', background: 'var(--surface)' }} />
        <button className="btn btn-primary block" disabled={!rating} onClick={save}>Save review</button>
      </div>
      {recipe.reviews.map((r, i) => (
        <div key={i} className="review">
          <div className="row between">
            <Stars value={r.rating} size={14} />
            <div className="row gap-sm">
              <small className="muted">{new Date(r.date).toLocaleDateString()}</small>
              <button className="icon-btn sm" aria-label="Delete review" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
            </div>
          </div>
          {r.text && <p>{r.text}</p>}
        </div>
      ))}
      {!recipe.reviews.length && <p className="muted center" style={{ marginTop: 12 }}>No reviews yet. You’ll also be asked after cooking.</p>}
    </section>
  );
}

export function CollectionsSheet({ open, onClose, recipe }: { open: boolean; onClose: () => void; recipe: Recipe }) {
  const collections = useCollections();
  const [name, setName] = useState('');
  const toggle = (cid: string) => {
    const has = recipe.collections.includes(cid);
    updateRecipe(recipe.id, { collections: has ? recipe.collections.filter(c => c !== cid) : [...recipe.collections, cid] });
  };
  const create = async () => {
    if (!name.trim()) return;
    const id = uid();
    await db.collections.put({ id, name: name.trim(), emoji: '📁', createdAt: Date.now() });
    await updateRecipe(recipe.id, { collections: [...recipe.collections, id] });
    setName('');
  };
  return (
    <Sheet open={open} onClose={onClose} title="Collections">
      <div className="chip-row wrap">
        {collections.map(c => <Chip key={c.id} active={recipe.collections.includes(c.id)} onClick={() => toggle(c.id)}>{c.emoji} {c.name}</Chip>)}
      </div>
      <div className="input-with-btn" style={{ marginTop: 14 }}>
        <input placeholder="New collection name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
        <button className="btn btn-soft" onClick={create} disabled={!name.trim()}>Create</button>
      </div>
    </Sheet>
  );
}

export function recipeAsText(r: Recipe, servings = r.servings): string {
  const scale = servings / Math.max(1, r.servings);
  const lines = [r.title, '', `Serves ${servings} · Prep ${r.prepMin} min · Cook ${r.cookMin} min`, '', 'INGREDIENTS'];
  let g: string | undefined;
  for (const i of r.ingredients) {
    if (i.group !== g) { g = i.group; if (g) lines.push('', g.toUpperCase()); }
    lines.push(`- ${fmtIngredient(i, scale)}${i.note ? `, ${i.note}` : ''}`);
  }
  lines.push('', 'METHOD');
  r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  if (r.notes) lines.push('', 'NOTES', r.notes);
  if (r.sourceUrl) lines.push('', r.sourceUrl);
  return lines.join('\n');
}
