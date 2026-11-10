import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Chip, toast } from '../components/ui';
import { Icon } from '../components/Icon';
import { NeedKey, aiToast, useAIReady, useOpenDraft } from '../components/AI';
import { useSettings, useStock } from '../hooks';
import { cleanName } from '../lib/grocery';
import { whatCanIMake, type PantrySuggestion } from '../lib/ai/features';
import { fmtMinutes } from '../lib/util';
import { SIcon } from '../components/SavoraIcons';

const QUICK = ['chicken', 'eggs', 'rice', 'pasta', 'tomatoes', 'onions', 'potatoes', 'yoghurt', 'spinach', 'chickpeas', 'cheese', 'tuna'];
const MOODS = ['Quick (under 30 min)', 'Light & healthy', 'Comfort food', 'High protein', 'One pan'];

export default function Fridge() {
  const aiReady = useAIReady();
  const settings = useSettings();
  const openDraft = useOpenDraft();
  const [items, setItems] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<PantrySuggestion[] | null>(null);
  const abort = useRef<AbortController | null>(null);
  const stock = useStock();
  const homeNames = [...new Set(stock.map(s => cleanName(s.name) || s.name))];
  const useHome = () => setItems(cur => [...new Set([...cur, ...homeNames])]);
  // Start from what you have at home
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || !homeNames.length) return;
    loaded.current = true;
    setItems(cur => (cur.length ? cur : homeNames));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeNames.join('|')]);

  const add = (raw: string) => {
    const parts = raw.split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length) setItems(cur => [...new Set([...cur, ...parts])]);
    setText('');
  };
  const toggleQuick = (q: string) => setItems(cur => (cur.includes(q) ? cur.filter(x => x !== q) : [...cur, q]));

  const go = async () => {
    const all = text.trim() ? [...new Set([...items, ...text.split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean)])] : items;
    if (all.length < 2) { toast('Add at least two ingredients'); return; }
    setItems(all); setText('');
    abort.current?.abort();
    abort.current = new AbortController();
    setBusy(true); setIdeas(null);
    try { setIdeas(await whatCanIMake(all, mood, settings, abort.current.signal)); }
    catch (e) { aiToast(e); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <PageHeader title="What can I make?" back />
      <p className="muted">List what you have. Savora suggests meals that fit your kitchen, diet and allergies{settings.allergies.length ? ` (no ${settings.allergies.join(', ')})` : ''}.</p>

      {!aiReady && <NeedKey what="“What can I make?”" />}

      {stock.length > 0 ? (
        <div className="home-strip">
          <SIcon name="basket" size={20} />
          <span className="grow">Using what you have at home ({stock.length})</span>
          <button className="btn btn-soft btn-sm" onClick={useHome}>Add all</button>
          <Link className="btn btn-ghost btn-sm" to="/groceries?tab=home">Edit</Link>
        </div>
      ) : (
        <div className="home-strip"><SIcon name="basket" size={20} /><span className="grow">Tip: keep an <b>At home</b> list in Groceries and it fills in here.</span><Link className="btn btn-ghost btn-sm" to="/groceries?tab=home">Open</Link></div>
      )}
      <div className="chip-row wrap">
        {QUICK.map(q => <Chip key={q} small active={items.includes(q)} onClick={() => toggleQuick(q)}>{q}</Chip>)}
      </div>
      <div className="row gap">
        <input className="grow" value={text} placeholder="Add more… (comma separated)" onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }} />
        <button className="btn btn-soft" onClick={() => add(text)} disabled={!text.trim()}>Add</button>
      </div>
      {items.filter(i => !QUICK.includes(i)).length > 0 && (
        <div className="chip-row wrap">
          {items.filter(i => !QUICK.includes(i)).map(i => <Chip key={i} small active onClick={() => setItems(cur => cur.filter(x => x !== i))}>{i} <Icon name="close" size={12} /></Chip>)}
        </div>
      )}

      <div className="section-label">Mood (optional)</div>
      <div className="chip-row wrap">
        {MOODS.map(m => <Chip key={m} small active={mood === m} onClick={() => setMood(mood === m ? '' : m)}>{m}</Chip>)}
      </div>

      <button className="btn btn-primary block btn-lg" disabled={busy || !aiReady} onClick={go}>
        <Icon name="sparkles" size={18} /> {busy ? 'Thinking…' : 'Find meals'}
      </button>
      {busy && <button className="btn btn-ghost block" onClick={() => abort.current?.abort()}>Cancel</button>}

      {ideas?.map((s, i) => (
        <div className="card" key={i}>
          <h3>{s.draft.title}</h3>
          <p className="muted small">{s.draft.cuisine ? `${s.draft.cuisine} · ` : ''}{fmtMinutes(s.draft.prepMin + s.draft.cookMin)} · serves {s.draft.servings}</p>
          {s.why && <p>{s.why}</p>}
          {s.uses.length > 0 && <p className="small"><b>Uses:</b> {s.uses.join(', ')}</p>}
          {s.missing.length > 0 ? <p className="small"><b>You’d also need:</b> {s.missing.join(', ')}</p> : <p className="small row gap-sm"><SIcon name="check" size={16} /> Nothing else to buy</p>}
          <div className="row gap">
            <button className="btn btn-primary grow" onClick={() => openDraft(s.draft)}>Review & save</button>
          </div>
        </div>
      ))}
    </div>
  );
}
