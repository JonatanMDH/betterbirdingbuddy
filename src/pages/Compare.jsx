import React, { useState, useMemo } from 'react';
import { useLang } from '../App.jsx';
import { compare, resolvePeriod, MODES, PERIODS, RARITY_LABELS_NL, RARITY_LABELS_EN } from '../lib/compare.js';

const RARITY_COLOR = { 1: '#6b7280', 2: '#0369a1', 3: '#b45309', 4: '#dc2626' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Compare({ data, onBack }) {
  const lang = useLang();
  const { me, buddies } = data;

  const [period,      setPeriod]      = useState('all-time');
  const [mode,        setMode]        = useState('they-not-me');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');

  const range = useMemo(
    () => resolvePeriod(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const results = useMemo(() =>
    buddies.map(buddy => ({
      buddy,
      result: compare({
        meObs:     me.observations,
        buddyObs:  buddy.observations,
        start:     range.start,
        end:       range.end,
        mode,
        buddyName: buddy.name,
      }),
    })),
    [me, buddies, range.start, range.end, mode]
  );

  const labels = { period: PERIODS, mode: MODES };

  return (
    <div className="bbb-fade">
      {/* Toolbar */}
      <div className="bbb-toolbar">
        <button className="bbb-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {lang === 'nl' ? 'Nieuwe bestanden' : 'New files'}
        </button>

        <div className="bbb-toolbar-controls">
          <div className="bbb-control-group">
            {PERIODS.map(p => (
              <button key={p.id} className={`bbb-chip ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}>{lang === 'nl' ? p.nl : p.en}</button>
            ))}
          </div>
          <div className="bbb-toolbar-divider" />
          <div className="bbb-control-group">
            {MODES.map(m => (
              <button key={m.id} className={`bbb-chip ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}>{lang === 'nl' ? m.nl : m.en}</button>
            ))}
          </div>
        </div>
      </div>

      {period === 'custom' && (
        <div className="bbb-custom-range">
          <span className="bbb-range-label">{lang === 'nl' ? 'Van' : 'From'}</span>
          <input type="date" className="bbb-date-input" value={customStart} onChange={e => setCustomStart(e.target.value)} />
          <span className="bbb-range-label">{lang === 'nl' ? 'tot' : 'to'}</span>
          <input type="date" className="bbb-date-input" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
        </div>
      )}

      {/* You + range row */}
      <div className="bbb-you-row">
        <div className="bbb-you-pill">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="2.5" stroke="#1a6eb5" strokeWidth="1.5"/>
            <path d="M2 12c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="#1a6eb5" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{lang === 'nl' ? 'Vergelijken als:' : 'Comparing as:'}</span>
          <strong>{me.name}</strong>
        </div>
        <span className="bbb-range-badge">{range.start} — {range.end}</span>
      </div>

      {/* Grid */}
      <div className="bbb-grid" style={{ '--grid-cols': Math.min(buddies.length, 4) }}>
        {results.map(({ buddy, result }) => (
          <BuddyCard key={buddy.name} buddy={buddy} result={result} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function BuddyCard({ buddy, result, lang }) {
  const [expanded, setExpanded] = useState(false);
  const RARITY_LABELS = lang === 'nl' ? RARITY_LABELS_NL : RARITY_LABELS_EN;

  return (
    <div className="bbb-col">
      <div className="bbb-col-head">
        <div className="bbb-col-avatar">{buddy.name.slice(0,1).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="bbb-col-name" title={buddy.name}>{buddy.name}</div>
          <div className="bbb-col-sub">
            {buddy.observations.length} {lang === 'nl' ? 'obs. geladen' : 'obs. loaded'}
            {' · '}
            {result.buddyInPeriod} {lang === 'nl' ? 'soorten in periode' : 'species in period'}
          </div>
        </div>
        <div className="bbb-col-count">
          <span className="bbb-col-count-n">{result.total}</span>
          <span className="bbb-col-count-l">{lang === 'nl' ? 'soorten' : 'species'}</span>
        </div>
      </div>

      {result.highlights.length > 0 && (
        <div className="bbb-col-highlights">
          <div className="bbb-col-hl-header">
            <span className="bbb-col-hl-title">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
                <path d="M6 1l1.5 3h3l-2.4 1.8.9 3L6 7l-3 1.8.9-3L1.5 4h3z" fill="#b45309"/>
              </svg>
              {lang === 'nl' ? 'Zeldzaamheden' : 'Rarities'}
            </span>
            <span className="bbb-col-hl-count">{result.highlights.length}</span>
          </div>
          {result.highlights.map(s => (
            <div key={s.speciesId} className="bbb-col-hl-row">
              <div style={{ minWidth: 0 }}>
                <div className="bbb-col-hl-name">
                  {s.permalink
                    ? <a href={s.permalink} target="_blank" rel="noopener noreferrer" className="bbb-obs-link">{s.nl}</a>
                    : s.nl}
                </div>
                {s.sci && <div className="bbb-col-hl-sci">{s.sci}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <RarityTag rarity={s.rarity} label={RARITY_LABELS[s.rarity]} />
                <span className="bbb-col-hl-date">{fmtDate(s.lastDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.regular.length > 0 && (
        <div className="bbb-col-list">
          {(expanded ? result.regular : result.regular.slice(0, 10)).map(s => (
            <div key={s.speciesId} className="bbb-col-row">
              <span className="bbb-col-row-name">
                {s.permalink
                  ? <a href={s.permalink} target="_blank" rel="noopener noreferrer" className="bbb-obs-link">{s.nl}</a>
                  : s.nl}
                {s.sci && <span className="bbb-col-row-sub">{s.sci}</span>}
              </span>
              <span className="bbb-col-row-date">{fmtDate(s.lastDate)}</span>
            </div>
          ))}
          {result.regular.length > 10 && (
            <button className="bbb-show-more" onClick={() => setExpanded(e => !e)}>
              {expanded
                ? (lang === 'nl' ? 'Toon minder' : 'Show less')
                : (lang === 'nl' ? `Toon ${result.regular.length - 10} meer` : `Show ${result.regular.length - 10} more`)}
            </button>
          )}
        </div>
      )}

      {result.total === 0 && (
        <div className="bbb-col-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#d1d5db" strokeWidth="1.5"/>
            <path d="M8 12h8" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{lang === 'nl' ? 'Niets te tonen in deze periode' : 'Nothing to show for this period'}</span>
        </div>
      )}
    </div>
  );
}

function RarityTag({ rarity, label }) {
  const color = RARITY_COLOR[rarity] || '#6b7280';
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color, background: color + '18', padding: '2px 6px', borderRadius: 3,
    }}>{label}</span>
  );
}
