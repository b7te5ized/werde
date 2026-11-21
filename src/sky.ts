import { useEffect, useState } from 'react';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export interface Sky { phase: Phase }

export function phaseFor(d: Date): Phase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17.5) return 'day';
  if (h >= 17.5 && h < 21) return 'dusk';
  return 'night';
}

/** Follows the time of day and paints it onto the root element. */
export function useSky(mode: 'auto' | 'light' | 'dark'): Sky {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const phase: Phase = mode === 'light' ? 'day' : mode === 'dark' ? 'night' : phaseFor(now);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('phase-dawn', 'phase-day', 'phase-dusk', 'phase-night');
    root.classList.add(`phase-${phase}`);
    window.setTimeout(() => root.classList.add('sky-ready'), 50);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#fbf6e4');
  }, [phase]);
  return { phase };
}
