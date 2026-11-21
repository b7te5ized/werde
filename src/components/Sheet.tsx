import { useEffect, useRef, type ReactNode } from 'react';
import { tr } from '../i18n';

export function Sheet({ title, onClose, children, action, onOutside }: {
  title: string; onClose: () => void; children: ReactNode;
  /** a button top right in place of the ✕ (e.g. "Änderungen speichern") */
  action?: { label: string; short?: string; onClick: () => void; disabled?: boolean };
  /** what a tap outside (or Escape) does; defaults to onClose */
  onOutside?: () => void;
}) {
  const outside = onOutside ?? onClose;
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(outside);
  close.current = outside;
  // Runs once per opening. (Re-running on every render stole focus from text fields and closed the phone keyboard.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', onKey);
    // Focus the sheet itself, not a text field: no keyboard popping up on phones.
    ref.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="sheet-backdrop" onClick={outside}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2>{title}</h2>
          {action
            ? <button type="button" className="primary sheet-action" onClick={action.onClick} disabled={action.disabled} aria-label={action.label}>
                {action.short ? <><span className="act-long">{action.label}</span><span className="act-short">{action.short}</span></> : action.label}
              </button>
            : <button className="sheet-close" onClick={onClose} aria-label={tr('Schließen', 'Close')}>✕</button>}
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
