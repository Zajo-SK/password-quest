// Obrazovky aplikácie (okrem misií, Password Lab a učiteľského režimu).
import { h, clear, rich, append } from './util.js';
import { icon, bot } from './icons.js';
import * as store from './store.js';
import { LEVELS, MODULES, PLANNED_MODULES, TOPICS, BADGES, getLevel, getTask } from './content/index.js';
import { taskStatus, levelProgress, levelTopicStats, xpForLevel, overall } from './progress.js';

export const RANKS = [
  { xp: 0, name: 'Nováčik' },
  { xp: 500, name: 'Strážca' },
  { xp: 1500, name: 'Detektív' },
  { xp: 3000, name: 'Expert' },
];

export function rankFor(xp) {
  return [...RANKS].reverse().find((r) => xp >= r.xp) || RANKS[0];
}

function pageHead(title, lead, iconName) {
  return h('section', { class: 'page-head' }, h('h1', { tabindex: '-1' }, iconName ? icon(iconName, 36) : null, iconName ? ' ' : null, title), lead ? h('p', { class: 'lead' }, lead) : null);
}

function bar(value, total, label) {
  const p = total ? Math.round((value / total) * 100) : 0;
  return h('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(value) },
    h('span', { class: 'progress-fill', style: `width:${p}%` }));
}

function levelCard(level, cta) {
  const p = levelProgress(level);
  return h('a', { class: `level-card lc-${level.color}`, href: `#/level/${level.id}`, 'aria-label': `Úroveň ${level.id}: ${level.name}, ${level.ages}. Dokončené misie ${p.doneTasks} z ${p.totalTasks}.` },
    h('span', { class: 'lc-num' }, String(level.id)),
    h('span', { class: 'lc-icon' }, icon(level.icon, 44)),
    h('h3', null, level.name),
    h('p', { class: 'lc-age' }, level.ages),
    h('p', null, level.tagline),
    bar(p.doneTasks, p.totalTasks, `Postup v úrovni ${level.name}`),
    h('span', { class: 'lc-foot' }, `Misie: ${p.doneTasks} / ${p.totalTasks}`, h('span', { class: 'lc-cta' }, cta || 'Otvoriť', ' ', icon('forward', 20))));
}

export function home(root) {
  const resume = store.getState().resume;
  const resumeTask = resume ? getTask(resume.taskId) : null;
  append(root, 
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('p', { class: 'eyebrow' }, 'Chráň svoj digitálny svet.'),
        h('h1', { class: 'hero-title', tabindex: '-1' }, 'PASSWORD QUEST'),
        h('p', { class: 'hero-sub' }, 'Staň sa ochrancom digitálneho sveta.'),
        h('p', { class: 'lead' }, 'Tvoj digitálny svet potrebuje ochranu. Nauč sa vytvárať bezpečné heslá, odhaľovať podvodné správy a chrániť svoje účty.'),
        h('div', { class: 'actions' },
          h('a', { class: 'btn btn-primary btn-lg', href: '#/levels' }, icon('play', 24), ' Začať misiu'),
          h('a', { class: 'btn btn-secondary btn-lg', href: '#/howto' }, icon('info', 24), ' Ako hrať'),
          h('a', { class: 'btn btn-secondary btn-lg', href: '#/learn' }, icon('book', 24), ' Čo sa naučím?'),
          h('a', { class: 'btn btn-secondary btn-lg', href: '#/teacher' }, icon('users', 24), ' Učiteľský režim')),
        h('p', { class: 'muted privacy-note' }, icon('lock', 18), ' Bez registrácie. Nepýtame si meno, e-mail ani žiadne heslo.')),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, bot('happy', 220))),
    resumeTask ? h('section', { class: 'card resume-card' }, icon('play', 28),
      h('div', null, h('strong', null, 'Máš rozpracovanú misiu: '), resumeTask.title),
      h('a', { class: 'btn btn-primary', href: `#/task/${resumeTask.id}` }, 'Pokračovať')) : null,
    h('section', { 'aria-labelledby': 'levels-h' },
      h('h2', { id: 'levels-h' }, 'Štyri úrovne'),
      h('p', { class: 'muted' }, 'Vyber úroveň podľa veku alebo schopností. Môžeš sa kedykoľvek vrátiť.'),
      h('div', { class: 'level-grid' }, LEVELS.map((l) => levelCard(l)))),
  );
}

