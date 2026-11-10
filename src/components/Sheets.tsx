import { useMemo, useState } from 'react';
import type { Recipe, Slot, PlanEntry } from '../types';
import { SLOTS } from '../types';
import { Sheet, Chip, Stepper, toast } from './ui';
import { RecipeRow } from './RecipeCard';
import { Icon } from './Icon';
import { db } from '../db';
import { useSettings } from '../hooks';
import { addDays, fmtDay, today, weekStartOf, capitalize } from '../lib/util';
import { fmtQty, unitLabel, recipeConflicts, UNIT_OPTIONS } from '../lib/ingredients';
import { groceriesFromIngredients, isPantry, mergeInto } from '../lib/grocery';
import { slotMatches } from '../lib/planner';

/* ------------------------------------------------------- Recipe picker */

export function RecipePicker({ open, onClose, recipes, slot, onPick, title = 'Choose a recipe' }: {
  open: boolean; onClose: () => void; recipes: Recipe[]; slot?: Slot; onPick: (r: Recipe) => void; title?: string;
}) {
  const settings = useSettings();
  const [q, setQ] = useState('');
  const [onlySlot, setOnlySlot] = useState(true);
  const [favs, setFavs] = useState(false);
  const exclusions = [...settings.allergies, ...settings.avoid];
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return recipes
      .filter(r => !slot || !onlySlot || slotMatches(r, slot))
      .filter(r => !favs || r.favorite)
      .filter(r => !s || r.title.toLowerCase().includes(s) || r.cuisine.toLowerCase().includes(s) || r.ingredients.some(i => i.name.toLowerCase().includes(s)))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.title.localeCompare(b.title));
  }, [recipes, q, slot, onlySlot, favs]);
  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <div className="search-box">
        <Icon name="search" size={18} />
        <input autoFocus placeholder="Search recipes or ingredients" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="chip-row">
        {slot && <Chip active={onlySlot} onClick={() => setOnlySlot(!onlySlot)}>{capitalize(slot)} only</Chip>}
        <Chip active={favs} onClick={() => setFavs(!favs)}>♥ Favourites</Chip>
      </div>
      <div className="list">
        {list.map(r => {
          const conflicts = recipeConflicts(r, exclusions);
          return (
            <RecipeRow key={r.id} recipe={r} onClick={() => onPick(r)}
              right={conflicts.length ? <span className="badge badge-warn" title={`Contains ${conflicts.join(', ')}`}><Icon name="alert" size={14} /></span> : <Icon name="chevronRight" size={18} />} />
          );
        })}
        {!list.length && <p className="muted center pad">No recipes found.</p>}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------- Add to plan */

export function AddToPlanSheet({ open, onClose, recipe }: { open: boolean; onClose: () => void; recipe: Recipe }) {
  const settings = useSettings();
  const start = weekStartOf(today(), settings.weekStart);
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i)).filter(d => d >= today());
  const defaultSlot: Slot = (SLOTS.find(s => slotMatches(recipe, s)) ?? 'dinner');
  const [date, setDate] = useState(days[0]);
  const [slot, setSlot] = useState<Slot>(defaultSlot);
  const [servings, setServings] = useState(settings.householdServings);

  const save = async () => {
    const existing = await db.plan.where('date').equals(date).filter(e => e.slot === slot).toArray();
    const entry: PlanEntry = { id: `${date}|${slot}|${Date.now().toString(36)}`, date, slot, recipeId: recipe.id, servings, locked: false };
    // Replace an unlocked single entry in that slot, otherwise add alongside
    const replace = existing.find(e => !e.locked);
    if (replace) await db.plan.delete(replace.id);
    await db.plan.put(entry);
    toast(`Added to ${fmtDay(date)} · ${slot}`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add to meal plan"
      footer={<button className="btn btn-primary block" onClick={save}>Add to {fmtDay(date)}</button>}>
      <div className="section-label">Day</div>
      <div className="day-pills">
        {days.map(d => (
          <button key={d} className={`day-pill ${d === date ? 'active' : ''}`} onClick={() => setDate(d)}>
            <small>{fmtDay(d).split(' ')[0].replace(',', '')}</small>
            <b>{Number(d.slice(8))}</b>
          </button>
        ))}
      </div>
      <div className="section-label">Meal</div>
      <div className="chip-row wrap">
        {SLOTS.map(s => <Chip key={s} active={slot === s} onClick={() => setSlot(s)}>{capitalize(s)}</Chip>)}
      </div>
      <div className="section-label">Servings to cook</div>
      <Stepper value={servings} onChange={setServings} min={1} max={20} />
    </Sheet>
  );
}

/* ----------------------------------------------------- Add to groceries */

export function AddToGrocerySheet({ open, onClose, recipe, scale }: { open: boolean; onClose: () => void; recipe: Recipe; scale: number }) {
  const settings = useSettings();
  const [rows, setRows] = useState(() =>
    recipe.ingredients.map(i => ({ id: i.id, name: i.name, qty: i.qty === null ? null : +(i.qty * scale).toFixed(2), unit: i.unit, on: !isPantry(i.name, settings.pantry) }))
  );
  const set = (id: string, patch: Partial<(typeof rows)[number]>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const chosen = rows.filter(r => r.on);

  const add = async () => {
    const incoming = groceriesFromIngredients(chosen.map(r => ({ ing: { name: r.name, qty: r.qty, unit: r.unit }, scale: 1, recipe: recipe.title })));
    const existing = await db.grocery.toArray();
    const { put } = mergeInto(existing, incoming);
    await db.grocery.bulkPut(put);
    toast(`${chosen.length} item${chosen.length === 1 ? '' : 's'} added to groceries`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add to groceries" tall
      footer={<button className="btn btn-primary block" disabled={!chosen.length} onClick={add}>Add {chosen.length} item{chosen.length === 1 ? '' : 's'}</button>}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span className="muted">Untick anything you already have. Quantities are editable.</span>
      </div>
      <div className="row gap" style={{ marginBottom: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setRows(rs => rs.map(r => ({ ...r, on: true })))}>Select all</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setRows(rs => rs.map(r => ({ ...r, on: false })))}>Select none</button>
      </div>
      <div className="list">
        {rows.map(r => (
          <div key={r.id} className={`grocery-edit-row ${r.on ? '' : 'off'}`}>
            <input type="checkbox" className="check" checked={r.on} onChange={e => set(r.id, { on: e.target.checked })} aria-label={`Include ${r.name}`} />
            <input className="qty-input" inputMode="decimal" value={r.qty ?? ''} placeholder="–"
              onChange={e => set(r.id, { qty: e.target.value === '' ? null : Number(e.target.value.replace(',', '.')) || 0 })} aria-label="Quantity" />
            <select className="unit-select" value={r.unit} onChange={e => set(r.id, { unit: e.target.value })} aria-label="Unit">
              {Array.from(new Set([r.unit, ...UNIT_OPTIONS])).map(u => <option key={u} value={u}>{u ? unitLabel(u, r.qty) : 'pcs'}</option>)}
            </select>
            <span className="grow name">{r.name}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export function qtyLine(qty: number | null, unit: string) {
  return [fmtQty(qty), unitLabel(unit, qty)].filter(Boolean).join(' ');
}
