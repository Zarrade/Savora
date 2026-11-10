import { useMemo, useState } from 'react';
import type { Recipe } from '../types';
import { groupCuisines, regionOf } from '../lib/cuisines';

/**
 * Cuisines organised by world region: a row of region tabs, then the cuisines of
 * the chosen region (biggest first, with recipe counts).
 * `tiles` = roomy cards for browsing (Home); otherwise compact chips (filters).
 */
export function CuisinePicker({ recipes, selected = [], onPick, tiles, any }: {
  recipes: Recipe[];
  selected?: string[];
  onPick: (cuisine: string) => void;
  tiles?: boolean;
  /** show an "Any" choice (single-select pickers); called with '' */
  any?: boolean;
}) {
  const groups = useMemo(() => groupCuisines(recipes), [recipes]);
  const [region, setRegion] = useState<string | null>(null);
  const current = groups.find(g => g.id === (region ?? (selected[0] ? regionOf(selected[0]) : groups[0]?.id))) ?? groups[0];
  if (!current) return null;
  const picked = (id: string) => groups.find(g => g.id === id)?.cuisines.filter(c => selected.includes(c.name)).length ?? 0;

  return (
    <div className="cuisine-picker">
      <div className="region-tabs" role="tablist">
        {groups.map(g => (
          <button key={g.id} type="button" role="tab" aria-selected={g.id === current.id}
            className={`region-tab ${g.id === current.id ? 'on' : ''}`} onClick={() => setRegion(g.id)}>
            {g.label}
            <span className="region-count">{picked(g.id) ? `${picked(g.id)} ✓` : g.count}</span>
          </button>
        ))}
      </div>
      {tiles ? (
        <div className="cuisine-tiles">
          {current.cuisines.map(c => (
            <button key={c.name} type="button" className="cuisine-tile" onClick={() => onPick(c.name)}>
              <span className="cuisine-name">{c.name}</span>
              <span className="cuisine-count">{c.count} recipe{c.count === 1 ? '' : 's'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="chip-row wrap">
          {any && <button type="button" className={`chip chip-sm ${selected.length ? '' : 'chip-active'}`} aria-pressed={!selected.length} onClick={() => onPick('')}>Any</button>}
          {current.cuisines.map(c => {
            const on = selected.includes(c.name);
            return (
              <button key={c.name} type="button" className={`chip chip-sm ${on ? 'chip-active' : ''}`} aria-pressed={on} onClick={() => onPick(c.name)}>
                {c.name}<span className="chip-count">{c.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
