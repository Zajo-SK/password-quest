// Lokálne ukladanie NEOSOBNÉHO herného postupu (body, odznaky, štatistiky úloh).
// Nikdy sa sem neukladá obsah Password Lab ani žiadne heslo.

const KEY = 'pq.progress.v1';

const defaults = () => ({
  v: 1,
  xp: 0,
  xpMap: {},            // kľúč -> získané XP (každé XP sa počíta len raz)
  tasks: {},            // taskId -> { mastered: {idx:true}, done: bool, plays: n }
  badges: {},           // badgeId -> ISO dátum
  stats: { topics: {}, rounds: {} }, // topic/round -> {ok, total} (prvý pokus)
  resume: null,         // rozpracovaná misia
  session: null,        // relácia triedy {code, level, missions}
  settings: {},
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && o.v === 1) return { ...defaults(), ...o, stats: { ...defaults().stats, ...(o.stats || {}) } };
    }
  } catch (e) { /* úložisko nemusí byť dostupné – pokračujeme v pamäti */ }
  return defaults();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoruj */ }
  listeners.forEach((fn) => fn(state));
}

export const getState = () => state;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// Pripočíta XP, ak je suma väčšia než doteraz získaná pod rovnakým kľúčom. Vráti rozdiel.
export function awardXp(key, amount) {
  const prev = state.xpMap[key] || 0;
  if (amount <= prev) return 0;
  state.xpMap[key] = amount;
  state.xp += amount - prev;
  save();
  return amount - prev;
}

export function addBadge(id) {
  if (state.badges[id]) return false;
  state.badges[id] = new Date().toISOString();
  save();
  return true;
}

export function getTask(taskId) {
  return state.tasks[taskId] || { mastered: {}, done: false, plays: 0 };
}

export function setTask(taskId, patch) {
  state.tasks[taskId] = { ...getTask(taskId), ...patch };
  save();
}

export function recordRound(roundKey, topic, ok) {
  for (const [bucket, key] of [['topics', topic], ['rounds', roundKey]]) {
    const b = state.stats[bucket][key] || { ok: 0, total: 0 };
    b.total += 1;
    if (ok) b.ok += 1;
    state.stats[bucket][key] = b;
  }
  save();
}

export function setResume(run) {
  state.resume = run;
  save();
}

export function setSession(session) {
  state.session = session;
  save();
}

export function resetTask(taskId) {
  delete state.tasks[taskId];
  if (state.resume && state.resume.taskId === taskId) state.resume = null;
  save();
}

export function resetAll() {
  state = defaults();
  save();
}
