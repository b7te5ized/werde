import { tr } from './i18n';
import { useEffect } from 'react';
import type { Phase } from './sky';

/** Colour worlds for the light and the dark look. The first of each is the original werde look (no overrides). */
type Vars = Record<string, string>;
export interface ColorWorld { id: string; label: string; swatch: [string, string, string]; vars: Vars }

const v = (bg: string, paper: string, ink: string, inkSoft: string, line: string, accent: string, accentInk: string, well: string, onBg: string, onInk: string, nav: string, switchOff: string): Vars => ({
  '--bg': bg, '--paper': paper, '--ink': ink, '--ink-soft': inkSoft, '--line': line, '--accent': accent, '--accent-ink': accentInk,
  '--well': well, '--on-bg': onBg, '--on-ink': onInk, '--nav-bg': nav, '--switch-off': switchOff,
});

export const LIGHT_WORLDS: ColorWorld[] = [
  { id: 'creme', get label() { return tr('Creme', 'Cream'); }, swatch: ['#fbf6e4', '#fffdf5', '#3f8a72'], vars: {} },
  { id: 'salbei', get label() { return tr('Salbei', 'Sage'); }, swatch: ['#eef3ea', '#fbfdf8', '#4f7f63'], vars: v('#eef3ea', '#fbfdf8', '#26372f', '#5b6e63', '#d9e3d3', '#4f7f63', '#fbfdf8', '#e3ebdd', '#d7e8cf', '#2f4f37', 'rgba(251,253,248,.92)', '#d6dfd0') },
  { id: 'rose', get label() { return tr('Rosé', 'Rosé'); }, swatch: ['#fbf0ef', '#fffafa', '#c0607a'], vars: v('#fbf0ef', '#fffafa', '#4a2f36', '#85626b', '#f0dcdc', '#c0607a', '#ffffff', '#f6e4e4', '#f7d9df', '#7a2f45', 'rgba(255,250,250,.92)', '#ecd8d8') },
  { id: 'nebel', get label() { return tr('Nebel', 'Mist'); }, swatch: ['#f1f3f6', '#ffffff', '#4f6fa8'], vars: v('#f1f3f6', '#ffffff', '#273142', '#5e6878', '#dfe3ea', '#4f6fa8', '#ffffff', '#e7ebf1', '#dbe4f3', '#2c4778', 'rgba(255,255,255,.92)', '#d9dee6') },
  { id: 'papier', get label() { return tr('Papier', 'Paper'); }, swatch: ['#f4f1ea', '#ffffff', '#1d1c1a'], vars: v('#f4f1ea', '#ffffff', '#1d1c1a', '#5f5b53', '#e2ddd2', '#1d1c1a', '#f4f1ea', '#ebe6dc', '#e5dfd2', '#1d1c1a', 'rgba(255,255,255,.92)', '#ddd7cb') },
];

export const DARK_WORLDS: ColorWorld[] = [
  { id: 'espresso', label: 'Espresso', swatch: ['#2c2a22', '#3a362b', '#e0b25e'], vars: {} },
  { id: 'kohle', get label() { return tr('Kohle & Rot', 'Coal & red'); }, swatch: ['#0f0f0f', '#1c1c1c', '#e0574c'], vars: v('#0f0f0f', '#1c1c1c', '#f2ede3', '#aaa397', '#2c2c2c', '#e0574c', '#0f0f0f', '#252525', '#3d1c1a', '#ffd9d4', 'rgba(28,28,28,.94)', '#363636') },
  { id: 'tinte', get label() { return tr('Tinte', 'Ink'); }, swatch: ['#161a22', '#1f2530', '#8fb4ff'], vars: v('#161a22', '#1f2530', '#e6ebf5', '#9aa6ba', '#2d3442', '#8fb4ff', '#161a22', '#283041', '#2c3b57', '#dbe6ff', 'rgba(31,37,48,.94)', '#343c4c') },
  { id: 'wald', get label() { return tr('Wald', 'Forest'); }, swatch: ['#172019', '#202b22', '#9fd18a'], vars: v('#172019', '#202b22', '#e3eee0', '#9fb39c', '#2e3b30', '#9fd18a', '#172019', '#29362b', '#2f4a2f', '#dff0d6', 'rgba(32,43,34,.94)', '#344236') },
  { id: 'pflaume', get label() { return tr('Pflaume', 'Plum'); }, swatch: ['#211a22', '#2c232d', '#e6a3cf'], vars: v('#211a22', '#2c232d', '#f1e4ef', '#b8a1b4', '#3c3040', '#e6a3cf', '#211a22', '#362b38', '#4a3049', '#f6dcef', 'rgba(44,35,45,.94)', '#43364a') },
];

