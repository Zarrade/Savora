import type { RealtimeChannel } from '@supabase/supabase-js';
import { db, untracked } from '../db';
import { supabase } from './supabase';
import {
  KIND_TABLE, TABLE_KIND, ackOutbox, onOutboxChange, outboxUser, pendingCount, pendingTs, recordChange, snapshotOutbox, type Kind
} from './outbox';

/**
 * Offline-first sync between this device's IndexedDB and the user's rows in Supabase.
 *  push: upload outbox entries via the push_records RPC (server keeps the newest edit per record)
 *  pull: fetch rows changed since the last cursor and apply them unless a newer local edit is pending
 *  live: a Realtime subscription triggers a pull when another device changes something
 */

export type SyncState = 'off' | 'offline' | 'syncing' | 'synced' | 'error';
interface Status { state: SyncState; lastSynced: number | null; pending: number; error?: string }

let status: Status = { state: 'off', lastSynced: null, pending: 0 };
const subs = new Set<() => void>();
function setStatus(p: Partial<Status>) { status = { ...status, ...p, pending: pendingCount() }; subs.forEach(s => s()); }
export const getSyncStatus = () => status;
export function subscribeSync(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; }

const cursorKey = (u: string) => `savora-cursor:${u}`;
const knownKey = (u: string) => `savora-known:${u}`;
const OVERLAP_MS = 60_000; // re-read a minute of history: commits can land slightly out of order

interface Row { kind: Kind; id: string; data: unknown; client_ts: number; deleted: boolean; updated_at: string }

function tableFor(kind: Kind) {
  return (db as unknown as Record<string, typeof db.recipes>)[KIND_TABLE[kind]];
}

/** ids known to exist in the cloud, per kind — used to turn a table.clear() into deletions */
function loadKnown(u: string): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(knownKey(u)) || '{}'); } catch { return {}; }
}
function saveKnown(u: string, known: Record<string, Set<string>>) {
  try { localStorage.setItem(knownKey(u), JSON.stringify(Object.fromEntries(Object.entries(known).map(([k, v]) => [k, [...v]])))); } catch { /* full */ }
}

/** Approximate edit time of a record, for records written before the outbox existed. */
function recordTs(kind: Kind, obj: Record<string, unknown> | undefined): number {
  if (!obj) return Date.now();
  if (kind === 'settings') return 0; // guest settings never beat settings already in the account
  return Number(obj.updatedAt ?? obj.createdAt ?? 0) || 0;
}

/* ---------------------------------------------------------------- push */

async function push(u: string): Promise<void> {
  const { dirty, rescan } = snapshotOutbox();
  const known = Object.fromEntries(Object.entries(loadKnown(u)).map(([k, v]) => [k, new Set(v)])) as Record<string, Set<string>>;

  // A cleared table: every id we knew about that is gone now becomes a deletion
  for (const kind of rescan) {
    const have = new Set((await tableFor(kind).toCollection().primaryKeys()) as string[]);
    for (const id of known[kind] ?? []) if (!have.has(id) && !dirty.has(`${kind}|${id}`)) dirty.set(`${kind}|${id}`, Date.now());
    for (const id of have) if (!dirty.has(`${kind}|${id}`)) dirty.set(`${kind}|${id}`, Date.now());
  }
  if (!dirty.size) { ackOutbox(new Map(), rescan); return; }

  const byKind = new Map<Kind, string[]>();
  for (const k of dirty.keys()) {
    const [kind, ...rest] = k.split('|');
    const list = byKind.get(kind as Kind) ?? [];
    list.push(rest.join('|'));
    byKind.set(kind as Kind, list);
  }

  const payload: { kind: Kind; id: string; data: unknown; client_ts: number; deleted: boolean }[] = [];
  for (const [kind, ids] of byKind) {
    const objs = await tableFor(kind).bulkGet(ids);
    ids.forEach((id, i) => {
      const obj = objs[i];
      payload.push({ kind, id, data: obj ?? null, client_ts: dirty.get(`${kind}|${id}`)!, deleted: !obj });
      known[kind] ??= new Set();
      if (obj) known[kind].add(id); else known[kind].delete(id);
    });
  }

  // Batch by size: photos stored as data URLs can be large
  let batch: typeof payload = [], bytes = 0;
  const send = async () => {
    if (!batch.length) return;
    const { error } = await supabase.rpc('push_records', { records: batch });
    if (error) throw error;
    batch = []; bytes = 0;
  };
  for (const rec of payload) {
    const size = JSON.stringify(rec.data ?? '').length;
    if (batch.length && (bytes + size > 900_000 || batch.length >= 400)) await send();
    batch.push(rec); bytes += size;
  }
  await send();
  ackOutbox(dirty, rescan);
  saveKnown(u, known);
}

