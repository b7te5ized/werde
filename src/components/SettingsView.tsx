import { useState } from 'react';
import { RestoreButton } from './RestoreButton';
import { PronounPicker } from './Welcome';
import { Notes } from './Notes';
import { enableNotifications } from '../useReminders';
import { isStandalone } from '../pwa';
import { dayKey } from '../progress';
import { exportData } from '../backup';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import type { Theme } from '../types';

export function SettingsView({ onEditTheme }: { onEditTheme: (t: Theme) => void }) {
  const { data, sync, saveSettings, toggleRestDay } = useStore();
  const restingToday = data.restDays.includes(dayKey(new Date()));
  const s = data.settings;
  const [notice, setNotice] = useState('');

  const toggleReminders = async (on: boolean) => {
    if (!on) { saveSettings({ remindersOn: false }); setNotice(''); return; }
    const r = await enableNotifications();
    if (r === 'granted') { saveSettings({ remindersOn: true, lastNudgeAt: Date.now() }); setNotice(''); }
    else if (r === 'unsupported') setNotice('Dieser Browser kann keine Erinnerungen zeigen. Füge werde auf dem iPhone zuerst zum Home-Bildschirm hinzu (Teilen, dann „Zum Home-Bildschirm“) und schalte es dort ein.');
    else setNotice('Mitteilungen sind für werde blockiert. Du kannst sie in den Browser- oder iPhone-Einstellungen erlauben.');
  };

  const backup = async () => {
    if (await exportData(data)) saveSettings({ lastBackupAt: Date.now() });
  };
  const [planDay, setPlanDay] = useState('');
    const tomorrowISO = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return toISO(t); })();
  const planned = data.restDays
    .map(fromKey)
    .filter((d) => d.getTime() > new Date(new Date().toDateString()).getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  return (
    <main className="view">
      <header className="greet top"><h1>Dein Raum</h1><p>Hier entscheidest du.</p></header>

      <Notes />

      <section className="card settings">
        <label className="setting-row">
          <span>Dein Name</span>
          <input className="name-input" type="text" value={s.name} maxLength={30} placeholder="Wie heißt du?"
            autoComplete="given-name" onChange={(e) => saveSettings({ name: e.target.value })} />
        </label>
        <div className="setting-row">
          <span>Deine Pronomen</span>
          <PronounPicker value={s.pronoun} custom={s.customPronoun}
            onChange={(pronoun) => saveSettings({ pronoun })} onCustom={(customPronoun) => saveSettings({ customPronoun })} />
        </div>
      </section>

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
            <b>iPhone:</b> in Safari auf <b>Teilen</b>, dann <b>Zum Home-Bildschirm</b>. <b>Android:</b> im Browser-Menü <b>⋮</b> auf <b>Zum Startbildschirm hinzufügen</b> oder <b>App installieren</b>. Dann öffnet sich werde wie eine App, funktioniert offline und deine Daten bleiben sicherer erhalten.
          </p>
        )}
        <label className="toggle">
          <span>Direkt mit „Schnell notieren“ starten</span>
          <input type="checkbox" checked={s.openInQuickLog} onChange={(e) => saveSettings({ openInQuickLog: e.target.checked })} />
        </label>
      </section>

      <section className="card settings">
        <h2>Licht</h2>
        <label className="toggle">
          <span>Farben folgen der Tageszeit</span>
          <input type="checkbox" checked={s.skyMode === 'auto'} onChange={(e) => saveSettings({ skyMode: e.target.checked ? 'auto' : 'light' })} />
        </label>
      </section>

      <section className="card settings">
        <h2>Ruhe</h2>
        <p className="muted small">Ein Ruhetag pausiert alle Ziele und Erinnerungen für diesen Tag.</p>
        <button className="secondary" onClick={() => toggleRestDay(new Date())}>
          {restingToday ? 'Ruhetag beenden' : 'Heute einen Ruhetag nehmen'}
        </button>
        <div className="setting-row">
          <span>Ruhetag planen</span>
          <span className="row">
            <input type="date" min={tomorrowISO} value={planDay} aria-label="Datum für den Ruhetag"
              onChange={(e) => setPlanDay(e.target.value)} />
            <button className="secondary small-btn" disabled={!planDay}
              onClick={() => { const d = fromISO(planDay); if (!data.restDays.includes(dayKey(d))) toggleRestDay(d); setPlanDay(''); }}>
              Planen
            </button>
          </span>
        </div>
        {planned.length > 0 && (
          <ul className="rest-chips" aria-label="Geplante Ruhetage">
            {planned.map((d) => (
              <li key={d.getTime()}>
                <span aria-hidden="true">☾</span> {d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                <button className="chip-x" aria-label="Ruhetag entfernen" onClick={() => toggleRestDay(d)}>×</button>
              </li>
            ))}
          </ul>
        )}
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
            : sync === 'connecting' ? 'Verbinde …' : 'Alles bleibt in diesem Browser auf diesem Gerät. Kein Konto, kein Tracking. Sichere ab und zu eine Kopie, zum Beispiel in Dateien oder Google Drive.'}
        </p>
        {sync !== 'account' && s.lastBackupAt > s.firstOpenedAt && (
          <p className="muted small">Letzte Kopie: {new Date(s.lastBackupAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}</p>
        )}
        <div className="row">
          <button className="secondary" onClick={backup}>Kopie sichern</button>
          <RestoreButton />
        </div>
      </section>
    </main>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
