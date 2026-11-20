import { dayKey, greeting } from '../progress';
import { goalProgress } from '../progress';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import type { Goal, Theme } from '../types';
import { Meadow, SeedlingEmpty } from './Art';
import { WEATHER_WORDS, type Sky } from '../sky';
import { GoalCard } from './GoalCard';

interface Props {
  sky: Sky;
  onQuickLog: () => void;
  onNewGoal: (themeId?: string) => void;
  onOpenGoal: (g: Goal) => void;
  onEditTheme: (t: Theme) => void;
}

export function Today({ sky, onQuickLog, onNewGoal, onOpenGoal, onEditTheme }: Props) {
  const { data, sync, toggleRestDay } = useStore();
  const inClaude = !!(window as unknown as { claude?: { use?: unknown } }).claude?.use;
  const resting = data.restDays.includes(dayKey(new Date()));
  const now = new Date();
  const h = now.getHours();
  const active = data.goals.filter((g) => !g.paused);
  const bloomed = active.filter((g) => g.direction === 'more' && goalProgress(g, data.logs).reached).length;
  const mood = h >= 22 || h < 6 ? 'sleepy' : bloomed > 0 ? 'happy' : 'calm';

  return (
    <main className="view">
      <section className="clearing">
        <Meadow mood={mood} phase={sky.phase} weather={sky.weather} />
      </section>
      <header className="greet">
        <div className="greet-row">
          <h1>{greeting(now)}</h1>
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
      {resting && (
        <section className="card rest-banner" role="status">
          <span aria-hidden="true" style={{ fontSize: 26 }}>🌙</span>
          <p>Ruhetag. Nichts geht verloren.</p>
          <button className="text-btn" onClick={() => toggleRestDay(new Date())}>End</button>
        </section>
      )}
      {data.themes.length === 0 ? (
        <section className="empty card">
          <SeedlingEmpty />
          <h2>Das ist deine Lichtung</h2>
          <p>Hier ist nichts für dich vorgegeben. Pflanze ein erstes Ziel, mit deinen Worten und deinem Maß.</p>
          <button className="primary" onClick={() => onNewGoal()}>Ziel pflanzen</button>
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