/* ---------------------------------------------------------------- pull */

async function pull(u: string): Promise<number> {
  const since = Number(localStorage.getItem(cursorKey(u)) || 0);
  const from = new Date(Math.max(0, since - OVERLAP_MS)).toISOString();
  let applied = 0, newest = since;
  const known = Object.fromEntries(Object.entries(loadKnown(u)).map(([k, v]) => [k, new Set(v)])) as Record<string, Set<string>>;

  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from('user_records')
      .select('kind,id,data,client_ts,deleted,updated_at')
      .gt('updated_at', from)
      .order('updated_at', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    if (!rows.length) break;

    await untracked(async () => {
      for (const r of rows) {
        newest = Math.max(newest, Date.parse(r.updated_at));
        const local = pendingTs(r.kind, r.id);
        if (local !== undefined && local > r.client_ts) continue; // our newer edit will be pushed
        const t = tableFor(r.kind);
        known[r.kind] ??= new Set();
        if (r.deleted || !r.data) { await t.delete(r.id); known[r.kind].delete(r.id); }
        else { await t.put(r.data as never); known[r.kind].add(r.id); }
        applied++;
      }
    });
    if (rows.length < 1000) break;
  }
  if (outboxUser() !== u) return applied; // signed out meanwhile: don't write state for them
  localStorage.setItem(cursorKey(u), String(newest));
  saveKnown(u, known);
  return applied;
}

/* ---------------------------------------------------------------- engine */

let running: Promise<void> | null = null;
let again = false;
let timer: number | undefined;
let channel: RealtimeChannel | null = null;

export function syncNow(): Promise<void> {
  const u = outboxUser();
  if (!u) return Promise.resolve();
  if (running) { again = true; return running; }
  if (!navigator.onLine) { setStatus({ state: 'offline' }); return Promise.resolve(); }
  setStatus({ state: 'syncing', error: undefined });
  running = (async () => {
    try {
      // Pull first: a new device must see the account's data before anything local is uploaded
      await pull(u);
      await push(u);
      if (outboxUser() === u) setStatus({ state: 'synced', lastSynced: Date.now() });
    } catch (e) {
      const msg = (e as Error)?.message || 'Sync failed';
      setStatus({ state: navigator.onLine ? 'error' : 'offline', error: msg });
    } finally {
      running = null;
      if (again) { again = false; scheduleSync(300); }
    }
  })();
  return running;
}

export function scheduleSync(delay = 1500) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { syncNow(); }, delay);
}

let unhook: (() => void)[] = [];

/** Start syncing for a signed-in user (call after setOutboxUser). */
export function startSync(u: string) {
  stopSync();
  setStatus({ state: navigator.onLine ? 'syncing' : 'offline' });
  const onOnline = () => scheduleSync(200);
  const onOffline = () => setStatus({ state: 'offline' });
  const onVisible = () => { if (document.visibilityState === 'visible') scheduleSync(200); };
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisible);
  const off = onOutboxChange(() => { setStatus({}); scheduleSync(); });
  const iv = window.setInterval(() => scheduleSync(0), 5 * 60_000);
  unhook = [
    () => window.removeEventListener('online', onOnline),
    () => window.removeEventListener('offline', onOffline),
    () => document.removeEventListener('visibilitychange', onVisible),
    off,
    () => window.clearInterval(iv)
  ];
  channel = supabase
    .channel(`records-${u}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_records', filter: `user_id=eq.${u}` }, () => scheduleSync(400))
    .subscribe();
  return syncNow();
}

export function stopSync() {
  unhook.forEach(f => f()); unhook = [];
  window.clearTimeout(timer);
  if (channel) { supabase.removeChannel(channel); channel = null; }
  setStatus({ state: 'off', lastSynced: null, error: undefined });
}

/** Has this account got anything in the cloud yet? */
export async function cloudHasData(): Promise<boolean> {
  const { count, error } = await supabase.from('user_records').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Queue everything on this device for upload (used when bringing guest data into an account). */
export async function queueAllLocal(): Promise<void> {
  for (const [table, kind] of Object.entries(TABLE_KIND)) {
    const rows = (await (db as unknown as Record<string, typeof db.recipes>)[table].toArray()) as unknown as Record<string, unknown>[];
    // Untouched starter recipes are identical on every device — don't upload them
    const keep = rows.filter(r => !(kind === 'recipe' && r.builtIn && r.updatedAt === r.createdAt));
    for (const r of keep) recordChange(kind, [r.id as string], recordTs(kind, r));
  }
}

export async function waitForIdle() { while (running) await running; }
