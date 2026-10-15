// Dielňa hesiel: žiak si postaví heslo z troch náhodných slov a hneď vidí, aké je silné.
// Pravidlá: žiadne ukladanie (localStorage/sessionStorage/cookies), žiadne sieťové volania,
// žiadne logovanie. Obsah poľa sa maže pri opustení obrazovky.

import { h, clear, randomInt, append } from './util.js';
import { icon, bot } from './icons.js';
import { t, getLang } from './i18n.js';
import { CARDS, COMMON } from './wordlists.js';

/* ---------- Kontrola hesla (bez DOM) ---------- */

export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Slová v hesle: oddeľujú ich medzery, pomlčky, čísla a znaky, alebo veľké písmeno po malom (SlonDazdnik).
export function splitWords(pw) {
  return pw.split(/[^\p{L}]+/u)
    .flatMap((part) => part.split(/(?<=\p{Ll})(?=\p{Lu})/u))
    .filter((w) => w.length >= 2);
}

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' };
const deleet = (s) => s.replace(/[0134578@$!]/g, (c) => LEET[c] || c);
const KEYBOARD = ['qwertyuiop', 'qwertzuiop', 'asdfghjkl', 'yxcvbnm', 'zxcvbnm'];
const DIGIT_RUNS = ['0123456789', '9876543210'];

function hasRun(n, rows, size) {
  return rows.some((row) => {
    for (let i = 0; i + size <= row.length; i++) if (n.includes(row.slice(i, i + size))) return true;
    return false;
  });
}

// Vráti { length, words, step 0–4, checks: [{id, ok, text}], tips }.
// step: 0 prázdne, 1 slabé, 2 dá sa zlepšiť, 3 silné, 4 výborné.
export function checkPassword(pw, profileTerms = []) {
  const length = [...pw].length;
  const words = splitWords(pw);
  if (!pw) return { length: 0, words, step: 0, checks: [], tips: [] };

  const n = normalize(pw);
  const wholeCommon = COMMON.has(n) || COMMON.has(n.replace(/[^a-z0-9]/g, '')) || COMMON.has(deleet(n).replace(/[^a-z]/g, ''));
  const commonWord = words.find((w) => COMMON.has(normalize(w)));
  // Rady klávesnice a trikrát to isté písmeno hľadáme len vo vnútri slova (HillLion nie je chyba).
  const pattern = /(19|20)\d{2}/.test(n) || hasRun(n, DIGIT_RUNS, 3) || /(\d)\1\1/.test(n)
    || words.some((w) => { const x = normalize(w); return hasRun(x, KEYBOARD, 4) || /(.)\1\1/.test(x); });
  const terms = profileTerms.map((x) => normalize(String(x).trim())).filter((x) => x.length >= 3);

  const checks = [
    { id: 'three', ok: words.length >= 3, text: t('ws.check.three', { n: words.length }) },
    { id: 'common', ok: !wholeCommon && !commonWord, text: commonWord ? t('ws.check.common_word', { word: commonWord }) : t('ws.check.common') },
    { id: 'pattern', ok: !pattern, text: t('ws.check.pattern') },
  ];
  if (terms.length) checks.push({ id: 'personal', ok: !terms.some((x) => n.includes(x)), text: t('ws.check.personal') });

  const failed = checks.filter((c) => !c.ok).length;
  const allOk = failed === 0;
  let step;
  if (length < 8 || wholeCommon || failed >= 2) step = 1;
  else if (!allOk || length < 12) step = 2;
  else if (words.length >= 4 || length >= 20) step = 4;
  else step = 3;

  const tips = [];
  if (words.length < 3) tips.push(t('ws.tip.more_words'));
  if (allOk && length < 12) tips.push(t('ws.tip.longer'));
  return { length, words, step, checks, tips };
}

/* ---------- Kartičky ---------- */

// Slovo z kartičky v tvare do hesla: bez diakritiky, s veľkým začiatočným písmenom.
export const cardWord = (word) => {
  const plain = word.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return plain.charAt(0).toUpperCase() + plain.slice(1);
};

