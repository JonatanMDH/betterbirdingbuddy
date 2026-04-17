// Manages the user's waarneming.nl Bearer token in localStorage.
// The token is extracted once from the browser DevTools (see Settings page)
// and stored locally. It's sent with every fetch request.

const KEY = 'wnmg_token';

export function getToken() {
  return localStorage.getItem(KEY) || null;
}

export function saveToken(token) {
  localStorage.setItem(KEY, token.trim());
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

export function hasToken() {
  return Boolean(getToken());
}
