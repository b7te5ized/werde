import { useEffect, useState } from 'react';
import { RestoreButton } from './RestoreButton';
import { PronounPicker } from './Welcome';
import { Notes } from './Notes';
import { TextsEditor } from './TextsEditor';
import { BODY_FONTS, DARK_WORLDS, HEAD_FONTS, LIGHT_WORLDS, loadFonts, type ColorWorld, type FontChoice } from '../look';
import { Segmented } from './Sheet';
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
  const [textsOpen, setTextsOpen] = useState(false);
  const [editThemes, setEditThemes] = useState(false);

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
      <header className="greet top"><h1>Einstellungen</h1></header>

      <section className="card settings">
        <h2>Ruhetag</h2>
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
        <h2>Backup</h2>
        <p className="muted small">
          {sync === 'account' ? 'Gespeichert in deinem Claude-Konto, privat nur für dich. Kein Tracking.'
            : sync === 'connecting' ? 'Verbinde …' : 'Deine Daten liegen nur in diesem Browser auf diesem Gerät. Sichere ab und zu eine Kopie, zum Beispiel in Dateien oder Google Drive. Wichtig: bevor du werde vom Home-Bildschirm löschst, zuerst eine Kopie sichern.'}
        </p>
        {sync !== 'account' && s.lastBackupAt > s.firstOpenedAt && (
          <p className="muted small">Letzte Kopie: {new Date(s.lastBackupAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}</p>
        )}
        <div className="row">
          <button className="secondary" onClick={backup}>Kopie sichern</button>
          <RestoreButton label="Backup laden" />
        </div>
        {!isStandalone() && (
          <p className="small home-hint">
            <b>iPhone:</b> in Safari auf <b>Teilen</b>, dann <b>Zum Home-Bildschirm</b>. <b>Android:</b> im Browser-Menü <b>⋮</b> auf <b>Zum Startbildschirm hinzufügen</b>. Dann öffnet sich werde wie eine App.
          </p>
        )}
      </section>

      <Notes />

      <section className="card settings">
        <div className="card-head"><h2>Themen</h2>
          {data.themes.length > 0 && <button type="button" className="text-btn" onClick={() => setEditThemes(!editThemes)}>{editThemes ? 'Fertig' : 'Bearbeiten'}</button>}</div>
        {data.themes.length === 0 && <p className="muted">Noch keine Themen.</p>}
        {data.themes.map((t) => editThemes ? (
          <button key={t.id} className="theme-row editing" onClick={() => onEditTheme(t)} aria-label={`${t.name} bearbeiten`}>
            <span className="theme-icon" style={{ background: PALETTE[t.color].soft }}>{t.icon}</span>
            <span>{t.name}</span>
            <svg className="row-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : (
          <div key={t.id} className="theme-row">
            <span className="theme-icon" style={{ background: PALETTE[t.color].soft }}>{t.icon}</span>
            <span>{t.name}</span>
            <span className="muted">{data.goals.filter((g) => g.themeId === t.id).length} Ziele</span>
          </div>
        ))}
      </section>

      <section className="card settings">
        <h2>Benachrichtigungen</h2>
        <label className="toggle">
          <span>Erinnerungen</span>
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
        <h2>Erscheinungsbild</h2>
        <Segmented label="Erscheinungsbild" value={s.skyMode} onChange={(skyMode) => saveSettings({ skyMode })}
          options={[{ value: 'light', label: 'Hell' }, { value: 'dark', label: 'Dunkel' }, { value: 'auto', label: 'Tageszyklus' }]} />
        <p className="muted small">{s.skyMode === 'auto' ? 'Tagsüber die hellen Farben, ab 21 Uhr die dunklen.' : s.skyMode === 'dark' ? 'Immer die dunklen Farben.' : 'Immer die hellen Farben.'}</p>
        {s.skyMode !== 'dark' && <WorldPicker title="Farben hell" worlds={LIGHT_WORLDS} value={s.lightWorld ?? 'creme'} onChange={(lightWorld) => saveSettings({ lightWorld })} />}
        {s.skyMode !== 'light' && <WorldPicker title="Farben dunkel" worlds={DARK_WORLDS} value={s.darkWorld ?? 'espresso'} onChange={(darkWorld) => saveSettings({ darkWorld })} />}
        <FontPicker title="Schrift für Überschriften" fonts={HEAD_FONTS} value={s.fontHead ?? 'fraunces'} onChange={(fontHead) => saveSettings({ fontHead })} />
        <FontPicker title="Schrift für Text" fonts={BODY_FONTS} value={s.fontBody ?? 'figtree'} onChange={(fontBody) => saveSettings({ fontBody })} />
        <label className="toggle">
          <span>Direkt mit „Erfassen“ starten</span>
          <input type="checkbox" checked={s.openInQuickLog} onChange={(e) => saveSettings({ openInQuickLog: e.target.checked })} />
        </label>
      </section>

      <section className="card settings">
        <div className="card-head"><h2>Begrüssungen & Sprüche</h2>
          <button type="button" className="text-btn" onClick={() => setTextsOpen(true)}>Bearbeiten</button></div>
        <p className="muted small">{data.texts ? 'Deine eigenen Texte.' : 'Schreib eigene Begrüssungen und Sprüche oder ändere die bestehenden.'}</p>
      </section>

      <section className="card settings">
        <h2>Über dich</h2>
        <label className="setting-row">
          <span>Name</span>
          <input className="name-input" type="text" value={s.name} maxLength={30} placeholder="Wie heißt du?"
            autoComplete="given-name" onChange={(e) => saveSettings({ name: e.target.value })} />
        </label>
        <div className="setting-row">
          <span>Pronomen</span>
          <PronounPicker value={s.pronoun} custom={s.customPronoun}
            onChange={(pronoun) => saveSettings({ pronoun })} onCustom={(customPronoun) => saveSettings({ customPronoun })} />
        </div>
      </section>

    {textsOpen && <TextsEditor onClose={() => setTextsOpen(false)} />}
    </main>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

function WorldPicker({ title, worlds, value, onChange }: { title: string; worlds: ColorWorld[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="setting-row">
      <span>{title}</span>
      <div className="world-row" role="radiogroup" aria-label={title}>
        {worlds.map((w) => (
          <button key={w.id} type="button" role="radio" aria-checked={value === w.id} className={`world${value === w.id ? ' on' : ''}`} onClick={() => onChange(w.id)}>
            <span className="world-swatch" style={{ background: w.swatch[0] }} aria-hidden="true">
              <i style={{ background: w.swatch[1] }} /><i style={{ background: w.swatch[2] }} />
            </span>
            <span>{w.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FontPicker({ title, fonts, value, onChange }: { title: string; fonts: FontChoice[]; value: string; onChange: (id: string) => void }) {
  useEffect(() => loadFonts(fonts), [fonts]);
  return (
    <div className="setting-row">
      <span>{title}</span>
      <div className="font-row" role="radiogroup" aria-label={title}>
        {fonts.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={value === f.id} className={`chip${value === f.id ? ' on' : ''}`}
            style={{ fontFamily: f.css }} onClick={() => onChange(f.id)}>{f.label}</button>
        ))}
      </div>
    </div>
  );
}
