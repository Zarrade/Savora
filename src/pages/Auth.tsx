import { useEffect, useState, type FormEvent } from 'react';
import { LogoMark } from '../components/Logo';
import { Icon } from '../components/Icon';
import { toast } from '../components/ui';
import {
  continueAsGuest, sendMagicLink, sendPasswordReset, signIn, signUp, takeAuthNotice, updatePassword
} from '../lib/account';

type Mode = 'signin' | 'signup' | 'forgot' | 'magic' | 'sent' | 'reset';

function friendly(e: unknown): string {
  const m = ((e as Error)?.message || '').toLowerCase();
  if (!navigator.onLine || m.includes('failed to fetch')) return 'You’re offline. Connect to the internet to sign in.';
  if (m.includes('invalid login')) return 'Email or password is incorrect.';
  if (m.includes('not confirmed')) return 'Please confirm your email first — check your inbox for the link.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many emails sent recently. Please wait a little and try again.';
  if (m.includes('password') && m.includes('characters')) return 'Password must be at least 6 characters.';
  if (m.includes('signups not allowed') || m.includes('user not found')) return 'No account found for this email.';
  return (e as Error)?.message || 'Something went wrong. Please try again.';
}

const FEATURES: [string, string][] = [
  ['book', 'Your recipes, plans and lists on every device'],
  ['sparkles', 'AI that turns photos, links and leftovers into dinner'],
  ['wallet', 'Weekly plans that fit your kitchen, diet and budget'],
  ['leaf', 'Works offline in the kitchen — syncs when you’re back']
];

export default function AuthPage({ recovery = false }: { recovery?: boolean }) {
  const [mode, setMode] = useState<Mode>(recovery ? 'reset' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentWhat, setSentWhat] = useState('');

  useEffect(() => { const n = takeAuthNotice(); if (n) setError(n); }, []);
  useEffect(() => { if (recovery) setMode('reset'); }, [recovery]);
  const go = (m: Mode) => { setMode(m); setError(null); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === 'signin') await signIn(email.trim(), password);
      else if (mode === 'signup') {
        const { needsConfirm } = await signUp(name.trim(), email.trim(), password);
        if (needsConfirm) { setSentWhat('confirm'); setMode('sent'); }
      } else if (mode === 'forgot') { await sendPasswordReset(email.trim()); setSentWhat('reset'); setMode('sent'); }
      else if (mode === 'magic') { await sendMagicLink(email.trim()); setSentWhat('magic'); setMode('sent'); }
      else if (mode === 'reset') { await updatePassword(password); toast('Password updated'); }
    } catch (err) { setError(friendly(err)); }
    finally { setBusy(false); }
  };

  const title = { signin: 'Welcome back', signup: 'Create your account', forgot: 'Reset your password', magic: 'Email me a sign-in link', sent: 'Check your email', reset: 'Choose a new password' }[mode];
  const sub = {
    signin: 'Sign in to pick up where you left off.',
    signup: 'Free. Your kitchen, synced across your devices.',
    forgot: 'We’ll email you a link to set a new password.',
    magic: 'No password needed — we’ll email you a one-tap link.',
    sent: '',
    reset: 'Make it at least 8 characters.'
  }[mode];

  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo"><LogoMark size={52} /><span>Savora</span></div>
          <h2 className="auth-brand-title">Cook more.<br />Plan less.<br /><em>Savor</em> everything.</h2>
          <ul className="auth-features">
            {FEATURES.map(([icon, text]) => <li key={text}><span><Icon name={icon} size={18} /></span>{text}</li>)}
          </ul>
        </div>
        <div className="auth-brand-plates">
          <span>🥘</span><span>🥗</span><span>🍜</span><span>🫓</span><span>🍋</span>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo"><LogoMark size={48} /><span>Savora</span></div>
          <h1>{title}</h1>
          {sub && <p className="muted">{sub}</p>}

          {mode === 'sent' ? (
            <div className="auth-sent">
              <div className="auth-sent-icon"><Icon name="check" size={28} strokeWidth={2.4} /></div>
              <p>
                {sentWhat === 'confirm' && <>We sent a confirmation link to <b>{email}</b>. Open it on this device to finish creating your account.</>}
                {sentWhat === 'reset' && <>If an account exists for <b>{email}</b>, a password reset link is on its way.</>}
                {sentWhat === 'magic' && <>We sent a sign-in link to <b>{email}</b>. Open it on this device.</>}
              </p>
              <p className="fineprint">Can’t find it? Check spam, or wait a minute and try again.</p>
              <button className="btn btn-ghost block" onClick={() => go('signin')}>Back to sign in</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              {mode === 'signup' && (
                <label className="field">
                  <span>Your name</span>
                  <input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sara" />
                </label>
              )}
              {mode !== 'reset' && (
                <label className="field">
                  <span>Email</span>
                  <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </label>
              )}
              {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                <label className="field">
                  <span className="row between">
                    {mode === 'reset' ? 'New password' : 'Password'}
                    {mode === 'signin' && <button type="button" className="auth-link" onClick={() => go('forgot')}>Forgot?</button>}
                  </span>
                  <div className="input-with-icon">
                    <input type={show ? 'text' : 'password'} required minLength={mode === 'signin' ? 1 : 8}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signin' ? 'Your password' : 'At least 8 characters'} />
                    <button type="button" className="icon-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
                      <Icon name={show ? 'unlock' : 'lock'} size={18} />
                    </button>
                  </div>
                </label>
              )}

              {error && <div className="alert alert-warn" role="alert"><Icon name="alert" size={18} /><span>{error}</span></div>}

              <button className="btn btn-primary btn-lg block" disabled={busy}>
                {busy ? 'Please wait…' : { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link', magic: 'Send sign-in link', reset: 'Save new password', sent: '' }[mode]}
              </button>

              {mode === 'signin' && (
                <>
                  <button type="button" className="btn btn-ghost block" onClick={() => go('magic')}><Icon name="sparkles" size={16} /> Email me a sign-in link</button>
                  <p className="auth-switch">New to Savora? <button type="button" onClick={() => go('signup')}>Create an account</button></p>
                </>
              )}
              {mode === 'signup' && <p className="auth-switch">Already have an account? <button type="button" onClick={() => go('signin')}>Sign in</button></p>}
              {(mode === 'forgot' || mode === 'magic') && <p className="auth-switch"><button type="button" onClick={() => go('signin')}>← Back to sign in</button></p>}
            </form>
          )}

          {mode !== 'reset' && (
            <div className="auth-guest">
              <span>or</span>
              <button className="auth-link" onClick={continueAsGuest}>Continue without an account</button>
              <small className="faint">Everything stays on this device only. You can sign in later.</small>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
