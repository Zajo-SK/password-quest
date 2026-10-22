// Slovníček pojmov: vysvetlenia slov, ktoré žiaci nemusia poznať (doména, phishing, MFA…).
// V misiách sa prvý výskyt pojmu v texte zmení na tlačidlo, po ťuknutí sa ukáže vysvetlenie.
// Slovníček je zatiaľ len v slovenčine a angličtine; v iných jazykoch sa nič nezobrazuje.
// Každý pojem: id (rovnaké v oboch jazykoch), name (heslo v slovníčku), def (vysvetlenie),
// match (regulárny výraz bez zachytávacích skupín, hľadá sa bez ohľadu na veľkosť písmen).

import { h, clear } from './util.js';
import { icon } from './icons.js';
import { t, getLang } from './i18n.js';

const W = '\\p{L}*'; // ľubovoľná koncovka slova (doména, domény, doménu…)

export const GLOSSARY = {
  sk: [
    { id: 'domain', name: 'Doména', match: `domén${W}`, def: 'Meno webovej stránky, napríklad skola.example. V adrese ju nájdeš tesne pred prvým lomítkom. Podľa domény poznáš, komu stránka naozaj patrí.' },
    { id: 'lookalike', name: 'Dvojník domény', match: `dvojník${W}`, def: 'Adresa, ktorá vyzerá skoro ako skutočná, ale líši sa jedným znakom, napríklad schooI.example s veľkým I namiesto l. Podvodníci ju používajú, aby si ich nikto nevšimol.' },
    { id: 'https', name: 'https a zámok', match: 'https', def: 'Znamená, že spojenie so stránkou je šifrované a nikto po ceste ho neprečíta. Nehovorí však, či je stránka pravá. Zámok majú aj podvodné stránky.' },
    { id: 'short_link', name: 'Skrátený odkaz', match: `skráten${W} odkaz${W}`, def: 'Krátka adresa, ktorá ťa presmeruje inam. Nevidíš, kam naozaj vedie, preto ju podvodníci radi používajú.' },
    { id: 'qr', name: 'QR kód', match: `QR kód${W}`, def: 'Štvorcový obrázok, ktorý mobil prečíta fotoaparátom. Je v ňom ukrytý odkaz, takže môže viesť aj na podvodnú stránku.' },
    { id: 'phishing', name: 'Phishing', match: `(?:spear )?phishing${W}`, def: 'Podvod, pri ktorom ťa niekto správou, e-mailom alebo falošnou stránkou nahovára, aby si mu dal heslo, kód alebo peniaze. Názov pripomína anglické slovo „fishing“, teda rybárčenie.' },
    { id: 'deepfake', name: 'Deepfake', match: 'deepfake', def: 'Falošné video alebo hlas vytvorené umelou inteligenciou. Človek v ňom hovorí alebo robí niečo, čo v skutočnosti nikdy nepovedal ani neurobil.' },
    { id: 'mfa', name: 'MFA (viacfaktorové overovanie)', match: `MFA|viacfaktorov${W} overovan${W}|druh${W} faktor${W}`, def: 'Prihlásenie v dvoch krokoch: najprv heslo, potom ešte niečo ďalšie, napríklad potvrdenie v mobile, kód alebo odtlačok prsta. Samotné ukradnuté heslo potom nestačí.' },
    { id: 'auth_app', name: 'Overovacia aplikácia', match: `overovac${W} aplikác${W}`, def: 'Aplikácia v mobile, ktorá každých pár sekúnd ukazuje nový kód alebo sa ťa pýta, či sa práve prihlasuješ. Slúži ako druhý krok pri prihlásení.' },
    { id: 'code', name: 'Overovací kód', match: `overovac${W} kód${W}|kód z SMS`, def: 'Krátke číslo, ktoré ti príde v SMS alebo v aplikácii, keď sa prihlasuješ. Je ako kľúč k účtu, preto ho nikdy nikomu nehovor ani neposielaj.' },
    { id: 'security_key', name: 'Bezpečnostný kľúč', match: `(?:hardvérov${W} )?bezpečnostn${W} kľúč${W}`, def: 'Malé zariadenie, ktoré vyzerá ako USB kľúč. Pri prihlásení ho pripojíš alebo priložíš a ono potvrdí, že si to ty. Na falošnej stránke nefunguje.' },
    { id: 'passkey', name: 'Prístupový kľúč (passkey)', match: `prístupov${W} kľúč${W}|passkey${W}`, def: 'Prihlásenie bez hesla. V mobile alebo počítači je uložený tajný kľúč, ktorý odomkneš odtlačkom prsta, tvárou alebo PIN-om. Na falošnej stránke nefunguje.' },
    { id: 'biometrics', name: 'Biometria', match: `biometri${W}`, def: 'Prihlásenie pomocou tvojho tela, napríklad odtlačkom prsta alebo tvárou.' },
    { id: 'manager', name: 'Správca hesiel', match: `správc${W} hesiel`, def: 'Aplikácia, ktorá vytvára silné heslá, bezpečne ich ukladá a sama ich vypĺňa. Ty si pamätáš iba jedno hlavné heslo.' },
    { id: 'main_password', name: 'Hlavné heslo', match: `hlavn${W} hesl${W}`, def: 'Jediné heslo, ktoré otvára správcu hesiel. Musí byť dlhé, jedinečné a nikomu ho nehovoríš.' },
    { id: 'vault', name: 'Trezor', match: `trezor${W}`, def: 'Šifrované miesto v správcovi hesiel, kde sú uložené všetky heslá. Otvorí ho len hlavné heslo.' },
    { id: 'admin', name: 'Správca (školský)', match: `správc${W}`, def: 'Človek, ktorý sa v škole stará o počítače a účty žiakov. Keď sa s účtom niečo deje, povedz to jemu alebo učiteľovi.' },
    { id: 'leak', name: 'Únik údajov', match: `únik${W}|uniknut${W}`, def: 'Keď sa heslá alebo iné údaje z nejakej služby dostanú k cudzím ľuďom. Uniknuté heslo potom môžu skúšať aj inde.' },
    { id: 'incident', name: 'Incident', match: `incident${W}`, def: 'Bezpečnostný problém, napríklad keď niekto ukradne heslo alebo sa dostane do cudzieho účtu.' },
    { id: 'session', name: 'Relácia', match: `relác${W}`, def: 'Čas, keď si prihlásený na nejakom zariadení. Správca môže všetky relácie ukončiť, a tým odhlásiť aj útočníka.' },
    { id: 'forwarding', name: 'Preposielanie pošty', match: `preposielan${W}`, def: 'Nastavenie, ktoré automaticky posiela kópie tvojich e-mailov na inú adresu. Útočník si ho môže potajomky zapnúť.' },
    { id: 'extension', name: 'Prípona súboru', match: `prípon${W}`, def: 'Koniec názvu súboru za poslednou bodkou, napríklad .pdf alebo .exe. Prezrádza, čo je súbor naozaj zač. Súbor .exe je program.' },
    { id: 'macro', name: 'Makro', match: `makr${W}`, def: 'Malý program vo vnútri dokumentu. Ak ťa dokument prosí „povoliť makrá“, môže spustiť niečo škodlivé.' },
    { id: 'update', name: 'Aktualizácia', match: `aktualiz${W}`, def: 'Nová verzia programu alebo systému, ktorá opravuje chyby a bezpečnostné diery.' },
    { id: 'caesar', name: 'Caesarova šifra', match: `Caesarov${W} šifr${W}`, def: 'Stará šifra, pri ktorej sa každé písmeno posunie o pár miest v abecede, napríklad A → D. Počítač ju rozlúšti okamžite.' },
    { id: 'cipher', name: 'Šifra a šifrovanie', match: `šifr${W}`, def: 'Spôsob, ako zmeniť text na tajné písmo, ktoré prečíta len ten, kto pozná kľúč alebo tabuľku. Šifrovanie chráni správy a spojenie so stránkami.' },
    { id: 'leet', name: 'Zámena znakov', match: `zámen${W} znak${W}|leet${W}`, def: 'Nahradenie písmen podobnými znakmi, napríklad a → @ alebo o → 0. Programy útočníkov tieto zámeny skúšajú automaticky, preto heslo nezosilnia.' },
    { id: 'hash', name: 'Haš', match: `haš${W}`, def: 'Jednosmerný „odtlačok“ hesla. Služba si neukladá heslo, len jeho haš. Z hašu sa heslo nedá jednoducho vypočítať späť.' },
    { id: 'bits', name: 'Bity a entropia', match: `entropi${W}|bit(?:ov|y|u|och|mi)?`, def: 'Spôsob, ako zmerať silu náhodného hesla. Každý bit navyše znamená dvakrát viac možností, ktoré by musel útočník skúsiť.' },
    { id: 'hibp', name: 'Have I Been Pwned', match: 'Have I Been Pwned', def: 'Známa služba, ktorá ukáže, či sa tvoj e-mail alebo heslo objavili v niektorom úniku. Používaj ju s dospelým.' },
  ],
  en: [
    { id: 'domain', name: 'Domain', match: `domain${W}`, def: 'The name of a website, for example school.example. In an address, you find it right before the first slash. The domain tells you who the site really belongs to.' },
    { id: 'subdomain', name: 'Subdomain', match: `subdomain${W}`, def: 'A part added in front of a domain, for example portal.school.example. It still belongs to the owner of school.example.' },
    { id: 'lookalike', name: 'Lookalike domain', match: `lookalike${W}`, def: 'An address that looks almost like the real one but differs by one character, for example schooI.example with a capital I instead of l. Scammers use it so nobody notices.' },
    { id: 'https', name: 'https and the padlock', match: `https|padlock${W}`, def: 'It means the connection to the site is encrypted, so nobody on the way can read it. It does not tell you whether the site is genuine. Scam sites have a padlock too.' },
    { id: 'short_link', name: 'Short link', match: `short link${W}`, def: 'A short address that sends you somewhere else. You cannot see where it really goes, which is why scammers like it.' },
    { id: 'qr', name: 'QR code', match: `QR code${W}`, def: 'A square picture that a phone reads with its camera. It hides a link, so it can lead to a scam site too.' },
    { id: 'phishing', name: 'Phishing', match: `(?:spear )?phishing${W}`, def: 'A scam where someone uses a message, an email or a fake website to trick you into giving them a password, a code or money. The name sounds like “fishing”.' },
    { id: 'deepfake', name: 'Deepfake', match: 'deepfake', def: 'A fake video or voice made with artificial intelligence. The person in it says or does something they never really said or did.' },
    { id: 'mfa', name: 'MFA (multi-factor authentication)', match: `MFA|multi-factor authentication|second factor${W}`, def: 'Logging in in two steps: first your password, then something else, such as a confirmation on your phone, a code or a fingerprint. A stolen password alone is then not enough.' },
    { id: 'auth_app', name: 'Authenticator app', match: `authenticator app${W}`, def: 'A phone app that shows a new code every few seconds or asks whether you are logging in right now. It is the second step when you log in.' },
    { id: 'code', name: 'Verification code', match: `verification code${W}|one-time code${W}`, def: 'A short number you get by text message or in an app when you log in. It is like a key to your account, so never tell it to anyone or send it anywhere.' },
    { id: 'security_key', name: 'Security key', match: `(?:hardware )?security key${W}`, def: 'A small device that looks like a USB stick. When you log in, you plug it in or tap it, and it confirms it is you. It does not work on a fake site.' },
    { id: 'passkey', name: 'Passkey', match: `passkey${W}`, def: 'Logging in without a password. A secret key is stored on your phone or computer, and you unlock it with your fingerprint, face or PIN. It does not work on a fake site.' },
    { id: 'biometrics', name: 'Biometrics', match: `biometric${W}`, def: 'Logging in with your body, for example with your fingerprint or your face.' },
    { id: 'manager', name: 'Password manager', match: `password manager${W}`, def: 'An app that creates strong passwords, stores them safely and fills them in for you. You only remember one main password.' },
    { id: 'main_password', name: 'Main password', match: `main password${W}`, def: 'The one password that opens your password manager. It must be long and unique, and you never tell it to anyone.' },
    { id: 'vault', name: 'Vault', match: `vault${W}`, def: 'The encrypted place in a password manager where all your passwords are kept. Only the main password opens it.' },
    { id: 'admin', name: 'Administrator', match: `administrator${W}`, def: 'The person at school who looks after the computers and students’ accounts. If something is wrong with your account, tell them or a teacher.' },
    { id: 'leak', name: 'Data leak', match: `leak${W}|breach${W}`, def: 'When passwords or other data from a service end up with strangers. A leaked password may then be tried on other services too.' },
    { id: 'incident', name: 'Incident', match: `incident${W}`, def: 'A security problem, for example when someone steals a password or gets into someone else’s account.' },
    { id: 'session', name: 'Session', match: `session${W}`, def: 'The time you are logged in on a device. The administrator can end all sessions and so log out an attacker too.' },
    { id: 'forwarding', name: 'Mail forwarding', match: `forwarding`, def: 'A setting that automatically sends copies of your emails to another address. An attacker can secretly turn it on.' },
    { id: 'extension', name: 'File extension', match: `(?:last |real )?extension${W}`, def: 'The end of a file name after the last dot, for example .pdf or .exe. It shows what the file really is. An .exe file is a program. (A browser extension is something else: an add-on for your browser.)' },
    { id: 'macro', name: 'Macro', match: `macro${W}`, def: 'A small program inside a document. If a document asks you to “enable macros”, it may run something harmful.' },
    { id: 'update', name: 'Update', match: `update${W}`, def: 'A new version of an app or system that fixes mistakes and security holes.' },
    { id: 'caesar', name: 'Caesar cipher', match: `Caesar cipher${W}`, def: 'An old cipher where each letter moves a few places along the alphabet, for example A → D. A computer cracks it instantly.' },
    { id: 'cipher', name: 'Cipher and encryption', match: `cipher${W}|encrypt${W}`, def: 'A way of turning text into secret writing that only someone with the key or the table can read. Encryption protects messages and the connection to websites.' },
    { id: 'leet', name: 'Character swaps', match: `character swap${W}|leetspeak`, def: 'Replacing letters with similar-looking characters, for example a → @ or o → 0. Attackers’ programs try these swaps automatically, so they do not make a password stronger.' },
    { id: 'hash', name: 'Hash', match: `hash${W}`, def: 'A one-way “fingerprint” of a password. A service does not store your password, only its hash. The password cannot simply be calculated back from the hash.' },
    { id: 'bits', name: 'Bits and entropy', match: `entropy|bits`, def: 'A way of measuring how strong a random password is. Every extra bit means twice as many possibilities an attacker would have to try.' },
    { id: 'hibp', name: 'Have I Been Pwned', match: 'Have I Been Pwned', def: 'A well-known service that shows whether your email or password has appeared in a leak. Use it with an adult.' },
  ],
};

