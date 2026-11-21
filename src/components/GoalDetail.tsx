import { useState } from 'react';
import type { Goal } from '../types';
import { PALETTE } from '../palette';
import { dayKey, fmt, goalProgress, logsInPeriod, PERIOD_LABEL, progressLabel } from '../progress';
import { useStore } from '../store';
import { Sheet } from './Sheet';
import { Fill } from './Fill';
import { categoryOf, cueText } from '../categories';
import { rhythm, UNIT_WORD } from '../consistency';

export function GoalDetail({ goal, onClose, onEdit }: { goal: Goal; onClose: () => void; onEdit: () => void }) {
  const { data, log, deleteLog, saveGoal, deleteGoal, setDayNote } = useStore();
  const theme = data.themes.find((t) => t.id === goal.themeId);
  const sw = PALETTE[theme?.color ?? 'meadow'];
  const p = goalProgress(goal, data.logs);
  const entries = logsInPeriod(goal, data.logs);
  const [amount, setAmount] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const n = Number(amount.replace(',', '.'));
  const r = rhythm(goal, data);
  const [, many] = UNIT_WORD[goal.period];
  const today = dayKey(new Date());
  const notes = data.dayNotes?.[goal.id] ?? {};
  const earlier = Object.entries(notes).filter(([k]) => k !== today).sort(([a], [b]) => (a < b ? 1 : -1));

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

      {noteOpen || notes[today] ? (
        <label className="day-note">
          <span>Tagesnotiz</span>
          <textarea rows={3} value={notes[today] ?? ''} placeholder="Ein paar Worte, nur für dich …" autoFocus={noteOpen && !notes[today]}
            onChange={(e) => setDayNote(goal.id, today, e.target.value)} />
        </label>
      ) : (
        <button type="button" className="secondary day-note-add" onClick={() => setNoteOpen(true)}>+ Tagesnotiz hinzufügen</button>
      )}

      {earlier.length > 0 && (
        <details className="entries-box">
          <summary>
            <span>Frühere Notizen</span>
            <span className="muted entries-count">{earlier.length}</span>
            <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </summary>
          <ul className="day-notes">
            {earlier.map(([k, text]) => {
              const [y, m, d] = k.split('-').map(Number);
              return (
                <li key={k}>
                  <span className="muted small">{new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                  <p>{text}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <details className="entries-box">
        <summary>
          <span>Einträge</span>
          <span className="muted entries-count">{entries.length > 0 ? `${entries.length} ${PERIOD_LABEL[goal.period]}` : PERIOD_LABEL[goal.period]}</span>
          <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </summary>
        {entries.length === 0 ? (
          <p className="muted entries-empty">Noch keine Einträge.</p>
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
      </details>

      <div className="detail-actions">
        <button className="primary edit-btn" onClick={onEdit}>Bearbeiten</button>
        <button className="secondary" onClick={() => saveGoal({ ...goal, paused: !goal.paused })}>
          {goal.paused ? 'Wieder aufnehmen' : 'Pausieren'}
        </button>
        <button className="danger-btn" onClick={() => { deleteGoal(goal.id); onClose(); }}>Löschen</button>
      </div>
    </Sheet>
  );
}
