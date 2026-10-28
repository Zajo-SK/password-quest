# Architektúra

## Princípy

1. **Obsah je oddelený od vykresľovania.** Úlohy sú čisté objekty v `js/content/<jazyk>/`. Engine (`js/engine.js`) pozná iba typy úloh.
2. **Bez buildu a závislostí.** ES moduly, žiadny npm balík. Dá sa hostovať na akomkoľvek statickom serveri.
3. **Súkromie najprv.** Do úložiska ide len neosobný postup. Heslá zadané v Dielni hesiel nikdy neopustia pole formulára.

## Jazyky

- `js/i18n.js` drží zvolený jazyk a poskytuje `t('kľúč', {premenné})`. Hodnota v slovníku je text s `{premennými}` alebo funkcia (napríklad pre slovenské množné číslo `skPlural`).
- `js/i18n/sk.js` a `js/i18n/en.js` obsahujú všetky texty rozhrania vrátane Dielne hesiel a učiteľského režimu.
- `js/content/index.js` načíta obsah oboch jazykov a cez funkcie `levels()`, `getTask()`, `topicLabel()`, `badge()` vracia obsah aktuálneho jazyka.
- Obsah v rôznych jazykoch musí mať rovnakú štruktúru (identifikátory, poradie možností, správne odpovede, kategórie, poradie krokov). Postup a štatistiky sú uložené podľa identifikátorov, preto platia v každom jazyku. Zhodu kontroluje test v `tests/index.html`.
- Po prepnutí jazyka sa aktuálna obrazovka vykreslí znova. Rozpracovaná misia pokračuje od posledného uloženého kola.

## Prepínače funkcií

`js/config.js` obsahuje `FEATURES`. Učiteľský režim (`FEATURES.teacher`) je zatiaľ vypnutý: nezobrazuje sa v navigácii ani na úvode a jeho adresy vracajú obrazovku „Stránka sa nenašla“.

## Tok údajov

```
content/* ──► engine.js ──► DOM (h())
                │
                ├─► store.js (localStorage: xp, odznaky, postup, štatistiky)
                └─► progress.js (výpočty pre views a teacher)
```

Router (`main.js`) je založený na `location.hash`. Dá sa preto obnoviť stránka aj používať tlačidlá späť/dopredu:

| Hash | Obrazovka |
| --- | --- |
| `#/` | úvod |
| `#/levels` | tréning hesiel (úrovne modulu Password Quest), položka „Heslá“ v menu |
| `#/email` | Detektív e-mailov (úrovne modulu `email-detective`), samostatná položka v menu |
| `#/level/ID`, `#/level/ID/summary`, `#/certificate/ID` | úroveň, hodnotenie, certifikát (v menu svieti tréning, ku ktorému úroveň patrí) |
| `#/task/ID` | misia |
| `#/lab` | Dielňa hesiel |
| `#/materials` | materiály pre učiteľov (vzorové hodiny na stiahnutie z `materials/`) |
| `#/teacher`, `#/present/ID`, `#/join/KOD/N/misie` | učiteľský režim (len ak je `FEATURES.teacher` zapnutý) |
| `#/howto`, `#/learn`, `#/progress` | návody, obsah, postup |

## Typy úloh

| Typ | Helper | Popis |
| --- | --- | --- |
| `choice` | `choice()` | jedna správna odpoveď, každá možnosť má vysvetlenie |
| `multi` | `multi()` | viac správnych odpovedí |
| `rows` | `rows()`, `rowsPer()` | triedenie do kategórií, alebo výber pravidla pre každú oblasť |
| `hotspot` | `hotspot()` | označovanie podozrivých častí správy (alebo „správa je v poriadku“) |
| `order` | `order()` | zostavenie plánu v poradí priority, zavádzajúce kroky sú `tier: null` |
| `reuse` | ručne | simulácia úniku pri opakovanom hesle (momentálne ho žiadna misia nepoužíva) |
| `lab` | ručne | úloha v Dielni hesiel; splnená, keď kontrola ukáže „Silné“ (voliteľný vymyslený `profile`) |
| `inbox` | `inbox()`, `mail()` | simulovaná schránka: žiak otvorí každý e-mail a označí ho „v poriadku“ alebo „podvod“ |
| `cipher` | `cipher()` | šifra: rozlúštiť (`mode: 'decode'`) alebo zašifrovať (`'encode'`) slovo podľa abecedy (`bot`, `leet`, `caesarN`, `rot13` alebo vlastná tabuľka); s `choices` sa vyberá, bez nich sa odpoveď píše |

