// Stores the user's waarneming.nl session cookie in localStorage.
// The session cookie is found in DevTools → Application → Cookies — much
// easier than finding a Bearer token in network requests.

const SESSION_KEY = 'wnmg_session';

export function getSession()        { return localStorage.getItem(SESSION_KEY) || null; }
export function saveSession(val)    { localStorage.setItem(SESSION_KEY, val.trim()); }
export function clearSession()      { localStorage.removeItem(SESSION_KEY); }
export function hasSession()        { return Boolean(getSession()); }
