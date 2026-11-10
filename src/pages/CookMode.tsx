import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { updateRecipe, useSettings } from '../hooks';
import { airFryerTip, usingInstead } from '../lib/kitchen';
import { foodIcon } from '../lib/foodIcons';
import { SIcon } from '../components/SavoraIcons';
import { Icon } from '../components/Icon';
import { Sheet, Stars, toast } from '../components/ui';
import { findTimers } from '../lib/importText';
import { fmtIngredient } from '../lib/ingredients';
import { cleanName } from '../lib/grocery';
import type { Recipe } from '../types';
import { NeedKey, aiToast, useAIReady } from '../components/AI';
import { cookAssistant, type CookTurn } from '../lib/ai/features';

interface Timer { id: number; label: string; total: number; endsAt: number; pausedLeft: number | null; done: boolean }

function fmtClock(sec: number) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach(t => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.32);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* no audio */ }
}

function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?playsinline=1` : null;
}

export default function CookMode() {
  const { id } = useParams();
  const recipe = useLiveQuery(() => db.recipes.get(id!), [id]);
  if (!recipe) return <div className="cook" />;
  return <Cook recipe={recipe} />;
}

function Cook({ recipe }: { recipe: Recipe }) {
  const nav = useNavigate();
  const settings = useSettings();
  const [params] = useSearchParams();
  const useAirFryer = usingInstead(recipe, settings.equipment).some(s => s.use === 'airfryer') || (settings.equipment.includes('airfryer') && !settings.equipment.includes('oven'));
  const servings = Number(params.get('servings')) || recipe.servings;
  const scale = servings / Math.max(1, recipe.servings);
  const steps = recipe.steps.length ? recipe.steps : ['No steps written for this recipe yet.'];
  const total = steps.length;
  const [idx, setIdx] = useState(-1); // -1 = mise en place (ingredients) screen
  const [timers, setTimers] = useState<Timer[]>([]);
  const [, force] = useState(0);
  const [ingOpen, setIngOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [gathered, setGathered] = useState<Set<string>>(new Set());
  const aiReady = useAIReady();
  const [askOpen, setAskOpen] = useState(false);
  const [turns, setTurns] = useState<CookTurn[]>([]);
  const [question, setQuestion] = useState('');
  const [thinking, setThinking] = useState(false);
  const askAbort = useRef<AbortController | null>(null);
  const ask = async (q: string) => {
    q = q.trim();
    if (!q || thinking) return;
    const history: CookTurn[] = [...turns, { role: 'user', content: q }];
    setTurns([...history, { role: 'assistant', content: '' }]);
    setQuestion(''); setThinking(true);
    askAbort.current = new AbortController();
    try {
      await cookAssistant(recipe, idx, history, settings, full => setTurns(t => [...t.slice(0, -1), { role: 'assistant', content: full }]), askAbort.current.signal);
    } catch (e) { aiToast(e); setTurns(t => (t[t.length - 1]?.content ? t : t.slice(0, -2))); }
    finally { setThinking(false); }
  };
  const touch = useRef<{ x: number; y: number } | null>(null);
  const embed = youtubeEmbed(recipe.videoUrl);

  // Keep the screen awake while cooking
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const req = async () => {
      try { lock = await (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen'); } catch { /* unsupported */ }
    };
    req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => undefined); };
  }, []);

  // Tick timers
  useEffect(() => {
    if (!timers.some(t => !t.done && t.pausedLeft === null)) return;
    const h = window.setInterval(() => {
      const now = Date.now();
      setTimers(ts => ts.map(t => {
        if (!t.done && t.pausedLeft === null && now >= t.endsAt) {
          beep();
          navigator.vibrate?.([300, 150, 300, 150, 300]);
          toast(`Timer done: ${t.label}`);
          return { ...t, done: true };
        }
        return t;
      }));
      force(x => x + 1);
    }, 500);
    return () => window.clearInterval(h);
  }, [timers]);

  const startTimer = (label: string, seconds: number) => {
    setTimers(ts => [...ts, { id: Date.now(), label, total: seconds, endsAt: Date.now() + seconds * 1000, pausedLeft: null, done: false }]);
  };
  const togglePause = (t: Timer) => setTimers(ts => ts.map(x => x.id !== t.id ? x : x.pausedLeft === null
    ? { ...x, pausedLeft: (x.endsAt - Date.now()) / 1000 }
    : { ...x, endsAt: Date.now() + x.pausedLeft * 1000, pausedLeft: null }));
  const removeTimer = (t: Timer) => setTimers(ts => ts.filter(x => x.id !== t.id));

  const go = (d: number) => {
    const n = idx + d;
    if (n < -1) return;
    if (n >= total) { setDone(true); return; }
    setIdx(n);
  };

  // Ingredients mentioned in the current step
  const stepIngredients = useMemo(() => {
    if (idx < 0) return [];
    const s = steps[idx].toLowerCase();
    return recipe.ingredients.filter(i => {
      const words = cleanName(i.name).split(' ').filter(w => w.length > 3);
      return words.some(w => s.includes(w.replace(/(es|s)$/, '')));
    });
  }, [idx, steps, recipe.ingredients]);

  const finish = async () => {
    await updateRecipe(recipe.id, {
      cookedCount: recipe.cookedCount + 1,
      lastCooked: new Date().toISOString(),
      reviews: rating ? [{ date: new Date().toISOString(), rating, text: review.trim() || undefined }, ...recipe.reviews] : recipe.reviews
    });
    toast('Nice work! Logged as cooked.');
    nav(`/recipe/${recipe.id}`, { replace: true });
  };

  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  const progress = done ? 100 : ((idx + 1) / total) * 100;

  return (
    <div className="cook" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="cook-top">
        <button className="icon-btn" aria-label="Exit cook mode" onClick={() => nav(-1)}><Icon name="close" /></button>
        <div className="cook-title">
          <div className="truncate">{recipe.title}</div>
          <small>{done ? 'Finished' : idx < 0 ? 'Get ready' : `Step ${idx + 1} of ${total}`}</small>
        </div>
        <div className="row gap-xs">
          {recipe.videoUrl && <button className="icon-btn" aria-label="Video" onClick={() => (embed ? setVideoOpen(v => !v) : window.open(recipe.videoUrl, '_blank'))}><Icon name="video" /></button>}
          <button className="icon-btn" aria-label="Ask the cooking assistant" onClick={() => setAskOpen(true)}><Icon name="sparkles" /></button>
          <button className="icon-btn" aria-label="Ingredients" onClick={() => setIngOpen(true)}><Icon name="list" /></button>
        </div>
      </div>
      <div className="cook-progress" aria-label={`Progress ${Math.round(progress)}%`}>
        {Array.from({ length: total + 1 }, (_, i) => <span key={i} className={done || i <= idx + 1 ? 'on' : ''} />)}
      </div>

      {timers.length > 0 && (
        <div className="timers">
          {timers.map(t => {
            const left = t.pausedLeft ?? (t.endsAt - Date.now()) / 1000;
            return (
              <div key={t.id} className={`timer-pill ${t.done ? 'timer-done' : ''} ${t.pausedLeft !== null ? 'timer-paused' : ''}`}>
                <button onClick={() => (t.done ? removeTimer(t) : togglePause(t))} aria-label={t.done ? 'Dismiss timer' : 'Pause or resume timer'}>
                  <Icon name={t.done ? 'check' : t.pausedLeft !== null ? 'play' : 'timer'} size={16} />
                  <b>{t.done ? 'Done!' : fmtClock(left)}</b>
                  <small>{t.label}</small>
                </button>
                <button className="timer-x" aria-label="Remove timer" onClick={() => removeTimer(t)}><Icon name="close" size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {videoOpen && embed && (
        <div className="pip">
          <iframe src={embed} title="Recipe video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          <button className="icon-btn glass sm" aria-label="Close video" onClick={() => setVideoOpen(false)}><Icon name="close" size={16} /></button>
        </div>
      )}

      <div className="cook-body">
        {done ? (
          <div className="cook-done">
            <div className="cook-done-emoji"><SIcon name="party" size={64} /></div>
            <h2>Done? Enjoy!</h2>
            <p className="muted">How did it turn out?</p>
            <Stars value={rating} onChange={setRating} size={38} />
            <textarea rows={3} placeholder="Notes for next time (optional)" value={review} onChange={e => setReview(e.target.value)} />
            <button className="btn btn-primary block btn-lg" onClick={finish}>{rating ? 'Save & finish' : 'Mark as cooked'}</button>
            <button className="btn btn-ghost block" onClick={() => setDone(false)}>Back to steps</button>
          </div>
        ) : idx < 0 ? (
          <div className="cook-step">
            <div className="cook-kicker">Gather your ingredients · {servings} serving{servings === 1 ? '' : 's'}</div>
            <ul className="ing-list big">
              {recipe.ingredients.map(i => (
                <li key={i.id} className={gathered.has(i.id) ? 'done' : ''} onClick={() => setGathered(s => { const n = new Set(s); n.has(i.id) ? n.delete(i.id) : n.add(i.id); return n; })}>
                  <span className="ing-emoji"><SIcon name={foodIcon(i.name)} size={22} /></span>
                  <span className="ing-text">{fmtIngredient(i, scale)}{i.note && <small className="muted">, {i.note}</small>}</span>
                  <span className={`tick ${gathered.has(i.id) ? 'on' : ''}`}><Icon name="check" size={14} /></span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="cook-step" key={idx}>
            <div className="cook-kicker">Step {idx + 1}</div>
            <p className="cook-text">{steps[idx]}</p>
            {useAirFryer && airFryerTip(steps[idx]) && <div className="af-tip"><SIcon name="airfryer" size={18} /> {airFryerTip(steps[idx])}</div>}
            {findTimers(steps[idx]).map((t, i) => (
              <button key={i} className="btn btn-soft timer-btn" onClick={() => startTimer(`Step ${idx + 1} · ${t.label}`, t.seconds)}>
                <Icon name="timer" size={18} /> Start {t.label} timer
              </button>
            ))}
            {stepIngredients.length > 0 && (
              <div className="step-ings">
                <div className="section-label">In this step</div>
                <div className="chip-row wrap">{stepIngredients.map(i => <span key={i.id} className="tag">{fmtIngredient(i, scale)}</span>)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {!done && (
        <div className="cook-nav">
          <button className="btn btn-ghost btn-lg" onClick={() => go(-1)} disabled={idx < 0}><Icon name="chevronLeft" /> Back</button>
          <button className="btn btn-primary btn-lg grow" onClick={() => go(1)}>
            {idx < 0 ? 'Start cooking' : idx === total - 1 ? 'Finish' : 'Next'} <Icon name="chevronRight" />
          </button>
        </div>
      )}

      <Sheet open={askOpen} onClose={() => { askAbort.current?.abort(); setAskOpen(false); }} title="Ask the cook" tall
        footer={aiReady ? (
          <form className="row gap" onSubmit={e => { e.preventDefault(); ask(question); }}>
            <input className="grow" value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. no buttermilk — what instead?" />
            <button className="btn btn-primary" disabled={thinking || !question.trim()}>Ask</button>
          </form>
        ) : undefined}>
        {!aiReady ? <NeedKey what="The cooking assistant" /> : (
          <>
            {turns.length === 0 && (
              <div className="chip-row wrap">
                {['What can I swap for…?', 'How do I know it’s done?', 'Can I make this ahead?', 'It’s too salty — help'].map(q => (
                  <button key={q} className="chip chip-sm" onClick={() => (q.endsWith('…?') ? setQuestion(q.replace('…?', ' ')) : ask(q))}>{q}</button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`ai-turn ai-${t.role}`}>{t.content || '…'}</div>
            ))}
          </>
        )}
      </Sheet>

      <Sheet open={ingOpen} onClose={() => setIngOpen(false)} title={`Ingredients · ${servings} servings`}>
        <ul className="ing-list">
          {recipe.ingredients.map(i => <li key={i.id}><span className="ing-emoji"><SIcon name={foodIcon(i.name)} size={22} /></span><span className="ing-text">{fmtIngredient(i, scale)}{i.note && <small className="muted">, {i.note}</small>}</span></li>)}
        </ul>
      </Sheet>
    </div>
  );
}
