import type { PaletteKey } from './types';

export interface Swatch { base: string; soft: string; ink: string; label: string }

/* Sunlit garden palette: luminous, airy colours with lilac shadows (from Sabrina's moodboard). */
export const PALETTE: Record<PaletteKey, Swatch> = {
  meadow: { base: '#a3d46c', soft: '#edf7dd', ink: '#33601d', label: 'Blattgrün' },
  pond: { base: '#5fcac2', soft: '#dbf4f1', ink: '#17524d', label: 'Aquaglas' },
  sky: { base: '#9dcdf3', soft: '#e3f1fc', ink: '#1f4e78', label: 'Himmel' },
  lilac: { base: '#bba5f2', soft: '#efe9fd', ink: '#47388a', label: 'Flieder' },
  violet: { base: '#a08ae2', soft: '#e9e3fa', ink: '#3c2d7d', label: 'Veilchen' },
  blossom: { base: '#f59cc6', soft: '#fde4ef', ink: '#8a2a58', label: 'Hortensie' },
  clay: { base: '#f8987b', soft: '#fee4db', ink: '#8a3920', label: 'Koralle' },
  peach: { base: '#fcc08c', soft: '#feeedd', ink: '#7d4410', label: 'Pfirsich' },
  sun: { base: '#f7d95e', soft: '#fdf5cd', ink: '#6a5410', label: 'Butter' },
};

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

export const ICONS = ['🌱', '🌿', '🌸', '🌼', '☀️', '🌙', '💧', '📖', '🏃', '🧘', '🎨', '🎵', '🍎', '💤', '✍️', '🫶', '🐾', '🍵'];

export const UNITS = ['mal', 'Minuten', 'Stunden', 'Seiten', 'km', 'Schritte', 'Gläser', 'ml', 'kcal', '€'];
