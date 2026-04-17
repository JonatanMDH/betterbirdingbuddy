import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseIdFromInput, stateToQueryString } from '../lib/urlParams.js';

export default function Home({ state }) {
  const navigate = useNavigate();

  // Pre-fill from URL if the user navigated back to "/" to edit
  const [myInput, setMyInput] = useState(state?.me || '');
  const [buddies, setBuddies] = useState(() => {
    const filled = (state?.buddies || []).map(id => ({ input: id }));
    while (filled.length < 4) filled.push({ input: '' });
    return filled;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setMyInput(state?.me || '');
    const filled = (state?.buddies || []).map(id => ({ input: id }));
    while (filled.length < 4) filled.push({ input: '' });
    setBuddies(filled);
  }, [state?.me, state?.buddies?.join(',')]);

  const updateBuddy = (i, val) => {
    setBuddies(prev => prev.map((b, idx) => idx === i ? { input: val } : b));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const meId = parseIdFromInput(myInput);
    if (!meId) {
      setError('Please enter a valid waarneming.nl profile URL or user ID for yourself.');
      return;
    }

    const buddyIds = buddies
      .map(b => parseIdFromInput(b.input))
      .filter(Boolean);

    if (buddyIds.length === 0) {
      setError('Add at least one birding buddy.');
      return;
    }

    const qs = stateToQueryString({
      me: meId,
      buddies: buddyIds,
      period: state?.period || 'last-7',
      mode: state?.mode || 'they-not-me',
    });
    navigate(`/${qs}`);
  };

  return (
    <div className="bbb-setup bbb-fade">
      <div>
        <p className="bbb-page-lede">
          Paste in your Waarneming.nl profile URL and up to <b>four birding friends'</b> profiles.
          Get a side-by-side comparison of what they've spotted — with <b>rare and very rare</b>
          finds flagged at the top.
        </p>

        <div className="bbb-how">
          <div className="bbb-how-title">How it works</div>
          <ol>
            <li>Paste your profile URL and up to four friends' profiles.</li>
            <li>The URL in your browser bar becomes a shareable link — send it to anyone.</li>
            <li>Pick a time period and comparison mode; results update instantly.</li>
            <li>Rare sightings appear at the top of each buddy's column.</li>
          </ol>
        </div>

        <div className="bbb-alert" style={{ marginTop: 28 }}>
          <b>Privacy:</b> Only <i>publicly visible</i> observations are read. If a profile has
          been set to private or an observation is under embargo, it won't appear.
        </div>
      </div>

      <form className="bbb-card" onSubmit={onSubmit}>
        <div className="bbb-card-title">Compare</div>
        <div className="bbb-card-sub">Enter profiles</div>

        <div className="bbb-field">
          <label>Your Waarneming.nl profile</label>
          <input
            className="bbb-input"
            placeholder="https://waarneming.nl/users/57388/"
            required
            value={myInput}
            onChange={(e) => setMyInput(e.target.value)}
          />
        </div>

        <div className="bbb-field" style={{ marginTop: 24 }}>
          <label>Birding buddies (up to 4)</label>
        </div>

        {buddies.map((b, i) => (
          <div key={i} className="bbb-field">
            <input
              className="bbb-input"
              placeholder={`Buddy ${i + 1} — URL or user ID`}
              value={b.input}
              onChange={(e) => updateBuddy(i, e.target.value)}
            />
          </div>
        ))}

        {error && <div className="bbb-alert error">{error}</div>}

        <button className="bbb-submit" type="submit">
          Compare →
        </button>
      </form>
    </div>
  );
}