export interface FontChoice { id: string; label: string; css: string; google?: string }
export const HEAD_FONTS: FontChoice[] = [
  { id: 'fraunces', label: 'Fraunces', css: "'Fraunces', Georgia, serif" },
  { id: 'playfair', label: 'Playfair', css: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:ital,wght@0,400..800;1,400..800' },
  { id: 'dmserif', label: 'DM Serif', css: "'DM Serif Display', Georgia, serif", google: 'DM+Serif+Display:ital@0;1' },
  { id: 'caveat', get label() { return tr('Handschrift', 'Handwritten'); }, css: "'Caveat', cursive", google: 'Caveat:wght@400..700' },
  { id: 'figtree', get label() { return tr('Schlicht', 'Plain'); }, css: "'Figtree', system-ui, sans-serif" },
];
export const BODY_FONTS: FontChoice[] = [
  { id: 'figtree', label: 'Figtree', css: "'Figtree', system-ui, sans-serif" },
  { id: 'inter', label: 'Inter', css: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400..800' },
  { id: 'nunito', label: 'Nunito', css: "'Nunito', system-ui, sans-serif", google: 'Nunito:wght@400..800' },
  { id: 'atkinson', get label() { return tr('Gut lesbar', 'Easy to read'); }, css: "'Atkinson Hyperlegible', system-ui, sans-serif", google: 'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700' },
  { id: 'lora', label: 'Lora', css: "'Lora', Georgia, serif", google: 'Lora:ital,wght@0,400..700;1,400..700' },
];

const loaded = new Set<string>();
/** Loads extra Google Fonts on demand (the default pair is already in the page). */
export function loadFonts(list: FontChoice[]) {
  const fams = list.filter((f) => f.google && !loaded.has(f.id));
  if (!fams.length) return;
  fams.forEach((f) => loaded.add(f.id));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f.google}`).join('&')}&display=swap`;
  document.head.appendChild(link);
}

export interface LookPrefs { lightWorld?: string; darkWorld?: string; fontHead?: string; fontBody?: string }

/** Paints the chosen colour world (light by day, dark at night) and fonts onto the page. */
export function useLook(phase: Phase, prefs: LookPrefs) {
  const { lightWorld, darkWorld, fontHead, fontBody } = prefs;
  useEffect(() => {
    const root = document.documentElement;
    const all = [...LIGHT_WORLDS, ...DARK_WORLDS].flatMap((w) => Object.keys(w.vars));
    new Set(all).forEach((k) => root.style.removeProperty(k));
    const world = phase === 'night' ? DARK_WORLDS.find((w) => w.id === darkWorld) : LIGHT_WORLDS.find((w) => w.id === lightWorld);
    Object.entries(world?.vars ?? {}).forEach(([k, val]) => root.style.setProperty(k, val));
    root.classList.toggle('custom-world', !!world && Object.keys(world.vars).length > 0);
    const head = HEAD_FONTS.find((f) => f.id === fontHead) ?? HEAD_FONTS[0];
    const body = BODY_FONTS.find((f) => f.id === fontBody) ?? BODY_FONTS[0];
    loadFonts([head, body]);
    root.style.setProperty('--font-head', head.css);
    root.style.setProperty('--font-body', body.css);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#fbf6e4');
  }, [phase, lightWorld, darkWorld, fontHead, fontBody]);
}
