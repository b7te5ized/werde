import { useRef, useState } from 'react';
import type { Category, Direction, Goal, PaletteKey, Period, Theme } from '../types';
import { PALETTE, PALETTE_KEYS, UNITS, UNITS_EN } from '../palette';
import { uid, useStore } from '../store';
import { Segmented, Sheet } from './Sheet';
import { Fill } from './Fill';
import { CATEGORIES } from '../categories';
import { tr } from '../i18n';


export function GoalEditor({ goal, defaultThemeId, onClose }: { goal?: Goal; defaultThemeId?: string; onClose: () => void }) {
  const { data, saveGoal, saveTheme } = useStore();
  const [name, setName] = useState(goal?.name ?? '');
  const [themeId, setThemeId] = useState(goal?.themeId ?? defaultThemeId ?? data.themes[0]?.id ?? '');
  const [newTheme, setNewTheme] = useState(data.themes.length === 0);
  const [themeName, setThemeName] = useState('');
  const [themeColor, setThemeColor] = useState<PaletteKey>(PALETTE_KEYS[data.themes.length % PALETTE_KEYS.length]);
  const [themeIcon, setThemeIcon] = useState('🌱');
  const initialUnit = goal?.unit ?? tr('mal', 'times');
  const isCustom = !UNITS.includes(initialUnit) && !UNITS_EN.includes(initialUnit);
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
  const tgt = Number(target.replace(',', '.'));
  const s = Number(step.replace(',', '.'));
  const valid = name.trim() && unit && tgt > 0 && s > 0 && (newTheme ? themeName.trim() : themeId);
  const previewColor = newTheme ? PALETTE[themeColor] : PALETTE[data.themes.find((x) => x.id === themeId)?.color ?? 'meadow'];

  const save = () => {
    if (!valid) return false;
    let tid = themeId;
    if (newTheme) {
      const th: Theme = { id: uid(), name: themeName.trim(), color: themeColor, icon: themeIcon, createdAt: Date.now() };
      saveTheme(th);
      tid = th.id;
    }
    saveGoal({
      id: goal?.id ?? uid(), themeId: tid, name: name.trim(), unit, target: tgt, step: s, period, direction, category,
      paused: goal?.paused ?? false, createdAt: goal?.createdAt ?? Date.now(),
      cue: cue.trim() || undefined, why: why.trim() || undefined,
    });
    return true;
  };
  const submit = (e?: React.FormEvent) => { e?.preventDefault(); if (save()) onClose(); };
  // a tap outside keeps what is valid, so nothing gets lost by accident
  const outside = () => { save(); onClose(); };

  return (
    <Sheet title={goal ? tr('Ziel bearbeiten', 'Edit goal') : tr('Neues Ziel', 'New goal')} onClose={onClose} onOutside={outside}
      action={{ label: goal ? tr('Änderungen speichern', 'Save changes') : tr('Erstellen', 'Create'), short: goal ? tr('Speichern', 'Save') : undefined, onClick: () => submit(), disabled: !valid }}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>{tr('Name', 'Name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('Deine Worte, dein Ziel', 'Your words, your goal')} maxLength={60} />
        </label>

        <label className="field">
          <span>{tr('Warum ist dir das wichtig?', 'Why does this matter to you?')}</span>
          <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} maxLength={200}
            placeholder={tr('Steht oben in der Einzelansicht. Optional.', 'Shown at the top of the goal. Optional.')} />
        </label>

        <fieldset className="field">
          <legend>{tr('Thema', 'Theme')}</legend>
          <div className="chips">
            {data.themes.map((th) => (
              <button type="button" key={th.id} className={`chip${!newTheme && themeId === th.id ? ' on' : ''}`}
                style={{ '--chip': PALETTE[th.color].soft, '--chip-ink': PALETTE[th.color].ink } as React.CSSProperties}
                aria-pressed={!newTheme && themeId === th.id} onClick={() => { setNewTheme(false); setThemeId(th.id); }}>
                {th.icon} {th.name}
              </button>
            ))}
            <button type="button" className={`chip${newTheme ? ' on' : ''}`} aria-pressed={newTheme} onClick={() => setNewTheme(true)}>
              {tr('+ Neues Thema', '+ New theme')}
            </button>
          </div>
          {newTheme && (
            <div className="new-theme">
              <input value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder={tr('Name, z. B. Körper, Geist, Zuhause', 'Name, e.g. Body, Mind, Home')} maxLength={40} aria-label={tr('Name des Themas', 'Theme name')} />
              <ColorPicker value={themeColor} onChange={setThemeColor} />
              <IconPicker value={themeIcon} onChange={setThemeIcon} />
            </div>
          )}
        </fieldset>

        <div className="field">
          <span className="legend">{tr('Richtung', 'Direction')}</span>
          <Segmented label={tr('Richtung', 'Direction')} value={direction} onChange={setDirection}
            options={[{ value: 'more', label: tr('Aufbauen', 'Build up') }, { value: 'less', label: tr('Reduzieren', 'Cut back') }]} />
        </div>

        <div className="field">
          <span className="legend">{direction === 'more' ? tr('Ziel', 'Target') : tr('Obergrenze', 'Upper limit')}</span>
          <div className="row">
            <input className="num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={tr('Menge', 'Amount')} />
            <select value={unitSel} onChange={(e) => setUnitSel(e.target.value)} aria-label={tr('Einheit', 'Unit')}>
              {(tr('de', 'en') === 'en' ? UNITS_EN : UNITS).concat(UNITS.includes(unitSel) || UNITS_EN.includes(unitSel) ? [unitSel] : []).filter((u, i, a) => a.indexOf(u) === i).map((u) => <option key={u} value={u}>{u}</option>)}
              <option value="__custom">{tr('Eigene Einheit…', 'Own unit…')}</option>
            </select>
          </div>
          {unitSel === '__custom' && (
            <input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder={tr('z. B. Spaziergänge, Lieder, Atemzüge', 'e.g. walks, songs, breaths')} aria-label={tr('Eigene Einheit', 'Own unit')} maxLength={20} />
          )}
          <Segmented label={tr('Zeitraum', 'Period')} value={period} onChange={setPeriod}
            options={[{ value: 'day', label: tr('pro Tag', 'per day') }, { value: 'week', label: tr('pro Woche', 'per week') }, { value: 'month', label: tr('pro Monat', 'per month') }]} />
        </div>

        <div className="field">
          <label htmlFor="cue-input" className="legend">{tr('Anker (optional)', 'Anchor (optional)')}</label>
          <div className="cue-row">
            <span>{tr('Wenn ich', 'When I')}</span>
            <input id="cue-input" value={cue} onChange={(e) => setCue(e.target.value)}
              placeholder={tr('meinen Morgenkaffee trinke', 'have my morning coffee')} maxLength={60} />
          </div>
        </div>

        <label className="field">
          <span>{tr('Ein Tipp fügt hinzu', 'One tap adds')}</span>
          <div className="row">
            <input className="num" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} />
            <span className="unit-hint">{unit || tr('Einheiten', 'units')}</span>
          </div>
        </label>

        <fieldset className="field">
          <legend>{tr('Füllung', 'Fill')}</legend>
          <p className="muted small fill-hint">{tr('So füllt sich deine Karte. Tippe auf die, die dir gefällt.', 'How your card fills up. Tap the one you like.')}</p>
          <div className="cat-grid fills" role="radiogroup" aria-label={tr('Füllung', 'Fill')}>
            {CATEGORIES.map((c) => (
              <button type="button" key={c.value} role="radio" className={`cat-tile${category === c.value ? ' on' : ''}`}
                aria-checked={category === c.value} onClick={() => setCategory(c.value)} aria-label={c.style}>
                <Fill pct={0.6} color={previewColor.base} category={c.value} />
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary" type="submit" disabled={!valid}>{goal ? tr('Speichern', 'Save') : tr('Erstellen', 'Create')}</button>
      </form>
    </Sheet>
  );
}

export function ColorPicker({ value, onChange }: { value: PaletteKey; onChange: (k: PaletteKey) => void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={tr('Farbe', 'Colour')}>
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
      <button type="button" className="emoji-current" onClick={() => ref.current?.focus()} aria-label={tr(`Symbol ${value}, ändern`, `Icon ${value}, change`)}>{value}</button>
      <label className="emoji-field">
        <input ref={ref} type="text" value="" placeholder={tr('Emoji wählen', 'Choose emoji')} aria-label={tr('Emoji eingeben', 'Enter emoji')} enterKeyHint="done"
          onChange={(e) => { const g = lastEmoji(e.target.value); if (g) { onChange(g); e.target.blur(); } }} />
        <span className="muted small">{tr('Tippen, dann auf der Tastatur 😀 oder 🌐 und ein Emoji wählen.', 'Tap, then 😀 or 🌐 on the keyboard and pick an emoji.')}</span>
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