// Vytiahne `count` rôznych kartičiek (kryptograficky bezpečná náhoda), voliteľne okrem zadaných.
export function drawCards(count = 3, lang = getLang(), exclude = []) {
  const pool = (CARDS[lang] || CARDS.sk).filter((c) => !exclude.includes(c[1]));
  const picked = [];
  while (picked.length < count && pool.length) picked.push(pool.splice(randomInt(pool.length), 1)[0]);
  return picked;
}

// Heslo z kartičiek má mať aspoň MIN_LEN písmen, aby bolo „Silné“ (krátke slová ako Lev či Fox by nestačili).
const MIN_LEN = 12;
const cardsLength = (cards) => cards.reduce((sum, [, w]) => sum + w.length, 0);

export function drawCardSet(lang = getLang()) {
  let cards;
  do { cards = drawCards(3, lang); } while (cardsLength(cards) < MIN_LEN);
  return cards;
}

// Vymení jednu kartičku za inú tak, aby heslo zostalo dosť dlhé.
function swapCard(cards, i) {
  const others = cards.filter((_, j) => j !== i);
  let next;
  do { [next] = drawCards(1, getLang(), cards.map((c) => c[1])); } while (cardsLength([...others, next]) < MIN_LEN);
  return cards.map((c, j) => (j === i ? next : c));
}

/* ---------- Komponent dielne ---------- */

const STEP_MOOD = ['happy', 'oops', 'think', 'cheer', 'cheer'];

