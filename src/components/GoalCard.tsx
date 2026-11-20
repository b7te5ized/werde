import type { Goal, Theme } from '../types';
import { PALETTE } from '../palette';
import { fmt, goalProgress, PERIOD_LABEL, progressLabel, todayFill } from '../progress';
import { useStore } from '../store';
import { rhythm, UNIT_WORD } from '../consistency';
import { categoryOf } from '../categories';
import { Fill } from './Fill';
import { cueText } from '../categories';

export function GoalCard({ goal, theme, onOpen }: { goal: Goal; theme: Theme; onOpen: () => void }) {
  const { data, log } = useStore();
  const sw = PALETTE[theme.color];
  const p = goalProgress(goal, data.logs);
  const label = progressLabel(goal, p);
  const r = rhythm(goal, data);
  const reached = goal.direction === 'more' && p.reached;

  return (
    <article className="goal-wrap">
      <div className={`goal-card${goal.paused ? ' paused' : ''}${reached ? ' reached' : ''}`}>
        <Fill pct={todayFill(goal, data.logs)} color={sw.base} category={categoryOf(goal)} />
        <button className="goal-main" onClick={onOpen}
          aria-label={`${goal.name}, ${label} ${PERIOD_LABEL[goal.period]}${r.streak >= 2 ? `, ${r.streak} ${UNIT_WORD[goal.period][1]} dabei` : ''}. Details öffnen`}>
          <span className="goal-name">{goal.name}</span>
          <span className="goal-meta">
            {fmt(p.amount)} / {fmt(goal.target)} {goal.unit}
            {goal.period !== 'day' && ` · ${PERIOD_LABEL[goal.period]}`}
            {!goal.paused && goal.direction === 'more' && r.streak >= 2 && <span className="streak"> · {r.streak} {UNIT_WORD[goal.period][1]}</span>}
          </span>
          {goal.cue && <span className="goal-cue">{cueText(goal.cue)}</span>}
        </button>
        {!goal.paused && (
          <button className="log-btn no-drag" onClick={() => log(goal.id, goal.step)} aria-label={`${fmt(goal.step)} ${goal.unit} zu ${goal.name} hinzufügen`}>
            +{fmt(goal.step)}
          </button>
        )}
      </div>
    </article>
  );
}
