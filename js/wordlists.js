// Kartičky so slovami pre Dielňu hesiel a zoznam bežných hesiel a slov pre kontrolu hesla.

// Kartičky: [obrázok, slovo]. V hesle sa slovo píše bez dĺžňov a mäkčeňov (Dáždnik -> Dazdnik).
// Slová sú konkrétne veci a zvieratá, ktoré deti poznajú. Žiadne nesmie byť v zozname COMMON.
// Zoznam je verejný (je v kóde stránky), preto sila hesla z kartičiek závisí od počtu kartičiek a slov v hesle:
// približne 240 slov znamená necelých 8 bitov náhodnosti na slovo. Generátory dospelých (napr. EFF) majú 7 776 slov.
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
    ['🐸', 'Žaba'], ['🐢', 'Korytnačka'], ['🐙', 'Chobotnica'], ['🦀', 'Krab'], ['🦈', 'Žralok'], ['🐝', 'Včela'],
    ['🐞', 'Lienka'], ['🦒', 'Žirafa'], ['🦏', 'Nosorožec'], ['🦛', 'Hroch'], ['🐼', 'Panda'], ['🐨', 'Koala'],
    ['🦩', 'Plameniak'], ['🦢', 'Labuť'], ['🦆', 'Kačica'], ['🐓', 'Kohút'], ['🦃', 'Moriak'], ['🐿️', 'Veverička'],
    ['🦇', 'Netopier'], ['🦌', 'Jeleň'], ['🐺', 'Vlk'], ['🐻', 'Medveď'], ['🦡', 'Jazvec'], ['🦦', 'Vydra'],
    ['🦫', 'Bobor'], ['🐍', 'Had'], ['🦎', 'Jašterica'], ['🦂', 'Škorpión'], ['🦭', 'Tuleň'], ['🐠', 'Ryba'],
    ['🦞', 'Homár'], ['🦐', 'Kreveta'], ['🦗', 'Kobylka'], ['🪲', 'Chrobák'], ['🦟', 'Komár'], ['🐎', 'Kôň'],
    ['🐑', 'Ovca'], ['🐐', 'Koza'], ['🐄', 'Krava'], ['🐇', 'Králik'], ['🦙', 'Lama'], ['🦬', 'Bizón'],
    ['🐆', 'Leopard'], ['🦍', 'Gorila'], ['🦥', 'Leňochod'], ['🦚', 'Páv'], ['🦅', 'Orol'], ['🕊️', 'Holub'],
    ['🍐', 'Hruška'], ['🍒', 'Čerešňa'], ['🍑', 'Broskyňa'], ['🍍', 'Ananás'], ['🥝', 'Kivi'], ['🥥', 'Kokos'],
    ['🥑', 'Avokádo'], ['🍆', 'Baklažán'], ['🥦', 'Brokolica'], ['🌽', 'Kukurica'], ['🥒', 'Uhorka'], ['🧄', 'Cesnak'],
    ['🧅', 'Cibuľa'], ['🥔', 'Zemiak'], ['🍞', 'Chlieb'], ['🥨', 'Praclík'], ['🧀', 'Syr'], ['🥚', 'Vajce'],
    ['🥞', 'Palacinka'], ['🍯', 'Med'], ['🥜', 'Arašid'], ['🍪', 'Keks'], ['🎂', 'Torta'], ['🍩', 'Šiška'],
    ['🍿', 'Pukance'], ['🥛', 'Mlieko'], ['🫖', 'Čajník'], ['🍦', 'Zmrzlina'], ['🍬', 'Cukrík'], ['🫐', 'Čučoriedka'],
    ['🍇', 'Hrozno'], ['🥬', 'Šalát'], ['🌶️', 'Paprika'], ['🍅', 'Paradajka'], ['🔨', 'Kladivo'], ['🪚', 'Píla'],
    ['🪛', 'Skrutkovač'], ['🧰', 'Kufrík'], ['🧶', 'Klbko'], ['🪡', 'Ihla'], ['✂️', 'Nožnice'], ['📎', 'Spinka'],
    ['📏', 'Pravítko'], ['✏️', 'Ceruzka'], ['🖍️', 'Pastelka'], ['🖌️', 'Štetec'], ['📖', 'Kniha'], ['📓', 'Zošit'],
    ['🪁', 'Šarkan'], ['🪀', 'Jojo'], ['🎯', 'Terč'], ['🧩', 'Skladačka'], ['⛵', 'Plachetnica'], ['🚢', 'Loď'],
    ['🚁', 'Vrtuľník'], ['🚑', 'Sanitka'], ['🚕', 'Taxík'], ['🚚', 'Kamión'], ['🏍️', 'Motorka'], ['🛷', 'Sánky'],
    ['⛸️', 'Korčule'], ['🎿', 'Lyže'], ['🪜', 'Rebrík'], ['🪣', 'Vedro'], ['🧺', 'Košík'], ['🪴', 'Kvetináč'],
    ['🛁', 'Vaňa'], ['🚿', 'Sprcha'], ['🧼', 'Mydlo'], ['🪥', 'Kefka'], ['🧽', 'Špongia'], ['🛏️', 'Posteľ'],
    ['🛋️', 'Gauč'], ['🚪', 'Dvere'], ['🔦', 'Baterka'], ['🔔', 'Zvonček'], ['🎀', 'Mašľa'], ['🎩', 'Klobúk'],
    ['🧢', 'Šiltovka'], ['👓', 'Okuliare'], ['🧤', 'Rukavice'], ['🧣', 'Šál'], ['👢', 'Čižma'], ['💎', 'Diamant'],
    ['🪙', 'Minca'], ['🏺', 'Váza'], ['🧪', 'Skúmavka'], ['🔬', 'Mikroskop'], ['🛰️', 'Satelit'], ['📡', 'Anténa'],
    ['📷', 'Fotoaparát'], ['📻', 'Rádio'], ['🎹', 'Klavír'], ['🎻', 'Husle'], ['🪗', 'Harmonika'], ['🎷', 'Saxofón'],
    ['🎤', 'Mikrofón'], ['🌲', 'Smrek'], ['🌳', 'Dub'], ['🌴', 'Palma'], ['🌻', 'Slnečnica'], ['🌹', 'Ruža'],
    ['🌼', 'Sedmokráska'], ['🍀', 'Ďatelina'], ['🌾', 'Klas'], ['🪨', 'Balvan'], ['🌊', 'Vlna'], ['❄️', 'Vločka'],
    ['🌈', 'Dúha'], ['⚡', 'Blesk'], ['🌪️', 'Tornádo'], ['🌙', 'Mesiac'], ['⭐', 'Hviezda'], ['🏜️', 'Púšť'],
    ['🏞️', 'Rieka'], ['🔥', 'Oheň'], ['💧', 'Kvapka'], ['🏡', 'Chalupa'], ['🏛️', 'Múzeum'], ['🏟️', 'Štadión'],
    ['⛪', 'Kostol'], ['🗼', 'Veža'], ['🎠', 'Kolotoč'], ['🎪', 'Cirkus'], ['🏭', 'Továreň'], ['🗿', 'Socha'],
    ['🧱', 'Tehla'], ['🧊', 'Ľadovec'],
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
    ['🐸', 'Frog'], ['🐢', 'Turtle'], ['🐙', 'Octopus'], ['🦀', 'Crab'], ['🦈', 'Shark'], ['🐝', 'Bee'],
    ['🐞', 'Ladybird'], ['🦒', 'Giraffe'], ['🦏', 'Rhino'], ['🦛', 'Hippo'], ['🐼', 'Panda'], ['🐨', 'Koala'],
    ['🦩', 'Flamingo'], ['🦢', 'Swan'], ['🦆', 'Duck'], ['🐓', 'Rooster'], ['🦃', 'Turkey'], ['🐿️', 'Squirrel'],
    ['🦇', 'Bat'], ['🦌', 'Deer'], ['🐺', 'Wolf'], ['🐻', 'Bear'], ['🦡', 'Badger'], ['🦦', 'Otter'],
    ['🦫', 'Beaver'], ['🐍', 'Snake'], ['🦎', 'Lizard'], ['🦂', 'Scorpion'], ['🦭', 'Seal'], ['🐠', 'Fish'],
    ['🦞', 'Lobster'], ['🦐', 'Shrimp'], ['🦗', 'Cricket'], ['🪲', 'Beetle'], ['🦟', 'Mosquito'], ['🐎', 'Horse'],
    ['🐑', 'Sheep'], ['🐐', 'Goat'], ['🐄', 'Cow'], ['🐇', 'Rabbit'], ['🦙', 'Llama'], ['🦬', 'Bison'],
    ['🐆', 'Leopard'], ['🦍', 'Gorilla'], ['🦥', 'Sloth'], ['🦚', 'Peacock'], ['🦅', 'Eagle'], ['🕊️', 'Pigeon'],
    ['🍐', 'Pear'], ['🍒', 'Cherry'], ['🍑', 'Peach'], ['🍍', 'Pineapple'], ['🥝', 'Kiwi'], ['🥥', 'Coconut'],
    ['🥑', 'Avocado'], ['🍆', 'Aubergine'], ['🥦', 'Broccoli'], ['🌽', 'Corn'], ['🥒', 'Cucumber'], ['🧄', 'Garlic'],
    ['🧅', 'Onion'], ['🥔', 'Potato'], ['🍞', 'Bread'], ['🥨', 'Pretzel'], ['🧀', 'Cheddar'], ['🥚', 'Egg'],
    ['🥞', 'Pancake'], ['🍯', 'Honey'], ['🥜', 'Peanut'], ['🍪', 'Biscuit'], ['🎂', 'Cake'], ['🍩', 'Doughnut'],
    ['🍿', 'Popcorn'], ['🥛', 'Milk'], ['🫖', 'Teapot'], ['🍦', 'Sundae'], ['🍬', 'Sweet'], ['🫐', 'Blueberry'],
    ['🍇', 'Grape'], ['🥬', 'Lettuce'], ['🌶️', 'Chilli'], ['🍅', 'Tomato'], ['🔨', 'Hammer'], ['🪚', 'Saw'],
    ['🪛', 'Screwdriver'], ['🧰', 'Toolbox'], ['🧶', 'Yarn'], ['🪡', 'Needle'], ['✂️', 'Scissors'], ['📎', 'Paperclip'],
    ['📏', 'Ruler'], ['✏️', 'Pencil'], ['🖍️', 'Crayon'], ['🖌️', 'Paintbrush'], ['📖', 'Book'], ['📓', 'Notebook'],
    ['🪁', 'Kite'], ['🪀', 'Yoyo'], ['🎯', 'Target'], ['🧩', 'Jigsaw'], ['⛵', 'Sailboat'], ['🚢', 'Ship'],
    ['🚁', 'Helicopter'], ['🚑', 'Ambulance'], ['🚕', 'Taxi'], ['🚚', 'Lorry'], ['🏍️', 'Motorbike'], ['🛷', 'Sledge'],
    ['⛸️', 'Skates'], ['🎿', 'Skis'], ['🪜', 'Ladder'], ['🪣', 'Bucket'], ['🧺', 'Basket'], ['🪴', 'Flowerpot'],
    ['🛁', 'Bathtub'], ['🚿', 'Shower'], ['🧼', 'Soap'], ['🪥', 'Toothbrush'], ['🧽', 'Sponge'], ['🛏️', 'Bed'],
    ['🛋️', 'Sofa'], ['🚪', 'Door'], ['🔦', 'Torch'], ['🔔', 'Bell'], ['🎀', 'Ribbon'], ['🎩', 'Hat'],
    ['🧢', 'Cap'], ['👓', 'Glasses'], ['🧤', 'Gloves'], ['🧣', 'Scarf'], ['👢', 'Boot'], ['💎', 'Diamond'],
    ['🪙', 'Coin'], ['🏺', 'Vase'], ['🧪', 'Flask'], ['🔬', 'Microscope'], ['🛰️', 'Satellite'], ['📡', 'Antenna'],
    ['📷', 'Camera'], ['📻', 'Radio'], ['🎹', 'Piano'], ['🎻', 'Violin'], ['🪗', 'Accordion'], ['🎷', 'Saxophone'],
    ['🎤', 'Microphone'], ['🌲', 'Spruce'], ['🌳', 'Oak'], ['🌴', 'Palm'], ['🌻', 'Sunflower'], ['🌹', 'Rose'],
    ['🌼', 'Daisy'], ['🍀', 'Clover'], ['🌾', 'Wheat'], ['🪨', 'Boulder'], ['🌊', 'Wave'], ['❄️', 'Snowflake'],
    ['🌈', 'Rainbow'], ['⚡', 'Lightning'], ['🌪️', 'Tornado'], ['🌙', 'Moon'], ['⭐', 'Star'], ['🏜️', 'Desert'],
    ['🏞️', 'River'], ['🔥', 'Fire'], ['💧', 'Droplet'], ['🏡', 'Cottage'], ['🏛️', 'Museum'], ['🏟️', 'Stadium'],
    ['⛪', 'Chapel'], ['🗼', 'Tower'], ['🎠', 'Carousel'], ['🎪', 'Circus'], ['🏭', 'Factory'], ['🗿', 'Statue'],
    ['🧱', 'Brick'], ['🧊', 'Iceberg'],
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
  'minecraft roblox fortnite youtube tiktok instagram snapchat ' +
  'password1 password123 qwerty123 admin123 welcome1 iloveyou1 1q2w3e4r 1qaz2wsx 123qwe zaq12wsx ' +
  'charlie michael jordan hunter ranger buster tigger pepper ginger cookie chocolate banana pizza computer internet ' +
  'heslo1 heslo12 heslo1234 mojeheslo tajneheslo noveheslo laska zlato srdiecko janko peter martin jana maria anna ' +
  'slovan vianoce'
).split(/\s+/).filter(Boolean));
