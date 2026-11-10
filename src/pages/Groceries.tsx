import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { saveSettings, useRecipes, useSettings } from '../hooks';
import { Icon } from '../components/Icon';
import { AddToGrocerySheet, RecipePicker } from '../components/Sheets';
import { Empty, PageHeader, Sheet, Toggle, toast, useConfirm } from '../components/ui';
import { AISLES, FOODS } from '../data/nutritionDb';
import { aisleFor, matchFood, parseIngredientLine, toGrams, unitLabel, UNIT_OPTIONS } from '../lib/ingredients';
import { fmtGrocery, itemKey, mergeInto } from '../lib/grocery';
import { fmtMoney, groceryItemCost } from '../lib/pricing';
import { aisleEmoji, foodEmoji } from '../lib/emoji';
import type { GroceryItem, Recipe } from '../types';

const SUGGESTIONS = Array.from(new Set(FOODS.map(f => f.k[0]))).sort();

export default function Groceries() {
  const settings = useSettings();
  const items = useLiveQuery(() => db.grocery.orderBy('createdAt').toArray(), []) ?? [];
  const recipes = useRecipes() ?? [];
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [edit, setEdit] = useState<GroceryItem | null>(null);
  const [pickRecipe, setPickRecipe] = useState(false);
  const [recipeForList, setRecipeForList] = useState<Recipe | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { confirm, confirmNode } = useConfirm();
  const ov = settings.priceOverrides;

  const todo = items.filter(i => !i.checked);
  const done = items.filter(i => i.checked);
  const grouped = useMemo(() => {
    const m = new Map<string, GroceryItem[]>();
    for (const i of todo) { const l = m.get(i.aisle) ?? []; l.push(i); m.set(i.aisle, l); }
    for (const l of m.values()) l.sort((a, b) => a.name.localeCompare(b.name));
    return AISLES.filter(a => m.has(a)).map(a => [a, m.get(a)!] as const);
  }, [todo]);

  const sum = (list: GroceryItem[]) => list.reduce((a, i) => a + (groceryItemCost(i, ov) ?? 0), 0);
  const toBuy = sum(todo);
  const inCart = sum(done);
  const total = toBuy + inCart;
  const budget = settings.weeklyBudget;
  const unpriced = items.filter(i => groceryItemCost(i, ov) === null).length;

  const matches = useMemo(() => {
    const t = text.trim().toLowerCase();
    if (t.length < 2) return [];
    const name = parseIngredientLine(t).name.toLowerCase();
    return SUGGESTIONS.filter(s => s.startsWith(name) || s.includes(` ${name}`)).slice(0, 6);
  }, [text]);

  const add = async (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const p = parseIngredientLine(t);
    const { put } = mergeInto(items, [{ name: p.name.toLowerCase(), qty: p.qty, unit: p.unit, aisle: aisleFor(p.name), checked: false, fromRecipes: [], manual: true }]);
    await db.grocery.bulkPut(put);
    setText('');
  };

  const toggle = (i: GroceryItem) => db.grocery.update(i.id, { checked: !i.checked });

  const share = async () => {
    setMoreOpen(false);
    const lines: string[] = ['🛒 Grocery list', ''];
    for (const [aisle, list] of grouped) {
      lines.push(aisle.toUpperCase());
      list.forEach(i => lines.push(`☐ ${[fmtGrocery(i), i.name].filter(Boolean).join(' ')}`));
      lines.push('');
    }
    if (toBuy > 0) lines.push(`Estimated: ${fmtMoney(toBuy, settings.currency, 0)}`);
    const textOut = lines.join('\n').trim();
    try {
      if (navigator.share) await navigator.share({ title: 'Grocery list', text: textOut });
      else { await navigator.clipboard.writeText(textOut); toast('List copied to clipboard'); }
    } catch { /* cancelled */ }
  };
  const clearDone = async () => { setMoreOpen(false); await db.grocery.bulkDelete(done.map(d => d.id)); toast('Cleared ticked items'); };
  const clearAll = async () => {
    setMoreOpen(false);
    if (!(await confirm('Remove every item from your grocery list?', 'Clear list'))) return;
    await db.grocery.clear();
  };

  return (
    <div className="page">
      <PageHeader title="Groceries" sub={items.length ? `${todo.length} to buy · ${done.length} in cart` : undefined}
        right={<button className="icon-btn" aria-label="More" onClick={() => setMoreOpen(true)}><Icon name="more" /></button>} />

      {items.length > 0 && (
        <div className="card-flat money-card">
          <div className="money-top">
            <div>
              <div className="faint small" style={{ fontWeight: 700 }}>Estimated total</div>
              <div className="money-big">{fmtMoney(total, settings.currency, 0)}</div>
            </div>
            {budget > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <div className="faint small" style={{ fontWeight: 700 }}>Weekly budget</div>
                <b style={{ color: total > budget ? 'var(--coral)' : 'var(--accent-text)' }}>
                  {total > budget ? `${fmtMoney(total - budget, settings.currency, 0)} over` : `${fmtMoney(budget - total, settings.currency, 0)} left`}
                </b>
              </div>
            ) : (
              <button className="btn btn-soft btn-sm" onClick={() => nav('/settings#budget')}><Icon name="wallet" size={16} /> Set budget</button>
            )}
          </div>
          {budget > 0 && <div className={`bar ${total > budget ? 'over' : ''}`}><span style={{ width: `${Math.min(100, (total / budget) * 100)}%` }} /></div>}
          <small className="faint">
            {fmtMoney(toBuy, settings.currency, 0)} to buy · {fmtMoney(inCart, settings.currency, 0)} in cart
            {unpriced > 0 ? ` · ${unpriced} item${unpriced === 1 ? '' : 's'} without a price` : ''}. Tap an item to set your own price.
          </small>
        </div>
      )}

      <form className="add-bar" onSubmit={e => { e.preventDefault(); add(text); }}>
        <Icon name="plus" size={18} />
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add item, e.g. 1 kg tomatoes" aria-label="Add grocery item" />
        {text && <button type="submit" className="btn btn-primary btn-sm">Add</button>}
      </form>
      {matches.length > 0 && (
        <div className="chip-row scroll suggestions">
          {matches.map(m => {
            const p = parseIngredientLine(text);
            const withQty = [p.qty ?? '', p.unit, m].filter(Boolean).join(' ');
            return <button key={m} className="chip chip-sm" onClick={() => add(withQty)}>{foodEmoji(m)} {m}</button>;
          })}
        </div>
      )}

      <div className="quick-row">
        <button className="quick-btn" onClick={() => nav('/plan')}><span>📅</span> From meal plan</button>
        <button className="quick-btn" onClick={() => setPickRecipe(true)}><span>📖</span> From a recipe</button>
      </div>

      {!items.length ? (
        <Empty icon="cart" title="Your list is empty">Add items above, send your meal plan, or add a recipe’s ingredients.</Empty>
      ) : (
        <>
          {grouped.map(([aisle, list]) => (
            <section key={aisle} className="aisle">
              <div className="aisle-head">{aisleEmoji(aisle)} {aisle}<span className="count">{list.length}</span><span className="grow" /><span style={{ textTransform: 'none', letterSpacing: 0 }}>{fmtMoney(sum(list), settings.currency, 0)}</span></div>
              {list.map(i => <Item key={i.id} item={i} currency={settings.currency} overrides={ov} onToggle={() => toggle(i)} onEdit={() => setEdit(i)} />)}
            </section>
          ))}
          {!todo.length && <p className="muted center pad">All done! 🎉</p>}
          {done.length > 0 && (
            <section className="aisle">
              <button className="aisle-head" onClick={() => setShowDone(!showDone)}>
                ✅ In cart <span className="count">{done.length}</span>
                <Icon name="chevronDown" size={16} style={{ transform: showDone ? 'rotate(180deg)' : undefined, marginLeft: 'auto' }} />
              </button>
              {showDone && done.map(i => <Item key={i.id} item={i} currency={settings.currency} overrides={ov} onToggle={() => toggle(i)} onEdit={() => setEdit(i)} />)}
            </section>
          )}
          <p className="fineprint">Prices are estimates of typical UAE supermarket prices for the amounts you need — set your own on any item.</p>
        </>
      )}

      {edit && <EditItem item={edit} onClose={() => setEdit(null)} />}
      <RecipePicker open={pickRecipe} onClose={() => setPickRecipe(false)} recipes={recipes} title="Add ingredients from…"
        onPick={r => { setPickRecipe(false); setRecipeForList(r); }} />
      {recipeForList && <AddToGrocerySheet open onClose={() => setRecipeForList(null)} recipe={recipeForList} scale={1} />}

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Grocery list">
        <div className="menu">
          <button onClick={share}><Icon name="share" /> Share / copy list</button>
          <button onClick={clearDone} disabled={!done.length}><Icon name="check" /> Clear ticked items</button>
          <button className="danger" onClick={clearAll} disabled={!items.length}><Icon name="trash" /> Clear entire list</button>
        </div>
      </Sheet>
      {confirmNode}
    </div>
  );
}

