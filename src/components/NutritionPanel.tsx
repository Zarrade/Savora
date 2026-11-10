import type { Nutrition, Settings } from '../types';
import { RI } from '../data/nutritionDb';
import { addCustomFoods, trafficLight, type NutritionResult } from '../lib/ingredients';
import { useState } from 'react';
import { aiToast, useAIConfig } from './AI';
import { estimateNutrition } from '../lib/ai/features';
import { toast } from './ui';

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

export function MacroSplitBar({ n }: { n: Pick<Nutrition, 'protein' | 'carbs' | 'fat'> }) {
  const p = n.protein * 4, c = n.carbs * 4, f = n.fat * 9;
  const tot = p + c + f || 1;
  const pct = (x: number) => Math.round((x / tot) * 100);
  return (
    <div className="macro-split">
      <div className="macro-split-bar" role="img" aria-label={`Protein ${pct(p)}%, carbs ${pct(c)}%, fat ${pct(f)}% of calories`}>
        <span className="seg seg-p" style={{ width: `${(p / tot) * 100}%` }} />
        <span className="seg seg-c" style={{ width: `${(c / tot) * 100}%` }} />
        <span className="seg seg-f" style={{ width: `${(f / tot) * 100}%` }} />
      </div>
      <div className="macro-split-legend">
        <span><i className="dot dot-p" /> Protein {pct(p)}%</span>
        <span><i className="dot dot-c" /> Carbs {pct(c)}%</span>
        <span><i className="dot dot-f" /> Fat {pct(f)}%</span>
      </div>
    </div>
  );
}

function Ring({ value, max, label, sub, cls }: { value: number; max: number; label: string; sub: string; cls: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const C = 2 * Math.PI * 26;
  return (
    <div className={`macro-card ${cls}`}>
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" className="ring-bg" />
        <circle cx="32" cy="32" r="26" className="ring-fg" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 32 32)" />
        <text x="32" y="36" textAnchor="middle" className="ring-text">{max > 0 ? Math.round((value / max) * 100) : 0}%</text>
      </svg>
      <div className="macro-card-label">{label}</div>
      <div className="macro-card-sub">{sub}</div>
    </div>
  );
}

export function MacroCards({ n, settings }: { n: Nutrition; settings: Settings }) {
  return (
    <div className="macro-cards" aria-label="Share of your daily targets">
      <Ring cls="mc-k" value={n.kcal} max={settings.kcal} label={`${r0(n.kcal)} kcal`} sub={`of ${settings.kcal}`} />
      <Ring cls="mc-p" value={n.protein} max={settings.protein} label={`${r0(n.protein)} g protein`} sub={`of ${settings.protein} g`} />
      <Ring cls="mc-c" value={n.carbs} max={settings.carbs} label={`${r0(n.carbs)} g carbs`} sub={`of ${settings.carbs} g`} />
      <Ring cls="mc-f" value={n.fat} max={settings.fat} label={`${r0(n.fat)} g fat`} sub={`of ${settings.fat} g`} />
      <Ring cls="mc-fi" value={n.fibre} max={RI.fibre} label={`${r1(n.fibre)} g fibre`} sub={`of ${RI.fibre} g`} />
    </div>
  );
}

const TL_LABEL = { low: 'Low', medium: 'Med', high: 'High' };

