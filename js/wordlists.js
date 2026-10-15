// Kartičky so slovami pre Dielňu hesiel a zoznam bežných hesiel a slov pre kontrolu hesla.

// Kartičky: [obrázok, slovo]. V hesle sa slovo píše bez dĺžňov a mäkčeňov (Dáždnik -> Dazdnik).
// Slová sú konkrétne veci a zvieratá, ktoré deti poznajú. Žiadne nesmie byť v zozname COMMON.
export const CARDS = {
  sk: [
    ['🐘', 'Slon'], ['🦓', 'Zebra'], ['🚀', 'Raketa'], ['🌵', 'Kaktus'], ['☂️', 'Dáždnik'], ['🌉', 'Most'],
    ['💡', 'Lampa'], ['☁️', 'Oblak'], ['🎲', 'Kocka'], ['🦉', 'Sova'], ['🦊', 'Líška'], ['🚂', 'Vlak'],
    ['🚜', 'Traktor'], ['🎈', 'Balón'], ['🏰', 'Hrad'], ['🐉', 'Drak'], ['🧭', 'Kompas'], ['🗺️', 'Mapa'],
    ['⚓', 'Kotva'], ['⛺', 'Stan'], ['🕯️', 'Svieca'], ['🪞', 'Zrkadlo'], ['🪟', 'Okno'], ['👑', 'Koruna'],
    ['⏰', 'Budík'], ['🚲', 'Bicykel'], ['🛴', 'Kolobežka'], ['✈️', 'Lietadlo'], ['🪂', 'Padák'], ['🚇', 'Tunel'],
    ['⛲', 'Fontána'], ['🌷', 'Tulipán'], ['🍁', 'Javor'], ['🍄', 'Huba'], ['⛰️', 'Kopec'], ['🍋', 'Citrón'],
    ['🥕', 'Mrkva'], ['🎃', 'Tekvica'], ['🌰', 'Gaštan'], ['🎸', 'Gitara'], ['🥁', 'Bubon'], ['🎺', 'Trúbka'],
    ['🪑', 'Stolička'], ['🧹', 'Metla'], ['🐌', 'Slimák'], ['🦔', 'Ježko'], ['🦋', 'Motýľ'], ['🐜', 'Mravec'],
    ['🕷️', 'Pavúk'], ['🐬', 'Delfín'], ['🐋', 'Veľryba'], ['🐯', 'Tiger'], ['🦁', 'Lev'], ['🦜', 'Papagáj'],
    ['🐫', 'Ťava'], ['🐊', 'Krokodíl'], ['🦘', 'Klokan'], ['🐧', 'Tučniak'], ['🚌', 'Autobus'], ['☄️', 'Kométa'],
    ['🪐', 'Planéta'], ['🌋', 'Sopka'], ['🏝️', 'Ostrov'], ['🧲', 'Magnet'], ['🔭', 'Ďalekohľad'], ['🍉', 'Melón'],
    ['🧦', 'Ponožka'], ['🎒', 'Ruksak'],
  ],
  en: [
    ['🐘', 'Elephant'], ['🦓', 'Zebra'], ['🚀', 'Rocket'], ['🌵', 'Cactus'], ['☂️', 'Umbrella'], ['🌉', 'Bridge'],
    ['💡', 'Lamp'], ['☁️', 'Cloud'], ['🎲', 'Dice'], ['🦉', 'Owl'], ['🦊', 'Fox'], ['🚂', 'Train'],
    ['🚜', 'Tractor'], ['🎈', 'Balloon'], ['🏰', 'Castle'], ['🧭', 'Compass'], ['🗺️', 'Map'], ['⚓', 'Anchor'],
    ['⛺', 'Tent'], ['🕯️', 'Candle'], ['🪞', 'Mirror'], ['🪟', 'Window'], ['👑', 'Crown'], ['⏰', 'Clock'],
    ['🚲', 'Bicycle'], ['🛴', 'Scooter'], ['✈️', 'Airplane'], ['🪂', 'Parachute'], ['🚇', 'Tunnel'], ['⛲', 'Fountain'],
    ['🌷', 'Tulip'], ['🍁', 'Maple'], ['🍄', 'Mushroom'], ['⛰️', 'Hill'], ['🍋', 'Lemon'], ['🥕', 'Carrot'],
    ['🎃', 'Pumpkin'], ['🌰', 'Acorn'], ['🎸', 'Guitar'], ['🥁', 'Drum'], ['🎺', 'Trumpet'], ['🪑', 'Chair'],
    ['🧹', 'Broom'], ['🐌', 'Snail'], ['🦔', 'Hedgehog'], ['🦋', 'Butterfly'], ['🐜', 'Ant'], ['🕷️', 'Spider'],
    ['🐬', 'Dolphin'], ['🐋', 'Whale'], ['🐯', 'Tiger'], ['🦁', 'Lion'], ['🦜', 'Parrot'], ['🐫', 'Camel'],
    ['🐊', 'Crocodile'], ['🦘', 'Kangaroo'], ['🐧', 'Penguin'], ['🚌', 'Bus'], ['☄️', 'Comet'], ['🪐', 'Planet'],
    ['🌋', 'Volcano'], ['🏝️', 'Island'], ['🧲', 'Magnet'], ['🔭', 'Telescope'], ['🍉', 'Melon'], ['🧦', 'Sock'],
    ['🎒', 'Backpack'],
  ],
};

// Bežné heslá a slová (slovenské aj anglické). Kontrola ich hľadá v normalizovanom tvare (malé písmená, bez diakritiky).
export const COMMON = new Set((
  '123456 1234567 12345678 123456789 1234567890 000000 111111 121212 123123 654321 987654321 ' +
  'password passw0rd pass admin root login welcome letmein secret qwerty qwertz qwertyuiop asdfgh asdfghjkl zxcvbn zxcvbnm ' +
  'abc123 abcdef abcdefg iloveyou monkey dragon football baseball soccer master shadow sunshine princess superman batman ' +
  'hello love teddy summer winter spring school teacher family puppy kitty mommy daddy mom dad dog cat ' +
  'pokemon starwars freedom whatever trustno1 ' +
  'heslo hesla ahoj cau caute lubim macko macka mama tato brat sestra kamarat pes psik skola ucitel ucitelka ' +
  'futbal hokej lopta slovensko bratislava kosice nitra zilina presov trnava hra hrac robot bot kluc tajne tajomstvo ' +
  'jahoda banan jablko leto zima jar jesen slnko luna ' +
  'minecraft roblox fortnite youtube tiktok instagram snapchat'
).split(/\s+/).filter(Boolean));
