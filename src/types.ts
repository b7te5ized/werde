export type PaletteKey = 'meadow' | 'pond' | 'sun' | 'blossom' | 'lilac' | 'sky' | 'clay' | 'violet' | 'peach';
export type Period = 'day' | 'week' | 'month';
export type Direction = 'more' | 'less';
export type StatusStyle = 'bar' | 'ring' | 'plant' | 'vessel';
export type Category = 'nourish' | 'restore' | 'move' | 'connect' | 'meaning' | 'autonomy' | 'play';

export interface Theme {
  id: string;
  name: string;
  color: PaletteKey;
  icon: string;
  createdAt: number;
  /** goals hidden on the Today view */
  collapsed?: boolean;
}

export interface Goal {
  id: string;
  themeId: string;
  name: string;
  unit: string;
  target: number;
  step: number;
  period: Period;
  direction: Direction;
  /** legacy progress style, kept for older saved data */
  style?: StatusStyle;
  /** what kind of habit it is; shapes how the card fills */
  category?: Category;
  paused: boolean;
  createdAt: number;
  /** optional anchor: "After I ..." */
  cue?: string;
  /** the user's own reason, shown on harder days */
  why?: string;
}

export interface Log {
  id: string;
  goalId: string;
  amount: number;
  at: number;
}

export interface Settings {
  reminderHours: number;
  quietStart: string; // "22:00"
  quietEnd: string; // "07:00"
  celebrations: boolean;
  remindersOn: boolean;
  lastNudgeAt: number;
  firstOpenedAt: number;
  openInQuickLog: boolean;
  skyMode: 'auto' | 'light' | 'dark';
  breathingMoment: boolean;
  restUntil: number;
  /** how werde greets you */
  name: string;
  /** she | he | they | custom | "" (not chosen) */
  pronoun: 'she' | 'he' | 'they' | 'custom' | '';
  customPronoun: string;
  /** first-open question answered or skipped */
  welcomed: boolean;
  /** last time a backup copy was saved (or the reminder postponed) */
  lastBackupAt: number;
  /** backup reminder postponed until */
  backupSnoozeUntil: number;
  /** colour worlds and fonts (optional; the original look when missing) */
  lightWorld?: string;
  darkWorld?: string;
  fontHead?: string;
  fontBody?: string;
}

export interface Data {
  version: 1;
  themes: Theme[];
  goals: Goal[];
  logs: Log[];
  settings: Settings;
  /** goalId -> start of the period in which its bloom was celebrated */
  celebrated: Record<string, number>;
  /** whole-app rest days (day keys) */
  restDays: string[];
  /** per-goal freeze days (day keys) */
  freezes: Record<string, string[]>;
  /** ideas and future habits that do not fit yet */
  notes: Note[];
  /** short daily notes per goal: goalId -> dayKey -> text (optional so older data and backups stay valid) */
  dayNotes?: Record<string, Record<string, string>>;
  /** the person's own greetings and quotes (optional; built-in lines when missing) */
  texts?: import('./greetings').CustomTexts;
}

export interface Note { id: string; text: string; at: number }
