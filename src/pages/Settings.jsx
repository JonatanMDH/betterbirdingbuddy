import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken, saveToken, clearToken } from '../lib/auth.js';
import { useT } from '../App.jsx';

export default function Settings({ onTokenSaved }) {
  const t = useT();
  const [input,   setInput]   = useState('');
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState('');
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const tok = getToken();
    setCurrent(tok);
    if (tok) setInput(tok);
  }, []);

  const test = async (tok) => {
    setStatus('testing'); setMessage('');
    try {
      const res = await fetch('/api/fetch?userId=57388&start=2026-01-01&end=2026-04-17',
        { headers: { 'X-Wnmg-Token': tok } });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMessage(`✓ ${data.observations?.length ?? 0} observations found.`);
        return true;
      }
      setStatus('error'); setMessage(data.error || `Error ${res.status}`); return false;
    } catch (err) {
      setStatus('error'); setMessage(err.message); return false;
    }
  };

  const save = async () => {
    const tok = input.trim();
    if (!tok) return;
    const ok = await test(tok);
    if (ok) { saveToken(tok); setCurrent(tok); onTokenSaved?.(); }
  };

  const clear = () => { clearToken(); setCurrent(null); setInput(''); setStatus(null); };

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
        <div className="bbb-settings-card-title">{t.howTitle}</div>
        <div className="bbb-settings-card-sub">{t.howSub}</div>
        {t.steps.map((s, i) => (
          <div key={i} className="bbb-step">
            <span className="bbb-step-n">{String(i+1).padStart(2,'0')}</span>
            <div>
              <div className="bbb-step-title">{s.title}</div>
              <div className="bbb-step-body">{s.body}</div>
            </div>
          </div>
        ))}
        <div className="bbb-alert" style={{ marginTop: 16, marginBottom: 0 }}>{t.tokenLifetime}</div>
      </div>

      <div className="bbb-settings-card">
        <div className="bbb-settings-card-title">{t.yourToken}</div>
        <label className="bbb-label" style={{ marginTop: 12 }}>{t.pasteToken}</label>
        <textarea className="bbb-input" rows={3}
          placeholder="ytkMcLFipdfqbgPqty1vl5jvxGyLr6…"
          value={input}
          onChange={e => { setInput(e.target.value); setStatus(null); }} />

        {status === 'testing' && (
          <div className="bbb-loading" style={{ padding:'12px 0', textAlign:'left' }}>
            {t.testingConnection}
          </div>
        )}
        {status === 'ok'    && <div className="bbb-alert success" style={{ marginTop:10 }}>{message}</div>}
        {status === 'error' && <div className="bbb-alert error"   style={{ marginTop:10 }}>{message}</div>}

        <div className="bbb-token-actions">
          <button className="bbb-btn-primary"
            onClick={save} disabled={!input.trim() || status === 'testing'}>
            {status === 'testing' ? t.testingConnection : t.saveAndTest}
          </button>
          {current && (
            <button className="bbb-btn-danger" onClick={clear}>{t.removeToken}</button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/" className="bbb-link">{t.backHome}</Link>
      </div>
    </div>
  );
}
