import { useRef, useState } from 'react';
import { PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { NeedKey, aiToast, useAIReady, useOpenDraft } from '../components/AI';
import { useSettings } from '../hooks';
import { imageToDataUrl, photoToRecipe } from '../lib/ai/features';

export default function PhotoImport() {
  const aiReady = useAIReady();
  const settings = useSettings();
  const openDraft = useOpenDraft();
  const [img, setImg] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const pick = async (f?: File | null) => {
    if (!f) return;
    try { setImg(await imageToDataUrl(f)); } catch { aiToast(new Error('Couldn’t read that image.')); }
  };

  const go = async () => {
    if (!img) return;
    abort.current = new AbortController();
    setBusy(true);
    try {
      const d = await photoToRecipe(img, hint, settings, abort.current.signal);
      openDraft(d);
    } catch (e) { aiToast(e); } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <PageHeader title="Recipe from a photo" back />
      <p className="muted">Snap a cookbook page, a handwritten card, a screenshot — or just a dish — and Savora writes the recipe.</p>
      {!aiReady && <NeedKey what="Photo to recipe" />}

      {img ? (
        <div className="card-flat center">
          <img src={img} alt="Selected" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 14 }} />
          <button className="btn btn-ghost block" onClick={() => setImg(null)}>Choose a different photo</button>
        </div>
      ) : (
        <div className="menu">
          <button onClick={() => cam.current?.click()}><Icon name="camera" /> Take a photo</button>
          <button onClick={() => gal.current?.click()}><Icon name="upload" /> Choose from gallery</button>
        </div>
      )}
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />

      <input value={hint} onChange={e => setHint(e.target.value)} placeholder="Anything to add? e.g. “make it vegetarian”" />
      <button className="btn btn-primary block btn-lg" disabled={!img || busy || !aiReady} onClick={go}>
        <Icon name="sparkles" size={18} /> {busy ? 'Reading photo…' : 'Make recipe'}
      </button>
      {busy && <button className="btn btn-ghost block" onClick={() => abort.current?.abort()}>Cancel</button>}
      <p className="fineprint">The photo is sent to the AI only when you tap Make recipe. Double-check quantities before cooking.</p>
    </div>
  );
}
