// Engine úloh: vykresľuje jednotlivé typy úloh, vyhodnocuje odpovede, počíta body a odznaky.
// Obsah úloh je v js/content/*. Engine pozná len typy úloh, nie konkrétne otázky.

import { h, clear, rich, shuffle, announce, pct } from './util.js';
import { icon, bot } from './icons.js';
import * as store from './store.js';
import { getTask, getLevel, BADGES, TOPICS } from './content/index.js';
import { createLab } from './lab.js';
import { checkGoal } from './analyzer.js';
import { levelProgress } from './progress.js';

/* ---------- Ukážky (e-mail, SMS, upozornenie, časová os) ---------- */

export function renderMock(mock, opts = {}) {
  const picks = [];

  const part = (p) => {
    if (typeof p === 'string') return p;
    if (opts.interactive && p.pick) {
      const btn = h('button', { type: 'button', class: 'part' + (p.link ? ' part-link' : ''), 'aria-pressed': 'false' }, p.text);
      const rec = { part: p, btn, selected: false, locked: false };
      btn.addEventListener('click', () => {
        if (rec.locked) return;
        rec.selected = !rec.selected;
        btn.setAttribute('aria-pressed', String(rec.selected));
        btn.classList.toggle('selected', rec.selected);
        if (opts.onChange) opts.onChange();
      });
      picks.push(rec);
      return btn;
    }
    const cls = (p.link ? 'mock-link ' : '') + (opts.reveal && p.pick && p.flag ? 'reveal-flag' : '');
    return h('span', { class: cls.trim() }, p.text);
  };

  let el;
  if (mock.kind === 'email') {
    el = h('div', { class: 'mock mock-email', role: 'group', 'aria-label': 'Ukážka e-mailovej správy' },
      h('div', { class: 'mock-head' },
        h('div', null, h('span', { class: 'k' }, 'Od: '), part(mock.from)),
        h('div', null, h('span', { class: 'k' }, 'Predmet: '), h('strong', null, part(mock.subject)))),
      h('div', { class: 'mock-body' }, mock.paragraphs.map((para) => h('p', null,
        para.map(part),
        para.filter((p) => typeof p !== 'string' && p.link).map((p) => h('span', { class: 'link-dest' }, icon('link', 18), ' Odkaz vedie na: ', h('code', null, p.url)))))));
  } else if (mock.kind === 'sms') {
    el = h('div', { class: 'mock mock-sms', role: 'group', 'aria-label': 'Ukážka SMS správy' },
      h('div', { class: 'k' }, 'Od: ' + mock.from), h('div', { class: 'bubble' }, mock.text));
  } else if (mock.kind === 'push') {
    el = h('div', { class: 'mock mock-push', role: 'group', 'aria-label': 'Ukážka upozornenia na prihlásenie' },
      mock.steps ? h('ol', { class: 'steps' }, mock.steps.map((s) => h('li', { class: s.done ? 'done' : '' }, s.label + (s.done ? ' – hotovo' : ' – čaká na teba')))) : null,
      h('strong', null, mock.title),
      h('ul', null, mock.lines.map((l) => h('li', null, l))),
      h('div', { class: 'fake-btns', 'aria-hidden': 'true' }, mock.buttons.map((b) => h('span', { class: 'fake-btn' }, b))),
      h('p', { class: 'muted small' }, 'Ukážka obrazovky. Odpoveď vyber nižšie.'));
  } else if (mock.kind === 'timeline') {
    el = h('div', { class: 'mock mock-timeline', role: 'group', 'aria-label': mock.title },
      h('strong', null, mock.title),
      h('ol', null, mock.events.map((e) => h('li', null, h('time', null, e.time), h('span', null, e.text)))),
      h('strong', { class: 'sub' }, 'Ďalšie informácie'),
      h('ul', null, mock.facts.map((f) => h('li', null, f))));
  } else {
    el = h('div');
  }
  return { el, picks };
}

/* ---------- Spoločné pomocné ---------- */

const mark = (btn, name) => {
  const m = btn.querySelector('.option-mark');
  if (m) { clear(m); m.append(icon(name, 22)); }
};

function checkButton(label, onclick) {
  return h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick }, icon('check', 22), ' ', label);
}

/* ---------- Renderery typov úloh ---------- */

function renderChoice(round, ctx) {
  const opts = shuffle(round.options);
  let done = false;
  const withIcons = opts.some((o) => o.icon);
  const btns = opts.map((o) => h('button', { type: 'button', class: 'option', onclick: () => pick(o) },
    o.icon ? icon(o.icon, 34, 'option-icon') : null,
    h('span', { class: 'option-text' }, o.text),
    h('span', { class: 'option-mark', 'aria-hidden': 'true' })));
  const list = h('div', { class: 'options' + (withIcons ? ' options-icons' : ''), role: 'group', 'aria-label': 'Možnosti odpovede' }, btns);

  function pick(o) {
    if (done) return;
    done = true;
    const good = opts.find((x) => x.correct);
    btns.forEach((b, i) => {
      b.disabled = true;
      if (opts[i].correct) { b.classList.add('is-correct'); mark(b, 'check'); }
      if (opts[i] === o) b.classList.add('chosen');
      if (opts[i] === o && !o.correct) { b.classList.add('is-wrong'); mark(b, 'x'); }
    });
    const explain = o.correct
      ? [{ ok: true, text: o.why }]
      : [{ ok: false, text: `Tvoja voľba „${o.text}“: ${o.why}` }, { ok: true, text: `Správne je „${good.text}“: ${good.why}` }];
    ctx.submit({ correct: !!o.correct, explain });
  }
  return { el: list };
}

