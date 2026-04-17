// Fetch a user's observations via our Netlify proxy function.
// Sends the stored waarneming.nl token as a header so the function
// can use it for the actual API call — never stored server-side.

import { getToken } from './auth.js';

export async function fetchObservations(userId, start, end) {
  const token = getToken();
  const url = `/api/fetch?userId=${encodeURIComponent(userId)}&start=${start}&end=${end}`;

  const res = await fetch(url, {
    headers: token ? { 'X-Wnmg-Token': token } : {},
  });

  let data;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Fetch failed: ${res.status}`);
    err.status = res.status;
    err.needsToken = res.status === 401 || res.status === 403;
    throw err;
  }
  return data;
}
