import { useEffect, useRef, useState } from 'react';
import { saveDeviceSettings, saveSettings, useCollections, useSettings } from '../hooks';
import { db, exportAll, importAll, restoreStarterRecipes, wipeAll, type Backup } from '../db';
import { Icon } from '../components/Icon';
import { Chip, ChipInput, NumField, PageHeader, Sheet, Stepper, toast, useConfirm } from '../components/ui';
import { DIETS, SLOTS, type Settings } from '../types';
import { autoTargets } from '../lib/planner';
import { capitalize, DAY_SHORT, uid } from '../lib/util';
import { KitchenPicker } from '../components/KitchenPicker';
import { prefetchPhotos, resolveStarterPhotos } from '../lib/photos';
import { fmtMoney } from '../lib/pricing';
import { ALLERGY_OPTIONS } from './Onboarding';
import { AISettings } from './AISettings';
import { AccountCard } from '../components/AccountCard';
import { useAuth } from '../components/Account';
import { SIcon } from '../components/SavoraIcons';
import { legacyIcon } from '../lib/foodIcons';

const COLLECTION_ICONS = ['folder', 'bolt', 'box', 'party', 'star', 'heart', 'calendar', 'flame', 'sun', 'moon', 'wallet', 'clock', 'herb'];

const ACTIVITY: [number, string][] = [[1.2, 'Sedentary'], [1.375, 'Light (1–3 days/wk)'], [1.55, 'Moderate (3–5 days/wk)'], [1.725, 'Very active (6–7 days/wk)'], [1.9, 'Athlete (2× a day)']];

