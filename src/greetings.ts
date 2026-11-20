/**
 * Greetings per time of day. A line is either plain text or a set of variants
 * by pronoun, so gendered words (Queen/King/…) adapt. "{name}" is filled with
 * the person's name; ", {name}" disappears when no name is set.
 */
export type Pronoun = 'she' | 'he' | 'they' | 'custom' | '';
type Line = string | { she: string; he: string; they: string };

export const GREETINGS: Record<'morning' | 'lunch' | 'afternoon' | 'evening' | 'night', Line[]> = {
  morning: [
    'Good morning, Rockstar.',
    'Rise and shine, {name}.',
    'Main character has awakened.',
    'Start your engines, {name}.',
  ],
  lunch: [
    "You're serving, {name}.",
    'Lunch first, world domination later.',
    'Lunch eleganza extravaganza.',
  ],
  afternoon: [
    'Werk it, {name}.',
    'Charisma, Uniqueness, Nerve & Talent. Alles da.',
  ],
  evening: [
    'Was für ein Tag, Legende.',
    'You ate today, {name}.',
  ],
  night: [
    'Gute Nacht, {name}.',
    'Sashay away to bed.',
  ],
};

export function slotFor(now: Date): keyof typeof GREETINGS {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 14 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

function render(line: Line, name: string, pronoun: Pronoun): string {
  const key = pronoun === 'she' || pronoun === 'he' ? pronoun : 'they';
  const text = typeof line === 'string' ? line : line[key];
  const n = name.trim();
  return n ? text.replace(/\{name\}/g, n) : text.replace(/,?\s*\{name\}/g, '');
}

/** One line per slot per day, so it stays put while the day goes on. */
export function greetingFor(now: Date, name: string, pronoun: Pronoun): string {
  const lines = GREETINGS[slotFor(now)];
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const doy = Math.floor((now.getTime() - start) / 86400_000);
  return render(lines[doy % lines.length], name, pronoun);
}
