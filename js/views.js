// Obrazovky aplikácie (okrem misií, Dielne hesiel a učiteľského režimu).
import { h, clear, append, embedded } from './util.js';
import { icon, bot } from './icons.js';
import * as store from './store.js';
import { t, getLocale } from './i18n.js';
import { FEATURES } from './config.js';
import { modules, plannedModules, topics, topicLabel, badges, badge, getLevel, getTask, getModule, nextLevel as nextLevelOf } from './content/index.js';
import { nextStepCard, nextStepButton } from './nextStep.js';
import { taskStatus, levelProgress, levelTopicStats, xpForLevel, overall } from './progress.js';

export const RANKS = [
  { xp: 0, key: 'rank.novice' },
  { xp: 500, key: 'rank.guardian' },
  { xp: 1500, key: 'rank.detective' },
  { xp: 3000, key: 'rank.expert' },
];

export function rankFor(xp) {
  return [...RANKS].reverse().find((r) => xp >= r.xp) || RANKS[0];
}

const pctText = (n) => t('pct', { n });

function pageHead(title, lead, iconName) {
  return h('section', { class: 'page-head' }, h('h1', { tabindex: '-1' }, iconName ? icon(iconName, 36) : null, iconName ? ' ' : null, title), lead ? h('p', { class: 'lead' }, lead) : null);
}

function bar(value, total, label) {
  const p = total ? Math.round((value / total) * 100) : 0;
  return h('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(value) },
    h('span', { class: 'progress-fill', style: `width:${p}%` }));
}

// Obtiažnosť úrovne: štyri body (vyplnené podľa čísla úrovne) a názov stupňa.
export const difficultyName = (level) => t('difficulty.' + level.n);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function difficulty(level) {
  return h('p', { class: 'lc-diff' },
    h('span', { class: 'diff-pips', 'aria-hidden': 'true' }, [1, 2, 3, 4].map((i) => h('span', { class: 'pip' + (i <= level.n ? ' on' : '') }))),
    h('span', { class: 'diff-name' }, cap(difficultyName(level))));
}

function levelCard(level, cta) {
  const p = levelProgress(level);
  return h('a', { class: `level-card lc-${level.color}`, href: `#/level/${level.id}`, 'aria-label': t('level.card_aria', { id: level.n, name: level.name, difficulty: difficultyName(level), done: p.doneTasks, total: p.totalTasks }) },
    h('span', { class: 'lc-num' }, String(level.n)),
    h('span', { class: 'lc-icon' }, icon(level.icon, 44)),
    h('h3', null, level.name),
    difficulty(level),
    h('p', null, level.tagline),
    bar(p.doneTasks, p.totalTasks, t('level.progress_aria', { name: level.name })),
    h('span', { class: 'lc-foot' }, t('level.missions_count', { done: p.doneTasks, total: p.totalTasks }), h('span', { class: 'lc-cta' }, cta || t('common.open'), ' ', icon('forward', 20))));
}

// Modul: nadpis s ikonou, krátky popis a jeho štyri úrovne.
function moduleSection(m, cta) {
  return h('section', { class: 'module', 'aria-labelledby': 'mod-' + m.id },
    h('div', { class: 'module-head' },
      h('span', { class: 'module-icon' }, icon(m.icon, 32)),
      h('div', null, h('h3', { id: 'mod-' + m.id }, m.name), h('p', { class: 'muted' }, m.summary))),
    h('div', { class: 'level-grid' }, m.levels.map((l) => levelCard(l, cta))));
}

