import { useEffect } from 'react';
import { useStore } from './store';
import { NUDGES, shouldNudge, showNudge } from './reminders';

/** Checks the 5-hour rule every minute while werde is open or in the background. */
export function useReminders() {
  const { data, saveSettings } = useStore();
  const { settings, logs, restDays } = data;
  const lastLog = logs.reduce((m, l) => Math.max(m, l.at), 0);
  const lastActivity = Math.max(lastLog, settings.firstOpenedAt);

  useEffect(() => {
    if (!settings.remindersOn) return;
    const tick = async () => {
      const now = new Date();
      if (!shouldNudge(now, lastActivity, settings, restDays)) return;
      const ok = await showNudge(NUDGES[now.getDate() % NUDGES.length]);
      if (ok) saveSettings({ lastNudgeAt: now.getTime() });
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [settings, lastActivity, saveSettings, restDays]);
}

export async function enableNotifications(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const p = await Notification.requestPermission();
    return p === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
