// Vstupný bod: hash router (späť/dopredu a obnovenie stránky fungujú), navigácia, prepínač jazyka a offline režim.
import { h, clear, append } from './util.js';
import { icon } from './icons.js';
import * as store from './store.js';
import { t, getLang, setLang, LANGS } from './i18n.js';
import { FEATURES } from './config.js';
import { getLevel, getTask } from './content/index.js';
import * as views from './views.js';
import { mountTask } from './engine.js';
import { renderLabPage } from './lab.js';
import { renderTeacher, renderPresent, handleJoin } from './teacher.js';

const app = document.getElementById('app');
const navHost = document.getElementById('nav');
const footer = document.getElementById('footer');
const skip = document.querySelector('.skip-link');
let cleanup = null;

const NAV = [
  ['levels', 'nav.missions', 'shield'],
  ['email', 'nav.email', 'mail'],
  ['lab', 'nav.lab', 'key'],
  ['progress', 'nav.progress', 'star'],
  ['materials', 'nav.materials', 'book'],
  ...(FEATURES.teacher ? [['teacher', 'nav.teacher', 'users']] : []),
];

const xpChip = () => h('span', { class: 'chip chip-xp xp-chip', 'aria-label': t('xp.aria', { n: store.getState().xp }) }, icon('star', 18), ' ', t('xp.chip', { n: store.getState().xp }));

function langSwitch() {
  return h('div', { class: 'lang-switch', role: 'group', 'aria-label': t('lang.label') },
    LANGS.map((l) => h('button', {
      type: 'button',
      class: 'lang-btn',
      lang: l.id,
      'aria-label': l.name,
      'aria-pressed': String(l.id === getLang()),
      onclick: () => {
        if (l.id === getLang()) return;
        setLang(l.id);
        render();
        const again = navHost.querySelector(`.lang-btn[lang="${l.id}"]`);
        if (again) again.focus();
      },
    }, l.short)));
}

function drawChrome(active) {
  clear(navHost);
  append(navHost,
    h('a', { class: 'brand', href: '#/', 'aria-label': t('nav.home_aria') }, icon('shield-check', 30), h('span', null, 'PASSWORD QUEST')),
    h('nav', { 'aria-label': t('nav.aria') }, h('ul', null, NAV.map(([id, key, ic]) => h('li', null,
      h('a', { href: `#/${id}`, 'aria-label': t(key), 'aria-current': active === id ? 'page' : null }, icon(ic, 20), h('span', { class: 'nav-label' }, t(key))))))),
    h('div', { class: 'topbar-end' }, xpChip(), langSwitch()));
  if (footer) { clear(footer); footer.append(h('p', null, t('footer.text'))); }
  if (skip) skip.textContent = t('skip');
  document.documentElement.lang = getLang();
  document.title = t('doc.title');
}

store.subscribe(() => {
  const chip = navHost.querySelector('.xp-chip');
  if (chip) chip.replaceWith(xpChip());
});

// Ktorá položka menu svieti: úroveň, misia a certifikát patria k tréningu svojho modulu.
function activeNav(a, b) {
  let level = null;
  if (a === 'level' || a === 'certificate') level = getLevel(b);
  else if (a === 'task') { const task = getTask(b); level = task ? getLevel(task.level) : null; }
  return level ? views.moduleRoute(level.module) : a;
}

function render() {
  if (location.hash === '#app') { app.focus(); return; } // odkaz „Preskočiť na obsah“
  if (cleanup) { try { cleanup(); } catch (e) { /* ignoruj */ } cleanup = null; }
  clear(app);
  const parts = (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  const [a, b, c] = parts;
  const teacherRoute = ['teacher', 'present', 'join'].includes(a);
  let result;
  if (teacherRoute && !FEATURES.teacher) {
    result = views.notFound(app);
  } else {
    switch (a) {
      case undefined: result = views.home(app); break;
      case 'levels': result = views.levels(app); break;
      case 'email': result = views.emailTraining(app); break;
      case 'materials': result = views.teachers(app); break;
      case 'level': result = c === 'summary' ? views.levelSummary(app, b) : views.level(app, b, c === 'all'); break;
      case 'task': result = mountTask(app, b); break;
      case 'lab': result = renderLabPage(app); break;
      case 'howto': result = views.howto(app); break;
      case 'learn': result = views.learn(app); break;
      case 'progress': result = views.progress(app); break;
      case 'certificate': result = views.certificate(app, b); break;
      case 'teacher': result = renderTeacher(app); break;
      case 'present': result = renderPresent(app, b); break;
      case 'join': location.replace(handleJoin(parts)); return;
      default: result = views.notFound(app);
    }
  }
  cleanup = typeof result === 'function' ? result : null;
  drawChrome(activeNav(a, b));
  if (!app.contains(document.activeElement) || document.activeElement === document.body) {
    const heading = app.querySelector('h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
  if (a !== 'task') window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', render);
// Pri zatvorení stránky sa upratuje aj Dielňa hesiel (testovacie texty nikam neodchádzajú).
window.addEventListener('pagehide', () => { if (cleanup) { try { cleanup(); } catch (e) { /* ignoruj */ } } });

try {
  render();
} catch (err) {
  clear(app);
  app.append(h('div', { class: 'card' }, h('h1', null, t('error.title')), h('p', null, t('error.text')), h('a', { class: 'btn btn-primary', href: '#/' }, t('nav.home'))));
}

// Offline režim (len cez https alebo localhost a mimo vloženej verzie).
if (!window.PQ_EMBEDDED && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline režim je voliteľný */ });
}
