import { defaultTexts, SLOT_LABEL, SLOTS, type CustomTexts, type Slot } from '../greetings';
import { useStore } from '../store';
import { Sheet } from './Sheet';

/** Write and edit your own greetings (per time of day) and the quotes below them. */
export function TextsEditor({ onClose }: { onClose: () => void }) {
  const { data, setTexts } = useStore();
  const t: CustomTexts = data.texts ?? defaultTexts();
  const save = (next: CustomTexts) => setTexts(next);
  const setGreeting = (slot: Slot, list: string[]) => save({ ...t, greetings: { ...t.greetings, [slot]: list } });

  return (
    <Sheet title="Begrüssungen & Sprüche" onClose={onClose}>
      <p className="muted small">Pro Tageszeit erscheint zufällig eine Begrüssung, darunter ein Spruch. Im Spruch wird {'{name}'} durch deinen Namen ersetzt.</p>
      {SLOTS.map((slot) => (
        <TextList key={slot} title={SLOT_LABEL[slot]} items={t.greetings[slot] ?? []} placeholder="Neue Begrüssung" multiline
          onChange={(list) => setGreeting(slot, list)} />
      ))}
      <TextList title="Sprüche" items={t.quotes} placeholder="Neuer Spruch, z. B. Du machst das gut, {name}." multiline
        onChange={(quotes) => save({ ...t, quotes })} />
      {data.texts && (
        <button type="button" className="text-btn texts-reset" onClick={() => setTexts(undefined)}>Auf die ursprünglichen Texte zurücksetzen</button>
      )}
    </Sheet>
  );
}

function TextList({ title, items, onChange, placeholder, multiline }: {
  title: string; items: string[]; onChange: (l: string[]) => void; placeholder: string; multiline?: boolean;
}) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <section className="texts-group">
      <h3>{title}</h3>
      <ul>
        {items.map((text, i) => (
          <li key={i}>
            {multiline
              ? <textarea rows={2} value={text} placeholder={placeholder} aria-label={`${title} ${i + 1}`} autoFocus={i === items.length - 1 && text === ''} onChange={(e) => set(i, e.target.value)} />
              : <input type="text" value={text} placeholder={placeholder} aria-label={`${title} ${i + 1}`} autoFocus={i === items.length - 1 && text === ''} onChange={(e) => set(i, e.target.value)} />}
            <button type="button" className="chip-x" aria-label="Entfernen" disabled={items.length <= 1}
              onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <button type="button" className="secondary small-btn" onClick={() => onChange([...items, ''])}>+ Neu</button>
    </section>
  );
}
