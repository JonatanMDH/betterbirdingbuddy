import React, { useState, useRef } from 'react';
import { useLang } from '../App.jsx';
import { parseWaarnemingCSV } from '../lib/csv.js';

const UI = {
  nl: {
    eyebrow:   'Waarneming.nl · Vogelwaarneming vergelijker',
    title:     'Vergelijk makkelijk de waarnemingen van jou en je vrienden!',
    sub:       'Upload je Waarneming.nl CSV-export en die van maximaal vier vrienden. Vergelijk wie welke soorten zag — zeldzame vondsten bovenaan.',
    howTitle:  'Hoe exporteer je jouw CSV?',
    steps: [
      'Log in op waarneming.nl',
      'Ga naar Mijn Waarnemingen',
      'Filter op soortgroep Vogels',
      'Scroll naar de onderkant van de pagina en klik op Exporteer als CSV',
      'Upload het gedownloade bestand hieronder',
    ],
    yourFile:     'Jouw waarnemingen',
    yourName:     'Jouw naam (optioneel)',
    yourNamePh:   'Bijv. Jonatan',
    buddyName:    'Naam (optioneel)',
    buddyNamePh:  'Bijv. Lars',
    buddyFile:    (n) => `Vriend ${n}`,
    accepted:     (name, n) => `✓ ${name} · ${n} waarnemingen`,
    wrongType:    'Gebruik een .csv bestand van Waarneming.nl',
    compareBtn:   'Vergelijk nu',
    needMe:       'Upload eerst jouw eigen CSV.',
    needBuddy:    'Upload minimaal één CSV van een vriend.',
    clearAll:     'Opnieuw beginnen',
  },
  en: {
    eyebrow:   'Waarneming.nl · Bird observation comparison',
    title:     'Easily compare your observations with your friends!',
    sub:       'Upload your Waarneming.nl CSV export and those of up to four friends. Compare who saw which species — rare finds on top.',
    howTitle:  'How to export your CSV',
    steps: [
      'Log in to waarneming.nl',
      'Go to My Observations',
      'Filter by species group Birds',
      'Scroll to the bottom of the page and click Export as CSV',
      'Upload the downloaded file below',
    ],
    yourFile:     'Your observations',
    yourName:     'Your name (optional)',
    yourNamePh:   'E.g. Jonatan',
    buddyName:    'Name (optional)',
    buddyNamePh:  'E.g. Lars',
    buddyFile:    (n) => `Friend ${n}`,
    accepted:     (name, n) => `✓ ${name} · ${n} observations`,
    wrongType:    'Please use a .csv file from Waarneming.nl',
    compareBtn:   'Compare now',
    needMe:       'Please upload your own CSV first.',
    needBuddy:    'Upload at least one friend\'s CSV.',
    clearAll:     'Start over',
  },
};

