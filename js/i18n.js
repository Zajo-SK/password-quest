// Jazyky rozhrania. Texty rozhrania sú v js/i18n/<jazyk>.js, obsah úloh v js/content/<jazyk>/.
import sk from './i18n/sk.js';
import en from './i18n/en.js';

export const DICTS = { sk, en };
export const LANGS = [
  { id: 'sk', short: 'SK', name: 'Slovenčina', locale: 'sk-SK' },
  { id: 'en', short: 'EN', name: 'English', locale: 'en-US' },
];

const KEY = 'pq.lang';
let lang = load();

function load() {
  try {
    const v = localStorage.getItem(KEY);
    if (DICTS[v]) return v;
  } catch (e) { /* úložisko nemusí byť dostupné */ }
  return 'sk';
}

export const getLang = () => lang;
export const getLocale = () => LANGS.find((l) => l.id === lang).locale;

export function setLang(next) {
  if (!DICTS[next]) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch (e) { /* ignoruj */ }
  document.documentElement.lang = next;
}

// t('kľúč', {premenné}) – hodnota v slovníku je text s {premennými} alebo funkcia (napr. pre množné číslo).
export function t(key, vars = {}) {
  const v = DICTS[lang][key] ?? DICTS.sk[key];
  if (v == null) return key;
  if (typeof v === 'function') return v(vars);
  return v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

export { skPlural, enPlural } from './util.js';
