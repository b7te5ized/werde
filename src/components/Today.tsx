import { dayKey } from '../progress';
import { useEffect, useState } from 'react';
import { pickGreeting, slotFor } from '../greetings';
import { GreetIcon } from './GreetIcon';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import type { Goal, Theme } from '../types';
import { Meadow, SeedlingEmpty } from './Art';
import { backupDue, exportData, POSTPONE_TO } from '../backup';
import { WEATHER_WORDS, type Sky } from '../sky';
import { GoalCard } from './GoalCard';
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
  const [greet, setGreet] = useState(() => pickGreeting(now, nm, pronoun));
  // A fresh line each time werde is opened again, and when the time of day changes.
  useEffect(() => { setGreet(pickGreeting(new Date(), nm, pronoun)); }, [nm, pronoun]);
  useEffect(() => {
    let slot = slotFor(new Date());
    const again = () => { if (document.visibilityState === 'visible') setGreet(pickGreeting(new Date(), nm, pronoun)); };
    const tick = window.setInterval(() => { const s = slotFor(new Date()); if (s !== slot) { slot = s; again(); } }, 60_000);
    document.addEventListener('visibilitychange', again);
    return () => { document.removeEventListener('visibilitychange', again); window.clearInterval(tick); };
  }, [nm, pronoun]);
  const active = data.goals.filter((g) => !g.paused);
  const showBackup = sync === 'local' && !inClaude && backupDue(data);

  return (
    <main className="view">
      <section className="clearing">
        <Meadow phase={sky.phase} weather={sky.weather} />
      </section>
      <header className="greet">
        <div className="greet-row">
          <h1 className={greet.text.length > 26 ? 'long' : undefined}>{headOf(greet.text)}<span className="nowrap">{tailOf(greet.text)}<GreetIcon key={greet.text} kind={greet.icon} /></span></h1>
          {active.length > 0 && <button className="secondary small-btn" onClick={onQuickLog}>Schnell notieren</button>}
        </div>
        <p>
          {now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          {sky.weather && <> · {sky.temp !== null && `${sky.temp} °C, `}{WEATHER_WORDS[sky.weather]}</>}
        </p>
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
          <p>Ruhetag. Nichts geht verloren.</p>
          <button className="text-btn" onClick={() => toggleRestDay(new Date())}>Beenden</button>
        </section>
      )}
      {data.themes.length === 0 ? (
        <section className="empty card">
          <SeedlingEmpty />
          <h2>Das ist deine Lichtung</h2>
          <p>Hier ist nichts für dich vorgegeben. Pflanze ein erstes Ziel, mit deinen Worten und deinem Maß.</p>
          <button className="primary" onClick={() => onNewGoal()}>Ziel pflanzen</button>
          {!inClaude && <RestoreButton className="text-btn" label="Ich habe eine Sicherung" />}
        </section>
      ) : (
        <>
          {data.themes.map((th) => {
            const goals = data.goals.filter((g) => g.themeId === th.id);
            const sw = PALETTE[th.color];
            return (
              <section key={th.id} className="theme-block">
                <button className="theme-head" onClick={() => onEditTheme(th)} aria-label={`Thema ${th.name} bearbeiten`}>
                  <span className="theme-icon" style={{ background: sw.soft }}>{th.icon}</span>
                  <span className="theme-name">{th.name}</span>
                </button>
                {goals.length === 0 && <p className="muted pad">Hier gibt es noch keine Ziele.</p>}
                {goals.map((g) => <GoalCard key={g.id} goal={g} theme={th} onOpen={() => onOpenGoal(g)} />)}
              </section>
            );
          })}
          <button className="primary ghost" onClick={() => onNewGoal()}>Ziel pflanzen</button>
        </>
      )}
    </main>
  );
}

/** Keep the last word and its little mark together on one line. */
const cut = (t: string) => t.lastIndexOf(' ') + 1;
const headOf = (t: string) => t.slice(0, cut(t));
const tailOf = (t: string) => t.slice(cut(t));
