import { useState } from 'react';
import type { Goal } from '../types';
import { PALETTE } from '../palette';
import { fmt, goalProgress, logsInPeriod, PERIOD_LABEL, progressLabel } from '../progress';
import { useStore } from '../store';
import { Sheet } from './Sheet';
import { Fill } from './Fill';
import { categoryOf, cueText } from '../categories';
import { rhythm, UNIT_WORD } from '../consistency';

export function GoalDetail({ goal, onClose, onEdit }: { goal: Goal; onClose: () => void; onEdit: () => void }) {
  const { data, log, deleteLog, saveGoal, deleteGoal } = useStore();
  const theme = data.themes.find((t) => t.id === goal.themeId);
  const sw = PALETTE[theme?.color ?? 'meadow'];
  const p = goalProgress(goal, data.logs);
  const entries = logsInPeriod(goal, data.logs);
  const [amount, setAmount] = useState('');
  const n = Number(amount.replace(',', '.'));
  const r = rhythm(goal, data);
  const [, many] = UNIT_WORD[goal.period];

  return (
    <Sheet title={goal.name} onClose={onClose}>
      {goal.why && (
        <blockquote className="why-first">
          <span className="why-label">Warum?</span>
          {goal.why}
        </blockquote>
      )}
      <div className="detail-hero" role="img" aria-label={`${progressLabel(goal, p)} ${PERIOD_LABEL[goal.period]}`}>
        <Fill pct={p.pct} color={sw.base} category={categoryOf(goal)} />
        <div>
          <p className="detail-big">{Math.round(p.pct * 100)}%</p>
          <p>{progressLabel(goal, p)} {PERIOD_LABEL[goal.period]}</p>
          {r.streak >= 2 && !goal.paused && <p className="muted">🌱 {r.streak} {many} dabei</p>}
        </div>
      </div>
      {goal.cue && <p className="muted detail-cue">{cueText(goal.cue)}</p>}

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

      <div className="detail-actions">
        <button className="primary edit-btn" onClick={onEdit}>Bearbeiten</button>
        <button className="secondary" onClick={() => saveGoal({ ...goal, paused: !goal.paused })}>
          {goal.paused ? 'Wieder aufnehmen' : 'Pausieren'}
        </button>
        <button className="secondary quiet" onClick={() => { deleteGoal(goal.id); onClose(); }}>Entfernen</button>
      </div>
    </Sheet>
  );
}
