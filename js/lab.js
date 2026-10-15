// Password Lab: lokálne laboratórium na fiktívne testovacie reťazce.
// Pravidlá: žiadne ukladanie (localStorage/sessionStorage/cookies), žiadne sieťové volania,
// žiadne logovanie. Obsah poľa sa maže pri opustení obrazovky.

import { h, clear, randomInt, append } from './util.js';
import { icon } from './icons.js';
import { analyze } from './analyzer.js';

// Malý zoznam slov bez diakritiky, len na ukážkové frázy. Nie je určený na skutočné heslá.
const WORDS = ('vlak mrak dazd skala kocka lipa hruska rakety oblak kaktus zajac sneh lod slon lampa zelva kamen luk zebra most ' +
  'pivonka mesiac hviezda kometa planeta ostrov jazero potok luka hora udolie vrch jaskyna vtak sova orol vlk liska jelen srnka ' +
  'medved bobor ryba koral perla muska kniha zosit pero ceruzka mapa kompas majak plachta kotva veslo stan ohnisko svieca ' +
  'zrkadlo okno dvere schody vez hrad brana mincie truhla poklad drak rytier kral sachy puzzle hodiny budik kalendar dazdnik ' +
  'topanky ponozky sal ruksak bicykel kolobezka traktor lietadlo balon padak ponorka zeriav tunel ulica fontana lavicka tulipan ' +
  'javor dub buk smrek borovica huba mach papraden kopec mlyn studna ker trnie').split(' ');

export function generatePhrase(count = 4) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const w = WORDS[randomInt(WORDS.length)];
    parts.push(w[0].toUpperCase() + w.slice(1));
  }
  parts.push(String(10 + randomInt(90)));
  return parts.join('-');
}

const LEVEL_ICON = { problem: 'x', warn: 'warning', ok: 'check', info: 'info' };

// opts: { profile: {štítok: hodnota} (pevný fiktívny profil), editableProfile: bool, goal, onResult(result,value) }
export function createLab(opts = {}) {
  let value = '';
  const profileValues = { ...(opts.profile || {}) };
  const inputId = 'lab-in-' + Math.random().toString(36).slice(2, 8);

  const input = h('input', {
    id: inputId, type: 'text', class: 'lab-input', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
    spellcheck: 'false', 'aria-describedby': 'lab-warn-' + inputId, placeholder: 'Sem napíš vymyslenú ukážku',
    maxlength: '80', 'data-lpignore': 'true', 'data-1p-ignore': 'true',
  });
  const toggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': 'false' }, icon('eye-off', 20), ' Skryť');
  const clearBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm' }, icon('trash', 20), ' Vymazať');

  const lenText = h('span', { class: 'lab-len-text' });
  const lenBar = h('span', { class: 'lab-len-bar', 'aria-hidden': 'true' }, h('span', { class: 'lab-len-fill' }));
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(() => h('span', { class: 'meter-seg' })));
  const verdictBox = h('div', { class: 'lab-verdict', 'aria-live': 'polite' });
  const findingsBox = h('ul', { class: 'lab-findings' });
  const tipsBox = h('ul', { class: 'lab-tips' });
  const goalBox = h('div', { class: 'lab-goal', hidden: !opts.goal });
  const resultBox = h('div', { class: 'lab-result' }, meter, verdictBox, findingsBox, h('h3', { class: 'lab-sub' }, 'Ako to zlepšiť'), tipsBox);

  let profileEl = null;
  if (opts.profile && !opts.editableProfile) {
    profileEl = h('div', { class: 'lab-profile card-inner' }, h('strong', null, 'Fiktívny profil: '),
      Object.entries(opts.profile).map(([k, v]) => h('span', { class: 'chip' }, `${k}: ${v}`)));
  }
  if (opts.editableProfile) {
    const fields = ['Meno zvieratka', 'Záľuba', 'Mesto', 'Rok narodenia'];
    profileEl = h('details', { class: 'lab-profile card-inner' },
      h('summary', null, 'Lokálny testovací profil (vymyslené údaje, nepovinné)'),
      h('p', { class: 'muted' }, 'Ak napíšeš vymyslené údaje, Laboratórium skontroluje, či ich heslo neobsahuje. Údaje zostanú len v tomto okne a po opustení obrazovky sa zmažú.'),
      h('div', { class: 'grid-2' }, fields.map((label) => {
        const id = 'prof-' + label.replace(/\W/g, '') + inputId;
        const inp = h('input', { id, type: 'text', class: 'text-input', autocomplete: 'off', maxlength: '40', spellcheck: 'false',
          oninput: () => { profileValues[label] = inp.value; refresh(); } });
        return h('div', { class: 'field' }, h('label', { for: id }, label), inp);
      })));
  }

  function profileTerms() {
    return Object.values(profileValues).map((v) => String(v || '').trim()).filter(Boolean);
  }

  function refresh() {
    value = input.value;
    const r = analyze(value, profileTerms());
    const len = r.length;
    lenText.textContent = `Dĺžka: ${len} ${len === 1 ? 'znak' : len >= 2 && len <= 4 ? 'znaky' : 'znakov'}`;
    lenBar.firstChild.style.width = Math.min(100, (len / 20) * 100) + '%';
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
    r.tips.forEach((t) => tipsBox.append(h('li', null, t)));
    resultBox.hidden = !value;
    if (opts.onResult) opts.onResult(r, value);
  }

  input.addEventListener('input', refresh);
  toggle.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', hidden ? 'false' : 'true');
    clear(toggle);
    toggle.append(icon(hidden ? 'eye-off' : 'eye', 20), hidden ? ' Skryť' : ' Zobraziť');
  });
  clearBtn.addEventListener('click', () => { input.value = ''; refresh(); input.focus(); });

  const warn = h('p', { id: 'lab-warn-' + inputId, class: 'banner banner-warn' }, icon('warning', 22),
    h('span', null, h('strong', null, 'Nikdy nezadávaj svoje skutočné heslo. '), 'Používaj len vymyslené ukážky. Text sa spracúva iba v tomto prehliadači, neodosiela sa a neukladá.'));

  const el = h('div', { class: 'lab' },
    warn,
    profileEl,
    h('div', { class: 'field' },
      h('label', { for: inputId, class: 'lab-label' }, 'Vymyslený testovací reťazec'),
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
    destroy: () => { input.value = ''; value = ''; Object.keys(profileValues).forEach((k) => delete profileValues[k]); },
  };
}

