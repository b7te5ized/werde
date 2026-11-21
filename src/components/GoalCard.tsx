import type { Goal, Theme } from '../types';
import { PALETTE } from '../palette';
import { fmt, goalProgress, PERIOD_LABEL, progressLabel, todayFill } from '../progress';
import { useStore } from '../store';
import { rhythm, UNIT_WORD } from '../consistency';
import { categoryOf } from '../categories';
import { Fill } from './Fill';
import { cueText } from '../categories';
import { tr } from '../i18n';

export function GoalCard({ goal, theme, onOpen }: { goal: Goal; theme: Theme; onOpen: () => void }) {
  const { data, log } = useStore();
  const sw = PALETTE[theme.color];
  const p = goalProgress(goal, data.logs);
  const label = progressLabel(goal, p);
  const r = rhythm(goal, data);
  const reached = goal.direction === 'more' && p.reached;

  return (
    <article className="goal-wrap">
      <div className={`goal-card${goal.paused ? ' paused' : ''}${reached ? ' reached' : ''}`}
        onClick={(e) => { if (!(e.target as HTMLElement).closest('.add-btn')) onOpen(); }}>
        <Fill pct={todayFill(goal, data.logs)} color={sw.base} category={categoryOf(goal)} />
        <div className="goal-main">
          <button className="goal-open"
            aria-label={`${goal.name}, ${label} ${PERIOD_LABEL[goal.period]}${r.streak >= 2 ? `, ${r.streak} ${UNIT_WORD[goal.period][1]}` : ''}. ${tr('Details öffnen', 'Open details')}`}>
            <span className="goal-name">{goal.name}</span>
          </button>
          <span className="goal-meta">
            <span className="goal-amount">
              {fmt(p.amount)} / {fmt(goal.target)} {goal.unit}
              {goal.period !== 'day' && ` / ${UNIT_WORD[goal.period][0]}`}
              {!goal.paused && goal.direction === 'more' && r.streak >= 2 && <span className="streak"> · {r.streak} {UNIT_WORD[goal.period][1]}</span>}
            </span>
            {!goal.paused && (
              <button className="add-btn no-drag" onClick={() => log(goal.id, goal.step)}
                aria-label={tr(`${fmt(goal.step)} ${goal.unit} zu ${goal.name} hinzufügen`, `Add ${fmt(goal.step)} ${goal.unit} to ${goal.name}`)}>
                + {fmt(goal.step)}<span className="add-unit"> {goal.unit}</span>
              </button>
            )}
          </span>
          {goal.cue && <span className="goal-cue">{cueText(goal.cue)}</span>}
        </div>
        <span className="goal-pct" aria-hidden="true">{Math.round(p.pct * 100)}%</span>
      </div>
    </article>
  );
}
