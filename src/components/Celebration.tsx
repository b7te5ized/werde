import { useEffect, useMemo } from 'react';
import { PALETTE } from '../palette';
import { useStore } from '../store';
import { Sparkle } from './Art';
import { tr } from '../i18n';
import { playDay, playGoal } from '../sound';

/** The rainbow, outside in. */
export const RAINBOW = ['#f2777a', '#f5a35c', '#f3cd4a', '#8cc265', '#5fbfb4', '#6f9be3', '#b08ae6'];

function burst(n: number, spread: number, lift: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const dist = spread * (0.55 + Math.random() * 0.6);
    return {
      dx: Math.cos(a) * dist, dy: Math.sin(a) * dist * 0.8 - lift, fall: 140 + Math.random() * 200,
      r: Math.random() * 600 - 300, s: 0.6 + Math.random() * 0.9, d: Math.random() * 0.2,
      c: RAINBOW[i % RAINBOW.length], shape: i % 3,
    };
  });
}

type Bit = ReturnType<typeof burst>[number];

function Confetti({ bits, delay = 0 }: { bits: Bit[]; delay?: number }) {
  return (
    <>
      {bits.map((p, i) => (
        <span key={i} className={`confetti c${p.shape}`} style={{
          '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--fall': `${p.fall}px`, '--r': `${p.r}deg`, '--s': p.s,
          animationDelay: `${delay + p.d}s`, background: p.c,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

/** A rainbow arc whose bands draw themselves one after another. */
export function RainbowArc({ width, band, delay = 0, className = '' }: { width: number; band: number; delay?: number; className?: string }) {
  const r0 = width / 2 - band / 2;
  const h = width / 2 + band / 2;
  return (
    <svg className={`rainbow-arc ${className}`} viewBox={`0 0 ${width} ${h}`} width={width} height={h} aria-hidden="true">
      {RAINBOW.map((c, i) => {
        const r = r0 - i * band;
        if (r <= band) return null;
        const cx = width / 2;
        return (
          <path key={c} d={`M ${cx - r} ${h} A ${r} ${r} 0 0 1 ${cx + r} ${h}`} stroke={c} strokeWidth={band + 0.6} fill="none"
            pathLength={100} style={{ animationDelay: `${delay + i * 0.07}s` }} />
        );
      })}
    </svg>
  );
}

/** werde's loud moments: a rainbow for every goal reached, a whole sky of it when the day is complete. */
export function Celebration() {
  const { celebration, clearCelebration, data } = useStore();
  const goal = celebration;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const kind = goal?.kind;
  const soundOn = data.settings.sound !== false;

  const bits = useMemo(() => burst(kind === 'day' ? 56 : kind === 'goal' ? 24 : 40, kind === 'goal' ? 150 : 220, kind === 'goal' ? 20 : 60), [goal?.id]);
  const wave2 = useMemo(() => burst(42, 260, 120), [goal?.id]);

  useEffect(() => {
    if (!goal) return;
    if (soundOn) (goal.kind === 'goal' ? playGoal : playDay)();
    navigator.vibrate?.(goal.kind === 'goal' ? [10, 50, 14] : goal.kind === 'day' ? [14, 60, 14, 60, 30] : [12, 60, 18]);
    const ms = goal.kind === 'goal' ? 2700 : goal.kind === 'day' ? (reduced ? 3600 : 5200) : reduced ? 2600 : 3800;
    const t = window.setTimeout(clearCelebration, ms);
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && clearCelebration();
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, clearCelebration, reduced]);

  if (!goal) return null;

  if (goal.kind === 'goal') {
    return (
      <div className="celebrate-small rainbow-goal" role="status" key={goal.id}>
        <RainbowArc width={176} band={9} />
        {!reduced && <Confetti bits={bits} delay={0.25} />}
        <span className="celebrate-pill"><span aria-hidden="true">✦</span> {goal.title}</span>
      </div>
    );
  }

  if (goal.kind === 'day') {
    return (
      <div className={`celebrate rainbow-day${reduced ? ' still' : ''}`} role="alertdialog" key={goal.id}
        aria-label={tr('Alle Ziele für heute geschafft', 'All goals for today done')} onClick={clearCelebration}>
        <div className="rainbow-glow" aria-hidden="true" />
        <div className="celebrate-stage rainbow-stage" aria-hidden="true">
          <RainbowArc width={300} band={15} delay={0.1} />
          <svg className="rainbow-sparkles" viewBox="-150 -120 300 240" width="300" height="240">
            <Sparkle x={-122} y={-70} s={1.1} color="#f3cd4a" />
            <Sparkle x={118} y={-88} s={0.8} color="#f2777a" />
            <Sparkle x={-40} y={-108} s={0.6} color="#6f9be3" />
            <Sparkle x={70} y={-30} s={0.5} color="#b08ae6" />
            <Sparkle x={-90} y={10} s={0.5} color="#5fbfb4" />
            <Sparkle x={132} y={20} s={0.7} color="#f5a35c" />
          </svg>
          {!reduced && <Confetti bits={bits} delay={0.75} />}
          {!reduced && <Confetti bits={wave2} delay={1.6} />}
        </div>
        <div className="celebrate-text">
          <p className="celebrate-eyebrow rainbow-text">{tr('Regenbogentag', 'Rainbow day')}</p>
          <h2>{goal.title}</h2>
        </div>
      </div>
    );
  }

  const petal = PALETTE.blossom.base;
  return (
    <div className={`celebrate${reduced ? ' still' : ''}`} role="alertdialog" aria-label={tr(`${goal.title} geschafft`, `${goal.title} done`)} onClick={clearCelebration}>
      <div className="celebrate-stage" aria-hidden="true">
        <RainbowArc width={260} band={11} className="behind" />
        {!reduced && <Confetti bits={bits} delay={0.55} />}
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
