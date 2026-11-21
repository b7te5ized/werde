import { useEffect, useState } from 'react';
import type { Goal, Theme } from './types';
import { useStore } from './store';
import { useReminders } from './useReminders';
import { ArtDefs } from './components/Art';
import { Nav, ToastBar, type Tab } from './components/Chrome';
import { Today } from './components/Today';
import { Overview } from './components/Overview';
import { SettingsView } from './components/SettingsView';
import { GoalEditor } from './components/GoalEditor';
import { GoalDetail } from './components/GoalDetail';
import { ThemeEditor } from './components/ThemeEditor';
import { QuickLog } from './components/QuickLog';
import { isStandalone } from './pwa';
import { useLook } from './look';
import { useSky } from './sky';
import { Celebration } from './components/Celebration';
import { Breathe } from './components/Breathe';
import { Welcome } from './components/Welcome';

type Sheet =
  | { kind: 'new-goal'; themeId?: string }
  | { kind: 'edit-goal'; id: string }
  | { kind: 'goal'; id: string }
  | { kind: 'theme'; id: string }
  | null;

export default function App() {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [quick, setQuick] = useState(() => location.hash === '#quick' || (isStandalone() && data.settings.openInQuickLog));
  const [sheet, setSheet] = useState<Sheet>(null);
  useReminders();
  const sky = useSky(data.settings.skyMode);
  useLook(sky.phase, data.settings);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, quick]);
  const close = () => setSheet(null);
  const findGoal = (id: string) => data.goals.find((g) => g.id === id);
  const findTheme = (id: string) => data.themes.find((t) => t.id === id);
  const openTheme = (t: Theme) => setSheet({ kind: 'theme', id: t.id });

  return (
    <div className="app">
      <ArtDefs />
      {quick && <QuickLog onClose={() => { setQuick(false); setTab('today'); if (location.hash) history.replaceState(null, '', location.pathname); }} />}
      {!quick && tab === 'today' && (
        <Today sky={sky} onQuickLog={() => setQuick(true)} onNewGoal={(themeId) => setSheet({ kind: 'new-goal', themeId })}
          onOpenGoal={(g: Goal) => setSheet({ kind: 'goal', id: g.id })} onEditTheme={openTheme} />
      )}
      {!quick && tab === 'overview' && <Overview />}
      {!quick && tab === 'space' && <SettingsView onEditTheme={openTheme} />}
      {!quick && <Nav tab={tab} onTab={setTab} />}
      <ToastBar />
      <Celebration />
      {!quick && <Breathe />}
      <Welcome />

      {sheet?.kind === 'new-goal' && <GoalEditor defaultThemeId={sheet.themeId} onClose={close} />}
      {sheet?.kind === 'edit-goal' && findGoal(sheet.id) && <GoalEditor goal={findGoal(sheet.id)} onClose={close} />}
      {sheet?.kind === 'goal' && findGoal(sheet.id) && (
        <GoalDetail goal={findGoal(sheet.id)!} onClose={close} onEdit={() => setSheet({ kind: 'edit-goal', id: sheet.id })} />
      )}
      {sheet?.kind === 'theme' && findTheme(sheet.id) && <ThemeEditor theme={findTheme(sheet.id)!} onClose={close} />}
    </div>
  );
}

