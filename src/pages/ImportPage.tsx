import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, toast } from '../components/ui';
import { Icon } from '../components/Icon';
import { parseRecipeText, type ImportedRecipe } from '../lib/importText';
import { fmtIngredient } from '../lib/ingredients';
import { IMPORT_KEY } from './RecipeEditor';
import { NeedKey, aiErrorMessage, useAIConfig } from '../components/AI';
import { useSettings } from '../hooks';
import { fetchPageText, importRecipeAI } from '../lib/ai/features';

const VIDEO_HOSTS = /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|vimeo\.com)/i;

export default function ImportPage() {
  const nav = useNavigate();
  const cfg = useAIConfig();
  const settings = useSettings();
  const [aiBusy, setAiBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const parsed: ImportedRecipe | null = useMemo(() => (text.trim() ? parseRecipeText(text) : null), [text]);

  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t); else toast('Clipboard is empty');
    } catch { toast('Allow clipboard access, or long-press the box and tap Paste'); }
  };

  const proceed = () => {
    if (!parsed) return;
    const draft = { ...parsed };
    if (draft.sourceUrl && VIDEO_HOSTS.test(draft.sourceUrl)) draft.videoUrl = draft.sourceUrl;
    sessionStorage.setItem(IMPORT_KEY, JSON.stringify(draft));
    nav('/new', { replace: true });
  };

  const smart = async () => {
    const u = url.trim();
    if (!text.trim() && !u) return;
    setAiBusy(true);
    try {
      let src = text.trim();
      let sourceUrl: string | undefined;
      if (!src && u) {
        sourceUrl = /^https?:\/\//i.test(u) ? u : `https://${u}`;
        try { src = await fetchPageText(sourceUrl); }
        catch { toast('That site blocks apps from reading it — open it, copy the recipe text and paste it below.'); return; }
      } else if (/^https?:\/\//i.test(u)) sourceUrl = u;
      const d = await importRecipeAI(src, settings);
      const draft = { ...d, sourceUrl, videoUrl: sourceUrl && VIDEO_HOSTS.test(sourceUrl) ? sourceUrl : undefined };
      sessionStorage.setItem(IMPORT_KEY, JSON.stringify(draft));
      nav('/new', { replace: true });
    } catch (e) {
      toast(`${aiErrorMessage(e)} The offline importer below still works.`);
    } finally { setAiBusy(false); }
  };

  return (
    <div className="page">
      <PageHeader title="Paste a recipe" back />
      <p className="muted">Copy a recipe from a website, a video caption, a note or a message and paste it here. Savora sorts it into ingredients and steps — offline by default, or with AI for messy text.</p>
      {!cfg.key && <NeedKey what="Smart import" />}
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Recipe link (optional, AI)" inputMode="url" autoCapitalize="off" />

      <div className="textarea-wrap">
        <textarea rows={10} value={text} onChange={e => setText(e.target.value)}
          placeholder={'Chicken Shawarma Bowl\nServes 4\n\nIngredients\n500 g chicken thighs\n2 tbsp shawarma spice\n…\n\nMethod\n1. Marinate the chicken…'} />
      </div>
      <div className="row gap">
        <button className="btn btn-ghost grow" onClick={paste}><Icon name="copy" size={18} /> Paste</button>
        {text && <button className="btn btn-ghost grow" onClick={() => setText('')}>Clear</button>}
      </div>

      {parsed && (
        <div className="card import-preview">
          <h3>{parsed.title}</h3>
          <p className="muted small">
            {parsed.servings ? `Serves ${parsed.servings} · ` : ''}{parsed.ingredients.length} ingredients · {parsed.steps.length} steps
          </p>
          {parsed.ingredients.length > 0 && (
            <>
              <div className="section-label">Ingredients</div>
              <ul className="plain-list">{parsed.ingredients.slice(0, 12).map(i => <li key={i.id}>{fmtIngredient(i)}{i.note ? <span className="muted">, {i.note}</span> : null}</li>)}</ul>
              {parsed.ingredients.length > 12 && <small className="muted">+ {parsed.ingredients.length - 12} more</small>}
            </>
          )}
          {parsed.steps.length > 0 && (
            <>
              <div className="section-label">Steps</div>
              <ol className="plain-list">{parsed.steps.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}</ol>
              {parsed.steps.length > 4 && <small className="muted">+ {parsed.steps.length - 4} more</small>}
            </>
          )}
        </div>
      )}

      <button className="btn btn-primary block btn-lg" disabled={(!text.trim() && !url.trim()) || !cfg.key || aiBusy} onClick={smart}>
        <Icon name="sparkles" size={18} /> {aiBusy ? 'Reading recipe…' : 'Smart import with AI'}
      </button>
      <button className="btn btn-soft block" disabled={!parsed} onClick={proceed}>
        Offline import <Icon name="arrowRight" size={18} />
      </button>
    </div>
  );
}
