/* The little white meadow cat. Its pose follows the time of day. */

export type CatPose = 'sit' | 'morning' | 'lunch' | 'play' | 'cuddle' | 'night';

const FUR = '#fffdf8';
const SHADE = '#e6defa';
const PINK = '#f6a6c6';
const EYE_L = '#f2c94c';
const EYE_R = '#6fc6ee';

/** Which pose fits this moment. Night only when the sky is dark. */
export function catPoseFor(now: Date, night: boolean): CatPose {
  const h = now.getHours();
  if (night && (h >= 21 || h < 5)) return 'night';
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'play';
  return 'cuddle';
}

function Ears({ fill, stroke, inner }: { fill: string; stroke?: string; inner?: string }) {
  return (
    <g strokeLinejoin="round">
      <path d="M41 38 L43 15 L58 28 Z" fill={fill} stroke={stroke ?? fill} strokeWidth="4" />
      <path d="M62 28 L77 15 L79 38 Z" fill={fill} stroke={stroke ?? fill} strokeWidth="4" />
      {inner && (
        <>
          <path d="M45 32 L46 21 L53 27 Z" fill={inner} stroke={inner} strokeWidth="2" />
          <path d="M67 27 L74 21 L75 32 Z" fill={inner} stroke={inner} strokeWidth="2" />
        </>
      )}
    </g>
  );
}

function Face({ eyes }: { eyes: 'open' | 'happy' | 'closed' | 'wide' }) {
  return (
    <g>
      {eyes === 'open' || eyes === 'wide' ? (
        <>
          <ellipse cx="51.5" cy="42" rx={eyes === 'wide' ? 3.8 : 3.2} ry={eyes === 'wide' ? 4.2 : 3.4} fill={EYE_L} />
          <ellipse cx="68.5" cy="42" rx={eyes === 'wide' ? 3.8 : 3.2} ry={eyes === 'wide' ? 4.2 : 3.4} fill={EYE_R} />
          <circle cx="52.6" cy="40.8" r="1" fill="#fff" />
          <circle cx="69.6" cy="40.8" r="1" fill="#fff" />
        </>
      ) : (
        <g stroke="#9a7fb8" strokeWidth="2" strokeLinecap="round" fill="none">
          {eyes === 'happy'
            ? <><path d="M48 43 q3.5 -4 7 0" /><path d="M65 43 q3.5 -4 7 0" /></>
            : <><path d="M48 42 q3.5 3 7 0" /><path d="M65 42 q3.5 3 7 0" /></>}
        </g>
      )}
      <path d="M58.4 47.6 h3.2 l-1.6 2 z" fill={PINK} />
      <path d="M57 51 q1.5 1.6 3 0 q1.5 1.6 3 0" stroke="#c99ab8" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <g stroke={PINK} strokeWidth="1.1" strokeLinecap="round" opacity="0.85">
        <path d="M45 48 l-9 -1.5" /><path d="M45 51 l-9 1.5" />
        <path d="M75 48 l9 -1.5" /><path d="M75 51 l9 1.5" />
      </g>
      <ellipse cx="46" cy="50" rx="3.6" ry="2.2" fill={PINK} opacity="0.4" />
      <ellipse cx="74" cy="50" rx="3.6" ry="2.2" fill={PINK} opacity="0.4" />
    </g>
  );
}

/** Pink hydrangea cushion the cat sits on. */
function Cushion() {
  const dots = [[30, 108], [42, 104], [54, 106], [66, 104], [78, 106], [90, 108], [36, 114], [50, 113], [64, 113], [78, 113], [88, 115]];
  return (
    <g>
      <ellipse cx="60" cy="112" rx="38" ry="10" fill="#f7b4d2" />
      {dots.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 -4 q4 0 4 4 q0 4 -4 4 q-4 0 -4 -4 q0 -4 4 -4z" fill={i % 3 === 0 ? '#fbd0e3' : i % 3 === 1 ? '#f39cc4' : '#d9b8f2'} opacity="0.9" />
        </g>
      ))}
    </g>
  );
}

function SittingBody({ fill, stroke }: { fill: string; stroke?: string }) {
  const s = stroke ? { stroke, strokeWidth: 1.6 } : {};
  return (
    <g>
      <path d="M78 101 C96 106 104 96 100 84" stroke={stroke ?? fill} strokeWidth={stroke ? 9.6 : 8} strokeLinecap="round" fill="none" />
      {stroke && <path d="M78 101 C96 106 104 96 100 84" stroke={fill} strokeWidth="6.4" strokeLinecap="round" fill="none" />}
      <path d="M40 104 C34 90 37 70 49 60 C55 55 65 55 71 60 C83 70 86 90 80 104 Z" fill={fill} {...s} />
      <ellipse cx="52" cy="104" rx="7" ry="4" fill={fill} {...s} />
      <ellipse cx="68" cy="104" rx="7" ry="4" fill={fill} {...s} />
    </g>
  );
}

