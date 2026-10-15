# Architektúra

## Princípy

1. **Obsah je oddelený od vykresľovania.** Úlohy sú čisté objekty v `js/content/`. Engine (`js/engine.js`) pozná iba typy úloh.
2. **Bez buildu a závislostí.** ES moduly, žiadny npm balík. Dá sa hostovať na akomkoľvek statickom serveri.
3. **Súkromie najprv.** Do úložiska ide len neosobný postup. Heslá zadané v Password Lab nikdy neopustia pole formulára.

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
| `#/levels`, `#/level/N`, `#/level/N/summary`, `#/certificate/N` | úrovne, hodnotenie, certifikát |
| `#/task/ID` | misia |
| `#/lab` | Password Lab |
| `#/teacher`, `#/present/ID`, `#/join/KOD/N/misie` | učiteľský režim |
| `#/howto`, `#/learn`, `#/progress` | návody, obsah, postup |

## Typy úloh

| Typ | Helper | Popis |
| --- | --- | --- |
| `choice` | `choice()` | jedna správna odpoveď, každá možnosť má vysvetlenie |
| `multi` | `multi()` | viac správnych odpovedí |
| `rows` | `rows()`, `rowsPer()` | triedenie do kategórií, alebo výber pravidla pre každú oblasť |
| `hotspot` | `hotspot()` | označovanie podozrivých častí správy (alebo „správa je v poriadku“) |
| `order` | `order()` | zostavenie plánu v poradí priority, zavádzajúce kroky sú `tier: null` |
| `reuse` | ručne | simulácia úniku pri opakovanom hesle |
| `lab` | ručne | úloha v Password Lab s cieľmi (`minLen`, `noIssues`) |

Ukážky (`mock`): `email`, `sms`, `push` (prihlasovacie upozornenie), `timeline` (časová os incidentu).

## Pridanie obsahu

**Nová úloha:** pridaj kolo do `rounds` existujúcej misie. Identifikátory (`l2t1r3`) a téma sa doplnia automaticky v `content/index.js`.

**Nová misia:** pridaj objekt do `tasks` úrovne: `id`, `title`, `icon`, `topic`, `minutes`, `intro`, `rounds` a voliteľne `badge`, `timer`, `planTitle`.

**Nový modul (napr. Phishing Hunter):**

1. Vytvor `js/content/phishing-hunter.js` s exportom úrovní, rovnakého tvaru ako `level1.js`.
2. Pridaj ho do `MODULES` v `js/content/index.js` a odstráň z `PLANNED_MODULES`.
3. Doplň nové odznaky do `BADGES` a témy do `TOPICS`.
4. Ak je potrebný nový typ úlohy, pridaj renderer do `RENDERERS` v `engine.js` a popis v `renderPresentation()`.
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
