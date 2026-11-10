import { useEffect, useMemo, useState } from 'react';
import { useAIConfig, aiToast } from '../components/AI';
import { saveAIConfig, DEFAULT_MODEL, DEFAULT_VISION_MODEL } from '../lib/ai/config';
import { checkKey, listModels, type ModelInfo } from '../lib/ai/client';
import { startOpenRouterLogin } from '../lib/ai/oauth';
import { customFoodCount } from '../lib/ingredients';
import { Icon } from '../components/Icon';
import { toast } from '../components/ui';

const SUGGESTED = ['openai/gpt-4o-mini', 'google/gemini-2.5-flash', 'anthropic/claude-sonnet-4.5', 'meta-llama/llama-3.3-70b-instruct'];

export function AISettings() {
  const cfg = useAIConfig();
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!cfg.key || models || !navigator.onLine) return;
    listModels().then(setModels).catch(() => undefined);
  }, [cfg.key, models]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (models ?? []).filter(m => !t || m.id.toLowerCase().includes(t) || m.name.toLowerCase().includes(t)).slice(0, 60);
  }, [models, q]);
  const visionList = useMemo(() => (models ?? []).filter(m => m.vision), [models]);

  const test = async (key = cfg.key) => {
    setBusy(true);
    try {
      const r = await checkKey(key);
      setStatus(r.remaining != null ? `Key works · $${r.remaining.toFixed(2)} credit left` : 'Key works');
      return true;
    } catch (e) { aiToast(e); setStatus(''); return false; } finally { setBusy(false); }
  };

  const savePasted = async () => {
    const k = pasted.trim();
    if (!/^sk-or-/.test(k)) { toast('OpenRouter keys start with sk-or-'); return; }
    if (await test(k)) { saveAIConfig({ key: k }); setPasted(''); toast('Connected'); }
  };

  return (
    <section className="card" id="ai">
      <h2>AI assistant <span className="tag">optional</span></h2>
      <p className="muted small" style={{ marginTop: -4 }}>
        Powers smart import, “What can I make?”, the cooking helper, photo-to-recipe and smarter swaps through <b>OpenRouter</b>.
        Your key stays on this phone (never in backups). Text or photos you send for an AI action go to OpenRouter and the model you pick — nothing is sent otherwise.
      </p>

      {!cfg.key ? (
        <>
          <button className="btn btn-primary block btn-lg" onClick={() => startOpenRouterLogin()}><Icon name="sparkles" size={18} /> Connect OpenRouter</button>
          <div className="section-label">Or paste a key</div>
          <div className="row gap">
            <input className="grow" type="password" autoComplete="off" placeholder="sk-or-v1-…" value={pasted} onChange={e => setPasted(e.target.value)} />
            <button className="btn btn-soft" disabled={!pasted || busy} onClick={savePasted}>Save</button>
          </div>
          <small className="faint">Create one at openrouter.ai/keys. Tip: set a spend limit on the key.</small>
        </>
      ) : (
        <>
          <div className="row between field-row">
            <span style={{ fontWeight: 650 }}>Connected <small className="muted">· …{cfg.key.slice(-4)}</small></span>
            <span className="row gap-sm">
              <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => test()}>Test</button>
              <button className="btn btn-soft btn-sm" onClick={() => { saveAIConfig({ key: '' }); setStatus(''); toast('Disconnected'); }}>Disconnect</button>
            </span>
          </div>
          {status && <small className="muted">{status}</small>}

          <div className="section-label">Model</div>
          <input value={cfg.model} onChange={e => saveAIConfig({ model: e.target.value.trim() })} placeholder={DEFAULT_MODEL} list="ai-models" autoCapitalize="off" spellCheck={false} />
          <datalist id="ai-models">{[...SUGGESTED, ...(models ?? []).map(m => m.id)].map(id => <option key={id} value={id} />)}</datalist>
          <input style={{ marginTop: 8 }} value={q} onChange={e => setQ(e.target.value)} placeholder={models ? `Search ${models.length} models…` : 'Search models (needs internet)…'} />
          {q && (
            <div className="menu" style={{ maxHeight: 220, overflow: 'auto', marginTop: 6 }}>
              {shown.map(m => (
                <button key={m.id} onClick={() => { saveAIConfig({ model: m.id }); setQ(''); }}>
                  <span className="grow">{m.name}<small>{m.id}{m.vision ? ' · vision' : ''}{m.promptPrice ? ` · $${m.promptPrice.toFixed(2)}/M in` : ' · free'}</small></span>
                </button>
              ))}
              {shown.length === 0 && <div className="muted" style={{ padding: 14 }}>No match</div>}
            </div>
          )}
          <div className="chip-row wrap" style={{ marginTop: 8 }}>
            {SUGGESTED.map(id => <button key={id} className={`chip ${cfg.model === id ? 'chip-active' : ''}`} onClick={() => saveAIConfig({ model: id })}>{id.split('/')[1]}</button>)}
          </div>

          <div className="section-label">Photo model <small className="muted">(must support images)</small></div>
          <select value={cfg.visionModel} onChange={e => saveAIConfig({ visionModel: e.target.value })}>
            {[...new Set([cfg.visionModel, DEFAULT_VISION_MODEL, ...visionList.slice(0, 80).map(m => m.id)])].map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          {customFoodCount() > 0 && <small className="faint" style={{ display: 'block', marginTop: 10 }}>{customFoodCount()} foods added to your nutrition database by AI.</small>}
        </>
      )}
    </section>
  );
}
