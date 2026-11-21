import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { tr } from '../i18n';

/** An optional, skippable breathing moment after noting something. One slow breath. */
export function Breathe() {
  const { breathing, endBreathing } = useStore();
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (!breathing) return;
    setPhase('in');
    const a = window.setTimeout(() => setPhase('out'), 4000);
    const b = window.setTimeout(endBreathing, 8600);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && endBreathing();
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(a); window.clearTimeout(b); document.removeEventListener('keydown', onKey); };
  }, [breathing, endBreathing]);

  if (!breathing) return null;
  return (
    <div className="breathe" role="dialog" aria-label={tr('Ein Atemmoment', 'A breathing moment')}>
      <div className={`breathe-circle ${phase}`} aria-hidden="true" />
      <p className="breathe-word" aria-live="polite">{phase === 'in' ? tr('Einatmen', 'Breathe in') : tr('und ausatmen', 'and out')}</p>
      <button className="secondary" onClick={endBreathing} autoFocus>{tr('Überspringen', 'Skip')}</button>
    </div>
  );
}
