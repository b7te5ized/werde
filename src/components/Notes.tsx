import { useState } from 'react';
import { useStore } from '../store';

/** Ideas and future habits that don't fit yet. */
export function Notes() {
  const { data, addNote, removeNote } = useStore();
  const [text, setText] = useState('');
  const save = () => { const t = text.trim(); if (t) { addNote(t); setText(''); } };
  return (
    <section className="card settings notes">
      <h2>Notizen</h2>
      <p className="muted small">Ideen und Gewohnheiten für später.</p>
      <form className="note-add" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <textarea rows={2} value={text} maxLength={400} placeholder="Was dir gerade einfällt …" aria-label="Neue Notiz"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }} />
        <button className="secondary small-btn" type="submit" disabled={!text.trim()}>Merken</button>
      </form>
      {data.notes.length > 0 && (
        <ul className="note-list">
          {data.notes.map((n) => (
            <li key={n.id}>
              <span className="note-text">{n.text}</span>
              <span className="note-date">{new Date(n.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
              <button className="chip-x" aria-label="Notiz entfernen" onClick={() => removeNote(n.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
