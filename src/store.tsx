import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Data, Goal, Log, Settings, Theme } from './types';
import { dayKey, goalProgress, periodStart } from './progress';
import { MILESTONES, rhythm, UNIT_WORD } from './consistency';
import { connectCloud, type Cloud } from './cloud';
import { tr, locale } from './i18n';

const KEY = import.meta.env.VITE_DEMO ? 'werde.demo.v6' : 'werde.data.v1';

const DEFAULT_SETTINGS: Settings = {
  reminderHours: 5, quietStart: '22:00', quietEnd: '07:00', celebrations: true,
  remindersOn: false, lastNudgeAt: 0, firstOpenedAt: Date.now(), openInQuickLog: false, skyMode: 'auto', breathingMoment: false, restUntil: 0, name: '', pronoun: '', customPronoun: '', welcomed: false, lastBackupAt: 0, backupSnoozeUntil: 0,
};

function empty(): Data {
  return { version: 1, themes: [], goals: [], logs: [], settings: DEFAULT_SETTINGS, celebrated: {}, restDays: [], freezes: {}, notes: [] };
}

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return import.meta.env.VITE_DEMO ? demo() : empty();
    const d = JSON.parse(raw) as Data;
    return { ...empty(), ...d, settings: { ...DEFAULT_SETTINGS, ...d.settings }, celebrated: d.celebrated ?? {}, restDays: d.restDays ?? [], freezes: d.freezes ?? {}, notes: d.notes ?? [] };
  } catch {
    return empty();
  }
}

function demoLogs(now: number): Log[] {
  const out: Log[] = [];
  const day = 86400_000;
  const pattern = [5, 8, 6, 0, 8, 7, 3, 8, 8, 4, 0, 6, 8, 5, 7, 8, 2, 8, 6, 0, 8];
  pattern.forEach((v, i) => {
    const at = now - i * day - (i === 0 ? 60_000 : 0);
    if (v) out.push({ id: `w${i}`, goalId: 'g1', amount: v, at });
    if (i % 3 === 1) out.push({ id: `k${i}`, goalId: 'g2', amount: 4, at });
    if (v > 4 && i !== 1) out.push({ id: `r${i}`, goalId: 'g3', amount: v * 3, at });
    if (i % 2 === 0) out.push({ id: `s${i}`, goalId: 'g4', amount: 1 + (i % 3) * 0.5, at });
  });
  return out;
}