export function Cat({ size = 120, pose = 'sit', mood = 'calm' }: { size?: number; pose?: CatPose; mood?: 'calm' | 'happy' | 'sleepy' }) {
  if (pose === 'night') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className="cat cat-night">
        <SittingBody fill="#221d33" stroke="#7f76b4" />
        <Ears fill="#221d33" stroke="#7f76b4" />
        <ellipse cx="60" cy="42" rx="21" ry="17.5" fill="#221d33" stroke="#7f76b4" strokeWidth="1.6" />
        <g filter="url(#glow)" className="cat-eyes">
          <ellipse cx="51.5" cy="42" rx="3.8" ry="4.2" fill={EYE_L} />
          <ellipse cx="68.5" cy="42" rx="3.8" ry="4.2" fill={EYE_R} />
        </g>
        <ellipse cx="51.5" cy="42" rx="0.9" ry="3.2" fill="#221d33" />
        <ellipse cx="68.5" cy="42" rx="0.9" ry="3.2" fill="#221d33" />
      </svg>
    );
  }

  if (pose === 'cuddle') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className="cat">
        <g filter="url(#gouache)"><Cushion /></g>
        <g filter="url(#gouache)">
          <ellipse cx="64" cy="92" rx="34" ry="17" fill={FUR} />
          <ellipse cx="72" cy="98" rx="20" ry="7" fill={SHADE} opacity="0.5" />
          <path d="M96 96 C102 112 52 116 34 104" stroke={FUR} strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* little plush heart it holds */}
          <path d="M60 86 c-6 -8 -16 -2 -10 6 l10 9 l10 -9 c6 -8 -4 -14 -10 -6z" fill="#f7a8c8" />
        </g>
        <g transform="translate(-14 34) rotate(-12 60 42)">
          <g filter="url(#gouache)">
            <Ears fill={FUR} inner={PINK} />
            <ellipse cx="60" cy="42" rx="21" ry="17.5" fill={FUR} />
          </g>
          <Face eyes="closed" />
        </g>
        <path transform="translate(92 54) scale(0.5)" d="M0 -6 c-6 -8 -16 -2 -10 6 l10 9 l10 -9 c6 -8 -4 -14 -10 -6z" fill="#f39cc4" className="cat-float" />
      </svg>
    );
  }

  const eyes = pose === 'lunch' ? 'happy' : pose === 'play' ? 'wide' : mood === 'sleepy' ? 'closed' : mood === 'happy' ? 'happy' : 'open';
  const headDrop = pose === 'lunch' ? 6 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className={`cat cat-${pose}`}>
      <g filter="url(#gouache)"><Cushion /></g>
      <g filter="url(#gouache)">
        {pose === 'play' ? (
          <g>
            <path d="M78 100 C98 98 104 74 96 60" stroke={FUR} strokeWidth="8" strokeLinecap="round" fill="none" className="cat-tail" />
            <path d="M40 104 C34 90 37 70 49 60 C55 55 65 55 71 60 C83 70 86 90 80 104 Z" fill={FUR} />
            <ellipse cx="52" cy="104" rx="7" ry="4" fill={FUR} />
          </g>
        ) : (
          <SittingBody fill={FUR} />
        )}
        <ellipse cx="66" cy="88" rx="10" ry="12" fill={SHADE} opacity="0.45" />
      </g>
      <g transform={`translate(0 ${headDrop})`}>
        <g filter="url(#gouache)">
          <Ears fill={FUR} inner={PINK} />
          <ellipse cx="60" cy="42" rx="21" ry="17.5" fill={FUR} />
        </g>
        <Face eyes={eyes} />
      </g>
      {pose === 'lunch' && (
        <g filter="url(#gouache)">
          <path d="M40 98 h40 q-2 14 -20 14 q-18 0 -20 -14z" fill="#9dcdf3" />
          <path d="M48 97 q8 -7 18 0 l6 -4 v8 l-6 -4 q-10 6 -18 0z" fill="#f8987b" />
        </g>
      )}
      {pose === 'play' && (
        <g className="cat-ball">
          <ellipse cx="88" cy="92" rx="8" ry="5" fill={FUR} stroke={SHADE} strokeWidth="1" transform="rotate(-25 88 92)" />
          <g filter="url(#gouache)">
            <circle cx="98" cy="102" r="10" fill="#bba5f2" />
            <path d="M90 97 q8 6 16 2 M89 104 q9 4 18 -2 M94 93 q2 10 10 17" stroke="#f3f0ff" strokeWidth="1.5" fill="none" />
          </g>
        </g>
      )}
      {pose === 'morning' && (
        <g className="cat-float">
          <path transform="translate(92 26) scale(0.55)" d="M0 -10 C1.5 -2.5 2.5 -1.5 10 0 C2.5 1.5 1.5 2.5 0 10 C-1.5 2.5 -2.5 1.5 -10 0 C-2.5 -1.5 -1.5 -2.5 0 -10Z" fill="#f7d95e" />
          <path transform="translate(24 30) scale(0.4)" d="M0 -10 C1.5 -2.5 2.5 -1.5 10 0 C2.5 1.5 1.5 2.5 0 10 C-1.5 2.5 -2.5 1.5 -10 0 C-2.5 -1.5 -1.5 -2.5 0 -10Z" fill="#f6a6c6" />
        </g>
      )}
    </svg>
  );
}

/** Gentle morning affirmations with a cat pun, one per day. */
export const CAT_AFFIRMATIONS = [
  'Du bist pfotastisch, genau so wie du bist.',
  'Schnurrstracks in einen sanften Tag.',
  'Heute nimmst du alles mit Samtpfoten.',
  'Miau-gnifique, dass du da bist.',
  'Kleine Schritte zählen, Pfote für Pfote.',
  'Du hast mehr Kraft als sieben Leben.',
  'Strecken, gähnen, loslegen. Du schaffst das.',
  'Dein Tag darf heute schnurren.',
  'Du landest immer wieder auf den Pfoten.',
  'Heute: viel Sonne, kein Kater.',
  'Du bist die Katzenminze für deinen eigenen Tag.',
  'Ein Schnurren für dich, bevor alles beginnt.',
];

export function affirmationFor(now: Date): string {
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const doy = Math.floor((now.getTime() - start) / 86400_000);
  return CAT_AFFIRMATIONS[doy % CAT_AFFIRMATIONS.length];
}
