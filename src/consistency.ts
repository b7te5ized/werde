import type { Data, Goal, Log } from './types';
import { addDays, dayKey, periodStart } from './progress';

/** Start and end of the period that lies `k` periods before the current one. */
export function unitRange(goal: Goal, k: number, now = new Date()): [Date, Date] {
  const cur = periodStart(goal.period, now);
  if (goal.period === 'day') return [addDays(cur, -k), addDays(cur, -k + 1)];
  if (goal.period === 'week') return [addDays(cur, -7 * k), addDays(cur, -7 * k + 7)];
  return [new Date(cur.getFullYear(), cur.getMonth() - k, 1), new Date(cur.getFullYear(), cur.getMonth() - k + 1, 1)];
}

function sumBetween(goalId: string, logs: Log[], s: Date, e: Date): { amount: number; count: number } {
  let amount = 0, count = 0;
  const a = s.getTime(), b = e.getTime();
  for (const l of logs) if (l.goalId === goalId && l.at >= a && l.at < b) { amount += l.amount; count++; }
  return { amount, count };
}

export function meets(goal: Goal, amount: number): boolean {
  return goal.direction === 'more' ? amount >= goal.target : amount <= goal.target;
}

export function isFrozenDay(data: Pick<Data, 'restDays' | 'freezes'>, goalId: string, day: Date): boolean {
  const k = dayKey(day);
  return data.restDays.includes(k) || (data.freezes[goalId]?.includes(k) ?? false);
}

const createdDay = (g: Goal) => { const d = new Date(g.createdAt); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

export interface Rhythm {
  /** successful units in the current run; a run only ends after two misses in a row */
  streak: number;
  /** the previous day/week/month was missed (and not frozen) */
  missedLast: boolean;
  /** the current day/week/month already meets the goal */
  doneNow: boolean;
}

/**
 * "Never miss twice": one missed day (or week) never ends a run. Only two misses in a row do.
 * Frozen and rest days are skipped entirely. The current period can only add, never break.
 */
export function rhythm(goal: Goal, data: Pick<Data, 'logs' | 'restDays' | 'freezes'>, now = new Date()): Rhythm {
  const created = createdDay(goal).getTime();
  let streak = 0, misses = 0, missedLast = false, doneNow = false;
  for (let k = 0; k < 400; k++) {
    const [s, e] = unitRange(goal, k, now);
    if (e.getTime() <= created) break;
    const ok = meets(goal, sumBetween(goal.id, data.logs, s, e).amount);
    if (k === 0) { if (ok) { streak++; doneNow = true; } continue; }
    if (goal.period === 'day' && isFrozenDay(data, goal.id, s)) continue;
    if (ok) { streak++; misses = 0; }
    else {
      if (k === 1) missedLast = true;
      misses++;
      if (misses >= 2) break;
    }
  }
  return { streak, missedLast, doneNow };
}

export const UNIT_WORD: Record<Goal['period'], [string, string]> = { day: ['Tag', 'Tage'], week: ['Woche', 'Wochen'], month: ['Monat', 'Monate'] };

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

export interface MonthStats { eligible: number; tracked: number; reached: number; rested: number; periodsReached: number; periodsTotal: number }

/** How a month went for one goal, counted in days (and weeks for weekly goals). Never counts the future. */
export function monthStats(goal: Goal, data: Pick<Data, 'logs' | 'restDays' | 'freezes'>, month: Date, now = new Date()): MonthStats {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const created = createdDay(goal);
  let eligible = 0, tracked = 0, reached = 0, rested = 0;
  for (let d = new Date(first); d <= last && d <= today; d = addDays(d, 1)) {
    if (d < created) continue;
    if (isFrozenDay(data, goal.id, d)) { rested++; continue; }
    eligible++;
    const { amount, count } = sumBetween(goal.id, data.logs, d, addDays(d, 1));
    if (count > 0) tracked++;
    if (goal.period === 'day' && (goal.direction === 'more' ? amount >= goal.target : count > 0 && amount <= goal.target)) reached++;
  }
  let periodsReached = 0, periodsTotal = 0;
  if (goal.period === 'week') {
    // a week belongs to the month its Sunday falls in
    for (let ws = periodStart('week', first); ws <= last; ws = addDays(ws, 7)) {
      const sunday = addDays(ws, 6);
      if (sunday.getMonth() !== month.getMonth() || sunday < created || ws > today) continue;
      periodsTotal++;
      if (meets(goal, sumBetween(goal.id, data.logs, ws, addDays(ws, 7)).amount)) periodsReached++;
    }
  } else if (goal.period === 'month' && first <= today) {
    periodsTotal = 1;
    if (meets(goal, sumBetween(goal.id, data.logs, first, addDays(last, 1)).amount)) periodsReached = 1;
  }
  return { eligible, tracked, reached, rested, periodsReached, periodsTotal };
}
