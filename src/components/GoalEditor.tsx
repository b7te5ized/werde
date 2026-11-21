import { useRef, useState } from 'react';
import type { Category, Direction, Goal, PaletteKey, Period, Theme } from '../types';
import { PALETTE, PALETTE_KEYS, UNITS } from '../palette';
import { uid, useStore } from '../store';
import { Segmented, Sheet } from './Sheet';
import { Fill } from './Fill';
import { CATEGORIES } from '../categories';


export function GoalEditor({ goal, defaultThemeId, onClose }: { goal?: Goal; defaultThemeId?: string; onClose: () => void }) {
  const { data, saveGoal, saveTheme } = useStore();
  const [name, setName] = useState(goal?.name ?? '');
  const [themeId, setThemeId] = useState(goal?.themeId ?? defaultThemeId ?? data.themes[0]?.id ?? '');
  const [newTheme, setNewTheme] = useState(data.themes.length === 0);
  const [themeName, setThemeName] = useState('');
  const [themeColor, setThemeColor] = useState<PaletteKey>(PALETTE_KEYS[data.themes.length % PALETTE_KEYS.length]);
  const [themeIcon, setThemeIcon] = useState('🌱');
  const initialUnit = goal?.unit ?? 'mal';
  const isCustom = !UNITS.includes(initialUnit);
  const [unitSel, setUnitSel] = useState(isCustom ? '__custom' : initialUnit);
  const [customUnit, setCustomUnit] = useState(isCustom ? initialUnit : '');
  const [target, setTarget] = useState(String(goal?.target ?? 1));
  const [step, setStep] = useState(String(goal?.step ?? 1));
  const [period, setPeriod] = useState<Period>(goal?.period ?? 'day');
  const [direction, setDirection] = useState<Direction>(goal?.direction ?? 'more');
  const [category, setCategory] = useState<Category>(goal?.category ?? 'nourish');
  const [cue, setCue] = useState((goal?.cue ?? '').replace(/^I\s+/i, ''));
  const [why, setWhy] = useState(goal?.why ?? '');

  const unit = unitSel === '__custom' ? customUnit.trim() : unitSel;
  const t = Number(target.replace(',', '.'));
  const s = Number(step.replace(',', '.'));
  const valid = name.trim() && unit && t > 0 && s > 0 && (newTheme ? themeName.trim() : themeId);
  const previewColor = newTheme ? PALETTE[themeColor] : PALETTE[data.themes.find((x) => x.id === themeId)?.color ?? 'meadow'];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    let tid = themeId;
    if (newTheme) {
      const th: Theme = { id: uid(), name: themeName.trim(), color: themeColor, icon: themeIcon, createdAt: Date.now() };
      saveTheme(th);
      tid = th.id;
    }
    saveGoal({
      id: goal?.id ?? uid(), themeId: tid, name: name.trim(), unit, target: t, step: s, period, direction, category,
      paused: goal?.paused ?? false, createdAt: goal?.createdAt ?? Date.now(),
      cue: cue.trim() || undefined, why: why.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet title={goal ? 'Ziel bearbeiten' : 'Neues Ziel'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deine Worte, dein Ziel" maxLength={60} />
        </label>

        <label className="field">
          <span>Warum ist dir das wichtig?</span>
          <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} maxLength={200}
            placeholder="Wird dir an schwereren Tagen gezeigt. Optional." />
        </label>

        <fieldset className="field">
          <legend>Thema</legend>
          <div className="chips">
            {data.themes.map((th) => (
              <button type="button" key={th.id} className={`chip${!newTheme && themeId === th.id ? ' on' : ''}`}
                style={{ '--chip': PALETTE[th.color].soft, '--chip-ink': PALETTE[th.color].ink } as React.CSSProperties}
                aria-pressed={!newTheme && themeId === th.id} onClick={() => { setNewTheme(false); setThemeId(th.id); }}>
                {th.icon} {th.name}
              </button>
            ))}
            <button type="button" className={`chip${newTheme ? ' on' : ''}`} aria-pressed={newTheme} onClick={() => setNewTheme(true)}>
              + Neues Thema
            </button>
          </div>
          {newTheme && (
            <div className="new-theme">
              <input value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="Name, z. B. Körper, Geist, Zuhause" maxLength={40} aria-label="Name des Themas" />
              <ColorPicker value={themeColor} onChange={setThemeColor} />
              <IconPicker value={themeIcon} onChange={setThemeIcon} />
            </div>
          )}
        </fieldset>

        <div className="field">
          <span className="legend">Richtung</span>
          <Segmented label="Richtung" value={direction} onChange={setDirection}
            options={[{ value: 'more', label: 'Aufbauen' }, { value: 'less', label: 'Reduzieren' }]} />
        </div>

        <div className="field">
          <span className="legend">{direction === 'more' ? 'Ziel' : 'Obergrenze'}</span>
          <div className="row">
            <input className="num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Menge" />
            <select value={unitSel} onChange={(e) => setUnitSel(e.target.value)} aria-label="Einheit">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">Eigene Einheit…</option>
            </select>
          </div>
          {unitSel === '__custom' && (
            <input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder="z. B. Spaziergänge, Lieder, Atemzüge" aria-label="Eigene Einheit" maxLength={20} />
          )}
          <Segmented label="Zeitraum" value={period} onChange={setPeriod}
            options={[{ value: 'day', label: 'pro Tag' }, { value: 'week', label: 'pro Woche' }, { value: 'month', label: 'pro Monat' }]} />
        </div>

        <div className="field">
          <label htmlFor="cue-input" className="legend">Anker (optional)</label>
          <div className="cue-row">
            <span>Wenn ich</span>
            <input id="cue-input" value={cue} onChange={(e) => setCue(e.target.value)}
              placeholder="meinen Morgenkaffee trinke" maxLength={60} />
          </div>
        </div>

        <label className="field">
          <span>Ein Tipp fügt hinzu</span>
          <div className="row">
            <input className="num" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} />
            <span className="unit-hint">{unit || 'Einheiten'}</span>
          </div>
        </label>

        <fieldset className="field">
          <legend>Was für eine Gewohnheit ist es?</legend>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.value} className={`cat-tile${category === c.value ? ' on' : ''}`}
                aria-pressed={category === c.value} onClick={() => setCategory(c.value)} aria-label={c.label}>
                <Fill pct={0.55} color={previewColor.base} category={c.value} />
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary" type="submit" disabled={!valid}>{goal ? 'Speichern' : 'Erstellen'}</button>
      </form>
    </Sheet>
  );
}

