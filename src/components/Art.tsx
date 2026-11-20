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

export function Sparkle({ x, y, s, color = '#fff6c9' }: { x: number; y: number; s: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -10 C1.5 -2.5 2.5 -1.5 10 0 C2.5 1.5 1.5 2.5 0 10 C-1.5 2.5 -2.5 1.5 -10 0 C-2.5 -1.5 -1.5 -2.5 0 -10Z"
      fill={color}
    />
  );
}

