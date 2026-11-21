import { useState } from 'react';
import { useStore } from '../store';
import type { Pronoun } from '../greetings';
import { Segmented, Sheet } from './Sheet';
import { RestoreButton } from './RestoreButton';
import { getLang, tr } from '../i18n';

export const PRONOUNS: { value: Exclude<Pronoun, ''>; label: string }[] = [
  { value: 'she', get label() { return tr('sie/ihr', 'she/her'); } },
  { value: 'he', get label() { return tr('er/ihm', 'he/him'); } },
  { value: 'they', get label() { return tr('they/keine', 'they/them'); } },
  { value: 'custom', get label() { return tr('eigene', 'other'); } },
];

export function PronounPicker({ value, custom, onChange, onCustom }: {
  value: Pronoun; custom: string; onChange: (p: Pronoun) => void; onCustom: (s: string) => void;
}) {
  return (
    <>
      <div className="pronoun-row" role="radiogroup" aria-label={tr('Pronomen', 'Pronouns')}>
        {PRONOUNS.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
            className={`chip${value === o.value ? ' on' : ''}`} onClick={() => onChange(value === o.value ? '' : o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <input type="text" value={custom} maxLength={24} placeholder={tr('z. B. xier/xies', 'e.g. xe/xem')} aria-label={tr('Eigene Pronomen', 'Own pronouns')}
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
    <Sheet title={tr('Willkommen bei werde', 'Welcome to werde')} onClose={() => done(false)}>
      <form className="welcome" onSubmit={(e) => { e.preventDefault(); done(true); }}>
        <div className="field">
          <span>Sprache · Language</span>
          <Segmented label="Sprache / Language" value={getLang()} onChange={(lang) => saveSettings({ lang })}
            options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }]} />
        </div>
        <label className="field">
          <span>{tr('Wie soll ich dich nennen?', 'What should I call you?')}</span>
          <input type="text" value={name} maxLength={30} autoComplete="given-name" placeholder={tr('Dein Name', 'Your name')}
            onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span>{tr('Deine Pronomen', 'Your pronouns')}</span>
          <PronounPicker value={pronoun} custom={custom} onChange={setPronoun} onCustom={setCustom} />
        </div>
        <p className="muted small">{tr('Damit dich werde richtig begrüsst. Du kannst beides jederzeit unter „Einstellungen“ ändern.', 'So werde greets you right. You can change both any time in “Settings”.')}</p>
        <button className="primary" type="submit">{tr('Los geht’s', 'Let’s go')}</button>
        <button className="text-btn" type="button" onClick={() => done(false)}>{tr('Überspringen', 'Skip')}</button>
        {data.goals.length === 0 && <RestoreButton className="text-btn" label={tr('Ich habe eine Sicherung', 'I have a backup')} />}
      </form>
    </Sheet>
  );
}
