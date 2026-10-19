# Návrh serverovej časti (nie je súčasťou tejto verzie)

Klientska verzia ukladá výsledky len v prehliadači žiaka. Spoločný prehľad triedy a prihlásenie učiteľov vyžadujú server. Tento dokument popisuje, ako ho pridať bezpečne. **Nič z toho zatiaľ nie je implementované a aplikácia nepredstiera, že áno.**

## Čo server rieši

- prihlásenie učiteľov
- vytvorenie relácie triedy s náhodným kódom
- príjem anonymných výsledkov od žiakov
- súhrnný prehľad pre učiteľa a export

## Autentifikácia učiteľov

Použi existujúce školské prihlásenie (OpenID Connect s Google Workspace alebo Microsoft Entra). **Nevytváraj vlastné heslá a nespoliehaj sa na skrytú URL.** Rola `teacher` sa určuje na serveri (skupina v adresári školy), nie v klientovi. Všetky učiteľské endpointy vyžadujú platnú reláciu a overujú vlastníctvo triedy.

## Dátový model

```
teacher   (id, subject_oidc, school_id)
class     (id, teacher_id, level, mission_ids[], join_code_hash, created_at, expires_at)
attempt   (id, class_id, anon_player_id, round_id, topic, first_try_correct, created_at)
```

- `anon_player_id` je náhodný identifikátor generovaný v prehliadači pri vstupe do relácie. Nie je to meno ani e-mail a nedá sa z neho zistiť identita.
- Neukladajú sa heslá, ich odvodeniny, ani obsah Dielne hesiel. Server o ich existencii nevie.
- `join_code_hash` je hash náhodného kódu (aspoň 40 bitov entropie, ako v `teacher.js`). Kód sa porovnáva v konštantnom čase a obmedzuje sa rýchlosť pokusov (rate limit na IP a na triedu).

## Oprávnenia

| Akcia | Kto |
| --- | --- |
| vytvoriť/zmazať triedu | prihlásený učiteľ (vlastná trieda) |
| odoslať výsledok kola | držiteľ platného kódu triedy, len do tejto triedy |
| čítať súhrn triedy | učiteľ, ktorému trieda patrí |
| čítať údaje inej triedy | nikto |

Kód triedy dovoľuje len **zápis** anonymných výsledkov do tejto jednej triedy. Nikdy nie čítanie. Preto jeho únik neodhalí údaje iných tried.

## Uchovávanie a ochrana údajov

- trieda a jej výsledky sa po `expires_at` (napr. 90 dní, nastaviteľné) automaticky mažú
- učiteľ môže triedu kedykoľvek zmazať
- žiadny verejný rebríček a žiadne hodnotenie jednotlivcov podľa slabosti hesiel
- export obsahuje iba súhrnné počty podľa témy a kola
- komunikácia len cez HTTPS, prísna CSP, cookies relácie `HttpOnly; Secure; SameSite=Lax`
- záznamy bez osobných údajov, prístup k logom obmedzený
- pred nasadením posúdiť podľa školských pravidiel ochrany osobných údajov (GDPR)

## API (návrh)

```
POST /api/classes                 (učiteľ)   → { code, id }
GET  /api/classes/:id/summary     (učiteľ)   → agregované úspešnosti podľa tém a kôl
DELETE /api/classes/:id           (učiteľ)
POST /api/join/:code/attempts     (žiak)     → { anon_player_id, round_id, topic, first_try_correct }
```

Klient v `store.js` by po zapnutí servera dopĺňal odosielanie výsledkov kola (fronta s opakovaním pri výpadku siete). Heslá z Dielne hesiel sa do nej nikdy nedostanú.
