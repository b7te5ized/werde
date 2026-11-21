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
import { getLang, tr, locale } from '../i18n';

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
    else if (r === 'unsupported') setNotice(tr('Dieser Browser kann keine Erinnerungen zeigen. Füge werde auf dem iPhone zuerst zum Home-Bildschirm hinzu (Teilen, dann „Zum Home-Bildschirm“) und schalte es dort ein.', 'This browser cannot show reminders. On iPhone, add werde to your Home Screen first (Share, then “Add to Home Screen”) and turn it on there.'));
    else setNotice(tr('Mitteilungen sind für werde blockiert. Du kannst sie in den Browser- oder iPhone-Einstellungen erlauben.', 'Notifications are blocked for werde. You can allow them in your browser or iPhone settings.'));
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
      <header className="greet top"><h1>{tr('Einstellungen', 'Settings')}</h1></header>

      <section className="card settings">
        <h2>{tr('Ruhetag', 'Rest day')}</h2>
        <p className="muted small">{tr('Ein Ruhetag pausiert alle Ziele und Erinnerungen für diesen Tag.', 'A rest day pauses all goals and reminders for that day.')}</p>
        <button className="secondary" onClick={() => toggleRestDay(new Date())}>
          {restingToday ? tr('Ruhetag beenden', 'End rest day') : tr('Heute einen Ruhetag nehmen', 'Take a rest day today')}
        </button>
        <div className="setting-row">
          <span>{tr('Ruhetag planen', 'Plan a rest day')}</span>
          <span className="row">
            <input type="date" min={tomorrowISO} value={planDay} aria-label={tr('Datum für den Ruhetag', 'Date for the rest day')}
              onChange={(e) => setPlanDay(e.target.value)} />
            <button className="secondary small-btn" disabled={!planDay}
              onClick={() => { const d = fromISO(planDay); if (!data.restDays.includes(dayKey(d))) toggleRestDay(d); setPlanDay(''); }}>
              {tr('Planen', 'Plan')}
            </button>
          </span>
        </div>
        {planned.length > 0 && (
          <ul className="rest-chips" aria-label={tr('Geplante Ruhetage', 'Planned rest days')}>
            {planned.map((d) => (
              <li key={d.getTime()}>
                <span aria-hidden="true">☾</span> {d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })}
                <button className="chip-x" aria-label={tr('Ruhetag entfernen', 'Remove rest day')} onClick={() => toggleRestDay(d)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card settings">
        <h2>Backup</h2>
        <p className="muted small">
          {sync === 'account' ? tr('Gespeichert in deinem Claude-Konto, privat nur für dich. Kein Tracking.', 'Saved in your Claude account, private to you. No tracking.')
            : sync === 'connecting' ? tr('Verbinde …', 'Connecting …') : tr('Deine Daten liegen nur in diesem Browser auf diesem Gerät. Sichere ab und zu eine Kopie, zum Beispiel in Dateien oder Google Drive. Wichtig: bevor du werde vom Home-Bildschirm löschst, zuerst eine Kopie sichern.', 'Your data lives only in this browser on this device. Save a backup now and then, for example to Files or Google Drive. Important: before you delete werde from your Home Screen, save a backup first.')}
        </p>
        {sync !== 'account' && s.lastBackupAt > s.firstOpenedAt && (
          <p className="muted small">{tr('Letzte Kopie:', 'Last backup:')} {new Date(s.lastBackupAt).toLocaleDateString(locale(), { day: 'numeric', month: 'long' })}</p>
        )}
        <div className="row">
          <button className="secondary" onClick={backup}>{tr('Kopie sichern', 'Save backup')}</button>
          <RestoreButton />
        </div>
        {!isStandalone() && (
          <p className="small home-hint">
            {tr('de', 'en') === 'en'
              ? <><b>iPhone:</b> in Safari tap <b>Share</b>, then <b>Add to Home Screen</b>. <b>Android:</b> in the browser menu <b>⋮</b> tap <b>Add to Home screen</b>. werde then opens like an app.</>
              : <><b>iPhone:</b> in Safari auf <b>Teilen</b>, dann <b>Zum Home-Bildschirm</b>. <b>Android:</b> im Browser-Menü <b>⋮</b> auf <b>Zum Startbildschirm hinzufügen</b>. Dann öffnet sich werde wie eine App.</>}
          </p>
        )}
      </section>

      <Notes />

      <section className="card settings">
        <div className="card-head"><h2>{tr('Themen', 'Themes')}</h2>
          {data.themes.length > 0 && <button type="button" className="text-btn" onClick={() => setEditThemes(!editThemes)}>{editThemes ? tr('Fertig', 'Done') : tr('Bearbeiten', 'Edit')}</button>}</div>
        {data.themes.length === 0 && <p className="muted">{tr('Noch keine Themen.', 'No themes yet.')}</p>}
        {data.themes.map((t) => editThemes ? (
          <button key={t.id} className="theme-row editing" onClick={() => onEditTheme(t)} aria-label={tr(`${t.name} bearbeiten`, `Edit ${t.name}`)}>
            <span className="theme-icon" style={{ background: PALETTE[t.color].soft }}>{t.icon}</span>
            <span>{t.name}</span>
            <svg className="row-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : (
          <div key={t.id} className="theme-row">
            <span className="theme-icon" style={{ background: PALETTE[t.color].soft }}>{t.icon}</span>
            <span>{t.name}</span>
            <span className="muted">{data.goals.filter((g) => g.themeId === t.id).length} {tr('Ziele', 'goals')}</span>
          </div>
        ))}
      </section>

      <section className="card settings">
        <h2>{tr('Benachrichtigungen', 'Notifications')}</h2>
        <label className="toggle">
          <span>{tr('Erinnerungen', 'Reminders')}</span>
          <input type="checkbox" checked={s.remindersOn} onChange={(e) => toggleReminders(e.target.checked)} />
        </label>
        {notice && <p className="notice small" role="status">{notice}</p>}
        <label className="setting-row">
          <span>{tr('Erinnern nach', 'Remind after')}</span>
          <span className="row">
            <input className="num" type="number" min={1} max={24} value={s.reminderHours}
              onChange={(e) => saveSettings({ reminderHours: Math.max(1, Math.min(24, Number(e.target.value) || 5)) })} />
            <span className="unit-hint">{tr('Stunden ohne Eintrag', 'hours without an entry')}</span>
          </span>
        </label>
        <div className="setting-row">
          <span>{tr('Ruhezeit von', 'Quiet time from')}</span>
          <span className="row">
            <input type="time" value={s.quietStart} onChange={(e) => saveSettings({ quietStart: e.target.value })} aria-label={tr('Ruhezeit beginnt', 'Quiet time starts')} />
            <span className="unit-hint">{tr('bis', 'to')}</span>
            <input type="time" value={s.quietEnd} onChange={(e) => saveSettings({ quietEnd: e.target.value })} aria-label={tr('Ruhezeit endet', 'Quiet time ends')} />
          </span>
        </div>
      </section>

      <section className="card settings">
        <h2>{tr('Erscheinungsbild', 'Appearance')}</h2>
        <Segmented label={tr('Erscheinungsbild', 'Appearance')} value={s.skyMode} onChange={(skyMode) => saveSettings({ skyMode })}
          options={[{ value: 'light', label: tr('Hell', 'Light') }, { value: 'dark', label: tr('Dunkel', 'Dark') }, { value: 'auto', label: tr('Tageszyklus', 'Day cycle') }]} />
        <p className="muted small">{s.skyMode === 'auto' ? tr('Tagsüber die hellen Farben, ab 21 Uhr die dunklen.', 'Light colours by day, dark ones from 9 pm.') : s.skyMode === 'dark' ? tr('Immer die dunklen Farben.', 'Always the dark colours.') : tr('Immer die hellen Farben.', 'Always the light colours.')}</p>
        {s.skyMode !== 'dark' && <WorldPicker title={tr('Farben hell', 'Light colours')} worlds={LIGHT_WORLDS} value={s.lightWorld ?? 'creme'} onChange={(lightWorld) => saveSettings({ lightWorld })} />}
        {s.skyMode !== 'light' && <WorldPicker title={tr('Farben dunkel', 'Dark colours')} worlds={DARK_WORLDS} value={s.darkWorld ?? 'espresso'} onChange={(darkWorld) => saveSettings({ darkWorld })} />}
        <FontPicker title={tr('Schrift für Überschriften', 'Font for headings')} fonts={HEAD_FONTS} value={s.fontHead ?? 'fraunces'} onChange={(fontHead) => saveSettings({ fontHead })} />
        <FontPicker title={tr('Schrift für Text', 'Font for text')} fonts={BODY_FONTS} value={s.fontBody ?? 'figtree'} onChange={(fontBody) => saveSettings({ fontBody })} />
        <label className="toggle">
          <span>{tr('Direkt mit dem Schnelleintrag starten', 'Open straight into quick log')}</span>
          <input type="checkbox" checked={s.openInQuickLog} onChange={(e) => saveSettings({ openInQuickLog: e.target.checked })} />
        </label>
      </section>

      <section className="card settings">
        <div className="card-head"><h2>{tr('Begrüssungen & Sprüche', 'Greetings & quotes')}</h2>
          <button type="button" className="text-btn" onClick={() => setTextsOpen(true)}>{tr('Bearbeiten', 'Edit')}</button></div>
        <p className="muted small">{data.texts ? tr('Deine eigenen Texte.', 'Your own texts.') : tr('Schreib eigene Begrüssungen und Sprüche oder ändere die bestehenden.', 'Write your own greetings and quotes or change the existing ones.')}</p>
      </section>

      <section className="card settings">
        <h2>{tr('Über dich', 'About you')}</h2>
        <div className="setting-row">
          <span>{tr('Sprache', 'Language')}</span>
          <Segmented label={tr('Sprache', 'Language')} value={getLang()} onChange={(lang) => saveSettings({ lang })}
            options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }]} />
        </div>
        <label className="setting-row">
          <span>{tr('Name', 'Name')}</span>
          <input className="name-input" type="text" value={s.name} maxLength={30} placeholder={tr('Wie heißt du?', 'What is your name?')}
            autoComplete="given-name" onChange={(e) => saveSettings({ name: e.target.value })} />
        </label>
        <div className="setting-row">
          <span>{tr('Pronomen', 'Pronouns')}</span>
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
