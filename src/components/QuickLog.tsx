import { PALETTE } from '../palette';
import { fmt, goalProgress, PERIOD_LABEL, todayFill } from '../progress';
import { useStore } from '../store';
import { Fill } from './Fill';
import { categoryOf } from '../categories';
import { tr } from '../i18n';

/** A calm grid of big tiles: one tap notes one step. Made for the home-screen shortcut. */
export function QuickLog({ onClose }: { onClose: () => void }) {
  const { data, log } = useStore();
  const goals = data.goals.filter((g) => !g.paused);

  return (
    <main className="view quick">
      <header className="greet top quick-head">
        <div>
          <h1>{tr('Schnelleintrag', 'Quick log')}</h1>
        </div>
        <button className="secondary" onClick={onClose}>{tr('Fertig', 'Done')}</button>
      </header>
      {goals.length === 0 ? (
        <p className="card muted">{tr('Erstelle zuerst ein Ziel, dann erscheint es hier.', 'Set a goal first, then it shows up here.')}</p>
      ) : (
        <div className="quick-grid">
          {goals.map((g) => {
            const th = data.themes.find((t) => t.id === g.themeId);
            const sw = PALETTE[th?.color ?? 'meadow'];
            const p = goalProgress(g, data.logs);
            return (
              <button key={g.id} className="quick-tile" 
                onClick={() => { log(g.id, g.step); navigator.vibrate?.(12); }}
                aria-label={tr(`${fmt(g.step)} ${g.unit} zu ${g.name} hinzufügen. Jetzt ${fmt(p.amount)} von ${fmt(g.target)} ${PERIOD_LABEL[g.period]}`, `Add ${fmt(g.step)} ${g.unit} to ${g.name}. Now ${fmt(p.amount)} of ${fmt(g.target)} ${PERIOD_LABEL[g.period]}`)}>
                <Fill pct={todayFill(g, data.logs)} color={sw.base} category={categoryOf(g)} />
                <span className="quick-name">{g.name}</span>
                <span className="quick-meta">{fmt(p.amount)} / {fmt(g.target)} {g.unit}</span>
                <span className="quick-plus" aria-hidden="true">+{fmt(g.step)}</span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