export function TrafficLights({ perServing, per100 }: { perServing: Nutrition; per100: Nutrition }) {
  const items: { key: 'fat' | 'satFat' | 'sugar' | 'salt'; label: string; unit: string; ri: number }[] = [
    { key: 'fat', label: 'Fat', unit: 'g', ri: RI.fat },
    { key: 'satFat', label: 'Saturates', unit: 'g', ri: RI.satFat },
    { key: 'sugar', label: 'Sugars', unit: 'g', ri: RI.sugar },
    { key: 'salt', label: 'Salt', unit: 'g', ri: RI.salt }
  ];
  return (
    <div className="traffic">
      <div className="traffic-cell traffic-energy">
        <div className="traffic-label">Energy</div>
        <div className="traffic-val">{r0(perServing.kcal)}<small> kcal</small></div>
        <div className="traffic-ri">{r0((perServing.kcal / RI.kcal) * 100)}%</div>
      </div>
      {items.map(it => {
        const level = trafficLight(it.key, per100[it.key]);
        return (
          <div key={it.key} className={`traffic-cell tl-${level}`}>
            <div className="traffic-label">{it.label}</div>
            <div className="traffic-val">{r1(perServing[it.key])}<small>{it.unit}</small></div>
            <div className="traffic-level">{TL_LABEL[level]}</div>
            <div className="traffic-ri">{r0((perServing[it.key] / it.ri) * 100)}%</div>
          </div>
        );
      })}
    </div>
  );
}

export function NutritionPanel({ result, settings, servingsLabel }: { result: NutritionResult; settings: Settings; servingsLabel: string }) {
  const n = result.perServing;
  const micros: { label: string; v: number; unit: string; ri: number }[] = [
    { label: 'Fibre', v: n.fibre, unit: 'g', ri: RI.fibre },
    { label: 'Calcium', v: n.calcium, unit: 'mg', ri: RI.calcium },
    { label: 'Iron', v: n.iron, unit: 'mg', ri: RI.iron },
    { label: 'Magnesium', v: n.magnesium, unit: 'mg', ri: RI.magnesium },
    { label: 'Potassium', v: n.potassium, unit: 'mg', ri: RI.potassium },
    { label: 'Vitamin A', v: n.vitA, unit: 'µg', ri: RI.vitA },
    { label: 'Vitamin C', v: n.vitC, unit: 'mg', ri: RI.vitC }
  ];
  return (
    <div className="nutrition">
      <div className="section-label">Per serving · {servingsLabel}</div>
      <div className="nutri-hero">
        <div><span className="nutri-big">{r0(n.kcal)}</span> kcal</div>
        <div className="nutri-macros">
          <span><b>{r0(n.protein)}g</b> protein</span>
          <span><b>{r0(n.carbs)}g</b> carbs</span>
          <span><b>{r0(n.fat)}g</b> fat</span>
        </div>
      </div>
      <MacroSplitBar n={n} />

      <div className="section-label">Your daily targets</div>
      <MacroCards n={n} settings={settings} />

      <div className="section-label">Traffic lights <span className="muted">· % of adult reference intake</span></div>
      <TrafficLights perServing={n} per100={result.per100g} />

      <div className="section-label">Micronutrients</div>
      <table className="micro-table">
        <tbody>
          {micros.map(m => {
            const pct = (m.v / m.ri) * 100;
            return (
              <tr key={m.label}>
                <td>{m.label}</td>
                <td className="num">{m.unit === 'g' ? r1(m.v) : r0(m.v)} {m.unit}</td>
                <td className="micro-bar-cell">
                  <div className="micro-bar"><span style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </td>
                <td className="num muted">{r0(pct)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="fineprint">
        Estimated offline from {result.matched} ingredient{result.matched === 1 ? '' : 's'} using a built-in database.
        {result.unmatched.length > 0 && <> Not counted: {result.unmatched.join(', ')}.</>}
      </p>
      {result.unmatched.length > 0 && <EstimateMissing names={result.unmatched} />}
    </div>
  );
}

function EstimateMissing({ names }: { names: string[] }) {
  const cfg = useAIConfig();
  const [busy, setBusy] = useState(false);
  if (!cfg.key) return null;
  const run = async () => {
    setBusy(true);
    try {
      const found = await estimateNutrition(names);
      addCustomFoods(found);
      toast(`Added ${Object.keys(found).length} food${Object.keys(found).length === 1 ? '' : 's'} to your nutrition database`);
    } catch (e) { aiToast(e); } finally { setBusy(false); }
  };
  return <button className="btn btn-soft btn-sm" disabled={busy} onClick={run}>{busy ? 'Estimating…' : '✨ Estimate missing with AI'}</button>;
}
