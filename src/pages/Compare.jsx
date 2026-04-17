import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchObservations } from '../lib/api.js';
import { compare, resolvePeriod, historyRangeForMode, MODES, PERIODS, RARITY_LABELS }
  from '../lib/compare.js';
import { stateToQueryString } from '../lib/urlParams.js';
import { formatDate, formatRange } from '../lib/format.js';

// An in-memory cache keyed by `${userId}:${start}:${end}` avoids re-fetching when
// only the mode changes. Invalidated on page reload (by design).
const cache = new Map();

async function fetchCached(userId, start, end) {
  const key = `${userId}:${start}:${end}`;
  if (cache.has(key)) return cache.get(key);
  const promise = fetchObservations(userId, start, end);
  cache.set(key, promise);
  // If the request fails, remove from cache so retries work
  promise.catch(() => cache.delete(key));
  return promise;
}

export default function Compare({ state }) {
  const navigate = useNavigate();
  const { me, buddies, period, mode, start: customStart, end: customEnd } = state;

  const range = useMemo(
    () => resolvePeriod(period, customStart, customEnd),
    [period, customStart, customEnd]
  );
  const historyRange = useMemo(
    () => historyRangeForMode(mode, range.start, range.end),
    [mode, range.start, range.end]
  );

  // Fetched data — parallel state per buddy
  const [myData, setMyData]       = useState(null);
  const [buddyData, setBuddyData] = useState({}); // id → { user, observations } | { error }
  const [fetching, setFetching]   = useState(true);
  const [fatalError, setFatalError] = useState(null);

  // Refetch when inputs change
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setFatalError(null);

    (async () => {
      try {
        // "me" needs the wider historyRange (for lifer detection)
        const mePromise = fetchCached(me, historyRange.start, historyRange.end);
        // Buddies only need the selected period
        const buddyPromises = buddies.map(id =>
          fetchCached(id, range.start, range.end)
            .then(data => ({ id, data }))
            .catch(err  => ({ id, error: err.message }))
        );

        const [meResult, ...buddyResults] = await Promise.all([
          mePromise.catch(err => { throw err; }),
          ...buddyPromises
        ]);

        if (cancelled) return;
        setMyData(meResult);
        const next = {};
        for (const r of buddyResults) {
          next[r.id] = r.error ? { error: r.error } : r.data;
        }
        setBuddyData(next);
      } catch (err) {
        if (!cancelled) setFatalError({ message: err.message, needsToken: err.needsToken });
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [me, buddies.join(','), historyRange.start, historyRange.end, range.start, range.end]);

  // Computed comparisons per buddy
  const results = useMemo(() => {
    if (!myData) return {};
    const out = {};
    for (const id of buddies) {
      const bd = buddyData[id];
      if (!bd || bd.error) continue;
      out[id] = compare({
        meObs:     myData.observations,
        buddyObs:  bd.observations,
        start:     range.start,
        end:       range.end,
        mode,
        buddyName: bd.user?.name || `#${id}`,
      });
    }
    return out;
  }, [myData, buddyData, buddies.join(','), range.start, range.end, mode]);

  const updateState = useCallback((patch) => {
    const qs = stateToQueryString({ ...state, ...patch });
    navigate(`/${qs}`, { replace: false });
  }, [state, navigate]);

  if (fatalError) {
    return (
      <div className="bbb-centered-card bbb-fade">
        <h2 className="bbb-page-title">
          {fatalError.needsToken ? 'Connection needed' : 'Couldn\'t load observations'}
        </h2>
        <div className="bbb-alert error" style={{ marginTop: 16 }}>{fatalError.message}</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {fatalError.needsToken && (
            <Link to="/?page=settings" className="bbb-link">Set up connection →</Link>
          )}
          <Link to="/" className="bbb-link">← Edit profiles</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bbb-compare bbb-fade">
      <ControlsBar
        state={state}
        myName={myData?.user?.name}
        onChange={updateState}
      />

      {fetching && !myData && <div className="bbb-loading">Fetching observations from waarneming.nl</div>}

      {myData && (
        <div
          className="bbb-grid"
          style={{ '--grid-cols': Math.min(buddies.length, 4) }}
        >
          {buddies.map(id => (
            <BuddyColumn
              key={id}
              buddyId={id}
              buddyEntry={buddyData[id]}
              result={results[id]}
              loading={fetching && !buddyData[id]}
              mode={mode}
              range={range}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Controls bar ───────────────────────────────────────────────────────────

function ControlsBar({ state, myName, onChange }) {
  const { period, mode, start, end } = state;

  return (
    <div className="bbb-controls-bar">
      <div className="bbb-controls-identity">
        <span className="bbb-controls-label-sm">You</span>
        <span className="bbb-controls-identity-name">
          {myName || `#${state.me}`}
        </span>
        <Link to={`/${stateToQueryString({ ...state, me: '', buddies: [] })}`} className="bbb-link" style={{ fontSize: 11, marginLeft: 12 }}>
          Edit profiles
        </Link>
      </div>

      <div className="bbb-controls-group">
        <div className="bbb-controls-label-sm">Period</div>
        <div className="bbb-chip-row">
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`bbb-chip ${period === p.id ? 'active' : ''}`}
              onClick={() => onChange({ period: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="bbb-custom-range" style={{ marginTop: 8 }}>
            <input
              className="bbb-date-input"
              type="date"
              value={start || ''}
              onChange={(e) => onChange({ start: e.target.value })}
            />
            <span style={{ color: 'var(--ink-softer)' }}>→</span>
            <input
              className="bbb-date-input"
              type="date"
              value={end || ''}
              onChange={(e) => onChange({ end: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="bbb-controls-group">
        <div className="bbb-controls-label-sm">Comparison</div>
        <div className="bbb-chip-row">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`bbb-chip ${mode === m.id ? 'active' : ''}`}
              onClick={() => onChange({ mode: m.id })}
              title={m.desc}
            >
              {m.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Single buddy column ────────────────────────────────────────────────────

function BuddyColumn({ buddyId, buddyEntry, result, loading, mode, range }) {
  if (loading) {
    return (
      <div className="bbb-col">
        <div className="bbb-col-head">
          <div className="bbb-col-name">#{buddyId}</div>
          <div className="bbb-col-count-sub">loading…</div>
        </div>
      </div>
    );
  }

  if (buddyEntry?.error) {
    return (
      <div className="bbb-col bbb-col-error">
        <div className="bbb-col-head">
          <div className="bbb-col-name">#{buddyId}</div>
          <div className="bbb-col-count-sub" style={{ color: 'var(--rust)' }}>error</div>
        </div>
        <div className="bbb-alert error" style={{ marginTop: 10, fontSize: 12 }}>
          {buddyEntry.error}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const buddyName = buddyEntry?.user?.name || `#${buddyId}`;
  const profileUrl = `https://waarneming.nl/users/${buddyId}/`;

  return (
    <div className="bbb-col">
      <div className="bbb-col-head">
        <div className="bbb-col-name" title={buddyName}>{buddyName}</div>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="bbb-col-link">
          waarneming.nl/#{buddyId}
        </a>
        <div className="bbb-col-count">
          <span className="bbb-col-count-num">{result.total}</span>
          <span className="bbb-col-count-label">species</span>
        </div>
      </div>

      {result.highlights.length > 0 && (
        <div className="bbb-col-highlights">
          <div className="bbb-col-highlights-label">★ Rarities</div>
          {result.highlights.map(s => (
            <div key={s.speciesId} className="bbb-col-hl-row">
              <div className="bbb-col-hl-name">
                {s.permalink ? (
                  <a href={s.permalink} target="_blank" rel="noopener noreferrer">{s.nl}</a>
                ) : s.nl}
              </div>
              <div className="bbb-col-hl-meta">
                {s.en && <span className="bbb-col-hl-en">{s.en}</span>}
                <span className="bbb-col-hl-rarity" data-rarity={s.rarity}>
                  {RARITY_LABELS[s.rarity]}
                </span>
                <span className="bbb-col-hl-date">{formatDate(s.lastDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {result.regular.length > 0 && (
        <div className="bbb-col-list">
          {result.regular.map(s => (
            <div key={s.speciesId} className="bbb-col-row">
              <span className="bbb-col-row-name">
                {s.nl}
                {s.en && <span className="bbb-col-row-en">{s.en}</span>}
              </span>
              <span className="bbb-col-row-date">{formatDate(s.lastDate)}</span>
            </div>
          ))}
        </div>
      )}

      {result.total === 0 && (
        <div className="bbb-col-empty">Nothing this period.</div>
      )}
    </div>
  );
}
