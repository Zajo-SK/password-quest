// Učiteľský režim (verzia bez servera).
// Transparentne: výsledky sú len z tohto zariadenia a obrazovka nie je chránená heslom, pretože neobsahuje
// žiadne citlivé údaje (iba anonymné súhrny). Zdieľanie výsledkov medzi zariadeniami a prihlásenie učiteľov
// vyžaduje server, pozri docs/BACKEND.md.

import { h, clear, pct, shuffle, append, embedded } from './util.js';
import { icon } from './icons.js';
import * as store from './store.js';
import { LEVELS, TOPICS, getLevel, getTask, findRound } from './content/index.js';
import { renderPresentation } from './engine.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 znakov, bez zameniteľných (0/O, 1/I)

export function newClassCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((b) => ALPHABET[b & 31]).join('');
  return chars.slice(0, 4) + '-' + chars.slice(4);
}

export function joinLink(session) {
  const base = location.href.split('#')[0];
  return `${base}#/join/${session.code}/${session.level}/${session.missions.join(',')}`;
}

export function handleJoin(parts) {
  // #/join/KOD/UROVEN/misia1,misia2
  const [, code, levelId, missions] = parts;
  const level = getLevel(levelId);
  if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code || '') || !level) return '#/levels';
  const valid = (missions || '').split(',').filter((id) => level.tasks.some((t) => t.id === id));
  store.setSession({ code, level: level.id, missions: valid });
  return `#/level/${level.id}`;
}

const DEMO = {
  participants: 24,
  finished: 22,
  topics: [
    ['safe-passwords', 91],
    ['unique', 76],
    ['phishing', 83],
    ['mfa', 68],
    ['incident', 72],
  ],
};

function topicRows() {
  const topics = store.getState().stats.topics;
  return Object.entries(topics).map(([id, s]) => ({ id, label: TOPICS[id] || id, ok: s.ok, total: s.total, rate: pct(s.ok, s.total) }))
    .sort((a, b) => a.rate - b.rate);
}

function roundRows() {
  const rounds = store.getState().stats.rounds;
  return Object.entries(rounds).map(([id, s]) => {
    const f = findRound(id);
    return f ? { id, task: f.task.title, level: f.task.level, prompt: f.round.prompt, ok: s.ok, total: s.total, rate: pct(s.ok, s.total) } : null;
  }).filter(Boolean);
}

