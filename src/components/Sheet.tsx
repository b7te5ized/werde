import { useEffect, useRef, type ReactNode } from 'react';
import { tr } from '../i18n';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  // Runs once per opening. (Re-running on every render stole focus from text fields and closed the phone keyboard.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', onKey);
    // Focus the sheet itself, not a text field: no keyboard popping up on phones.
    ref.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="sheet-close" onClick={onClose} aria-label={tr('Schließen', 'Close')}>✕</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)} type="button">
          {o.label}
        </button>
      ))}
    </div>
  );
}
