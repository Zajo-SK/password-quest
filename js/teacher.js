// Učiteľský režim (verzia bez servera). Momentálne je skrytý cez FEATURES.teacher v js/config.js.
// Výsledky sú len z tohto zariadenia a obrazovka nie je chránená heslom, pretože neobsahuje
// žiadne citlivé údaje (iba anonymné súhrny). Zdieľanie výsledkov medzi zariadeniami a prihlásenie učiteľov
// vyžaduje server, pozri docs/BACKEND.md.

import { h, clear, pct, append, embedded } from './util.js';
import { icon } from './icons.js';
import * as store from './store.js';
import { t } from './i18n.js';
import { levels, topicLabel, getLevel, getTask, findRound } from './content/index.js';
import { renderPresentation } from './engine.js';
import { difficultyName } from './views.js';

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
  const valid = (missions || '').split(',').filter((id) => level.tasks.some((x) => x.id === id));
  store.setSession({ code, level: level.id, missions: valid });
  return `#/level/${level.id}`;
}

const DEMO = { participants: 24, finished: 22, topics: [['safe-passwords', 91], ['unique', 76], ['phishing', 83], ['mfa', 68], ['incident', 72]] };
const pctText = (n) => t('pct', { n });

function topicRows() {
  return Object.entries(store.getState().stats.topics)
    .map(([id, s]) => ({ id, label: topicLabel(id), ok: s.ok, total: s.total, rate: pct(s.ok, s.total) }))
    .sort((a, b) => a.rate - b.rate);
}

function roundRows() {
  return Object.entries(store.getState().stats.rounds).map(([id, s]) => {
    const found = findRound(id);
    return found ? { id, task: found.task.title, prompt: found.round.prompt, ok: s.ok, total: s.total, rate: pct(s.ok, s.total) } : null;
  }).filter(Boolean);
}

