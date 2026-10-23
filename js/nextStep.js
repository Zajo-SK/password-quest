// Čo ďalej po dokončení celej úrovne: ďalšia úroveň v module, alebo iný modul, keď je modul hotový.
// Používa sa na konci misie, ktorá úroveň dokončí, na stránke úrovne, v hodnotení a pri certifikáte.

import { h } from './util.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import { modules, getModule, nextLevel } from './content/index.js';
import { levelProgress } from './progress.js';

// { kind: 'level', level } | { kind: 'module', module, level } | { kind: 'done' }
export function nextStep(level) {
  const nl = nextLevel(level);
  if (nl) return { kind: 'level', level: nl };
  const other = modules().filter((m) => m.id !== level.module)
    .map((m) => ({ module: m, level: m.levels.find((l) => !levelProgress(l).complete) }))
    .find((x) => x.level);
  return other ? { kind: 'module', ...other } : { kind: 'done' };
}

// Hlavné tlačidlo „pokračovať“.
export function nextStepButton(level, cls = 'btn btn-primary btn-lg') {
  const s = nextStep(level);
  if (s.kind === 'level') return h('a', { class: cls, href: `#/level/${s.level.id}` }, t('next.go', { n: s.level.n, name: s.level.name }), ' ', icon('forward', 22));
  if (s.kind === 'module') return h('a', { class: cls, href: `#/level/${s.level.id}` }, t('next.other', { module: s.module.name }), ' ', icon('forward', 22));
  return h('a', { class: cls, href: '#/' }, icon('home', 22), ' ', t('next.home'));
}

// Karta „Čo ďalej?“ s krátkym textom a tlačidlom.
export function nextStepCard(level) {
  const s = nextStep(level);
  const text = s.kind === 'level'
    ? t('next.text', { name: s.level.name, difficulty: t('difficulty.' + s.level.n) })
    : s.kind === 'module'
      ? t('next.module_done', { module: getModule(level.module).name }) + ' ' + t('next.module_text', { module: s.module.name })
      : t('next.all_done');
  return h('section', { class: 'card next-card', 'aria-labelledby': 'next-h' },
    h('h2', { id: 'next-h' }, icon('forward', 26), ' ', t('next.title')),
    h('p', { class: 'lead' }, text),
    h('div', { class: 'actions' }, nextStepButton(level)));
}
