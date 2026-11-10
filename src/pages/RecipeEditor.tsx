import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { useRecipes } from '../hooks';
import { Icon } from '../components/Icon';
import { Chip, DictateButton, PageHeader, Stepper, toast } from '../components/ui';
import { MEAL_TYPES, type Ingredient, type MealType, type Recipe } from '../types';
import { fmtQty, matchFood, recipeNutrition, toIngredient, unitLabel, UNIT_OPTIONS } from '../lib/ingredients';
import { capitalize, uid } from '../lib/util';
import { fileToDataUrl } from '../lib/image';
import type { ImportedRecipe } from '../lib/importText';
import { EQUIPMENT, inferEquipment } from '../lib/kitchen';
import { PhotoSearch } from '../components/PhotoSearch';

const EMOJIS = ['🍽️', '🥗', '🍲', '🍝', '🍛', '🍜', '🥘', '🍗', '🥩', '🐟', '🍤', '🥚', '🍳', '🥞', '🥣', '🌮', '🌯', '🥙', '🍔', '🍕', '🥪', '🫓', '🧆', '🍚', '🍱', '🥦', '🥕', '🍆', '🥑', '🍓', '🍌', '🍰', '🍪', '🧁', '🥤', '🍵'];

export const IMPORT_KEY = 'savora-import-draft';

function blankRecipe(): Recipe {
  const now = Date.now();
  return {
    id: uid(), title: '', description: '', emoji: '🍽️', servings: 2, prepMin: 10, cookMin: 20, cuisine: '',
    mealTypes: ['dinner'], tags: [], ingredients: [], steps: [''], notes: '', favorite: false, collections: [],
    reviews: [], cookedCount: 0, createdAt: now, updatedAt: now
  };
}

