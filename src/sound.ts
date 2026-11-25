/**
 * Celebration sounds, synthesized with Web Audio (no files to load).
 * iOS and Android only let audio start from a tap, so the context is created and
 * resumed on the first touch and again whenever the system suspended it.
 */
type Ctx = AudioContext;
let ctx: Ctx | null = null;
let master: GainNode | null = null;

function audio(): Ctx | null {
  if (ctx) return ctx;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx = new C();
  const comp = ctx.createDynamicsCompressor();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

function wake() {
  const c = audio();
  if (!c) return;
  if (c.state !== 'running') c.resume().catch(() => {});
  // a silent blip unlocks older iOS Safari
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b; s.connect(c.destination); s.start(0);
}

let installed = false;
/** Call once: keeps the audio context awake from real taps. */
export function installAudioUnlock() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const on = () => { if (!ctx || ctx.state !== 'running') wake(); };
  for (const ev of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(ev, on, { capture: true, passive: true });
}

/** One soft bell: a sine with a quieter octave and a fast fade. */
function bell(c: BaseAudioContext, out0: AudioNode, at: number, freq: number, dur: number, vol: number, pan = 0) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  let out: AudioNode = g;
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  out.connect(out0);
  for (const [mult, v, type] of [[1, 1, 'sine'], [2, 0.28, 'sine'], [3.01, 0.08, 'triangle']] as const) {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = type;
    o.frequency.value = freq * mult;
    og.gain.value = v;
    o.connect(og); og.connect(g);
    o.start(at); o.stop(at + dur + 0.05);
  }
}

const N = (semi: number) => 523.25 * Math.pow(2, semi / 12); // semitones from C5

function ready(): Ctx | null {
  const c = audio();
  if (!c) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  return c;
}

/** A goal reached: a quick bright four-note rise. */
export function playGoal() {
  const c = ready(); if (c && master) goalSound(c, master, c.currentTime + 0.03);
}

export function goalSound(c: BaseAudioContext, out: AudioNode, t: number) {
  [0, 4, 7, 12].forEach((s, i) => bell(c, out, t + i * 0.085, N(s + 12), 0.9 + i * 0.15, 0.22, -0.4 + i * 0.27));
  bell(c, out, t + 0.36, N(28), 1.2, 0.07, 0.3);
}

/** Every goal of the day: a sparkling run up the rainbow, then a warm chord that rings out. */
export function playDay() {
  const c = ready(); if (c && master) daySound(c, master, c.currentTime + 0.03);
}

export function daySound(c: BaseAudioContext, out: AudioNode, t: number) {
  const run = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  run.forEach((s, i) => bell(c, out, t + i * 0.065, N(s + 7), 0.7, 0.13, -0.8 + (i / (run.length - 1)) * 1.6));
  const ch = t + run.length * 0.065 + 0.05;
  [-12, 0, 4, 7, 11, 14].forEach((s, i) => bell(c, out, ch + i * 0.02, N(s + 7), 2.8, i === 0 ? 0.16 : 0.12, (i % 2 ? 0.3 : -0.3)));
  [31, 28, 35, 31, 36].forEach((s, i) => bell(c, out, ch + 0.35 + i * 0.22, N(s), 1.1, 0.05, i % 2 ? 0.6 : -0.6));
}
