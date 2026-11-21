import { tr } from './i18n';
import type { Category, Goal } from './types';

export const CATEGORIES: { value: Category; label: string; hint: string; style?: string }[] = [
  { value: 'nourish', get label() { return tr('Nahrung', 'Nourish'); }, hint: 'steigt wie Wasser', get style() { return tr('Wellen', 'Waves'); } },
  { value: 'restore', get label() { return tr('Regeneration', 'Restore'); }, hint: 'dämmert sanft herein', get style() { return tr('Verlauf', 'Fade'); } },
  { value: 'move', get label() { return tr('Bewegung', 'Move'); }, hint: 'schwungvoll wie ein Pinselstrich', get style() { return tr('Pinsel', 'Brush'); } },
  { value: 'connect', get label() { return tr('Verbindung', 'Connect'); }, hint: 'verbunden wie Kreise', get style() { return tr('Bögen', 'Arcs'); } },
  { value: 'meaning', get label() { return tr('Sinn', 'Meaning'); }, hint: 'leuchtet wie ein Sonnenaufgang', get style() { return tr('Leuchten', 'Glow'); } },
  { value: 'autonomy', get label() { return tr('Autonomie', 'Autonomy'); }, hint: 'frei in die eigene Richtung', get style() { return tr('Schwung', 'Sweep'); } },
  { value: 'play', get label() { return tr('Spiel', 'Play'); }, hint: 'hüpft mit Punkten', get style() { return tr('Punkte', 'Dots'); } },
];

export const categoryOf = (g: Goal): Category => g.category ?? 'nourish';

/** "Wenn ich aufwache" – older entries were stored with an English "I " prefix. */
export const cueText = (cue: string) => `${tr('Wenn ich', 'When I')} ${cue.replace(/^I\s+/i, '')}`;