function renderMulti(round, ctx) {
  const opts = round.options;
  const sel = new Set();
  const btns = opts.map((o, i) => {
    const b = h('button', { type: 'button', class: 'option option-toggle', 'aria-pressed': 'false', onclick: () => {
      if (sel.has(i)) sel.delete(i); else sel.add(i);
      b.setAttribute('aria-pressed', String(sel.has(i)));
      b.classList.toggle('selected', sel.has(i));
      check.disabled = sel.size === 0;
    } }, h('span', { class: 'option-text' }, o.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' }));
    return b;
  });
  const check = checkButton('Skontrolovať', evaluate);
  check.disabled = true;

  function evaluate() {
    const explain = [];
    let correct = true;
    btns.forEach((b, i) => {
      b.disabled = true;
      const o = opts[i];
      const picked = sel.has(i);
      if (picked && o.correct) { b.classList.add('is-correct'); mark(b, 'check'); explain.push({ ok: true, text: `„${o.text}“ – ${o.why}` }); }
      else if (picked && !o.correct) { b.classList.add('is-wrong'); mark(b, 'x'); correct = false; explain.push({ ok: false, text: `„${o.text}“ do výberu nepatrí. ${o.why}` }); }
      else if (!picked && o.correct) { b.classList.add('is-missed'); mark(b, 'flag'); correct = false; explain.push({ ok: false, text: `Chýbalo „${o.text}“. ${o.why}` }); }
    });
    check.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, h('div', { class: 'options', role: 'group', 'aria-label': 'Možnosti, vyber viac' }, btns), h('div', { class: 'actions' }, check)) };
}

function renderRows(round, ctx) {
  const rowsEls = [];
  const answers = round.rows.map(() => null);
  const check = checkButton('Skontrolovať', evaluate);
  check.disabled = true;

  round.rows.forEach((row, ri) => {
    const own = !!row.options;
    const choices = own ? shuffle(row.options.map((o, i) => ({ id: String(i), label: o.text, correct: !!o.correct, why: o.why }))) : round.categories;
    const name = `${round.id}-${ri}`;
    const pills = choices.map((c) => {
      const input = h('input', { type: 'radio', name, value: c.id, class: 'pill-input', onchange: () => {
        answers[ri] = c.id;
        check.disabled = answers.some((a) => a == null);
      } });
      return h('label', { class: 'pill' }, input, h('span', { class: 'pill-text' }, c.label));
    });
    const status = h('span', { class: 'row-status', 'aria-hidden': 'true' });
    const fs = h('fieldset', { class: 'row-set' }, h('legend', null, row.text, status), h('div', { class: 'pills' }, pills));
    rowsEls.push({ fs, pills, choices, status, row });
  });

  function evaluate() {
    let correct = true;
    const explain = [];
    rowsEls.forEach((r, ri) => {
      const own = !!r.row.options;
      const given = answers[ri];
      const good = own ? r.choices.find((c) => c.correct) : r.choices.find((c) => c.id === r.row.answer);
      const ok = given === good.id;
      if (!ok) correct = false;
      r.pills.forEach((p, pi) => {
        const input = p.querySelector('input');
        input.disabled = true;
        if (r.choices[pi].id === good.id) p.classList.add('is-correct');
        if (r.choices[pi].id === given && !ok) p.classList.add('is-wrong');
      });
      clear(r.status);
      r.status.append(icon(ok ? 'check' : 'x', 22));
      r.fs.classList.add(ok ? 'row-ok' : 'row-bad');
      if (own) {
        const chosen = r.choices.find((c) => c.id === given);
        explain.push(ok
          ? { ok: true, text: `${r.row.text}: ${good.why}` }
          : { ok: false, text: `${r.row.text}: „${chosen.label}“ nie je ideálne. ${chosen.why} Lepšie je „${good.label}“: ${good.why}` });
      } else {
        explain.push({ ok, text: ok ? `${r.row.text} → ${good.label}. ${r.row.why}` : `${r.row.text} patrí do „${good.label}“. ${r.row.why}` });
      }
    });
    check.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, rowsEls.map((r) => r.fs), h('div', { class: 'actions' }, check)) };
}