function Item({ item, currency, overrides, onToggle, onEdit }: { item: GroceryItem; currency: string; overrides: Record<string, number>; onToggle: () => void; onEdit: () => void }) {
  const cost = groceryItemCost(item, overrides);
  const own = item.price !== undefined || overrides[itemKey(item.name)] !== undefined;
  return (
    <div className={`g-item ${item.checked ? 'checked' : ''}`}>
      <button className={`g-check ${item.checked ? 'on' : ''}`} onClick={onToggle} aria-label={item.checked ? `Untick ${item.name}` : `Tick ${item.name}`}>
        <Icon name="check" size={15} />
      </button>
      <span className="g-emoji" aria-hidden="true">{foodEmoji(item.name)}</span>
      <button className="g-body" onClick={onEdit}>
        <span className="g-name">{item.name}</span>
        {item.fromRecipes.length > 0 && <small className="truncate">{item.fromRecipes.join(', ')}</small>}
      </button>
      <button className="g-right" onClick={onEdit}>
        <span className="g-qty">{fmtGrocery(item)}</span>
        {cost !== null && cost > 0 && <span className={`g-price ${own ? 'own' : ''}`}>{fmtMoney(cost, currency)}</span>}
      </button>
    </div>
  );
}

function EditItem({ item, onClose }: { item: GroceryItem; onClose: () => void }) {
  const settings = useSettings();
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty === null ? '' : String(item.qty));
  const [unit, setUnit] = useState(item.unit);
  const [aisle, setAisle] = useState(item.aisle);
  const estimate = groceryItemCost({ ...item, price: undefined }, settings.priceOverrides);
  const [price, setPrice] = useState(item.price !== undefined ? String(item.price) : '');
  const [remember, setRemember] = useState(false);

  const save = async () => {
    const q = qty === '' ? null : Number(qty.replace(',', '.')) || 0;
    const p = price.trim() === '' ? undefined : Number(price.replace(',', '.'));
    await db.grocery.update(item.id, { name: name.trim() || item.name, qty: q, unit, aisle, price: p !== undefined && !isNaN(p) ? p : undefined });
    if (remember && p !== undefined && !isNaN(p) && q) {
      // Save as your own price per kg (or per item when it can't be weighed)
      const g = toGrams(q, unit, matchFood(name));
      const perKg = g ? (p / g) * 1000 : p / q;
      await saveSettings({ priceOverrides: { ...settings.priceOverrides, [itemKey(name)]: Math.round(perKg * 100) / 100 } });
      toast('Price saved for future lists and recipe costs');
    }
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="Edit item"
      footer={<div className="row gap"><button className="btn btn-danger" aria-label="Delete item" onClick={async () => { await db.grocery.delete(item.id); onClose(); }}><Icon name="trash" size={18} /></button><button className="btn btn-primary grow" onClick={save}>Save</button></div>}>
      <label className="field"><span>Item</span><input value={name} onChange={e => setName(e.target.value)} /></label>
      <div className="field-grid two">
        <label className="field"><span>Quantity</span><input inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} placeholder="–" /></label>
        <label className="field"><span>Unit</span>
          <select value={unit} onChange={e => setUnit(e.target.value)}>
            {Array.from(new Set([unit, ...UNIT_OPTIONS])).map(u => <option key={u} value={u}>{u ? unitLabel(u, 2) : 'pcs'}</option>)}
          </select>
        </label>
      </div>
      <label className="field"><span>Your price</span>
        <div className="prefix-input"><span>{settings.currency}</span><input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder={estimate !== null ? `≈ ${estimate.toFixed(2)} (estimate)` : 'No estimate'} /></div>
      </label>
      {price.trim() !== '' && <Toggle checked={remember} onChange={setRemember} label="Remember this price" hint="Use it for future lists and recipe costs" />}
      <label className="field" style={{ marginTop: 8 }}><span>Aisle</span>
        <select value={aisle} onChange={e => setAisle(e.target.value)}>{AISLES.map(a => <option key={a}>{a}</option>)}</select>
      </label>
      {item.fromRecipes.length > 0 && <p className="fineprint">For: {item.fromRecipes.join(', ')}</p>}
    </Sheet>
  );
}
