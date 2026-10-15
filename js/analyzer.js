// Vysvetliteľná kontrola ukážkových hesiel. Beží výhradne v prehliadači.
// Nič sa neodosiela, neukladá ani nezapisuje do konzoly. Nepredstiera presný čas prelomenia
// a výsledok nikdy neoznačuje za záruku bezpečnosti.

const COMMON = new Set((
  '123456 1234567 12345678 123456789 1234567890 000000 111111 121212 123123 654321 987654321 ' +
  'password passw0rd pass admin root login welcome letmein secret qwerty qwertz qwertyuiop asdfgh asdfghjkl zxcvbn zxcvbnm ' +
  'abc123 abcdef abcdefg iloveyou monkey dragon football baseball master shadow sunshine princess superman batman ' +
  'heslo hesla ahoj cau caute lubim macko macka mama tato brat sestra kamarat pes macka psik skola ucitel ucitelka ' +
  'futbal hokej lopta slovensko bratislava kosice nitra zilina presov trnava hra hrac robot bot kluc tajne tajomstvo ' +
  'jahoda banan jablko leto zima jar jesen slnko luna ' +
  'minecraft roblox fortnite youtube tiktok instagram snapchat'
).split(/\s+/).filter(Boolean));

const KEYBOARD_ROWS = ['qwertyuiop', 'qwertzuiop', 'asdfghjkl', 'zxcvbnm', 'yxcvbnm', '1234567890', '1qaz2wsx', 'qazwsx'];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' };

export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function deleet(s) {
  return s.replace(/[0134578@$!]/g, (c) => LEET[c] || c);
}

