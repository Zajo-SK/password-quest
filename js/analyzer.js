// Vysvetliteľná kontrola ukážkových hesiel. Beží výhradne v prehliadači.
// Nič sa neodosiela, neukladá ani nezapisuje do konzoly. Nepredstiera presný čas prelomenia
// a výsledok nikdy neoznačuje za záruku bezpečnosti. Texty nálezov sú v slovníkoch (kľúče „an.*“).

import { t } from './i18n.js';
import { COMMON } from './wordlists.js';

const KEYBOARD_ROWS = ['qwertyuiop', 'qwertzuiop', 'asdfghjkl', 'zxcvbnm', 'yxcvbnm', '1234567890', '1qaz2wsx', 'qazwsx'];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' };

export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function deleet(s) {
  return s.replace(/[0134578@$!]/g, (c) => LEET[c] || c);
}

function longestRun(s, step) {
  // najdlhší úsek znakov, kde je každý nasledujúci kód o `step` väčší (alebo menší)
  let best = 1;
  let cur = 1;
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i) - s.charCodeAt(i - 1) === step) { cur += 1; best = Math.max(best, cur); } else cur = 1;
  }
  return best;
}

function keyboardRun(n) {
  let best = 0;
  for (const row of KEYBOARD_ROWS) {
    const rev = [...row].reverse().join('');
    for (const r of [row, rev]) {
      for (let len = 4; len <= Math.min(n.length, r.length); len++) {
        for (let i = 0; i + len <= r.length; i++) {
          if (n.includes(r.slice(i, i + len))) best = Math.max(best, len);
        }
      }
    }
  }
  return best;
}

// Nález: id určuje aj kľúče textov („an.<id>“ a „an.<id>.d“), ak nie je zadaný iný kľúč.
function f(id, level, key = 'an.' + id, vars = {}) {
  return { id, level, title: t(key, vars), detail: t(key + '.d', vars) };
}

function verdict(key, step) {
  return { key, step, label: t('an.v.' + key), text: t('an.v.' + key + '.d') };
}

export function analyze(pw, profileTerms = []) {
  const findings = [];
  const len = [...pw].length;
  if (!pw) return { length: 0, findings: [], verdict: verdict('empty', 0), tips: [] };

  const n = normalize(pw);
  const stripped = n.replace(/[^a-z0-9]/g, '');

  // Dĺžka
  if (len < 8) findings.push(f('length', 'problem', 'an.len.vshort', { n: len }));
  else if (len < 12) findings.push(f('length', 'warn', 'an.len.short', { n: len }));
  else if (len < 16) findings.push(f('length', 'ok', 'an.len.good', { n: len }));
  else findings.push(f('length', 'ok', 'an.len.long', { n: len }));

  // Bežné heslá a slová (aj s jednoduchou zámenou znakov, napr. p@ssw0rd)
  const core = n.replace(/[^a-z0-9@$!]/g, '').replace(/[0-9!@$]+$/g, '');
  const coreLeet = deleet(n).replace(/[^a-z]/g, '');
  if (COMMON.has(n) || COMMON.has(stripped) || COMMON.has(core) || COMMON.has(coreLeet)) {
    findings.push(f('common', 'problem'));
  } else if ([...COMMON].some((w) => w.length >= 4 && (stripped.includes(w) || coreLeet.includes(w)))) {
    findings.push(f('common-part', 'warn'));
  }

  // Postupnosti (abc, 123, 987)
  const run = Math.max(longestRun(stripped, 1), longestRun(stripped, -1));
  if (run >= 4 || (run === 3 && run / Math.max(stripped.length, 1) > 0.4)) {
    findings.push(f('sequence', run >= 4 ? 'problem' : 'warn'));
  }
  // Rady klávesnice
  if (keyboardRun(n) >= 4) findings.push(f('keyboard', 'problem'));

  // Opakovanie
  if (/(.)\1{2,}/.test(n)) findings.push(f('repeat-char', 'warn'));
  if (/(.{2,})\1/.test(n)) findings.push(f('repeat-block', 'warn'));
  if (len >= 8 && new Set([...n]).size / len < 0.4) {
    findings.push(f('low-variety', new Set([...n]).size / len < 0.25 ? 'problem' : 'warn'));
  }

  // Slovo + rok, slovo + čísla (+ symbol)
  if (/[a-z]{3,}(19|20)\d{2}[^a-z0-9]?$/.test(n) || /^(19|20)\d{2}[a-z]{3,}/.test(n)) {
    findings.push(f('word-year', 'warn'));
  } else if (/^[a-z]{3,}\d{1,6}[^a-z0-9]{0,2}$/.test(n)) {
    findings.push(f('word-digits', 'warn'));
  }

  // Osobné údaje z lokálneho testovacieho profilu
  if (profileTerms.map(normalize).some((term) => term.length >= 3 && n.includes(term))) {
    findings.push(f('personal', 'problem'));
  }

  // Fráza z viacerých slov
  const segs = pw.split(/[-_ .]+/).filter((s) => s.length >= 3);
  if (segs.length >= 3 && len >= 14) {
    const allCommon = segs.every((s) => COMMON.has(normalize(s).replace(/[0-9]+$/, '')));
    findings.push(allCommon ? f('phrase-common', 'warn') : f('phrase', 'ok'));
  }

  // Rozmanitosť znakov – iba informatívne
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  findings.push(f('variety', 'info', 'an.variety', { n: classes }));

  // Verdikt
  const problems = findings.filter((x) => x.level === 'problem').length;
  const warns = findings.filter((x) => x.level === 'warn').length;
  let v;
  if (problems >= 2 || findings.some((x) => x.id === 'common')) v = verdict('very-weak', 1);
  else if (problems >= 1) v = verdict('weak', 2);
  else if (warns >= 1 || len < 12) v = verdict('improve', 3);
  else v = verdict('passed', 4);

  const tips = [];
  if (problems || warns || len < 14) {
    tips.push(t('an.tip.phrase'));
    tips.push(t('an.tip.len'));
  }
  if (findings.some((x) => ['word-year', 'word-digits', 'common', 'common-part'].includes(x.id))) tips.push(t('an.tip.suffix'));
  if (findings.some((x) => x.id === 'personal')) tips.push(t('an.tip.personal'));
  tips.push(t('an.tip.unique'));

  return { length: len, findings, verdict: v, tips };
}

// Kontrola cieľov pre úlohy typu „lab“ (len na základe vyhodnotenia analyzátora).
export function checkGoal(result, goal, pw) {
  const unmet = [];
  if (!pw) return { ok: false, unmet: [{ id: 'empty', text: t('lab.enter_first') }] };
  if (goal.minLen && result.length < goal.minLen) unmet.push({ id: 'len', text: t('lab.unmet_len', { n: goal.minLen, len: result.length }) });
  if (goal.noIssues) {
    for (const x of result.findings) {
      if ((x.level === 'problem' || x.level === 'warn') && x.id !== 'length') unmet.push({ id: x.id, text: x.title + '.' });
    }
  }
  return { ok: unmet.length === 0, unmet };
}