function csvEscape(v) {
  const s = String(v).replace(/"/g, '""');
  return /[;"\n]/.test(s) ? `"${s}"` : s;
}

export function buildCsv() {
  const lines = [['typ', 'id', 'nazov', 'pokusy_prvy_pokus', 'spravne_prvy_pokus', 'uspesnost_percent'].join(';')];
  topicRows().forEach((r) => lines.push(['tema', r.id, r.label, r.total, r.ok, r.rate].map(csvEscape).join(';')));
  roundRows().forEach((r) => lines.push(['uloha', r.id, `${r.task}: ${r.prompt}`, r.total, r.ok, r.rate].map(csvEscape).join(';')));
  return '﻿' + lines.join('\n');
}

function downloadCsv() {
  const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'password-quest-suhrn.csv' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderTeacher(root) {
  const st = () => store.getState();
  let selLevel = (st().session && st().session.level) || 2;
  let selMissions = new Set();
  let showDemo = false;

  const prep = h('section', { class: 'card' });
  const present = h('section', { class: 'card' });
  const results = h('section', { class: 'card' });

  function drawPrep() {
    clear(prep);
    const level = getLevel(selLevel);
    if (selMissions.size === 0) level.tasks.forEach((t) => selMissions.add(t.id));
    const session = st().session;
    const out = h('div', { class: 'session-out', 'aria-live': 'polite' });
    if (session) showSession(out, session);

    const levelSel = h('select', { id: 't-level', class: 'select', onchange: (e) => { selLevel = Number(e.target.value); selMissions = new Set(); drawPrep(); drawPresent(); } },
      LEVELS.map((l) => h('option', { value: l.id, selected: l.id === selLevel }, `${l.id}. ${l.name} (${l.ages})`)));
    const checks = level.tasks.map((t) => {
      const input = h('input', { type: 'checkbox', checked: selMissions.has(t.id), onchange: (e) => { if (e.target.checked) selMissions.add(t.id); else selMissions.delete(t.id); } });
      return h('label', { class: 'check' }, input, h('span', null, `Misia ${t.order}: ${t.title}`));
    });
    prep.append(
      h('h2', null, icon('users', 28), ' Príprava hodiny'),
      h('p', { class: 'muted' }, 'Vytvor reláciu triedy: náhodný kód a odkaz, ktorý žiakom nastaví úroveň a misie. Kód neotvára žiadne cudzie údaje, lebo v tejto verzii žiadne neexistujú.'),
      h('div', { class: 'field' }, h('label', { for: 't-level' }, 'Veková úroveň'), levelSel),
      h('fieldset', { class: 'row-set' }, h('legend', null, 'Misie na hodinu'), h('div', { class: 'checks' }, checks)),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
          if (selMissions.size === 0) { out.textContent = 'Vyber aspoň jednu misiu.'; return; }
          const s = { code: newClassCode(), level: selLevel, missions: level.tasks.filter((t) => selMissions.has(t.id)).map((t) => t.id) };
          store.setSession(s);
          clear(out);
          showSession(out, s);
        } }, icon('plus', 22), ' Vytvoriť reláciu triedy')),
      out);
  }

  function showSession(out, s) {
    const link = joinLink(s);
    const copyMsg = h('span', { class: 'small', role: 'status' });
    out.append(
      h('div', { class: 'session-box' },
        h('p', null, 'Kód relácie: ', h('code', { class: 'phrase' }, s.code)),
        embedded()
          ? h('p', { class: 'muted' }, 'Odkaz pre žiakov sa vytvorí až po nasadení na vlastný web školy. V tejto verzii vloženej do Claude ho nie je možné vygenerovať.')
          : h('p', null, 'Odkaz pre žiakov: ', h('a', { href: link }, link)),
        h('div', { class: 'row-gap' },
          embedded() ? null : h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: async () => {
            try { await navigator.clipboard.writeText(link); copyMsg.textContent = 'Odkaz je skopírovaný.'; } catch (e) { copyMsg.textContent = 'Kopírovanie sa nepodarilo, označ odkaz ručne.'; }
          } }, icon('copy', 20), ' Kopírovať odkaz'),
          h('a', { class: 'btn btn-secondary btn-sm', href: `#/level/${s.level}` }, 'Otvoriť na tomto zariadení'),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { store.setSession(null); clear(out); } }, icon('x', 20), ' Ukončiť reláciu'),
          copyMsg)));
  }

  function drawPresent() {
    clear(present);
    const level = getLevel(selLevel);
    present.append(
      h('h2', null, icon('play', 28), ' Režim celej triedy'),
      h('p', { class: 'muted' }, 'Premietni úlohu na tabuľu. Trieda diskutuje a ty potom zobrazíš správne riešenie s vysvetlením.'),
      h('div', { class: 'task-list compact' }, level.tasks.map((t) => h('div', { class: 'row-between' }, h('span', null, `Misia ${t.order}: ${t.title}`),
        h('a', { class: 'btn btn-secondary btn-sm', href: `#/present/${t.id}` }, icon('play', 20), ' Premietnuť')))));
  }

  function drawResults() {
    clear(results);
    const topics = topicRows();
    const rounds = roundRows().filter((r) => r.total >= 1).sort((a, b) => a.rate - b.rate || b.total - a.total).slice(0, 5);
    const doneTasks = Object.values(st().tasks).filter((t) => t.done).length;
    const demoBox = showDemo ? h('div', { class: 'demo' },
      h('p', { class: 'banner banner-warn' }, icon('warning', 22), h('span', null, h('strong', null, 'Ilustračné hodnoty. '), 'Takto bude vyzerať prehľad triedy po pripojení servera. Nie sú to skutočné výsledky.')),
      h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Ukazovateľ'), h('th', { scope: 'col' }, 'Hodnota'))),
        h('tbody', null,
          h('tr', null, h('td', null, 'Počet účastníkov'), h('td', null, String(DEMO.participants))),
          h('tr', null, h('td', null, 'Dokončené aktivity'), h('td', null, String(DEMO.finished))),
          DEMO.topics.map(([id, v]) => h('tr', null, h('td', null, `Úspešnosť témy: ${TOPICS[id]}`), h('td', null, v + ' %')))))) : null;

    results.append(
      h('h2', null, icon('list', 28), ' Výsledky na tomto zariadení'),
      h('p', { class: 'banner banner-info' }, icon('info', 22), h('span', null, 'Zobrazené sú len anonymné súhrny z tohto prehliadača. Výsledky z viacerých žiackych zariadení sa spoja až po pripojení servera (pozri docs/BACKEND.md).')),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('strong', null, String(doneTasks)), h('span', null, 'dokončené misie na tomto zariadení')),
        h('div', { class: 'stat' }, h('strong', null, String(topics.reduce((a, t) => a + t.total, 0))), h('span', null, 'zodpovedané úlohy (prvý pokus)'))),
      topics.length
        ? h('table', { class: 'table' },
          h('caption', null, 'Úspešnosť podľa témy (správne na prvý pokus)'),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Téma'), h('th', { scope: 'col' }, 'Úspešnosť'), h('th', { scope: 'col' }, 'Odporúčanie'))),
          h('tbody', null, topics.map((t) => h('tr', null, h('td', null, t.label), h('td', null, `${t.rate} % (${t.ok}/${t.total})`),
            h('td', null, t.total >= 3 && t.rate < 75 ? h('span', { class: 'tag tag-warn' }, 'Zopakovať s triedou') : h('span', { class: 'tag' }, 'V poriadku'))))))
        : h('p', { class: 'muted' }, 'Zatiaľ nie sú žiadne výsledky. Spusti misiu na tomto zariadení alebo si pozri ilustračné hodnoty.'),
      rounds.length ? h('div', null, h('h3', null, 'Úlohy, ktoré robili najväčšie problémy'),
        h('ol', { class: 'bullets' }, rounds.map((r) => h('li', null, `${r.task}: „${r.prompt}“ – ${r.rate} % (${r.ok}/${r.total})`)))) : null,
      demoBox,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { showDemo = !showDemo; drawResults(); } }, icon('eye', 22), showDemo ? ' Skryť ilustračné hodnoty' : ' Zobraziť ilustračné hodnoty'),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: downloadCsv, disabled: topics.length === 0 }, icon('download', 22), ' Exportovať súhrn (CSV)'),
        h('button', { type: 'button', class: 'btn btn-danger', onclick: () => {
          if (window.confirm('Naozaj vymazať všetky údaje o postupe na tomto zariadení?')) { store.resetAll(); drawResults(); drawPrep(); }
        } }, icon('trash', 22), ' Vymazať údaje na tomto zariadení')),
      resetActivity());
  }

  function resetActivity() {
    const level = getLevel(selLevel);
    const sel = h('select', { id: 't-reset', class: 'select' }, level.tasks.map((t) => h('option', { value: t.id }, `Misia ${t.order}: ${t.title}`)));
    const msg = h('span', { class: 'small', role: 'status' });
    return h('div', { class: 'field' },
      h('label', { for: 't-reset' }, 'Opätovné spustenie aktivity na tomto zariadení'),
      h('div', { class: 'row-gap' }, sel, h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => {
        store.resetTask(sel.value);
        msg.textContent = 'Postup v misii bol vynulovaný. Body a odznaky ostávajú.';
        drawResults();
      } }, icon('repeat', 20), ' Spustiť znova'), msg));
  }

  append(root, 
    h('section', { class: 'page-head' }, h('h1', { tabindex: '-1' }, icon('users', 36), ' Učiteľský režim'),
      h('p', { class: 'lead' }, 'Nástroje na hodinu: relácia triedy, premietanie úloh a prehľad tém, ktoré treba zopakovať.')),
    h('p', { class: 'banner banner-warn' }, icon('warning', 22), h('span', null, h('strong', null, 'Verzia bez servera. '),
      'Táto obrazovka nie je chránená prihlásením, lebo obsahuje iba anonymné súhrny z tohto zariadenia. Prihlásenie učiteľov a spoločný prehľad celej triedy vyžadujú server (docs/BACKEND.md).')),
    prep, present, results,
    h('section', { class: 'card' }, h('h2', null, icon('lock', 28), ' Ochrana údajov'),
      h('ul', { class: 'bullets' },
        h('li', null, 'Aplikácia nevyžaduje mená ani e-maily žiakov.'),
        h('li', null, 'Heslá ani ich odvodené podoby sa nikde neukladajú.'),
        h('li', null, 'Ukladá sa iba herný postup: body, odznaky a počty správnych odpovedí.'),
        h('li', null, 'Žiadny verejný rebríček a žiadne hodnotenie jednotlivcov podľa slabosti hesiel.'),
        h('li', null, 'Export CSV obsahuje len súhrnné počty bez osobných údajov.'))));
  drawPrep();
  drawPresent();
  drawResults();
}