// Samostatná obrazovka Password Lab. Vráti funkciu na upratanie (zmaže zadané texty).
export function renderLabPage(root) {
  const lab = createLab({ editableProfile: true });
  const phraseOut = h('div', { class: 'gen-out', 'aria-live': 'polite' });
  const countSel = h('select', { id: 'gen-count', class: 'select' }, [3, 4, 5, 6].map((n) => h('option', { value: n, selected: n === 4 }, n + ' slová')));
  let current = '';
  const genBtn = h('button', { type: 'button', class: 'btn btn-secondary', onclick: generate }, icon('dice', 22), ' Vygenerovať ukážkovú frázu');

  function generate() {
    current = generatePhrase(Number(countSel.value));
    clear(phraseOut);
    phraseOut.append(
      h('span', { class: 'sample-tag' }, 'UKÁŽKA – nepoužívaj ako skutočné heslo'),
      h('code', { class: 'phrase' }, current),
      h('div', { class: 'row-gap' },
        h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => { lab.setValue(current); lab.focus(); } }, icon('search', 20), ' Skontrolovať v laboratóriu'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: generate }, icon('repeat', 20), ' Iná ukážka')),
    );
  }

  append(root, 
    h('section', { class: 'page-head' },
      h('h1', null, icon('search', 36), ' Password Lab'),
      h('p', { class: 'lead' }, 'Laboratórium vysvetľuje, prečo je ukážkový reťazec predvídateľný. Nie je to záruka bezpečnosti a neodhaduje čas prelomenia.')),
    h('div', { class: 'card' }, lab.el),
    h('div', { class: 'card' },
      h('h2', null, 'Generátor ukážkovej frázy'),
      h('p', { class: 'muted' }, 'Fráza sa vytvára lokálne pomocou kryptograficky bezpečného generátora náhodných čísel z prehliadača. Používa len malý zoznam slov, preto je to iba ukážka štýlu. Skutočné heslá nechaj vytvoriť školou schválený správca hesiel.'),
      h('div', { class: 'row-gap' }, h('label', { for: 'gen-count', class: 'sr-only' }, 'Počet slov'), countSel, genBtn),
      phraseOut),
    h('div', { class: 'card' },
      h('h2', null, 'Čo laboratórium nevie'),
      h('ul', { class: 'bullets' },
        h('li', null, 'Nevie zistiť, či heslo nebolo zverejnené v úniku dát.'),
        h('li', null, 'Nevie vyhlásiť heslo za zaručene bezpečné. Pomáha ti iba nájsť zjavne predvídateľné vzory.'),
        h('li', null, 'Nevie nahradiť jedinečné heslá pre každý účet a viacfaktorové overovanie.'))),
  );

  return () => { lab.destroy(); };
}
