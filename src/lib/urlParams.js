// URL state is the source of truth. Shareable links look like:
// /?me=57388&buddies=43083,24601&period=last-7&mode=they-not-me

export const DEFAULT_STATE = {
  me: '',
  buddies: [],
  period: 'last-7',
  mode: 'they-not-me',
  start: null,
  end: null,
  demo: false,
};

export const DEMO_IDS = {
  me: '57388',
  buddies: ['43083', '24601', '13579', '97531'],
};

export function parseIdFromInput(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const m = trimmed.match(/users\/(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

export function stateFromSearchParams(params) {
  const me       = params.get('me') || '';
  const buddies  = (params.get('buddies') || '')
    .split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
  const period   = params.get('period') || DEFAULT_STATE.period;
  const mode     = params.get('mode') || DEFAULT_STATE.mode;
  const start    = params.get('start');
  const end      = params.get('end');
  const demo     = params.get('demo') === '1';

  return { me, buddies, period, mode, start, end, demo };
}

export function stateToQueryString(state) {
  const p = new URLSearchParams();
  if (state.me) p.set('me', state.me);
  if (state.buddies?.length) p.set('buddies', state.buddies.join(','));
  if (state.period && state.period !== DEFAULT_STATE.period) p.set('period', state.period);
  if (state.mode && state.mode !== DEFAULT_STATE.mode) p.set('mode', state.mode);
  if (state.period === 'custom' && state.start) p.set('start', state.start);
  if (state.period === 'custom' && state.end)   p.set('end', state.end);
  if (state.demo) p.set('demo', '1');
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Enough state to actually run a comparison (need me + at least one buddy). */
export function isRunnable(state) {
  return Boolean(state.me) && Array.isArray(state.buddies) && state.buddies.length > 0;
}
