/**
 * Records which local records changed so the sync engine knows what to upload.
 * Kept free of imports from db.ts so the Dexie middleware can use it without a cycle.
 *
 * - Only records while a user is signed in (guests have nothing to sync).
 * - Writes made inside `untracked(...)` transactions (seeding, auto photos, applying
 *   changes pulled from the cloud) are ignored.
 * - The outbox is persisted per user in localStorage so offline edits survive reloads.
 */
export type Kind = 'recipe' | 'plan' | 'grocery' | 'collection' | 'settings';
export const TABLE_KIND: Record<string, Kind> = {
  recipes: 'recipe', plan: 'plan', grocery: 'grocery', collections: 'collection', settings: 'settings'
};
export const KIND_TABLE: Record<Kind, string> = {
  recipe: 'recipes', plan: 'plan', grocery: 'grocery', collection: 'collections', settings: 'settings'
};

let uid: string | null = null;
let dirty = new Map<string, number>();     // "kind|id" -> client edit time (ms)
let rescan = new Set<Kind>();             // kinds that were range-deleted (e.g. table.clear())
const untrackedTx = new WeakSet<object>();
const listeners = new Set<() => void>();

const key = (u: string) => `savora-outbox:${u}`;

function persist() {
  if (!uid) return;
  try { localStorage.setItem(key(uid), JSON.stringify({ d: [...dirty], r: [...rescan] })); } catch { /* storage full/blocked */ }
}

export function setOutboxUser(next: string | null) {
  uid = next;
  dirty = new Map(); rescan = new Set();
  if (!uid) return;
  try {
    const raw = JSON.parse(localStorage.getItem(key(uid)) || 'null');
    if (raw) { dirty = new Map(raw.d); rescan = new Set(raw.r); }
  } catch { /* corrupt: start clean */ }
}
export const outboxUser = () => uid;

export function markUntracked(tx: object | undefined) { if (tx) untrackedTx.add(tx); }
export function isUntracked(tx: object | undefined) { return !!tx && untrackedTx.has(tx); }

export function recordChange(kind: Kind, ids: unknown[], ts = Date.now()) {
  if (!uid || !ids.length) return;
  for (const id of ids) if (typeof id === 'string') dirty.set(`${kind}|${id}`, ts);
  persist();
  listeners.forEach(l => l());
}
export function recordRescan(kind: Kind) {
  if (!uid) return;
  rescan.add(kind);
  persist();
  listeners.forEach(l => l());
}

export function snapshotOutbox() { return { dirty: new Map(dirty), rescan: new Set(rescan) }; }
export function pendingTs(kind: Kind, id: string) { return dirty.get(`${kind}|${id}`); }
export function pendingCount() { return dirty.size + rescan.size; }

/** Remove entries that were uploaded, unless they changed again meanwhile. */
export function ackOutbox(sent: Map<string, number>, rescanned: Set<Kind>) {
  for (const [k, ts] of sent) if (dirty.get(k) === ts) dirty.delete(k);
  rescanned.forEach(k => rescan.delete(k));
  persist();
}
export function clearOutbox(u: string) { try { localStorage.removeItem(key(u)); } catch { /* ignore */ } }

export function onOutboxChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