export function renderPresent(root, taskId) {
  const task = getTask(taskId);
  if (!task) { append(root, h('p', null, 'Misia sa nenašla.'), h('a', { class: 'btn', href: '#/teacher' }, 'Späť')); return () => {}; }
  let idx = 0;
  let reveal = false;
  const stage = h('section', { class: 'card present-card', 'aria-live': 'polite' });
  const bar = h('div', { class: 'present-bar' });

  function draw() {
    const round = task.rounds[idx];
    clear(stage);
    stage.append(
      h('p', { class: 'eyebrow' }, `${task.title} · úloha ${idx + 1} z ${task.rounds.length}`),
      h('h1', { class: 'present-prompt', tabindex: '-1' }, round.prompt),
      renderPresentation(round, reveal));
    clear(bar);
    bar.append(
      h('a', { class: 'btn btn-ghost', href: '#/teacher' }, icon('back', 22), ' Zavrieť'),
      h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => go(-1), disabled: idx === 0 }, icon('back', 22), ' Predchádzajúca'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { reveal = !reveal; draw(); } }, icon('eye', 22), reveal ? ' Skryť riešenie' : ' Zobraziť riešenie'),
      h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => go(1), disabled: idx === task.rounds.length - 1 }, 'Ďalšia ', icon('forward', 22)),
      document.fullscreenEnabled ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } }, 'Celá obrazovka') : null);
  }
  function go(d) { idx = Math.max(0, Math.min(task.rounds.length - 1, idx + d)); reveal = false; draw(); }
  const onKey = (e) => {
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Enter' && e.target === document.body) { reveal = !reveal; draw(); }
  };
  document.addEventListener('keydown', onKey);
  append(root, bar, stage, h('p', { class: 'muted small' }, 'Šípky vľavo a vpravo menia úlohu, klávesom Enter zobrazíš riešenie.'));
  draw();
  return () => document.removeEventListener('keydown', onKey);
}

void shuffle;
