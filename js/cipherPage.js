// Podstránka Šifrovacia abeceda: zašifruj a rozšifruj text rôznymi abecedami a rozlúšti tajné správy.
// Nič sa neukladá ani neodosiela. Náhodná abeceda žije len v pamäti, kým je stránka otvorená.

import { h, clear, append, embedded, randomInt } from './util.js';
import { icon, bot } from './icons.js';
import { t, getLang } from './i18n.js';
import { encode, decode, same, plain, randomAlphabet } from './cipher.js';
import { cipherTable } from './engine.js';

// Tajné správy na lúštenie. Texty sú bez diakritiky, abeceda šifruje iba písmená A – Z.
const PUZZLES = {
  sk: [
    { alphabet: 'bot', text: 'DLHE HESLO' },
    { alphabet: 'caesar1', text: 'TRI NAHODNE SLOVA' },
    { alphabet: 'leet', text: 'HESLO NIKOMU NEPOVIEM' },
    { alphabet: 'caesar3', text: 'ZAPNI DVOJITE OVERENIE' },
    { alphabet: 'rot13', text: 'KAZDY UCET MA INE HESLO' },
  ],
  en: [
    { alphabet: 'bot', text: 'LONG PASSWORD' },
    { alphabet: 'caesar1', text: 'THREE RANDOM WORDS' },
    { alphabet: 'leet', text: 'NEVER SHARE YOUR PASSWORD' },
    { alphabet: 'caesar3', text: 'TURN ON TWO STEP LOGIN' },
    { alphabet: 'rot13', text: 'EVERY ACCOUNT NEEDS ITS OWN PASSWORD' },
  ],
  // 中文：拼音（暗码只处理字母 A – Z）。
  zh: [
    { alphabet: 'bot', text: 'CHANG MIMA' },
    { alphabet: 'caesar1', text: 'SAN GE SUIJI CI' },
    { alphabet: 'leet', text: 'MIMA BU GAOSU BIEREN' },
    { alphabet: 'caesar3', text: 'KAIQI SHUANGCHONG YANZHENG' },
    { alphabet: 'rot13', text: 'MEI GE ZHANGHU YONG BUTONG MIMA' },
  ],
};

const KINDS = ['bot', 'caesar', 'leet', 'random'];

function alphaName(id) {
  if (id === 'bot' || id === 'leet' || id === 'random') return t('cp.alpha.' + id);
  if (id === 'rot13') return t('cp.alpha.rot13');
  return t('cp.alpha.caesar_n', { n: Number(id.replace('caesar', '')) });
}