function csvEscape(v) {
  const s = String(v).replace(/"/g, '""');
  return /[;"\n]/.test(s) ? `"${s}"` : s;
}

export function buildCsv() {
  const lines = [t('csv.header')];
  topicRows().forEach((r) => lines.push([t('csv.topic'), r.id, r.label, r.total, r.ok, r.rate].map(csvEscape).join(';')));
  roundRows().forEach((r) => lines.push([t('csv.task'), r.id, `${r.task}: ${r.prompt}`, r.total, r.ok, r.rate].map(csvEscape).join(';')));
  return '﻿' + lines.join('\n');
}

function downloadCsv() {
  const blob = new Blob([buildCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'password-quest-summary.csv' });
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
  let resetMsg = '';

  const prep = h('section', { class: 'card' });
  const present = h('section', { class: 'card' });
  const results = h('section', { class: 'card' });

  function drawPrep() {
    clear(prep);
    const level = getLevel(selLevel);
    if (selMissions.size === 0) level.tasks.forEach((x) => selMissions.add(x.id));
    const session = st().session;
    const out = h('div', { class: 'session-out', 'aria-live': 'polite' });
    if (session) showSession(out, session);

    const levelSel = h('select', { id: 't-level', class: 'select', onchange: (e) => { selLevel = e.target.value; selMissions = new Set(); drawPrep(); drawPresent(); } },
      levels().map((l) => h('option', { value: l.id, selected: String(l.id) === String(selLevel) }, `${l.name} (${difficultyName(l)})`)));
    const checks = level.tasks.map((x) => {
      const input = h('input', { type: 'checkbox', checked: selMissions.has(x.id), onchange: (e) => { if (e.target.checked) selMissions.add(x.id); else selMissions.delete(x.id); } });
      return h('label', { class: 'check' }, input, h('span', null, t('teacher.mission_item', { n: x.order, title: x.title })));
    });
    prep.append(
      h('h2', null, icon('users', 28), ' ', t('teacher.prep')),
      h('p', { class: 'muted' }, t('teacher.prep_text')),
      h('div', { class: 'field' }, h('label', { for: 't-level' }, t('teacher.level')), levelSel),
      h('fieldset', { class: 'row-set' }, h('legend', null, t('teacher.missions')), h('div', { class: 'checks' }, checks)),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
          if (selMissions.size === 0) { out.textContent = t('teacher.pick_one'); return; }
          const s = { code: newClassCode(), level: selLevel, missions: level.tasks.filter((x) => selMissions.has(x.id)).map((x) => x.id) };
          store.setSession(s);
          clear(out);
          showSession(out, s);
        } }, icon('plus', 22), ' ', t('teacher.create'))),
      out);
  }

  function showSession(out, s) {
    const link = joinLink(s);
    const copyMsg = h('span', { class: 'small', role: 'status' });
    out.append(
      h('div', { class: 'session-box' },
        h('p', null, t('teacher.code'), h('code', { class: 'phrase' }, s.code)),
        embedded()
          ? h('p', { class: 'muted' }, t('teacher.link_embedded'))
          : h('p', null, t('teacher.link'), h('a', { href: link }, link)),
        h('div', { class: 'row-gap' },
          embedded() ? null : h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: async () => {
            try { await navigator.clipboard.writeText(link); copyMsg.textContent = t('teacher.copied'); } catch (e) { copyMsg.textContent = t('teacher.copy_fail'); }
          } }, icon('copy', 20), ' ', t('teacher.copy')),
          h('a', { class: 'btn btn-secondary btn-sm', href: `#/level/${s.level}` }, t('teacher.open_here')),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { store.setSession(null); clear(out); } }, icon('x', 20), ' ', t('teacher.end')),
          copyMsg)));
  }

  function drawPresent() {
    clear(present);
    const level = getLevel(selLevel);
    present.append(
      h('h2', null, icon('play', 28), ' ', t('teacher.present')),
      h('p', { class: 'muted' }, t('teacher.present_text')),
      h('div', { class: 'task-list compact' }, level.tasks.map((x) => h('div', { class: 'row-between' }, h('span', null, t('teacher.mission_item', { n: x.order, title: x.title })),
        h('a', { class: 'btn btn-secondary btn-sm', href: `#/present/${x.id}` }, icon('play', 20), ' ', t('teacher.project'))))));
  }

  function drawResults() {
    clear(results);
    const rows = topicRows();
    const hardest = roundRows().sort((a, b) => a.rate - b.rate || b.total - a.total).slice(0, 5);
    const doneTasks = Object.values(st().tasks).filter((x) => x.done).length;
    const confirmBox = h('div', { class: 'banner banner-warn', hidden: true, role: 'alert' }, icon('warning', 22),
      h('div', null, h('p', null, t('teacher.erase_confirm')),
        h('div', { class: 'row-gap' },
          h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { store.resetAll(); drawResults(); drawPrep(); } }, icon('trash', 20), ' ', t('common.yes_erase')),
          h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { confirmBox.hidden = true; } }, t('common.cancel')))));
    const demoBox = showDemo ? h('div', { class: 'demo' },
      h('p', { class: 'banner banner-warn' }, icon('warning', 22), h('span', null, h('strong', null, t('teacher.demo_strong')), t('teacher.demo_text'))),
      h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('teacher.col_metric')), h('th', { scope: 'col' }, t('teacher.col_value')))),
        h('tbody', null,
          h('tr', null, h('td', null, t('teacher.participants')), h('td', null, String(DEMO.participants))),
          h('tr', null, h('td', null, t('teacher.finished')), h('td', null, String(DEMO.finished))),
          DEMO.topics.map(([id, v]) => h('tr', null, h('td', null, t('teacher.topic_rate', { topic: topicLabel(id) })), h('td', null, pctText(v))))))) : null;

    append(results,
      h('h2', null, icon('list', 28), ' ', t('teacher.results')),
      h('p', { class: 'banner banner-info' }, icon('info', 22), h('span', null, t('teacher.results_note'))),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('strong', null, String(doneTasks)), h('span', null, t('teacher.done_missions'))),
        h('div', { class: 'stat' }, h('strong', null, String(rows.reduce((a, x) => a + x.total, 0))), h('span', null, t('teacher.answered')))),
      rows.length
        ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
          h('caption', null, t('teacher.by_topic')),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('teacher.col_topic')), h('th', { scope: 'col' }, t('teacher.col_rate')), h('th', { scope: 'col' }, t('teacher.col_advice')))),
          h('tbody', null, rows.map((x) => h('tr', null, h('td', null, x.label), h('td', null, `${pctText(x.rate)} (${x.ok}/${x.total})`),
            h('td', null, x.total >= 3 && x.rate < 75 ? h('span', { class: 'tag tag-warn' }, t('teacher.review')) : h('span', { class: 'tag' }, t('teacher.ok'))))))))
        : h('p', { class: 'muted' }, t('teacher.empty')),
      hardest.length ? h('div', null, h('h3', null, t('teacher.hardest')),
        h('ol', { class: 'bullets' }, hardest.map((r) => h('li', null, `${r.task}: „${r.prompt}“ – ${pctText(r.rate)} (${r.ok}/${r.total})`)))) : null,
      demoBox,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { showDemo = !showDemo; drawResults(); } }, icon('eye', 22), ' ', showDemo ? t('teacher.demo_hide') : t('teacher.demo_show')),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: downloadCsv, disabled: rows.length === 0 }, icon('download', 22), ' ', t('teacher.export')),
        h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { confirmBox.hidden = false; } }, icon('trash', 22), ' ', t('teacher.erase'))),
      confirmBox,
      resetActivity());
  }

  function resetActivity() {
    const level = getLevel(selLevel);
    const sel = h('select', { id: 't-reset', class: 'select' }, level.tasks.map((x) => h('option', { value: x.id }, t('teacher.mission_item', { n: x.order, title: x.title }))));
    const msg = h('span', { class: 'small', role: 'status' }, resetMsg);
    resetMsg = '';
    return h('div', { class: 'field' },
      h('label', { for: 't-reset' }, t('teacher.reset_label')),
      h('div', { class: 'row-gap' }, sel, h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => {
        store.resetTask(sel.value);
        resetMsg = t('teacher.reset_done');
        drawResults();
      } }, icon('repeat', 20), ' ', t('teacher.reset_btn')), msg));
  }

  append(root,
    h('section', { class: 'page-head' }, h('h1', { tabindex: '-1' }, icon('users', 36), ' ', t('nav.teacher')),
      h('p', { class: 'lead' }, t('teacher.lead'))),
    h('p', { class: 'banner banner-warn' }, icon('warning', 22), h('span', null, h('strong', null, t('teacher.no_server_strong')), t('teacher.no_server'))),
    prep, present, results,
    h('section', { class: 'card' }, h('h2', null, icon('lock', 28), ' ', t('teacher.privacy')),
      h('ul', { class: 'bullets' }, [1, 2, 3, 4, 5].map((n) => h('li', null, t(`teacher.priv${n}`))))));
  drawPrep();
  drawPresent();
  drawResults();
}

