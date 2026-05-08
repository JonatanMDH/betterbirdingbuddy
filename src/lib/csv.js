// Parses a Waarneming.nl CSV export into normalized observation objects.

// Map validation status → rarity 1–4.
// The CSV has no numeric rarity field, but validation status is a reliable proxy:
//   automatische validatie    → common (1)
//   goedgekeurd (aannemelijk) → uncommon (2)
//   goedgekeurd (met bewijs)  → rare (3) — photographic/audio proof required
//   nog niet te beoordelen    → very rare (4) — assessors needed
function rarityFromStatus(status) {
  if (!status) return 1;
  const s = status.toLowerCase();
  if (s.includes('niet te beoordelen')) return 4;
  if (s.includes('met bewijs'))         return 3;
  if (s.includes('aannemelijk'))        return 2;
  return 1;
}

// Minimal CSV parser that handles quoted fields (including commas inside quotes).
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  function splitLine(line) {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
      else cur += ch;
    }
    fields.push(cur);
    return fields;
  }

  const headers = splitLine(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(l => {
      const vals = splitLine(l);
      const row = {};
      headers.forEach((h, i) => { row[h.trim()] = (vals[i] || '').trim(); });
      return row;
    });
}

/**
 * Parse a Waarneming.nl CSV export (as text string) into:
 *   { name: string, observations: Array }
 *
 * `filename` is used to derive the person's display name.
 */
export function parseWaarnemingCSV(text, filename) {
  const rows = parseCSV(text);

  // Extract a readable name from the filename.
  // Pattern: "observation-YYYY-MM-DD-HH-mm-observations-firstname-lastname.csv"
  let name = filename
    .replace(/\.csv$/i, '')
    .replace(/^observation-[\d-]+-observations?-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
  if (!name || name.length < 2) name = filename.replace(/\.csv$/i, '');

// Normalize any date format to YYYY-MM-DD for consistent string comparison.
// Waarneming.nl exports dates differently depending on browser locale:
//   YYYY-MM-DD  (standard, most common)
//   DD-MM-YYYY  (Dutch locale)
//   DD-MM-YY    (short Dutch locale)
function normalizeDate(d) {
  if (!d) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // DD-MM-YYYY
  const long = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (long) return `${long[3]}-${long[2]}-${long[1]}`;
  // DD-MM-YY
  const short = d.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (short) return `20${short[3]}-${short[2]}-${short[1]}`;
  return d;
}

  const observations = rows
    .filter(r => r['species name'] && r['date'])
    .map(r => ({
      speciesId: r['species name'],
      nl:        r['species name'],
      sci:       r['scientific name'] || '',
      date:      normalizeDate(r['date']),
      location:  r['location'] || '',
      rarity:    rarityFromStatus(r['validation status']),
      permalink: r['link'] || '',
    }));

  return { name, observations, totalRows: rows.length };
}