/** Example goals, only used for the shareable preview build (VITE_DEMO=1). */
function demo(): Data {
  const now = Date.now();
  const g = (id: string, themeId: string, name: string, unit: string, target: number, step: number, period: Goal['period'], direction: Goal['direction'], category: Goal['category']): Goal =>
    ({ id, themeId, name, unit, target, step, period, direction, category, paused: false, createdAt: now - 30 * 86400_000 });
  return {
    ...empty(),
    themes: [
      { id: 't1', name: 'Körper', color: 'meadow', icon: '🌿', createdAt: now },
      { id: 't2', name: 'Geist', color: 'lilac', icon: '📖', createdAt: now },
    ],
    goals: [
      { ...g('g1', 't1', 'Wasser trinken', 'Gläser', 8, 1, 'day', 'more', 'nourish'), cue: 'aufwache', why: 'Ich fühle mich klarer und ruhiger, wenn ich genug trinke.' },
      g('g2', 't1', 'Draußen gehen', 'km', 20, 2, 'week', 'more', 'move'),
      { ...g('g3', 't2', 'Lesen', 'Seiten', 20, 5, 'day', 'more', 'meaning'), cue: 'ins Bett gehe', why: 'Lesen hilft mir, abends runterzukommen.' },
      g('g4', 't2', 'Bildschirmzeit', 'Stunden', 2, 0.5, 'day', 'less', 'restore'),
    ],
    logs: demoLogs(now),
    freezes: { g1: [dayKey(new Date(now - 3 * 86400_000))] },
    notes: [
      { id: 'n1', text: 'Abends 10 Minuten lesen statt scrollen', at: now - 2 * 86400_000 },
      { id: 'n2', text: 'Einmal pro Woche Blumen für mich kaufen', at: now - 5 * 86400_000 },
    ],
    restDays: [dayKey(new Date(now - 10 * 86400_000))],
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export interface Celebrate { id: number; kind: 'small' | 'big'; title: string; note?: string; color?: string }

interface Toast { id: number; text: string; undo: boolean }

export type SyncState = 'local' | 'connecting' | 'account';

interface Store {
  data: Data;
  sync: SyncState;
  toast: Toast | null;
  celebration: Celebrate | null;
  clearCelebration: () => void;
  breathing: boolean;
  endBreathing: () => void;
  dismissToast: () => void;
  undo: () => void;
  saveTheme: (t: Theme) => void;
  deleteTheme: (id: string) => void;
  reorderThemes: (ids: string[]) => void;
  reorderGoals: (themeId: string, ids: string[]) => void;
  toggleThemeOpen: (id: string) => void;
  saveGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  /** at: when it happened (to note a past day); now when missing */
  log: (goalId: string, amount: number, at?: number) => void;
  deleteLog: (id: string) => void;
  saveSettings: (s: Partial<Settings>) => void;
  toggleRestDay: (day: Date) => void;
  toggleFreeze: (goalId: string, day: Date) => void;
  replaceAll: (d: Data) => void;
  addNote: (text: string) => void;
  removeNote: (id: string) => void;
  setDayNote: (goalId: string, day: string, text: string) => void;
  setTexts: (t: Data['texts']) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  const [toast, setToast] = useState<Toast | null>(null);
  const [celebration, setCelebration] = useState<Celebrate | null>(null);
  const [breathing, setBreathing] = useState(false);
  const prev = useRef<Data | null>(null);

  const [sync, setSync] = useState<SyncState>('connecting');
  const cloud = useRef<Cloud | null>(null);
  const ready = useRef(false);

  // Connect to the viewer's private account storage (claude.ai artifact), if available.
  useEffect(() => {
    let live = true;
    (async () => {
      const c = import.meta.env.VITE_DEMO ? null : await connectCloud();
      if (!live) return;
      if (!c) { setSync('local'); ready.current = true; return; }
      try {
        const remote = await c.load();
        cloud.current = c;
        if (remote) setData({ ...empty(), ...remote, settings: { ...DEFAULT_SETTINGS, ...remote.settings } });
        else setData((d) => { c.save(d); return d; }); // first visit: keep what this device has
        setSync('account');
      } catch {
        setSync('local');
      }
      ready.current = true;
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
    if (!ready.current || !cloud.current) return;
    const t = window.setTimeout(() => cloud.current?.save(data), 250);
    return () => window.clearTimeout(t);
  }, [data]);

  // Leaving the page: save right away instead of waiting for the short pause.
  const latest = useRef(data);
  latest.current = data;
  useEffect(() => {
    const flush = () => { if (ready.current && cloud.current) cloud.current.save(latest.current); };
    const onHide = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);

  // Coming back to the tab (e.g. after logging on another device): fetch the latest.
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState !== 'visible' || !cloud.current) return;
      try {
        const remote = await cloud.current.load();
        if (remote) setData((d) => (JSON.stringify(d) === JSON.stringify({ ...d, ...remote }) ? d : { ...empty(), ...remote, settings: { ...DEFAULT_SETTINGS, ...remote.settings } }));
      } catch { /* keep what we have */ }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const change = useCallback((fn: (d: Data) => Data, text?: string) => {
    setData((d) => {
      prev.current = d;
      return fn(d);
    });
    if (text) setToast({ id: Date.now(), text, undo: true });
  }, []);

  const undo = useCallback(() => {
    if (prev.current) {
      const p = prev.current;
      prev.current = null;
      setData(p);
      setToast({ id: Date.now(), text: tr('Rückgängig gemacht', 'Undone'), undo: false });
    }
  }, []);

  const upsert = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

  const store: Store = {
    data,
    sync,
    toast,
    celebration,
    clearCelebration: () => setCelebration(null),
    breathing,
    endBreathing: () => setBreathing(false),
    dismissToast: () => setToast(null),
    undo,
    saveTheme: (t) => change((d) => ({ ...d, themes: upsert(d.themes, t) })),
    reorderThemes: (ids) => change((d) => {
      const byId = new Map(d.themes.map((t) => [t.id, t]));
      const next = ids.map((id) => byId.get(id)).filter((t): t is Theme => !!t);
      for (const t of d.themes) if (!ids.includes(t.id)) next.push(t);
      return { ...d, themes: next };
    }, tr('Reihenfolge geändert', 'Order changed')),
    reorderGoals: (themeId, ids) => change((d) => {
      const byId = new Map(d.goals.map((g) => [g.id, g]));
      const queue = ids.map((id) => byId.get(id)).filter((g): g is Goal => !!g && g.themeId === themeId);
      // keep other themes' goals where they are, refill this theme's slots in the new order
      const goals = d.goals.map((g) => (g.themeId === themeId ? queue.shift() ?? g : g));
      return { ...d, goals };
    }, tr('Reihenfolge geändert', 'Order changed')),
    toggleThemeOpen: (id) => setData((d) => ({ ...d, themes: d.themes.map((t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t)) })),
    deleteTheme: (id) =>
      change((d) => {
        const goalIds = new Set(d.goals.filter((g) => g.themeId === id).map((g) => g.id));
        return {
          ...d,
          themes: d.themes.filter((t) => t.id !== id),
          goals: d.goals.filter((g) => !goalIds.has(g.id)),
          logs: d.logs.filter((l) => !goalIds.has(l.goalId)),
        };
      }, tr('Thema entfernt', 'Theme removed')),
    saveGoal: (g) => change((d) => ({ ...d, goals: upsert(d.goals, g) })),
    deleteGoal: (id) =>
      change((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id), logs: d.logs.filter((l) => l.goalId !== id) }), tr('Ziel entfernt', 'Goal removed')),
    log: (goalId, amount, at) => {
      const entry: Log = { id: uid(), goalId, amount, at: at ?? Date.now() };
      // noted for an earlier day: count it on that day, without celebrations or notes
      const past = entry.at < periodStart('day').getTime();
      if (past) {
        const back = Math.round((periodStart('day').getTime() - periodStart('day', new Date(entry.at)).getTime()) / 86400_000);
        const when = back === 1 ? tr('für gestern', 'for yesterday') : back === 2 ? tr('für vorgestern', 'for the day before') : `${tr('am', 'on')} ${new Date(entry.at).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}`;
        change((d) => ({ ...d, logs: [...d.logs, entry] }), `${tr('Nachgetragen', 'Logged')} ${when}`);
        return;
      }
      const goal = data.goals.find((g) => g.id === goalId);
      const nextLogs = [...data.logs, entry];
      const celebrated = { ...data.celebrated };
      let cel: Celebrate | null = null;
      let note: string | undefined;
      if (goal) {
        const before = rhythm(goal, data);
        const after = rhythm(goal, { ...data, logs: nextLogs });
        const ps = periodStart(goal.period).getTime();
        const bloom = goal.direction === 'more' && !goalProgress(goal, data.logs).reached
          && goalProgress(goal, nextLogs).reached && celebrated[goalId] !== ps;
        if (bloom) celebrated[goalId] = ps;

        // every daily goal done today: a small moment, once a day
        const today = periodStart('day').getTime();
        const tk = dayKey(new Date());
        const daily = data.goals.filter((g) => g.period === 'day' && g.direction === 'more' && !g.paused
          && !data.restDays.includes(tk) && !(data.freezes[g.id]?.includes(tk)));
        const allDone = (logs: Log[]) => daily.length > 0 && daily.every((g) => goalProgress(g, logs).reached);
        const dayComplete = !allDone(data.logs) && allDone(nextLogs) && celebrated.__day !== today;
        if (dayComplete) celebrated.__day = today;

        if (bloom && goal.period === 'month') cel = { id: Date.now(), kind: 'big', title: goal.name, note: tr('Dein Ziel für diesen Monat', 'Your goal for this month') };
        else if (dayComplete) cel = { id: Date.now(), kind: 'small', title: tr('Alle Ziele für heute', 'All goals for today') };
        else if (bloom && goal.period === 'week') cel = { id: Date.now(), kind: 'small', title: `${goal.name}, ${tr('diese Woche', 'this week')}` };

        if (!before.doneNow && after.doneNow && MILESTONES.includes(after.streak)) note = `${after.streak} ${UNIT_WORD[goal.period][1]}`;
        else if (before.missedLast && !data.logs.some((l) => l.goalId === goalId && l.at >= ps)) note = tr('Schön, dass du wieder da bist', 'Good to have you back');
      }
      change((d) => ({ ...d, logs: [...d.logs, entry], celebrated }), note ? `${tr('Notiert', 'Logged')} · ${note}` : tr('Notiert', 'Logged'));
      if (cel) setCelebration(cel);
    },
    deleteLog: (id) => change((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }), tr('Eintrag entfernt', 'Entry removed')),
    toggleRestDay: (day) => {
      const k = dayKey(day);
      const tomorrow = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
      setData((d) => {
        const on = d.restDays.includes(k);
        return {
          ...d,
          restDays: on ? d.restDays.filter((x) => x !== k) : [...d.restDays, k],
          settings: dayKey(new Date()) === k ? { ...d.settings, restUntil: on ? 0 : tomorrow } : d.settings,
        };
      });
    },
    toggleFreeze: (goalId, day) => {
      const k = dayKey(day);
      change((d) => {
        const list = d.freezes[goalId] ?? [];
        const on = list.includes(k);
        return { ...d, freezes: { ...d.freezes, [goalId]: on ? list.filter((x) => x !== k) : [...list, k] } };
      });
    },
    saveSettings: (s) => setData((d) => ({ ...d, settings: { ...d.settings, ...s } })),
    addNote: (text) => setData((d) => ({ ...d, notes: [{ id: uid(), text, at: Date.now() }, ...d.notes] })),
    setDayNote: (goalId, day, text) => setData((d) => {
      const all = { ...(d.dayNotes ?? {}) };
      const mine = { ...(all[goalId] ?? {}) };
      if (text.trim()) mine[day] = text; else delete mine[day];
      if (Object.keys(mine).length) all[goalId] = mine; else delete all[goalId];
      return { ...d, dayNotes: all };
    }),
    setTexts: (t) => setData((d) => { const n = { ...d }; if (t) n.texts = t; else delete n.texts; return n; }),
    removeNote: (id) => change((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }), tr('Notiz entfernt', 'Note removed')),
    replaceAll: (nd) => change(() => ({ ...empty(), ...nd, settings: { ...DEFAULT_SETTINGS, ...nd.settings, lastBackupAt: Date.now(), welcomed: true }, restDays: nd.restDays ?? [], freezes: nd.freezes ?? {}, notes: nd.notes ?? [], celebrated: nd.celebrated ?? {} }), tr('Backup geladen', 'Backup loaded')),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