export function renderPresent(root, taskId) {
  const task = getTask(taskId);
  if (!task) {
    append(root, h('p', null, t('present.not_found')), h('a', { class: 'btn', href: '#/teacher' }, t('common.back')));
    return () => {};
  }
  let idx = 0;
  let reveal = false;
  const stage = h('section', { class: 'card present-card', 'aria-live': 'polite' });
  const bar = h('div', { class: 'present-bar' });

  function draw() {
    const round = task.rounds[idx];
    clear(stage);
    stage.append(
      h('p', { class: 'eyebrow' }, t('present.eyebrow', { title: task.title, n: idx + 1, total: task.rounds.length })),
      h('h1', { class: 'present-prompt', tabindex: '-1' }, round.prompt),
      renderPresentation(round, reveal));
    clear(bar);
    append(bar,
      h('a', { class: 'btn btn-ghost', href: '#/teacher' }, icon('back', 22), ' ', t('present.close')),
      h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => go(-1), disabled: idx === 0 }, icon('back', 22), ' ', t('present.prev')),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { reveal = !reveal; draw(); } }, icon('eye', 22), ' ', reveal ? t('present.hide') : t('present.show')),
      h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => go(1), disabled: idx === task.rounds.length - 1 }, t('present.next'), ' ', icon('forward', 22)),
      document.fullscreenEnabled ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => {
        const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(() => {});
      } }, t('present.fullscreen')) : null);
  }
  function go(d) { idx = Math.max(0, Math.min(task.rounds.length - 1, idx + d)); reveal = false; draw(); }
  const onKey = (e) => {
    if (e.target.closest && e.target.closest('input,select,textarea,button,a')) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Enter') { reveal = !reveal; draw(); }
  };
  document.addEventListener('keydown', onKey);
  append(root, bar, stage, h('p', { class: 'muted small' }, t('present.keys')));
  draw();
  return () => document.removeEventListener('keydown', onKey);
}
