import { useState } from 'react';
import type { Goal } from '../types';
import { PALETTE } from '../palette';
import { fmt, goalProgress, logsInPeriod, PERIOD_LABEL, progressLabel } from '../progress';
import { useStore } from '../store';
import { Sheet } from './Sheet';
import { Fill } from './Fill';
import { categoryOf, cueText } from '../categories';
import { addDays, dayKey } from '../progress';
import { rhythm, UNIT_WORD } from '../consistency';

export function GoalDetail({ goal, onClose, onEdit }: { goal: Goal; onClose: () => void; onEdit: () => void }) {
  const { data, log, deleteLog, saveGoal, deleteGoal, toggleFreeze } = useStore();
  const theme = data.themes.find((t) => t.id === goal.themeId);
  const sw = PALETTE[theme?.color ?? 'meadow'];
  const p = goalProgress(goal, data.logs);
  const entries = logsInPeriod(goal, data.logs);
  const [amount, setAmount] = useState('');
  const n = Number(amount.replace(',', '.'));
  const r = rhythm(goal, data);
  const today = new Date();
  const yesterday = addDays(today, -1);
  const frozen = (d: Date) => data.freezes[goal.id]?.includes(dayKey(d)) ?? false;
  const [, many] = UNIT_WORD[goal.period];

  return (
    <Sheet title={goal.name} onClose={onClose}>
      <div className="detail-hero" role="img" aria-label={`${progressLabel(goal, p)} ${PERIOD_LABEL[goal.period]}`}>
        <Fill pct={p.pct} color={sw.base} category={categoryOf(goal)} />
        <div>
          <p className="detail-big" style={{ color: sw.ink }}>{Math.round(p.pct * 100)}%</p>
          <p>{progressLabel(goal, p)} {PERIOD_LABEL[goal.period]}</p>
          {r.streak >= 2 && !goal.paused && <p className="muted">🌱 {r.streak} {many} dabei</p>}
        </div>
      </div>
      {(goal.cue || goal.why) && (
        <div className="why-card">
          {goal.cue && <p className="muted">{cueText(goal.cue)}</p>}
          {goal.why && <p><b>Warum es dir wichtig ist:</b> {goal.why}</p>}
        </div>
      )}

      {!goal.paused && (
        <form className="row log-custom" onSubmit={(e) => { e.preventDefault(); if (n) { log(goal.id, n); setAmount(''); } }}>
          <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={fmt(goal.step)} aria-label={`Menge in ${goal.unit}`} />
          <span className="unit-hint">{goal.unit}</span>
          <button className="primary small" type="submit" disabled={!n}>Hinzufügen</button>
        </form>
      )}

      <h3 className="sub">Notiert {PERIOD_LABEL[goal.period]}</h3>
      {entries.length === 0 ? (
        <p className="muted">Noch nichts, und das ist in Ordnung.</p>
      ) : (
        <ul className="entries">
          {entries.map((l) => (
            <li key={l.id}>
              <span>{fmt(l.amount)} {goal.unit}</span>
              <span className="muted">{new Date(l.at).toLocaleString('de-DE', { weekday: goal.period === 'day' ? undefined : 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <button className="text-btn" onClick={() => deleteLog(l.id)} aria-label={`Eintrag ${fmt(l.amount)} ${goal.unit} entfernen`}>Entfernen</button>
            </li>
          ))}
        </ul>
      )}

      {goal.period === 'day' && !goal.paused && (
        <>
          <h3 className="sub">Ruhetage</h3>
          <div className="freeze-row">
            <button className="secondary" onClick={() => toggleFreeze(goal.id, today)}>{frozen(today) ? 'Heute doch nicht ruhen' : 'Heute ruhen'}</button>
            {(r.missedLast || frozen(yesterday)) && addDays(yesterday, 1).getTime() > goal.createdAt && (
              <button className="secondary" onClick={() => toggleFreeze(goal.id, yesterday)}>{frozen(yesterday) ? 'Gestern doch kein Ruhetag' : 'Gestern war ein Ruhetag'}</button>
            )}
          </div>
        </>
      )}

      <div className="detail-actions">
        <button className="secondary" onClick={onEdit}>Bearbeiten</button>
        <button className="secondary" onClick={() => saveGoal({ ...goal, paused: !goal.paused })}>
          {goal.paused ? 'Wieder aufnehmen' : 'Pausieren'}
        </button>
        <button className="secondary quiet" onClick={() => { deleteGoal(goal.id); onClose(); }}>Entfernen</button>
      </div>
    </Sheet>
  );
}
