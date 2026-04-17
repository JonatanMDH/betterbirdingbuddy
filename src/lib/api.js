import { getSession } from './auth.js';

// ─── Real API ─────────────────────────────────────────────────────────────────

export async function fetchObservations(userId, start, end) {
  const session = getSession();
  const url = `/api/fetch?userId=${encodeURIComponent(userId)}&start=${start}&end=${end}`;
  const res = await fetch(url, {
    headers: session ? { 'X-Wnmg-Session': session } : {},
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Fetch mislukt: ${res.status}`);
    err.status = res.status;
    err.needsToken = res.status === 401 || res.status === 403;
    throw err;
  }
  return data;
}

// ─── Demo / mock data ─────────────────────────────────────────────────────────

const SPECIES = [
  { id: 1,  nl: 'Koolmees',            en: 'Great Tit',                rarity: 1 },
  { id: 2,  nl: 'Pimpelmees',          en: 'Blue Tit',                 rarity: 1 },
  { id: 3,  nl: 'Merel',               en: 'Eurasian Blackbird',       rarity: 1 },
  { id: 4,  nl: 'Roodborst',           en: 'European Robin',           rarity: 1 },
  { id: 5,  nl: 'Huismus',             en: 'House Sparrow',            rarity: 1 },
  { id: 6,  nl: 'Houtduif',            en: 'Common Wood Pigeon',       rarity: 1 },
  { id: 7,  nl: 'Zwarte Kraai',        en: 'Carrion Crow',             rarity: 1 },
  { id: 8,  nl: 'Ekster',              en: 'Eurasian Magpie',          rarity: 1 },
  { id: 9,  nl: 'Vink',                en: 'Common Chaffinch',         rarity: 1 },
  { id: 10, nl: 'Winterkoning',        en: 'Eurasian Wren',            rarity: 1 },
  { id: 11, nl: 'Staartmees',          en: 'Long-tailed Tit',          rarity: 1 },
  { id: 12, nl: 'Wilde Eend',          en: 'Mallard',                  rarity: 1 },
  { id: 13, nl: 'Meerkoet',            en: 'Eurasian Coot',            rarity: 1 },
  { id: 14, nl: 'Grauwe Gans',         en: 'Greylag Goose',            rarity: 1 },
  { id: 15, nl: 'Aalscholver',         en: 'Great Cormorant',          rarity: 1 },
  { id: 16, nl: 'Blauwe Reiger',       en: 'Grey Heron',               rarity: 1 },
  { id: 17, nl: 'Kokmeeuw',            en: 'Black-headed Gull',        rarity: 1 },
  { id: 18, nl: 'Buizerd',             en: 'Common Buzzard',           rarity: 1 },
  { id: 19, nl: 'Torenvalk',           en: 'Common Kestrel',           rarity: 1 },
  { id: 20, nl: 'Boerenzwaluw',        en: 'Barn Swallow',             rarity: 1 },
  { id: 21, nl: 'Nijlgans',            en: 'Egyptian Goose',           rarity: 1 },
  { id: 22, nl: 'Tjiftjaf',            en: 'Common Chiffchaff',        rarity: 1 },
  { id: 30, nl: 'Groene Specht',       en: 'Green Woodpecker',         rarity: 2 },
  { id: 31, nl: 'Grote Bonte Specht',  en: 'Great Spotted Woodpecker', rarity: 2 },
  { id: 32, nl: 'Sperwer',             en: 'Eurasian Sparrowhawk',     rarity: 2 },
  { id: 33, nl: 'IJsvogel',            en: 'Common Kingfisher',        rarity: 2 },
  { id: 34, nl: 'Goudhaantje',         en: 'Goldcrest',                rarity: 2 },
  { id: 35, nl: 'Scholekster',         en: 'Eurasian Oystercatcher',   rarity: 2 },
  { id: 36, nl: 'Kievit',              en: 'Northern Lapwing',         rarity: 2 },
  { id: 37, nl: 'Grutto',              en: 'Black-tailed Godwit',      rarity: 2 },
  { id: 38, nl: 'Tureluur',            en: 'Common Redshank',          rarity: 2 },
  { id: 39, nl: 'Baardman',            en: 'Bearded Reedling',         rarity: 2 },
  { id: 40, nl: 'Rietgors',            en: 'Reed Bunting',             rarity: 2 },
  { id: 41, nl: 'Wintertaling',        en: 'Eurasian Teal',            rarity: 2 },
  { id: 42, nl: 'Slobeend',            en: 'Northern Shoveler',        rarity: 2 },
  { id: 43, nl: 'Dodaars',             en: 'Little Grebe',             rarity: 2 },
  { id: 44, nl: 'Fuut',                en: 'Great Crested Grebe',      rarity: 2 },
  { id: 45, nl: 'Kuifeend',            en: 'Tufted Duck',              rarity: 2 },
  { id: 46, nl: 'Smient',              en: 'Eurasian Wigeon',          rarity: 2 },
  { id: 47, nl: 'Boomklever',          en: 'Eurasian Nuthatch',        rarity: 2 },
  { id: 60, nl: 'Zeearend',            en: 'White-tailed Eagle',       rarity: 3 },
  { id: 61, nl: 'Visarend',            en: 'Osprey',                   rarity: 3 },
  { id: 62, nl: 'Slechtvalk',          en: 'Peregrine Falcon',         rarity: 3 },
  { id: 63, nl: 'Rode Wouw',           en: 'Red Kite',                 rarity: 3 },
  { id: 64, nl: 'Wespendief',          en: 'European Honey Buzzard',   rarity: 3 },
  { id: 65, nl: 'Blauwborst',          en: 'Bluethroat',               rarity: 3 },
  { id: 66, nl: 'Paapje',              en: 'Whinchat',                 rarity: 3 },
  { id: 67, nl: 'Draaihals',           en: 'Eurasian Wryneck',         rarity: 3 },
  { id: 68, nl: 'Lepelaar',            en: 'Eurasian Spoonbill',       rarity: 3 },
  { id: 69, nl: 'Roerdomp',            en: 'Eurasian Bittern',         rarity: 3 },
  { id: 70, nl: 'Zwarte Specht',       en: 'Black Woodpecker',         rarity: 3 },
  { id: 80, nl: 'Bladkoning',          en: 'Yellow-browed Warbler',    rarity: 4 },
  { id: 81, nl: "Pallas' Boszanger",   en: "Pallas's Leaf Warbler",    rarity: 4 },
  { id: 82, nl: 'Roze Spreeuw',        en: 'Rosy Starling',            rarity: 4 },
  { id: 83, nl: 'Witbandkruisbek',     en: 'Two-barred Crossbill',     rarity: 4 },
  { id: 84, nl: 'Witoogeend',          en: 'Ferruginous Duck',         rarity: 4 },
  { id: 85, nl: 'Woudaap',             en: 'Little Bittern',           rarity: 4 },
];

const sp = Object.fromEntries(SPECIES.map(s => [s.id, s]));
const o = (id, date, loc = 'Wageningen') => ({
  speciesId: id, date, location: loc, ...sp[id],
});

const MOCK_USERS = {
  '57388': { name: 'Jonatan (jij)', observations: [
    o(1,'2026-04-16'), o(2,'2026-04-16'), o(4,'2026-04-15'), o(3,'2026-04-14'),
    o(11,'2026-04-13'), o(8,'2026-04-12'), o(34,'2026-04-11','De Hoge Veluwe'),
    o(18,'2026-04-05'), o(19,'2026-04-04'), o(22,'2026-04-03'),
    o(13,'2026-04-01','Binnenveldse Hooilanden'),
    o(33,'2026-03-22','Rijn bij Wageningen'), o(16,'2026-03-20'),
    o(44,'2026-03-15'), o(31,'2026-03-10'), o(35,'2026-03-08'),
    o(60,'2026-02-14','Oostvaardersplassen'), o(41,'2026-02-12'), o(15,'2026-02-08'),
    o(12,'2026-01-18'), o(46,'2026-01-18'), o(14,'2026-01-15'),
    o(65,'2025-05-12','Biesbosch'),
  ]},
  '43083': { name: 'Lars Hendriks', observations: [
    o(1,'2026-04-17'), o(3,'2026-04-17'), o(6,'2026-04-16'), o(9,'2026-04-16'),
    o(22,'2026-04-15'), o(20,'2026-04-14','Betuwe'), o(36,'2026-04-12','Ochten'),
    o(37,'2026-04-12','Ochten'), o(38,'2026-04-12'),
    o(62,'2026-04-06','Nijmegen'), o(18,'2026-04-04'), o(4,'2026-04-02'),
    o(66,'2026-03-28','Millingerwaard'), o(35,'2026-03-25'),
    o(63,'2026-03-10','Ooijpolder'), o(69,'2026-02-18','Gelderse Poort'),
  ]},
  '24601': { name: 'Bram de Wit', observations: [
    o(80,'2026-04-16','Texel'), o(82,'2026-04-15','Vlieland'),
    o(62,'2026-04-14'), o(63,'2026-04-12','Ooijpolder'), o(60,'2026-04-10'),
    o(61,'2026-04-06','Biesbosch'), o(68,'2026-04-04'),
    o(83,'2026-03-25','Schiermonnikoog'), o(67,'2026-03-20'),
    o(81,'2026-02-22','Maasvlakte'), o(85,'2026-02-10','Lauwersmeer'),
    o(84,'2025-11-03','Zeeland'), o(70,'2025-09-15','Veluwezoom'),
  ]},
  '13579': { name: 'Lotte Janssen', observations: [
    o(13,'2026-04-16','Oostvaardersplassen'), o(15,'2026-04-16'), o(16,'2026-04-16'),
    o(43,'2026-04-15'), o(44,'2026-04-15'), o(45,'2026-04-14'),
    o(46,'2026-04-14'), o(41,'2026-04-13'), o(42,'2026-04-13'),
    o(68,'2026-04-12','Lauwersmeer'), o(37,'2026-04-10'), o(38,'2026-04-10'),
    o(69,'2026-03-20','Naardermeer'), o(84,'2026-02-20','Zeeland'),
    o(61,'2026-02-05'), o(39,'2026-02-02'), o(85,'2025-08-14'),
  ]},
  '97531': { name: 'Sanne Visser', observations: [
    o(31,'2026-04-16','Veluwe'), o(30,'2026-04-16'), o(48,'2026-04-15'),
    o(70,'2026-04-14','Veluwezoom'), o(47,'2026-04-13'), o(34,'2026-04-12'),
    o(71,'2026-03-28','Speulderbos'), o(49,'2026-03-25'), o(67,'2026-03-12'),
    o(64,'2025-07-08','Veluwezoom'), o(83,'2025-11-14'),
  ]},
};

export async function fetchObservationsDemo(userId) {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 300)); // simulate network
  const u = MOCK_USERS[userId];
  return {
    user: { id: userId, name: u?.name || `Gebruiker #${userId}` },
    observations: u?.observations || [],
  };
}
