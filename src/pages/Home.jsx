import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseIdFromInput, stateToQueryString } from '../lib/urlParams.js';
import { useT } from '../App.jsx';

export default function Home({ state }) {
  const t = useT();
  const navigate = useNavigate();
  const [myInput, setMyInput] = useState(state?.me || '');
  const [buddies, setBuddies] = useState(() => {
    const filled = (state?.buddies || []).map(id => id);
    while (filled.length < 4) filled.push('');
    return filled;
  });
  const [error, setError] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const meId = parseIdFromInput(myInput);
    if (!meId) { setError(t.errNoMe); return; }
    const buddyIds = buddies.map(b => parseIdFromInput(b)).filter(Boolean);
    if (!buddyIds.length) { setError(t.errNoBuddies); return; }
    const qs = stateToQueryString({ me: meId, buddies: buddyIds, period: 'last-7', mode: 'they-not-me' });
    navigate(`/${qs}`);
  };

  return (
    <div className="bbb-setup bbb-fade">
      <div className="bbb-hero">
        <div className="bbb-hero-eyebrow">{t.eyebrow}</div>
        <h1 className="bbb-hero-title">
          {t.heroTitle1} <em>{t.heroTitleEm}</em> {t.heroTitle2}
        </h1>
        <p className="bbb-hero-sub">{t.heroSub}</p>
        <div className="bbb-hero-stats">
          {[['5', t.statModes], ['4', t.statBuddies], ['6', t.statPeriods]].map(([n, l]) => (
            <div key={l} className="bbb-stat">
              <span className="bbb-stat-n">{n}</span>
              <span className="bbb-stat-l">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bbb-form-card">
        <form onSubmit={onSubmit}>
          <div className="bbb-form-grid">
            <div className="bbb-form-col">
              <label className="bbb-label">{t.yourProfile}</label>
              <input className="bbb-input" required value={myInput}
                onChange={e => setMyInput(e.target.value)}
                placeholder="waarneming.nl/users/57388/" />
            </div>
            <div className="bbb-form-col">
              <label className="bbb-label">
                {t.buddies} <span style={{ color: '#9ca3af', fontWeight: 400 }}>{t.buddiesHint}</span>
              </label>
              <div className="bbb-buddies-grid">
                {buddies.map((v, i) => (
                  <input key={i} className="bbb-input" value={v}
                    onChange={e => { const n=[...buddies]; n[i]=e.target.value; setBuddies(n); }}
                    placeholder={t.buddyPlaceholder(i)} />
                ))}
              </div>
            </div>
          </div>
          {error && <div className="bbb-error">{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="bbb-btn-primary" type="submit">
              {t.compareBtn}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 6 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
