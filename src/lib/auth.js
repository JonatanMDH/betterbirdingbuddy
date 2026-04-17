const SESSION_KEY = 'wnmg_session';
const CSRF_KEY    = 'wnmg_csrf';

export function getSession()            { return localStorage.getItem(SESSION_KEY) || null; }
export function getCsrf()               { return localStorage.getItem(CSRF_KEY) || null; }
export function saveCredentials(s, c)   { localStorage.setItem(SESSION_KEY, s.trim()); if (c) localStorage.setItem(CSRF_KEY, c.trim()); }
export function clearSession()          { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(CSRF_KEY); }
export function hasSession()            { return Boolean(getSession()); }
