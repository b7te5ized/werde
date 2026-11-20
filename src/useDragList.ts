import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';

interface Drag {
  id: string;
  order: string[];
  pointerY: number; // latest clientY
  startY: number; // clientY when picked up
  startTop: number; // item offsetTop when picked up (after any compacting)
  startScroll: number;
  anchorTop: number; // viewport top of the grabbed spot before compacting
  settled: boolean;
}

const LONG_PRESS_MS = 380;
const SLOP = 9;

/**
 * Reorder a vertical list by dragging. Works with touch, pen and mouse.
 * - startHandle: pick up at once (a dedicated handle with touch-action: none)
 * - pressHandlers: pick up after a short long-press anywhere on the item, so normal taps and scrolling keep working
 * Items must share one positioned parent (offsetTop is measured against it).
 */
export function useDragList({ ids, onCommit, anchorSelector }: {
  ids: string[];
  onCommit: (order: string[]) => void;
  /** element inside an item that should stay under the finger when the list compacts on pick-up */
  anchorSelector?: string;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  const press = useRef<{ id: string; x: number; y: number; timer: number; el: HTMLElement } | null>(null);

  const order = drag ? drag.order : ids;

  useLayoutEffect(() => {
    if (!drag || drag.settled) return;
    const el = items.current.get(drag.id);
    if (!el) return;
    const anchor = (anchorSelector && el.querySelector<HTMLElement>(anchorSelector)) || el;
    window.scrollBy(0, anchor.getBoundingClientRect().top - drag.anchorTop);
    const r = anchor.getBoundingClientRect();
    const gap = anchorSelector ? drag.pointerY - (r.top + r.height / 2) : 0;
    setDrag({ ...drag, settled: true, startTop: el.offsetTop + gap, startY: drag.pointerY, startScroll: window.scrollY });
  }, [drag, anchorSelector]);

  useLayoutEffect(() => {
    if (!drag?.settled) return;
    const el = items.current.get(drag.id);
    if (!el) return;
    const desired = drag.startTop + (drag.pointerY - drag.startY) + (window.scrollY - drag.startScroll);
    el.style.transform = `translateY(${desired - el.offsetTop}px)`;
  });

  const move = (clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.settled) { setDrag({ ...d, pointerY: clientY }); return; }
    const el = items.current.get(d.id);
    if (!el) return;
    const desired = d.startTop + (clientY - d.startY) + (window.scrollY - d.startScroll);
    const center = desired + el.offsetHeight / 2;
    const others = d.order.filter((id) => id !== d.id);
    let index = 0;
    for (const id of others) {
      const o = items.current.get(id);
      if (o && o.offsetTop + o.offsetHeight / 2 < center) index++;
    }
    const next = [...others];
    next.splice(index, 0, d.id);
    setDrag({ ...d, order: next, pointerY: clientY });
  };

  const end = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    items.current.forEach((el) => { el.style.transform = ''; });
    setDrag(null);
    if (d.order.join() !== ids.join()) onCommit(d.order);
    // the tap that ends a drag must not also open or log anything
    const swallow = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    window.addEventListener('click', swallow, true);
    window.setTimeout(() => window.removeEventListener('click', swallow, true), 350);
    requestAnimationFrame(() => items.current.get(d.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  const lift = (id: string, clientY: number, anchorTop: number) => {
    setDrag({ id, order: ids, pointerY: clientY, startY: clientY, startTop: 0, startScroll: window.scrollY, anchorTop, settled: false });
    navigator.vibrate?.(8);
  };

  // While dragging: follow the pointer anywhere, stop the page from scrolling under the finger, scroll near the edges.
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => move(e.clientY);
    const onUp = () => end();
    const noScroll = (e: TouchEvent) => e.preventDefault();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('touchmove', noScroll, { passive: false });
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
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('touchmove', noScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!drag]);

  const cancelPress = () => { if (press.current) { window.clearTimeout(press.current.timer); press.current = null; } };

  return {
    order,
    dragId: drag?.id ?? null,
    dragging: !!drag,
    itemRef: (id: string) => (el: HTMLElement | null) => { if (el) items.current.set(id, el); else items.current.delete(id); },
    startHandle: (id: string, e: RPointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      const el = items.current.get(id);
      const anchor = (anchorSelector && el?.querySelector<HTMLElement>(anchorSelector)) || e.currentTarget;
      lift(id, e.clientY, anchor.getBoundingClientRect().top);
    },
    pressHandlers: (id: string) => ({
      onPointerDown: (e: RPointerEvent<HTMLElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        cancelPress();
        const el = e.currentTarget;
        const y = e.clientY;
        press.current = { id, x: e.clientX, y, el, timer: window.setTimeout(() => {
          const p = press.current;
          press.current = null;
          if (p) lift(p.id, p.y, p.el.getBoundingClientRect().top);
        }, LONG_PRESS_MS) };
      },
      onPointerMove: (e: RPointerEvent<HTMLElement>) => {
        const p = press.current;
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP) cancelPress();
        else if (p) p.y = e.clientY;
      },
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }),
    /** Move one step with the keyboard. */
    nudge: (id: string, dir: -1 | 1) => {
      const next = [...ids];
      const i = next.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= next.length) return false;
      [next[i], next[j]] = [next[j], next[i]];
      onCommit(next);
      return true;
    },
  };
}
