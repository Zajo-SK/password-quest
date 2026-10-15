// Register obsahu. Nový modul = nový súbor s úrovňami + jeden záznam v MODULES.
// Engine (js/engine.js) pozná len typy úloh (choice, multi, rows, hotspot, order, reuse, lab), nie konkrétny obsah.

import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';
import { level4 } from './level4.js';

export const TOPICS = {
  'safe-passwords': 'Bezpečné heslá',
  unique: 'Jedinečnosť hesiel',
  sharing: 'Nezdieľanie hesiel',
  phishing: 'Phishing',
  mfa: 'Viacfaktorové overovanie',
  incident: 'Reakcia na incident',
  tools: 'Správcovia hesiel a nástroje',
  'account-care': 'Ochrana účtu',
  policy: 'Bezpečnostné pravidlá',
};

export const BADGES = {
  secret_key: { name: 'Ochranca tajného kľúča', icon: 'key', color: 'green', desc: 'Pomohol si Botovi ochrániť jeho tajný kľúč.' },
  weak_detector: { name: 'Detektor slabých hesiel', icon: 'search', color: 'blue', desc: 'Rozoznávaš slabé a predvídateľné heslá.' },
  uniqueness: { name: 'Majster jedinečnosti', icon: 'diamond', color: 'purple', desc: 'Vieš, prečo má mať každý účet iné heslo.' },
  phishing_hunter: { name: 'Lovec phishingu', icon: 'hook', color: 'cyan', desc: 'Odhaľuješ podvodné správy a odkazy.' },
  account_guardian: { name: 'Strážca účtov', icon: 'shield-check', color: 'blue', desc: 'Dokončil si úroveň Strážcovia účtov a vieš chrániť školský účet.' },
  mfa_expert: { name: 'Odborník na MFA', icon: 'phone', color: 'purple', desc: 'Vieš správne reagovať na žiadosti o druhý faktor.' },
  cyber_detective: { name: 'Cyber detektív', icon: 'eye', color: 'purple', desc: 'Dokončil si vyšetrovania a reakcie na incidenty.' },
  cyber_expert: { name: 'Cyber expert', icon: 'terminal', color: 'cyan', desc: 'Zvládol si realistické scenáre a navrhol bezpečnostný plán.' },
};

export const MODULES = [
  { id: 'password-quest', name: 'Password Quest', status: 'available', summary: 'Heslá, phishing, MFA a reakcia na incident.', levels: [level1, level2, level3, level4] },
];

export const PLANNED_MODULES = [
  { id: 'phishing-hunter', name: 'Phishing Hunter', icon: 'hook', summary: 'Rozpoznávanie podvodných e-mailov a správ.' },
  { id: 'digital-footprint', name: 'Digital Footprint', icon: 'globe', summary: 'Digitálna stopa a ochrana súkromia.' },
  { id: 'account-defender', name: 'Account Defender', icon: 'shield-check', summary: 'Ochrana účtov, MFA a bezpečné prihlasovanie.' },
  { id: 'ai-detective', name: 'AI Detective', icon: 'search', summary: 'Bezpečné používanie umelej inteligencie a rozpoznávanie podvodného obsahu.' },
  { id: 'social-media-guardian', name: 'Social Media Guardian', icon: 'users', summary: 'Bezpečnosť na sociálnych sieťach.' },
  { id: 'incident-response', name: 'Incident Response', icon: 'flag', summary: 'Postup pri bezpečnostnom incidente.' },
];

// Doplnenie identifikátorov úloh a kôl, aby ich nemusel autor obsahu písať ručne.
export const LEVELS = MODULES.flatMap((m) => m.levels);
for (const level of LEVELS) {
  level.tasks.forEach((task, ti) => {
    task.level = level.id;
    task.order = ti + 1;
    task.rounds.forEach((r, ri) => {
      r.id = `${task.id}r${ri + 1}`;
      r.topic = r.topic || task.topic;
    });
  });
}

export const ALL_TASKS = LEVELS.flatMap((l) => l.tasks);
export const getLevel = (id) => LEVELS.find((l) => l.id === Number(id));
export const getTask = (id) => ALL_TASKS.find((t) => t.id === id);
export const findRound = (roundId) => {
  for (const t of ALL_TASKS) {
    const r = t.rounds.find((x) => x.id === roundId);
    if (r) return { task: t, round: r };
  }
  return null;
};
