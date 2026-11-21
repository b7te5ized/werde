import { useState } from 'react';
import { useStore } from '../store';
import { tr, locale } from '../i18n';

/** Ideas and future habits that don't fit yet. */
export function Notes() {
  const { data, addNote, removeNote } = useStore();
  const [text, setText] = useState('');
  const save = () => { const t = text.trim(); if (t) { addNote(t); setText(''); } };
  return (
    <section className="card settings notes">
      <h2>{tr('Notizen', 'Notes')}</h2>
      <p className="muted small">{tr('Ideen und Gewohnheiten für später.', 'Ideas and habits for later.')}</p>
      <form className="note-add" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <textarea rows={2} value={text} maxLength={400} placeholder={tr('Was dir gerade einfällt …', 'Whatever comes to mind …')} aria-label={tr('Neue Notiz', 'New note')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }} />
        <button className="secondary small-btn" type="submit" disabled={!text.trim()}>{tr('Merken', 'Save')}</button>
      </form>
      {data.notes.length > 0 && (
        <ul className="note-list">
          {data.notes.map((n) => (
            <li key={n.id}>
              <span className="note-text">{n.text}</span>
              <span className="note-date">{new Date(n.at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}</span>
              <button className="chip-x" aria-label={tr('Notiz entfernen', 'Remove note')} onClick={() => removeNote(n.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
