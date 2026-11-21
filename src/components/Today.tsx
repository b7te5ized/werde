import { dayKey } from '../progress';
import { useEffect, useState } from 'react';
import { pickGreeting, pickQuote, slotFor } from '../greetings';
import { GreetIcon } from './GreetIcon';
import { useStore } from '../store';
import type { Goal, Theme } from '../types';
import { backupDue, exportData, POSTPONE_TO } from '../backup';
import type { Sky } from '../sky';
import { ThemeList } from './ThemeList';
import { RestoreButton } from './RestoreButton';

interface Props {
  sky: Sky;
  onQuickLog: () => void;
  onNewGoal: (themeId?: string) => void;
  onOpenGoal: (g: Goal) => void;
  onEditTheme: (t: Theme) => void;
}

export function Today({ sky, onQuickLog, onNewGoal, onOpenGoal, onEditTheme }: Props) {
  const { data, sync, toggleRestDay, saveSettings } = useStore();
  const inClaude = !!(window as unknown as { claude?: { use?: unknown } }).claude?.use;
  const resting = data.restDays.includes(dayKey(new Date()));
  const now = new Date();
  const pronoun = data.settings.pronoun;
  const nm = data.settings.name;
  const [greet, setGreet] = useState(() => pickGreeting(now, nm, pronoun, data.texts));
  const [quote, setQuote] = useState(() => pickQuote(nm, pronoun, data.texts));
  // A fresh line each time werde is opened again, and when the time of day changes.
  useEffect(() => { setGreet(pickGreeting(new Date(), nm, pronoun, data.texts)); setQuote(pickQuote(nm, pronoun, data.texts)); }, [nm, pronoun, data.texts]);
  useEffect(() => {
    let slot = slotFor(new Date());
    const again = () => { if (document.visibilityState === 'visible') { setGreet(pickGreeting(new Date(), nm, pronoun, data.texts)); setQuote(pickQuote(nm, pronoun, data.texts)); } };
    const tick = window.setInterval(() => { const s = slotFor(new Date()); if (s !== slot) { slot = s; again(); } }, 60_000);
    document.addEventListener('visibilitychange', again);
    return () => { document.removeEventListener('visibilitychange', again); window.clearInterval(tick); };
  }, [nm, pronoun, data.texts]);
  const active = data.goals.filter((g) => !g.paused);
  const showBackup = sync === 'local' && !inClaude && backupDue(data);

  return (
    <main className="view">
      <header className="greet top">
        <div className="greet-row">
          <h1 className={greet.text.length > 26 ? 'long' : undefined}>{headOf(greet.text)}<span className="nowrap">{tailOf(greet.text)}<GreetIcon key={greet.text} kind={greet.icon} /></span></h1>
          {active.length > 0 && <button className="secondary small-btn" onClick={onQuickLog}>Erfassen</button>}
        </div>
        <p className="quote" key={quote}>{quote}</p>
      </header>

      {sync === 'local' && inClaude && (
        <section className="card save-note" role="status">
          <p><b>Wird nicht dauerhaft gespeichert.</b> Melde dich bei Claude an und öffne werde über einen persönlichen Einladungslink, damit deine Einträge in deinem Konto bleiben.</p>
        </section>
      )}
      {showBackup && (
        <section className="card backup-note" role="status">
          <p>Deine Einträge liegen nur auf diesem Gerät. Magst du eine Kopie sichern?</p>
          <div className="row">
            <button className="secondary small-btn" onClick={async () => { if (await exportData(data)) saveSettings({ lastBackupAt: Date.now() }); }}>Kopie sichern</button>
            <button className="text-btn" onClick={() => saveSettings({ backupSnoozeUntil: POSTPONE_TO() })}>Später</button>
          </div>
        </section>
      )}
      {resting && (
        <section className="card rest-banner" role="status">
          <span aria-hidden="true" style={{ fontSize: 26 }}>🌙</span>
          <p>Heute ist Ruhetag.</p>
          <button className="text-btn" onClick={() => toggleRestDay(new Date())}>Beenden</button>
        </section>
      )}
      {data.themes.length === 0 ? (
        <section className="empty card">
          <h2>Das ist deine Lichtung</h2>
          <p>Noch keine Ziele.</p>
          <button className="primary" onClick={() => onNewGoal()}>+ Ziel setzen</button>
          {!inClaude && <RestoreButton className="text-btn" label="Ich habe eine Sicherung" />}
        </section>
      ) : (
        <>
          <ThemeList onOpenGoal={onOpenGoal} />
          <button className="primary ghost" onClick={() => onNewGoal()}>+ Ziel setzen</button>
        </>
      )}
    </main>
  );
}

/** Keep the last word and its little mark together on one line. */
const cut = (t: string) => t.lastIndexOf(' ') + 1;
const headOf = (t: string) => t.slice(0, cut(t));
const tailOf = (t: string) => t.slice(cut(t));