export function levels(root) {
  append(root, 
    pageHead('Vyber si úroveň', 'Úrovne sú určené pre rôzny vek. Ak ťa lákajú ťažšie úlohy, môžeš začať aj vyššou úrovňou.', 'shield'),
    h('div', { class: 'level-grid' }, LEVELS.map((l) => levelCard(l, 'Vybrať úroveň'))));
}

function taskCard(task) {
  const s = taskStatus(task);
  const state = s.done ? 'Dokončené' : s.inProgress ? 'Rozpracované' : s.started ? 'Treba zopakovať' : 'Nezačaté';
  const label = s.done ? 'Zopakovať' : s.inProgress ? 'Pokračovať' : s.started ? 'Zopakovať nesprávne' : 'Začať';
  return h('article', { class: 'card task-card' + (s.done ? ' done' : '') },
    h('div', { class: 'tc-icon' }, icon(s.done ? 'check' : task.icon, 30)),
    h('div', { class: 'tc-body' },
      h('p', { class: 'eyebrow' }, `Misia ${task.order} · ${TOPICS[task.topic]}`),
      h('h3', null, task.title),
      h('p', { class: 'muted' }, `${task.rounds.length} úloh · približne ${task.minutes} min`),
      bar(s.mastered, s.total, `Zvládnuté úlohy v misii ${task.title}`),
      h('p', { class: 'small' }, `${state} · zvládnuté ${s.mastered} z ${s.total}`),
      task.badge ? h('p', { class: 'small' }, icon(BADGES[task.badge].icon, 16), ` Odznak: ${BADGES[task.badge].name}`) : null),
    h('a', { class: 'btn ' + (s.done ? 'btn-secondary' : 'btn-primary'), href: `#/task/${task.id}`, 'aria-label': `${label}: ${task.title}` }, label));
}

export function level(root, id, showAll) {
  const lv = getLevel(id);
  if (!lv) { append(root, pageHead('Úroveň sa nenašla')); return; }
  const p = levelProgress(lv);
  const session = store.getState().session;
  const inSession = session && session.level === lv.id && session.missions && session.missions.length && !showAll;
  const tasks = inSession ? lv.tasks.filter((t) => session.missions.includes(t.id)) : lv.tasks;
  append(root, 
    h('a', { class: 'btn btn-ghost', href: '#/levels' }, icon('back', 22), ' Všetky úrovne'),
    h('section', { class: `level-head lc-${lv.color}` },
      h('div', { class: 'lc-icon big' }, icon(lv.icon, 64)),
      h('div', null,
        h('p', { class: 'eyebrow' }, `Úroveň ${lv.id} · ${lv.ages}`),
        h('h1', { tabindex: '-1' }, lv.name),
        h('p', { class: 'lead' }, lv.story),
        bar(p.doneTasks, p.totalTasks, 'Postup v úrovni'),
        h('p', { class: 'small' }, `Dokončené misie: ${p.doneTasks} z ${p.totalTasks} · Získané XP: ${xpForLevel(lv)}`))),
    session && session.level === lv.id ? h('p', { class: 'banner banner-info' }, icon('users', 22),
      h('span', null, `Relácia triedy ${session.code}. `, inSession ? 'Zobrazené sú misie vybrané učiteľom. ' : 'Zobrazené sú všetky misie. ', inSession
        ? h('a', { href: `#/level/${lv.id}/all` }, 'Zobraziť všetky misie')
        : h('a', { href: `#/level/${lv.id}` }, 'Zobraziť iba misie z relácie')))
      : null,
    h('div', { class: 'task-list' }, tasks.map(taskCard)),
    h('section', { class: 'card final-card' },
      h('div', null,
        h('h2', null, icon('trophy', 28), ' Záverečné hodnotenie'),
        p.complete
          ? h('p', null, 'Všetky misie máš dokončené. Pozri si skóre, zvládnuté oblasti a certifikát.')
          : h('p', { class: 'muted' }, `Odomkne sa po dokončení všetkých misií tejto úrovne (zostáva ${p.totalTasks - p.doneTasks}). Odznak úrovne: ${BADGES[lv.badge].name}.`)),
      p.complete ? h('a', { class: 'btn btn-primary btn-lg', href: `#/level/${lv.id}/summary` }, 'Zobraziť hodnotenie') : null),
  );
}

