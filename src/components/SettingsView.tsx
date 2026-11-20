import { useRef, useState } from 'react';
import { enableNotifications } from '../useReminders';
import { isStandalone } from '../pwa';
import { dayKey } from '../progress';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import type { Data, Theme } from '../types';

export function SettingsView({ onEditTheme }: { onEditTheme: (t: Theme) => void }) {
  const { data, sync, saveSettings, replaceAll, toggleRestDay } = useStore();
  const restingToday = data.restDays.includes(dayKey(new Date()));
  const s = data.settings;
  const file = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');

  const toggleReminders = async (on: boolean) => {
    if (!on) { saveSettings({ remindersOn: false }); setNotice(''); return; }
    const r = await enableNotifications();
    if (r === 'granted') { saveSettings({ remindersOn: true, lastNudgeAt: Date.now() }); setNotice(''); }
    else if (r === 'unsupported') setNotice('Dieser Browser kann keine Erinnerungen zeigen. Füge werde auf dem iPhone zuerst zum Home-Bildschirm hinzu (Teilen, dann „Zum Home-Bildschirm“) und schalte es dort ein.');
    else setNotice('Mitteilungen sind für werde blockiert. Du kannst sie in den Browser- oder iPhone-Einstellungen erlauben.');
  };

  const exportData = async () => {
    const filename = `werde-${new Date().toISOString().slice(0, 10)}.json`;
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<{ save(o: { filename: string; data: string }): Promise<unknown> } | null> } };
    const dl = w.claude?.use ? await w.claude.use('downloads').catch(() => null) : null;
    if (dl) { try { await dl.save({ filename, data: JSON.stringify(data, null, 2) }); } catch { /* declined */ } return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as Data;
      if (Array.isArray(d.themes) && Array.isArray(d.goals) && Array.isArray(d.logs)) replaceAll(d);
    } catch { /* ignore invalid file */ }
  };

  return (
    <main className="view">
      <header className="greet top"><h1>Dein Raum</h1><p>Hier entscheidest du.</p></header>

      <section className="card settings">
        <h2>Sanfte Erinnerungen</h2>
        <label className="toggle">
          <span>Erinnere mich sanft</span>
          <input type="checkbox" checked={s.remindersOn} onChange={(e) => toggleReminders(e.target.checked)} />
        </label>
        {notice && <p className="notice small" role="status">{notice}</p>}
        <label className="setting-row">
          <span>Erinnern nach</span>
          <span className="row">
            <input className="num" type="number" min={1} max={24} value={s.reminderHours}
              onChange={(e) => saveSettings({ reminderHours: Math.max(1, Math.min(24, Number(e.target.value) || 5)) })} />
            <span className="unit-hint">Stunden ohne Eintrag</span>
          </span>
        </label>
        <div className="setting-row">
          <span>Ruhezeit von</span>
          <span className="row">
            <input type="time" value={s.quietStart} onChange={(e) => saveSettings({ quietStart: e.target.value })} aria-label="Ruhezeit beginnt" />
            <span className="unit-hint">bis</span>
            <input type="time" value={s.quietEnd} onChange={(e) => saveSettings({ quietEnd: e.target.value })} aria-label="Ruhezeit endet" />
          </span>
        </div>
      </section>

      <section className="card settings">
        <h2>Auf deinem Home-Bildschirm</h2>
        {!isStandalone() && (
          <p className="small home-hint">
            Öffne werde auf dem iPhone in Safari, tippe auf <b>Teilen</b> und dann auf <b>Zum Home-Bildschirm</b>. Dann öffnet es sich wie eine App und funktioniert offline.
          </p>
        )}
        <label className="toggle">
          <span>Direkt mit „Schnell notieren“ starten</span>
          <input type="checkbox" checked={s.openInQuickLog} onChange={(e) => saveSettings({ openInQuickLog: e.target.checked })} />
        </label>
      </section>

      <section className="card settings">
        <h2>Licht und Wetter</h2>
        <label className="toggle">
          <span>Farben folgen der Tageszeit</span>
          <input type="checkbox" checked={s.skyMode === 'auto'} onChange={(e) => saveSettings({ skyMode: e.target.checked ? 'auto' : 'light' })} />
        </label>
        <label className="toggle">
          <span>Wetter im Himmel zeigen</span>
          <input type="checkbox" checked={s.weatherOn} onChange={(e) => saveSettings({ weatherOn: e.target.checked })} />
        </label>
        <p className="muted small">Nutzt deinen ungefähren Standort, auf etwa 10 km genau.</p>
      </section>

      <section className="card settings">
        <h2>Ruhe</h2>
        <p className="muted small">Ein Ruhetag pausiert alle Ziele und Erinnerungen bis morgen.</p>
        <button className="secondary" onClick={() => toggleRestDay(new Date())}>
          {restingToday ? 'Ruhetag beenden' : 'Heute einen Ruhetag nehmen'}
        </button>
      </section>

      <section className="card settings">
        <h2>Momente</h2>
        <label className="toggle">
          <span>Feiern, wenn ein Ziel aufblüht</span>
          <input type="checkbox" checked={s.celebrations} onChange={(e) => saveSettings({ celebrations: e.target.checked })} />
        </label>
        <label className="toggle">
          <span>Ein Atemmoment nach dem Notieren</span>
          <input type="checkbox" checked={s.breathingMoment} onChange={(e) => saveSettings({ breathingMoment: e.target.checked })} />
        </label>
      </section>

      <section className="card settings">
        <h2>Themen</h2>
        {data.themes.length === 0 && <p className="muted">Noch keine Themen.</p>}
        {data.themes.map((t) => (
          <button key={t.id} className="theme-row" onClick={() => onEditTheme(t)}>
            <span className="theme-icon" style={{ background: PALETTE[t.color].soft }}>{t.icon}</span>
            <span>{t.name}</span>
            <span className="muted">{data.goals.filter((g) => g.themeId === t.id).length} Ziele</span>
          </button>
        ))}
      </section>

      <section className="card settings">
        <h2>Deine Daten</h2>
        <p className="muted small">
          {sync === 'account' ? 'Gespeichert in deinem Claude-Konto, privat nur für dich. Kein Tracking.'
            : sync === 'connecting' ? 'Verbinde …' : 'Alles bleibt auf diesem Gerät. Kein Konto, kein Tracking.'}
        </p>
        <div className="row">
          <button className="secondary" onClick={exportData}>Kopie sichern</button>
          <button className="secondary" onClick={() => file.current?.click()}>Kopie zurückholen</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
      </section>
    </main>
  );
}
