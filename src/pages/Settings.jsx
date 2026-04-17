import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken, saveToken, clearToken, hasToken } from '../lib/auth.js';

export default function Settings({ onTokenSaved }) {
  const [input,   setInput]   = useState('');
  const [status,  setStatus]  = useState(null);  // null | 'testing' | 'ok' | 'error'
  const [message, setMessage] = useState('');
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const t = getToken();
    setCurrent(t);
    if (t) setInput(t);
  }, []);

  const test = async (tokenToTest) => {
    setStatus('testing');
    setMessage('');
    try {
      const res = await fetch(`/api/fetch?userId=57388&start=2026-04-10&end=2026-04-17`, {
        headers: { 'X-Wnmg-Token': tokenToTest },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMessage(`Connected! Found ${data.observations?.length ?? 0} bird observations for the test user.`);
        return true;
      } else {
        setStatus('error');
        setMessage(data.error || `Returned ${res.status}. Double-check your token.`);
        return false;
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Connection failed: ${err.message}`);
      return false;
    }
  };

  const save = async () => {
    const token = input.trim();
    if (!token) return;
    const ok = await test(token);
    if (ok) {
      saveToken(token);
      setCurrent(token);
      onTokenSaved?.();
    }
  };

  const clear = () => {
    clearToken();
    setCurrent(null);
    setInput('');
    setStatus(null);
    setMessage('');
  };

  return (
    <div className="bbb-fade" style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 className="bbb-page-title">Connect to Waarneming.nl</h2>
      <p className="bbb-page-lede" style={{ marginTop: 8 }}>
        One-time setup. Your token is saved in your browser and never leaves your device.
      </p>

      {current && (
        <div className="bbb-alert success" style={{ marginTop: 20 }}>
          ✓ Token saved. You're connected — <Link to="/" className="bbb-link">go compare birds</Link>.
        </div>
      )}

      {/* How to get the token */}
      <div className="bbb-card" style={{ marginTop: 28 }}>
        <div className="bbb-card-title">How to get your token</div>
        <div className="bbb-card-sub">Takes about 30 seconds</div>

        <div style={{ display: 'grid', gap: 0 }}>
          {[
            {
              n: '01',
              title: 'Log into waarneming.nl',
              body: <>Open <a href="https://waarneming.nl" target="_blank" rel="noopener noreferrer" className="bbb-link">waarneming.nl</a> in your browser and make sure you're logged in.</>,
            },
            {
              n: '02',
              title: 'Open developer tools',
              body: <>Press <Kbd>F12</Kbd> (or right-click anywhere → Inspect). Click the <b>Network</b> tab at the top.</>,
            },
            {
              n: '03',
              title: 'Refresh the page',
              body: <>Press <Kbd>F5</Kbd> to reload waarneming.nl while the Network tab is open. You'll see a list of requests appear.</>,
            },
            {
              n: '04',
              title: 'Find an API request',
              body: <>In the filter box at the top of the Network tab, type <Kbd>api/v1</Kbd>. Click any request that appears. Look for one called <b>observations</b> or <b>species</b>.</>,
            },
            {
              n: '05',
              title: 'Copy your token',
              body: <>On the right side, click the <b>Headers</b> tab. Scroll down to <b>Request Headers</b>. Find the line that says <b>Authorization: Bearer …</b>. Copy everything <i>after</i> the word Bearer and the space — that long string is your token.</>,
            },
            {
              n: '06',
              title: 'Paste it below',
              body: <>Paste the token in the field below and click <b>Save & test</b>.</>,
            },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ display: 'flex', gap: 16, padding: '14px 0',
              borderBottom: '1px dotted rgba(28,26,23,0.15)' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                color: 'var(--ochre)', letterSpacing: '0.1em', paddingTop: 3,
                minWidth: 24, flexShrink: 0 }}>{n}</div>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600,
                  fontSize: 14, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bbb-alert" style={{ marginTop: 20 }}>
          <b>Token lifetime:</b> Waarneming.nl tokens expire after about 10 hours. When comparisons stop working, just repeat steps 3–6 to get a fresh token. You don't need to do steps 1–2 again.
        </div>
      </div>

      {/* Token input */}
      <div className="bbb-card" style={{ marginTop: 16 }}>
        <div className="bbb-card-title">Your token</div>
        <div className="bbb-field" style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--ink-soft)', marginBottom: 8 }}>
            Paste token here
          </label>
          <textarea
            className="bbb-input"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12, lineHeight: 1.5 }}
            placeholder="ytkMcLFipdfqbgPqty1vl5jvxGyLr6…"
            value={input}
            onChange={(e) => { setInput(e.target.value); setStatus(null); }}
          />
        </div>

        {status === 'testing' && (
          <div className="bbb-loading" style={{ padding: '12px 0', textAlign: 'left',
            fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: 'var(--ink-soft)' }}>
            Testing connection
          </div>
        )}
        {status === 'ok' && (
          <div className="bbb-alert success">{message}</div>
        )}
        {status === 'error' && (
          <div className="bbb-alert error">{message}</div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="bbb-submit" style={{ flex: 1, minWidth: 140 }}
            onClick={save} disabled={!input.trim() || status === 'testing'}>
            {status === 'testing' ? 'Testing…' : 'Save & test →'}
          </button>
          {current && (
            <button className="bbb-submit" onClick={clear}
              style={{ flex: '0 0 auto', background: 'transparent', color: 'var(--rust)',
                border: '1px solid var(--rust)', padding: '14px 20px' }}>
              Remove token
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link to="/" className="bbb-link">← Back to home</Link>
      </div>
    </div>
  );
}

function Kbd({ children }) {
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
      background: 'var(--paper-3)', border: '1px solid var(--line)',
      borderRadius: 3, padding: '1px 5px', color: 'var(--ink)' }}>
      {children}
    </span>
  );
}
