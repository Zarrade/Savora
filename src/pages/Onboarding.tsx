import { useState } from 'react';
import { saveSettings, useSettings } from '../hooks';
import { Chip, ChipInput, Stepper } from '../components/ui';
import { DIETS, type Diet } from '../types';
import { capitalize } from '../lib/util';
import { KitchenPicker } from '../components/KitchenPicker';
import { fmtMoney } from '../lib/pricing';

export const ALLERGY_OPTIONS = ['gluten', 'dairy', 'egg', 'nuts', 'peanuts', 'shellfish', 'fish', 'soy', 'sesame'];
const STEPS = 5;

export default function Onboarding() {
  const s = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.name);
  const [servings, setServings] = useState(s.householdServings);
  const [allergies, setAllergies] = useState<string[]>(s.allergies);
  const [avoid, setAvoid] = useState<string[]>(s.avoid);
  const [diets, setDiets] = useState<Diet[]>(s.diets);
  const [equipment, setEquipment] = useState<string[]>(s.equipment);
  const [budget, setBudget] = useState(s.weeklyBudget ? String(s.weeklyBudget) : '');

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const finish = () => saveSettings({
    name: name.trim(), householdServings: servings, allergies, avoid, diets, equipment,
    weeklyBudget: Number(budget.replace(/[^\d.]/g, '')) || 0, onboarded: true, featureTipSeen: true
  });
  const nav = (
    <div className="row gap" style={{ marginTop: 8 }}>
      {step > 0 && <button className="btn btn-soft grow" onClick={() => setStep(step - 1)}>Back</button>}
      {step < STEPS - 1
        ? <button className="btn btn-primary grow btn-lg" onClick={() => setStep(step + 1)}>Continue</button>
        : <button className="btn btn-primary grow btn-lg" onClick={finish}>Start cooking</button>}
    </div>
  );

  return (
    <div className="onboarding">
      <div className="onb-logo" aria-hidden="true">🍲</div>
      {step === 0 && (
        <>
          <h1>Welcome to Savora</h1>
          <p className="muted">Recipes, a weekly meal plan, nutrition, grocery list and budget — all on your phone, all offline.</p>
          <label className="field">
            <span>What should we call you?</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" />
          </label>
          <div className="field">
            <span>How many people do you usually cook for?</span>
            <Stepper value={servings} onChange={setServings} min={1} max={12} />
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <h1>What’s in your kitchen?</h1>
          <p className="muted">We’ll only suggest recipes you can actually make. Tap to select.</p>
          <KitchenPicker value={equipment} onChange={setEquipment} />
        </>
      )}
      {step === 2 && (
        <>
          <h1>Weekly grocery budget</h1>
          <p className="muted">Optional. Plan my week will try to stay under it, and your grocery list shows what’s left.</p>
          <div className="prefix-input"><span>{s.currency}</span><input inputMode="numeric" placeholder="e.g. 400" value={budget} onChange={e => setBudget(e.target.value)} /></div>
          <div className="chip-row wrap">
            {[250, 400, 600, 800].map(v => <Chip key={v} active={budget === String(v)} onClick={() => setBudget(String(v))}>{fmtMoney(v, s.currency, 0)}</Chip>)}
            <Chip active={!budget} onClick={() => setBudget('')}>No budget</Chip>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h1>Any allergies?</h1>
          <p className="muted">The planner skips recipes containing these, and recipes will warn you.</p>
          <div className="chip-row wrap">
            {ALLERGY_OPTIONS.map(a => <Chip key={a} active={allergies.includes(a)} onClick={() => setAllergies(toggle(allergies, a))}>{capitalize(a)}</Chip>)}
          </div>
          <div className="field">
            <span>Foods you avoid or dislike</span>
            <ChipInput values={avoid} onChange={setAvoid} placeholder="e.g. mushrooms, coriander" suggestions={['pork', 'mushrooms', 'coriander', 'olives', 'spicy']} />
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <h1>Eating style</h1>
          <p className="muted">Optional. Pick any that apply — the planner only suggests matching recipes.</p>
          <div className="chip-row wrap">
            {DIETS.map(d => <Chip key={d} active={diets.includes(d)} onClick={() => setDiets(toggle(diets, d))}>{capitalize(d)}</Chip>)}
          </div>
          <p className="fineprint">You can change all of this later under Me.</p>
        </>
      )}
      {nav}
      <div className="onb-dots">{Array.from({ length: STEPS }, (_, i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
    </div>
  );
}
