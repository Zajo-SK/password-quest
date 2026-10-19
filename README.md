# PASSWORD QUEST

*Chráň svoj digitálny svet.* Interaktívna vzdelávacia hra o bezpečných heslách a základoch kybernetickej bezpečnosti pre školy. Rozhranie aj obsah sú v slovenčine a angličtine, jazyk sa prepína v hornej lište (SK / EN).

- 2 moduly, každý so 4 úrovňami obtiažnosti (ľahká, stredná, náročná, expertná):
  - **Password Quest** – bezpečné heslá, MFA a reakcia na únik (17 misií, 95 úloh)
  - **Detektív e-mailov** – odhaľovanie podvodných e-mailov: návnady, falošné odkazy, prílohy, triedenie schránky a nahlasovanie (8 misií, 40 úloh)
- Všetko v slovenčine aj angličtine
- Dielňa hesiel: žiak si z vylosovaných kartičiek (3 až 5 slov z približne 240) postaví heslo a hneď vidí, ako ťažko sa dá uhádnuť: dĺžka aspoň 15 znakov, bežné a známe heslá, vzory a osobné údaje. Rozpozná aj náhodné heslo zo správcu hesiel
- **Pre učiteľov:** dve vzorové 45-minútové hodiny na stiahnutie (PDF, SK aj EN) – *Silné heslo z náhodných slov* a *Detektív e-mailov* – s metodikou, pracovným listom a riešeniami
- Body (XP), 12 odznakov, záverečné hodnotenie úrovne a certifikát za preukázané zvládnutie
- Opakovanie nesprávne zodpovedaných úloh, rozpracovanú misiu možno dokončiť aj po obnovení stránky
- Učiteľský režim (relácia triedy, premietanie úloh, súhrn tém, export CSV) je pripravený, ale zatiaľ skrytý
- Bez registrácie, bez mien, e-mailov a bez skutočných hesiel

## Odborný základ

Obsah o heslách vychádza z aktuálnych odporúčaní (overené v októbri 2026):

- **NIST SP 800-63B-4** (USA, 2025): heslo, ktoré chráni účet samo, má mať aspoň 15 znakov; žiadne povinné kombinácie znakov ani pravidelné zmeny bez dôvodu; kontrola proti bežným a uniknutým heslám; povolené správcovia hesiel a vkladanie; žiadne nápovedy ani bezpečnostné otázky. Heslá ani jednorazové kódy nie sú odolné voči phishingu, prístupové kľúče áno.
- **NCSC** (Spojené kráľovstvo): tri náhodné slová ako zapamätateľné heslo, správca hesiel na ostatné heslá.
- **FIDO Alliance** (2026): prístupové kľúče (passkeys) sa rýchlo rozširujú, ale nie každá služba ich podporuje.
- **CSIRT.SK**: dlhé frázy namiesto citátov a osobných údajov, rôzne heslo pre každý účet, MFA.
- Výskum o vzdelávaní detí (Renaud a Prior): mladším žiakom dávať jednoduché a zapamätateľné pravidlá, starších viesť k správcom hesiel.

Aplikácia preto učí poradie: **prístupový kľúč**, kde sa dá → **náhodné heslo zo správcu hesiel** → **heslo z náhodne vylosovaných slov** len pre pár hesiel, ktoré treba vedieť naspamäť (zariadenie, správca hesiel). Slová musí vybrať náhoda, nie človek. Kartičiek je približne 240, preto pri dôležitom hesle odporúčame aspoň štyri slová.

## Spustenie

Aplikácia je čisto statická (HTML, CSS a JavaScript moduly). Nepotrebuje inštaláciu ani build.

```bash
python3 -m http.server 8080
```

Potom otvor <http://localhost:8080>. Súbory sa nedajú otvoriť priamo cez `file://` (dvojklikom na `index.html`), pretože prehliadače v takom prípade blokujú ES moduly.

### Na vlastnom počítači jedným klikom

