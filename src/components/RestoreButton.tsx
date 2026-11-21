import { useRef, useState } from 'react';
import { readBackup } from '../backup';
import { useStore } from '../store';
import { tr } from '../i18n';

/** Picks a saved werde copy and brings it back. Works with Files (iOS) and any Android file picker. */
export function RestoreButton({ className = 'secondary', label }: { className?: string; label?: string }) {
  const { data, replaceAll } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');

  const pick = async (f: File | undefined) => {
    if (file.current) file.current.value = '';
    if (!f) return;
    const d = await readBackup(f);
    if (!d) { setNote(tr('Das ist keine werde-Sicherung. Wähle die Datei, die mit „werde-“ beginnt.', 'This is not a werde backup. Pick the file that starts with “werde-”.')); return; }
    const hasOwn = data.logs.length > 0 || data.goals.length > 0;
    if (hasOwn && !window.confirm(tr(`Die Kopie enthält ${d.goals.length} Ziele und ${d.logs.length} Einträge. Sie ersetzt, was gerade hier ist. Du kannst es danach rückgängig machen. Fortfahren?`, `The backup has ${d.goals.length} goals and ${d.logs.length} entries. It replaces what is here now. You can undo it afterwards. Continue?`))) return;
    replaceAll(d);
    setNote('');
  };

  return (
    <>
      <button type="button" className={className} onClick={() => file.current?.click()}>{label ?? tr('Backup laden', 'Load backup')}</button>
      <input ref={file} type="file" accept=".json,application/json,text/plain,application/octet-stream" hidden
        onChange={(e) => pick(e.target.files?.[0])} />
      {note && <p className="notice small" role="status">{note}</p>}
    </>
  );
}
