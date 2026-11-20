import type { Category, Goal } from './types';

export const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: 'nourish', label: 'Nahrung', hint: 'steigt wie Wasser' },
  { value: 'restore', label: 'Regeneration', hint: 'dämmert sanft herein' },
  { value: 'move', label: 'Bewegung', hint: 'schwungvoll wie ein Pinselstrich' },
  { value: 'connect', label: 'Verbindung', hint: 'verbunden wie Kreise' },
  { value: 'meaning', label: 'Sinn', hint: 'leuchtet wie ein Sonnenaufgang' },
  { value: 'play', label: 'Autonomie & Spiel', hint: 'hüpft mit Punkten' },
];

export const categoryOf = (g: Goal): Category => g.category ?? 'nourish';

/** "Wenn ich aufwache" – older entries were stored with an English "I " prefix. */
export const cueText = (cue: string) => `Wenn ich ${cue.replace(/^I\s+/i, '')}`;