Ukážky (`mock`): `email` (voliteľne s prílohou `attachment`), `sms`, `push` (prihlasovacie upozornenie), `timeline` (časová os incidentu), `chat` (konverzácia: `messages` so `who`, `me` a `parts`) a `page` (webová stránka: `url`, `title`, `paragraphs`, `fields`, `button`). V `email`, `chat` a `page` môžu byť časti na označenie (`pick`, `flag`, `why`) pre úlohy `hotspot`; zoznam všetkých častí vráti `mockParts()`.

## Pridanie obsahu

**Nová úloha:** pridaj kolo do `rounds` existujúcej misie. Identifikátory (`l2t1r3`) a téma sa doplnia automaticky v `content/index.js`.

**Nová misia:** pridaj objekt do `tasks` úrovne: `id`, `title`, `icon`, `topic`, `intro`, `rounds` a voliteľne `badge`, `planTitle`. Ďalšie misie možno pridať aj do `content/<jazyk>/extra.js` pod id úrovne; zaradia sa na koniec jej zoznamu.

**Moduly:** `password-quest` (úrovne s id 1–4) a `email-detective` (Detektív e-mailov, úrovne `e1`–`e4` v `content/<jazyk>/email.js`). Každý modul má 4 úrovne; poradie úrovne v module (`level.n`) je zároveň stupeň obtiažnosti. Výber úrovní, úvod a postup zobrazujú moduly samostatne.

**Nový modul (napr. Digital Footprint):**

1. Vytvor súbor s úrovňami v `js/content/sk/` aj `js/content/en/` (vzor: `email.js`). Id úrovní a misií musia byť jedinečné naprieč modulmi.
2. Pridaj ho do `MODULES` a `CONTENT` v `js/content/index.js`, názov a popis do `MODULES` v `meta.js` a odstráň ho zo zoznamu pripravovaných (`PLANNED_ICONS` a `PLANNED`).
3. Doplň nové odznaky (`BADGE_STYLE` v `index.js`, názvy v `meta.js`) a témy (`TOPICS` v `meta.js` a popisy `learn.topic.*` v slovníkoch).
4. Ak je potrebný nový typ úlohy, pridaj renderer do `RENDERERS` v `engine.js`, popis do `renderPresentation()` a jeho texty do oboch slovníkov.
5. Pridaj súbory do `sw.js` (zoznam offline súborov) a spusti `/tests/`.

Tak isto sa dá obsah neskôr načítavať aj zo servera (JSON v rovnakom tvare), bez zásahu do enginu.

## Bodovanie

- správna odpoveď na prvý pokus: 100 XP
- správna odpoveď po vysvetlení pri opakovaní: 50 XP
- séria troch správnych za sebou: +25 XP
- dokončená misia: +200 XP, dokončená úroveň: +300 XP
- každé XP sa počíta len raz za úlohu (kľúč `misia:kolo`), opakovanie môže iba doplniť rozdiel (50 → 100)
- chyby nikdy neuberajú body

Misia je dokončená, keď je každé kolo aspoň raz zvládnuté. Odznak úrovne a certifikát sa udeľujú až po dokončení všetkých misií, nie za samotné otvorenie aplikácie.

## Prístupnosť

Natívne tlačidlá a rádiá, viditeľný focus, `aria-live` pre spätnú väzbu, ovládanie klávesnicou, kontrast na tmavom pozadí, minimálna veľkosť ovládacích prvkov 44–48 px, `prefers-reduced-motion`, farba nikdy nie je jediným signálom (pri odpovediach sú aj ikony ✓ a ✗).
