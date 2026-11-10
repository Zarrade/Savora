import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

/* -------------------------------------------------------------- Header */

export function PageHeader({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button className="icon-btn" aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>
          <Icon name="back" />
        </button>
      )}
      <div className="page-header-title">
        <h1>{title}</h1>
        {sub && <div className="page-header-sub">{sub}</div>}
      </div>
      <div className="page-header-right">{right}</div>
    </header>
  );
}

/* --------------------------------------------------------------- Sheet */

export function Sheet({ open, onClose, title, children, footer, tall }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${tall ? 'sheet-tall' : ''}`} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && (
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------------------------------------- Chips */

export function Chip({ active, onClick, children, small }: { active?: boolean; onClick?: () => void; children: ReactNode; small?: boolean }) {
  return (
    <button type="button" className={`chip ${active ? 'chip-active' : ''} ${small ? 'chip-sm' : ''}`} onClick={onClick} aria-pressed={!!active}>
      {children}
    </button>
  );
}

export function ChipInput({ values, onChange, placeholder, suggestions = [] }: {
  values: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[];
}) {
  const [text, setText] = useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (t && !values.some(x => x.toLowerCase() === t.toLowerCase())) onChange([...values, t]);
    setText('');
  };
  const unused = suggestions.filter(s => !values.some(v => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className="chip-input">
      <div className="chip-row wrap">
        {values.map(v => (
          <span key={v} className="chip chip-active chip-removable">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter(x => x !== v))}><Icon name="close" size={14} /></button>
          </span>
        ))}
      </div>
      <div className="input-with-btn">
        <input
          value={text}
          placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } }}
        />
        <button type="button" className="btn btn-soft" onClick={() => add(text)} disabled={!text.trim()}>Add</button>
      </div>
      {unused.length > 0 && (
        <div className="chip-row wrap" style={{ marginTop: 8 }}>
          {unused.map(s => <Chip key={s} small onClick={() => add(s)}>+ {s}</Chip>)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Stepper */

export function Stepper({ value, onChange, min = 1, max = 99, step = 1, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string;
}) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} disabled={value <= min}><Icon name="minus" size={18} /></button>
      <span>{value}{label ? <small> {label}</small> : null}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} disabled={value >= max}><Icon name="plus" size={18} /></button>
    </div>
  );
}

/* -------------------------------------------------------------- Toggle */

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" className="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

/* ------------------------------------------------------------- Stars */

export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="stars" role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= Math.round(value) ? 'star-on' : 'star-off'}
          onClick={() => onChange?.(n)}
        >
          <Icon name="star" size={size} filled={n <= Math.round(value)} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- Toast */

let toastFn: ((msg: string) => void) | null = null;
export function toast(msg: string) { toastFn?.(msg); }

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  useEffect(() => {
    toastFn = (m: string) => {
      setMsg(m);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMsg(null), 2600);
    };
    return () => { toastFn = null; };
  }, []);
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}

/* ------------------------------------------------------------ Confirm */

export function useConfirm() {
  const [state, setState] = useState<{ msg: string; ok: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (msg: string, ok = 'Confirm') => new Promise<boolean>(resolve => setState({ msg, ok, resolve }));
  const node = state ? (
    <Sheet open onClose={() => { state.resolve(false); setState(null); }} title="Are you sure?">
      <p className="muted">{state.msg}</p>
      <div className="row gap" style={{ marginTop: 16 }}>
        <button className="btn btn-ghost grow" onClick={() => { state.resolve(false); setState(null); }}>Cancel</button>
        <button className="btn btn-danger grow" onClick={() => { state.resolve(true); setState(null); }}>{state.ok}</button>
      </div>
    </Sheet>
  ) : null;
  return { confirm, confirmNode: node };
}

/* --------------------------------------------------------- Empty state */

export function Empty({ icon = 'leaf', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <h3>{title}</h3>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------- Dictation */

type SpeechRec = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void;
  onend: () => void; onerror: () => void; start: () => void; stop: () => void;
};

export function speechSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Microphone button that appends dictated text via the browser's speech recognition. */
export function DictateButton({ onText }: { onText: (t: string) => void }) {
  const [on, setOn] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  if (!speechSupported()) return null;
  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const w = window as unknown as Record<string, new () => SpeechRec>;
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    const r = new R();
    r.lang = navigator.language || 'en-US';
    r.interimResults = false;
    r.continuous = true;
    r.onresult = e => {
      const last = e.results[e.results.length - 1];
      if (last?.[0]?.transcript) onText(last[0].transcript.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = () => { setOn(false); toast('Dictation needs microphone permission (and may need internet).'); };
    rec.current = r;
    r.start();
    setOn(true);
  };
  return (
    <button type="button" className={`icon-btn ${on ? 'rec-on' : ''}`} onClick={toggle} aria-label={on ? 'Stop dictation' : 'Dictate'} title="Dictate">
      <Icon name="mic" size={20} />
    </button>
  );
}
