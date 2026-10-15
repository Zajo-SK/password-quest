// Password Lab: lokálne laboratórium na vymyslené ukážkové heslá.
// Pravidlá: žiadne ukladanie (localStorage/sessionStorage/cookies), žiadne sieťové volania,
// žiadne logovanie. Obsah poľa sa maže pri opustení obrazovky.

import { h, clear, randomInt, append } from './util.js';
import { icon } from './icons.js';
import { analyze } from './analyzer.js';
import { t, getLang } from './i18n.js';
import { WORDS } from './wordlists.js';

export function generatePhrase(count = 4, lang = getLang()) {
  const list = WORDS[lang] || WORDS.sk;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const w = list[randomInt(list.length)];
    parts.push(w[0].toUpperCase() + w.slice(1));
  }
  parts.push(String(10 + randomInt(90)));
  return parts.join('-');
}

const LEVEL_ICON = { problem: 'x', warn: 'warning', ok: 'check', info: 'info' };
const PROFILE_FIELDS = ['pet', 'hobby', 'city', 'year'];

// opts: { profile: {štítok: hodnota} (pevný vymyslený profil), editableProfile: bool, onResult(result, value) }
export function createLab(opts = {}) {
  const profileValues = { ...(opts.profile || {}) };
  const inputId = 'lab-in-' + Math.random().toString(36).slice(2, 8);

  const input = h('input', {
    id: inputId, type: 'text', class: 'lab-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
    spellcheck: 'false', 'aria-describedby': 'lab-warn-' + inputId, placeholder: t('lab.placeholder'),
    maxlength: '80', 'data-lpignore': 'true', 'data-1p-ignore': 'true',
  });
  const toggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': 'false' }, icon('eye-off', 20), ' ', t('lab.hide'));
  const clearBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, icon('trash', 20), ' ', t('lab.clear'));

  const lenText = h('span', { class: 'lab-len-text' });
  const lenBar = h('span', { class: 'lab-len-bar', 'aria-hidden': 'true' }, h('span', { class: 'lab-len-fill' }));
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(() => h('span', { class: 'meter-seg' })));
  const verdictBox = h('div', { class: 'lab-verdict', 'aria-live': 'polite' });
  const findingsBox = h('ul', { class: 'lab-findings' });
  const tipsBox = h('ul', { class: 'lab-tips' });
  const goalBox = h('div', { class: 'lab-goal', hidden: true });
  const resultBox = h('div', { class: 'lab-result' }, meter, verdictBox, findingsBox, h('h3', { class: 'lab-sub' }, t('lab.improve')), tipsBox);

  let profileEl = null;
  if (opts.profile && !opts.editableProfile) {
    profileEl = h('div', { class: 'lab-profile card-inner' }, h('strong', null, t('lab.profile_fixed')),
      Object.entries(opts.profile).map(([k, v]) => h('span', { class: 'chip' }, `${k}: ${v}`)));
  }
  if (opts.editableProfile) {
    profileEl = h('details', { class: 'lab-profile card-inner' },
      h('summary', null, t('lab.profile_summary')),
      h('p', { class: 'muted' }, t('lab.profile_text')),
      h('div', { class: 'grid-2' }, PROFILE_FIELDS.map((key) => {
        const id = `prof-${key}-${inputId}`;
        const inp = h('input', { id, type: 'text', class: 'text-input', autocomplete: 'off', maxlength: '40', spellcheck: 'false',
          oninput: () => { profileValues[key] = inp.value; refresh(); } });
        return h('div', { class: 'field' }, h('label', { for: id }, t('lab.field.' + key)), inp);
      })));
  }

  const profileTerms = () => Object.values(profileValues).map((v) => String(v || '').trim()).filter(Boolean);

  function refresh() {
    const value = input.value;
    const r = analyze(value, profileTerms());
    lenText.textContent = t('lab.length', { n: r.length });
    lenBar.firstChild.style.width = Math.min(100, (r.length / 20) * 100) + '%';
    meter.dataset.step = String(r.verdict.step);
    [...meter.children].forEach((seg, i) => seg.classList.toggle('on', i < r.verdict.step));
    clear(verdictBox);
    verdictBox.append(h('strong', null, r.verdict.label), ' – ', r.verdict.text);
    verdictBox.dataset.key = r.verdict.key;
    clear(findingsBox);
    for (const x of r.findings) {
      findingsBox.append(h('li', { class: 'finding finding-' + x.level },
        icon(LEVEL_ICON[x.level], 22), h('div', null, h('strong', null, x.title), h('span', { class: 'finding-detail' }, x.detail))));
    }
    clear(tipsBox);
    r.tips.forEach((tip) => tipsBox.append(h('li', null, tip)));
    resultBox.hidden = !value;
    if (opts.onResult) opts.onResult(r, value);
  }

  input.addEventListener('input', refresh);
  toggle.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', hidden ? 'false' : 'true');
    clear(toggle);
    toggle.append(icon(hidden ? 'eye-off' : 'eye', 20), ' ', hidden ? t('lab.hide') : t('lab.show'));
  });
  clearBtn.addEventListener('click', () => { input.value = ''; refresh(); input.focus(); });

  const warn = h('p', { id: 'lab-warn-' + inputId, class: 'banner banner-warn' }, icon('warning', 22),
    h('span', null, h('strong', null, t('lab.warn_strong')), t('lab.warn_text')));

  const el = h('div', { class: 'lab' },
    warn,
    profileEl,
    h('div', { class: 'field' },
      h('label', { for: inputId, class: 'lab-label' }, t('lab.label')),
      h('div', { class: 'lab-input-row' }, input, toggle, clearBtn)),
    h('div', { class: 'lab-len' }, lenText, lenBar),
    goalBox,
    resultBox);

  refresh();

  return {
    el,
    getValue: () => input.value,
    getAnalysis: () => analyze(input.value, profileTerms()),
    setValue: (v) => { input.value = v; refresh(); },
    goalBox,
    focus: () => input.focus(),
    destroy: () => { input.value = ''; Object.keys(profileValues).forEach((k) => delete profileValues[k]); },
  };
}

