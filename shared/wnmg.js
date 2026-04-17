// Waarneming.nl API client.
// Token is passed in per-call (from the browser via the Netlify Function),
// not stored server-side. This keeps things stateless and simple.

const BASE = 'https://waarneming.nl/api/v1';

async function authedFetch(path, token, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Authorization:    `Bearer ${token}`,
      'Accept-Language': 'nl',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`waarneming.nl ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchUser(userId, token) {
  const data = await authedFetch(`/users/${userId}/`, token);
  return {
    id:   String(userId),
    name: data.name || data.username || `User #${userId}`,
  };
}

export async function fetchUserObservations(userId, dateAfter, dateBefore, token) {
  const all = [];
  let offset = 0;
  const LIMIT = 100;

  while (true) {
    const data = await authedFetch(`/users/${userId}/observations/`, token, {
      species_group: 1,
      date_after:    dateAfter,
      date_before:   dateBefore,
      limit:         LIMIT,
      offset,
    });
    if (!data.results?.length) break;
    all.push(...data.results);
    if (!data.next) break;
    offset += LIMIT;
    if (offset > 2000) break;
  }

  return all.map(normalizeObservation);
}

function normalizeObservation(raw) {
  const sp = raw.species_detail || {};
  return {
    id:        raw.id,
    date:      raw.date,
    speciesId: sp.id,
    nl:        sp.name_nl || sp.name || '',
    en:        sp.name_en || '',
    sci:       sp.scientific_name || '',
    rarity:    raw.rarity ?? 1,
    location:  raw.location_detail?.name || '',
    permalink: raw.permalink,
  };
}
