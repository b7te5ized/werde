/**
 * Greetings per time of day (without the name: the name lives in the quote below). A line is plain text or variants by pronoun, so
 * gendered words (Queen/King/…) adapt. "{name}" is the person's name; ", {name}"
 * disappears when no name is set. Each line ends with a small drawn icon.
 */
export type Pronoun = 'she' | 'he' | 'they' | 'custom' | '';
export type GreetIconKind = 'sunrise' | 'star' | 'sparkles' | 'shooting' | 'moon' | 'crown';
type Text = string | { she: string; he: string; they: string };
interface Line { text: Text; icon: GreetIconKind }

export const GREETINGS: Record<'morning' | 'lunch' | 'afternoon' | 'evening' | 'night', Line[]> = {
  morning: [
    { text: 'Good morning, Rockstar.', icon: 'star' },
    { text: 'Rise and shine.', icon: 'sunrise' },
    { text: 'Main character has awakened.', icon: 'sparkles' },
    { text: 'Start your engines.', icon: 'shooting' },
  ],
  lunch: [
    { text: "You're serving.", icon: 'sparkles' },
    { text: 'Lunch first, world domination later.', icon: 'crown' },
    { text: 'Lunch eleganza extravaganza.', icon: 'star' },
  ],
  afternoon: [
    { text: 'Werk it.', icon: 'sparkles' },
    { text: 'Charisma, Uniqueness, Nerve & Talent. Alles da.', icon: 'crown' },
  ],
  evening: [
    { text: 'Was für ein Tag, Legende.', icon: 'shooting' },
    { text: 'You ate today.', icon: 'star' },
  ],
  night: [
    { text: 'Gute Nacht.', icon: 'moon' },
    { text: 'Sashay away to bed.', icon: 'shooting' },
  ],
};

export type Slot = keyof typeof GREETINGS;

export function slotFor(now: Date): Slot {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 14 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

export function renderText(text: Text, name: string, pronoun: Pronoun): string {
  const key = pronoun === 'she' || pronoun === 'he' ? pronoun : 'they';
  const t = typeof text === 'string' ? text : text[key];
  const n = name.trim();
  return n ? t.replace(/\{name\}/g, n) : t.replace(/,?\s*\{name\}/g, '');
}

/** Texts the person wrote or edited themselves. Missing means the built-in lines are used. */
export interface CustomTexts { greetings: Record<Slot, string[]>; quotes: string[] }

export const SLOT_ICON: Record<Slot, GreetIconKind> = { morning: 'sunrise', lunch: 'sparkles', afternoon: 'sparkles', evening: 'star', night: 'moon' };
export const SLOT_LABEL: Record<Slot, string> = { morning: 'Morgen (5 bis 11 Uhr)', lunch: 'Mittag (11 bis 14 Uhr)', afternoon: 'Nachmittag (14 bis 17 Uhr)', evening: 'Abend (17 bis 22 Uhr)', night: 'Nacht (22 bis 5 Uhr)' };
export const SLOTS: Slot[] = ['morning', 'lunch', 'afternoon', 'evening', 'night'];

/** The built-in lines as editable plain text (a starting point for the person's own). */
export function defaultTexts(): CustomTexts {
  const plain = (t: Text) => (typeof t === 'string' ? t : t.they);
  return {
    greetings: Object.fromEntries(SLOTS.map((k) => [k, GREETINGS[k].map((l) => plain(l.text))])) as Record<Slot, string[]>,
    quotes: QUOTES.map(plain),
  };
}

function linesFor(slot: Slot, custom?: CustomTexts): Line[] {
  const own = custom?.greetings?.[slot]?.filter((t) => t.trim());
  if (!own || own.length === 0) return GREETINGS[slot];
  return own.map((text) => GREETINGS[slot].find((l) => l.text === text) ?? { text, icon: SLOT_ICON[slot] });
}

let lastPick = '';
/** A random line from this time of day, never the same one twice in a row. */
export function pickGreeting(now: Date, name: string, pronoun: Pronoun, custom?: CustomTexts): { text: string; icon: GreetIconKind } {
  const lines = linesFor(slotFor(now), custom);
  const pool = lines.length > 1 ? lines.filter((l) => JSON.stringify(l.text) !== lastPick) : lines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  lastPick = JSON.stringify(line.text);
  // greetings carry no punctuation; only the quote below does
  const text = renderText(line.text, name, pronoun).replace(/[.,;:!?]/g, '').replace(/\s+/g, ' ').trim();
  return { text, icon: line.icon };
}

/** Quotes shown under the greeting, in a smaller font. */
export const QUOTES: Text[] = [
  'Let the thoughts pass and focus on the ones you want to have, {name}.',
  'Wünsche, statt Erwartungen, {name}.',
  'Be okay with wherever the hell you are, {name}.',
  'You can change your mind whenever you want, {name}.',
  'People are literally rooting for you, {name}.',
];

let lastQuote = -1;
export function pickQuote(name: string, pronoun: Pronoun, custom?: CustomTexts): string {
  const own = custom?.quotes?.filter((t) => t.trim());
  const list: Text[] = own && own.length ? own : QUOTES;
  let i = Math.floor(Math.random() * list.length);
  if (i === lastQuote && list.length > 1) i = (i + 1) % list.length;
  lastQuote = i;
  return renderText(list[i], name, pronoun);
}