export function home(root) {
  const resume = store.getState().resume;
  const resumeTask = resume ? getTask(resume.taskId) : null;
  append(root,
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('p', { class: 'eyebrow' }, t('home.eyebrow')),
        h('h1', { class: 'hero-title', tabindex: '-1' }, 'PASSWORD QUEST'),
        h('p', { class: 'hero-sub' }, t('home.sub')),
        h('p', { class: 'lead' }, t('home.lead')),
        h('div', { class: 'actions' },
          h('a', { class: 'btn btn-primary btn-lg', href: '#/levels' }, icon('play', 24), ' ', t('home.start')),
          h('a', { class: 'btn btn-primary btn-lg', href: '#/email' }, icon('mail', 24), ' ', t('home.email')),
          h('a', { class: 'btn btn-secondary btn-lg', href: '#/howto' }, icon('info', 24), ' ', t('home.howto')),
          h('a', { class: 'btn btn-secondary btn-lg', href: '#/learn' }, icon('book', 24), ' ', t('home.learn')),
          FEATURES.teacher ? h('a', { class: 'btn btn-secondary btn-lg', href: '#/teacher' }, icon('users', 24), ' ', t('nav.teacher')) : null),
        h('p', { class: 'muted privacy-note' }, icon('lock', 18), ' ', t('home.privacy'))),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, bot('happy', 220))),
    resumeTask ? h('section', { class: 'card resume-card' }, icon('play', 28),
      h('div', null, h('strong', null, t('home.resume')), resumeTask.title),
      h('a', { class: 'btn btn-primary', href: `#/task/${resumeTask.id}` }, t('common.continue'))) : null,
    h('section', { 'aria-labelledby': 'levels-h' },
      h('h2', { id: 'levels-h' }, t('home.levels')),
      h('p', { class: 'muted' }, t('home.levels_hint')),
      modules().map((m) => moduleSection(m))),
  );
}

// Každý modul je samostatný tréning s vlastnou položkou v menu (#/levels pre heslá, #/email pre e-maily).
const MODULE_ROUTES = { 'password-quest': 'levels', 'email-detective': 'email' };
export const moduleRoute = (moduleId) => MODULE_ROUTES[moduleId] || 'levels';

export function levels(root) {
  append(root,
    pageHead(t('levels.title'), t('levels.lead'), 'shield'),
    h('div', { class: 'level-grid' }, getModule('password-quest').levels.map((l) => levelCard(l, t('levels.choose')))));
}

export function emailTraining(root) {
  const m = getModule('email-detective');
  append(root,
    pageHead(m.name, t('email.lead'), m.icon),
    h('div', { class: 'level-grid' }, m.levels.map((l) => levelCard(l, t('levels.choose')))),
    h('section', { class: 'card' },
      h('h2', null, t('email.how')),
      h('ul', { class: 'bullets' }, [1, 2, 3, 4].map((n) => h('li', null, t('email.how' + n))))));
}

function taskCard(task) {
  const s = taskStatus(task);
  const state = s.done ? t('task.state.done') : s.inProgress ? t('task.state.progress') : s.started ? t('task.state.retry') : t('task.state.new');
  const label = s.done ? t('task.action.replay') : s.inProgress ? t('task.action.continue') : s.started ? t('task.action.retry') : t('task.action.start');
  const b = task.badge ? badge(task.badge) : null;
  return h('article', { class: 'card task-card' + (s.done ? ' done' : '') },
    h('div', { class: 'tc-icon' }, icon(s.done ? 'check' : task.icon, 30)),
    h('div', { class: 'tc-body' },
      h('p', { class: 'eyebrow' }, t('task.eyebrow', { n: task.order, topic: topicLabel(task.topic) })),
      h('h3', null, task.title),
      h('p', { class: 'muted' }, t('task.meta', { n: task.rounds.length })),
      bar(s.mastered, s.total, t('task.progress_aria', { title: task.title })),
      h('p', { class: 'small' }, t('task.status', { state, m: s.mastered, total: s.total })),
      b ? h('p', { class: 'small' }, icon(b.icon, 16), ' ', t('task.badge', { name: b.name })) : null),
    h('a', { class: 'btn ' + (s.done ? 'btn-secondary' : 'btn-primary'), href: `#/task/${task.id}`, 'aria-label': `${label}: ${task.title}` }, label));
}

