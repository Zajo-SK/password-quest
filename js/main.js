// Vstupný bod: hash router (späť/dopredu a obnovenie stránky fungujú), navigácia a registrácia offline režimu.
import { h, clear } from './util.js';
import { icon } from './icons.js';
import * as store from './store.js';
import * as views from './views.js';
import { mountTask } from './engine.js';
import { renderLabPage } from './lab.js';
import { renderTeacher, renderPresent, handleJoin } from './teacher.js';

const app = document.getElementById('app');
const navHost = document.getElementById('nav');
let cleanup = null;

const NAV = [
  ['levels', 'Misie', 'shield'],
  ['lab', 'Password Lab', 'search'],
  ['progress', 'Môj postup', 'star'],
  ['teacher', 'Učiteľský režim', 'users'],
];

function drawNav(active) {
  clear(navHost);
  const xp = h('span', { class: 'chip chip-xp xp-chip', 'aria-label': `Získané body: ${store.getState().xp}` }, icon('star', 18), ` ${store.getState().xp} XP`);
  navHost.append(
    h('a', { class: 'brand', href: '#/', 'aria-label': 'Password Quest, úvodná obrazovka' }, icon('shield-check', 30), h('span', null, 'PASSWORD QUEST')),
    h('nav', { 'aria-label': 'Hlavná navigácia' }, h('ul', null, NAV.map(([id, label, ic]) => h('li', null,
      h('a', { href: `#/${id}`, 'aria-label': label, 'aria-current': active === id ? 'page' : null }, icon(ic, 20), h('span', { class: 'nav-label' }, label)))))),
    xp);
}

store.subscribe(() => {
  const chip = navHost.querySelector('.xp-chip');
  if (chip) { clear(chip); chip.append(icon('star', 18), ` ${store.getState().xp} XP`); chip.setAttribute('aria-label', `Získané body: ${store.getState().xp}`); }
});

function render() {
  if (location.hash === '#app') { app.focus(); return; } // odkaz „Preskočiť na obsah“
  if (cleanup) { try { cleanup(); } catch (e) { /* ignoruj */ } cleanup = null; }
  clear(app);
  const parts = (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  const [a, b, c] = parts;
  let result;
  switch (a) {
    case undefined: result = views.home(app); break;
    case 'levels': result = views.levels(app); break;
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
  cleanup = typeof result === 'function' ? result : null;
  drawNav(a);
  document.title = 'Password Quest – Chráň svoj digitálny svet';
  if (!app.contains(document.activeElement) || document.activeElement === document.body) {
    const heading = app.querySelector('h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
  if (a !== 'task') window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', render);
// Pri zatvorení stránky sa upratuje aj Password Lab (testovacie texty nikam neodchádzajú).
window.addEventListener('pagehide', () => { if (cleanup) { try { cleanup(); } catch (e) { /* ignoruj */ } } });

try {
  render();
} catch (err) {
  clear(app);
  app.append(h('div', { class: 'card' }, h('h1', null, 'Niečo sa pokazilo'), h('p', null, 'Obnov stránku alebo sa vráť na úvod.'), h('a', { class: 'btn btn-primary', href: '#/' }, 'Úvod')));
}

// Offline režim (len cez https alebo localhost).
if (!window.PQ_EMBEDDED && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline režim je voliteľný */ });
}