function renderHotspot(round, ctx) {
  const check = checkButton('Skontrolovať označené', () => evaluate(false));
  const legit = h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => evaluate(true) }, icon('shield-check', 22), ' Správa je v poriadku');
  const hint = h('p', { class: 'muted', role: 'status' });
  const { el, picks } = renderMock(round.mock, { interactive: true, onChange: () => { hint.textContent = ''; } });

  function evaluate(claimsOk) {
    const flagged = picks.filter((p) => p.part.flag);
    const marked = picks.filter((p) => p.selected);
    if (!claimsOk && marked.length === 0) {
      hint.textContent = 'Najprv označ aspoň jednu podozrivú časť, alebo vyber, že je správa v poriadku.';
      return;
    }
    let correct;
    if (claimsOk) correct = flagged.length === 0;
    else correct = flagged.every((p) => p.selected) && marked.every((p) => p.part.flag);
    const explain = [];
    picks.forEach((p) => {
      p.locked = true;
      p.btn.disabled = true;
      if (p.part.flag && p.selected) { p.btn.classList.add('is-correct'); explain.push({ ok: true, text: `„${p.part.text}“ – ${p.part.why}` }); }
      else if (p.part.flag && !p.selected) { p.btn.classList.add('is-missed'); explain.push({ ok: false, text: `Prehliadol si „${p.part.text}“ – ${p.part.why}` }); }
      else if (!p.part.flag && p.selected) { p.btn.classList.add('is-wrong'); explain.push({ ok: false, text: `„${p.part.text}“ nie je samo osebe podozrivé. ${p.part.why}` }); }
    });
    if (claimsOk && flagged.length === 0) explain.unshift({ ok: true, text: 'Správne, táto správa nežiada nič podozrivé: žiadne heslo, žiadny nátlak a žiadny zavádzajúci odkaz.' });
    if (claimsOk && flagged.length > 0) explain.unshift({ ok: false, text: 'Táto správa v poriadku nie je. Pozri, čo si prehliadol.' });
    if (!claimsOk && flagged.length === 0) explain.unshift({ ok: false, text: 'Táto správa je v poriadku, nežiada nič podozrivé.' });
    check.hidden = true;
    legit.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, el, hint, h('div', { class: 'actions' }, check, legit)) };
}

