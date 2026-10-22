// Engine úloh: vykresľuje jednotlivé typy úloh, vyhodnocuje odpovede, počíta body a odznaky.
// Obsah úloh je v js/content/<jazyk>/. Engine pozná len typy úloh, nie konkrétne otázky.

import { h, clear, rich, shuffle, announce, pct, embedded } from './util.js';
import { icon, bot } from './icons.js';
import * as store from './store.js';
import { t } from './i18n.js';
import { getTask, getLevel, badge, topicLabel } from './content/index.js';
import { createWorkshop } from './lab.js';
import { watchTerms, glossaryBox } from './glossary.js';
import { mockParts } from './content/helpers.js';
import { LETTERS, alphabet, encode, plain, same } from './cipher.js';
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
    el = h('div', { class: 'mock mock-email', role: 'group', 'aria-label': t('mock.email_aria') },
      h('div', { class: 'mock-head' },
        h('div', null, h('span', { class: 'k' }, t('mock.from')), part(mock.from)),
        h('div', null, h('span', { class: 'k' }, t('mock.subject')), h('strong', null, part(mock.subject)))),
      h('div', { class: 'mock-body' }, mock.paragraphs.map((para) => h('p', null,
        para.map(part),
        para.filter((p) => typeof p !== 'string' && p.link).map((p) => h('span', { class: 'link-dest' }, icon('link', 18), t('mock.link_dest'), h('code', null, p.url)))))),
      mock.attachment ? h('div', { class: 'mock-attach' }, icon('clip', 20), h('span', null, t('mock.attachment')), h('code', null, mock.attachment)) : null);
  } else if (mock.kind === 'sms') {
    el = h('div', { class: 'mock mock-sms', role: 'group', 'aria-label': t('mock.sms_aria') },
      h('div', { class: 'k' }, t('mock.from') + mock.from), h('div', { class: 'bubble' }, mock.text));
  } else if (mock.kind === 'push') {
    el = h('div', { class: 'mock mock-push', role: 'group', 'aria-label': t('mock.push_aria') },
      mock.steps ? h('ol', { class: 'steps' }, mock.steps.map((s) => h('li', { class: s.done ? 'done' : '' }, s.label + (s.done ? t('mock.step_done') : t('mock.step_wait'))))) : null,
      h('strong', null, mock.title),
      h('ul', null, mock.lines.map((l) => h('li', null, l))),
      h('div', { class: 'fake-btns', 'aria-hidden': 'true' }, mock.buttons.map((b) => h('span', { class: 'fake-btn' }, b))),
      h('p', { class: 'muted small' }, t('mock.push_note')));
  } else if (mock.kind === 'chat') {
    el = h('div', { class: 'mock mock-chat', role: 'group', 'aria-label': t('mock.chat_aria') },
      mock.title ? h('div', { class: 'chat-title' }, icon('users', 18), ' ', mock.title) : null,
      h('ol', { class: 'chat-list' }, mock.messages.map((m) => h('li', { class: 'chat-msg' + (m.me ? ' me' : '') },
        h('span', { class: 'chat-who' }, m.who),
        h('div', { class: 'chat-bubble' }, m.parts.map(part),
          m.parts.filter((p) => typeof p !== 'string' && p.link).map((p) => h('span', { class: 'link-dest' }, icon('link', 18), t('mock.link_dest'), h('code', null, p.url))))))));
  } else if (mock.kind === 'page') {
    el = h('div', { class: 'mock mock-page', role: 'group', 'aria-label': t('mock.page_aria') },
      h('div', { class: 'page-bar' }, icon(mock.secure === false ? 'unlock' : 'lock', 18), h('span', { class: 'sr-only' }, t('mock.address')), h('span', { class: 'page-url' }, part(mock.url))),
      h('div', { class: 'page-body' },
        mock.title ? h('strong', { class: 'page-title' }, part(mock.title)) : null,
        (mock.paragraphs || []).map((para) => h('p', null, para.map(part))),
        mock.fields ? h('div', { class: 'page-fields', 'aria-hidden': 'true' }, mock.fields.map((f) => h('span', { class: 'page-field' }, f))) : null,
        mock.button ? h('span', { class: 'fake-btn page-btn', 'aria-hidden': 'true' }, mock.button) : null),
      h('p', { class: 'muted small' }, t('mock.page_note')));
  } else if (mock.kind === 'timeline') {
    el = h('div', { class: 'mock mock-timeline', role: 'group', 'aria-label': mock.title },
      h('strong', null, mock.title),
      h('ol', null, mock.events.map((e) => h('li', null, h('time', null, e.time), h('span', null, e.text)))),
      h('strong', { class: 'sub' }, t('mock.more_info')),
      h('ul', null, mock.facts.map((x) => h('li', null, x))));
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
  const list = h('div', { class: 'options' + (withIcons ? ' options-icons' : ''), role: 'group', 'aria-label': t('answer.options_aria') }, btns);

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
      : [{ ok: false, text: t('explain.your_choice', { text: o.text, why: o.why }) }, { ok: true, text: t('explain.correct_is', { text: good.text, why: good.why }) }];
    ctx.submit({ correct: !!o.correct, explain });
  }
  return { el: list };
}

