import type { GreetIconKind } from '../greetings';

const SPARK = 'M0 -10 C1.4 -2.6 2.6 -1.4 10 0 C2.6 1.4 1.4 2.6 0 10 C-1.4 2.6 -2.6 1.4 -10 0 C-2.6 -1.4 -1.4 -2.6 0 -10Z';
const STAR = 'M0 -11 L3.1 -3.6 L11 -3.4 L4.9 1.6 L6.8 9.4 L0 5 L-6.8 9.4 L-4.9 1.6 L-11 -3.4 L-3.1 -3.6Z';

/** Small drawn, softly moving mark at the end of a greeting. */
export function GreetIcon({ kind }: { kind: GreetIconKind }) {
  return (
    <svg className={`gicon gicon-${kind}`} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {kind === 'sunrise' && (
        <>
          <g className="gi-rise">
            <circle cx="20" cy="27" r="9" fill="var(--gi-sun)" />
            <g stroke="var(--gi-sun)" strokeWidth="2.4" strokeLinecap="round" className="gi-rays">
              <path d="M20 10v-4" /><path d="M8.5 15l-2.6-2.6" /><path d="M31.5 15l2.6-2.6" />
            </g>
          </g>
          <path d="M4 29.5h32" stroke="var(--gi-line)" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="0" y="31" width="40" height="9" fill="var(--bg)" />
        </>
      )}
      {kind === 'star' && (
        <g transform="translate(20 21)"><path className="gi-twinkle" d={STAR} fill="var(--gi-pink)" stroke="var(--gi-pink)" strokeWidth="2.4" strokeLinejoin="round" /></g>
      )}
      {kind === 'sparkles' && (
        <>
          <g transform="translate(16 22) scale(1.1)"><path className="gi-twinkle" d={SPARK} fill="var(--gi-sun)" /></g>
          <g transform="translate(31 10) scale(0.55)"><path className="gi-twinkle gi-d1" d={SPARK} fill="var(--gi-lilac)" /></g>
          <g transform="translate(33 31) scale(0.42)"><path className="gi-twinkle gi-d2" d={SPARK} fill="var(--gi-pink)" /></g>
        </>
      )}
      {kind === 'shooting' && (
        <g className="gi-shoot">
          <path d="M4 34 L22 18" stroke="var(--gi-lilac)" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
          <path d="M9 36 L23 23" stroke="var(--gi-pink)" strokeWidth="2" strokeLinecap="round" opacity=".45" />
          <g transform="translate(27 14) scale(0.8)"><path d={STAR} fill="var(--gi-sun)" stroke="var(--gi-sun)" strokeWidth="2.4" strokeLinejoin="round" /></g>
        </g>
      )}
      {kind === 'moon' && (
        <>
          <path className="gi-sway" d="M24 6 a14 14 0 1 0 10 22 a11 11 0 1 1 -10 -22Z" fill="var(--gi-sun)" />
          <g transform="translate(33 9) scale(0.38)"><path className="gi-twinkle gi-d1" d={SPARK} fill="var(--gi-lilac)" /></g>
        </>
      )}
      {kind === 'crown' && (
        <g className="gi-bob">
          <path d="M7 29 L5 13 L13.5 20 L20 9 L26.5 20 L35 13 L33 29Z" fill="var(--gi-sun)" stroke="var(--gi-sun)" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="13" cy="25" r="1.8" fill="var(--gi-pink)" /><circle cx="20" cy="24" r="2" fill="var(--gi-lilac)" /><circle cx="27" cy="25" r="1.8" fill="var(--gi-pink)" />
        </g>
      )}
    </svg>
  );
}
