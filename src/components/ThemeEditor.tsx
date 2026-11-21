import { useState } from 'react';
import type { Theme } from '../types';
import { useStore } from '../store';
import { ColorPicker, IconPicker } from './GoalEditor';
import { Sheet } from './Sheet';

export function ThemeEditor({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const { data, saveTheme, deleteTheme } = useStore();
  const [name, setName] = useState(theme.name);
  const [color, setColor] = useState(theme.color);
  const [icon, setIcon] = useState(theme.icon);
  const count = data.goals.filter((g) => g.themeId === theme.id).length;
  return (
    <Sheet title="Thema bearbeiten" onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { saveTheme({ ...theme, name: name.trim(), color, icon }); onClose(); } }}>
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></label>
        <div className="field"><span className="legend">Farbe</span><ColorPicker value={color} onChange={setColor} /></div>
        <div className="field"><span className="legend">Symbol</span><IconPicker value={icon} onChange={setIcon} /></div>
        <button className="primary" type="submit" disabled={!name.trim()}>Speichern</button>
        <button type="button" className="secondary quiet" onClick={() => { deleteTheme(theme.id); onClose(); }}>
          Thema entfernen{count ? ` mit ${count} ${count > 1 ? 'Zielen' : 'Ziel'}` : ''}
        </button>
      </form>
    </Sheet>
  );
}