export function ColorPicker({ value, onChange }: { value: PaletteKey; onChange: (k: PaletteKey) => void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Farbe">
      {PALETTE_KEYS.map((k) => (
        <button type="button" key={k} role="radio" aria-checked={value === k} aria-label={PALETTE[k].label}
          className={`swatch${value === k ? ' on' : ''}`} style={{ backgroundColor: PALETTE[k].base }} onClick={() => onChange(k)} />
      ))}
    </div>
  );
}

/** Pick any emoji: tap the field and choose from the phone's own emoji keyboard. */
export function IconPicker({ value, onChange }: { value: string; onChange: (i: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="emoji-pick">
      <button type="button" className="emoji-current" onClick={() => ref.current?.focus()} aria-label={`Symbol ${value}, ändern`}>{value}</button>
      <label className="emoji-field">
        <input ref={ref} type="text" value="" placeholder="Emoji wählen" aria-label="Emoji eingeben" enterKeyHint="done"
          onChange={(e) => { const g = lastEmoji(e.target.value); if (g) { onChange(g); e.target.blur(); } }} />
        <span className="muted small">Tippen, dann auf der Tastatur 😀 oder 🌐 und ein Emoji wählen.</span>
      </label>
    </div>
  );
}

function lastEmoji(text: string): string | null {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter;
  const parts = Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (x) => x.segment) : Array.from(text);
  for (let i = parts.length - 1; i >= 0; i--) if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(parts[i])) return parts[i];
  return null;
}