function renderOrder(round, ctx) {
  const items = round.items.map((it, i) => ({ ...it, i }));
  const plan = [];
  const available = h('div', { class: 'options', role: 'group', 'aria-label': 'Dostupné kroky' });
  const planList = h('ol', { class: 'plan-list', 'aria-label': 'Tvoj plán' });
  const empty = h('p', { class: 'muted plan-empty' }, 'Plán je zatiaľ prázdny. Klikaj na kroky vyššie v poradí podľa priority. Kliknutím na krok v pláne ho vrátiš späť.');
  const check = checkButton('Skontrolovať plán', evaluate);
  let locked = false;
  const btnFor = new Map();

  items.forEach((it) => {
    const b = h('button', { type: 'button', class: 'option', onclick: () => add(it) }, h('span', { class: 'option-text' }, it.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' }));
    btnFor.set(it.i, b);
  });
  shuffle(items).forEach((it) => available.append(btnFor.get(it.i)));

  function redraw() {
    clear(planList);
    plan.forEach((it, n) => {
      planList.append(h('li', null, h('button', { type: 'button', class: 'plan-item', 'aria-label': `Krok ${n + 1}: ${it.text}. Kliknutím ho vrátiš späť.`, onclick: () => remove(it) }, it.text)));
    });
    empty.hidden = plan.length > 0;
    check.disabled = plan.length === 0;
    btnFor.forEach((b, i) => { b.disabled = locked || plan.some((p) => p.i === i); b.classList.toggle('used', plan.some((p) => p.i === i)); });
  }
  function add(it) { if (!locked) { plan.push(it); redraw(); } }
  function remove(it) { if (!locked) { plan.splice(plan.indexOf(it), 1); redraw(); } }

  function evaluate() {
    locked = true;
    const required = items.filter((it) => it.tier != null);
    const tiersOk = plan.every((p, n) => p.tier != null && (n === 0 || plan[n - 1].tier <= p.tier));
    const correct = plan.length === required.length && tiersOk;
    const sorted = [...required].sort((a, b) => a.tier - b.tier || a.i - b.i);
    const explain = [{ ok: correct, text: correct ? 'Poradie krokov je správne.' : 'Správne poradie krokov je nižšie. Pozri, prečo je každý z nich dôležitý.' }];
    sorted.forEach((it, n) => explain.push({ ok: true, text: `${n + 1}. ${it.text} ${it.why}` }));
    plan.filter((p) => p.tier == null).forEach((p) => explain.push({ ok: false, text: `Do plánu nepatrí: „${p.text}“ ${p.why}` }));
    items.filter((it) => it.tier == null && !plan.includes(it)).forEach((it) => explain.push({ ok: null, text: `Správne si nevybral „${it.text}“. ${it.why}` }));
    redraw();
    [...planList.querySelectorAll('.plan-item')].forEach((b, n) => {
      b.disabled = true;
      const p = plan[n];
      const inPlace = p.tier != null && (n === 0 || plan[n - 1].tier <= p.tier);
      b.classList.add(p.tier == null ? 'is-wrong' : inPlace ? 'is-correct' : 'is-missed');
    });
    check.hidden = true;
    ctx.submit({ correct, explain });
  }
  redraw();
  return { el: h('div', null, h('h3', { class: 'lab-sub' }, 'Dostupné kroky'), available, h('h3', { class: 'lab-sub' }, 'Tvoj plán'), empty, planList, h('div', { class: 'actions' }, check)) };
}

function renderReuse(round, ctx) {
  let predicted = null;
  let phase = 'predict';
  const root = h('div', { class: 'reuse' });
  const status = {};
  const cards = {};
  round.accounts.forEach((a) => {
    status[a.id] = h('span', { class: 'acc-status' });
    cards[a.id] = h('div', { class: 'acc', dataset: { id: a.id } },
      icon(a.icon, 32), h('div', { class: 'acc-info' }, h('strong', null, a.name), h('span', { class: 'acc-pw' }, 'Heslo: ', h('code', null, '••••••••'))), status[a.id]);
  });
  const accWrap = h('div', { class: 'accs', hidden: true }, round.accounts.map((a) => cards[a.id]));
  const out = h('div', { class: 'reuse-out', 'aria-live': 'polite' });
  const unique = new Set();

  const setStatus = (id, text, cls) => {
    status[id].textContent = text;
    cards[id].className = 'acc ' + (cls || '');
  };

  const optBtns = round.options.map((o) => h('button', { type: 'button', class: 'option', onclick: () => predict(o) }, h('span', { class: 'option-text' }, o.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' })));
  const optList = h('div', { class: 'options', role: 'group', 'aria-label': 'Možnosti odpovede' }, shuffle(optBtns));

  function predict(o) {
    predicted = o;
    optBtns.forEach((b) => { b.disabled = true; });
    const i = round.options.indexOf(o);
    optBtns[i].classList.add(o.correct ? 'is-correct' : 'is-wrong', 'chosen');
    mark(optBtns[i], o.correct ? 'check' : 'x');
    if (!o.correct) { const gi = round.options.findIndex((x) => x.correct); optBtns[gi].classList.add('is-correct'); mark(optBtns[gi], 'check'); }
    clear(out);
    out.append(h('p', { class: o.correct ? 'ok-text' : 'bad-text' }, icon(o.correct ? 'check' : 'bulb', 22), ' ', o.correct ? 'Tvoj odhad je správny. Pozrime sa na to v simulácii.' : 'Pozrime sa v simulácii, čo sa naozaj stane.'));
    startSim1();
  }

  function startSim1() {
    phase = 'sim1';
    accWrap.hidden = false;
    round.accounts.forEach((a) => setStatus(a.id, 'Rovnaké heslo', ''));
    out.append(
      h('p', null, `Všetky tri účty majú rovnaké ukážkové heslo (${round.sample}).`),
      h('button', { type: 'button', class: 'btn btn-danger btn-lg', onclick: leak1 }, icon('warning', 22), ' Simulovať únik z herného webu'));
  }

  function leak1(e) {
    e.currentTarget.disabled = true;
    round.accounts.forEach((a) => {
      if (a.id === round.leakFrom) setStatus(a.id, 'Uniklo', 'leaked');
      else setStatus(a.id, 'Ohrozené (rovnaké heslo)', 'at-risk');
    });
    out.append(
      h('p', { class: 'bad-text' }, icon('warning', 22), ' Heslo uniklo z hernej služby. Útočníci ho skúšajú aj na iných službách. Školský e-mail a ďalší účet sú teraz ohrozené.'),
      h('p', null, 'Teraz skús to isté s jedinečnými heslami. Klikni na každý účet a nastav mu iné ukážkové heslo.'));
    unique.clear();
    const setBtns = round.accounts.map((a) => {
      const b = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => {
        unique.add(a.id); b.disabled = true; b.textContent = `${a.name}: jedinečné heslo nastavené`;
        setStatus(a.id, 'Jedinečné heslo', 'unique');
        sim2.disabled = unique.size < round.accounts.length;
      } }, `Nastaviť jedinečné heslo: ${a.name}`);
      return b;
    });
    const sim2 = h('button', { type: 'button', class: 'btn btn-danger btn-lg', disabled: true, onclick: leak2 }, icon('warning', 22), ' Simulovať únik znova');
    out.append(h('div', { class: 'row-gap' }, setBtns), sim2);
  }

  function leak2(e) {
    e.currentTarget.disabled = true;
    round.accounts.forEach((a) => {
      if (a.id === round.leakFrom) setStatus(a.id, 'Uniklo len toto heslo', 'leaked');
      else setStatus(a.id, 'V bezpečí (iné heslo)', 'safe');
    });
    out.append(h('p', { class: 'ok-text' }, icon('check', 22), ' Teraz uniklo iba jedno heslo. Školský e-mail a ďalšia služba zostali v bezpečí.'));
    const explain = [
      { ok: predicted.correct, text: predicted.why },
      { ok: true, text: 'V simulácii si videl, že rovnaké heslo vedie k ohrozeniu viacerých účtov, kým jedinečné heslá škodu obmedzia na jednu službu.' },
    ];
    ctx.submit({ correct: predicted.correct, explain });
  }

  return { el: h('div', null, h('p', { class: 'lead' }, round.question), optList, accWrap, out) };
}

function renderLab(round, ctx) {
  const goalList = h('ul', { class: 'goal-list' });
  const lab = createLab({
    profile: round.profile,
    onResult: (r, value) => updateGoals(r, value),
  });
  ctx.onCleanup(() => lab.destroy());
  const check = checkButton('Skontrolovať úlohu', evaluate);

  function updateGoals(r, value) {
    clear(goalList);
    const g = round.goal;
    const res = checkGoal(r, g, value);
    const item = (ok, text) => goalList.append(h('li', { class: ok ? 'ok' : '' }, icon(ok ? 'check' : 'flag', 20), ' ', text));
    if (g.minLen) item(r.length >= g.minLen, `Aspoň ${g.minLen} znakov`);
    if (g.noIssues) item(value.length > 0 && res.unmet.filter((u) => !u.startsWith('Fráza má mať')).length === 0 && !!value, 'Laboratórium nenašlo žiadny problémový vzor');
  }

  function evaluate() {
    const value = lab.getValue();
    const res = checkGoal(lab.getAnalysis(), round.goal, value);
    if (!value) { goalList.after(h('p', { class: 'muted', role: 'status' }, 'Najprv zadaj ukážkovú frázu.')); return; }
    check.hidden = true;
    const explain = res.ok
      ? [{ ok: true, text: 'Splnil si všetky ciele. Pripomíname, že aj vtedy nejde o záruku bezpečnosti a vymyslenú ukážku nepoužívaj ako skutočné heslo.' }]
      : [{ ok: false, text: 'Cieľ ešte nie je splnený:' }, ...res.unmet.map((u) => ({ ok: false, text: u }))];
    ctx.submit({ correct: res.ok, explain });
  }
  lab.goalBox.hidden = false;
  lab.goalBox.append(h('strong', null, 'Cieľ úlohy'), goalList);
  updateGoals(lab.getAnalysis(), '');
  return { el: h('div', null, round.hint ? h('p', { class: 'hint' }, icon('bulb', 22), ' ', round.hint) : null, lab.el, h('div', { class: 'actions' }, check)) };
}

const RENDERERS = {
  choice: renderChoice,
  multi: renderMulti,
  rows: renderRows,
  hotspot: renderHotspot,
  order: renderOrder,
  reuse: renderReuse,
  lab: renderLab,
};

/* ---------- Spúšťač misie ---------- */

export function mountTask(root, taskId) {
  const task = getTask(taskId);
  if (!task) {
    root.append(h('div', { class: 'card' }, h('h1', null, 'Misia sa nenašla'), h('a', { class: 'btn btn-primary', href: '#/levels' }, 'Späť na výber úrovne')));
    return () => {};
  }
  const level = getLevel(task.level);
  let run = null;
  let cleanups = [];
  let timerId = null;
  const shell = h('div', { class: 'task-shell', dataset: { level: String(task.level) } });
  root.append(shell);

  const runCleanup = () => { cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignoruj */ } }); cleanups = []; };

  function header(showProgress) {
    const total = run ? run.queue.length : 0;
    const head = h('header', { class: 'task-head' },
      h('a', { class: 'btn btn-ghost', href: `#/level/${level.id}` }, icon('back', 22), ' Späť na úroveň'),
      h('div', { class: 'task-title' }, icon(task.icon, 28), h('span', null, task.title)));
    if (showProgress && run) {
      const value = run.pos;
      head.append(h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Postup v misii', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(value) },
        h('span', { class: 'progress-fill', style: `width:${pct(value, total)}%` })));
    }
    if (task.timer && !store.getState().settings.hideTimer) head.append(timerChip());
    return head;
  }

  function timerChip() {
    const txt = h('span', { class: 'timer-text' }, '00:00');
    const tick = () => {
      const s = Math.floor((Date.now() - (run ? run.started : Date.now())) / 1000);
      txt.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    tick();
    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    return h('div', { class: 'chip timer-chip' }, icon('clock', 18), txt,
      h('span', { class: 'small' }, 'Čas je len informácia, nič sa za neho neodpočítava.'),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { store.setSetting('hideTimer', true); clearInterval(timerId); timerId = null; head2remove(); } }, 'Skryť'));
  }
  function head2remove() { const c = shell.querySelector('.timer-chip'); if (c) c.remove(); }

  function showIntro() {
    runCleanup();
    clear(shell);
    const st = store.getState();
    const t = store.getTask(taskId);
    const resume = st.resume && st.resume.taskId === taskId && st.resume.queue.every((i) => i < task.rounds.length) ? st.resume : null;
    const unmastered = task.rounds.map((_, i) => i).filter((i) => !t.mastered[i]);
    const actions = h('div', { class: 'actions' });
    if (resume) {
      actions.append(
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => { run = resume; showRound(); } }, icon('play', 22), ` Pokračovať (úloha ${Math.min(resume.pos + 1, resume.queue.length)} z ${resume.queue.length})`),
        h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => startRun('all') }, icon('repeat', 22), ' Začať odznova'));
    } else if (t.done) {
      actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => startRun('all') }, icon('repeat', 22), ' Zopakovať celú misiu'));
    } else if (unmastered.length < task.rounds.length && unmastered.length > 0) {
      actions.append(
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => startRun('unmastered') }, icon('repeat', 22), ` Zopakovať nezvládnuté (${unmastered.length})`),
        h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => startRun('all') }, 'Hrať celú misiu od začiatku'));
    } else {
      actions.append(h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => startRun('all') }, icon('play', 22), ' Začať misiu'));
    }
    shell.append(header(false), h('section', { class: 'card intro-card' },
      bot('happy', 120),
      h('div', { class: 'intro-body' },
        h('p', { class: 'eyebrow' }, `Úroveň ${level.id} · ${level.name} · Misia ${task.order}`),
        h('h1', { id: 'task-h1', tabindex: '-1' }, task.title),
        task.intro.map((p) => h('p', { class: 'lead' }, rich(p))),
        h('div', { class: 'chips' },
          h('span', { class: 'chip' }, icon('list', 18), ` ${task.rounds.length} ${task.rounds.length < 5 ? 'úlohy' : 'úloh'}`),
          h('span', { class: 'chip' }, icon('clock', 18), ` približne ${task.minutes} min`),
          h('span', { class: 'chip' }, icon('book', 18), ` ${TOPICS[task.topic]}`),
          task.badge ? h('span', { class: 'chip chip-badge' }, icon(BADGES[task.badge].icon, 18), ` Odznak: ${BADGES[task.badge].name}`) : null),
        h('p', { class: 'muted' }, 'Za chyby ti nič neubúda. Nesprávne odpovede si po vysvetlení zopakuješ.'),
        actions)));
    focusHeading('#task-h1');
  }

  function startRun(mode) {
    const t = store.getTask(taskId);
    const idxs = task.rounds.map((_, i) => i).filter((i) => mode === 'all' || !t.mastered[i]);
    run = { taskId, mode, phase: 'main', queue: idxs, mainCount: idxs.length, pos: 0, wrong: [], firstTry: {}, streak: 0, earned: 0, started: Date.now() };
    store.setResume(run);
    showRound();
  }

  function focusHeading(sel) {
    const el = shell.querySelector(sel);
    if (el) el.focus({ preventScroll: false });
  }

  function showRound() {
    runCleanup();
    clear(shell);
    const idx = run.queue[run.pos];
    const round = task.rounds[idx];
    const total = run.queue.length;
    let submitted = false;

    const feedback = h('div', { class: 'feedback' });
    const ctx = {
      round,
      onCleanup: (fn) => cleanups.push(fn),
      submit: (res) => { if (submitted) return; submitted = true; handleResult(round, idx, res, feedback); },
    };
    const rendered = RENDERERS[round.type](round, ctx);

    const card = h('section', { class: 'card round-card', 'aria-labelledby': 'round-title' },
      h('div', { class: 'round-meta' },
        h('span', { class: 'chip' }, `${run.phase === 'retry' ? 'Opakovanie · ' : ''}Úloha ${run.pos + 1} z ${total}`),
        h('span', { class: 'chip' }, TOPICS[round.topic] || round.topic)),
      round.scenario ? h('p', { class: 'scenario' }, icon('info', 22), ' ', round.scenario) : null,
      h('h1', { id: 'round-title', class: 'round-prompt', tabindex: '-1' }, round.prompt),
      round.mock && round.type !== 'hotspot' ? renderMock(round.mock).el : null,
      rendered.el,
      feedback);
    shell.append(header(true), card);
    focusHeading('#round-title');
    window.scrollTo({ top: 0 });
  }

  function handleResult(round, idx, res, feedback) {
    let gained = 0;
    let streakBonus = 0;
    const t = store.getTask(taskId);
    const mastered = { ...t.mastered };
    if (run.phase === 'main') {
      store.recordRound(round.id, round.topic, res.correct);
      run.firstTry[idx] = res.correct;
      if (res.correct) {
        gained += store.awardXp(`${taskId}:${idx}`, 100);
        run.streak += 1;
        if (run.streak % 3 === 0) streakBonus = store.awardXp(`${taskId}:${idx}:s`, 25);
        mastered[idx] = true;
      } else {
        run.streak = 0;
        run.wrong.push(idx);
      }
    } else if (res.correct) {
      gained += store.awardXp(`${taskId}:${idx}`, 50);
      mastered[idx] = true;
    }
    store.setTask(taskId, { mastered });
    run.earned += gained + streakBonus;

    const retry = run.phase === 'retry';
    const last = run.pos + 1 >= run.queue.length;
    const willRepeat = run.phase === 'main' && last && run.wrong.length > 0;
    const nextLabel = last ? (willRepeat ? 'Zopakovať nesprávne' : 'Dokončiť misiu') : 'Ďalej';
    const nextBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => next() }, nextLabel, ' ', icon('forward', 22));

    clear(feedback);
    feedback.append(h('div', { class: 'fb ' + (res.correct ? 'fb-ok' : 'fb-bad'), role: 'status' },
      bot(res.correct ? 'cheer' : 'oops', 84),
      h('div', { class: 'fb-body' },
        h('h2', { class: 'fb-title' }, icon(res.correct ? 'check' : 'bulb', 28), res.correct ? ' Správne!' : retry ? ' Pozri správne riešenie' : ' Ešte nie, pozrime sa prečo'),
        h('div', { class: 'chips' },
          gained > 0 ? h('span', { class: 'chip chip-xp' }, icon('star', 18), ` +${gained} XP`) : null,
          streakBonus > 0 ? h('span', { class: 'chip chip-xp' }, icon('trophy', 18), ` Séria! +${streakBonus} XP`) : null,
          res.correct && gained === 0 ? h('span', { class: 'chip' }, 'Body za túto úlohu už máš') : null),
        h('ul', { class: 'explain' }, res.explain.map((e) => h('li', { class: e.ok === true ? 'ok' : e.ok === false ? 'bad' : '' },
          icon(e.ok === true ? 'check' : e.ok === false ? 'x' : 'info', 20), h('span', null, rich(e.text))))),
        round.summary ? h('p', { class: 'summary' }, icon('bulb', 22), h('span', null, h('strong', null, 'Zapamätaj si: '), round.summary)) : null,
        !res.correct && !retry ? h('p', { class: 'muted' }, 'Túto úlohu si na konci misie zopakujeme, aby si to zvládol.') : null,
        h('div', { class: 'actions' }, nextBtn))));
    announce(res.correct ? 'Správne.' : 'Odpoveď nie je správna. Prečítaj si vysvetlenie.');
    nextBtn.focus({ preventScroll: true });
    nextBtn.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }

  function next() {
    run.pos += 1;
    if (run.pos >= run.queue.length) {
      if (run.phase === 'main' && run.wrong.length > 0) { showInterlude(); return; }
      finish();
      return;
    }
    store.setResume(run);
    showRound();
  }

  function showInterlude() {
    runCleanup();
    clear(shell);
    const n = run.wrong.length;
    store.setResume({ ...run, pos: run.queue.length });
    shell.append(header(false), h('section', { class: 'card intro-card' },
      bot('think', 120),
      h('div', { class: 'intro-body' },
        h('h1', { id: 'inter-h1', tabindex: '-1' }, 'Zopakujeme si to'),
        h('p', { class: 'lead' }, `${n} ${n === 1 ? 'úloha sa nepodarila' : n < 5 ? 'úlohy sa nepodarili' : 'úloh sa nepodarilo'} na prvý pokus. To je v poriadku, učíme sa. Skús ich ešte raz, teraz už s vysvetlením.`),
        h('p', { class: 'muted' }, 'Za zvládnutie po vysvetlení dostaneš 50 XP.'),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => {
          run.phase = 'retry'; run.queue = [...run.wrong]; run.wrong = []; run.pos = 0; store.setResume(run); showRound();
        } }, icon('repeat', 22), ' Zopakovať')))));
    focusHeading('#inter-h1');
  }

  function finish() {
    const t = store.getTask(taskId);
    const allMastered = task.rounds.every((_, i) => t.mastered[i]);
    const newBadges = [];
    let levelDone = false;
    store.setTask(taskId, { plays: (t.plays || 0) + 1, done: allMastered });
    if (allMastered) {
      run.earned += store.awardXp(`${taskId}:done`, 200);
      if (task.badge && store.addBadge(task.badge)) newBadges.push(task.badge);
      if (levelProgress(level).complete) {
        levelDone = true;
        run.earned += store.awardXp(`level${level.id}:done`, 300);
        if (level.badge && store.addBadge(level.badge)) newBadges.push(level.badge);
      }
    }
    store.setResume(null);
    showSummary(allMastered, newBadges, levelDone);
  }

  function showSummary(allMastered, newBadges, levelDone) {
    runCleanup();
    clear(shell);
    if (timerId) { clearInterval(timerId); timerId = null; }
    const t = store.getTask(taskId);
    const left = task.rounds.map((_, i) => i).filter((i) => !t.mastered[i]);
    const firstOk = Object.values(run.firstTry).filter(Boolean).length;
    const next = level.tasks[task.order];
    const planLines = allMastered && task.planTitle
      ? task.rounds.flatMap((r) => (r.type === 'rows' && r.rows.every((x) => x.options) ? r.rows.map((x) => x.plan) : []))
      : [];

    shell.append(header(false), h('section', { class: 'card summary-card' },
      bot(allMastered ? 'cheer' : 'think', 120),
      h('div', { class: 'intro-body' },
        h('h1', { id: 'sum-h1', tabindex: '-1' }, allMastered ? 'Misia splnená!' : 'Skoro tam!'),
        h('p', { class: 'lead' }, allMastered
          ? 'Zvládol si všetky úlohy tejto misie.'
          : `Zostáva zopakovať ${left.length} ${left.length === 1 ? 'úlohu' : left.length < 5 ? 'úlohy' : 'úloh'}. Skús to znova, stále sa dá všetko zvládnuť.`),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('strong', null, `+${run.earned} XP`), h('span', null, 'získané v tejto misii')),
          h('div', { class: 'stat' }, h('strong', null, `${firstOk} / ${run.mainCount}`), h('span', null, 'správne na prvý pokus')),
          h('div', { class: 'stat' }, h('strong', null, `${task.rounds.length - left.length} / ${task.rounds.length}`), h('span', null, 'zvládnuté úlohy'))),
        newBadges.map((id) => h('div', { class: 'badge-card new', role: 'status' }, icon(BADGES[id].icon, 40), h('div', null, h('strong', null, `Nový odznak: ${BADGES[id].name}`), h('span', null, BADGES[id].desc)))),
        levelDone ? h('p', { class: 'ok-text' }, icon('trophy', 22), ` Dokončil si celú úroveň ${level.name}! Pozri si záverečné hodnotenie.`) : null,
        h('div', { class: 'actions' },
          left.length ? h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => startRun('unmastered') }, icon('repeat', 22), ' Zopakovať nesprávne') : null,
          levelDone ? h('a', { class: 'btn btn-primary btn-lg', href: `#/level/${level.id}/summary` }, icon('trophy', 22), ' Záverečné hodnotenie') : null,
          allMastered && next ? h('a', { class: 'btn btn-primary btn-lg', href: `#/task/${next.id}` }, 'Ďalšia misia ', icon('forward', 22)) : null,
          h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => startRun('all') }, icon('repeat', 22), ' Hrať znova celé'),
          h('a', { class: 'btn btn-ghost btn-lg', href: `#/level/${level.id}` }, 'Späť na úroveň')))));
    if (planLines.length) {
      const printBtn = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => {
        document.body.classList.add('print-mode');
        window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'), { once: true });
        window.print();
      } }, icon('print', 22), ' Vytlačiť plán');
      shell.append(h('section', { class: 'card printable' }, h('h2', null, task.planTitle), h('ol', { class: 'plan-final' }, planLines.map((l) => h('li', null, l))), printBtn));
    }
    focusHeading('#sum-h1');
    window.scrollTo({ top: 0 });
  }

  showIntro();
  return () => { runCleanup(); if (timerId) clearInterval(timerId); };
}

