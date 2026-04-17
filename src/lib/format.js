export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function formatRange(period, custom) {
  const labels = {
    'last-7':     'last 7 days',
    'last-30':    'last 30 days',
    'last-week':  'last week',
    'last-month': 'last month',
    'this-year':  `${new Date().getFullYear()} so far`,
    'all-time':   'all time',
  };
  if (period === 'custom' && custom?.start && custom?.end) {
    return `${formatDate(custom.start)} → ${formatDate(custom.end)}`;
  }
  return labels[period] || period;
}

export const RARITY_LABELS = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Very Rare' };