export function renderCipherPage(root) {
  let kind = 'bot';
  let shift = 3;
  let random = randomAlphabet();
  const current = () => (kind === 'caesar' ? 'caesar' + shift : kind === 'random' ? random : kind);

  /* --- Výber abecedy a tabuľka --- */
  const about = h('p', { class: 'muted' });
  const tableBox = h('div', { class: 'printable cipher-print' });
  const extra = h('div', { class: 'row-gap' });
  const pills = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': t('cp.choose') }, KINDS.map((k) => {
    const input = h('input', { type: 'radio', name: 'cp-kind', value: k, class: 'pill-input', checked: k === kind, onchange: () => { kind = k; drawAlphabet(); refreshTool(); } });
    return h('label', { class: 'pill' }, input, h('span', { class: 'pill-text' }, t('cp.alpha.' + k)));
  }));

  const shiftSel = h('select', { id: 'cp-shift', class: 'select', onchange: (e) => { shift = Number(e.target.value); drawAlphabet(); refreshTool(); } },
    Array.from({ length: 25 }, (_, i) => i + 1).map((n) => h('option', { value: n, selected: n === shift }, String(n))));
  const newBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => { random = randomAlphabet(); drawAlphabet(); refreshTool(); } }, icon('dice', 20), ' ', t('cp.new_random'));
  const printBtn = embedded() ? null : h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => {
    document.body.classList.add('print-mode');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'), { once: true });
    window.print();
  } }, icon('print', 20), ' ', t('cp.print'));

  function drawAlphabet() {
    about.textContent = t('cp.about.' + kind);
    clear(extra);
    if (kind === 'caesar') append(extra, h('label', { for: 'cp-shift' }, t('cp.shift')), shiftSel);
    if (kind === 'random') append(extra, newBtn);
    append(extra, printBtn);
    clear(tableBox);
    append(tableBox, h('h3', null, kind === 'random' ? t('cp.alpha.random') : alphaName(current())), cipherTable(current()));
  }

  /* --- Zašifruj a rozšifruj --- */
  const plainIn = h('input', { id: 'cp-plain', type: 'text', class: 'text-input', autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', maxlength: '60', value: t('cp.sample') });
  const codedOut = h('output', { class: 'cipher-word', for: 'cp-plain', 'aria-live': 'polite' });
  const codedIn = h('input', { id: 'cp-coded', type: 'text', class: 'text-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', maxlength: '120' });
  const plainOut = h('output', { class: 'cipher-word', for: 'cp-coded', 'aria-live': 'polite' });
  function refreshTool() {
    codedOut.textContent = encode(plainIn.value, current());
    plainOut.textContent = codedIn.value ? decode(codedIn.value, current()) : '';
  }
  plainIn.addEventListener('input', refreshTool);
  codedIn.addEventListener('input', refreshTool);
  const useBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { codedIn.value = codedOut.textContent; refreshTool(); codedIn.focus(); } }, icon('forward', 20), ' ', t('cp.use_result'));

  /* --- Tajná správa --- */
  const puzzles = PUZZLES[getLang()] || PUZZLES.sk;
  let pi = randomInt(puzzles.length);
  const pzTitle = h('p', { class: 'small muted' });
  const pzWord = h('div', { class: 'cipher-word cipher-message' });
  const pzTable = h('details', { class: 'cipher-box' }, h('summary', null, t('cipher.table_title')));
  const pzInput = h('input', { id: 'cp-puzzle', type: 'text', class: 'text-input', autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', maxlength: '80' });
  const pzOut = h('p', { role: 'status' });
  const pzCheck = h('button', { type: 'button', class: 'btn btn-primary', onclick: checkPuzzle }, icon('check', 20), ' ', t('btn.check'));
  pzInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPuzzle(); });
  const pzShow = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { pzOut.className = 'muted'; pzOut.textContent = t('cp.puzzle_solution', { answer: puzzles[pi].text }); } }, icon('eye', 20), ' ', t('cp.puzzle_show'));
  const pzNext = h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => { pi = (pi + 1) % puzzles.length; drawPuzzle(); pzInput.focus(); } }, icon('repeat', 20), ' ', t('cp.puzzle_next'));

  function drawPuzzle() {
    const p = puzzles[pi];
    pzTitle.textContent = t('cp.puzzle_alpha', { name: alphaName(p.alphabet), n: pi + 1, total: puzzles.length });
    pzWord.textContent = encode(p.text, p.alphabet);
    while (pzTable.childNodes.length > 1) pzTable.lastChild.remove();
    pzTable.append(cipherTable(p.alphabet));
    pzInput.value = '';
    pzOut.textContent = '';
    pzOut.className = '';
  }
  function checkPuzzle() {
    const p = puzzles[pi];
    if (!pzInput.value.trim()) { pzOut.className = 'muted'; pzOut.textContent = t('cipher.need_answer'); return; }
    const ok = same(pzInput.value, p.text);
    pzOut.className = ok ? 'ok-text' : 'bad-text';
    clear(pzOut);
    pzOut.append(icon(ok ? 'check' : 'bulb', 22), ' ', ok ? t('cp.puzzle_ok', { answer: plain(p.text) }) : t('cp.puzzle_bad'));
  }

  append(root,
    h('section', { class: 'page-head' },
      h('h1', null, icon('lock', 36), ' ', t('cp.title')),
      h('p', { class: 'lead' }, t('cp.lead'))),
    h('div', { class: 'card' },
      h('h2', null, t('cp.choose')),
      pills, about, extra, tableBox),
    h('div', { class: 'card' },
      h('h2', null, t('cp.tool_title')),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'cp-plain' }, t('cp.plain_label')), plainIn, h('span', { class: 'small muted' }, t('cp.result')), codedOut, useBtn),
        h('div', { class: 'field' }, h('label', { for: 'cp-coded' }, t('cp.coded_label')), codedIn, h('span', { class: 'small muted' }, t('cp.result')), plainOut))),
    h('div', { class: 'card cipher-puzzle' },
      h('div', { class: 'row-gap' }, bot('think', 72), h('div', null, h('h2', null, t('cp.puzzle_title')), h('p', { class: 'muted' }, t('cp.puzzle_text')))),
      pzTitle, pzWord, pzTable,
      h('div', { class: 'field' }, h('label', { for: 'cp-puzzle' }, t('cipher.your_answer')), h('div', { class: 'row-gap' }, pzInput, pzCheck)),
      pzOut,
      h('div', { class: 'row-gap' }, pzShow, pzNext)),
    h('div', { class: 'card' },
      h('h2', null, icon('key', 26), ' ', t('cp.pw_title')),
      h('ul', { class: 'bullets' }, [1, 2, 3, 4].map((n) => h('li', null, t('cp.pw' + n)))),
      h('a', { class: 'btn btn-primary', href: '#/lab' }, icon('key', 20), ' ', t('cp.to_lab'))),
    h('div', { class: 'card' },
      h('h2', null, icon('shield-check', 26), ' ', t('cp.real_title')),
      h('ul', { class: 'bullets' }, [1, 2, 3].map((n) => h('li', null, t('cp.real' + n))))),
  );

  drawAlphabet();
  refreshTool();
  drawPuzzle();
  return () => { plainIn.value = ''; codedIn.value = ''; pzInput.value = ''; random = null; };
}
