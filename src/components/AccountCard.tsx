import { useState } from 'react';
import { useAuth, useSyncStatus } from './Account';
import { Icon } from './Icon';
import { toast, useConfirm } from './ui';
import { deleteAccount, displayName, showSignIn, signOut, updateName } from '../lib/account';
import { syncNow } from '../lib/sync';
import { saveSettings } from '../hooks';

export function AccountCard() {
  const auth = useAuth();
  const sync = useSyncStatus();
  const { confirm, confirmNode } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  if (auth.status !== 'signedIn') {
    return (
      <section className="card account-card account-guest" id="account">
        <div className="row gap">
          <span className="avatar lg"><Icon name="user" size={24} /></span>
          <div className="grow">
            <h2>You’re using Savora as a guest</h2>
            <p className="muted small">Create a free account to keep your recipes safe and use them on every device.</p>
          </div>
        </div>
        <button className="btn btn-primary block" onClick={showSignIn}>Sign in or create account</button>
      </section>
    );
  }

  const user = auth.user!;
  const n = displayName(user);
  const statusText =
    sync.state === 'syncing' ? 'Syncing now…' :
    sync.state === 'offline' ? `Offline — ${sync.pending ? `${sync.pending} change${sync.pending === 1 ? '' : 's'} will sync when you’re back` : 'changes will sync when you’re back'}` :
    sync.state === 'error' ? `Sync paused: ${sync.error ?? 'unknown error'}` :
    sync.lastSynced ? `All changes saved to your account · ${new Date(sync.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connected';

  const saveName = async () => {
    const v = name.trim();
    if (!v) return;
    setBusy(true);
    try { await updateName(v); await saveSettings({ name: v }); setEditing(false); toast('Name updated'); }
    catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <section className="card account-card" id="account">
      <div className="row gap">
        <span className="avatar lg">{(n || '?')[0].toUpperCase()}</span>
        <div className="grow">
          {editing ? (
            <form className="row gap-sm" onSubmit={e => { e.preventDefault(); saveName(); }}>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              <button className="btn btn-primary btn-sm" disabled={busy}>Save</button>
            </form>
          ) : (
            <h2 className="row gap-sm">{n}<button className="icon-btn sm" aria-label="Edit name" onClick={() => { setName(n); setEditing(true); }}><Icon name="edit" size={16} /></button></h2>
          )}
          <p className="muted small truncate">{user.email}</p>
        </div>
      </div>
      <div className={`sync-line sync-${sync.state}`}>
        <Icon name={sync.state === 'error' ? 'alert' : sync.state === 'syncing' ? 'refresh' : 'check'} size={16} />
        <span className="grow">{statusText}</span>
        <button className="btn btn-soft btn-sm" disabled={sync.state === 'syncing'} onClick={() => syncNow()}>Sync now</button>
      </div>
      <div className="menu">
        <button disabled={busy} onClick={async () => {
          if (!(await confirm('Sign out on this device? Your data stays safe in your account.', 'Sign out'))) return;
          setBusy(true); await signOut(); }}><Icon name="arrowRight" /> Sign out</button>
        <button className="danger" disabled={busy} onClick={async () => {
          if (!(await confirm('Permanently delete your account and every recipe, plan and list in it, on all devices? This cannot be undone.', 'Delete account'))) return;
          setBusy(true);
          try { await deleteAccount(); toast('Your account was deleted'); } catch (e) { toast((e as Error).message); setBusy(false); }
        }}><Icon name="trash" /> Delete account</button>
      </div>
      {confirmNode}
    </section>
  );
}