export default function Home({ onSubmit }) {
  const lang = useLang();
  const t = UI[lang];

  const [myData,      setMyData]      = useState(null);
  const [myName,      setMyName]      = useState('');
  const [buddyData,   setBuddyData]   = useState([null, null, null, null]);
  const [buddyNames,  setBuddyNames]  = useState(['', '', '', '']);
  const [error,       setError]       = useState(null);

  const handleFile = async (file, slot) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) { setError(t.wrongType); return; }
    const text = await file.text();
    const parsed = parseWaarnemingCSV(text, file.name);
    if (slot === 'me') {
      setMyData(parsed);
    } else {
      const next = [...buddyData];
      next[slot] = parsed;
      setBuddyData(next);
    }
  };

  const clear = () => {
    setMyData(null); setMyName('');
    setBuddyData([null,null,null,null]); setBuddyNames(['','','','']);
    setError(null);
  };

  const submit = () => {
    if (!myData)                  { setError(t.needMe);    return; }
    if (!buddyData.some(Boolean)) { setError(t.needBuddy); return; }

    // Apply custom names if provided
    const me = myName.trim()
      ? { ...myData, name: myName.trim() }
      : myData;

    const buddies = buddyData
      .map((d, i) => {
        if (!d) return null;
        const n = buddyNames[i].trim();
        return n ? { ...d, name: n } : d;
      })
      .filter(Boolean);

    onSubmit({ me, buddies });
  };

  const anyUploaded = myData || buddyData.some(Boolean);

  return (
    <div className="bbb-home bbb-fade">
      {/* Hero */}
      <div className="bbb-hero">
        <div className="bbb-hero-eyebrow">{t.eyebrow}</div>
        <h1 className="bbb-hero-title">{t.title}</h1>
        <p className="bbb-hero-sub">{t.sub}</p>

        <div className="bbb-howto">
          <div className="bbb-howto-title">{t.howTitle}</div>
          <ol className="bbb-howto-list">
            {t.steps.map((s, i) => (
              <li key={i}><span className="bbb-step-n">{String(i+1).padStart(2,'0')}</span>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Upload grid */}
      <div className="bbb-upload-area">
        {/* Me */}
        <div className="bbb-upload-section">
          <div className="bbb-upload-label">{t.yourFile}</div>
          <DropZone
            label={lang === 'nl' ? 'Upload jouw CSV-export' : 'Upload your CSV export'}
            accepted={myData ? t.accepted(myName.trim() || myData.name, myData.observations.length) : null}
            onFile={f => handleFile(f, 'me')}
            onClear={() => { setMyData(null); setMyName(''); }}
            isMe
          />
          {myData && (
            <input
              className="bbb-name-input"
              placeholder={t.yourNamePh}
              value={myName}
              onChange={e => setMyName(e.target.value)}
            />
          )}
        </div>

        {/* Buddies */}
        <div className="bbb-upload-section">
          <div className="bbb-upload-label">
            {lang === 'nl' ? 'Vogelmaatjes' : 'Birding buddies'}
            <span className="bbb-upload-label-hint">{lang === 'nl' ? ' (max. 4)' : ' (up to 4)'}</span>
          </div>
          <div className="bbb-buddies-grid">
            {[0,1,2,3].map(i => (
              <div key={i} className="bbb-buddy-slot">
                <DropZone
                  label={t.buddyFile(i + 1)}
                  accepted={buddyData[i]
                    ? t.accepted(buddyNames[i].trim() || buddyData[i].name, buddyData[i].observations.length)
                    : null}
                  onFile={f => handleFile(f, i)}
                  onClear={() => {
                    const nd = [...buddyData]; nd[i] = null; setBuddyData(nd);
                    const nn = [...buddyNames]; nn[i] = ''; setBuddyNames(nn);
                  }}
                />
                {buddyData[i] && (
                  <input
                    className="bbb-name-input"
                    placeholder={t.buddyNamePh}
                    value={buddyNames[i]}
                    onChange={e => {
                      const n = [...buddyNames]; n[i] = e.target.value; setBuddyNames(n);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bbb-upload-actions">
          {error && <div className="bbb-error">{error}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
            {anyUploaded && (
              <button className="bbb-btn-secondary" onClick={clear}>{t.clearAll}</button>
            )}
            <button className="bbb-btn-primary" onClick={submit}
              disabled={!myData || !buddyData.some(Boolean)}>
              {t.compareBtn}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft:6 }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZone({ label, accepted, onFile, onClear, isMe }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`bbb-dropzone ${accepted?'accepted':''} ${dragging?'dragging':''} ${isMe?'is-me':''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !accepted && ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".csv" style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f); e.target.value=''; }} />

      {accepted ? (
        <div className="bbb-dropzone-accepted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
            <circle cx="8" cy="8" r="7" fill="#22c55e"/>
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{accepted}</span>
          <button className="bbb-dropzone-clear"
            onClick={e => { e.stopPropagation(); onClear(); }} title="Verwijderen">×</button>
        </div>
      ) : (
        <div className="bbb-dropzone-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V3m0 0L8 7m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="bbb-dropzone-name">{label}</span>
          <span className="bbb-dropzone-hint">.csv</span>
        </div>
      )}
    </div>
  );
}
