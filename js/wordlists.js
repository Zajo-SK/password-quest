// Zoznamy slov pre ukážkové frázy (generátor v Password Lab) a zoznam bežných hesiel/slov pre analyzátor.

// Slová bez diakritiky, len na ukážky. Nie sú určené na tvorbu skutočných hesiel.
export const WORDS = {
  sk: ('vlak mrak dazd skala kocka lipa hruska rakety oblak kaktus zajac sneh lod slon lampa zelva kamen luk zebra most ' +
    'pivonka mesiac hviezda kometa planeta ostrov jazero potok luka hora udolie vrch jaskyna vtak sova orol vlk liska jelen srnka ' +
    'medved bobor ryba koral perla muska kniha zosit pero ceruzka mapa kompas majak plachta kotva veslo stan ohnisko svieca ' +
    'zrkadlo okno dvere schody vez hrad brana mincie truhla poklad drak rytier kral sachy puzzle hodiny budik kalendar dazdnik ' +
    'topanky ponozky sal ruksak bicykel kolobezka traktor lietadlo balon padak ponorka zeriav tunel ulica fontana lavicka tulipan ' +
    'javor dub buk smrek borovica huba mach papraden kopec mlyn studna ker trnie').split(' '),
  en: ('train cloud forest river stone rocket lamp pear cactus rabbit snow boat elephant umbrella zebra bridge lantern meadow ' +
    'island lake brook valley cave hill owl eagle wolf fox deer beaver otter coral pearl beetle book pencil map lighthouse ' +
    'sail anchor oar tent candle mirror window ladder tower castle gate coin chest treasure knight chess puzzle clock calendar boot ' +
    'sock scarf backpack bicycle scooter tractor airplane balloon parachute submarine crane tunnel street fountain bench tulip maple ' +
    'oak birch spruce pine mushroom moss fern windmill well bush thorn kettle teapot violin trumpet drum pillow blanket button needle ' +
    'thimble walnut pepper carrot turnip pumpkin acorn feather pebble glacier canyon volcano comet planet nebula orbit harbor').split(' '),
};

// Bežné heslá a slová (slovenské aj anglické). Analyzátor ich hľadá v normalizovanom tvare.
export const COMMON = new Set((
  '123456 1234567 12345678 123456789 1234567890 000000 111111 121212 123123 654321 987654321 ' +
  'password passw0rd pass admin root login welcome letmein secret qwerty qwertz qwertyuiop asdfgh asdfghjkl zxcvbn zxcvbnm ' +
  'abc123 abcdef abcdefg iloveyou monkey dragon football baseball soccer master shadow sunshine princess superman batman ' +
  'hello love teddy summer winter spring school teacher family puppy kitty mommy daddy pokemon starwars freedom whatever trustno1 ' +
  'heslo hesla ahoj cau caute lubim macko macka mama tato brat sestra kamarat pes psik skola ucitel ucitelka ' +
  'futbal hokej lopta slovensko bratislava kosice nitra zilina presov trnava hra hrac robot bot kluc tajne tajomstvo ' +
  'jahoda banan jablko leto zima jar jesen slnko luna ' +
  'minecraft roblox fortnite youtube tiktok instagram snapchat'
).split(/\s+/).filter(Boolean));