export function level(root, id, showAll) {
  const lv = getLevel(id);
  if (!lv) { notFound(root); return; }
  const p = levelProgress(lv);
  const session = FEATURES.teacher ? store.getState().session : null;
  const inSession = session && String(session.level) === String(lv.id) && session.missions && session.missions.length && !showAll;
  const tasks = inSession ? lv.tasks.filter((x) => session.missions.includes(x.id)) : lv.tasks;
  append(root,
    h('a', { class: 'btn btn-ghost', href: '#/' + moduleRoute(lv.module) }, icon('back', 22), ' ', t('level.back_all')),
    h('section', { class: `level-head lc-${lv.color}` },
      h('div', { class: 'lc-icon big' }, icon(lv.icon, 64)),
      h('div', null,
        h('p', { class: 'eyebrow' }, t('level.eyebrow', { module: getModule(lv.module).name, id: lv.n, difficulty: difficultyName(lv) })),
        h('h1', { tabindex: '-1' }, lv.name),
        h('p', { class: 'lead' }, lv.story),
        bar(p.doneTasks, p.totalTasks, t('level.progress_simple')),
        h('p', { class: 'small' }, t('level.summary_line', { done: p.doneTasks, total: p.totalTasks, xp: xpForLevel(lv) })))),
    session && String(session.level) === String(lv.id) ? h('p', { class: 'banner banner-info' }, icon('users', 22),
      h('span', null, t('session.code', { code: session.code }), inSession ? t('session.filtered') : t('session.all'), inSession
        ? h('a', { href: `#/level/${lv.id}/all` }, t('session.show_all'))
        : h('a', { href: `#/level/${lv.id}` }, t('session.show_filtered'))))
      : null,
    h('div', { class: 'task-list' }, tasks.map(taskCard)),
    h('section', { class: 'card final-card' },
      h('div', null,
        h('h2', null, icon('trophy', 28), ' ', t('final.title')),
        p.complete
          ? h('p', null, t('final.ready'))
          : h('p', { class: 'muted' }, t('final.locked', { left: p.totalTasks - p.doneTasks, badge: badge(lv.badge).name }))),
      p.complete ? h('div', { class: 'actions' }, h('a', { class: 'btn btn-primary btn-lg', href: `#/level/${lv.id}/summary` }, t('final.open')), nextStepButton(lv, 'btn btn-secondary btn-lg')) : null),
  );
}

export function levelSummary(root, id) {
  const lv = getLevel(id);
  if (!lv) { notFound(root); return; }
  const p = levelProgress(lv);
  const stats = levelTopicStats(lv);
  const strong = stats.filter((s) => s.rate >= 75);
  const weak = stats.filter((s) => s.rate < 75);
  const nextLevel = nextLevelOf(lv);
  const totalOk = stats.reduce((a, s) => a + s.ok, 0);
  const totalAll = stats.reduce((a, s) => a + s.total, 0);
  const tasksFor = (topic) => lv.tasks.filter((x) => x.rounds.some((r) => r.topic === topic));
  const b = badge(lv.badge);

  append(root,
    h('a', { class: 'btn btn-ghost', href: `#/level/${lv.id}` }, icon('back', 22), ' ', t('summary.back')),
    pageHead(t('summary.title', { name: lv.name }), p.complete ? t('summary.lead_done') : t('summary.lead_todo'), 'trophy'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', null, `${xpForLevel(lv)} XP`), h('span', null, t('stat.score'))),
      h('div', { class: 'stat' }, h('strong', null, `${p.doneTasks} / ${p.totalTasks}`), h('span', null, t('stat.missions'))),
      h('div', { class: 'stat' }, h('strong', null, totalAll ? pctText(Math.round((totalOk / totalAll) * 100)) : '–'), h('span', null, t('stat.first_try')))),
    p.complete ? h('div', { class: 'badge-card new' }, icon(b.icon, 44), h('div', null, h('strong', null, t('task.badge', { name: b.name })), h('span', null, b.desc))) : null,
    p.complete ? nextStepCard(lv) : null,
    h('div', { class: 'two-col' },
      h('section', { class: 'card' }, h('h2', null, icon('check', 26), ' ', t('summary.strong')),
        strong.length
          ? h('ul', { class: 'topic-list' }, strong.map((s) => h('li', null, h('span', null, s.label), h('span', { class: 'rate ok' }, pctText(s.rate)))))
          : h('p', { class: 'muted' }, t('summary.strong_empty'))),
      h('section', { class: 'card' }, h('h2', null, icon('repeat', 26), ' ', t('summary.weak')),
        weak.length
          ? h('ul', { class: 'topic-list' }, weak.map((s) => h('li', null,
            h('span', null, s.label, h('span', { class: 'small block' }, t('summary.weak_tasks', { list: tasksFor(s.topic).map((x) => x.title).join(', ') }))),
            h('span', { class: 'rate warn' }, pctText(s.rate)))))
          : h('p', { class: 'muted' }, t('summary.weak_empty')))),
    h('section', { class: 'card' }, h('h2', null, t('summary.next')),
      h('ul', { class: 'bullets' },
        h('li', null, weak.length ? t('summary.tip_weak') : t('summary.tip_lab')),
        h('li', null, nextLevel ? t('summary.tip_next', { name: nextLevel.name }) : t('summary.tip_last')),
        h('li', null, t('summary.tip_life'))),
      h('div', { class: 'actions' },
        p.complete ? h('a', { class: 'btn btn-primary btn-lg', href: `#/certificate/${lv.id}` }, icon('trophy', 22), ' ', t('summary.certificate')) : null,
        !p.complete && nextLevel ? h('a', { class: 'btn btn-secondary btn-lg', href: `#/level/${nextLevel.id}` }, t('summary.next_level'), ' ', icon('forward', 22)) : null,
        h('a', { class: 'btn btn-secondary btn-lg', href: '#/lab' }, icon('key', 22), ' ', t('nav.lab')))),
  );
}