const compiled = {};
function forLang(lang) {
  const list = GLOSSARY[lang];
  if (!list) return null;
  if (!compiled[lang]) {
    // Jeden výraz so skupinou pre každý pojem. Dlhšie pojmy sú skôr, aby „správca hesiel“ vyhral nad „správca“.
    const order = [...list].sort((a, b) => b.match.length - a.match.length);
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${order.map((x) => `(${x.match})`).join('|')})(?![\\p{L}])`, 'giu');
    compiled[lang] = { list, order, re };
  }
  return compiled[lang];
}

export const glossaryFor = (lang = getLang()) => GLOSSARY[lang] || [];

// Nájde všetky výskyty pojmov v texte: [{ term, index, text }].
export function findTerms(text, lang = getLang()) {
  const c = forLang(lang);
  if (!c || !text) return [];
  const out = [];
  c.re.lastIndex = 0;
  for (const m of String(text).matchAll(c.re)) {
    const gi = m.slice(1).findIndex((g) => g !== undefined);
    out.push({ term: c.order[gi], index: m.index, text: m[0] });
  }
  return out;
}

// Pojmy, ktoré sa vyskytujú v ľubovoľných textoch (napr. v celej misii), v poradí slovníčka.
export function termsIn(texts, lang = getLang()) {
  const ids = new Set(texts.flatMap((x) => findTerms(x, lang).map((f) => f.term.id)));
  return glossaryFor(lang).filter((x) => ids.has(x.id));
}

// Všetky texty v objekte (misia, kolo), okrem identifikátorov a adries.
export function textsOf(obj) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!['id', 'url', 'icon', 'type', 'kind', 'topic', 'badge', 'alphabet', 'mode', 'answer'].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(obj);
  return out;
}

/* ---------- Tlačidlá pojmov v texte a okno s vysvetlením ---------- */

// Pojmy sa nevkladajú do tlačidiel, odkazov, polí, kódu ani ukážok správ (tie majú vyzerať ako skutočné).
const SKIP = 'button, a, label, input, textarea, select, code, .term, .mock, [data-noterms]';

let pop = null;
let openBtn = null;

function closePop(returnFocus) {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  if (openBtn) {
    openBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) openBtn.focus();
  }
  openBtn = null;
}

function ensurePop() {
  if (pop) return pop;
  pop = h('div', { id: 'term-pop', class: 'term-pop', role: 'dialog', hidden: true });
  document.body.append(pop);
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.term')) closePop(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(true); });
  window.addEventListener('hashchange', () => closePop(false));
  window.addEventListener('resize', () => closePop(false));
  return pop;
}

function showPop(btn, term) {
  const p = ensurePop();
  if (openBtn === btn && !p.hidden) { closePop(true); return; }
  closePop(false);
  clear(p);
  p.setAttribute('aria-label', term.name);
  p.append(
    h('div', { class: 'term-pop-head' }, icon('book', 20), h('strong', null, term.name),
      h('button', { type: 'button', class: 'term-pop-close', 'aria-label': t('gl.close'), onclick: () => closePop(true) }, icon('x', 18))),
    h('p', null, term.def),
    h('a', { href: '#/glossary', class: 'small' }, t('gl.all_link')));
  p.hidden = false;
  openBtn = btn;
  btn.setAttribute('aria-expanded', 'true');
  // Okno pod slovom, vodorovne vždy celé na obrazovke.
  const r = btn.getBoundingClientRect();
  const width = Math.min(340, document.documentElement.clientWidth - 32);
  p.style.width = width + 'px';
  const left = Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - width - 16));
  p.style.left = left + 'px';
  p.style.top = (r.bottom + window.scrollY + 8) + 'px';
}

function termButton(text, term) {
  const btn = h('button', { type: 'button', class: 'term', 'aria-expanded': 'false', 'aria-controls': 'term-pop', title: t('gl.term_aria', { term: term.name }) }, text);
  btn.addEventListener('click', (e) => { e.stopPropagation(); showPop(btn, term); });
  return btn;
}

// Prvý výskyt každého pojmu v `root` zmení na tlačidlo s vysvetlením. `seen` sú pojmy, ktoré už boli označené.
export function annotate(root, seen = new Set(), lang = getLang()) {
  if (!forLang(lang) || !root) return seen;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const found = findTerms(node.nodeValue, lang).filter((f) => !seen.has(f.term.id));
    if (!found.length) continue;
    const frag = document.createDocumentFragment();
    let pos = 0;
    const text = node.nodeValue;
    for (const f of found) {
      if (seen.has(f.term.id) || f.index < pos) continue;
      seen.add(f.term.id);
      frag.append(text.slice(pos, f.index), termButton(f.text, f.term));
      pos = f.index + f.text.length;
    }
    frag.append(text.slice(pos));
    node.replaceWith(frag);
  }
  return seen;
}

// Sleduje `root` a označuje pojmy aj v neskôr pridanom texte (napr. vo vysvetlení po odpovedi). Vráti funkciu na ukončenie.
export function watchTerms(root, lang = getLang()) {
  if (!forLang(lang)) return () => {};
  const seen = annotate(root, new Set(), lang);
  const obs = new MutationObserver((records) => {
    obs.disconnect();
    records.forEach((r) => r.addedNodes.forEach((n) => { if (n.nodeType === 1 && !n.closest('.term')) annotate(n, seen, lang); }));
    obs.observe(root, { childList: true, subtree: true });
  });
  obs.observe(root, { childList: true, subtree: true });
  return () => { obs.disconnect(); closePop(false); };
}

// Rozbaľovací slovníček pojmov, ktoré sa vyskytujú v danom obsahu (misia alebo kolo).
export function glossaryBox(obj, titleKey) {
  const terms = termsIn(textsOf(obj));
  if (!terms.length) return null;
  return h('details', { class: 'glossary-box', 'data-noterms': '' },
    h('summary', null, icon('book', 20), ' ', t(titleKey, { n: terms.length })),
    h('dl', null, terms.flatMap((x) => [h('dt', null, x.name), h('dd', null, x.def)])),
    h('p', { class: 'small' }, h('a', { href: '#/glossary' }, t('gl.all_link'))));
}

// Samostatná stránka Slovníček.
export function renderGlossaryPage(root) {
  const list = [...glossaryFor()].sort((a, b) => a.name.localeCompare(b.name, getLang()));
  root.append(
    h('section', { class: 'page-head' }, h('h1', { tabindex: '-1' }, icon('book', 36), ' ', t('gl.title')), h('p', { class: 'lead' }, t('gl.lead'))),
    list.length
      ? h('section', { class: 'card glossary-page', 'data-noterms': '' }, h('dl', null, list.flatMap((x) => [h('dt', { id: 'gl-' + x.id }, x.name), h('dd', null, x.def)])))
      : h('p', { class: 'banner banner-info' }, icon('info', 22), h('span', null, t('gl.empty'))));
}
