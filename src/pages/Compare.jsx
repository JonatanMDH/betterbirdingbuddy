import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchObservations, fetchObservationsDemo } from '../lib/api.js';
import { compare, resolvePeriod, historyRangeForMode } from '../lib/compare.js';
import { stateToQueryString } from '../lib/urlParams.js';
import { formatDate } from '../lib/format.js';
import { useT, useLang } from '../App.jsx';

const RARITY_COLOR = { 1:'#6b7280', 2:'#0369a1', 3:'#b45309', 4:'#dc2626' };

const cache = new Map();
async function fetchCached(userId, start, end) {
  const key = `${userId}:${start}:${end}`;
  if (cache.has(key)) return cache.get(key);
  const p = fetchObservations(userId, start, end);
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  return p;
}

export default function Compare({ state }) {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const { me, buddies, period, mode, start: customStart, end: customEnd, demo } = state;

  const fetchFn = demo
    ? (userId) => fetchObservationsDemo(userId)
    : (userId, start, end) => fetchCached(userId, start, end);

  const range = useMemo(() => resolvePeriod(period, customStart, customEnd), [period, customStart, customEnd]);
  const historyRange = useMemo(() => historyRangeForMode(mode, range.start, range.end), [mode, range.start, range.end]);

  const [myData,     setMyData]     = useState(null);
  const [buddyData,  setBuddyData]  = useState({});
  const [fetching,   setFetching]   = useState(true);
  const [fatalError, setFatalError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setFetching(true); setFatalError(null);
    (async () => {
      try {
        const [meResult, ...buddyResults] = await Promise.all([
          fetchFn(me, historyRange.start, historyRange.end).catch(err => { throw err; }),
          ...buddies.map(id =>
            fetchFn(id, range.start, range.end)
              .then(data => ({ id, data }))
              .catch(err  => ({ id, error: err.message, needsToken: err.needsToken }))
          ),
        ]);
        if (cancelled) return;
        setMyData(meResult);
        const next = {};
        for (const r of buddyResults) next[r.id] = r.error ? { error: r.error } : r.data;
        setBuddyData(next);
      } catch (err) {
        if (!cancelled) setFatalError({ message: err.message, needsToken: err.needsToken });
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [me, buddies.join(','), historyRange.start, historyRange.end, range.start, range.end]);

  const results = useMemo(() => {
    if (!myData) return {};
    const out = {};
    for (const id of buddies) {
      const bd = buddyData[id];
      if (!bd || bd.error) continue;
      out[id] = compare({ meObs: myData.observations, buddyObs: bd.observations,
        start: range.start, end: range.end, mode,
        buddyName: bd.user?.name || `#${id}` });
    }
    return out;
  }, [myData, buddyData, buddies.join(','), range.start, range.end, mode]);

  const update = (patch) => navigate(`/${stateToQueryString({ ...state, ...patch })}`, { replace: false });

  if (fatalError) {
    return (
      <div className="bbb-centered-card bbb-fade">
        <h2 className="bbb-page-title">{fatalError.needsToken ? t.connectionNeeded : t.cantLoad}</h2>
        <div className="bbb-alert error" style={{ marginTop: 16 }}>{fatalError.message}</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {fatalError.needsToken && <Link to="/?page=settings" className="bbb-link">{t.setupConnection}</Link>}
          <Link to="/" className="bbb-link">{t.editProfilesLink}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bbb-fade">
      {demo && (
        <div className="bbb-alert" style={{ marginBottom: 0, borderRadius: 0, margin: '0 -20px', borderLeft: 'none', borderRight: 'none' }}>
          {lang === 'nl'
            ? <>🔍 <b>Demomodus</b> — voorbeelddata, geen echte waarnemingen. <a href="/?page=settings" className="bbb-link">Verbind je account</a> voor echte data.</>
            : <>🔍 <b>Demo mode</b> — sample data, not real observations. <a href="/?page=settings" className="bbb-link">Connect your account</a> for real data.</>}
        </div>
      )}
      {/* Toolbar */}
      <div className="bbb-toolbar">
        <button className="bbb-back-btn" onClick={() => navigate('/')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t.editProfiles}
        </button>
        <div className="bbb-toolbar-controls">
          <div className="bbb-control-group">
            {t.periods.map(p => (
              <button key={p.id} className={`bbb-chip ${period === p.id ? 'active' : ''}`}
                onClick={() => update({ period: p.id })}>{p.label}</button>
            ))}
          </div>
          <div className="bbb-toolbar-divider" />
          <div className="bbb-control-group">
            {t.modes.map(m => (
              <button key={m.id} className={`bbb-chip ${mode === m.id ? 'active' : ''}`}
                onClick={() => update({ mode: m.id })}>{m.label}</button>
            ))}
          </div>
        </div>
      </div>

      {period === 'custom' && (
        <div className="bbb-custom-range">
          <span className="bbb-label" style={{ marginBottom: 0 }}>{t.from}</span>
          <input type="date" className="bbb-date-input"
            value={customStart || ''} onChange={e => update({ start: e.target.value })} />
          <span className="bbb-label" style={{ marginBottom: 0 }}>{t.to}</span>
          <input type="date" className="bbb-date-input"
            value={customEnd || ''} onChange={e => update({ end: e.target.value })} />
        </div>
      )}

      <div className="bbb-you-row">
        <div className="bbb-you-pill">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="2.5" stroke="#1a6eb5" strokeWidth="1.5"/>
            <path d="M2 12c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="#1a6eb5" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{t.comparingAs}</span>
          <strong>{myData?.user?.name || `#${me}`}</strong>
        </div>
        <span className="bbb-range-badge">{range.start} — {range.end}</span>
      </div>

      {fetching && !myData && <div className="bbb-loading">{t.running}</div>}

      {myData && (
        <div className="bbb-grid" style={{ '--grid-cols': Math.min(buddies.length, 4) }}>
          {buddies.map(id => (
            <BuddyCard key={id} id={id}
              buddyEntry={buddyData[id]} result={results[id]}
              loading={fetching && !buddyData[id]}
              lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function BuddyCard({ id, buddyEntry, result, loading, lang, t }) {
  const [expanded, setExpanded] = useState(false);
  const name = buddyEntry?.user?.name || `#${id}`;

  return (
    <div className="bbb-col">
      <div className="bbb-col-head">
        <div className="bbb-col-avatar">{name.slice(0,1).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="bbb-col-name" title={name}>{name}</div>
          <a href={`https://waarneming.nl/users/${id}/`} target="_blank" rel="noopener noreferrer"
            className="bbb-col-link">#{id} ↗</a>
        </div>
        {result && (
          <div className="bbb-col-count">
            <span className="bbb-col-count-n">{result.total}</span>
            <span className="bbb-col-count-l">{t.species}</span>
          </div>
        )}
      </div>

      {buddyEntry?.error && (
        <div className="bbb-alert error" style={{ margin: 12, fontSize: 12 }}>{buddyEntry.error}</div>
      )}

      {loading && (
        <div className="bbb-skeleton-wrap">
          {[80,60,70,50].map((w,i) => (
            <div key={i} className="bbb-skeleton" style={{ width:`${w}%`, animationDelay:`${i*80}ms` }} />
          ))}
        </div>
      )}

      {result?.highlights.length > 0 && (
        <div className="bbb-col-highlights">
          <div className="bbb-col-hl-header">
            <span className="bbb-col-hl-title">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
                <path d="M6 1l1.5 3h3l-2.4 1.8.9 3L6 7l-3 1.8.9-3L1.5 4h3z" fill="#b45309"/>
              </svg>
              {t.rarities}
            </span>
            <span className="bbb-col-hl-count">{result.highlights.length}</span>
          </div>
          {result.highlights.map(s => (
            <div key={s.speciesId} className="bbb-col-hl-row">
              <div style={{ minWidth: 0 }}>
                <div className="bbb-col-hl-name">{lang === 'nl' ? s.nl : (s.en || s.nl)}</div>
                <div className="bbb-col-hl-sub">{lang === 'nl' ? (s.en || '') : s.nl}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                <RarityTag rarity={s.rarity} label={t.rarity[s.rarity]} />
                <span className="bbb-col-hl-date">{formatDate(s.lastDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {result?.regular.length > 0 && (
        <div className="bbb-col-list">
          {(expanded ? result.regular : result.regular.slice(0,10)).map(s => (
            <div key={s.speciesId} className="bbb-col-row">
              <span className="bbb-col-row-name">
                {lang === 'nl' ? s.nl : (s.en || s.nl)}
                <span className="bbb-col-row-sub">{lang === 'nl' ? (s.en || '') : s.nl}</span>
              </span>
              <span className="bbb-col-row-date">{formatDate(s.lastDate)}</span>
            </div>
          ))}
          {result.regular.length > 10 && (
            <button className="bbb-show-more" onClick={() => setExpanded(e => !e)}>
              {expanded ? t.showLess : t.showMore(result.regular.length - 10)}
            </button>
          )}
        </div>
      )}

      {result?.total === 0 && (
        <div className="bbb-col-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#d1d5db" strokeWidth="1.5"/>
            <path d="M8 12h8" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{t.nothingThisPeriod}</span>
        </div>
      )}
    </div>
  );
}

function RarityTag({ rarity, label }) {
  const color = RARITY_COLOR[rarity] || '#6b7280';
  return (
    <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase',
      color, background: color+'18', padding:'2px 6px', borderRadius:3 }}>
      {label}
    </span>
  );
}
