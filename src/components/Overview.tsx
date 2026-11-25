import { useMemo, useState } from 'react';
import type { Goal, Log, Theme } from '../types';
import { PALETTE } from '../palette';
import { addDays, dayAmount, dayKey, fmt, goalProgress, logsOnDay } from '../progress';
import { useStore } from '../store';
import { monthStats } from '../consistency';
import { tr, locale } from '../i18n';


export function Overview() {
  const { data } = useStore();
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  const themes = data.themes;
  const goals = data.goals.filter((g) => filter === 'all' || g.themeId === filter);

  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  const title = anchor.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });

  return (
    <main className="view">
      <header className="greet top"><h1>{tr('Fortschritt', 'Progress')}</h1></header>

      {themes.length > 1 && (
        <div className="chips filter" role="group" aria-label={tr('Nach Thema filtern', 'Filter by theme')}>
          <button className={`chip${filter === 'all' ? ' on' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{tr('Alle', 'All')}</button>
          {themes.map((t) => (
            <button key={t.id} className={`chip${filter === t.id ? ' on' : ''}`} aria-pressed={filter === t.id}
              style={{ '--chip': PALETTE[t.color].soft, '--chip-ink': PALETTE[t.color].ink } as React.CSSProperties}
              onClick={() => setFilter(t.id)}>{t.icon} {t.name}</button>
          ))}
        </div>
      )}

      <div className="period-nav">
        <button className="round-btn" onClick={() => setOffset(offset - 1)} aria-label={tr('Zurück', 'Previous')}>‹</button>
        <h2>{title}</h2>
        <button className="round-btn" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label={tr('Weiter', 'Next')}>›</button>
      </div>

      {goals.length === 0 ? (
        <section className="empty card">
          <h2>{tr('Noch nichts hier', 'Nothing here yet')}</h2>
          <p>{tr('Sobald du etwas notierst, erscheint es hier.', 'As soon as you log something, it shows up here.')}</p>
        </section>
      ) : (
        <>
          <MonthView month={anchor} goals={goals} themes={themes} logs={data.logs} freezes={data.freezes} filterTheme={themes.find((t) => t.id === filter)} />
          <MonthGoals month={anchor} goals={goals} />
        </>
      )}
    </main>
  );
}

function MonthView({ month, goals, themes, logs, freezes, filterTheme }: { month: Date; goals: Goal[]; themes: Theme[]; logs: Log[]; freezes: Record<string, string[]>; filterTheme?: Theme }) {
  const [picked, setPicked] = useState<Date | null>(null);
  const sw = PALETTE[filterTheme?.color ?? 'meadow'];
  const ids = new Set(goals.map((g) => g.id));
  const mlogs = logs.filter((l) => ids.has(l.goalId));
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7;
  const todayStart = new Date(new Date().toDateString()).getTime();

  const scores = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i <= daysIn; i++) {
      const d = new Date(month.getFullYear(), month.getMonth(), i);
      const daily = goals.filter((g) => g.period === 'day' && g.direction === 'more' && !g.paused && g.createdAt < addDays(d, 1).getTime());
      const avg = daily.length ? daily.reduce((s, g) => s + Math.min(1, dayAmount(g.id, mlogs, d) / g.target), 0) / daily.length : 0;
      const any = logsOnDay(mlogs, d).length > 0;
      out.push(any ? Math.max(avg, 0.3) : avg);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month.getTime(), goals, logs]);

  // every daily goal reached that day (frozen goals left out): a rainbow day
  const rainbow = useMemo(() => {
    const out: boolean[] = [];
    for (let i = 1; i <= daysIn; i++) {
      const d = new Date(month.getFullYear(), month.getMonth(), i);
      const k = dayKey(d);
      const daily = goals.filter((g) => g.period === 'day' && g.direction === 'more' && !g.paused
        && g.createdAt < addDays(d, 1).getTime() && !freezes[g.id]?.includes(k));
      out.push(daily.length > 0 && daily.every((g) => dayAmount(g.id, mlogs, d) >= g.target));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month.getTime(), goals, logs, freezes]);
  const rainbowDays = rainbow.filter(Boolean).length;

  const activeDays = scores.filter((s) => s > 0).length;
  const blooms = goals.filter((g) => g.period === 'day' && g.direction === 'more').reduce((n, g) => {
    let c = 0;
    for (let i = 1; i <= daysIn; i++) if (dayAmount(g.id, mlogs, new Date(month.getFullYear(), month.getMonth(), i)) >= g.target) c++;
    return n + c;
  }, 0);
  const periodGoalsReached = goals.filter((g) => g.period === 'month' && goalProgress(g, logs, month).reached && g.direction === 'more').length;

  const level = (s: number) => (s <= 0 ? 0 : s < 0.34 ? 1 : s < 0.67 ? 2 : s < 1 ? 3 : 4);

  return (
    <>
      <section className="card month">
        <div className="month-grid" aria-hidden="true">
          {(tr('de', 'en') === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['M', 'D', 'M', 'D', 'F', 'S', 'S']).map((w, i) => <span key={i} className="wd">{w}</span>)}
        </div>
        <div className="month-weeks" role="grid" aria-label={tr('Tage des Monats', 'Days of the month')}>
          {weeksOf(lead, scores.length).map((week, wi) => {
            const current = week.some((n) => n !== null && dayKey(new Date(month.getFullYear(), month.getMonth(), n)) === dayKey(new Date()));
            return (
              <div key={wi} className={`month-grid month-week${current ? ' current' : ''}`} role="row">
                {week.map((n, ci) => {
                  if (n === null) return <span key={ci} />;
                  const s = scores[n - 1];
                  const d = new Date(month.getFullYear(), month.getMonth(), n);
                  const future = d.getTime() > todayStart;
                  const lv = level(s);
                  const isPicked = picked && dayKey(picked) === dayKey(d);
                  const isToday = dayKey(d) === dayKey(new Date());
                  const rb = !future && rainbow[n - 1];
                  return (
                    <button key={ci} role="gridcell" className={`mcell${rb ? ' rainbow' : ''}${future ? ' future' : ''}${isPicked ? ' picked' : ''}${isToday ? ' today' : ''}`}
                      disabled={future} onClick={() => setPicked(isPicked ? null : d)} aria-current={isToday ? 'date' : undefined}
                      style={{ background: sw.soft, color: sw.ink, '--c': sw.base } as React.CSSProperties}
                      aria-label={`${d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}${isToday ? tr(', heute', ', today') : ''}${rb ? tr(', Regenbogentag, alle Ziele erreicht', ', rainbow day, every goal reached') : lv ? (s >= 1 ? tr(', erfüllt', ', done') : '') : tr(', kein Eintrag', ', no entry')}`}>
                      {!future && (s > 0 || rb) && <span className={`cell-fill${rb ? ' rainbow' : s >= 1 ? ' chrome' : ''}`} style={{ height: rb ? '100%' : `${Math.min(1, s) * 100}%` }} aria-hidden="true" />}
                      <span className="mnum">{n}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="month-summary">
          {activeDays === 0
            ? tr('Diesen Monat noch keine Einträge.', 'No entries this month yet.')
            : tr('de', 'en') === 'en'
              ? <>You showed up on <b>{activeDays}</b> {activeDays === 1 ? 'day' : 'days'}{blooms > 0 && <>, reached a daily goal <b>{blooms}</b> {blooms === 1 ? 'time' : 'times'}</>}{periodGoalsReached > 0 && <>. <b>{periodGoalsReached}</b> monthly {periodGoalsReached === 1 ? 'goal' : 'goals'} reached</>}.{rainbowDays > 0 && <> <b className="rainbow-text">{rainbowDays} {rainbowDays === 1 ? 'rainbow day' : 'rainbow days'}</b>.</>}</>
              : <>Du warst an <b>{activeDays}</b> {activeDays === 1 ? 'Tag' : 'Tagen'} dabei{blooms > 0 && <>, <b>{blooms}</b>-mal ein Tagesziel erreicht</>}{periodGoalsReached > 0 && <>. <b>{periodGoalsReached}</b> {periodGoalsReached === 1 ? 'Monatsziel' : 'Monatsziele'} erreicht</>}.{rainbowDays > 0 && <> <b className="rainbow-text">{rainbowDays} {rainbowDays === 1 ? 'Regenbogentag' : 'Regenbogentage'}</b>.</>}</>}
        </p>
      </section>
      {picked && <DayDetail day={picked} goals={goals} logs={mlogs} />}
    </>
  );
}

function DayDetail({ day, goals, logs }: { day: Date; goals: Goal[]; logs: Log[] }) {
  const rows = goals.map((g) => ({ g, amt: dayAmount(g.id, logs, day) })).filter((r) => r.amt > 0);
  return (
    <section className="card day-detail" aria-live="polite">
      <h2>{day.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      {rows.length === 0 ? <p className="muted">{tr('Keine Einträge.', 'No entries.')}</p> : (
        <ul className="entries">
          {rows.map(({ g, amt }) => (
            <li key={g.id}><span>{g.name}</span><span className="muted">{fmt(amt)} {g.unit}</span></li>
          ))}
        </ul>
      )}
    </section>
  );
}


function MonthGoals({ month, goals }: { month: Date; goals: Goal[] }) {
  const { data } = useStore();
  const now = new Date();
  if (month > now) return null;
  return (
    <section className="card">
      <h2 className="sub" style={{ marginTop: 0 }}>{tr('Ziel für Ziel', 'Goal by goal')}</h2>
      <ul className="goal-stats">
        {goals.map((g) => {
          const st = monthStats(g, data, month, now);
          if (st.eligible === 0 && st.rested === 0) return null;
          const parts: string[] = [tr(`an ${st.tracked} von ${st.eligible} Tagen notiert`, `logged on ${st.tracked} of ${st.eligible} days`)];
          if (g.period === 'day') parts.push(`${st.reached} ${g.direction === 'more' ? tr('erreicht', 'reached') : tr('innerhalb der Grenze', 'within the limit')}`);
          if (st.periodsTotal > 0) parts.push(tr(`${st.periodsReached} von ${st.periodsTotal} ${g.period === 'week' ? 'Wochen' : 'Monat'} erreicht`, `${st.periodsReached} of ${st.periodsTotal} ${g.period === 'week' ? 'weeks' : 'months'} reached`));
          if (st.rested > 0) parts.push(`${st.rested} ${st.rested === 1 ? tr('Ruhetag', 'rest day') : tr('Ruhetage', 'rest days')}`);
          const pct = st.eligible ? st.tracked / st.eligible : 0;
          const th = data.themes.find((t) => t.id === g.themeId);
          const sw = PALETTE[th?.color ?? 'meadow'];
          return (
            <li key={g.id}>
              <span className="gs-top"><span>{g.name}</span><span className="gs-pct">{Math.round(pct * 100)}% {tr('der Tage', 'of days')}</span></span>
              <span className="bar" role="img" aria-label={tr(`An ${st.tracked} von ${st.eligible} Tagen notiert`, `Logged on ${st.tracked} of ${st.eligible} days`)} style={{ background: sw.soft, margin: 0 }}>
                <span className="bar-fill" style={{ width: `${pct * 100}%`, background: sw.base, display: 'block' }} />
              </span>
              <span className="gs-meta">{parts.join(' · ')}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Day numbers split into Monday-first weeks, with blanks before the 1st and after the last day. */
function weeksOf(lead: number, days: number): (number | null)[][] {
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const out: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
  return out;
}
