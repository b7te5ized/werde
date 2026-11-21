import { useEffect } from 'react';
import { useStore } from '../store';
import { tr } from '../i18n';

export type Tab = 'today' | 'overview' | 'space';

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'today', get label() { return tr('Heute', 'Today'); }, icon: <path d="M12 21c0-5 0-8 0-11M12 14c-4 0-6-3-6-6 4 0 6 3 6 6zm0-3c4 0 6-3 6-6-4 0-6 3-6 6z" /> },
  { id: 'overview', get label() { return tr('Fortschritt', 'Progress'); }, icon: <><rect x="4" y="5" width="16" height="15" rx="4" /><path d="M4 10h16M9 3v4M15 3v4" /></> },
  { id: 'space', get label() { return tr('Einstellungen', 'Settings'); }, icon: <><circle cx="12" cy="9" r="4" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></> },
];

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="nav" aria-label={tr('Hauptnavigation', 'Main navigation')}>
      {TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function ToastBar() {
  const { toast, dismissToast, undo } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 5000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.text}</span>
      {toast.undo && <button onClick={undo}>{tr('Rückgängig', 'Undo')}</button>}
    </div>
  );
}