function renderMulti(round, ctx) {
  const opts = round.options;
  const sel = new Set();
  const check = checkButton(t('btn.check'), evaluate);
  check.disabled = true;
  const btns = opts.map((o, i) => {
    const b = h('button', { type: 'button', class: 'option option-toggle', 'aria-pressed': 'false', onclick: () => {
      if (sel.has(i)) sel.delete(i); else sel.add(i);
      b.setAttribute('aria-pressed', String(sel.has(i)));
      b.classList.toggle('selected', sel.has(i));
      check.disabled = sel.size === 0;
    } }, h('span', { class: 'option-text' }, o.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' }));
    return b;
  });

  function evaluate() {
    const explain = [];
    let correct = true;
    btns.forEach((b, i) => {
      b.disabled = true;
      const o = opts[i];
      const picked = sel.has(i);
      if (picked && o.correct) { b.classList.add('is-correct'); mark(b, 'check'); explain.push({ ok: true, text: t('explain.picked_ok', { text: o.text, why: o.why }) }); }
      else if (picked && !o.correct) { b.classList.add('is-wrong'); mark(b, 'x'); correct = false; explain.push({ ok: false, text: t('explain.picked_wrong', { text: o.text, why: o.why }) }); }
      else if (!picked && o.correct) { b.classList.add('is-missed'); mark(b, 'flag'); correct = false; explain.push({ ok: false, text: t('explain.missed', { text: o.text, why: o.why }) }); }
    });
    check.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, h('div', { class: 'options', role: 'group', 'aria-label': t('answer.multi_aria') }, btns), h('div', { class: 'actions' }, check)) };
}

function renderRows(round, ctx) {
  const rowsEls = [];
  const answers = round.rows.map(() => null);
  const check = checkButton(t('btn.check'), evaluate);
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
        p.querySelector('input').disabled = true;
        if (r.choices[pi].id === good.id) p.classList.add('is-correct');
        if (r.choices[pi].id === given && !ok) p.classList.add('is-wrong');
      });
      clear(r.status);
      r.status.append(icon(ok ? 'check' : 'x', 22));
      r.fs.classList.add(ok ? 'row-ok' : 'row-bad');
      if (own) {
        const chosen = r.choices.find((c) => c.id === given);
        explain.push(ok
          ? { ok: true, text: t('explain.row_ok', { row: r.row.text, why: good.why }) }
          : { ok: false, text: t('explain.row_own_wrong', { row: r.row.text, chosen: chosen.label, why: chosen.why, good: good.label, goodWhy: good.why }) });
      } else {
        explain.push({ ok, text: t(ok ? 'explain.cat_ok' : 'explain.cat_wrong', { row: r.row.text, cat: good.label, why: r.row.why }) });
      }
    });
    check.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, rowsEls.map((r) => r.fs), h('div', { class: 'actions' }, check)) };
}

function renderHotspot(round, ctx) {
  const check = checkButton(t('btn.check_marked'), () => evaluate(false));
  const legit = h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => evaluate(true) }, icon('shield-check', 22), ' ', t('btn.message_ok'));
  const hint = h('p', { class: 'muted', role: 'status' });
  const { el, picks } = renderMock(round.mock, { interactive: true, onChange: () => { hint.textContent = ''; } });

  function evaluate(claimsOk) {
    const flagged = picks.filter((p) => p.part.flag);
    const marked = picks.filter((p) => p.selected);
    if (!claimsOk && marked.length === 0) {
      hint.textContent = t('hotspot.need_mark');
      return;
    }
    const correct = claimsOk
      ? flagged.length === 0
      : flagged.every((p) => p.selected) && marked.every((p) => p.part.flag);
    const explain = [];
    picks.forEach((p) => {
      p.locked = true;
      p.btn.disabled = true;
      const vars = { text: p.part.text, why: p.part.why };
      if (p.part.flag && p.selected) { p.btn.classList.add('is-correct'); explain.push({ ok: true, text: t('explain.picked_ok', vars) }); }
      else if (p.part.flag && !p.selected) { p.btn.classList.add('is-missed'); explain.push({ ok: false, text: t('explain.overlooked', vars) }); }
      else if (!p.part.flag && p.selected) { p.btn.classList.add('is-wrong'); explain.push({ ok: false, text: t('explain.not_suspicious', vars) }); }
    });
    if (claimsOk && flagged.length === 0) explain.unshift({ ok: true, text: t('hotspot.legit_ok') });
    if (claimsOk && flagged.length > 0) explain.unshift({ ok: false, text: t('hotspot.legit_wrong') });
    if (!claimsOk && flagged.length === 0) explain.unshift({ ok: false, text: t('hotspot.was_legit') });
    check.hidden = true;
    legit.hidden = true;
    ctx.submit({ correct, explain });
  }
  return { el: h('div', null, el, hint, h('div', { class: 'actions' }, check, legit)) };
}

