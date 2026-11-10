import { useEffect, useState } from 'react';
import { Sheet } from './ui';
import { Icon } from './Icon';
import { searchPhotos, wikiLeadImages, type PhotoHit } from '../lib/photos';

/** Search Wikimedia Commons / Wikipedia for a real photo of a dish. */
export function PhotoSearch({ open, onClose, initial, onPick }: { open: boolean; onClose: () => void; initial: string; onPick: (h: PhotoHit) => void }) {
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<PhotoHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (query: string) => {
    if (!query.trim()) return;
    if (!navigator.onLine) { setError('You’re offline — connect to search for photos.'); return; }
    setLoading(true); setError(null);
    try {
      const [lead, found] = await Promise.all([
        wikiLeadImages([query.trim()]).catch(() => new Map<string, PhotoHit>()),
        searchPhotos(`${query.trim()} food`, 21)
      ]);
      const first = lead.get(query.trim());
      const all = first ? [first, ...found.filter(h => h.url !== first.url)] : found;
      setHits(all);
    } catch {
      setError('Couldn’t reach Wikimedia. Check your connection and try again.');
    }
    setLoading(false);
  };

  useEffect(() => { if (open) { setQ(initial); setHits(null); run(initial); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={open} onClose={onClose} title="Find a photo" tall>
      <form className="search-box" onSubmit={e => { e.preventDefault(); run(q); }}>
        <Icon name="search" size={18} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. shakshuka" />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </form>
      <p className="fineprint">Free-licence photos from Wikimedia Commons. The credit is shown on the recipe.</p>
      {loading && <p className="muted center pad">Searching…</p>}
      {error && <div className="alert alert-warn"><Icon name="alert" size={18} /> {error}</div>}
      {hits && !loading && (
        hits.length ? (
          <div className="photo-grid">
            {hits.map(h => (
              <button key={h.url} onClick={() => onPick(h)} title={h.label}>
                <img src={h.url} alt="" loading="lazy" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        ) : <p className="muted center pad">No photos found — try a simpler name, like “lentil soup”.</p>
      )}
    </Sheet>
  );
}
