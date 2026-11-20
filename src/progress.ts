import type { Goal, Log, Period } from './types';

export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const dow = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - dow);
  } else if (period === 'month') {
    d.setDate(1);
  }
  return d;
}

export function periodEnd(period: Period, now = new Date()): Date {
  const s = periodStart(period, now);
  if (period === 'day') s.setDate(s.getDate() + 1);
  else if (period === 'week') s.setDate(s.getDate() + 7);
  else s.setMonth(s.getMonth() + 1);
  return s;
}

export function logsInPeriod(goal: Goal, logs: Log[], now = new Date()): Log[] {
  const s = periodStart(goal.period, now).getTime();
  const e = periodEnd(goal.period, now).getTime();
  return logs.filter((l) => l.goalId === goal.id && l.at >= s && l.at < e).sort((a, b) => b.at - a.at);
}

export interface Progress { amount: number; pct: number; reached: boolean }

export function goalProgress(goal: Goal, logs: Log[], now = new Date()): Progress {
  const amount = logsInPeriod(goal, logs, now).reduce((s, l) => s + l.amount, 0);
  const pct = goal.target > 0 ? amount / goal.target : 0;
  const reached = goal.direction === 'more' ? amount >= goal.target : amount <= goal.target;
  return { amount, pct, reached };
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
}

export const PERIOD_LABEL: Record<Period, string> = { day: 'heute', week: 'diese Woche', month: 'diesen Monat' };
export const PERIOD_ADJ: Record<Period, string> = { day: 'pro Tag', week: 'pro Woche', month: 'pro Monat' };

export function progressLabel(goal: Goal, p: Progress): string {
  if (goal.direction === 'less') return `${fmt(p.amount)} von max. ${fmt(goal.target)} ${goal.unit}`;
  return `${fmt(p.amount)} von ${fmt(goal.target)} ${goal.unit}`;
}

export function gentleStatus(goal: Goal, p: Progress): string {
  if (goal.paused) return 'Ruht';
  if (goal.direction === 'less') return p.reached ? 'Innerhalb deiner Grenze' : 'Über deiner Grenze, und das ist okay';
  if (p.reached) return 'In voller Blüte';
  if (p.amount === 0) return 'Wartet auf dich';
  return 'Wächst';
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/** Sum of logs for one goal on one calendar day. */
export function dayAmount(goalId: string, logs: Log[], day: Date): number {
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const e = addDays(day, 1).getTime();
  let sum = 0;
  for (const l of logs) if (l.goalId === goalId && l.at >= s && l.at < e) sum += l.amount;
  return sum;
}

export function logsOnDay(logs: Log[], day: Date): Log[] {
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const e = addDays(day, 1).getTime();
  return logs.filter((l) => l.at >= s && l.at < e).sort((a, b) => a.at - b.at);
}

/**
 * How full a goal's card is today. Daily goals fill toward their target.
 * Weekly and monthly goals fill toward today's fair share (target / days in the period),
 * so a fulfilled day always reads as a full card.
 */
export function todayFill(goal: Goal, logs: Log[], now = new Date()): number {
  const p = goalProgress(goal, logs, now);
  if (goal.period === 'day' || goal.direction === 'less' || goal.target <= 0) return p.pct;
  if (p.reached) return 1;
  const days = goal.period === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const share = goal.target / days;
  return Math.min(1, dayAmount(goal.id, logs, now) / share);
}