// opts: { profile: {štítok: hodnota} (vymyslený profil), autofill: bool, onResult(result, value) }
export function createWorkshop(opts = {}) {
  const profileTerms = Object.values(opts.profile || {});
  const inputId = 'ws-in-' + Math.random().toString(36).slice(2, 8);
  let cards = drawCardSet();

  const input = h('input', {
    id: inputId, type: 'text', class: 'lab-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
    spellcheck: 'false', placeholder: t('ws.placeholder'), maxlength: '60', 'data-lpignore': 'true', 'data-1p-ignore': 'true',
  });
  const toggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': 'false' }, icon('eye-off', 20), ' ', t('ws.hide'));
  const clearBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, icon('trash', 20), ' ', t('ws.clear'));

  const cardRow = h('div', { class: 'ws-cards', role: 'group', 'aria-label': t('ws.cards_aria') });
  const useBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => { fillFromCards(); input.focus(); } }, icon('forward', 20), ' ', t('ws.use_cards'));
  const drawBtn = h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => { cards = drawCardSet(); drawCards_(); fillFromCards(); } }, icon('dice', 20), ' ', t('ws.draw'));

  const wordsBox = h('div', { class: 'ws-words', 'aria-live': 'polite' });
  const botBox = h('div', { class: 'ws-bot', 'aria-hidden': 'true' });
  const verdict = h('p', { class: 'ws-verdict' });
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(() => h('span', { class: 'meter-seg' })));
  const checkList = h('ul', { class: 'ws-checks' });
  const tipsBox = h('ul', { class: 'ws-tips' });
  const result = h('div', { class: 'ws-result' },
    h('div', { class: 'ws-score' }, botBox, h('div', { class: 'ws-score-text' }, verdict, meter)),
    checkList, tipsBox);

  function drawCards_() {
    clear(cardRow);
    cards.forEach(([emoji, word], i) => {
      cardRow.append(h('button', {
        type: 'button', class: 'ws-card', 'aria-label': t('ws.swap_aria', { word }),
        onclick: () => { cards = swapCard(cards, i); drawCards_(); if (input.value) fillFromCards(); },
      }, h('span', { class: 'ws-emoji', 'aria-hidden': 'true' }, emoji), h('span', { class: 'ws-word' }, word), h('span', { class: 'ws-swap' }, icon('repeat', 16), ' ', t('ws.swap'))));
    });
  }

  function fillFromCards() {
    input.value = cards.map(([, w]) => cardWord(w)).join('');
    refresh();
  }

  function refresh() {
    const value = input.value;
    const r = checkPassword(value, profileTerms);
    clear(wordsBox);
    if (r.words.length) {
      append(wordsBox, h('span', { class: 'small muted' }, t('ws.found_words')),
        r.words.map((w, i) => h('span', { class: 'ws-chip ws-c' + (i % 4) }, w)));
    }
    clear(botBox);
    botBox.append(bot(STEP_MOOD[r.step], 72));
    clear(verdict);
    verdict.append(h('strong', null, t('ws.step.' + r.step)), ' ', h('span', { class: 'muted' }, t('ws.step.' + r.step + '.d')));
    meter.dataset.step = String(r.step);
    [...meter.children].forEach((seg, i) => seg.classList.toggle('on', i < r.step));
    clear(checkList);
    r.checks.forEach((c) => checkList.append(h('li', { class: c.ok ? 'ok' : 'bad' }, icon(c.ok ? 'check' : 'x', 22), h('span', null, c.text))));
    clear(tipsBox);
    r.tips.forEach((tip) => tipsBox.append(h('li', null, icon('bulb', 20), h('span', null, tip))));
    result.dataset.empty = value ? 'false' : 'true';
    checkList.hidden = !value;
    if (opts.onResult) opts.onResult(r, value);
  }

  input.addEventListener('input', refresh);
  toggle.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', hidden ? 'false' : 'true');
    clear(toggle);
    toggle.append(icon(hidden ? 'eye-off' : 'eye', 20), ' ', hidden ? t('ws.hide') : t('ws.show'));
  });
  clearBtn.addEventListener('click', () => { input.value = ''; refresh(); input.focus(); });

  const profileEl = opts.profile ? h('div', { class: 'lab-profile card-inner' }, h('strong', null, t('ws.profile')),
    Object.entries(opts.profile).map(([k, v]) => h('span', { class: 'chip' }, `${k}: ${v}`))) : null;

  const el = h('div', { class: 'ws' },
    h('p', { class: 'banner banner-warn' }, icon('warning', 22), h('span', null, h('strong', null, t('ws.warn_strong')), t('ws.warn_text'))),
    profileEl,
    h('section', { class: 'ws-step' },
      h('h3', { class: 'ws-h' }, h('span', { class: 'ws-num' }, '1'), t('ws.step1')),
      cardRow,
      h('div', { class: 'row-gap' }, drawBtn, opts.autofill ? null : useBtn)),
    h('section', { class: 'ws-step' },
      h('h3', { class: 'ws-h' }, h('label', { for: inputId }, h('span', { class: 'ws-num' }, '2'), t('ws.step2'))),
      h('div', { class: 'lab-input-row' }, input, toggle, clearBtn),
      wordsBox),
    h('section', { class: 'ws-step' },
      h('h3', { class: 'ws-h' }, h('span', { class: 'ws-num' }, '3'), t('ws.step3')),
      result,
      h('p', { class: 'ws-remember' }, icon('info', 20), h('span', null, t('ws.unrelated')))));

  drawCards_();
  if (opts.autofill) fillFromCards(); else refresh();

  return {
    el,
    getValue: () => input.value,
    getResult: () => checkPassword(input.value, profileTerms),
    lock: () => { input.disabled = true; drawBtn.disabled = true; useBtn.disabled = true; [...cardRow.children].forEach((b) => { b.disabled = true; }); },
    focus: () => input.focus(),
    destroy: () => { input.value = ''; },
  };
}

// Samostatná obrazovka Dielne hesiel. Vráti funkciu na upratanie (zmaže zadané texty).
export function renderLabPage(root) {
  const ws = createWorkshop({ autofill: true });
  append(root,
    h('section', { class: 'page-head' },
      h('h1', null, icon('key', 36), ' ', t('nav.lab')),
      h('p', { class: 'lead' }, t('ws.lead'))),
    h('div', { class: 'card' }, ws.el),
    h('div', { class: 'two-col' },
      h('section', { class: 'card' },
        h('h2', null, t('ws.why')),
        h('ul', { class: 'bullets' }, [1, 2, 3].map((n) => h('li', null, t('ws.why' + n))))),
      h('section', { class: 'card' },
        h('h2', null, t('ws.limits')),
        h('ul', { class: 'bullets' }, [1, 2, 3].map((n) => h('li', null, t('ws.limit' + n)))))),
  );
  return () => { ws.destroy(); };
}
