# PASSWORD QUEST

*Chráň svoj digitálny svet.* Interaktívna vzdelávacia hra o bezpečných heslách a základoch kybernetickej bezpečnosti pre školy. Celé rozhranie je v slovenčine.

- 4 úrovne podľa veku (6–8, 9–11, 12–14, 15–18 rokov), 16 misií a 83 interaktívnych úloh
- Password Lab: lokálna, vysvetliteľná kontrola ukážkových hesiel a generátor ukážkových fráz
- Body (XP), 8 odznakov, záverečné hodnotenie úrovne a certifikát za preukázané zvládnutie
- Opakovanie nesprávne zodpovedaných úloh, rozpracovaná misia sa po obnovení stránky dá dokončiť
- Učiteľský režim: relácia triedy s náhodným kódom, premietanie úloh, súhrn tém, export CSV
- Bez registrácie, bez mien, e-mailov a bez skutočných hesiel

## Spustenie

Aplikácia je čisto statická (HTML, CSS a JavaScript moduly). Nepotrebuje inštaláciu ani build.

```bash
python3 -m http.server 8080
```

Potom otvor <http://localhost:8080>. Súbory sa nesmú otvárať priamo cez `file://`, pretože prehliadače blokujú ES moduly.

## Nasadenie na školský web alebo server

Skopíruj celý priečinok (bez `tests/` a `docs/`, ak ich nechceš zverejniť) na ľubovoľný statický hosting: nginx, Apache, školský web, GitHub Pages, Netlify. Odporúčame HTTPS. Ten je potrebný aj pre offline režim (service worker) a kopírovanie odkazu v učiteľskom režime.

Odporúčané hlavičky (voliteľné, ak ich server vie nastaviť): `Content-Security-Policy` (v `index.html` už je ako `<meta>`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.

## Testy

Otvor `/tests/` na lokálnom serveri. Stránka spustí kontroly analyzátora hesiel, integrity obsahu (jedna správna odpoveď, vysvetlenia, odznaky, len fiktívne domény), kódov tried a overí, že sa testovacie heslá nedostali do úložiska. Výsledok je v nadpise stránky (`TESTY OK`).

Manuálne bola overená aj celá hra: všetkých 16 misií prešlo scenárom „prvá odpoveď zle, zvyšok správne“ vrátane opakovania, odznakov, záverečného hodnotenia, relácie triedy, premietania, exportu CSV a rozloženia na šírke 375 px bez horizontálneho posúvania.

## Štruktúra

```
index.html          vstup (CSP meta, skip link)
css/styles.css      dizajnový systém (tmavý herný štýl, tokeny v :root, reduced motion, tlač)
js/main.js          hash router, navigácia, offline registrácia
js/engine.js        vykresľovanie a vyhodnocovanie typov úloh, body, odznaky, premietanie
js/views.js         úvod, úrovne, hodnotenie, certifikát, postup, návody
js/lab.js           Password Lab a generátor ukážkových fráz
js/analyzer.js      vysvetliteľná kontrola hesiel (len v prehliadači)
js/teacher.js       učiteľský režim, relácia triedy, premietanie, CSV
js/store.js         ukladanie neosobného postupu do localStorage
js/progress.js      výpočty nad postupom
js/content/         OBSAH: úrovne, misie, otázky, vysvetlenia, odznaky, témy
docs/               architektúra a návrh servera
tests/index.html    testy v prehliadači
sw.js               offline režim (network-first)
```

## Ochrana údajov a bezpečnosť

- Heslá z Password Lab sa nikam neposielajú, neukladajú ani nelogujú. Pole sa maže pri opustení obrazovky.
- V `localStorage` je len herný postup: body, odznaky, splnené misie, počty správnych odpovedí a relácia triedy.
- Žiadne externé API, fonty ani analytika. Content-Security-Policy povoľuje len vlastný pôvod.
- Všetok obsah sa do stránky vkladá ako text, nie ako HTML.
- Všetky heslá, e-maily a adresy v obsahu sú vymyslené. Adresy majú iba koncovky `.example` a `.test`.
- Generátor fráz používa `crypto.getRandomValues`, ale má len malý zoznam slov. Je to ukážka štýlu, nie nástroj na tvorbu skutočných hesiel. Označený je ako „UKÁŽKA“.

## Čo vyžaduje server

Táto verzia je čisto klientska. Učiteľský režim preto zobrazuje len výsledky z toho zariadenia, na ktorom beží, a nie je chránený prihlásením. Neobsahuje totiž nič citlivé. Spoločný prehľad triedy, prihlásenie učiteľov a synchronizácia medzi zariadeniami potrebujú server. Návrh (dátový model, oprávnenia, uchovávanie) je v [docs/BACKEND.md](docs/BACKEND.md).

## Rozšírenie o nové moduly

Pozri [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Stručne: nový modul je súbor s úrovňami a misiami v `js/content/` plus jeden záznam v `MODULES`. Engine sa nemení, kým stačia existujúce typy úloh.