export function levelSummary(root, id) {
  const lv = getLevel(id);
  if (!lv) { append(root, pageHead('Úroveň sa nenašla')); return; }
  const p = levelProgress(lv);
  const stats = levelTopicStats(lv);
  const strong = stats.filter((s) => s.rate >= 75);
  const weak = stats.filter((s) => s.rate < 75);
  const nextLevel = getLevel(lv.id + 1);
  const totalOk = stats.reduce((a, s) => a + s.ok, 0);
  const totalAll = stats.reduce((a, s) => a + s.total, 0);
  const tasksFor = (topic) => lv.tasks.filter((t) => t.rounds.some((r) => r.topic === topic));

  append(root, 
    h('a', { class: 'btn btn-ghost', href: `#/level/${lv.id}` }, icon('back', 22), ' Späť na úroveň'),
    pageHead(`Záverečné hodnotenie: ${lv.name}`, p.complete ? 'Skvelá práca! Tu je tvoj prehľad.' : 'Úroveň ešte nie je dokončená. Dokonči všetky misie a zobrazí sa plné hodnotenie.', 'trophy'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', null, `${xpForLevel(lv)} XP`), h('span', null, 'dosiahnuté skóre')),
      h('div', { class: 'stat' }, h('strong', null, `${p.doneTasks} / ${p.totalTasks}`), h('span', null, 'dokončené misie')),
      h('div', { class: 'stat' }, h('strong', null, totalAll ? `${Math.round((totalOk / totalAll) * 100)} %` : '–'), h('span', null, 'správne na prvý pokus'))),
    p.complete ? h('div', { class: 'badge-card new' }, icon(BADGES[lv.badge].icon, 44), h('div', null, h('strong', null, `Odznak: ${BADGES[lv.badge].name}`), h('span', null, BADGES[lv.badge].desc))) : null,
    h('div', { class: 'two-col' },
      h('section', { class: 'card' }, h('h2', null, icon('check', 26), ' Čo si zvládol'),
        strong.length ? h('ul', { class: 'topic-list' }, strong.map((s) => h('li', null, h('span', null, s.label), h('span', { class: 'rate ok' }, `${s.rate} %`)))) : h('p', { class: 'muted' }, 'Zatiaľ žiadna téma nemá aspoň 75 % správnych odpovedí na prvý pokus.')),
      h('section', { class: 'card' }, h('h2', null, icon('repeat', 26), ' Čo si zopakovať'),
        weak.length ? h('ul', { class: 'topic-list' }, weak.map((s) => h('li', null,
          h('span', null, s.label, h('span', { class: 'small block' }, 'Zopakuj: ' + tasksFor(s.topic).map((t) => t.title).join(', '))),
          h('span', { class: 'rate warn' }, `${s.rate} %`)))) : h('p', { class: 'muted' }, 'Všetky témy máš zvládnuté. Môžeš pokračovať ďalej.'))),
    h('section', { class: 'card' }, h('h2', null, 'Odporúčané ďalšie kroky'),
      h('ul', { class: 'bullets' },
        weak.length ? h('li', null, 'Zopakuj misie, v ktorých si mal viac chýb. Opakovanie je súčasť učenia.') : h('li', null, 'Skús Password Lab a vymysli vlastné ukážkové frázy.'),
        nextLevel ? h('li', null, `Pokračuj úrovňou ${nextLevel.name}.`) : h('li', null, 'Prešiel si všetkými úrovňami. Pomôž spolužiakom zvládnuť ich tiež.'),
        h('li', null, 'V reálnom živote používaj jedinečné heslá, správcu hesiel a viacfaktorové overovanie.')),
      h('div', { class: 'actions' },
        p.complete ? h('a', { class: 'btn btn-primary btn-lg', href: `#/certificate/${lv.id}` }, icon('print', 22), ' Certifikát') : null,
        nextLevel ? h('a', { class: 'btn btn-secondary btn-lg', href: `#/level/${nextLevel.id}` }, 'Ďalšia úroveň ', icon('forward', 22)) : null,
        h('a', { class: 'btn btn-secondary btn-lg', href: '#/lab' }, icon('search', 22), ' Password Lab'))),
  );
}

