import type { Category } from '../types';

/**
 * The goal's own progress: the card fills with the theme colour.
 * Each habit type has its own edge and motion (see .fill-* in styles.css).
 */
export function Fill({ pct, color, category }: { pct: number; color: string; category: Category }) {
  const p = Math.max(0, Math.min(1, pct));
  return (
    <span className={`fill fill-${category}${p >= 1 ? ' full' : ''}`} aria-hidden="true" style={{ '--c': color } as React.CSSProperties}>
      <span className="fill-bar" style={{ height: `${p * 100}%` }}>
        {p > 0 && p < 1 && <span className="fill-edge" />}
      </span>
    </span>
  );
}