function renderOrder(round, ctx) {
  const items = round.items.map((it, i) => ({ ...it, i }));
  const plan = [];
  const available = h('div', { class: 'options', role: 'group', 'aria-label': t('order.available') });
  const planList = h('ol', { class: 'plan-list', 'aria-label': t('order.plan') });
  const empty = h('p', { class: 'muted plan-empty' }, t('order.empty'));
  const check = checkButton(t('btn.check_plan'), evaluate);
  let locked = false;
  const btnFor = new Map();

  items.forEach((it) => {
    btnFor.set(it.i, h('button', { type: 'button', class: 'option', onclick: () => add(it) }, h('span', { class: 'option-text' }, it.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' })));
  });
  shuffle(items).forEach((it) => available.append(btnFor.get(it.i)));

  function redraw() {
    clear(planList);
    plan.forEach((it, n) => {
      planList.append(h('li', null, h('button', { type: 'button', class: 'plan-item', 'aria-label': t('order.item_aria', { n: n + 1, text: it.text }), onclick: () => remove(it) }, it.text)));
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
    const explain = [{ ok: correct, text: correct ? t('order.ok') : t('order.fix') }];
    sorted.forEach((it, n) => explain.push({ ok: true, text: `${n + 1}. ${it.text} ${it.why}` }));
    plan.filter((p) => p.tier == null).forEach((p) => explain.push({ ok: false, text: t('order.not_in_plan', { text: p.text, why: p.why }) }));
    items.filter((it) => it.tier == null && !plan.includes(it)).forEach((it) => explain.push({ ok: null, text: t('order.left_out', { text: it.text, why: it.why }) }));
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
  return { el: h('div', null, h('h3', { class: 'lab-sub' }, t('order.available')), available, h('h3', { class: 'lab-sub' }, t('order.plan')), empty, planList, h('div', { class: 'actions' }, check)) };
}

function renderReuse(round, ctx) {
  let predicted = null;
  const status = {};
  const cards = {};
  round.accounts.forEach((a) => {
    status[a.id] = h('span', { class: 'acc-status' });
    cards[a.id] = h('div', { class: 'acc', dataset: { id: a.id } },
      icon(a.icon, 32), h('div', { class: 'acc-info' }, h('strong', null, a.name), h('span', { class: 'acc-pw' }, t('reuse.pw'), h('code', null, '••••••••'))), status[a.id]);
  });
  const accWrap = h('div', { class: 'accs', hidden: true }, round.accounts.map((a) => cards[a.id]));
  const out = h('div', { class: 'reuse-out', 'aria-live': 'polite' });

  const setStatus = (id, text, cls) => {
    status[id].textContent = text;
    cards[id].className = 'acc ' + (cls || '');
  };

  const optBtns = round.options.map((o) => h('button', { type: 'button', class: 'option', onclick: () => predict(o) }, h('span', { class: 'option-text' }, o.text), h('span', { class: 'option-mark', 'aria-hidden': 'true' })));
  const optList = h('div', { class: 'options', role: 'group', 'aria-label': t('answer.options_aria') }, shuffle(optBtns));

  function predict(o) {
    predicted = o;
    optBtns.forEach((b) => { b.disabled = true; });
    const i = round.options.indexOf(o);
    optBtns[i].classList.add(o.correct ? 'is-correct' : 'is-wrong', 'chosen');
    mark(optBtns[i], o.correct ? 'check' : 'x');
    if (!o.correct) { const gi = round.options.findIndex((x) => x.correct); optBtns[gi].classList.add('is-correct'); mark(optBtns[gi], 'check'); }
    clear(out);
    out.append(h('p', { class: o.correct ? 'ok-text' : 'bad-text' }, icon(o.correct ? 'check' : 'bulb', 22), ' ', o.correct ? t('reuse.predict_ok') : t('reuse.predict_wrong')));
    accWrap.hidden = false;
    round.accounts.forEach((a) => setStatus(a.id, t('reuse.same'), ''));
    out.append(
      h('p', null, t('reuse.intro', { sample: round.sample })),
      h('button', { type: 'button', class: 'btn btn-danger btn-lg', onclick: leak1 }, icon('warning', 22), ' ', t('reuse.leak')));
  }

  function leak1(e) {
    e.currentTarget.disabled = true;
    round.accounts.forEach((a) => {
      if (a.id === round.leakFrom) setStatus(a.id, t('reuse.leaked'), 'leaked');
      else setStatus(a.id, t('reuse.at_risk'), 'at-risk');
    });
    out.append(
      h('p', { class: 'bad-text' }, icon('warning', 22), ' ', t('reuse.leak_text')),
      h('p', null, t('reuse.try_unique')));
    const unique = new Set();
    const sim2 = h('button', { type: 'button', class: 'btn btn-danger btn-lg', disabled: true, onclick: leak2 }, icon('warning', 22), ' ', t('reuse.leak_again'));
    const setBtns = round.accounts.map((a) => {
      const b = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => {
        unique.add(a.id);
        b.disabled = true;
        b.textContent = t('reuse.set_done', { name: a.name });
        setStatus(a.id, t('reuse.unique'), 'unique');
        sim2.disabled = unique.size < round.accounts.length;
      } }, t('reuse.set', { name: a.name }));
      return b;
    });
    out.append(h('div', { class: 'row-gap' }, setBtns), sim2);
  }

  function leak2(e) {
    e.currentTarget.disabled = true;
    round.accounts.forEach((a) => {
      if (a.id === round.leakFrom) setStatus(a.id, t('reuse.leaked_only'), 'leaked');
      else setStatus(a.id, t('reuse.safe'), 'safe');
    });
    out.append(h('p', { class: 'ok-text' }, icon('check', 22), ' ', t('reuse.safe_text')));
    ctx.submit({ correct: !!predicted.correct, explain: [{ ok: !!predicted.correct, text: predicted.why }, { ok: true, text: t('reuse.explain') }] });
  }

  return { el: h('div', null, h('p', { class: 'lead' }, round.question), optList, accWrap, out) };
}

function renderLab(round, ctx) {
  const note = h('p', { class: 'muted', role: 'status' });
  const ws = createWorkshop({ profile: round.profile });
  ctx.onCleanup(() => ws.destroy());
  const check = checkButton(t('btn.check_task'), evaluate);

  function evaluate() {
    if (!ws.getValue()) { note.textContent = t('lab.enter_first'); return; }
    const r = ws.getResult();
    const ok = r.step >= 3;
    check.hidden = true;
    ws.lock();
    const explain = ok
      ? [{ ok: true, text: t('lab.goal_ok') }]
      : [{ ok: false, text: t('lab.goal_todo') }, ...r.checks.filter((c) => !c.ok).map((c) => ({ ok: false, text: c.text })), ...r.tips.map((tip) => ({ ok: null, text: tip }))];
    ctx.submit({ correct: ok, explain });
  }
  return { el: h('div', null, round.hint ? h('p', { class: 'hint' }, icon('bulb', 22), ' ', round.hint) : null, ws.el, note, h('div', { class: 'actions' }, check)) };
}

// Odosielateľ v zozname schránky: zobrazené meno, ak ho adresa má („Meno <adresa>“), inak adresa.
const senderName = (from) => (from.match(/^(.+?)\s*</) || [null, from])[1];

function renderInbox(round, ctx) {
  const emails = round.emails;
  const answers = emails.map(() => null);
  let current = 0;
  let locked = false;
  const list = h('div', { class: 'inbox-list', role: 'group', 'aria-label': t('inbox.list_aria') });
  const view = h('div', { class: 'inbox-view', 'aria-live': 'polite' });
  const status = h('p', { class: 'muted small' });
  const check = checkButton(t('btn.check'), evaluate);
  check.disabled = true;
  const verdictLabel = (a) => (a === 'scam' ? t('inbox.scam') : a === 'ok' ? t('inbox.ok') : t('inbox.unread'));

  function drawList() {
    clear(list);
    emails.forEach((e, i) => {
      const cls = ['inbox-item', i === current ? 'active' : '', answers[i] ? 'answered' : '',
        locked ? (answers[i] === (e.scam ? 'scam' : 'ok') ? 'is-correct' : 'is-wrong') : ''].filter(Boolean).join(' ');
      list.append(h('button', { type: 'button', class: cls, 'aria-current': i === current ? 'true' : null, onclick: () => { current = i; draw(); } },
        h('span', { class: 'inbox-from' }, senderName(e.from)),
        h('span', { class: 'inbox-subject' }, e.subject),
        h('span', { class: 'inbox-tag tag-' + (answers[i] || 'none') }, answers[i] === 'scam' ? icon('warning', 16) : answers[i] === 'ok' ? icon('check', 16) : null, ' ', verdictLabel(answers[i]))));
    });
  }

  function drawView() {
    clear(view);
    const e = emails[current];
    const choose = (a) => {
      if (locked) return;
      answers[current] = a;
      const next = answers.findIndex((x, i) => x == null && i !== current);
      if (next >= 0) current = next;
      check.disabled = answers.some((x) => x == null);
      draw();
    };
    const pick = (a, cls, ic, label) => h('button', { type: 'button', class: `btn ${cls}`, 'aria-pressed': String(answers[current] === a), disabled: locked, onclick: () => choose(a) }, icon(ic, 20), ' ', label);
    view.append(
      h('p', { class: 'small muted' }, t('inbox.position', { n: current + 1, total: emails.length })),
      renderMock({ kind: 'email', from: e.from, subject: e.subject, paragraphs: e.paragraphs, attachment: e.attachment }).el,
      locked
        ? h('p', { class: e.scam ? 'bad-text' : 'ok-text' }, icon(e.scam ? 'warning' : 'check', 22), ' ', h('span', null, h('strong', null, verdictLabel(e.scam ? 'scam' : 'ok') + ': '), e.why))
        : h('div', { class: 'inbox-actions' },
          pick('ok', 'btn-secondary', 'check', t('inbox.mark_ok')),
          pick('scam', 'btn-danger', 'warning', t('inbox.mark_scam'))));
  }

  function draw() {
    drawList();
    drawView();
    const done = answers.filter(Boolean).length;
    status.textContent = locked ? '' : t('inbox.progress', { n: done, total: emails.length });
  }

  function evaluate() {
    locked = true;
    let correct = true;
    const explain = emails.map((e, i) => {
      const ok = answers[i] === (e.scam ? 'scam' : 'ok');
      if (!ok) correct = false;
      return { ok, text: t(ok ? 'inbox.explain_ok' : 'inbox.explain_wrong', { subject: e.subject, verdict: t(e.scam ? 'inbox.is_scam' : 'inbox.is_ok'), why: e.why }) };
    });
    check.hidden = true;
    draw();
    ctx.submit({ correct, explain });
  }

  draw();
  return { el: h('div', null, h('div', { class: 'inbox' }, list, view), status, h('div', { class: 'actions' }, check)) };
}

// Tabuľka šifrovacej abecedy: písmeno a jeho tajný znak. Pri neúplnej abecede (známa zámena) len zamieňané písmená.
export function cipherTable(id) {
  const map = alphabet(id);
  const full = LETTERS.split('').every((l) => map[l] != null);
  const keys = full ? [...LETTERS] : Object.keys(map);
  return h('div', null,
    h('div', { class: 'cipher-table', role: 'list', 'aria-label': t('cipher.table_title') },
      keys.map((l) => h('div', { class: 'cipher-cell', role: 'listitem' }, h('span', { class: 'cipher-plain' }, l), h('span', { class: 'cipher-code' }, map[l])))),
    full ? null : h('p', { class: 'muted small' }, t('cipher.rest_same')));
}

function renderCipher(round, ctx) {
  const decode = round.mode !== 'encode';
  const shown = decode ? encode(round.text, round.alphabet) : plain(round.text);
  const answer = decode ? plain(round.text) : encode(round.text, round.alphabet);
  const note = h('p', { class: 'muted', role: 'status' });
  let done = false;

  function finish(given) {
    if (done) return;
    done = true;
    const ok = same(given, answer);
    const vars = { shown, answer, given };
    const explain = [{ ok, text: t(`cipher.${ok ? 'right' : 'wrong'}_${decode ? 'decode' : 'encode'}`, vars) }];
    if (round.why) explain.push({ ok: null, text: round.why });
    ctx.submit({ correct: ok, explain });
    return ok;
  }

  let answerEl;
  if (round.choices) {
    const opts = shuffle(round.choices);
    const btns = opts.map((o) => {
      const label = decode ? plain(o) : encode(o, round.alphabet);
      const b = h('button', { type: 'button', class: 'option option-cipher', onclick: () => {
        btns.forEach((x, i) => {
          x.disabled = true;
          if (same(opts[i], round.text)) { x.classList.add('is-correct'); mark(x, 'check'); }
        });
        if (!same(o, round.text)) { b.classList.add('is-wrong'); mark(b, 'x'); }
        finish(label);
      } }, h('span', { class: 'option-text' }, label), h('span', { class: 'option-mark', 'aria-hidden': 'true' }));
      return b;
    });
    answerEl = h('div', { class: 'options options-cipher', role: 'group', 'aria-label': t('answer.options_aria') }, btns);
  } else {
    const id = `cipher-${round.id}`;
    const input = h('input', { id, type: 'text', class: 'text-input cipher-input', autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', maxlength: '40' });
    const check = checkButton(t('btn.check'), () => {
      if (!input.value.trim()) { note.textContent = t('cipher.need_answer'); return; }
      input.disabled = true;
      check.hidden = true;
      input.classList.add(finish(input.value) ? 'is-correct' : 'is-wrong');
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check.click(); });
    answerEl = h('div', { class: 'field' }, h('label', { for: id }, t('cipher.your_answer')), h('div', { class: 'row-gap' }, input, check));
  }

  return { el: h('div', { class: 'cipher-round' },
    h('p', { class: 'cipher-label' }, t(decode ? 'cipher.decode_label' : 'cipher.encode_label')),
    h('div', { class: 'cipher-word' }, shown),
    round.table === 'none' ? null : h('details', { class: 'cipher-box', open: true }, h('summary', null, t('cipher.table_title')), cipherTable(round.alphabet)),
    round.hint ? h('p', { class: 'hint' }, icon('bulb', 22), ' ', round.hint) : null,
    answerEl, note) };
}

const RENDERERS = {
  cipher: renderCipher,
  choice: renderChoice,
  multi: renderMulti,
  rows: renderRows,
  hotspot: renderHotspot,
  order: renderOrder,
  reuse: renderReuse,
  lab: renderLab,
  inbox: renderInbox,
};

/* ---------- Spúšťač misie ---------- */

export function mountTask(root, taskId) {
  const task = getTask(taskId);
  if (!task) {
    root.append(h('div', { class: 'card' }, h('h1', null, t('task.not_found')), h('a', { class: 'btn btn-primary', href: '#/levels' }, t('levels.back'))));
    return () => {};
  }
  const level = getLevel(task.level);
  let run = null;
  let cleanups = [];
  const shell = h('div', { class: 'task-shell', dataset: { level: String(getLevel(task.level).n) } });
  root.append(shell);

  const runCleanup = () => { cleanups.forEach((fn) => { try { fn(); } catch (e) { /* ignoruj */ } }); cleanups = []; };

  function header(showProgress) {
    const total = run ? run.queue.length : 0;
    const head = h('header', { class: 'task-head' },
      h('a', { class: 'btn btn-ghost', href: `#/level/${level.id}` }, icon('back', 22), ' ', t('summary.back')),
      h('div', { class: 'task-title' }, icon(task.icon, 28), h('span', null, task.title)));
    if (showProgress && run) {
      head.append(h('div', { class: 'progress', role: 'progressbar', 'aria-label': t('task.progress_bar'), 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(run.pos) },
        h('span', { class: 'progress-fill', style: `width:${pct(run.pos, total)}%` })));
    }
    return head;
  }

  function focusHeading(sel) {
    const el = shell.querySelector(sel);
    if (el) el.focus({ preventScroll: false });
  }

  function showIntro() {
    runCleanup();
    clear(shell);
    const st = store.getState();
    const saved = store.getTask(taskId);
    const resume = st.resume && st.resume.taskId === taskId && st.resume.queue.every((i) => i < task.rounds.length) ? st.resume : null;
    const unmastered = task.rounds.map((_, i) => i).filter((i) => !saved.mastered[i]);
    const actions = h('div', { class: 'actions' });
    const btn = (cls, ic, label, fn) => h('button', { type: 'button', class: `btn ${cls} btn-lg`, onclick: fn }, ic ? icon(ic, 22) : null, ic ? ' ' : null, label);
    if (resume) {
      actions.append(
        btn('btn-primary', 'play', t('task.continue', { n: Math.min(resume.pos + 1, resume.queue.length), total: resume.queue.length }), () => { run = resume; showRound(); }),
        btn('btn-secondary', 'repeat', t('task.restart'), () => startRun('all')));
    } else if (saved.done) {
      actions.append(btn('btn-primary', 'repeat', t('task.replay_all'), () => startRun('all')));
    } else if (unmastered.length > 0 && unmastered.length < task.rounds.length) {
      actions.append(
        btn('btn-primary', 'repeat', t('task.retry_n', { n: unmastered.length }), () => startRun('unmastered')),
        btn('btn-secondary', null, t('task.play_all'), () => startRun('all')));
    } else {
      actions.append(btn('btn-primary', 'play', t('task.start'), () => startRun('all')));
    }
    const b = task.badge ? badge(task.badge) : null;
    shell.append(header(false), h('section', { class: 'card intro-card' },
      bot('happy', 120),
      h('div', { class: 'intro-body' },
        h('p', { class: 'eyebrow' }, t('task.intro_eyebrow', { id: level.n, name: level.name, n: task.order })),
        h('h1', { id: 'task-h1', tabindex: '-1' }, task.title),
        task.intro.map((p) => h('p', { class: 'lead' }, rich(p))),
        h('div', { class: 'chips' },
          h('span', { class: 'chip' }, icon('list', 18), ' ', t('task.n_tasks', { n: task.rounds.length })),
          h('span', { class: 'chip' }, icon('book', 18), ' ', topicLabel(task.topic)),
          b ? h('span', { class: 'chip chip-badge' }, icon(b.icon, 18), ' ', t('task.badge', { name: b.name })) : null),
        h('p', { class: 'muted' }, t('task.no_penalty')),
        glossaryBox(task, 'gl.mission'),
        actions)));
    cleanups.push(watchTerms(shell.querySelector('.intro-body')));
    focusHeading('#task-h1');
  }

  function startRun(mode) {
    const saved = store.getTask(taskId);
    const idxs = task.rounds.map((_, i) => i).filter((i) => mode === 'all' || !saved.mastered[i]);
    run = { taskId, mode, phase: 'main', queue: idxs, mainCount: idxs.length, pos: 0, wrong: [], firstTry: {}, streak: 0, earned: 0 };
    store.setResume(run);
    showRound();
  }

  function showRound() {
    runCleanup();
    clear(shell);
    const idx = run.queue[run.pos];
    const round = task.rounds[idx];
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
        h('span', { class: 'chip' }, t('round.counter', { retry: run.phase === 'retry', n: run.pos + 1, total: run.queue.length })),
        h('span', { class: 'chip' }, topicLabel(round.topic))),
      round.scenario ? h('p', { class: 'scenario' }, icon('info', 22), ' ', round.scenario) : null,
      h('h1', { id: 'round-title', class: 'round-prompt', tabindex: '-1' }, round.prompt),
      round.mock && round.type !== 'hotspot' ? renderMock(round.mock).el : null,
      rendered.el,
      glossaryBox(round, 'gl.round'),
      feedback);
    shell.append(header(true), card);
    // Neznáme slová (doména, phishing…) sa dajú ťuknúť; vysvetlenie sa označí aj vo vysvetleniach po odpovedi.
    cleanups.push(watchTerms(card));
    focusHeading('#round-title');
    window.scrollTo({ top: 0 });
  }

  function handleResult(round, idx, res, feedback) {
    let gained = 0;
    let streakBonus = 0;
    const mastered = { ...store.getTask(taskId).mastered };
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
    const nextLabel = last ? (willRepeat ? t('btn.retry_wrong') : t('btn.finish')) : t('btn.next');
    const nextBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => next() }, nextLabel, ' ', icon('forward', 22));

    clear(feedback);
    feedback.append(h('div', { class: 'fb ' + (res.correct ? 'fb-ok' : 'fb-bad'), role: 'status' },
      bot(res.correct ? 'cheer' : 'oops', 84),
      h('div', { class: 'fb-body' },
        h('h2', { class: 'fb-title' }, icon(res.correct ? 'check' : 'bulb', 28), ' ', res.correct ? t('fb.correct') : retry ? t('fb.retry_solution') : t('fb.not_yet')),
        h('div', { class: 'chips' },
          gained > 0 ? h('span', { class: 'chip chip-xp' }, icon('star', 18), ' ', t('fb.xp', { n: gained })) : null,
          streakBonus > 0 ? h('span', { class: 'chip chip-xp' }, icon('trophy', 18), ' ', t('fb.streak', { n: streakBonus })) : null,
          res.correct && gained === 0 ? h('span', { class: 'chip' }, t('fb.already')) : null),
        h('ul', { class: 'explain' }, res.explain.map((e) => h('li', { class: e.ok === true ? 'ok' : e.ok === false ? 'bad' : '' },
          icon(e.ok === true ? 'check' : e.ok === false ? 'x' : 'info', 20), h('span', null, rich(e.text))))),
        round.summary ? h('p', { class: 'summary' }, icon('bulb', 22), h('span', null, h('strong', null, t('fb.remember')), round.summary)) : null,
        !res.correct && !retry ? h('p', { class: 'muted' }, t('fb.will_repeat')) : null,
        h('div', { class: 'actions' }, nextBtn))));
    announce(res.correct ? t('fb.announce_ok') : t('fb.announce_bad'));
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
    run.phase = 'retry';
    run.queue = [...run.wrong];
    run.wrong = [];
    run.pos = 0;
    store.setResume(run);
    shell.append(header(false), h('section', { class: 'card intro-card' },
      bot('think', 120),
      h('div', { class: 'intro-body' },
        h('h1', { id: 'inter-h1', tabindex: '-1' }, t('inter.title')),
        h('p', { class: 'lead' }, t('inter.text', { n: run.queue.length })),
        h('p', { class: 'muted' }, t('inter.xp')),
        h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => showRound() }, icon('repeat', 22), ' ', t('inter.go'))))));
    focusHeading('#inter-h1');
  }

  function finish() {
    const saved = store.getTask(taskId);
    const allMastered = task.rounds.every((_, i) => saved.mastered[i]);
    const newBadges = [];
    let levelDone = false;
    store.setTask(taskId, { plays: (saved.plays || 0) + 1, done: allMastered });
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
    const saved = store.getTask(taskId);
    const left = task.rounds.map((_, i) => i).filter((i) => !saved.mastered[i]);
    const firstOk = Object.values(run.firstTry).filter(Boolean).length;
    const nextTask = level.tasks[task.order];
    const planLines = allMastered && task.planTitle
      ? task.rounds.flatMap((r) => (r.type === 'rows' && r.rows.every((x) => x.options) ? r.rows.map((x) => x.plan) : []))
      : [];

    shell.append(header(false), h('section', { class: 'card summary-card' },
      bot(allMastered ? 'cheer' : 'think', 120),
      h('div', { class: 'intro-body' },
        h('h1', { id: 'sum-h1', tabindex: '-1' }, allMastered ? t('sum.done') : t('sum.almost')),
        h('p', { class: 'lead' }, allMastered ? t('sum.done_lead') : t('sum.left', { n: left.length })),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('strong', null, t('fb.xp', { n: run.earned })), h('span', null, t('sum.xp_label'))),
          h('div', { class: 'stat' }, h('strong', null, `${firstOk} / ${run.mainCount}`), h('span', null, t('stat.first_try'))),
          h('div', { class: 'stat' }, h('strong', null, `${task.rounds.length - left.length} / ${task.rounds.length}`), h('span', null, t('sum.mastered_label')))),
        newBadges.map((id) => {
          const b = badge(id);
          return h('div', { class: 'badge-card new', role: 'status' }, icon(b.icon, 40), h('div', null, h('strong', null, t('sum.new_badge', { name: b.name })), h('span', null, b.desc)));
        }),
        levelDone ? h('p', { class: 'ok-text' }, icon('trophy', 22), ' ', t('sum.level_done', { name: level.name })) : null,
        h('div', { class: 'actions' },
          left.length ? h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => startRun('unmastered') }, icon('repeat', 22), ' ', t('btn.retry_wrong')) : null,
          levelDone ? h('a', { class: 'btn btn-primary btn-lg', href: `#/level/${level.id}/summary` }, icon('trophy', 22), ' ', t('final.title')) : null,
          allMastered && nextTask ? h('a', { class: 'btn btn-primary btn-lg', href: `#/task/${nextTask.id}` }, t('sum.next_mission'), ' ', icon('forward', 22)) : null,
          h('button', { type: 'button', class: 'btn btn-secondary btn-lg', onclick: () => startRun('all') }, icon('repeat', 22), ' ', t('sum.replay')),
          h('a', { class: 'btn btn-ghost btn-lg', href: `#/level/${level.id}` }, t('summary.back'))))));
    if (planLines.length) {
      const printBtn = embedded() ? null : h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => {
        document.body.classList.add('print-mode');
        window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'), { once: true });
        window.print();
      } }, icon('print', 22), ' ', t('plan.print'));
      shell.append(h('section', { class: 'card printable' }, h('h2', null, task.planTitle), h('ol', { class: 'plan-final' }, planLines.map((l) => h('li', null, l))), printBtn));
    }
    focusHeading('#sum-h1');
    window.scrollTo({ top: 0 });
  }

  showIntro();
  return () => { runCleanup(); };
}