Potrebný je nainštalovaný [Python 3](https://www.python.org/downloads/) (na Windows pri inštalácii zaškrtni „Add Python to PATH“).

- **Windows:** dvojklik na `spustit-windows.bat`
- **macOS / Linux:** `./spustit.sh` v termináli

Skript spustí lokálny server a otvorí aplikáciu v prehliadači na <http://localhost:8080>. Okno servera nechaj počas používania otvorené.

Materiály pre učiteľov (PDF) sú aj priamo v priečinku `materials/` a dajú sa otvoriť bez servera.

## Nasadenie na školský web alebo server

Skopíruj celý priečinok (bez `tests/`, `docs/` a `tools/`, ak ich nechceš zverejniť; priečinok `materials/` ponechaj) na ľubovoľný statický hosting: nginx, Apache, školský web, GitHub Pages, Netlify. Odporúčame HTTPS. Je potrebné aj pre offline režim (service worker) a pre kopírovanie odkazu v učiteľskom režime.

Odporúčané hlavičky (voliteľné, ak ich server vie nastaviť): `Content-Security-Policy` (v `index.html` už je ako `<meta>`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.

## Jazyky

- Texty rozhrania sú v `js/i18n/sk.js` a `js/i18n/en.js`, obsah úloh v `js/content/sk/` a `js/content/en/`.
- Zvolený jazyk sa pamätá v prehliadači (`pq.lang`). Predvolená je slovenčina.
- Úlohy majú v oboch jazykoch rovnaké identifikátory aj poradie odpovedí, takže postup, body a odznaky platia aj po prepnutí jazyka. Zhodu štruktúry kontrolujú testy.
- Nový jazyk: pridaj slovník do `js/i18n/`, obsah do `js/content/<jazyk>/`, kartičky so slovami do `js/wordlists.js` a záznam do `LANGS` v `js/i18n.js` a `CONTENT` v `js/content/index.js`.

## Učiteľský režim

Je zatiaľ skrytý. Zapína sa v `js/config.js` nastavením `FEATURES.teacher = true`. Potom sa objaví v navigácii a na úvodnej obrazovke a začnú fungovať adresy `#/teacher`, `#/present/…` a `#/join/…`.

## Testy

Otvor `/tests/` na lokálnom serveri. Stránka v oboch jazykoch skontroluje:

- kontrolu hesla v Dielni hesiel a kartičky so slovami,
- integritu obsahu (jedna správna odpoveď, vysvetlenia, zhrnutia, len vymyslené domény),
- rovnakú štruktúru slovenského a anglického obsahu,
- úplnosť slovníkov,
- kódy tried,
- dostupnosť materiálov pre učiteľov,
- či sa testovacie heslá nedostali do úložiska.

Výsledok je v nadpise stránky (`TESTY OK`).

Celá hra bola overená aj automatickým prechodom v prehliadači: všetkých 25 misií oboch modulov sa v slovenčine aj angličtine dá dokončiť, udelí sa všetkých 12 odznakov a otvoria sa všetky hodnotenia a certifikáty bez chýb v konzole. Overené bolo aj opakovanie po nesprávnej odpovedi a rozloženie na šírke 390 px bez horizontálneho posúvania.

## Materiály pre učiteľov

Záložka **Pre učiteľov** (`#/materials`) ponúka na stiahnutie dve vzorové hodiny (45 minút) v slovenčine aj angličtine. Každý dokument má 4 strany A4: metodiku s cieľmi a priebehom hodiny, pracovný list pre žiakov a riešenia.

| Súbor | Hodina |
| --- | --- |
| `materials/sk/hodina-1-bezpecne-hesla.pdf` | Silné heslo z náhodných slov (3. – 9. ročník) |
| `materials/sk/hodina-2-podvodne-emaily.pdf` | Detektív e-mailov: odhaľ podvod (4. – 9. ročník) |
| `materials/en/lesson-1-safe-passwords.pdf` | A strong password from random words |
| `materials/en/lesson-2-scam-emails.pdf` | Email Detective: spot the scam |

Zdrojom sú HTML súbory vedľa PDF (dajú sa upraviť a vytlačiť priamo z prehliadača). PDF sa po úprave vygenerujú príkazom `node tools/build-materials.mjs` (vyžaduje balík `playwright`).

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
js/lab.js              Dielňa hesiel: kontrola hesla, kartičky so slovami a obrazovka (len v prehliadači)
js/wordlists.js        kartičky so slovami pre Dielňu hesiel a zoznam bežných hesiel
js/teacher.js          učiteľský režim, relácia triedy, premietanie, CSV
js/store.js            ukladanie neosobného postupu do localStorage
js/progress.js         výpočty nad postupom
js/content/            OBSAH: moduly, úrovne, misie, otázky, vysvetlenia, odznaky, témy (sk/, en/; email.js = Detektív e-mailov)
docs/                  architektúra a návrh servera
tests/index.html       testy v prehliadači
sw.js                  offline režim (network-first)
materials/             materiály pre učiteľov: vzorové hodiny (HTML + PDF, sk/, en/)
tools/                 build-materials.mjs: generovanie PDF materiálov
spustit-windows.bat    spustenie na Windows (lokálny server + prehliadač)
spustit.sh             spustenie na macOS / Linux
```

## Ochrana údajov a bezpečnosť

- Heslá z Dielne hesiel sa nikam neposielajú, neukladajú ani nelogujú. Pole sa vymaže, keď obrazovku opustíš.
- V `localStorage` je len herný postup (body, odznaky, splnené misie, počty správnych odpovedí) a zvolený jazyk.
- Žiadne externé API, fonty ani analytika. Content-Security-Policy povoľuje iba vlastný pôvod.
- Všetok obsah sa do stránky vkladá ako text, nie ako HTML.
- Všetky heslá, e-maily a adresy v obsahu sú vymyslené. Adresy majú iba koncovky `.example` a `.test`.
- Generátor fráz používa `crypto.getRandomValues`, ale má len malý zoznam slov. Je to ukážka štýlu, nie nástroj na tvorbu skutočných hesiel, a je tak aj označený.

## Čo vyžaduje server

Táto verzia je čisto klientska. Učiteľský režim preto zobrazuje len výsledky z toho zariadenia, na ktorom beží, a nie je chránený prihlásením. Neobsahuje totiž nič citlivé. Spoločný prehľad triedy, prihlásenie učiteľov a synchronizácia medzi zariadeniami potrebujú server. Návrh (dátový model, oprávnenia, uchovávanie) je v [docs/BACKEND.md](docs/BACKEND.md).

## Rozšírenie o nové moduly

Pozri [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Stručne: nový modul tvoria súbory s úrovňami a misiami v `js/content/<jazyk>/` a záznam v `js/content/index.js`. Kým stačia existujúce typy úloh, engine sa nemení.
