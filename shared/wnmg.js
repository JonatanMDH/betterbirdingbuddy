// Waarneming.nl API client.
// Supports both Bearer token auth AND session cookie auth.
// Per the waarneming.nl API docs: "In the browser, a valid session is enough."

const BASE = 'https://waarneming.nl/api/v1';

function authHeaders(token, sessionId) {
  if (token) {
    return { Authorization: `Bearer ${token}`, 'Accept-Language': 'nl' };
  }
  if (sessionId) {
    // Use session cookie exactly as the waarneming.nl website does
    return { Cookie: `sessionid=${sessionId}`, 'Accept-Language': 'nl' };
  }
  return { 'Accept-Language': 'nl' };
}

async function apiFetch(path, token, sessionId, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: authHeaders(token, sessionId) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`waarneming.nl ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchUser(userId, token, sessionId) {
  const data = await apiFetch(`/users/${userId}/`, token, sessionId);
  return {
    id:   String(userId),
    name: data.name || data.username || `Gebruiker #${userId}`,
  };
}

export async function fetchUserObservations(userId, dateAfter, dateBefore, token, sessionId) {
  const all = [];
  let offset = 0;
  const LIMIT = 100;

  while (true) {
    const data = await apiFetch(`/users/${userId}/observations/`, token, sessionId, {
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

  return all.map(r => {
    const sp = r.species_detail || {};
    return {
      id:        r.id,
      date:      r.date,
      speciesId: sp.id,
      nl:        sp.name_nl || sp.name || '',
      en:        sp.name_en || '',
      sci:       sp.scientific_name || '',
      rarity:    r.rarity ?? 1,
      location:  r.location_detail?.name || '',
      permalink: r.permalink,
    };
  });
}
