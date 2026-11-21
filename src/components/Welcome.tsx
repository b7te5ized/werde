import { useState } from 'react';
import { useStore } from '../store';
import type { Pronoun } from '../greetings';
import { Sheet } from './Sheet';
import { RestoreButton } from './RestoreButton';

export const PRONOUNS: { value: Exclude<Pronoun, ''>; label: string }[] = [
  { value: 'she', label: 'sie/ihr' },
  { value: 'he', label: 'er/ihm' },
  { value: 'they', label: 'they/keine' },
  { value: 'custom', label: 'eigene' },
];

export function PronounPicker({ value, custom, onChange, onCustom }: {
  value: Pronoun; custom: string; onChange: (p: Pronoun) => void; onCustom: (s: string) => void;
}) {
  return (
    <>
      <div className="pronoun-row" role="radiogroup" aria-label="Pronomen">
        {PRONOUNS.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
            className={`chip${value === o.value ? ' on' : ''}`} onClick={() => onChange(value === o.value ? '' : o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <input type="text" value={custom} maxLength={24} placeholder="z. B. xier/xies" aria-label="Eigene Pronomen"
          onChange={(e) => onCustom(e.target.value)} />
      )}
    </>
  );
}

/** Asked once, on the very first open. Everything can be changed later in "Einstellungen". */
export function Welcome() {
  const { data, sync, saveSettings } = useStore();
  const s = data.settings;
  const [name, setName] = useState(s.name);
  const [pronoun, setPronoun] = useState<Pronoun>(s.pronoun);
  const [custom, setCustom] = useState(s.customPronoun);
  if (s.welcomed || sync === 'connecting' || import.meta.env.VITE_DEMO) return null;

  const done = (save: boolean) => saveSettings(save
    ? { name: name.trim(), pronoun, customPronoun: custom.trim(), welcomed: true }
    : { welcomed: true });

  return (
    <Sheet title="Willkommen bei werde" onClose={() => done(false)}>
      <form className="welcome" onSubmit={(e) => { e.preventDefault(); done(true); }}>
        <label className="field">
          <span>Wie soll ich dich nennen?</span>
          <input type="text" value={name} maxLength={30} autoComplete="given-name" placeholder="Dein Name"
            onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span>Deine Pronomen</span>
          <PronounPicker value={pronoun} custom={custom} onChange={setPronoun} onCustom={setCustom} />
        </div>
        <p className="muted small">Damit dich werde richtig begrüsst. Du kannst beides jederzeit unter „Einstellungen“ ändern.</p>
        <button className="primary" type="submit">Los geht’s</button>
        <button className="text-btn" type="button" onClick={() => done(false)}>Überspringen</button>
        {data.goals.length === 0 && <RestoreButton className="text-btn" label="Ich habe eine Sicherung" />}
      </form>
    </Sheet>
  );
}
