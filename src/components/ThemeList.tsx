import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { PALETTE } from '../palette';
import { todayFill } from '../progress';
import { useStore } from '../store';
import type { Goal } from '../types';
import { GoalCard } from './GoalCard';

interface Drag {
  id: string;
  order: string[];
  pointerY: number; // latest clientY
  startY: number; // clientY when the block was picked up
  startTop: number; // block offsetTop when picked up (after compacting)
  startScroll: number;
  handleTop: number; // handle viewport top before compacting, to keep it under the finger
  settled: boolean;
}

/**
 * Themes with their goals. Each theme folds open and closed, and can be moved
 * by dragging its handle (touch, pen or mouse) or with the arrow keys.
 * While dragging, all themes fold to their headers so they are easy to place.
 */
export function ThemeList({ onOpenGoal }: { onOpenGoal: (g: Goal) => void }) {
  const { data, reorderThemes, toggleThemeOpen } = useStore();
  const [drag, setDrag] = useState<Drag | null>(null);
  const blocks = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  const listRef = useRef<HTMLDivElement>(null);

  const ids = drag ? drag.order : data.themes.map((t) => t.id);
  const themes = ids.map((id) => data.themes.find((t) => t.id === id)!).filter(Boolean);

  // After the list compacts on pick-up: keep the handle under the finger, then remember where we start from.
  useLayoutEffect(() => {
    if (!drag || drag.settled) return;
    const el = blocks.current.get(drag.id);
    if (!el) return;
    const handle = el.querySelector<HTMLElement>('.drag-handle');
    const nowTop = handle?.getBoundingClientRect().top ?? drag.handleTop;
    window.scrollBy(0, nowTop - drag.handleTop);
    // If the page could not scroll far enough, lift the block to the finger instead.
    const after = handle?.getBoundingClientRect();
    const gap = after ? drag.pointerY - (after.top + after.height / 2) : 0;
    setDrag({ ...drag, settled: true, startTop: el.offsetTop + gap, startY: drag.pointerY, startScroll: window.scrollY });
  }, [drag]);

  // Place the lifted block under the finger.
  useLayoutEffect(() => {
    if (!drag?.settled) return;
    const el = blocks.current.get(drag.id);
    if (!el) return;
    const desired = drag.startTop + (drag.pointerY - drag.startY) + (window.scrollY - drag.startScroll);
    el.style.transform = `translateY(${desired - el.offsetTop}px)`;
  });

  const move = (clientY: number) => {
    const d = dragRef.current;
    if (!d || !d.settled) { if (d) setDrag({ ...d, pointerY: clientY }); return; }
    const el = blocks.current.get(d.id)!;
    const desired = d.startTop + (clientY - d.startY) + (window.scrollY - d.startScroll);
    const center = desired + el.offsetHeight / 2;
    const others = d.order.filter((id) => id !== d.id);
    let index = 0;
    for (const id of others) {
      const o = blocks.current.get(id);
      if (o && o.offsetTop + o.offsetHeight / 2 < center) index++;
    }
    const order = [...others];
    order.splice(index, 0, d.id);
    setDrag({ ...d, order, pointerY: clientY });
  };

  // Scroll gently when the finger rests near the top or bottom edge.
  useEffect(() => {
    if (!drag) return;
    let raf = 0;
    const step = () => {
      const d = dragRef.current;
      if (d?.settled) {
        const edge = 72;
        const y = d.pointerY;
        const v = y < edge ? -(edge - y) / 6 : y > window.innerHeight - edge ? (y - (window.innerHeight - edge)) / 6 : 0;
        if (v) { window.scrollBy(0, v); move(y); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!drag]);

  const start = (id: string, e: RPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      id, order: data.themes.map((t) => t.id), pointerY: e.clientY, startY: e.clientY, startTop: 0, startScroll: window.scrollY,
      handleTop: e.currentTarget.getBoundingClientRect().top, settled: false,
    });
    navigator.vibrate?.(8);
  };

  const end = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    blocks.current.forEach((el) => { el.style.transform = ''; });
    const before = data.themes.map((t) => t.id).join();
    setDrag(null);
    if (d.order.join() !== before) reorderThemes(d.order);
    // keep the moved theme in view once everything unfolds again
    requestAnimationFrame(() => blocks.current.get(d.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  const nudge = (id: string, dir: -1 | 1) => {
    const order = data.themes.map((t) => t.id);
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    reorderThemes(order);
    requestAnimationFrame(() => blocks.current.get(id)?.querySelector<HTMLElement>('.drag-handle')?.focus());
  };

  return (
    <div className={`theme-list${drag ? ' dragging' : ''}`} ref={listRef}>
      {themes.map((th) => {
        const goals = data.goals.filter((g) => g.themeId === th.id);
        const active = goals.filter((g) => !g.paused);
        const done = active.filter((g) => todayFill(g, data.logs) >= 1).length;
        const sw = PALETTE[th.color];
        const open = !th.collapsed && !drag;
        const lifted = drag?.id === th.id;
        return (
          <section key={th.id} className={`theme-block${lifted ? ' lifted' : ''}${open ? '' : ' folded'}`}
            ref={(el) => { if (el) blocks.current.set(th.id, el); else blocks.current.delete(th.id); }}>
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
                  onPointerDown={(e) => start(th.id, e)} onPointerMove={(e) => drag && move(e.clientY)}
                  onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(th.id, -1); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); nudge(th.id, 1); }
                  }}
                  onContextMenu={(e) => e.preventDefault()}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    {[6, 10, 14].map((y) => <g key={y}><circle cx="7.5" cy={y} r="1.5" /><circle cx="12.5" cy={y} r="1.5" /></g>)}
                  </svg>
                </button>
              )}
            </div>
            {open && (
              <div className="theme-goals">
                {goals.length === 0 && <p className="muted pad">Hier gibt es noch keine Ziele.</p>}
                {goals.map((g) => <GoalCard key={g.id} goal={g} theme={th} onOpen={() => onOpenGoal(g)} />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
