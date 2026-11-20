# werde

Growing at your own pace, in your own way. A gentle habit and goal tracker, built as an installable web app (PWA).

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # production build in dist/
VITE_DEMO=1 npm run build   # build with example goals for previews
```

Data stays in the browser (localStorage). No accounts, no tracking.

## What's inside

- `src/store.tsx` – data, undo, logging (celebrations, comeback and rhythm notes)
- `src/consistency.ts` – "never miss twice" rhythm, rest/freeze days, monthly consistency
- `src/progress.ts` – period maths and wording
- `src/reminders.ts`, `src/useReminders.ts` – the 5-hour rule and quiet window
- `src/sky.ts` – time-of-day phases and Open-Meteo weather (coarse location, opt-in)
- `src/components/` – screens, sheets, painted illustrations (`Art.tsx`), progress styles (`Status.tsx`)
- `public/sw.js` – offline cache and notification clicks
