// Výpočty nad uloženým postupom (bez zásahu do DOM).
import { getState, getTask as storedTask } from './store.js';
import { LEVELS, TOPICS } from './content/index.js';

export function taskStatus(task) {
  const t = storedTask(task.id);
  const mastered = Object.keys(t.mastered || {}).filter((k) => t.mastered[k]).length;
  const st = getState();
  const inProgress = st.resume && st.resume.taskId === task.id;
  return {
    mastered,
    total: task.rounds.length,
    done: !!t.done,
    started: mastered > 0 || inProgress || (t.plays || 0) > 0,
    inProgress: !!inProgress,
  };
}

export function levelProgress(level) {
  const statuses = level.tasks.map(taskStatus);
  const doneTasks = statuses.filter((s) => s.done).length;
  const masteredRounds = statuses.reduce((a, s) => a + s.mastered, 0);
  const totalRounds = statuses.reduce((a, s) => a + s.total, 0);
  return { doneTasks, totalTasks: level.tasks.length, masteredRounds, totalRounds, complete: doneTasks === level.tasks.length };
}

// Úspešnosť v témach pre jednu úroveň (podľa prvých pokusov uložených pre kolá tejto úrovne).
export function levelTopicStats(level) {
  const rounds = getState().stats.rounds;
  const by = {};
  for (const task of level.tasks) {
    for (const r of task.rounds) {
      const s = rounds[r.id];
      if (!s) continue;
      const b = by[r.topic] || { ok: 0, total: 0 };
      b.ok += s.ok;
      b.total += s.total;
      by[r.topic] = b;
    }
  }
  return Object.entries(by).map(([topic, s]) => ({ topic, label: TOPICS[topic] || topic, ...s, rate: s.total ? Math.round((s.ok / s.total) * 100) : 0 }));
}

export function xpForLevel(level) {
  const map = getState().xpMap;
  let sum = 0;
  for (const task of level.tasks) {
    for (const key of Object.keys(map)) if (key.startsWith(task.id + ':')) sum += map[key];
  }
  return sum;
}

export function overall() {
  const st = getState();
  const done = LEVELS.flatMap((l) => l.tasks).filter((t) => storedTask(t.id).done).length;
  const total = LEVELS.flatMap((l) => l.tasks).length;
  return { xp: st.xp, done, total, badges: Object.keys(st.badges).length };
}
