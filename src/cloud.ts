import type { Data, Log } from './types';

/**
 * Saves werde's data to the viewer's own private space when it runs as a claude.ai artifact
 * (the `db` capability). Elsewhere (a hosted PWA, local dev) this resolves to null and
 * werde keeps using browser storage only.
 *
 * Layout, all private to the viewer under data/users/<id>/:
 *   werde            -> { json }         themes, goals, settings, rest days ... (everything but logs)
 *   werde/logs/<YYYY-MM> -> { entries }  one document of entries per month
 */
type Db = {
  doc(path: string): { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void>; collection(p: string): any };
};

export interface Cloud {
  load(): Promise<Data | null>;
  save(d: Data): Promise<void>;
}

const monthKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export async function connectCloud(): Promise<Cloud | null> {
  const w = window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } };
  if (!w.claude?.use) return null;
  try {
    const [db, user] = (await Promise.all([w.claude.use('db'), w.claude.use('user')])) as [Db | null, { id(): Promise<string | null> } | null];
    if (!db || !user) return null;
    const uid = await user.id();
    if (!uid) return null;
    const root = db.doc(`data/users/${uid}/werde`);
    const logsCol = root.collection('logs');
    const written = new Map<string, string>(); // path -> last serialized body, to write only what changed
    let chain: Promise<void> = Promise.resolve();

    return {
      async load() {
        const snap = await root.get();
        if (!snap.exists) return null;
        const core = JSON.parse(String(snap.data()?.json ?? '{}')) as Omit<Data, 'logs'>;
        written.set('core', String(snap.data()?.json ?? ''));
        const months = await logsCol.get();
        const logs: Log[] = [];
        for (const m of months.docs) {
          const entries = (m.data()?.entries ?? []) as Log[];
          written.set(`m:${m.id}`, JSON.stringify(entries));
          logs.push(...entries);
        }
        return { ...(core as Data), logs };
      },
      save(d: Data) {
        // one write at a time; each call writes only the parts that changed
        chain = chain.then(async () => {
          const { logs, ...core } = d;
          const coreJson = JSON.stringify(core);
          if (written.get('core') !== coreJson) {
            await root.set({ json: coreJson, savedAt: Date.now() });
            written.set('core', coreJson);
          }
          const byMonth = new Map<string, Log[]>();
          for (const l of logs) { const k = monthKey(l.at); (byMonth.get(k) ?? byMonth.set(k, []).get(k)!).push(l); }
          const keys = new Set([...byMonth.keys(), ...[...written.keys()].filter((k) => k.startsWith('m:')).map((k) => k.slice(2))]);
          for (const k of keys) {
            const body = JSON.stringify(byMonth.get(k) ?? []);
            if (written.get(`m:${k}`) === body) continue;
            await logsCol.doc(k).set({ entries: byMonth.get(k) ?? [] });
            written.set(`m:${k}`, body);
          }
        }).catch((e) => { console.warn('werde: saving to your account failed', e); });
        return chain;
      },
    };
  } catch {
    return null;
  }
}
