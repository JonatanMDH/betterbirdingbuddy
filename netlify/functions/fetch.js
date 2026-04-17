// GET /api/fetch?userId=57388&start=2026-04-10&end=2026-04-17
//
// Proxies waarneming.nl (CORS-blocked in browsers).
// Accepts the user's session cookie via X-Wnmg-Session header,
// OR a Bearer token via X-Wnmg-Token header (both work with waarneming.nl).
// Results are cached in memory for 10 minutes to offset slow API response times.

import { fetchUser, fetchUserObservations } from '../../shared/wnmg.js';

// Simple in-memory cache — survives within a single function instance (usually
// a few minutes). Good enough to make mode/period switching feel instant.
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value) {
  cache.set(key, { value, ts: Date.now() });
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async (req) => {
  const url    = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const start  = url.searchParams.get('start');
  const end    = url.searchParams.get('end');

  if (!userId || !/^\d+$/.test(userId))           return json(400, { error: 'Ongeldig gebruikers-ID' });
  if (!start  || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return json(400, { error: 'Ongeldige startdatum' });
  if (!end    || !/^\d{4}-\d{2}-\d{2}$/.test(end))   return json(400, { error: 'Ongeldige einddatum' });

  // Accept session cookie OR bearer token from the browser
  const sessionId = req.headers.get('x-wnmg-session');
  const bearerToken = req.headers.get('x-wnmg-token') || process.env.WNMG_ACCESS_TOKEN;

  if (!sessionId && !bearerToken) {
    return json(401, {
      error: 'Geen waarneming.nl-sessie gevonden. Stel je account in via Instellingen.',
      needsToken: true,
    });
  }

  const cacheKey = `${userId}:${start}:${end}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ ...cached, fromCache: true }), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const [user, observations] = await Promise.all([
      fetchUser(userId, bearerToken, sessionId),
      fetchUserObservations(userId, start, end, bearerToken, sessionId),
    ]);
    const result = { user, observations };
    cacheSet(cacheKey, result);
    return json(200, result);
  } catch (err) {
    console.error(`[fetch] userId=${userId}:`, err.message);
    const isAuth = err.message.includes('401') || err.message.includes('403');
    return json(isAuth ? 401 : 502, {
      error: isAuth
        ? 'Sessie geweigerd door waarneming.nl. Mogelijk verlopen — ververs hem in Instellingen.'
        : err.message,
      needsToken: isAuth,
    });
  }
};
