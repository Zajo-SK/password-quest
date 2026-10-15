# PASSWORD QUEST

*Chráň svoj digitálny svet.* Interaktívna vzdelávacia hra o bezpečných heslách a základoch kybernetickej bezpečnosti pre školy. Rozhranie aj obsah sú v slovenčine a angličtine, jazyk sa prepína v hornej lište (SK / EN).

- 4 úrovne podľa veku (6–8, 9–11, 12–14, 15–18 rokov), 16 misií a 83 interaktívnych úloh v oboch jazykoch
- Password Lab: lokálna, vysvetliteľná kontrola ukážkových hesiel a generátor ukážkových fráz
- Body (XP), 8 odznakov, záverečné hodnotenie úrovne a certifikát za preukázané zvládnutie
- Opakovanie nesprávne zodpovedaných úloh, rozpracovanú misiu možno dokončiť aj po obnovení stránky
- Učiteľský režim (relácia triedy, premietanie úloh, súhrn tém, export CSV) je pripravený, ale zatiaľ skrytý
- Bez registrácie, bez mien, e-mailov a bez skutočných hesiel

## Spustenie

Aplikácia je čisto statická (HTML, CSS a JavaScript moduly). Nepotrebuje inštaláciu ani build.

```bash
python3 -m http.server 8080
```

Potom otvor <http://localhost:8080>. Súbory sa nedajú otvoriť priamo cez `file://`, pretože prehliadače v takom prípade blokujú ES moduly.

## Nasadenie na školský web alebo server

Skopíruj celý priečinok (bez `tests/` a `docs/`, ak ich nechceš zverejniť) na ľubovoľný statický hosting: nginx, Apache, školský web, GitHub Pages, Netlify. Odporúčame HTTPS. Je potrebné aj pre offline režim (service worker) a pre kopírovanie odkazu v učiteľskom režime.

Odporúčané hlavičky (voliteľné, ak ich server vie nastaviť): `Content-Security-Policy` (v `index.html` už je ako `<meta>`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.

## Jazyky

- Texty rozhrania sú v `js/i18n/sk.js` a `js/i18n/en.js`, obsah úloh v `js/content/sk/` a `js/content/en/`.
- Zvolený jazyk sa pamätá v prehliadači (`pq.lang`). Predvolená je slovenčina.
- Úlohy majú v oboch jazykoch rovnaké identifikátory aj poradie odpovedí, takže postup, body a odznaky platia aj po prepnutí jazyka. Zhodu štruktúry kontrolujú testy.
- Nový jazyk: pridaj slovník do `js/i18n/`, obsah do `js/content/<jazyk>/`, zoznam slov do `js/wordlists.js` a záznam do `LANGS` v `js/i18n.js` a `CONTENT` v `js/content/index.js`.

## Učiteľský režim

Je zatiaľ skrytý. Zapína sa v `js/config.js` nastavením `FEATURES.teacher = true`. Potom sa objaví v navigácii a na úvodnej obrazovke a začnú fungovať adresy `#/teacher`, `#/present/…` a `#/join/…`.

## Testy

Otvor `/tests/` na lokálnom serveri. Stránka v oboch jazykoch skontroluje:

- analyzátor hesiel,
- integritu obsahu (jedna správna odpoveď, vysvetlenia, zhrnutia, len vymyslené domény),
- rovnakú štruktúru slovenského a anglického obsahu,
- úplnosť slovníkov,
- zoznamy slov generátora,
- kódy tried,
- či sa testovacie heslá nedostali do úložiska.

Výsledok je v nadpise stránky (`TESTY OK`).

Manuálne bola overená aj celá hra v oboch jazykoch: všetkých 16 misií prešlo scenárom „prvá odpoveď zle, zvyšok správne“ vrátane opakovania, bodov a odznakov. Overené bolo aj prepínanie jazyka a rozloženie na šírke 375 px bez horizontálneho posúvania.

## Štruktúra

```
index.html             vstup (CSP meta, odkaz na preskočenie na obsah)
css/styles.css         dizajnový systém (tmavý herný štýl, tokeny v :root, reduced motion, tlač)
js/main.js             hash router, navigácia, prepínač jazyka, offline registrácia
js/config.js           prepínače funkcií (učiteľský režim)
js/i18n.js             jazyk rozhrania a funkcia t()
js/i18n/sk.js, en.js   texty rozhrania
js/engine.js           vykresľovanie a vyhodnocovanie typov úloh, body, odznaky, premietanie
js/views.js            úvod, úrovne, hodnotenie, certifikát, postup, návody
js/lab.js              Password Lab a generátor ukážkových fráz
js/analyzer.js         vysvetliteľná kontrola hesiel (len v prehliadači)
js/wordlists.js        slová pre ukážkové frázy a zoznam bežných hesiel
js/teacher.js          učiteľský režim, relácia triedy, premietanie, CSV
js/store.js            ukladanie neosobného postupu do localStorage
js/progress.js         výpočty nad postupom
js/content/            OBSAH: úrovne, misie, otázky, vysvetlenia, odznaky, témy (sk/, en/)
docs/                  architektúra a návrh servera
tests/index.html       testy v prehliadači
sw.js                  offline režim (network-first)
```

## Ochrana údajov a bezpečnosť

- Heslá z Password Lab sa nikam neposielajú, neukladajú ani nelogujú. Pole sa vymaže, keď obrazovku opustíš.
- V `localStorage` je len herný postup (body, odznaky, splnené misie, počty správnych odpovedí) a zvolený jazyk.
- Žiadne externé API, fonty ani analytika. Content-Security-Policy povoľuje iba vlastný pôvod.
- Všetok obsah sa do stránky vkladá ako text, nie ako HTML.
- Všetky heslá, e-maily a adresy v obsahu sú vymyslené. Adresy majú iba koncovky `.example` a `.test`.
- Generátor fráz používa `crypto.getRandomValues`, ale má len malý zoznam slov. Je to ukážka štýlu, nie nástroj na tvorbu skutočných hesiel, a je tak aj označený.

## Čo vyžaduje server

Táto verzia je čisto klientska. Učiteľský režim preto zobrazuje len výsledky z toho zariadenia, na ktorom beží, a nie je chránený prihlásením. Neobsahuje totiž nič citlivé. Spoločný prehľad triedy, prihlásenie učiteľov a synchronizácia medzi zariadeniami potrebujú server. Návrh (dátový model, oprávnenia, uchovávanie) je v [docs/BACKEND.md](docs/BACKEND.md).

## Rozšírenie o nové moduly

Pozri [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Stručne: nový modul tvoria súbory s úrovňami a misiami v `js/content/<jazyk>/` a záznam v `js/content/index.js`. Kým stačia existujúce typy úloh, engine sa nemení.
