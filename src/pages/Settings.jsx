import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSession, getCsrf, saveCredentials, clearSession } from '../lib/auth.js';
import { useT, useLang } from '../App.jsx';

export default function Settings({ onTokenSaved }) {
  const t = useT();
  const lang = useLang();
  const [sessionInput, setSessionInput] = useState('');
  const [csrfInput,    setCsrfInput]    = useState('');
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState('');
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const s = getSession();
    const c = getCsrf();
    setCurrent(s);
    if (s) setSessionInput(s);
    if (c) setCsrfInput(c);
  }, []);

  const test = async (s, c) => {
    setStatus('testing'); setMessage('');
    try {
      const headers = {};
      if (s) headers['X-Wnmg-Session'] = s;
      if (c) headers['X-Wnmg-Csrf']    = c;
      const res = await fetch('/api/fetch?userId=57388&start=2026-01-01&end=2026-04-17', { headers });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMessage(lang === 'nl'
          ? `✓ Verbonden! ${data.observations?.length ?? 0} waarnemingen gevonden.`
          : `✓ Connected! Found ${data.observations?.length ?? 0} observations.`);
        return true;
      }
      setStatus('error'); setMessage(data.error || `Fout ${res.status}`); return false;
    } catch (err) {
      setStatus('error'); setMessage(err.message); return false;
    }
  };

  const save = async () => {
    const s = sessionInput.trim();
    if (!s) return;
    const ok = await test(s, csrfInput.trim());
    if (ok) { saveCredentials(s, csrfInput.trim()); setCurrent(s); onTokenSaved?.(); }
  };

  const clear = () => { clearSession(); setCurrent(null); setSessionInput(''); setCsrfInput(''); setStatus(null); };

  const steps = lang === 'nl' ? [
    { n:'01', title:'Log in op waarneming.nl',        body: <>Open <a href="https://waarneming.nl" target="_blank" rel="noopener noreferrer" className="bbb-link">waarneming.nl</a> in je browser en zorg dat je bent ingelogd.</> },
    { n:'02', title:'Open de ontwikkelaarstools',      body: <>Druk op <span className="bbb-kbd">F12</span>. Klik op het tabblad <b>Application</b> (of <b>Toepassing</b>).</> },
    { n:'03', title:'Zoek de cookies op',              body: <>Klik links in de boomstructuur op <b>Cookies</b> → <b>https://waarneming.nl</b>.</> },
    { n:'04', title:'Kopieer de sessiewaarde',         body: <>Zoek de rij met de naam <b>sessionid</b>. Dubbelklik op de waarde in de rechterkolom en kopieer deze.</> },
    { n:'05', title:'Plak het hieronder',              body: <>Plak de waarde in het veld hieronder en klik op <b>Opslaan &amp; testen</b>.</> },
  ] : [
    { n:'01', title:'Log into waarneming.nl',          body: <>Open <a href="https://waarneming.nl" target="_blank" rel="noopener noreferrer" className="bbb-link">waarneming.nl</a> and make sure you're logged in.</> },
    { n:'02', title:'Open developer tools',            body: <>Press <span className="bbb-kbd">F12</span>. Click the <b>Application</b> tab.</> },
    { n:'03', title:'Find the cookies',                body: <>In the left-hand tree, click <b>Cookies</b> → <b>https://waarneming.nl</b>.</> },
    { n:'04', title:'Copy the session value',          body: <>Find the row named <b>sessionid</b>. Double-click its value in the right column and copy it.</> },
    { n:'05', title:'Paste it below',                  body: <>Paste the value in the field below and click <b>Save &amp; test</b>.</> },
  ];

  return (
    <div className="bbb-settings bbb-fade">
      <h2 className="bbb-page-title">{t.setupTitle}</h2>
      <p className="bbb-page-lede">{t.setupSub}</p>

      {current && (
        <div className="bbb-alert success">
          {t.tokenSaved} <Link to="/" className="bbb-link">{t.goCompare}</Link>.
        </div>
      )}

      <div className="bbb-settings-card">
        <div className="bbb-settings-card-title">
          {lang === 'nl' ? 'Hoe je je sessie-ID vindt' : 'How to find your session ID'}
        </div>
        <div className="bbb-settings-card-sub">
          {lang === 'nl' ? 'Duurt minder dan een minuut — geen netwerktabblad nodig' : 'Less than a minute — no network tab needed'}
        </div>
        {steps.map(s => (
          <div key={s.n} className="bbb-step">
            <span className="bbb-step-n">{s.n}</span>
            <div>
              <div className="bbb-step-title">{s.title}</div>
              <div className="bbb-step-body">{s.body}</div>
            </div>
          </div>
        ))}
        <div className="bbb-alert" style={{ marginTop: 16, marginBottom: 0 }}>
          {lang === 'nl'
            ? 'Sessies verlopen na enkele weken. Als de vergelijking stopt met werken, herhaal dan stap 4–5.'
            : 'Sessions last several weeks. If comparisons stop working, just repeat steps 4–5.'}
        </div>
      </div>

      <div className="bbb-settings-card">
        <div className="bbb-settings-card-title">
          {lang === 'nl' ? 'Jouw cookies' : 'Your cookies'}
        </div>

        <label className="bbb-label" style={{ marginTop: 12 }}>sessionid</label>
        <input className="bbb-input" style={{ fontFamily: 'monospace', fontSize: 13 }}
          placeholder="xya7ar3xoh8uesxyecelb3fcqe1j6ycr"
          value={sessionInput}
          onChange={e => { setSessionInput(e.target.value); setStatus(null); }} />

        <label className="bbb-label" style={{ marginTop: 12 }}>csrftoken</label>
        <input className="bbb-input" style={{ fontFamily: 'monospace', fontSize: 13 }}
          placeholder="yUry575ngngfdoI1qsWkrIgIi4ozBawR"
          value={csrfInput}
          onChange={e => { setCsrfInput(e.target.value); setStatus(null); }} />

        {status === 'testing' && <div className="bbb-loading" style={{ padding:'12px 0', textAlign:'left' }}>{lang === 'nl' ? 'Verbinding testen…' : 'Testing connection…'}</div>}
        {status === 'ok'    && <div className="bbb-alert success" style={{ marginTop:10 }}>{message}</div>}
        {status === 'error' && <div className="bbb-alert error"   style={{ marginTop:10 }}>{message}</div>}

        <div className="bbb-token-actions">
          <button className="bbb-btn-primary" onClick={save} disabled={!input.trim() || status === 'testing'}>
            {status === 'testing'
              ? (lang === 'nl' ? 'Testen…' : 'Testing…')
              : (lang === 'nl' ? 'Opslaan & testen →' : 'Save & test →')}
          </button>
          {current && (
            <button className="bbb-btn-danger" onClick={clear}>
              {lang === 'nl' ? 'Sessie verwijderen' : 'Remove session'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/" className="bbb-link">{t.backHome}</Link>
      </div>
    </div>
  );
}
