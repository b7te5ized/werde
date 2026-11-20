import type { StatusStyle } from '../types';

interface Props {
  style: StatusStyle;
  pct: number; // may exceed 1
  color: string;
  soft: string;
  size?: number;
  label?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function StatusVisual({ style, pct, color, soft, size = 56, label }: Props) {
  const p = clamp(pct);
  const aria = label ?? `${Math.round(pct * 100)} percent`;
  if (style === 'bar') return <Bar p={p} color={color} soft={soft} label={aria} />;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" role="img" aria-label={aria} className="status-visual">
      {style === 'ring' && <Ring p={p} color={color} soft={soft} />}
      {style === 'plant' && <Plant p={p} color={color} soft={soft} />}
      {style === 'vessel' && <Vessel p={p} color={color} soft={soft} />}
    </svg>
  );
}

function Bar({ p, color, soft, label }: { p: number; color: string; soft: string; label: string }) {
  return (
    <div className="bar" role="img" aria-label={label} style={{ background: soft }}>
      <div className="bar-fill" style={{ width: `${p * 100}%`, background: color }} />
    </div>
  );
}

function Ring({ p, color, soft }: { p: number; color: string; soft: string }) {
  const r = 23;
  const c = 2 * Math.PI * r;
  return (
    <g transform="rotate(-90 30 30)">
      <circle cx="30" cy="30" r={r} fill="none" stroke={soft} strokeWidth="9" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
    </g>
  );
}

function Plant({ p, color, soft }: { p: number; color: string; soft: string }) {
  const stemTop = 50 - 34 * p;
  return (
    <g>
      <circle cx="30" cy="30" r="29" fill={soft} />
      <path d="M14 52 Q30 46 46 52 L44 58 H16Z" fill="#c9a47d" />
      {p > 0 && <path d={`M30 52 L30 ${stemTop}`} stroke="#4f8a5a" strokeWidth="3" strokeLinecap="round" />}
      {p >= 0.25 && <path d="M30 44 C22 44 18 39 18 34 C25 34 29 38 30 44Z" fill="#8cc265" />}
      {p >= 0.5 && <path d="M30 37 C38 37 42 32 42 27 C35 27 31 31 30 37Z" fill="#a9d27e" />}
      {p >= 0.75 && p < 1 && <circle cx="30" cy={stemTop} r="4.5" fill={color} opacity="0.85" />}
      {p >= 1 && (
        <g transform={`translate(30 ${stemTop})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-5.5" rx="4.2" ry="5.5" fill={color} transform={`rotate(${a})`} />
          ))}
          <circle r="3.2" fill="#f5cf4a" />
        </g>
      )}
      {p === 0 && <ellipse cx="30" cy="51" rx="3" ry="2" fill="#8a6a48" />}
    </g>
  );
}

function Vessel({ p, color, soft }: { p: number; color: string; soft: string }) {
  const top = 54 - 40 * p;
  return (
    <g>
      <defs>
        <clipPath id="vessel-clip">
          <path d="M20 6 H40 V14 C50 18 54 26 54 36 C54 48 44 56 30 56 C16 56 6 48 6 36 C6 26 10 18 20 14Z" />
        </clipPath>
      </defs>
      <path d="M20 6 H40 V14 C50 18 54 26 54 36 C54 48 44 56 30 56 C16 56 6 48 6 36 C6 26 10 18 20 14Z" fill={soft} />
      <g clipPath="url(#vessel-clip)">
        <path d={`M0 ${top} Q15 ${top - 3} 30 ${top} T60 ${top} V60 H0Z`} fill={color} style={{ transition: 'd .6s ease' }} />
      </g>
      <path d="M20 6 H40 V14 C50 18 54 26 54 36 C54 48 44 56 30 56 C16 56 6 48 6 36 C6 26 10 18 20 14Z"
        fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="2" />
      <ellipse cx="18" cy="30" rx="3" ry="7" fill="#fff" opacity="0.45" />
    </g>
  );
}
