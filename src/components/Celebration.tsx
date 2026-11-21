import { useEffect, useMemo } from 'react';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import { Sparkle } from './Art';
import { tr } from '../i18n';

const CONFETTI = ['#f294ad', '#f3c93f', '#b59ae6', '#86c0e6', '#8cc265', '#fbe0e8', '#fff3b0'];

/** The one loud moment in werde: a seed bursts into bloom when a goal is reached. */
export function Celebration() {
  const { celebration, clearCelebration } = useStore();
  const goal = celebration;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const petals = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 110 + Math.random() * 120;
    return {
      dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 40, fall: 140 + Math.random() * 160,
      r: Math.random() * 540 - 270, s: 0.6 + Math.random() * 0.8, d: Math.random() * 0.15,
      c: CONFETTI[i % CONFETTI.length], shape: i % 3,
    };
  }), [goal?.id]);
  const small = goal?.kind === 'small';

  useEffect(() => {
    if (!goal) return;
    navigator.vibrate?.(small ? 10 : [12, 60, 18]);
    const t = window.setTimeout(clearCelebration, small ? 2200 : reduced ? 2600 : 3800);
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && clearCelebration();
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [goal, clearCelebration, reduced, small]);

  if (!goal) return null;
  const petal = PALETTE.blossom.base;

  if (small) {
    return (
      <div className="celebrate-small" role="status" key={goal.id}>
        {!reduced && petals.slice(0, 18).map((p, i) => (
          <span key={i} className={`confetti c${p.shape}`} style={{
            '--dx': `${p.dx * 0.7}px`, '--dy': `${p.dy * 0.5}px`, '--fall': `${p.fall}px`, '--r': `${p.r}deg`, '--s': p.s,
            animationDelay: `${p.d}s`, background: p.c,
          } as React.CSSProperties} />
        ))}
        <span className="celebrate-pill"><span aria-hidden="true">✿</span> {goal.title}</span>
      </div>
    );
  }

  return (
    <div className={`celebrate${reduced ? ' still' : ''}`} role="alertdialog" aria-label={tr(`${goal.title} geschafft`, `${goal.title} done`)} onClick={clearCelebration}>
      <div className="celebrate-stage" aria-hidden="true">
        {!reduced && petals.map((p, i) => (
          <span key={i} className={`confetti c${p.shape}`} style={{
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--fall': `${p.fall}px`, '--r': `${p.r}deg`, '--s': p.s,
            animationDelay: `${0.55 + p.d}s`, background: p.c,
          } as React.CSSProperties} />
        ))}
        <svg className="bloom" viewBox="-60 -60 120 120" width="220" height="220">
          <g filter="url(#gouache)">
            <path className="bloom-stem" d="M0 58 C0 40 2 26 0 8" stroke="#4f8a5a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path className="bloom-leaf l1" d="M0 40 C-16 40 -24 30 -24 20 C-10 20 -2 28 0 40Z" fill="#8cc265" />
            <path className="bloom-leaf l2" d="M0 30 C14 30 22 20 22 10 C8 10 1 18 0 30Z" fill="#a9d27e" />
            <g className="bloom-head">
              {Array.from({ length: 8 }, (_, i) => (
                <g key={i} transform={`rotate(${i * 45})`}>
                  <ellipse className="bloom-petal" cx="0" cy="-17" rx="10" ry="16" fill={i % 2 ? petal : PALETTE.blossom.soft}
                    style={{ animationDelay: `${0.25 + i * 0.03}s` }} />
                </g>
              ))}
              <circle className="bloom-center" r="10" fill="#f5cf4a" />
            </g>
          </g>
          <g className="bloom-sparkles">
            <Sparkle x={-44} y={-40} s={0.8} color="#f3c93f" />
            <Sparkle x={46} y={-30} s={0.6} color="#f294ad" />
            <Sparkle x={40} y={40} s={0.5} color="#b59ae6" />
          </g>
        </svg>
      </div>
      <div className="celebrate-text">
        <p className="celebrate-eyebrow">{tr('Geschafft', 'Done')}</p>
        <h2>{goal.title}</h2>
        {goal.note && <p className="celebrate-note">{goal.note}</p>}
      </div>
    </div>
  );
}