export default function RecipeEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const all = useRecipes() ?? [];
  const [r, setR] = useState<Recipe | null>(null);
  const [ingText, setIngText] = useState<string | null>(null); // text mode buffer
  const [tagText, setTagText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (id) {
        const existing = await db.recipes.get(id);
        if (existing) { setR({ ...existing, steps: existing.steps.length ? existing.steps : [''] }); return; }
      }
      const base = blankRecipe();
      const draft = sessionStorage.getItem(IMPORT_KEY);
      if (draft && !id) {
        sessionStorage.removeItem(IMPORT_KEY);
        const d = JSON.parse(draft) as ImportedRecipe;
        setR({ ...base, title: d.title, servings: d.servings ?? base.servings, prepMin: d.prepMin ?? base.prepMin, cookMin: d.cookMin ?? base.cookMin, ingredients: d.ingredients, steps: d.steps.length ? d.steps : [''], notes: d.notes ?? '', sourceUrl: d.sourceUrl, videoUrl: d.videoUrl, ...(d.description ? { description: d.description } : {}), ...(d.cuisine ? { cuisine: d.cuisine } : {}), ...(d.mealTypes?.length ? { mealTypes: d.mealTypes } : {}), ...(d.tags?.length ? { tags: d.tags } : {}) });
      } else {
        setR(base);
      }
    })();
  }, [id]);

  const cuisines = useMemo(() => Array.from(new Set(all.map(x => x.cuisine).filter(Boolean))).sort(), [all]);
  const nutrition = useMemo(() => (r ? recipeNutrition({ ...r, id: 'preview', updatedAt: Date.now() }) : null), [r]);
  if (!r) return <div className="page" />;

  const set = (patch: Partial<Recipe>) => setR(prev => (prev ? { ...prev, ...patch } : prev));
  const setIng = (iid: string, patch: Partial<Ingredient>) => set({ ingredients: r.ingredients.map(i => (i.id === iid ? { ...i, ...patch } : i)) });
  const moveIng = (idx: number, dir: -1 | 1) => {
    const list = [...r.ingredients];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    set({ ingredients: list });
  };
  const moveStep = (idx: number, dir: -1 | 1) => {
    const list = [...r.steps];
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    set({ steps: list });
  };

  const ingredientsToText = (list: Ingredient[]) => {
    const out: string[] = [];
    let g: string | undefined;
    for (const i of list) {
      if (i.group !== g) { g = i.group; if (g) out.push(`## ${g}`); }
      out.push([fmtQty(i.qty), unitLabel(i.unit, i.qty), i.name].filter(Boolean).join(' ') + (i.note ? `, ${i.note}` : ''));
    }
    return out.join('\n');
  };
  const applyText = () => {
    if (ingText === null) return;
    const list: Ingredient[] = [];
    let g: string | undefined;
    for (const line of ingText.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith('##')) { g = t.replace(/^#+\s*/, '') || undefined; continue; }
      list.push(toIngredient(t, g));
    }
    set({ ingredients: list });
    setIngText(null);
  };

  const onPhoto = async (f?: File) => {
    if (!f) return;
    try { set({ image: await fileToDataUrl(f), imageCredit: undefined, photoAuto: false }); } catch (e) { toast((e as Error).message); }
  };

  const save = async () => {
    let ingredients = r.ingredients;
    if (ingText !== null) {
      // apply pending text edits
      const list: Ingredient[] = []; let g: string | undefined;
      for (const line of ingText.split('\n')) { const t = line.trim(); if (!t) continue; if (t.startsWith('##')) { g = t.replace(/^#+\s*/, '') || undefined; continue; } list.push(toIngredient(t, g)); }
      ingredients = list;
    }
    if (!r.title.trim()) { toast('Give your recipe a name'); return; }
    const out: Recipe = {
      ...r,
      title: r.title.trim(),
      cuisine: r.cuisine.trim() || 'Other',
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: r.steps.map(s => s.trim()).filter(Boolean),
      tags: r.tags,
      mealTypes: r.mealTypes.length ? r.mealTypes : ['dinner'],
      remixOf: r.builtIn ? r.id : r.remixOf,
      updatedAt: Date.now()
    };
    await db.recipes.put(out);
    toast(id ? 'Recipe saved' : 'Recipe added');
    nav(`/recipe/${out.id}`, { replace: true });
  };

  const addTag = () => {
    const t = tagText.trim().toLowerCase().replace(/^#/, '');
    if (t && !r.tags.includes(t)) set({ tags: [...r.tags, t] });
    setTagText('');
  };

  return (
    <div className="page editor">
      <PageHeader title={id ? 'Edit recipe' : 'New recipe'} back right={<button className="btn btn-primary btn-sm" onClick={save}>Save</button>} />
      {r.builtIn && <div className="alert alert-info"><Icon name="sparkles" size={18} /> Editing a starter recipe — your version replaces it, and you can restore the original anytime.</div>}

      <div className="photo-picker">
        {r.image ? <img src={r.image} alt="" /> : <button className="emoji-big" onClick={() => setEmojiOpen(!emojiOpen)} aria-label="Choose emoji">{r.emoji || '🍽️'}</button>}
        <div className="photo-actions">
          <button className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}><Icon name="camera" size={16} /> {r.image ? 'Your photo' : 'Add your photo'}</button>
          <button className="btn btn-soft btn-sm" onClick={() => setPhotoOpen(true)}><Icon name="image" size={16} /> Find a real photo</button>
          {r.image ? <button className="btn btn-ghost btn-sm" onClick={() => set({ image: undefined, imageCredit: undefined, photoAuto: false })}>Remove photo</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setEmojiOpen(!emojiOpen)}>Change emoji</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPhoto(e.target.files?.[0])} />
      </div>
      {emojiOpen && !r.image && (
        <div className="emoji-grid">{EMOJIS.map(e => <button key={e} onClick={() => { set({ emoji: e }); setEmojiOpen(false); }}>{e}</button>)}</div>
      )}

      <label className="field"><span>Name</span><input value={r.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Grandma’s stuffed vine leaves" /></label>
      <label className="field"><span>Short description</span>
        <div className="input-with-icon"><input value={r.description ?? ''} onChange={e => set({ description: e.target.value })} placeholder="Optional" /><DictateButton onText={t => set({ description: `${r.description ? r.description + ' ' : ''}${t}` })} /></div>
      </label>

      <div className="field-grid">
        <div className="field"><span>Servings</span><Stepper value={r.servings} onChange={v => set({ servings: v })} min={1} max={50} /></div>
        <label className="field"><span>Prep (min)</span><input inputMode="numeric" value={r.prepMin || ''} onChange={e => set({ prepMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
        <label className="field"><span>Cook (min)</span><input inputMode="numeric" value={r.cookMin || ''} onChange={e => set({ cookMin: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
      </div>

      <label className="field"><span>Cuisine</span>
        <input list="cuisine-list" value={r.cuisine} onChange={e => set({ cuisine: e.target.value })} placeholder="e.g. Lebanese" />
        <datalist id="cuisine-list">{cuisines.map(c => <option key={c} value={c} />)}</datalist>
      </label>

      <div className="field"><span>Meal</span>
        <div className="chip-row wrap">
          {MEAL_TYPES.map(m => <Chip key={m} active={r.mealTypes.includes(m)} onClick={() => set({ mealTypes: r.mealTypes.includes(m) ? r.mealTypes.filter(x => x !== m) : [...r.mealTypes, m as MealType] })}>{capitalize(m)}</Chip>)}
        </div>
      </div>

      <div className="field"><span>Tags</span>
        <div className="chip-row wrap">
          {r.tags.map(t => <span key={t} className="chip chip-active chip-removable">#{t}<button aria-label={`Remove ${t}`} onClick={() => set({ tags: r.tags.filter(x => x !== t) })}><Icon name="close" size={14} /></button></span>)}
        </div>
        <div className="input-with-btn"><input value={tagText} placeholder="e.g. meal-prep, quick" onChange={e => setTagText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} /><button className="btn btn-soft" onClick={addTag} disabled={!tagText.trim()}>Add</button></div>
      </div>

      {/* ---------------- Ingredients */}
      <div className="editor-section">
        <div className="row between">
          <h2>Ingredients</h2>
          {ingText === null
            ? <button className="btn btn-ghost btn-sm" onClick={() => setIngText(ingredientsToText(r.ingredients))}><Icon name="list" size={16} /> Edit as text</button>
            : <button className="btn btn-soft btn-sm" onClick={applyText}><Icon name="check" size={16} /> Done</button>}
        </div>

        {ingText !== null ? (
          <>
            <p className="fineprint">One ingredient per line, e.g. <code>2 tbsp olive oil</code> or <code>400 g chicken thighs, diced</code>. Start a line with <code>##</code> for a section heading.</p>
            <div className="textarea-wrap">
              <textarea rows={Math.max(8, ingText.split('\n').length + 1)} value={ingText} onChange={e => setIngText(e.target.value)} autoFocus />
              <DictateButton onText={t => setIngText(prev => `${prev ?? ''}${prev && !prev.endsWith('\n') ? '\n' : ''}${t}`)} />
            </div>
          </>
        ) : (
          <>
            {r.ingredients.map((i, idx) => {
              const known = !!matchFood(i.name);
              return (
                <div key={i.id} className="ing-edit">
                  {i.group !== r.ingredients[idx - 1]?.group && i.group && <div className="section-label">{i.group}</div>}
                  <div className="ing-edit-row">
                    <input className="qty-input" inputMode="decimal" placeholder="Qty" value={i.qty ?? ''} aria-label="Quantity"
                      onChange={e => setIng(i.id, { qty: e.target.value === '' ? null : Number(e.target.value.replace(',', '.')) || 0 })} />
                    <select className="unit-select" value={i.unit} onChange={e => setIng(i.id, { unit: e.target.value })} aria-label="Unit">
                      {Array.from(new Set([i.unit, ...UNIT_OPTIONS])).map(u => <option key={u} value={u}>{u ? unitLabel(u, 1) : '—'}</option>)}
                    </select>
                    <input className={`grow ${known ? '' : 'unknown'}`} placeholder="Ingredient" value={i.name} aria-label="Ingredient name" onChange={e => setIng(i.id, { name: e.target.value })} />
                  </div>
                  <div className="ing-edit-row">
                    <input className="note-input grow" placeholder="Note (e.g. finely chopped)" value={i.note ?? ''} onChange={e => setIng(i.id, { note: e.target.value || undefined })} />
                    <button className="icon-btn sm" aria-label="Move up" onClick={() => moveIng(idx, -1)} disabled={idx === 0}><Icon name="chevronDown" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                    <button className="icon-btn sm" aria-label="Move down" onClick={() => moveIng(idx, 1)} disabled={idx === r.ingredients.length - 1}><Icon name="chevronDown" size={16} /></button>
                    <button className="icon-btn sm" aria-label="Delete ingredient" onClick={() => set({ ingredients: r.ingredients.filter(x => x.id !== i.id) })}><Icon name="close" size={16} /></button>
                  </div>
                </div>
              );
            })}
            <button className="btn btn-ghost block" onClick={() => set({ ingredients: [...r.ingredients, { id: uid(), qty: null, unit: '', name: '', group: r.ingredients[r.ingredients.length - 1]?.group }] })}>
              <Icon name="plus" size={18} /> Add ingredient
            </button>
          </>
        )}

        {nutrition && r.ingredients.length > 0 && (
          <div className="nutri-preview">
            <Icon name="flame" size={16} />
            <span><b>{Math.round(nutrition.perServing.kcal)} kcal</b> · {Math.round(nutrition.perServing.protein)} g protein · {Math.round(nutrition.perServing.carbs)} g carbs · {Math.round(nutrition.perServing.fat)} g fat per serving</span>
          </div>
        )}
        {nutrition && nutrition.unmatched.length > 0 && (
          <p className="fineprint">Not in the nutrition database (won’t count toward calories): {nutrition.unmatched.join(', ')}. Using a common name like “chicken thighs” or “red lentils” helps.</p>
        )}
      </div>

      {/* ---------------- Steps */}
      <div className="editor-section">
        <h2>Method</h2>
        {r.steps.map((s, idx) => (
          <div key={idx} className="step-edit">
            <span className="step-num">{idx + 1}</span>
            <div className="textarea-wrap grow">
              <textarea rows={3} value={s} placeholder="Describe this step. Times like “10 minutes” become timers in cook mode."
                onChange={e => set({ steps: r.steps.map((x, j) => (j === idx ? e.target.value : x)) })} />
              <DictateButton onText={t => set({ steps: r.steps.map((x, j) => (j === idx ? `${x ? x + ' ' : ''}${t}` : x)) })} />
            </div>
            <div className="mini-actions col">
              <button className="icon-btn sm" aria-label="Move step up" onClick={() => moveStep(idx, -1)}><Icon name="chevronDown" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
              <button className="icon-btn sm" aria-label="Move step down" onClick={() => moveStep(idx, 1)}><Icon name="chevronDown" size={16} /></button>
              <button className="icon-btn sm" aria-label="Delete step" onClick={() => set({ steps: r.steps.filter((_, j) => j !== idx) })}><Icon name="close" size={16} /></button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost block" onClick={() => set({ steps: [...r.steps, ''] })}><Icon name="plus" size={18} /> Add step</button>
      </div>

      <div className="editor-section">
        <div className="row between">
          <h2>Equipment</h2>
          {r.equipment && <button className="btn btn-ghost btn-sm" onClick={() => set({ equipment: undefined })}>Auto-detect</button>}
        </div>
        <p className="fineprint" style={{ marginTop: 0 }}>{r.equipment ? 'Set by you.' : 'Detected from your method — tap to change.'} Used to match recipes to your kitchen.</p>
        <div className="chip-row wrap">
          {EQUIPMENT.map(e => {
            const cur = r.equipment ?? inferEquipment({ id: `draft:${r.steps.join('|')}`, steps: r.steps, updatedAt: 0 });
            const on = cur.includes(e.id);
            return <Chip key={e.id} small active={on} onClick={() => set({ equipment: on ? cur.filter(x => x !== e.id) : [...cur, e.id] })}>{e.emoji} {e.label}</Chip>;
          })}
        </div>
      </div>

      <div className="editor-section">
        <h2>Extras</h2>
        <label className="field"><span>Notes</span>
          <div className="textarea-wrap"><textarea rows={3} value={r.notes ?? ''} onChange={e => set({ notes: e.target.value })} placeholder="Tips, substitutions, storage…" /><DictateButton onText={t => set({ notes: `${r.notes ? r.notes + ' ' : ''}${t}` })} /></div>
        </label>
        <label className="field"><span>Video link</span><input type="url" inputMode="url" value={r.videoUrl ?? ''} onChange={e => set({ videoUrl: e.target.value || undefined })} placeholder="YouTube, TikTok, Instagram…" /></label>
        <label className="field"><span>Source link</span><input type="url" inputMode="url" value={r.sourceUrl ?? ''} onChange={e => set({ sourceUrl: e.target.value || undefined })} placeholder="https://" /></label>
      </div>

      <button className="btn btn-primary block btn-lg" onClick={save}>Save recipe</button>
      <PhotoSearch open={photoOpen} onClose={() => setPhotoOpen(false)} initial={r.title || 'food'}
        onPick={h => { set({ image: h.url, imageCredit: { label: h.label, page: h.page }, photoAuto: false }); setPhotoOpen(false); }} />
    </div>
  );
}
