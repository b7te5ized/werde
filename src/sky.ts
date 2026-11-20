import { useEffect, useState } from 'react';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'cloud' | 'rain' | 'snow' | 'fog' | 'storm';

export interface Sky { phase: Phase; weather: Weather | null; temp: number | null }

export function phaseFor(d: Date): Phase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17.5) return 'day';
  if (h >= 17.5 && h < 21) return 'dusk';
  return 'night';
}

/** WMO weather codes, as used by Open-Meteo. */
export function weatherFor(code: number): Weather {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain';
}

export const WEATHER_WORDS: Record<Weather, string> = {
  clear: 'klarer Himmel', cloud: 'leicht bewölkt', rain: 'Regen draußen', snow: 'Schnee draußen', fog: 'neblig', storm: 'stürmisch, mach es dir gemütlich',
};

const CACHE_KEY = 'werde.weather';
const MAX_AGE = 30 * 60_000;

async function fetchWeather(): Promise<{ weather: Weather; temp: number } | null> {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.at < MAX_AGE) return c.data;
  } catch { /* ignore */ }
  const pos = await new Promise<GeolocationPosition | null>((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(res, () => res(null), { enableHighAccuracy: false, maximumAge: 3600_000, timeout: 10_000 });
  });
  if (!pos) return null;
  // coarse location: rounded to about 10 km
  const lat = pos.coords.latitude.toFixed(1);
  const lon = pos.coords.longitude.toFixed(1);
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m`);
    if (!r.ok) return null;
    const j = await r.json();
    const data = { weather: weatherFor(j.current.weather_code), temp: Math.round(j.current.temperature_2m) };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
    return data;
  } catch {
    return null;
  }
}

/** Follows the time of day (and, if allowed, the weather) and paints it onto the root element. */
export function useSky(mode: 'auto' | 'light', weatherOn: boolean): Sky {
  const [now, setNow] = useState(() => new Date());
  const [wx, setWx] = useState<{ weather: Weather; temp: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const hourKey = now.getHours();
  useEffect(() => {
    if (!weatherOn) { setWx(null); return; }
    let live = true;
    fetchWeather().then((d) => live && setWx(d));
    return () => { live = false; };
  }, [weatherOn, hourKey]);

  const phase: Phase = mode === 'light' ? 'day' : phaseFor(now);
  const weather = wx?.weather ?? null;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('phase-dawn', 'phase-day', 'phase-dusk', 'phase-night', 'wx-cloud', 'wx-rain', 'wx-snow', 'wx-fog');
    root.classList.add(`phase-${phase}`);
    if (weather && weather !== 'clear') root.classList.add(`wx-${weather === 'storm' ? 'rain' : weather}`);
    const meta = document.querySelector('meta[name="theme-color"]');
    window.setTimeout(() => root.classList.add('sky-ready'), 50);
    meta?.setAttribute('content', phase === 'night' ? '#263b4a' : phase === 'dusk' ? '#f2b8a2' : phase === 'dawn' ? '#f9d7d9' : '#a9dcf0');
  }, [phase, weather]);

  return { phase, weather, temp: wx?.temp ?? null };
}
