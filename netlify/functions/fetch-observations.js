// GET /api/fetch?userId=57388&start=2026-04-10&end=2026-04-17
//
// Proxies waarneming.nl's API (which blocks CORS from browsers).
// The user's Bearer token is sent from the browser as X-Wnmg-Token
// and forwarded to waarneming.nl — we never store it.

import { fetchUser, fetchUserObservations } from '../../shared/wnmg.js';

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

  if (!userId || !/^\d+$/.test(userId)) return json(400, { error: 'Invalid userId' });
  if (!start  || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return json(400, { error: 'Invalid start date' });
  if (!end    || !/^\d{4}-\d{2}-\d{2}$/.test(end))   return json(400, { error: 'Invalid end date' });

  // Accept token from browser header OR fall back to env var (for future convenience)
  const token = req.headers.get('x-wnmg-token') || process.env.WNMG_ACCESS_TOKEN || null;

  if (!token) {
    return json(401, {
      error: 'No waarneming.nl token found.',
      needsToken: true,
    });
  }

  try {
    const [user, observations] = await Promise.all([
      fetchUser(userId, token),
      fetchUserObservations(userId, start, end, token),
    ]);
    return json(200, { user, observations });
  } catch (err) {
    console.error(`[fetch] userId=${userId}:`, err.message);
    const isAuthError = err.message.includes('401') || err.message.includes('403');
    return json(isAuthError ? 401 : 502, {
      error: isAuthError
        ? 'Token rejected by waarneming.nl. It may have expired — refresh it in Settings.'
        : err.message,
      needsToken: isAuthError,
    });
  }
};
