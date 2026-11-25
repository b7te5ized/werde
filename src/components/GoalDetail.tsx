import { useState } from 'react';
import type { Goal } from '../types';
import { PALETTE } from '../palette';
import { addDays, dayAmount, dayKey, fmt, goalProgress, logsInPeriod, logsOnDay, PERIOD_LABEL, progressLabel } from '../progress';
import { useStore } from '../store';
import { Sheet } from './Sheet';
import { Fill } from './Fill';
import { categoryOf, cueText } from '../categories';
import { rhythm, UNIT_WORD } from '../consistency';
import { tr, locale } from '../i18n';

export function GoalDetail({ goal, onClose, onEdit }: { goal: Goal; onClose: () => void; onEdit: () => void }) {
  const { data, log, deleteLog, saveGoal, deleteGoal, setDayNote } = useStore();
  const theme = data.themes.find((t) => t.id === goal.themeId);
  const sw = PALETTE[theme?.color ?? 'meadow'];
  const p = goalProgress(goal, data.logs);
  // which day a new entry counts for: today, yesterday or the day before
  const [back, setBack] = useState(0);
  const now = new Date();
  const day = addDays(now, -back);
  const DAY_WORD = [tr('Heute', 'Today'), tr('Gestern', 'Yesterday'), tr('Vorgestern', 'Day before')];
  const entries = back === 0 ? logsInPeriod(goal, data.logs) : logsOnDay(data.logs.filter((l) => l.goalId === goal.id), day);
  const entriesWhen = back === 0 ? PERIOD_LABEL[goal.period] : DAY_WORD[back].toLowerCase();
  const atFor = () => back === 0 ? undefined : new Date(day.getFullYear(), day.getMonth(), day.getDate(), now.getHours(), now.getMinutes()).getTime();
  const [amount, setAmount] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  // an empty field means one step (the number shown in the field)
  const n = amount.trim() ? Number(amount.replace(',', '.')) : goal.step;
  const r = rhythm(goal, data);
  const [, many] = UNIT_WORD[goal.period];
  const today = dayKey(day);
  const notes = data.dayNotes?.[goal.id] ?? {};
  const earlier = Object.entries(notes).filter(([k]) => k !== dayKey(now) && k !== today).sort(([a], [b]) => (a < b ? 1 : -1));

  return (
    <Sheet title={goal.name} onClose={onClose}>
      {goal.why && (
        <blockquote className="why-first">
          <span className="why-label">{tr('Warum?', 'Why?')}</span>
          {goal.why}
        </blockquote>
      )}
      <div className="detail-hero" role="img" aria-label={`${progressLabel(goal, p)} ${PERIOD_LABEL[goal.period]}`}>
        <Fill pct={p.pct} color={sw.base} category={categoryOf(goal)} />
        <div>
          <p className="detail-big">{Math.round(p.pct * 100)}%</p>
          <p>{progressLabel(goal, p)} {PERIOD_LABEL[goal.period]}</p>
          {r.streak >= 2 && !goal.paused && <p className="muted">🌱 {r.streak} {many} </p>}
        </div>
      </div>
      {goal.cue && <p className="muted detail-cue">{cueText(goal.cue)}</p>}

      {!goal.paused && (
        <div className="chips day-pick" role="radiogroup" aria-label={tr('Für welchen Tag?', 'For which day?')}>
          {DAY_WORD.map((w, i) => (
            <button key={w} type="button" role="radio" aria-checked={back === i} className={`chip${back === i ? ' on' : ''}`} onClick={() => setBack(i)}>{w}</button>
          ))}
        </div>
      )}
      {!goal.paused && back > 0 && (
        <p className="muted day-pick-sum">
          {day.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}: {fmt(dayAmount(goal.id, data.logs, day))}{goal.period === 'day' ? ` / ${fmt(goal.target)}` : ''} {goal.unit}
        </p>
      )}
      {!goal.paused && (
        <form className="row log-custom" onSubmit={(e) => { e.preventDefault(); if (n) { log(goal.id, n, atFor()); setAmount(''); } }}>
          <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={fmt(goal.step)} aria-label={tr(`Menge in ${goal.unit}`, `Amount in ${goal.unit}`)} />
          <span className="unit-hint">{goal.unit}</span>
          <button className="primary small" type="submit" disabled={!n}>{back === 0 ? tr('Hinzufügen', 'Add') : tr('Nachtragen', 'Add')}</button>
        </form>
      )}

      {noteOpen || notes[today] ? (
        <label className="day-note">
          <span>{back === 0 ? tr('Tagesnotiz', 'Daily note') : `${tr('Tagesnotiz', 'Daily note')} · ${DAY_WORD[back]}`}</span>
          <textarea rows={3} value={notes[today] ?? ''} placeholder={tr('Ein paar Worte, nur für dich …', 'A few words, just for you …')} autoFocus={noteOpen && !notes[today]}
            onChange={(e) => setDayNote(goal.id, today, e.target.value)} />
        </label>
      ) : (
        <button type="button" className="secondary day-note-add" onClick={() => setNoteOpen(true)}>{tr('+ Tagesnotiz hinzufügen', '+ Add daily note')}</button>
      )}

      {earlier.length > 0 && (
        <details className="entries-box">
          <summary>
            <span>{tr('Frühere Notizen', 'Earlier notes')}</span>
            <span className="muted entries-count">{earlier.length}</span>
            <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </summary>
          <ul className="day-notes">
            {earlier.map(([k, text]) => {
              const [y, m, d] = k.split('-').map(Number);
              return (
                <li key={k}>
                  <span className="muted small">{new Date(y, m - 1, d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                  <p>{text}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <details className="entries-box">
        <summary>
          <span>{tr('Einträge', 'Entries')}</span>
          <span className="muted entries-count">{entries.length > 0 ? `${entries.length} ${entriesWhen}` : entriesWhen}</span>
          <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </summary>
        {entries.length === 0 ? (
          <p className="muted entries-empty">{tr('Noch keine Einträge.', 'No entries yet.')}</p>
        ) : (
          <ul className="entries">
            {entries.map((l) => (
              <li key={l.id}>
                <span>{fmt(l.amount)} {goal.unit}</span>
                <span className="muted">{new Date(l.at).toLocaleString(locale(), { weekday: goal.period === 'day' && back === 0 ? undefined : 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <button className="text-btn" onClick={() => deleteLog(l.id)} aria-label={tr(`Eintrag ${fmt(l.amount)} ${goal.unit} entfernen`, `Remove entry ${fmt(l.amount)} ${goal.unit}`)}>{tr('Entfernen', 'Remove')}</button>
              </li>
            ))}
          </ul>
        )}
      </details>

      <div className="detail-actions">
        <button className="primary edit-btn" onClick={onEdit}>{tr('Bearbeiten', 'Edit')}</button>
        <button className="secondary" onClick={() => saveGoal({ ...goal, paused: !goal.paused })}>
          {goal.paused ? tr('Wieder aufnehmen', 'Resume') : tr('Pausieren', 'Pause')}
        </button>
        <button className="danger-btn" onClick={() => { deleteGoal(goal.id); onClose(); }}>{tr('Löschen', 'Delete')}</button>
      </div>
    </Sheet>
  );
}
