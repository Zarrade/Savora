import { EQUIPMENT } from '../lib/kitchen';
import { SIcon } from './SavoraIcons';

export function KitchenPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="equip-grid">
      {EQUIPMENT.map(e => {
        const on = value.includes(e.id);
        return (
          <button key={e.id} type="button" className={`equip-tile ${on ? 'on' : ''}`} aria-pressed={on}
            onClick={() => onChange(on ? value.filter(x => x !== e.id) : [...value, e.id])}>
            <span><SIcon name={e.icon} size={30} /></span>{e.label}
          </button>
        );
      })}
    </div>
  );
}
