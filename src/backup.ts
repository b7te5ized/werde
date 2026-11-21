import type { Data } from './types';
import { tr } from './i18n';

/** Saves a JSON copy of everything. Uses the claude.ai downloads capability when present. */
export async function exportData(data: Data): Promise<boolean> {
  const filename = `werde-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(data, null, 2);
  const w = window as unknown as { claude?: { use?: (n: string) => Promise<{ save(o: { filename: string; data: string }): Promise<unknown> } | null> } };
  const dl = w.claude?.use ? await w.claude.use('downloads').catch(() => null) : null;
  if (dl) {
    try { await dl.save({ filename, data: json }); return true; } catch { return false; }
  }
  // Phones: the share sheet lets you save to Files / Drive or send it to yourself.
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (coarse && typeof navigator.canShare === 'function') {
    const file = new File([json], filename, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: tr('werde Sicherung', 'werde backup') }); return true; }
      catch (e) { if ((e as Error).name === 'AbortError') return false; /* fall back to download */ }
    }
  }
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return true;
}

const DAY = 86400_000;

/** Device-only data: invite a backup about once a month once there is something to keep. */
export function backupDue(data: Data, now = Date.now()): boolean {
  if (data.logs.length < 5 || now < data.settings.backupSnoozeUntil) return false;
  const since = Math.max(data.settings.lastBackupAt, data.settings.firstOpenedAt);
  return now - since > 30 * DAY;
}

/** "Später": ask again in about a week. */
export const POSTPONE_TO = (now = Date.now()) => now + 7 * DAY;

/** Reads a backup file. Returns null if it is not a werde copy. */
export async function readBackup(f: File): Promise<Data | null> {
  try {
    const d = JSON.parse(await f.text()) as Data;
    if (d && Array.isArray(d.themes) && Array.isArray(d.goals) && Array.isArray(d.logs)) return d;
  } catch { /* not JSON */ }
  return null;
}
