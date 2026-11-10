import { useState } from 'react';
import { saveSettings, useSettings } from '../hooks';
import { Chip, ChipInput, Stepper } from '../components/ui';
import { DIETS, type Diet } from '../types';
import { capitalize } from '../lib/util';
import { KitchenPicker } from '../components/KitchenPicker';
import { CURRENCIES, fmtMoney, fromCurrency, inputAmount } from '../lib/pricing';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../components/Account';
import { displayName } from '../lib/account';

export const ALLERGY_OPTIONS = ['gluten', 'dairy', 'egg', 'nuts', 'peanuts', 'shellfish', 'fish', 'soy', 'sesame'];
const STEPS = 5;

export default function Onboarding() {
  const s = useSettings();
  const [step, setStep] = useState(0);
  const auth = useAuth();
  const [name, setName] = useState(s.name || displayName(auth.user));
  const [servings, setServings] = useState(s.householdServings);
  const [allergies, setAllergies] = useState<string[]>(s.allergies);
  const [avoid, setAvoid] = useState<string[]>(s.avoid);
  const [diets, setDiets] = useState<Diet[]>(s.diets);
  const [equipment, setEquipment] = useState<string[]>(s.equipment);
  const [currency, setCurrency] = useState(s.currency);
  const [budget, setBudget] = useState(inputAmount(s.weeklyBudget, s.currency));

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const finish = () => saveSettings({
    name: name.trim(), householdServings: servings, allergies, avoid, diets, equipment,
    currency, weeklyBudget: Math.round(fromCurrency(Number(budget.replace(/[^\d.]/g, '')) || 0, currency) * 100) / 100, onboarded: true, featureTipSeen: true
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
      <LogoMark size={64} className="onb-logo" />
      <div className="onb-progress"><span style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>
      {step === 0 && (
        <>
          <h1>Welcome to <em>Savora</em></h1>
          <p className="muted">Let’s set up your kitchen in under a minute. Recipes, weekly plans, nutrition, groceries and budget — tailored to you.</p>
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
          <div className="chip-row wrap">{CURRENCIES.map(c => <Chip key={c.code} active={currency === c.code} onClick={() => { setCurrency(c.code); setBudget(''); }}>{c.code}</Chip>)}</div>
          <div className="prefix-input"><span>{currency}</span><input inputMode="numeric" placeholder="e.g. 400" value={budget} onChange={e => setBudget(e.target.value)} /></div>
          <div className="chip-row wrap">
            {[250, 400, 600, 800].map(v => <Chip key={v} active={budget === inputAmount(v, currency)} onClick={() => setBudget(inputAmount(v, currency))}>{fmtMoney(v, currency, 0)}</Chip>)}
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
