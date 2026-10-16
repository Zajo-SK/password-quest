// Ikony (stroke, 24x24) a maskot Bot. Všetko je inline SVG – žiadne externé súbory.
import { t } from './i18n.js';

const SHIELD = '<path d="M12 3l7 3v5c0 5-3 8.500-7 10-4-1.500-7-5-7-10V6z"/>';

const PATHS = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.500-2"/>',
  shield: SHIELD,
  'shield-check': SHIELD + '<path d="M9 12l2 2 4-4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><circle cx="9.500" cy="13" r="1.200"/><circle cx="14.500" cy="13" r="1.200"/><path d="M9.500 16.500h5M3 12v3M21 12v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  star: '<path d="M12 3l2.700 5.600 6.100.800-4.500 4.200 1.100 6L12 16.800 6.600 19.600l1.100-6L3.200 9.400l6.100-.8z"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 20h8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  forward: '<path d="M9 5l7 7-7 7"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.700.600 1 1.300 1 2.100h5c0-.800.300-1.500 1-2.100A6 6 0 0 0 12 3z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  hook: '<path d="M12 3v11a4 4 0 1 1-4-4"/><circle cx="12" cy="3" r="1"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18M10.500 6.200A9.700 9.700 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.200 3.700M6.600 7.600C3.800 9.400 2 12 2 12s4 7 10 7a9.600 9.600 0 0 0 4-.900"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14a6.500 6.500 0 0 1 3.500 6"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 13.500-5.800L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.500 5.800L4 15M4 20v-5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.1"/>',
  warning: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.1"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6"/>',
  phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/>',
  diamond: '<path d="M12 3l8 9-8 9-8-9z"/>',
  home: '<path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6v.1M4 12v.1M4 18v.1"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.600 0l3-3a4 4 0 0 0-5.600-5.600l-1 1M14 10a4 4 0 0 0-5.600 0l-3 3a4 4 0 0 0 5.600 5.600l1-1"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.500 8.500v.1M15.500 8.500v.1M12 12v.1M8.500 15.500v.1M15.500 15.500v.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-3 0-5-1-5-3s3-2 5 3c2-5 5-5 5-3s-2 3-5 3"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.500-7.900A6 6 0 0 1 18 9a4.500 4.500 0 0 1-.500 9z"/>',
  clip: '<path d="M20 11.500l-7.800 7.800a5 5 0 0 1-7.100-7.100l8.500-8.500a3.300 3.300 0 0 1 4.700 4.700l-8.500 8.500a1.700 1.700 0 0 1-2.400-2.400l7.800-7.800"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
};

export function icon(name, size = 24, cls = '') {
  const span = document.createElement('span');
  span.className = ('icon ' + cls).trim();
  span.setAttribute('aria-hidden', 'true');
  span.style.setProperty('--s', size + 'px');
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" focusable="false">${PATHS[name] || PATHS.info}</svg>`;
  return span;
}

const MOODS = {
  happy: { eyes: '<circle cx="48" cy="60" r="5" fill="#2de2e6"/><circle cx="72" cy="60" r="5" fill="#2de2e6"/>', mouth: '<path d="M46 72q14 14 28 0" fill="none" stroke="#2de2e6" stroke-width="4" stroke-linecap="round"/>' },
  cheer: { eyes: '<path d="M42 62q6-9 12 0M66 62q6-9 12 0" fill="none" stroke="#3ddc97" stroke-width="4" stroke-linecap="round"/>', mouth: '<path d="M46 70q14 18 28 0z" fill="#3ddc97"/>' },
  think: { eyes: '<circle cx="48" cy="60" r="5" fill="#2de2e6"/><circle cx="72" cy="60" r="5" fill="#2de2e6"/><path d="M40 50l16-4" stroke="#2de2e6" stroke-width="3" stroke-linecap="round"/>', mouth: '<path d="M50 75h20" stroke="#2de2e6" stroke-width="4" stroke-linecap="round"/>' },
  oops: { eyes: '<circle cx="48" cy="60" r="4" fill="#ffb84d"/><circle cx="72" cy="60" r="4" fill="#ffb84d"/>', mouth: '<path d="M48 78q12-9 24 0" fill="none" stroke="#ffb84d" stroke-width="4" stroke-linecap="round"/><path d="M92 36q5 8 0 12q-5-4 0-12z" fill="#4c8dff"/>' },
};

export function bot(mood = 'happy', size = 96) {
  const m = MOODS[mood] || MOODS.happy;
  const wrap = document.createElement('span');
  wrap.className = 'bot bot-' + mood;
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', t('bot.aria'));
  wrap.innerHTML = `<svg viewBox="0 0 120 120" width="${size}" height="${size}" focusable="false" aria-hidden="true">
    <line x1="60" y1="14" x2="60" y2="30" stroke="#8fa6e8" stroke-width="4" stroke-linecap="round"/>
    <circle class="bot-led" cx="60" cy="11" r="6" fill="#3ddc97"/>
    <rect x="10" y="52" width="9" height="20" rx="4" fill="#8b6bff"/><rect x="101" y="52" width="9" height="20" rx="4" fill="#8b6bff"/>
    <rect x="20" y="28" width="80" height="66" rx="24" fill="#4c8dff"/>
    <rect x="30" y="40" width="60" height="44" rx="16" fill="#0a1230"/>
    ${m.eyes}${m.mouth}
    <rect x="40" y="96" width="40" height="18" rx="9" fill="#8b6bff"/>
    <path d="M60 99l7 3v4c0 3-3 5-7 7-4-2-7-4-7-7v-4z" fill="#eaf1ff" opacity=".9"/>
  </svg>`;
  return wrap;
}
