import { tr } from './i18n';
import type { PaletteKey } from './types';

export interface Swatch { base: string; soft: string; ink: string; label: string }

/* Sunlit garden palette: luminous, airy colours with lilac shadows (from Sabrina's moodboard). */
export const PALETTE: Record<PaletteKey, Swatch> = {
  meadow: { base: '#a3d46c', soft: '#edf7dd', ink: '#33601d', get label() { return tr('Blattgrün', 'Leaf'); } },
  pond: { base: '#5fcac2', soft: '#dbf4f1', ink: '#17524d', get label() { return tr('Aquaglas', 'Aqua glass'); } },
  sky: { base: '#9dcdf3', soft: '#e3f1fc', ink: '#1f4e78', get label() { return tr('Himmel', 'Sky'); } },
  lilac: { base: '#bba5f2', soft: '#efe9fd', ink: '#47388a', get label() { return tr('Flieder', 'Lilac'); } },
  violet: { base: '#a08ae2', soft: '#e9e3fa', ink: '#3c2d7d', get label() { return tr('Veilchen', 'Violet'); } },
  blossom: { base: '#f59cc6', soft: '#fde4ef', ink: '#8a2a58', get label() { return tr('Hortensie', 'Hydrangea'); } },
  clay: { base: '#f8987b', soft: '#fee4db', ink: '#8a3920', get label() { return tr('Koralle', 'Coral'); } },
  peach: { base: '#fcc08c', soft: '#feeedd', ink: '#7d4410', get label() { return tr('Pfirsich', 'Peach'); } },
  sun: { base: '#f7d95e', soft: '#fdf5cd', ink: '#6a5410', get label() { return tr('Butter', 'Butter'); } },
};

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

export const ICONS = ['🌱', '🌿', '🌸', '🌼', '☀️', '🌙', '💧', '📖', '🏃', '🧘', '🎨', '🎵', '🍎', '💤', '✍️', '🫶', '🐾', '🍵'];

export const UNITS = ['mal', 'Minuten', 'Stunden', 'Seiten', 'km', 'Schritte', 'Gläser', 'ml', 'kcal', '€'];
export const UNITS_EN = ['times', 'minutes', 'hours', 'pages', 'km', 'steps', 'glasses', 'ml', 'kcal', '€'];