export function certificate(root, id) {
  const lv = getLevel(id);
  const p = lv ? levelProgress(lv) : null;
  if (!lv || !p.complete) {
    append(root, pageHead(t('cert.na_title'), t('cert.na_text'), 'trophy'),
      h('a', { class: 'btn btn-primary', href: lv ? `#/level/${lv.id}` : '#/levels' }, t('cert.back_missions')));
    return;
  }
  const b = badge(lv.badge);
  const topicNames = [...new Set(lv.tasks.flatMap((x) => x.rounds.map((r) => topicLabel(r.topic))))];
  const printBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => {
    document.body.classList.add('print-mode');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'), { once: true });
    window.print();
  } }, icon('print', 22), ' ', t('cert.print'));
  append(root,
    h('a', { class: 'btn btn-ghost', href: `#/level/${lv.id}/summary` }, icon('back', 22), ' ', t('cert.back')),
    h('section', { class: 'certificate printable' },
      h('p', { class: 'eyebrow' }, 'Password Quest · ' + t('home.eyebrow')),
      h('h1', { tabindex: '-1' }, t('cert.title')),
      h('p', { class: 'lead' }, t('cert.lead')),
      h('h2', null, `${lv.name} (${t('difficulty.full', { name: difficultyName(lv) })})`),
      h('p', null, t('cert.topics', { list: topicNames.join(', ') })),
      h('p', null, t('cert.badge_score', { badge: b.name, xp: xpForLevel(lv) })),
      h('p', { class: 'cert-name' }, t('cert.name')),
      h('p', { class: 'muted' }, t('cert.date', { date: new Date().toLocaleDateString(getLocale()) }))),
    embedded()
      ? h('p', { class: 'muted' }, t('cert.no_print'))
      : h('div', { class: 'actions' }, printBtn),
    nextStepCard(lv));
}

// Materiály pre učiteľov: vzorové hodiny na stiahnutie (PDF) v oboch jazykoch.
const LESSONS = [
  { id: 1, icon: 'key', files: { sk: 'materials/sk/hodina-1-bezpecne-hesla', en: 'materials/en/lesson-1-safe-passwords' } },
  { id: 2, icon: 'mail', files: { sk: 'materials/sk/hodina-2-podvodne-emaily', en: 'materials/en/lesson-2-scam-emails' } },
];

export function teachers(root) {
  const lang = getLocale().startsWith('sk') ? 'sk' : 'en';
  const other = lang === 'sk' ? 'en' : 'sk';
  const lessonCard = (l) => h('article', { class: 'card lesson' },
    h('div', { class: 'lesson-head' },
      h('span', { class: 'module-icon' }, icon(l.icon, 30)),
      h('div', null,
        h('p', { class: 'eyebrow' }, t('mat.lesson_n', { n: l.id })),
        h('h2', null, t(`mat.l${l.id}.title`)))),
    h('p', null, t(`mat.l${l.id}.lead`)),
    h('div', { class: 'chips' },
      h('span', { class: 'chip' }, icon('users', 18), ' ', t(`mat.l${l.id}.grade`)),
      h('span', { class: 'chip' }, icon('clock', 18), ' ', t('mat.length')),
      h('span', { class: 'chip' }, icon('book', 18), ' ', t('mat.pages'))),
    h('h3', null, t('mat.goals')),
    h('ul', { class: 'bullets' }, [1, 2, 3].map((n) => h('li', null, t(`mat.l${l.id}.goal${n}`)))),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn-primary', href: l.files[lang] + '.pdf', download: '', target: '_blank', rel: 'noopener' }, icon('download', 22), ' ', t('mat.download')),
      h('a', { class: 'btn btn-secondary', href: l.files[lang] + '.html', target: '_blank', rel: 'noopener' }, icon('print', 22), ' ', t('mat.open')),
      h('a', { class: 'btn btn-ghost', href: l.files[other] + '.pdf', download: '', target: '_blank', rel: 'noopener', lang: other }, t('mat.other_lang'))));

  append(root,
    pageHead(t('mat.title'), t('mat.lead'), 'book'),
    embedded() ? h('p', { class: 'banner banner-info' }, icon('info', 22), h('span', null, t('mat.embedded'))) : null,
    h('div', { class: 'lesson-grid' }, LESSONS.map(lessonCard)),
    h('section', { class: 'card' },
      h('h2', null, t('mat.tips')),
      h('ul', { class: 'bullets' }, [1, 2, 3, 4].map((n) => h('li', null, t('mat.tip' + n)))),
      h('p', null, h('a', { href: '#/basis' }, icon('shield-check', 20), ' ', t('basis.lab_link')))));
}