export function certificate(root, id) {
  const lv = getLevel(id);
  const p = lv ? levelProgress(lv) : null;
  if (!lv || !p.complete) {
    append(root, pageHead('Certifikát ešte nie je k dispozícii', 'Certifikát sa udeľuje za preukázané zvládnutie všetkých misií úrovne, nie za otvorenie aplikácie.', 'trophy'),
      h('a', { class: 'btn btn-primary', href: lv ? `#/level/${lv.id}` : '#/levels' }, 'Späť na misie'));
    return;
  }
  const date = new Date().toLocaleDateString('sk-SK');
  const printBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => {
    document.body.classList.add('print-mode');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'), { once: true });
    window.print();
  } }, icon('print', 22), ' Vytlačiť certifikát');
  append(root, 
    h('a', { class: 'btn btn-ghost', href: `#/level/${lv.id}/summary` }, icon('back', 22), ' Späť na hodnotenie'),
    h('section', { class: 'certificate printable' },
      h('p', { class: 'eyebrow' }, 'Password Quest · Chráň svoj digitálny svet.'),
      h('h1', { tabindex: '-1' }, 'Certifikát'),
      h('p', { class: 'lead' }, 'za preukázané zvládnutie úloh na úrovni'),
      h('h2', null, `${lv.name} (${lv.ages})`),
      h('p', null, 'Zvládnuté oblasti: ' + [...new Set(lv.tasks.flatMap((t) => t.rounds.map((r) => TOPICS[r.topic])))].join(', ') + '.'),
      h('p', null, `Odznak: ${BADGES[lv.badge].name} · Skóre: ${xpForLevel(lv)} XP`),
      h('p', { class: 'cert-name' }, 'Meno žiaka (dopíše učiteľ alebo žiak rukou): ____________________'),
      h('p', { class: 'muted' }, `Dátum: ${date}`)),
    h('div', { class: 'actions' }, printBtn));
}

export function howto(root) {
  const step = (n, t, d, ic) => h('article', { class: 'card step' }, h('span', { class: 'step-num' }, String(n)), icon(ic, 34), h('div', null, h('h3', null, t), h('p', null, d)));
  append(root, 
    pageHead('Ako hrať', 'Password Quest je hra, v ktorej sa rozhodovaním učíš, ako chrániť svoje účty.', 'info'),
    h('div', { class: 'steps-grid' },
      step(1, 'Vyber si úroveň', 'Úrovne sú podľa veku: od Digitálnych objaviteľov po Cyber expertov.', 'shield'),
      step(2, 'Rieš misie', 'Každá misia má viac úloh. Vyberáš odpovede, triedíš, zostavuješ postup alebo označuješ podozrivé časti.', 'play'),
      step(3, 'Čítaj vysvetlenia', 'Po každej odpovedi sa dozvieš, prečo je riešenie dobré alebo riskantné.', 'bulb'),
      step(4, 'Opakuj, čo sa nepodarilo', 'Úlohy, ktoré nevyšli na prvý pokus, si na konci zopakuješ. Chyby ťa nebrzdia.', 'repeat'),
      step(5, 'Zbieraj body a odznaky', 'Správna odpoveď dáva 100 XP, po zopakovaní 50 XP. Za sériu a dokončenú misiu sú bonusy.', 'star'),
      step(6, 'Bezpečnosť na prvom mieste', 'Nikdy nezadávaj svoje skutočné heslo. Všetky heslá v hre sú vymyslené ukážky.', 'lock')),
    h('div', { class: 'actions' }, h('a', { class: 'btn btn-primary btn-lg', href: '#/levels' }, icon('play', 22), ' Začať misiu')));
}

