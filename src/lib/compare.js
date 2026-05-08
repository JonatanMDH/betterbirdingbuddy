export const RARITY_LABELS_NL = { 1: 'Gewoon', 2: 'Ongewoon', 3: 'Zeldzaam', 4: 'Zeer zeldzaam' };
export const RARITY_LABELS_EN = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Very Rare' };

export const MODES = [
  { id: 'they-not-me', nl: 'Zij zagen, ik niet',       en: "They saw, I didn't" },
  { id: 'me-not-them', nl: 'Ik zag, zij niet',         en: "I saw, they didn't" },
  { id: 'both',        nl: 'Allebei gezien',            en: 'Both saw' },
  { id: 'lifers',      nl: 'Hun lifers boven de mijne', en: 'Their lifers over mine' },
  { id: 'their-list',  nl: 'Volledige lijst',           en: 'Their full list' },
];

export const PERIODS = [
  { id: 'last-7',     nl: '7 dagen',       en: '7 days' },
  { id: 'last-30',    nl: '30 dagen',      en: '30 days' },
  { id: 'last-week',  nl: 'Vorige week',   en: 'Last week' },
  { id: 'last-month', nl: 'Vorige maand',  en: 'Last month' },
  { id: 'this-year',  nl: 'Dit jaar',      en: 'This year' },
  { id: 'all-time',   nl: 'Alles',         en: 'All time' },
  { id: 'custom',     nl: 'Aangepast',     en: 'Custom' },
];

export function resolvePeriod(period, customStart, customEnd) {
  // Use today's actual date for the real app
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);

  switch (period) {
    case 'last-7':    start.setDate(end.getDate() - 7); break;
    case 'last-30':   start.setDate(end.getDate() - 30); break;
    case 'last-week': { const d = end.getDay()||7; end.setDate(end.getDate()-d); start=new Date(end); start.setDate(end.getDate()-6); break; }
    case 'last-month':{ start=new Date(today.getFullYear(),today.getMonth()-1,1); end.setTime(new Date(today.getFullYear(),today.getMonth(),0).getTime()); break; }
    case 'this-year': start = new Date(today.getFullYear(), 0, 1); break;
    case 'all-time':  start = new Date('2000-01-01'); break;
    case 'custom':    if (customStart && customEnd) return { start: customStart, end: customEnd };
    default:          start.setDate(end.getDate() - 30);
  }
  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
}

function uniqueMap(obs) {
  const m = new Map();
  for (const o of obs) {
    if (!o.speciesId) continue;
    if (!m.has(o.speciesId)) m.set(o.speciesId, []);
    m.get(o.speciesId).push(o);
  }
  return m;
}

export function compare({ meObs, buddyObs, start, end, mode, buddyName }) {
  const f = arr => arr.filter(o => o.date >= start && o.date <= end);
  const mP = uniqueMap(f(meObs)), bP = uniqueMap(f(buddyObs));
  const mA = uniqueMap(meObs),   bA = uniqueMap(buddyObs);

  let ids, src = bP;
  switch (mode) {
    case 'they-not-me': ids = [...bP.keys()].filter(id => !mP.has(id)); break;
    case 'me-not-them': ids = [...mP.keys()].filter(id => !bP.has(id)); src = mP; break;
    case 'both':        ids = [...bP.keys()].filter(id =>  mP.has(id)); break;
    case 'lifers':      ids = [...bA.keys()].filter(id => !mA.has(id) && bP.has(id)); break;
    case 'their-list':  ids = [...bP.keys()]; break;
    default:            ids = [];
  }

  const species = ids.map(id => {
    const occs = src.get(id) || [];
    const first = occs[0] || {};
    const dates = occs.map(o => o.date).sort();
    return {
      speciesId: id,
      nl:        first.nl,
      sci:       first.sci,
      rarity:    first.rarity,
      count:     occs.length,
      lastDate:  dates[dates.length - 1],
      location:  first.location,
      permalink: first.permalink,
    };
  });

  species.sort((a, b) =>
    (b.rarity||0) - (a.rarity||0) ||
    (b.lastDate||'').localeCompare(a.lastDate||'')
  );

  return {
    buddyName,
    total:      species.length,
    highlights: species.filter(s => (s.rarity||0) >= 3),
    regular:    species.filter(s => (s.rarity||0) < 3),
  };
}