export function howto(root) {
  const step = (n, ic) => h('article', { class: 'card step' }, h('span', { class: 'step-num' }, String(n)), icon(ic, 34),
    h('div', null, h('h3', null, t(`howto.s${n}.t`)), h('p', null, t(`howto.s${n}.d`))));
  append(root,
    pageHead(t('howto.title'), t('howto.lead'), 'info'),
    h('div', { class: 'steps-grid' }, step(1, 'shield'), step(2, 'play'), step(3, 'bulb'), step(4, 'repeat'), step(5, 'star'), step(6, 'lock')),
    h('div', { class: 'actions' }, h('a', { class: 'btn btn-primary btn-lg', href: '#/levels' }, icon('play', 22), ' ', t('home.start'))));
}

export function learn(root) {
  append(root,
    pageHead(t('learn.title'), t('learn.lead'), 'book'),
    h('div', { class: 'topic-grid' }, Object.keys(topics()).map((id) => h('article', { class: 'card' }, h('h3', null, topicLabel(id)), h('p', null, t('learn.topic.' + id))))),
    h('h2', null, t('learn.levels')),
    modules().map((m) => moduleSection(m)),
    h('h2', null, t('learn.planned')),
    h('p', { class: 'muted' }, t('learn.planned_hint')),
    h('div', { class: 'planned-grid' }, plannedModules().map((m) => h('div', { class: 'card planned' }, icon(m.icon, 30),
      h('div', null, h('strong', null, m.name), h('span', { class: 'tag' }, t('learn.soon')), h('p', { class: 'small' }, m.summary))))));
}

// Odborný základ: z akých odporúčaní vychádza obsah o heslách a ako ich aplikácia učí.
const BASIS_SOURCES = [
  'https://pages.nist.gov/800-63-4/sp800-63b.html',
  'https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/three-random-words',
  'https://fidoalliance.org/fido-alliance-reports-accelerating-global-passkey-adoption-on-world-passkey-day-2026/',
  'https://www.csirt.gov.sk/wp-content/uploads/2024/03/Preco-neukladat-hesla.pdf',
  'https://www.eff.org/dice',
  'https://theconversation.com/password-education-should-be-age-appropriate-heres-how-145943',
];

export function basis(root) {
  const order = (n, ic) => h('article', { class: 'card step' }, h('span', { class: 'step-num' }, String(n)), icon(ic, 34),
    h('div', null, h('h3', null, t(`basis.o${n}.t`)), h('p', null, t(`basis.o${n}.d`))));
  const principle = (n) => h('article', { class: 'card basis-item' },
    h('h3', null, t(`basis.p${n}.t`)),
    h('p', null, h('strong', null, t('basis.says')), ' ', t(`basis.p${n}.s`)),
    h('p', null, h('strong', null, t('basis.app')), ' ', t(`basis.p${n}.a`)));
  append(root,
    pageHead(t('basis.title'), t('basis.lead'), 'shield-check'),
    h('p', { class: 'muted small' }, t('basis.checked')),
    h('h2', null, t('basis.order')),
    h('p', null, t('basis.order_lead')),
    h('div', { class: 'steps-grid' }, order(1, 'key'), order(2, 'lock'), order(3, 'dice'), order(4, 'phone')),
    h('h2', null, t('basis.principles')),
    h('div', { class: 'topic-grid' }, [1, 2, 3, 4, 5, 6, 7, 8].map(principle)),
    h('div', { class: 'two-col' },
      h('section', { class: 'card' },
        h('h2', null, t('basis.limits')),
        h('ul', { class: 'bullets' }, [1, 2, 3].map((n) => h('li', null, t('basis.limit' + n))))),
      h('section', { class: 'card' },
        h('h2', null, t('basis.sources')),
        h('ul', { class: 'bullets' }, BASIS_SOURCES.map((url, i) => h('li', null,
          h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, t('basis.s' + (i + 1))))))),
    ),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn-primary', href: '#/lab' }, icon('key', 22), ' ', t('nav.lab')),
      h('a', { class: 'btn btn-secondary', href: '#/levels' }, icon('play', 22), ' ', t('home.start'))));
}

