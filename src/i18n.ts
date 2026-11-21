/** Two languages, kept side by side in the code: t('Deutsch', 'English'). */
export type Lang = 'de' | 'en';
let lang: Lang = 'de';
export function setLang(l: Lang) { lang = l; if (typeof document !== 'undefined') document.documentElement.lang = l; }
export const getLang = () => lang;
export const t = (de: string, en: string) => (lang === 'en' ? en : de);
export const locale = (): string => (lang === 'en' ? 'en-GB' : 'de-DE');
export const tr = t;
/** The language to use: the chosen one, else the device's (German for German devices, English otherwise). */
export const pickLang = (chosen?: Lang): Lang => chosen ?? (typeof navigator !== 'undefined' && !/^de\b/i.test(navigator.language || 'de') ? 'en' : 'de');
