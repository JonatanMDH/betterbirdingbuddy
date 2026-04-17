// Pure comparison logic. Runs in the browser on observation arrays
// returned by /api/fetch.

export const RARITY_LABELS = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Very Rare' };

export const MODES = [
  { id: 'they-not-me', title: "They saw, I didn't",     desc: 'in this period' },
  { id: 'me-not-them', title: "I saw, they didn't",     desc: 'in this period' },
  { id: 'both',        title: "We both saw",            desc: 'shared finds' },
  { id: 'lifers',      title: "Their lifers over mine", desc: 'species I have never recorded' },
  { id: 'their-list',  title: "Their full list",        desc: 'everything' },
];

export const PERIODS = [
  { id: 'last-7',    label: 'Last 7 days' },
  { id: 'last-30',   label: 'Last 30 days' },
  { id: 'last-week', label: 'Last week' },
  { id: 'last-month', label: 'Last month' },
  { id: 'this-year', label: 'This year' },
  { id: 'custom',    label: 'Custom' },
];

/**
 * Resolve a period preset to concrete start/end ISO dates.
 * For "custom", uses provided start/end directly.
 */
export function resolvePeriod(period, customStart, customEnd, today = new Date()) {
  const end = new Date(today);
  let start = new Date(today);

  switch (period) {
    case 'last-7':
      start.setDate(end.getDate() - 7);
      break;
    case 'last-30':
      start.setDate(end.getDate() - 30);
      break;
    case 'last-week': {
      const day = end.getDay() || 7;
      end.setDate(end.getDate() - day);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    }
    case 'last-month': {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end.setTime(new Date(today.getFullYear(), today.getMonth(), 0).getTime());
      break;
    }
    case 'this-year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart && customEnd) return { start: customStart, end: customEnd };
      start.setDate(end.getDate() - 7);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  };
}

/**
 * How much history do we need to fetch for *me* to answer this mode?
 * - 'lifers' needs full "me" history (to know what you've ever recorded).
 *   We cap at 3 years — anything older is statistically a "lifer" for our purposes.
 * - Everything else only needs observations in the selected period.
 */
export function historyRangeForMode(mode, start, end) {
  if (mode === 'lifers') {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    return { start: threeYearsAgo.toISOString().slice(0, 10), end };
  }
  return { start, end };
}

function filterByRange(obs, start, end) {
  return obs.filter(o => o.date >= start && o.date <= end);
}

function uniqueSpeciesMap(obs) {
  const m = new Map();
  for (const o of obs) {
    if (!o.speciesId) continue;
    if (!m.has(o.speciesId)) m.set(o.speciesId, []);
    m.get(o.speciesId).push(o);
  }
  return m;
}

/**
 * Compare one buddy against "me".
 *
 * @param {object} args
 * @param {Array}  args.meObs       your observations (full fetched history)
 * @param {Array}  args.buddyObs    buddy's observations (in-period only is enough)
 * @param {string} args.start, args.end   ISO dates of the comparison window
 * @param {string} args.mode        one of MODES[].id
 * @param {string} args.buddyName
 */
export function compare({ meObs, buddyObs, start, end, mode, buddyName }) {
  const meInPeriod    = filterByRange(meObs,    start, end);
  const buddyInPeriod = filterByRange(buddyObs, start, end);

  const meMap     = uniqueSpeciesMap(meInPeriod);
  const buddyMap  = uniqueSpeciesMap(buddyInPeriod);
  const meAll     = uniqueSpeciesMap(meObs);
  const buddyAll  = uniqueSpeciesMap(buddyObs);

  let speciesIds = [];
  let description;
  let sourceMap = buddyMap;

  switch (mode) {
    case 'they-not-me':
      speciesIds  = [...buddyMap.keys()].filter(id => !meMap.has(id));
      description = `Species ${buddyName} saw that you didn't`;
      break;
    case 'me-not-them':
      speciesIds  = [...meMap.keys()].filter(id => !buddyMap.has(id));
      description = `Species you saw that ${buddyName} didn't`;
      sourceMap   = meMap;
      break;
    case 'both':
      speciesIds  = [...buddyMap.keys()].filter(id => meMap.has(id));
      description = `Species you both saw`;
      break;
    case 'lifers':
      speciesIds  = [...buddyAll.keys()].filter(id => !meAll.has(id) && buddyMap.has(id));
      description = `${buddyName}'s recent sightings of species you've never recorded`;
      break;
    case 'their-list':
      speciesIds  = [...buddyMap.keys()];
      description = `Everything ${buddyName} observed`;
      break;
    default:
      throw new Error(`Unknown comparison mode: ${mode}`);
  }

  const species = speciesIds.map(id => {
    const occs  = sourceMap.get(id) || [];
    const first = occs[0] || {};
    const dates = occs.map(o => o.date).sort();
    const locs  = [...new Set(occs.map(o => o.location).filter(Boolean))];
    return {
      speciesId: id,
      nl:   first.nl,
      en:   first.en,
      sci:  first.sci,
      rarity: first.rarity,
      count: occs.length,
      firstDate: dates[0],
      lastDate:  dates[dates.length - 1],
      locations: locs,
      permalink: first.permalink,
    };
  });

  species.sort((a, b) => {
    if (b.rarity !== a.rarity) return (b.rarity || 0) - (a.rarity || 0);
    return (b.lastDate || '').localeCompare(a.lastDate || '');
  });

  return {
    description,
    buddyName,
    range: { start, end },
    total: species.length,
    highlights: species.filter(s => (s.rarity || 0) >= 3),
    regular:    species.filter(s => (s.rarity || 0) < 3),
    species,
  };
}