export function progress(root) {
  const st = store.getState();
  const o = overall();
  const rank = rankFor(o.xp);
  const nextRank = RANKS.find((r) => r.xp > o.xp);
  const allBadges = badges();
  const weak = Object.entries(st.stats.topics)
    .map(([id, s]) => ({ id, rate: s.total ? Math.round((s.ok / s.total) * 100) : 0, total: s.total }))
    .filter((x) => x.rate < 75 && x.total >= 2);

  // Potvrdenie priamo na stránke (dialógy confirm() nefungujú vo všetkých prostrediach).
  const confirmBox = h('div', { class: 'banner banner-warn', hidden: true, role: 'alert' },
    icon('warning', 22),
    h('div', null,
      h('p', null, t('progress.reset_confirm')),
      h('div', { class: 'row-gap' },
        h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { store.resetAll(); window.dispatchEvent(new HashChangeEvent('hashchange')); } }, icon('trash', 20), ' ', t('common.yes_erase')),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { confirmBox.hidden = true; resetBtn.focus(); } }, t('common.cancel')))));
  const resetBtn = h('button', { type: 'button', class: 'btn btn-danger', onclick: () => { confirmBox.hidden = false; } }, icon('trash', 22), ' ', t('progress.reset'));

  append(root,
    pageHead(t('progress.title'), t('progress.lead'), 'star'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', null, `${o.xp} XP`), h('span', null, t('progress.rank', { rank: t(rank.key), next: nextRank ? nextRank.xp : null }))),
      h('div', { class: 'stat' }, h('strong', null, `${o.done} / ${o.total}`), h('span', null, t('stat.missions'))),
      h('div', { class: 'stat' }, h('strong', null, `${o.badges} / ${Object.keys(allBadges).length}`), h('span', null, t('progress.badges_stat')))),
    h('section', { class: 'card' }, h('h2', null, t('progress.badges')),
      h('div', { class: 'badge-grid' }, Object.entries(allBadges).map(([id, b]) => {
        const got = st.badges[id];
        return h('div', { class: 'badge-card' + (got ? ' earned' : ' locked') }, icon(got ? b.icon : 'lock', 40),
          h('div', null, h('strong', null, b.name), h('span', null, b.desc), h('span', { class: 'small' }, got ? t('badge.earned') : t('badge.locked'))));
      }))),
    h('section', { class: 'card' }, h('h2', null, t('progress.levels')),
      modules().map((m) => [h('h3', { class: 'lvl-module' }, icon(m.icon, 22), ' ', m.name), m.levels.map((l) => {
        const p = levelProgress(l);
        return h('div', { class: 'lvl-row' }, h('a', { href: `#/level/${l.id}` }, `${l.n}. ${l.name}`), bar(p.doneTasks, p.totalTasks, t('level.progress_aria', { name: l.name })), h('span', { class: 'small' }, t('level.missions_count', { done: p.doneTasks, total: p.totalTasks })));
      })])),
    h('section', { class: 'card' }, h('h2', null, t('progress.review')),
      weak.length
        ? h('ul', { class: 'bullets' }, weak.map((w) => h('li', null, t('progress.review_item', { topic: topicLabel(w.id), rate: pctText(w.rate) }))))
        : h('p', { class: 'muted' }, t('progress.review_empty'))),
    h('div', { class: 'actions' }, resetBtn),
    confirmBox);
}

export function notFound(root) {
  append(root, pageHead(t('nf.title'), t('nf.text'), 'info'), h('a', { class: 'btn btn-primary', href: '#/' }, icon('home', 22), ' ', t('nav.home')));
}

export { clear };
