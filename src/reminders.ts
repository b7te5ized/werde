import type { Settings } from './types';
import { dayKey } from './progress';

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** True when `now` falls inside the quiet window (which may cross midnight). */
export function inQuietWindow(now: Date, start: string, end: string): boolean {
  const m = now.getHours() * 60 + now.getMinutes();
  const s = toMin(start);
  const e = toMin(end);
  if (s === e) return false;
  return s < e ? m >= s && m < e : m >= s || m < e;
}

/**
 * The 5-hour rule: nudge only when nothing has been noted for `reminderHours`,
 * we are outside the quiet window, and we have not nudged since the last entry
 * (at most one nudge per quiet stretch, repeated only after another full interval).
 */
export function shouldNudge(now: Date, lastActivity: number, settings: Settings, restDays: string[] = []): boolean {
  if (!settings.remindersOn) return false;
  if (restDays.includes(dayKey(now))) return false;
  if (settings.restUntil > now.getTime()) return false;
  if (inQuietWindow(now, settings.quietStart, settings.quietEnd)) return false;
  const gap = settings.reminderHours * 3600_000;
  const since = Math.max(lastActivity, settings.lastNudgeAt);
  return now.getTime() - since >= gap;
}

export const NUDGES = [
  'Deine Wiese ist da, wann immer du bereit bist.',
  'Ein kleiner Moment für dich? werde ist offen.',
  'Keine Eile. Nur ein leises Hallo von deiner Lichtung.',
];

export async function showNudge(text: string): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const opts = { body: text, icon: './icon.svg', badge: './icon.svg', tag: 'werde-nudge', silent: true };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification('werde', opts);
    else new Notification('werde', opts);
    return true;
  } catch {
    return false;
  }
}
