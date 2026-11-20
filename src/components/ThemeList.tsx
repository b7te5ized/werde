import { PALETTE } from '../palette';
import { todayFill } from '../progress';
import { useStore } from '../store';
import { useDragList } from '../useDragList';
import type { Goal, Theme } from '../types';
import { GoalCard } from './GoalCard';

/**
 * Themes with their goals. Themes fold open and closed and move by their handle;
 * goals move inside their theme with a short long-press on the card.
 * Arrow keys work too (on the handle, or Alt + arrows on a goal).
 */
export function ThemeList({ onOpenGoal }: { onOpenGoal: (g: Goal) => void }) {
  const { data, reorderThemes, toggleThemeOpen } = useStore();
  const dl = useDragList({ ids: data.themes.map((t) => t.id), onCommit: reorderThemes, anchorSelector: '.drag-handle' });
  const themes = dl.order.map((id) => data.themes.find((t) => t.id === id)!).filter(Boolean);

  return (
    <div className={`theme-list${dl.dragging ? ' dragging' : ''}`}>
      {themes.map((th) => {
        const goals = data.goals.filter((g) => g.themeId === th.id);
        const active = goals.filter((g) => !g.paused);
        const done = active.filter((g) => todayFill(g, data.logs) >= 1).length;
        const sw = PALETTE[th.color];
        const open = !th.collapsed && !dl.dragging;
        return (
          <section key={th.id} className={`theme-block${dl.dragId === th.id ? ' lifted' : ''}${open ? '' : ' folded'}`} ref={dl.itemRef(th.id)}>
            <div className="theme-head">
              <button className="theme-toggle" onClick={() => toggleThemeOpen(th.id)} aria-expanded={!th.collapsed}
                aria-label={`${th.name}, ${th.collapsed ? 'aufklappen' : 'zuklappen'}`}>
                <span className="theme-icon" style={{ background: sw.soft }}>{th.icon}</span>
                <span className="theme-name">{th.name}</span>
                {!open && active.length > 0 && <span className="theme-count">{done}/{active.length}</span>}
                <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {data.themes.length > 1 && (
                <button className="drag-handle" aria-label={`${th.name} verschieben. Pfeiltasten hoch und runter.`}
                  onPointerDown={(e) => dl.startHandle(th.id, e)} onContextMenu={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                    e.preventDefault();
                    const target = e.currentTarget;
                    if (dl.nudge(th.id, e.key === 'ArrowUp' ? -1 : 1)) requestAnimationFrame(() => target.focus());
                  }}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    {[6, 10, 14].map((y) => <g key={y}><circle cx="7.5" cy={y} r="1.5" /><circle cx="12.5" cy={y} r="1.5" /></g>)}
                  </svg>
                </button>
              )}
            </div>
            {open && <ThemeGoals theme={th} goals={goals} onOpenGoal={onOpenGoal} />}
          </section>
        );
      })}
    </div>
  );
}

function ThemeGoals({ theme, goals, onOpenGoal }: { theme: Theme; goals: Goal[]; onOpenGoal: (g: Goal) => void }) {
  const { reorderGoals } = useStore();
  const dl = useDragList({ ids: goals.map((g) => g.id), onCommit: (ids) => reorderGoals(theme.id, ids) });
  const ordered = dl.order.map((id) => goals.find((g) => g.id === id)!).filter(Boolean);
  if (goals.length === 0) return <div className="theme-goals"><p className="muted pad">Hier gibt es noch keine Ziele.</p></div>;
  return (
    <div className={`theme-goals${dl.dragging ? ' dragging' : ''}`}>
      {ordered.map((g) => (
        <div key={g.id} ref={dl.itemRef(g.id)} className={`goal-slot${dl.dragId === g.id ? ' lifted' : ''}`}
          {...(goals.length > 1 ? dl.pressHandlers(g.id) : {})}
          onKeyDown={(e) => {
            if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
            e.preventDefault();
            const focused = document.activeElement as HTMLElement | null;
            if (dl.nudge(g.id, e.key === 'ArrowUp' ? -1 : 1)) requestAnimationFrame(() => focused?.focus());
          }}>
          <GoalCard goal={g} theme={theme} onOpen={() => onOpenGoal(g)} />
        </div>
      ))}
    </div>
  );
}