/* ---------- Režim pre premietanie (učiteľ) ---------- */

export function renderPresentation(round, reveal) {
  const wrap = h('div', { class: 'present-body' });
  const letters = 'ABCDEFGH';
  if (round.scenario) wrap.append(h('p', { class: 'scenario' }, icon('info', 28), ' ', round.scenario));
  if (round.mock && round.type !== 'hotspot') wrap.append(renderMock(round.mock).el);

  if (round.type === 'choice' || round.type === 'multi') {
    wrap.append(h('ul', { class: 'present-options' }, round.options.map((o, i) => h('li', { class: reveal && o.correct ? 'is-correct' : '' },
      h('span', { class: 'letter' }, letters[i]), h('span', null, o.text),
      reveal ? h('span', { class: 'why' }, (o.correct ? '✓ ' : '✗ ') + o.why) : null))));
  } else if (round.type === 'rows') {
    wrap.append(h('ul', { class: 'present-options' }, round.rows.map((r) => {
      const own = !!r.options;
      const good = own ? r.options.find((o) => o.correct).text : round.categories.find((c) => c.id === r.answer).label;
      return h('li', { class: reveal ? 'is-correct' : '' }, h('span', null, r.text),
        reveal ? h('span', { class: 'why' }, '→ ' + good + (own ? '' : '. ' + r.why)) : own ? h('span', { class: 'why' }, r.options.map((o) => o.text).join(' / ')) : null);
    })));
    if (round.categories) wrap.append(h('p', { class: 'muted' }, 'Kategórie: ' + round.categories.map((c) => c.label).join(' · ')));
  } else if (round.type === 'hotspot') {
    wrap.append(renderMock(round.mock, { reveal }).el);
    if (reveal) {
      const items = [];
      const walk = (p) => { if (p && typeof p === 'object' && p.pick && p.flag) items.push(p); };
      walk(round.mock.from); walk(round.mock.subject);
      round.mock.paragraphs.forEach((para) => para.forEach(walk));
      wrap.append(items.length
        ? h('ul', { class: 'explain' }, items.map((p) => h('li', { class: 'ok' }, icon('flag', 20), h('span', null, `„${p.text}“ – ${p.why}`))))
        : h('p', { class: 'ok-text' }, icon('check', 22), ' Táto správa je v poriadku, nič v nej nie je podozrivé.'));
    }
  } else if (round.type === 'order') {
    const list = reveal
      ? round.items.filter((i) => i.tier != null).sort((a, b) => a.tier - b.tier)
      : round.items;
    wrap.append(h('ol', { class: 'present-options' }, list.map((i) => h('li', { class: reveal ? 'is-correct' : '' }, h('span', null, i.text), reveal ? h('span', { class: 'why' }, i.why) : null))));
    if (reveal) wrap.append(h('p', { class: 'muted' }, 'Ďalšie kroky v ponuke do plánu nepatria: ' + round.items.filter((i) => i.tier == null).map((i) => i.text).join(' | ')));
  } else if (round.type === 'reuse') {
    wrap.append(h('p', { class: 'lead' }, round.question));
    wrap.append(h('ul', { class: 'present-options' }, round.options.map((o, i) => h('li', { class: reveal && o.correct ? 'is-correct' : '' },
      h('span', { class: 'letter' }, letters[i]), h('span', null, o.text), reveal ? h('span', { class: 'why' }, o.why) : null))));
  } else if (round.type === 'lab') {
    wrap.append(h('p', { class: 'lead' }, round.hint || ''));
    if (round.profile) wrap.append(h('p', null, Object.entries(round.profile).map(([k, v]) => `${k}: ${v}`).join(' · ')));
    wrap.append(h('p', { class: 'muted' }, reveal ? 'Riešenie nie je jedno. Skúste spoločne v Password Lab vymyslieť ukážkovú frázu a rozobrať výsledok.' : 'Úloha sa rieši v Password Lab.'));
  }
  if (reveal && round.summary) wrap.append(h('p', { class: 'summary' }, icon('bulb', 24), h('span', null, h('strong', null, 'Zhrnutie: '), round.summary)));
  return wrap;
}
