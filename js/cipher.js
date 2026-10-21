// Šifrovacie abecedy: zámena písmen podľa tabuľky (substitučná šifra). Bez DOM, bez ukladania.
// Slúži na Šifrovaciu abecedu (podstránka) a úlohy typu „cipher“. Nejde o ochranu hesiel:
// skutočné služby heslá neukladajú zašifrované, ale ako jednosmerný odtlačok (haš).

import { randomInt } from './util.js';

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Botova obrázková abeceda pre najmladších. Každé písmeno má iný obrázok.
const BOT = {
  A: '🍎', B: '🐝', C: '🌙', D: '🐬', E: '🥚', F: '🐸', G: '🍇', H: '🏠', I: '🍦', J: '🕹️', K: '🔑', L: '🦁', M: '🐭',
  N: '🥜', O: '🐙', P: '🐧', Q: '👑', R: '🌈', S: '☀️', T: '🌳', U: '☂️', V: '🎻', W: '🐳', X: '❌', Y: '🪀', Z: '🦓',
};

// Známa zámena znakov („leetspeak“). Programy útočníkov ju skúšajú automaticky.
const LEET = { A: '4', B: '8', E: '3', G: '9', I: '1', O: '0', S: '5', T: '7', Z: '2' };

export function caesar(shift) {
  const s = ((shift % 26) + 26) % 26;
  return Object.fromEntries([...LETTERS].map((l, i) => [l, LETTERS[(i + s) % 26]]));
}

// Vráti tabuľku zámen (písmeno -> znak) pre id abecedy alebo vlastnú tabuľku.
export function alphabet(id) {
  if (id && typeof id === 'object') return id;
  if (id === 'bot') return BOT;
  if (id === 'leet') return LEET;
  if (id === 'rot13') return caesar(13);
  const m = /^caesar(-?\d+)$/.exec(id || '');
  if (m) return caesar(Number(m[1]));
  throw new Error('Neznáma abeceda: ' + id);
}

// Písmená bez dĺžňov a mäkčeňov, veľkými písmenami (Ďateľ -> DATEL).
export function plain(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export function encode(text, id) {
  const map = alphabet(id);
  return [...plain(text)].map((ch) => (map[ch] != null ? map[ch] : ch)).join('');
}

// Rozšifruje text: hľadá najdlhšiu zhodu so znakmi abecedy (obrázky môžu mať viac znakov).
export function decode(text, id) {
  const map = alphabet(id);
  const reverse = Object.entries(map).map(([k, v]) => [v, k]).sort((a, b) => b[0].length - a[0].length);
  const s = String(text);
  let out = '';
  let i = 0;
  while (i < s.length) {
    const hit = reverse.find(([sym]) => sym && s.startsWith(sym, i));
    if (hit) { out += hit[1]; i += hit[0].length; } else { out += s[i].toUpperCase(); i += 1; }
  }
  return out;
}

// Porovnanie odpovede: bez ohľadu na veľkosť písmen, diakritiku, medzery a variačné selektory obrázkov.
export function same(a, b) {
  const n = (x) => plain(x).replace(/[\s️]/g, '');
  return n(a) === n(b);
}

// Náhodná osobná abeceda: každé písmeno dostane iný znak (kryptograficky bezpečná náhoda).
const POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?+=';
export function randomAlphabet() {
  const pool = [...POOL];
  return Object.fromEntries([...LETTERS].map((l) => [l, pool.splice(randomInt(pool.length), 1)[0]]));
}