export function learn(root) {
  const topics = [
    ['safe-passwords', 'Čo robí heslo bezpečným alebo rizikovým, prečo sú krátke a predvídateľné heslá slabé.'],
    ['unique', 'Prečo nepoužívať rovnaké heslo na viacerých službách.'],
    ['sharing', 'Prečo sa heslo nezdieľa ani s kamarátmi a komu sa pri probléme obrátiť.'],
    ['phishing', 'Ako rozpoznať podvodné správy, odkazy a falošné prihlasovacie stránky.'],
    ['mfa', 'Ako funguje viacfaktorové overovanie a ako reagovať na neočakávané žiadosti.'],
    ['incident', 'Čo robiť pri podozrení na únik hesla alebo kompromitáciu účtu.'],
    ['tools', 'Správcovia hesiel a prístupové kľúče.'],
    ['account-care', 'Odhlasovanie, zamykanie zariadení a zvyky na ochranu účtu.'],
    ['policy', 'Ako vyzerá dobrý bezpečnostný plán školy.'],
  ];
  append(root, 
    pageHead('Čo sa naučím?', 'Obsah je rozdelený podľa témy aj podľa veku. Každá úloha obsahuje situáciu, možnosti, vysvetlenie a možnosť zopakovať.', 'book'),
    h('div', { class: 'topic-grid' }, topics.map(([id, d]) => h('article', { class: 'card' }, h('h3', null, TOPICS[id]), h('p', null, d)))),
    h('h2', null, 'Čo ťa čaká v úrovniach'),
    h('div', { class: 'level-grid' }, LEVELS.map((l) => levelCard(l))),
    h('h2', null, 'Pripravované moduly'),
    h('p', { class: 'muted' }, 'Aplikácia je pripravená na ďalšie vzdelávacie moduly. Zatiaľ sú to len plány, nie spustiteľné časti.'),
    h('div', { class: 'planned-grid' }, PLANNED_MODULES.map((m) => h('div', { class: 'card planned' }, icon(m.icon, 30), h('div', null, h('strong', null, m.name), h('span', { class: 'tag' }, 'Pripravujeme'), h('p', { class: 'small' }, m.summary))))));
}

export function progress(root) {
  const st = store.getState();
  const o = overall();
  const rank = rankFor(o.xp);
  const nextRank = RANKS.find((r) => r.xp > o.xp);
  const weak = Object.entries(st.stats.topics).map(([t, s]) => ({ t, rate: s.total ? Math.round((s.ok / s.total) * 100) : 0, total: s.total })).filter((x) => x.rate < 75 && x.total >= 2);
  const resetBtn = h('button', { type: 'button', class: 'btn btn-danger', onclick: () => {
    if (window.confirm('Naozaj vymazať celý tvoj postup na tomto zariadení? Body, odznaky aj dokončené misie sa stratia.')) {
      store.resetAll();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  } }, icon('trash', 22), ' Vymazať môj postup');
  append(root, 
    pageHead('Môj postup', 'Postup sa ukladá iba v tomto prehliadači. Neobsahuje heslá ani osobné údaje.', 'star'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', null, `${o.xp} XP`), h('span', null, `titul: ${rank.name}${nextRank ? ` (ďalší od ${nextRank.xp} XP)` : ''}`)),
      h('div', { class: 'stat' }, h('strong', null, `${o.done} / ${o.total}`), h('span', null, 'dokončené misie')),
      h('div', { class: 'stat' }, h('strong', null, `${o.badges} / ${Object.keys(BADGES).length}`), h('span', null, 'získané odznaky'))),
    h('section', { class: 'card' }, h('h2', null, 'Odznaky'),
      h('div', { class: 'badge-grid' }, Object.entries(BADGES).map(([id, b]) => {
        const got = st.badges[id];
        return h('div', { class: 'badge-card' + (got ? ' earned' : ' locked') }, icon(got ? b.icon : 'lock', 40),
          h('div', null, h('strong', null, b.name), h('span', null, b.desc), h('span', { class: 'small' }, got ? 'Získaný' : 'Zatiaľ neodomknutý')));
      }))),
    h('section', { class: 'card' }, h('h2', null, 'Postup v úrovniach'),
      LEVELS.map((l) => { const p = levelProgress(l); return h('div', { class: 'lvl-row' }, h('a', { href: `#/level/${l.id}` }, `${l.id}. ${l.name}`), bar(p.doneTasks, p.totalTasks, `Postup v úrovni ${l.name}`), h('span', { class: 'small' }, `${p.doneTasks} / ${p.totalTasks} misií`)); })),
    h('section', { class: 'card' }, h('h2', null, 'Odporúčame zopakovať'),
      weak.length ? h('ul', { class: 'bullets' }, weak.map((w) => h('li', null, `${TOPICS[w.t] || w.t} (${w.rate} % správnych na prvý pokus)`))) : h('p', { class: 'muted' }, 'Zatiaľ nie je čo opakovať. Pokračuj v misiách.')),
    h('div', { class: 'actions' }, resetBtn));
}

export function notFound(root) {
  append(root, pageHead('Stránka sa nenašla', 'Skús sa vrátiť na úvodnú obrazovku.', 'info'), h('a', { class: 'btn btn-primary', href: '#/' }, icon('home', 22), ' Úvod'));
}

// Pomôcky pre navigáciu v main.js
export const MODULE_INFO = MODULES;
export { clear, rich };
