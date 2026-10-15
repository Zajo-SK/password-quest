// Výpočty nad uloženým postupom (bez zásahu do DOM).
import { getState, getTask as storedTask } from './store.js';
import { levels, allTasks, topicLabel } from './content/index.js';

export function taskStatus(task) {
  const saved = storedTask(task.id);
  const mastered = Object.keys(saved.mastered || {}).filter((k) => saved.mastered[k]).length;
  const st = getState();
  const inProgress = !!(st.resume && st.resume.taskId === task.id);
  return {
    mastered,
    total: task.rounds.length,
    done: !!saved.done,
    started: mastered > 0 || inProgress || (saved.plays || 0) > 0,
    inProgress,
  };
}

export function levelProgress(level) {
  const statuses = level.tasks.map(taskStatus);
  const doneTasks = statuses.filter((s) => s.done).length;
  return {
    doneTasks,
    totalTasks: level.tasks.length,
    masteredRounds: statuses.reduce((a, s) => a + s.mastered, 0),
    totalRounds: statuses.reduce((a, s) => a + s.total, 0),
    complete: doneTasks === level.tasks.length,
  };
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
  return Object.entries(by).map(([topic, s]) => ({ topic, label: topicLabel(topic), ...s, rate: s.total ? Math.round((s.ok / s.total) * 100) : 0 }));
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
  const tasks = allTasks();
  return { xp: st.xp, done: tasks.filter((x) => storedTask(x.id).done).length, total: tasks.length, badges: Object.keys(st.badges).length, levels: levels().length };
}
