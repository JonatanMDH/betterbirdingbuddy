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

  const observations = rows
    .filter(r => r['species group'] === 'Vogels' && r['species name'] && r['date'])
    .map(r => ({
      // Use lowercased species name as a stable ID (no numeric ID in export)
      speciesId: r['species name'].toLowerCase().replace(/\s+/g, '_'),
      nl:        r['species name'],
      sci:       r['scientific name'] || '',
      date:      r['date'],
      location:  r['location'] || '',
      rarity:    rarityFromStatus(r['validation status']),
      permalink: r['link'] || '',
    }));

  return { name, observations };
}