function longestRun(s, step) {
  // najdlhší úsek znakov, kde každý nasledujúci kód je o `step` väčší (alebo menší)
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

function f(id, level, title, detail) {
  return { id, level, title, detail };
}

export function analyze(pw, profileTerms = []) {
  const findings = [];
  const len = [...pw].length;
  if (!pw) {
    return { length: 0, findings: [], verdict: { key: 'empty', step: 0, label: 'Zatiaľ nič nezadané', text: 'Napíš vymyslený testovací reťazec.' }, tips: [] };
  }

  const n = normalize(pw);
  const stripped = n.replace(/[^a-z0-9]/g, '');
  const letters = n.replace(/[^a-z]/g, '');

  // Dĺžka
  if (len < 8) findings.push(f('length', 'problem', `Veľmi krátke (${len} znakov)`, 'Krátke reťazce sa dajú systematicky skúšať. Dĺžka je jeden z najdôležitejších faktorov.'));
  else if (len < 12) findings.push(f('length', 'warn', `Kratšie (${len} znakov)`, 'Skús aspoň 14 znakov, najlepšie vo forme frázy z viacerých slov.'));
  else if (len < 16) findings.push(f('length', 'ok', `Dobrá dĺžka (${len} znakov)`, 'Dĺžka je dobrý začiatok, ale sama o sebe nestačí.'));
  else findings.push(f('length', 'ok', `Dlhé (${len} znakov)`, 'Dlhé heslá sa ťažšie hádajú, ak nie sú predvídateľné.'));

  // Bežné heslá a slová (aj s jednoduchou zámenou znakov, napr. p@ssw0rd)
  const core = n.replace(/[^a-z0-9@$!]/g, '').replace(/[0-9!@$]+$/g, '');
  const coreLeet = deleet(n).replace(/[^a-z]/g, '');
  if (COMMON.has(n) || COMMON.has(stripped) || COMMON.has(core) || COMMON.has(coreLeet)) {
    findings.push(f('common', 'problem', 'Bežné heslo alebo slovo', 'Takéto reťazce sú medzi prvými, ktoré sa skúšajú. Pridanie čísla alebo zámena znakov nepomáha.'));
  } else {
    const hit = [...COMMON].find((w) => w.length >= 4 && (stripped.includes(w) || coreLeet.includes(w)));
    if (hit) findings.push(f('common-part', 'warn', 'Obsahuje bežné slovo', 'V hesle sa nachádza veľmi bežné slovo. Lepšie je spojiť viac nesúvisiacich slov.'));
  }

  // Postupnosti (abc, 123, 987)
  const up = Math.max(longestRun(stripped, 1), longestRun(stripped, -1));
  if (up >= 4 || (up === 3 && up / Math.max(stripped.length, 1) > 0.4)) {
    findings.push(f('sequence', up >= 4 ? 'problem' : 'warn', 'Postupnosť znakov', 'Znaky idú po rade (napríklad abcd alebo 1234). Takéto postupnosti patria medzi najčastejšie.'));
  }
  // Rady klávesnice
  const kb = keyboardRun(n);
  if (kb >= 4) findings.push(f('keyboard', 'problem', 'Rad klávesnice', 'Znaky vedľa seba na klávesnici (napríklad qwer) sú veľmi bežný vzor.'));

  // Opakovanie
  if (/(.)\1{2,}/.test(n)) findings.push(f('repeat-char', 'warn', 'Opakované znaky', 'Rovnaký znak vo viacerých po sebe idúcich pozíciách je predvídateľný.'));
  if (/(.{2,})\1/.test(n)) findings.push(f('repeat-block', 'warn', 'Opakovaný úsek', 'Časť hesla sa opakuje. Opakovanie dĺžku zdanlivo zväčší, ale predvídateľnosť nezníži.'));
  if (len >= 8 && new Set([...n]).size / len < 0.4) {
    const veryLow = new Set([...n]).size / len < 0.25;
    findings.push(f('low-variety', veryLow ? 'problem' : 'warn', 'Málo rôznych znakov', 'Heslo používa len niekoľko rôznych znakov.'));
  }

  // Slovo + rok, slovo + čísla (+ symbol)
  if (/[a-z]{3,}(19|20)\d{2}[^a-z0-9]?$/.test(n) || /^(19|20)\d{2}[a-z]{3,}/.test(n)) {
    findings.push(f('word-year', 'warn', 'Bežná kombinácia: slovo + rok', 'Slovo s rokom (napríklad futbal2026) je jeden z najčastejších vzorov.'));
  } else if (/^[a-z]{3,}\d{1,6}[^a-z0-9]{0,2}$/.test(n)) {
    findings.push(f('word-digits', 'warn', 'Bežný vzor: slovo + číslice (+ symbol)', 'Slovo, za ním čísla a symbol na konci. Tento vzor ľudia a nástroje dobre poznajú.'));
  }

  // Osobné údaje z lokálneho testovacieho profilu
  const personal = profileTerms.map(normalize).filter((t) => t.length >= 3 && n.includes(t));
  if (personal.length) {
    findings.push(f('personal', 'problem', 'Obsahuje údaj z testovacieho profilu', 'V hesle je údaj, ktorý sa dá o človeku zistiť alebo uhádnuť (meno zvieratka, záľuba, mesto, rok).'));
  }

  // Fráza z viacerých slov
  const segs = pw.split(/[-_ .]+/).filter((s) => s.length >= 3);
  const isPhrase = segs.length >= 3 && len >= 14;
  if (isPhrase) {
    const allCommon = segs.every((s) => COMMON.has(normalize(s).replace(/[0-9]+$/, '')));
    if (allCommon) findings.push(f('phrase-common', 'warn', 'Fráza z veľmi bežných slov', 'Fráza je dobrý nápad, ale slová by nemali byť tie najčastejšie ani spolu súvisieť.'));
    else findings.push(f('phrase', 'ok', 'Fráza z viacerých slov', 'Viac slov dokopy sa pamätá lepšie a háda ťažšie, ak spolu nesúvisia.'));
  }

  // Rozmanitosť znakov – iba informatívne
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  findings.push(f('variety', 'info', `Druhy znakov: ${classes}`, 'Rôzne druhy znakov pomáhajú menej než dĺžka a nepredvídateľnosť. Samotný symbol na konci slabé heslo nezachráni.'));

  // Verdikt
  const problems = findings.filter((x) => x.level === 'problem').length;
  const warns = findings.filter((x) => x.level === 'warn').length;
  let verdict;
  if (problems >= 2 || findings.some((x) => x.id === 'common' && x.level === 'problem')) {
    verdict = { key: 'very-weak', step: 1, label: 'Veľmi predvídateľné', text: 'Takéto heslo sa dá ľahko odhadnúť.' };
  } else if (problems >= 1) {
    verdict = { key: 'weak', step: 2, label: 'Slabé', text: 'Našli sme vážny problém. Pozri vysvetlenia nižšie.' };
  } else if (warns >= 1 || len < 12) {
    verdict = { key: 'improve', step: 3, label: 'Dá sa zlepšiť', text: 'Našli sme predvídateľné prvky alebo krátku dĺžku.' };
  } else {
    verdict = { key: 'passed', step: 4, label: 'Prešlo našimi kontrolami', text: 'Našimi jednoduchými kontrolami prešlo. To však nie je záruka bezpečnosti.' };
  }

  const tips = [];
  if (problems || warns || len < 14) {
    tips.push('Použi frázu zo 4 a viac nesúvisiacich slov, napríklad v štýle „Slovo-Slovo-Slovo-Slovo“.');
    tips.push('Cieľ: aspoň 14 až 16 znakov.');
  }
  if (findings.some((x) => ['word-year', 'word-digits', 'common', 'common-part'].includes(x.id))) tips.push('Nepridávaj len číslo, rok alebo symbol na koniec bežného slova.');
  if (findings.some((x) => x.id === 'personal')) tips.push('Nepoužívaj meno, prezývku, zvieratko, záľubu, mesto ani rok narodenia.');
  tips.push('Pre každý účet použi iné heslo a podľa možností zapni viacfaktorové overovanie.');

  return { length: len, findings, verdict, tips };
}

// Kontrola cieľov pre úlohy typu „lab“ (len na základe vyhodnotenia analyzátora).
export function checkGoal(result, goal, pw) {
  const unmet = [];
  if (!pw) return { ok: false, unmet: ['Najprv zadaj ukážkovú frázu.'] };
  if (goal.minLen && result.length < goal.minLen) unmet.push(`Fráza má mať aspoň ${goal.minLen} znakov (teraz ${result.length}).`);
  if (goal.noIssues) {
    for (const x of result.findings) {
      if ((x.level === 'problem' || x.level === 'warn') && x.id !== 'length') unmet.push(x.title + '.');
    }
  }
  return { ok: unmet.length === 0, unmet };
}
