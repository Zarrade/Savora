import { useSyncExternalStore } from 'react';
import { getAuth, subscribeAuth, resolveMerge, type AuthState } from '../lib/account';
import { getSyncStatus, subscribeSync, syncNow } from '../lib/sync';
import { Icon } from './Icon';
import { LogoMark } from './Logo';

export const useAuth = (): AuthState => useSyncExternalStore(subscribeAuth, getAuth);
export const useSyncStatus = () => useSyncExternalStore(subscribeSync, getSyncStatus);

function ago(ts: number | null) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Small cloud indicator: synced / syncing / offline / error. Tap to sync now. */
export function SyncBadge({ withLabel = false }: { withLabel?: boolean }) {
  const auth = useAuth();
  const s = useSyncStatus();
  if (auth.status !== 'signedIn') return null;
  const label =
    s.state === 'syncing' ? 'Syncing…' :
    s.state === 'offline' ? (s.pending ? `Offline · ${s.pending} to sync` : 'Offline') :
    s.state === 'error' ? 'Sync paused' :
    s.pending ? `${s.pending} to sync` : `Synced ${ago(s.lastSynced)}`;
  return (
    <button className={`sync-badge sync-${s.state}`} onClick={() => syncNow()} title={s.error || label} aria-label={label}>
      <Icon name={s.state === 'error' ? 'alert' : s.state === 'syncing' ? 'refresh' : 'check'} size={14} strokeWidth={2.4} />
      {withLabel && <span>{label}</span>}
    </button>
  );
}

/** Guest data on this device + an account that already has data. */
export function MergePrompt() {
  return (
    <div className="auth-shell">
      <div className="auth-card merge-card">
        <LogoMark size={56} />
        <h1>Welcome back</h1>
        <p className="muted">This phone has recipes and plans made before you signed in, and your account already has its own.</p>
        <button className="btn btn-primary btn-lg block" onClick={() => resolveMerge('merge')}>
          <Icon name="upload" size={18} /> Add this phone’s data to my account
        </button>
        <button className="btn btn-ghost btn-lg block" onClick={() => resolveMerge('discard')}>
          Use only my account’s data
        </button>
        <p className="fineprint">If the same recipe was edited in both places, the most recent edit wins.</p>
      </div>
    </div>
  );
}
