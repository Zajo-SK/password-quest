// Register obsahu pre všetky jazyky. Nový modul = nové súbory s úrovňami v každom jazyku + záznam v MODULE_LEVELS.
// Engine (js/engine.js) pozná len typy úloh (choice, multi, rows, hotspot, order, reuse, lab), nie konkrétny obsah.
// Identifikátory úloh a kôl sú vo všetkých jazykoch rovnaké, preto postup platí bez ohľadu na zvolený jazyk.

import { getLang } from '../i18n.js';
import * as skMeta from './sk/meta.js';
import * as enMeta from './en/meta.js';
import { level1 as sk1 } from './sk/level1.js';
import { level2 as sk2 } from './sk/level2.js';
import { level3 as sk3 } from './sk/level3.js';
import { level4 as sk4 } from './sk/level4.js';
import { level1 as en1 } from './en/level1.js';
import { level2 as en2 } from './en/level2.js';
import { level3 as en3 } from './en/level3.js';
import { level4 as en4 } from './en/level4.js';

// Spoločné vlastnosti odznakov (texty sú v meta.js daného jazyka).
const BADGE_STYLE = {
  secret_key: { icon: 'key', color: 'green' },
  weak_detector: { icon: 'search', color: 'blue' },
  uniqueness: { icon: 'diamond', color: 'purple' },
  phishing_hunter: { icon: 'hook', color: 'cyan' },
  account_guardian: { icon: 'shield-check', color: 'blue' },
  mfa_expert: { icon: 'phone', color: 'purple' },
  cyber_detective: { icon: 'eye', color: 'purple' },
  cyber_expert: { icon: 'terminal', color: 'cyan' },
};

const PLANNED_ICONS = {
  'phishing-hunter': ['Phishing Hunter', 'hook'],
  'digital-footprint': ['Digital Footprint', 'globe'],
  'account-defender': ['Account Defender', 'shield-check'],
  'ai-detective': ['AI Detective', 'search'],
  'social-media-guardian': ['Social Media Guardian', 'users'],
  'incident-response': ['Incident Response', 'flag'],
};

function prepare(levels) {
  for (const level of levels) {
    level.tasks.forEach((task, ti) => {
      task.level = level.id;
      task.order = ti + 1;
      task.rounds.forEach((r, ri) => {
        r.id = `${task.id}r${ri + 1}`;
        r.topic = r.topic || task.topic;
      });
    });
  }
  return levels;
}

export const CONTENT = {
  sk: { meta: skMeta, levels: prepare([sk1, sk2, sk3, sk4]) },
  en: { meta: enMeta, levels: prepare([en1, en2, en3, en4]) },
};

const current = () => CONTENT[getLang()] || CONTENT.sk;

export const levels = () => current().levels;
export const allTasks = () => levels().flatMap((l) => l.tasks);
export const getLevel = (id) => levels().find((l) => l.id === Number(id));
export const getTask = (id) => allTasks().find((t) => t.id === id);
export const findRound = (roundId) => {
  for (const t of allTasks()) {
    const r = t.rounds.find((x) => x.id === roundId);
    if (r) return { task: t, round: r };
  }
  return null;
};

export const topics = () => current().meta.TOPICS;
export const topicLabel = (id) => topics()[id] || id;

export const badges = () => Object.fromEntries(Object.entries(BADGE_STYLE).map(([id, s]) => [id, { ...s, ...current().meta.BADGES[id] }]));
export const badge = (id) => badges()[id];

export const plannedModules = () => Object.entries(PLANNED_ICONS).map(([id, [name, icon]]) => ({ id, name, icon, summary: current().meta.PLANNED[id] }));

export const modules = () => [{ id: 'password-quest', status: 'available', ...current().meta.MODULE, levels: levels() }];