export default function SettingsPage() {
  const s = useSettings();
  const auth = useAuth();
  const signedIn = auth.status === 'signedIn';
  const collections = useCollections();
  const { confirm, confirmNode } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [colName, setColName] = useState('');
  const [importData, setImportData] = useState<Backup | null>(null);
  const [counts, setCounts] = useState({ recipes: 0, plan: 0, photos: 0 });
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const [budgetText, setBudgetText] = useState(s.weeklyBudget ? String(s.weeklyBudget) : '');
  useEffect(() => { setBudgetText(s.weeklyBudget ? String(s.weeklyBudget) : ''); }, [s.weeklyBudget]);

  useEffect(() => {
    Promise.all([db.recipes.count(), db.plan.count(), db.recipes.filter(r => !!r.image && /^https?:/.test(r.image)).count()])
      .then(([recipes, plan, photos]) => setCounts({ recipes, plan, photos }));
    const hash = location.hash.split('#')[2];
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [photoBusy]);

  const set = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    if (next.targetsMode === 'auto') Object.assign(patch, autoTargets(next));
    saveSettings(patch);
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const num = (v: string) => Number(v.replace(/[^\d.]/g, '')) || 0;

  const refreshPhotos = async (force: boolean) => {
    if (!navigator.onLine) { toast('Connect to the internet to fetch photos'); return; }
    setPhotoBusy(force ? 'refresh' : 'missing');
    try {
      const n = await resolveStarterPhotos(force, (d, t) => setPhotoBusy(`${d}/${t}`));
      await saveDeviceSettings({ photosVersion: 1 });
      toast(n ? `Updated ${n} photos` : 'All starter recipes already have photos');
    } catch { toast('Couldn’t reach Wikimedia — try again later'); }
    setPhotoBusy(null);
  };
  const downloadPhotos = async () => {
    if (!navigator.onLine) { toast('Connect to the internet first'); return; }
    setPhotoBusy('download');
    const urls = (await db.recipes.toArray()).map(r => r.image).filter((u): u is string => !!u && /^https?:/.test(u));
    await prefetchPhotos(urls);
    toast(`${urls.length} photos saved for offline use`);
    setPhotoBusy(null);
  };

  const doExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const name = `savora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Savora backup' }); return; }
    } catch { /* cancelled, fall through */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup downloaded');
  };
  const onImportFile = async (f?: File) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as Backup;
      if (data?.app !== 'savora' && data?.app !== 'mise') throw new Error();
      setImportData(data);
    } catch { toast('That file isn’t a Savora backup'); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const doImport = async (mode: 'replace' | 'merge') => {
    if (!importData) return;
    try { await importAll(importData, mode); toast(`Imported ${importData.recipes.length} recipes`); }
    catch (e) { toast((e as Error).message); }
    setImportData(null);
  };

  const prices = Object.entries(s.priceOverrides ?? {});

  return (
    <div className="page settings">
      <PageHeader title="Me" back="/" />

      <AccountCard />

      <section className="card" id="kitchen">
        <h2 className="h-ico"><SIcon name="hob" size={24} /> My kitchen</h2>
        <p className="muted small" style={{ marginTop: -4, marginBottom: 12 }}>Savora only plans and suggests recipes you can make with what you have. With an air fryer, many oven recipes still work — you’ll get conversion tips.</p>
        <KitchenPicker value={s.equipment} onChange={v => saveSettings({ equipment: v })} />
      </section>

      <section className="card" id="budget">
        <h2 className="h-ico"><SIcon name="wallet" size={24} /> Weekly budget</h2>
        <p className="muted small" style={{ marginTop: -4, marginBottom: 12 }}>Plan my week aims to keep the week’s meals under this. Leave empty to turn it off.</p>
        <div className="input-with-btn">
          <div className="prefix-input grow"><span>{s.currency}</span>
            <input inputMode="numeric" placeholder="e.g. 400" value={budgetText} onChange={e => setBudgetText(e.target.value)}
              onBlur={() => saveSettings({ weeklyBudget: num(budgetText) })} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
          </div>
        </div>
        <div className="chip-row wrap" style={{ marginTop: 10 }}>
          {[250, 400, 600, 800].map(v => <Chip key={v} small active={s.weeklyBudget === v} onClick={() => saveSettings({ weeklyBudget: v })}>{fmtMoney(v, s.currency, 0)}</Chip>)}
          {s.weeklyBudget > 0 && <Chip small onClick={() => saveSettings({ weeklyBudget: 0 })}>Off</Chip>}
        </div>
        <div className="section-label">Your prices</div>
        {prices.length ? prices.map(([k, v]) => (
          <div key={k} className="row between list-row">
            <span className="grow" style={{ fontWeight: 650 }}>{capitalize(k)}</span>
            <span className="muted small">{fmtMoney(v, s.currency, 2)} / kg</span>
            <button className="icon-btn sm" aria-label={`Remove price for ${k}`} onClick={() => { const n = { ...s.priceOverrides }; delete n[k]; saveSettings({ priceOverrides: n }); }}><Icon name="close" size={16} /></button>
          </div>
        )) : <p className="fineprint" style={{ marginTop: 0 }}>Estimates use typical UAE supermarket prices. Tap any grocery item to save your own price — it’s then used everywhere.</p>}
      </section>

      <section className="card">
        <h2>Profile & daily targets</h2>
        <label className="field"><span>Name</span><input value={s.name} onChange={e => saveSettings({ name: e.target.value })} placeholder="Optional" /></label>
        <div className="field-grid two">
          <label className="field"><span>Sex</span>
            <select value={s.sex} onChange={e => set({ sex: e.target.value as Settings['sex'] })}><option value="male">Male</option><option value="female">Female</option></select>
          </label>
          <label className="field"><span>Age</span><NumField value={s.age} min={1} max={120} onCommit={n => set({ age: n })} ariaLabel="Age" /></label>
          <label className="field"><span>Height (cm)</span><NumField value={s.heightCm} min={50} max={260} onCommit={n => set({ heightCm: n })} ariaLabel="Height in cm" /></label>
          <label className="field"><span>Weight (kg)</span><NumField decimal value={s.weightKg} min={20} max={400} onCommit={n => set({ weightKg: n })} ariaLabel="Weight in kg" /></label>
        </div>
        <label className="field"><span>Activity</span>
          <select value={s.activity} onChange={e => set({ activity: Number(e.target.value) })}>{ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <div className="field"><span>Goal</span>
          <div className="chip-row wrap">{(['lose', 'maintain', 'gain'] as const).map(g => <Chip key={g} active={s.goal === g} onClick={() => set({ goal: g })}>{g === 'lose' ? 'Lose weight' : g === 'gain' ? 'Build muscle' : 'Maintain'}</Chip>)}</div>
        </div>
        <div className="field"><span>Targets</span>
          <div className="chip-row wrap">
            <Chip active={s.targetsMode === 'auto'} onClick={() => set({ targetsMode: 'auto' })}>Calculate for me</Chip>
            <Chip active={s.targetsMode === 'manual'} onClick={() => saveSettings({ targetsMode: 'manual' })}>Set manually</Chip>
          </div>
        </div>
        <div className="field-grid four">
          {(['kcal', 'protein', 'carbs', 'fat'] as const).map(k => (
            <label key={k} className="field"><span>{k === 'kcal' ? 'Calories' : `${capitalize(k)} (g)`}</span>
              <NumField value={s[k]} disabled={s.targetsMode === 'auto'} max={20000} onCommit={n => saveSettings({ [k]: n })} />
            </label>
          ))}
        </div>
        {s.targetsMode === 'auto' && <p className="fineprint">Estimated with the Mifflin–St Jeor formula. Switch to manual to use numbers from your coach or dietitian.</p>}
      </section>

      <section className="card">
        <h2>Allergies & preferences</h2>
        <div className="field"><span>Allergies</span>
          <div className="chip-row wrap">{ALLERGY_OPTIONS.map(a => <Chip key={a} active={s.allergies.includes(a)} onClick={() => saveSettings({ allergies: toggle(s.allergies, a) })}>{capitalize(a)}</Chip>)}</div>
        </div>
        <div className="field"><span>Foods you avoid</span>
          <ChipInput values={s.avoid} onChange={v => saveSettings({ avoid: v })} placeholder="e.g. mushrooms" />
        </div>
        <div className="field"><span>Diet</span>
          <div className="chip-row wrap">{DIETS.map(d => <Chip key={d} active={s.diets.includes(d)} onClick={() => saveSettings({ diets: toggle(s.diets, d) })}>{capitalize(d)}</Chip>)}</div>
        </div>
        <div className="field"><span>Pantry staples (always in stock — left off grocery lists)</span>
          <ChipInput values={s.pantry} onChange={v => saveSettings({ pantry: v })} placeholder="e.g. olive oil" suggestions={['olive oil', 'vegetable oil', 'sugar', 'flour', 'ground cumin', 'paprika', 'cinnamon', 'soy sauce', 'honey']} />
        </div>
      </section>

      <section className="card" id="planner">
        <h2>Meal planner</h2>
        <div className="field"><span>Cooking days</span>
          <div className="dow-row">{DAY_SHORT.map((d, i) => <button key={d} className={`dow ${s.cookingDays.includes(i) ? 'on' : ''}`} onClick={() => saveSettings({ cookingDays: toggle(s.cookingDays, i) })} aria-pressed={s.cookingDays.includes(i)}>{d}</button>)}</div>
        </div>
        <div className="field"><span>Meals to plan</span>
          <div className="chip-row wrap">{SLOTS.map(sl => <Chip key={sl} active={s.planSlots.includes(sl)} onClick={() => saveSettings({ planSlots: toggle(s.planSlots, sl) })}>{capitalize(sl)}</Chip>)}</div>
        </div>
        <div className="row between field-row"><span style={{ fontWeight: 650 }}>Default servings</span><Stepper value={s.householdServings} onChange={v => saveSettings({ householdServings: v })} min={1} max={12} /></div>
        <div className="field"><span>Week starts on</span>
          <div className="chip-row"><Chip active={s.weekStart === 1} onClick={() => saveSettings({ weekStart: 1 })}>Monday</Chip><Chip active={s.weekStart === 0} onClick={() => saveSettings({ weekStart: 0 })}>Sunday</Chip></div>
        </div>
      </section>

      <section className="card" id="photos">
        <h2 className="h-ico"><SIcon name="camera" size={24} /> Recipe photos</h2>
        <p className="muted small" style={{ marginTop: -4, marginBottom: 12 }}>Real food photos come from Wikipedia / Wikimedia Commons (free licences, credited on each recipe). {counts.photos} recipes have online photos; they’re stored on your phone after the first view.</p>
        <div className="menu">
          <button onClick={() => refreshPhotos(false)} disabled={!!photoBusy}><Icon name="image" /> {photoBusy && photoBusy.includes('/') ? `Finding photos… ${photoBusy}` : 'Find missing photos'}</button>
          <button onClick={() => refreshPhotos(true)} disabled={!!photoBusy}><Icon name="refresh" /> Refresh all starter photos</button>
          <button onClick={downloadPhotos} disabled={!!photoBusy}><Icon name="download" /> {photoBusy === 'download' ? 'Saving…' : 'Save all photos for offline'}</button>
        </div>
      </section>

      <section className="card">
        <h2>Collections</h2>
        {collections.map(c => (
          <div key={c.id} className="row between list-row">
            <button className="icon-btn boxed col-ico" aria-label={`Change icon for ${c.name}`} title="Tap to change icon"
              onClick={() => { const cur = legacyIcon(c.emoji) ?? 'folder'; db.collections.update(c.id, { emoji: COLLECTION_ICONS[(COLLECTION_ICONS.indexOf(cur) + 1) % COLLECTION_ICONS.length] }); }}>
              <SIcon name={legacyIcon(c.emoji) ?? 'folder'} size={20} />
            </button>
            <input className="grow plain-input" value={c.name} aria-label="Collection name" onChange={e => db.collections.update(c.id, { name: e.target.value })} />
            <button className="icon-btn sm" aria-label={`Delete ${c.name}`} onClick={async () => {
              if (!(await confirm(`Delete the “${c.name}” collection? Recipes are kept.`, 'Delete'))) return;
              await db.collections.delete(c.id);
              const rs = await db.recipes.where('collections').equals(c.id).toArray();
              await db.recipes.bulkPut(rs.map(r => ({ ...r, collections: r.collections.filter(x => x !== c.id) })));
            }}><Icon name="trash" size={16} /></button>
          </div>
        ))}
        <div className="input-with-btn">
          <input placeholder="New collection" value={colName} onChange={e => setColName(e.target.value)} />
          <button className="btn btn-primary" disabled={!colName.trim()} onClick={async () => { await db.collections.put({ id: uid(), name: colName.trim(), emoji: 'folder', createdAt: Date.now() }); setColName(''); }}>Add</button>
        </div>
      </section>

      <section className="card">
        <h2>Appearance</h2>
        <div className="chip-row">{(['system', 'light', 'dark'] as const).map(t => <Chip key={t} active={s.theme === t} onClick={() => saveSettings({ theme: t })}>{capitalize(t)}</Chip>)}</div>
      </section>

      <AISettings />

      <section className="card">
        <h2>Your data</h2>
        <p className="muted small">{signedIn
          ? <>{counts.recipes} recipes and {counts.plan} planned meals, kept on this device and synced to your account. A backup file is still handy for your own records.</>
          : <>Everything is stored only on this device ({counts.recipes} recipes, {counts.plan} planned meals). Sign in to keep it safe, or back up regularly — clearing site data deletes it.</>}</p>
        <div className="menu">
          <button onClick={doExport}><Icon name="download" /> Back up (export file)</button>
          <button onClick={() => fileRef.current?.click()}><Icon name="upload" /> Restore from backup</button>
          <button onClick={async () => { const n = await restoreStarterRecipes(); toast(n ? `Restored ${n} starter recipes` : 'All starter recipes are already here'); }}><Icon name="refresh" /> Restore starter recipes</button>
          {!signedIn && <button className="danger" onClick={async () => { if (await confirm('Delete ALL recipes, plans, groceries and settings on this device? This cannot be undone.', 'Delete everything')) await wipeAll(); }}><Icon name="trash" /> Reset app</button>}
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => onImportFile(e.target.files?.[0])} />
      </section>

      <p className="fineprint center">Savora · recipes, planning & AI kitchen assistant · works offline<br />Nutrition and prices are estimates. Photos: Wikimedia Commons contributors.</p>

      <Sheet open={!!importData} onClose={() => setImportData(null)} title="Restore backup">
        {importData && <p className="muted">Backup from {new Date(importData.exportedAt).toLocaleString()} with {importData.recipes.length} recipes and {importData.plan?.length ?? 0} planned meals.</p>}
        <div className="menu">
          <button onClick={() => doImport('merge')}><Icon name="plus" /> Merge with what’s on this phone</button>
          <button className="danger" onClick={() => doImport('replace')}><Icon name="refresh" /> Replace everything on this phone</button>
        </div>
      </Sheet>
      {confirmNode}
    </div>
  );
}