// Samostatná obrazovka Password Lab. Vráti funkciu na upratanie (zmaže zadané texty).
export function renderLabPage(root) {
  const lab = createLab({ editableProfile: true });
  const phraseOut = h('div', { class: 'gen-out', 'aria-live': 'polite' });
  const countSel = h('select', { id: 'gen-count', class: 'select' }, [3, 4, 5, 6].map((n) => h('option', { value: n, selected: n === 4 }, t('gen.words', { n }))));
  const genBtn = h('button', { type: 'button', class: 'btn btn-secondary', onclick: generate }, icon('dice', 22), ' ', t('gen.btn'));

  function generate() {
    const current = generatePhrase(Number(countSel.value));
    clear(phraseOut);
    phraseOut.append(
      h('span', { class: 'sample-tag' }, t('gen.tag')),
      h('code', { class: 'phrase' }, current),
      h('div', { class: 'row-gap' },
        h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => { lab.setValue(current); lab.focus(); } }, icon('search', 20), ' ', t('gen.check')),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: generate }, icon('repeat', 20), ' ', t('gen.other'))),
    );
  }

  append(root,
    h('section', { class: 'page-head' },
      h('h1', null, icon('search', 36), ' Password Lab'),
      h('p', { class: 'lead' }, t('lab.lead'))),
    h('div', { class: 'card' }, lab.el),
    h('div', { class: 'card' },
      h('h2', null, t('gen.title')),
      h('p', { class: 'muted' }, t('gen.text')),
      h('div', { class: 'row-gap' }, h('label', { for: 'gen-count', class: 'sr-only' }, t('gen.count')), countSel, genBtn),
      phraseOut),
    h('div', { class: 'card' },
      h('h2', null, t('lab.limits')),
      h('ul', { class: 'bullets' },
        h('li', null, t('lab.limit1')),
        h('li', null, t('lab.limit2')),
        h('li', null, t('lab.limit3')))),
  );

  return () => { lab.destroy(); };
}
