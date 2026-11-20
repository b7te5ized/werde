/* Painterly SVG illustrations. The gouache filter warps edges and adds soft brush streaks. */

export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="gouache" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.09 0.22" numOctaves="3" seed="9" result="streak" />
          <feColorMatrix in="streak" type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.92  1.6 0 0 0 -0.82" result="streakA" />
          <feComposite in="streakA" in2="shape" operator="in" result="hl" />
          <feMerge><feMergeNode in="shape" /><feMergeNode in="hl" /></feMerge>
        </filter>
        <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft-edge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export function Flower({ x, y, r, petal, center = '#f5cf4a' }: { x: number; y: number; r: number; petal: string; center?: string }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${x} ${y})`}>
      {petals.map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.62} rx={r * 0.48} ry={r * 0.6} fill={petal} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.36} fill={center} />
    </g>
  );
}

export function Sparkle({ x, y, s, color = '#fff6c9' }: { x: number; y: number; s: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -10 C1.5 -2.5 2.5 -1.5 10 0 C2.5 1.5 1.5 2.5 0 10 C-1.5 2.5 -2.5 1.5 -10 0 C-2.5 -1.5 -1.5 -2.5 0 -10Z"
      fill={color}
    />
  );
}

/** The painted meadow behind the greeting: the "clearing". */
export function Meadow({ phase = 'day', weather = null }: {
  phase?: 'dawn' | 'day' | 'dusk' | 'night'; weather?: string | null;
}) {
  const night = phase === 'night';
  const cloudy = weather === 'cloud' || weather === 'rain' || weather === 'storm' || weather === 'snow';
  return (
    <svg className="meadow-art" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-top)" />
          <stop offset="1" stopColor="var(--sky-bottom)" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky-g)" />
      <g filter="url(#gouache)">
        {night ? (
          <path d="M330 26 a26 26 0 1 0 22 40 a21 21 0 1 1 -22 -40Z" fill="var(--sun)" />
        ) : (
          <circle cx="330" cy={phase === 'dawn' ? 84 : phase === 'dusk' ? 90 : 52} r="26" fill="var(--sun)" />
        )}
        <ellipse cx="90" cy="48" rx="46" ry="14" fill="#ffffff" opacity={night ? 0.12 : 0.55} />
        <ellipse cx="250" cy="34" rx="34" ry="10" fill="#ffffff" opacity={night ? 0.1 : 0.45} />
        {cloudy && (
          <>
            <ellipse cx="300" cy="46" rx="58" ry="18" fill={night ? '#5a6670' : '#ffffff'} opacity="0.8" />
            <ellipse cx="170" cy="58" rx="50" ry="15" fill={night ? '#56626a' : '#f6f8f8'} opacity="0.75" />
          </>
        )}
        <path d="M-20 150 Q80 92 190 128 T420 112 V240 H-20Z" fill="var(--hill-back)" />
        <path d="M-20 180 Q110 132 230 162 T420 150 V240 H-20Z" fill="var(--hill-front)" />
        <path d="M-20 205 Q140 178 260 196 T420 190 V240 H-20Z" fill="var(--hill-near)" />
        <Flower x={40} y={176} r={11} petal="#f294ad" />
        <Flower x={300} y={170} r={12} petal="#f7a8bd" />
        <Flower x={352} y={196} r={9} petal="#f3c93f" center="#fff8dc" />
      </g>
      {weather === 'rain' || weather === 'storm' ? (
        <g stroke={night ? '#9fb4c2' : '#7fa3b8'} strokeWidth="2" strokeLinecap="round" opacity="0.55">
          {Array.from({ length: 22 }, (_, i) => {
            const x = (i * 47) % 400; const y = 70 + ((i * 29) % 90);
            return <path key={i} d={`M${x} ${y} l-4 10`} />;
          })}
        </g>
      ) : weather === 'snow' ? (
        <g fill="#ffffff" opacity="0.9">
          {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 43) % 400} cy={60 + ((i * 31) % 120)} r={1.6 + (i % 3)} />)}
        </g>
      ) : weather === 'fog' ? (
        <rect y="90" width="400" height="130" fill="#ffffff" opacity="0.35" />
      ) : null}
      {night && (
        <g fill="#fdf3c8">
          {[[40, 30], [120, 22], [180, 50], [240, 18], [290, 70], [380, 30], [80, 80], [210, 92]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} opacity={0.6 + (i % 3) * 0.15} />
          ))}
        </g>
      )}

    </svg>
  );
}

export function SeedlingEmpty() {
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" aria-hidden="true">
      <g filter="url(#gouache)">
        <ellipse cx="70" cy="96" rx="52" ry="12" fill="#c9a47d" opacity="0.55" />
        <path d="M70 94 C70 76 70 64 70 52" stroke="#4f9a6a" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M70 70 C52 70 42 58 42 46 C58 46 68 56 70 70Z" fill="#8cc265" />
        <path d="M70 60 C86 60 98 48 98 34 C82 34 72 44 70 60Z" fill="#a9d27e" />
      </g>
      <Sparkle x={112} y={26} s={0.6} color="#f3c93f" />
      <Sparkle x={28} y={30} s={0.45} color="#f294ad" />
    </svg>
  );
}
