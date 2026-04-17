import React from 'react';
import { Link } from 'react-router-dom';

export default function Masthead({ tokenOk }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <header className="bbb-masthead">
        <Link to="/" className="bbb-masthead-left">
          <div className="bbb-logo"><Feather size={48} /></div>
          <div>
            <h1 className="bbb-title">Better Birding <b>Buddy</b></h1>
            <div className="bbb-tagline">Waarneming.nl · Comparative field reports</div>
          </div>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: 8, flexShrink: 0 }}>
          <div className="bbb-masthead-right">{dateStr}</div>
          <Link to="/?page=settings" style={{ display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: tokenOk ? 'var(--moss-deep)' : 'var(--rust)',
            textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 1 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%',
              background: tokenOk ? 'var(--moss)' : 'var(--rust)',
              display: 'inline-block', flexShrink: 0 }} />
            {tokenOk ? 'Connected' : 'Setup required'}
          </Link>
        </div>
      </header>
      <div className="bbb-subrule" />
    </>
  );
}

function Feather({ size = 48 }) {
  return (
    <svg viewBox="0 0 64 120" width={size} height={size * 120 / 64} aria-hidden="true">
      <path d="M32 6 Q14 30 14 64 Q14 88 24 108 Q28 114 32 116 Q36 114 40 108 Q50 88 50 64 Q50 30 32 6 Z"
            fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 12 L32 116" fill="none" stroke="currentColor" strokeWidth="1" />
      {[20, 30, 40, 50, 60, 70, 80, 92].map((y, i) => (
        <g key={i}>
          <path d={`M32 ${y} Q20 ${y + (5 - i * 0.3)} 18 ${y + 10}`}
                fill="none" stroke="currentColor" strokeWidth="0.8" />
          <path d={`M32 ${y} Q44 ${y + (5 - i * 0.3)} 46 ${y + 10}`}
                fill="none" stroke="currentColor" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}
