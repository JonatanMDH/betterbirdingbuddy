// Waarneming.nl API client.
// Supports both Bearer token auth AND session cookie auth.
// Per the waarneming.nl API docs: "In the browser, a valid session is enough."

const BASE = 'https://waarneming.nl/api/v1';

function authHeaders(token, sessionId, csrfToken) {
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      'Accept-Language': 'nl',
    };
  }
  if (sessionId) {
    const cookieParts = [`sessionid=${sessionId}`];
    if (csrfToken) cookieParts.push(`csrftoken=${csrfToken}`);
    return {
      Cookie:          cookieParts.join('; '),
      Referer:         'https://waarneming.nl/',
      Origin:          'https://waarneming.nl',
      'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'nl',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }
  return { 'Accept-Language': 'nl' };
}

async function apiFetch(path, token, sessionId, csrfToken, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: authHeaders(token, sessionId, csrfToken) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`waarneming.nl ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchUser(userId, token, sessionId, csrfToken) {
  try {
    const data = await apiFetch(`/users/${userId}/`, token, sessionId, csrfToken);
    return {
      id:   String(userId),
      name: data.name || data.username || `Gebruiker #${userId}`,
    };
  } catch {
    return { id: String(userId), name: `Gebruiker #${userId}` };
  }
}

export async function fetchUserObservations(userId, dateAfter, dateBefore, token, sessionId, csrfToken) {
  const all = [];
  let offset = 0;
  const LIMIT = 100;

  while (true) {
    const data = await apiFetch(`/users/${userId}/observations/`, token, sessionId, csrfToken, {
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