/* ---------- Režim pre premietanie (učiteľ) ---------- */

export function renderPresentation(round, reveal) {
  const wrap = h('div', { class: 'present-body' });
  const letters = 'ABCDEFGH';
  if (round.scenario) wrap.append(h('p', { class: 'scenario' }, icon('info', 28), ' ', round.scenario));
  if (round.mock && round.type !== 'hotspot') wrap.append(renderMock(round.mock).el);

  if (round.type === 'choice' || round.type === 'multi' || round.type === 'reuse') {
    if (round.type === 'reuse') wrap.append(h('p', { class: 'lead' }, round.question));
    wrap.append(h('ul', { class: 'present-options' }, round.options.map((o, i) => h('li', { class: reveal && o.correct ? 'is-correct' : '' },
      h('span', { class: 'letter' }, letters[i]), h('span', null, o.text),
      reveal ? h('span', { class: 'why' }, (o.correct ? '✓ ' : '✗ ') + o.why) : null))));
  } else if (round.type === 'rows') {
    wrap.append(h('ul', { class: 'present-options' }, round.rows.map((r) => {
      const own = !!r.options;
      const good = own ? r.options.find((o) => o.correct).text : round.categories.find((c) => c.id === r.answer).label;
      let extra = null;
      if (reveal) extra = h('span', { class: 'why' }, '→ ' + good + (own ? '' : '. ' + r.why));
      else if (own) extra = h('span', { class: 'why' }, r.options.map((o) => o.text).join(' / '));
      return h('li', { class: reveal ? 'is-correct' : '' }, h('span', null, r.text), extra);
    })));
    if (round.categories) wrap.append(h('p', { class: 'muted' }, t('present.categories') + round.categories.map((c) => c.label).join(' · ')));
  } else if (round.type === 'hotspot') {
    wrap.append(renderMock(round.mock, { reveal }).el);
    if (reveal) {
      const items = [];
      mockParts(round.mock).forEach((p) => { if (p.pick && p.flag) items.push(p); });
      wrap.append(items.length
        ? h('ul', { class: 'explain' }, items.map((p) => h('li', { class: 'ok' }, icon('flag', 20), h('span', null, t('explain.picked_ok', { text: p.text, why: p.why })))))
        : h('p', { class: 'ok-text' }, icon('check', 22), ' ', t('present.legit')));
    }
  } else if (round.type === 'order') {
    const list = reveal ? round.items.filter((i) => i.tier != null).sort((a, b) => a.tier - b.tier) : round.items;
    wrap.append(h('ol', { class: 'present-options' }, list.map((i) => h('li', { class: reveal ? 'is-correct' : '' }, h('span', null, i.text), reveal ? h('span', { class: 'why' }, i.why) : null))));
    if (reveal) wrap.append(h('p', { class: 'muted' }, t('present.not_in_plan') + round.items.filter((i) => i.tier == null).map((i) => i.text).join(' | ')));
  } else if (round.type === 'inbox') {
    round.emails.forEach((e, i) => {
      wrap.append(h('p', { class: 'eyebrow' }, t('inbox.position', { n: i + 1, total: round.emails.length })),
        renderMock({ kind: 'email', from: e.from, subject: e.subject, paragraphs: e.paragraphs, attachment: e.attachment }).el);
      if (reveal) wrap.append(h('p', { class: e.scam ? 'bad-text' : 'ok-text' }, icon(e.scam ? 'warning' : 'check', 22), ' ', h('span', null, h('strong', null, (e.scam ? t('inbox.scam') : t('inbox.ok')) + ': '), e.why)));
    });
  } else if (round.type === 'cipher') {
    const decode = round.mode !== 'encode';
    wrap.append(h('div', { class: 'cipher-word' }, decode ? encode(round.text, round.alphabet) : plain(round.text)));
    if (round.table !== 'none') wrap.append(cipherTable(round.alphabet));
    if (reveal) wrap.append(h('p', { class: 'ok-text' }, icon('check', 22), ' ', decode ? plain(round.text) : encode(round.text, round.alphabet)));
  } else if (round.type === 'lab') {
    wrap.append(h('p', { class: 'lead' }, round.hint || ''));
    if (round.profile) wrap.append(h('p', null, Object.entries(round.profile).map(([k, v]) => `${k}: ${v}`).join(' · ')));
    wrap.append(h('p', { class: 'muted' }, reveal ? t('present.lab_reveal') : t('present.lab')));
  }
  if (reveal && round.summary) wrap.append(h('p', { class: 'summary' }, icon('bulb', 24), h('span', null, h('strong', null, t('present.summary')), round.summary)));
  return wrap;
}
