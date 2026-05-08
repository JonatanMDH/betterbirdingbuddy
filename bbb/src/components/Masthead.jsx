import React from 'react';

export default function Masthead({ lang, onToggleLang }) {
  return (
    <>
      <header className="bbb-masthead">
        <div className="bbb-masthead-left">
          <BirdIcon />
          <span className="bbb-logo-text">Better Birding <span>Buddy</span></span>
        </div>
        <button className="bbb-lang-toggle" onClick={onToggleLang}>
          <span className={lang === 'nl' ? 'bbb-lang-active' : 'bbb-lang-inactive'}>NL</span>
          <span className="bbb-lang-sep">|</span>
          <span className={lang === 'en' ? 'bbb-lang-active' : 'bbb-lang-inactive'}>EN</span>
        </button>
      </header>
      <div className="bbb-subrule" />
    </>
  );
}

function BirdIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="14" fill="#1a6eb5"/>
      <path d="M6 16 Q9 10 14 11 Q19 12 22 8 Q20 13 17 14 Q20 15 19 17 Q16 18 13 17 Q10 19 8 20 Z" fill="white"/>
      <circle cx="20.5" cy="9" r="1" fill="#1a6eb5"/>
    </svg>
  );
}
